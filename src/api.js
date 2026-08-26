const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }

export async function request(path, options = {}) {
  const token = localStorage.getItem('cf_token');
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const contentType = response.headers.get('content-type') || '';
  let data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { /* plain-text API responses remain strings */ }
  }
  if (!response.ok) {
    const validationErrors = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
    const message = data?.message || validationErrors || data?.title || (typeof data === 'string' && data) || `Não foi possível concluir a operação (HTTP ${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return data;
}

export const api = {
  login: (body) => request('/api/Usuario/Login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/Usuario', { method: 'POST', body: JSON.stringify(body) }),
  list: (resource) => request(`/api/${resource}`),
  details: (resource, id = '') => request(`/api/${resource}/details${id !== '' ? `/${id}` : ''}`),
  get: (resource, id) => request(`/api/${resource}/${id}`),
  create: (resource, body) => request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (resource, body) => request(`/api/${resource}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (resource, id) => request(`/api/${resource}/${id}`, { method: 'DELETE' }),
};

export async function lookupCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
  if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
  const data = await response.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return data;
}

export const idOf = (item) => {
  const id = item?.id ?? item?.Id ?? item?.ID ?? item?.clienteId ?? item?.ClienteId ?? item?.clienteID ?? item?.ClienteID ?? item?.seguroID ?? item?.SeguroID;
  if (id !== undefined && id !== null) return id;
  for (const key of ['createdCliente', 'createdApolice', 'createdPagamento', 'data', 'cliente', 'Cliente', 'result', 'value', 'response']) {
    const nested = item?.[key];
    if (nested && typeof nested === 'object') {
      const nestedId = idOf(nested);
      if (nestedId !== undefined && nestedId !== null) return nestedId;
    }
  }
  return item?.[0] ? idOf(item[0]) : undefined;
};
export const valueOf = (item, key) => item?.[key] ?? item?.[key[0].toLowerCase() + key.slice(1)] ?? item?.[key.toLowerCase()] ?? '';
