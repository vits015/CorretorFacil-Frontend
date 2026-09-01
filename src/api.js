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

async function apoliceFileRequest(path) {
  const token = localStorage.getItem('cf_token');
  const response = await fetch(`${BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new ApiError(`Não foi possível baixar o arquivo (HTTP ${response.status}).`, response.status);
  return response;
}

async function responseData(response) {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (typeof data !== 'string') return data;
  try { return JSON.parse(data); } catch { return data; }
}

function downloadFiles(data) {
  const values = Array.isArray(data) ? data : data?.arquivos || data?.files || data?.items || data?.data || [data];
  return values.filter(Boolean).map((file, index) => {
    const url = typeof file === 'string' ? file : file.downloadUrl || file.url || file.presignedUrl || '';
    const nome = typeof file === 'string' ? decodeURIComponent(file.split('?')[0].split('/').pop() || `Arquivo ${index + 1}`) : file.nomeArquivo || file.nome || file.fileName || `Arquivo ${index + 1}`;
    return { id: typeof file === 'object' ? file.id || file.Id || file.arquivoId || file.ArquivoId || file.arquivoApoliceId || file.ArquivoApoliceId || file.idArquivo || file.IdArquivo : undefined, nome, url, caminhoArquivo: typeof file === 'object' ? file.caminhoArquivo || file.key || '' : '' };
  }).filter(file => file.url);
}

function apoliceQuery(body = {}) {
  const values = {
    Id: body.id ?? body.Id,
    ClienteID: body.clienteID ?? body.ClienteID,
    VigenciaInicio: body.vigenciaInicio ?? body.VigenciaInicio,
    VigenciaFim: body.vigenciaFim ?? body.VigenciaFim,
    SeguradoraID: body.seguradoraID ?? body.SeguradoraID,
    TipoSeguro: body.tipoSeguro ?? body.TipoSeguro,
    Produto: body.produto ?? body.Produto,
    PagamentoID: body.pagamentoID ?? body.PagamentoID,
    PremioLiquido: body.premioLiquido ?? body.PremioLiquido,
    Comissao: body.comissao ?? body.Comissao,
    LinkArquivos: body.linkArquivos ?? body.LinkArquivos ?? body.linkApolice ?? body.LinkApolice,
  };
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, value); });
  return query.toString();
}

export const api = {
  login: (body) => request('/api/Usuario/Login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/Usuario', { method: 'POST', body: JSON.stringify(body) }),
  list: (resource) => request(`/api/${resource}`),
  details: (resource, id = '') => request(`/api/${resource}/details${id !== '' ? `/${id}` : ''}`),
  get: (resource, id) => request(`/api/${resource}/${id}`),
  create: (resource, body) => resource === 'Apolice' ? request(`/api/Apolice/apolicePost?${apoliceQuery(body)}`, { method: 'POST' }) : request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (resource, body) => resource === 'Apolice' ? request(`/api/Apolice/apolicePut?${apoliceQuery(body)}`, { method: 'PUT' }) : request(`/api/${resource}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (resource, id) => request(`/api/${resource}/${id}`, { method: 'DELETE' }),
  removeApoliceFile: (id, arquivoId) => request(`/api/Apolice/${id}/arquivos/${arquivoId}`, { method: 'DELETE' }),
  async uploadApoliceFile(id, file) {
    const upload = await request(`/api/Apolice/${id}/upload-url`, { method: 'POST', body: JSON.stringify({ nomeArquivo: file.name, contentType: file.type || 'application/octet-stream' }) });
    const uploadUrl = typeof upload === 'string' ? upload : upload?.uploadUrl || upload?.url || upload?.presignedUrl || upload?.data?.uploadUrl || upload?.data?.url;
    if (!uploadUrl) throw new Error('A API não retornou a URL de envio do arquivo.');
    const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    if (!response.ok) throw new Error('Não foi possível enviar o arquivo para o armazenamento.');
    const caminhoArquivo = upload?.caminhoArquivo || upload?.key || upload?.objectKey || upload?.fileKey || upload?.data?.caminhoArquivo || upload?.data?.key;
    if (!caminhoArquivo) throw new Error('O arquivo foi enviado, mas a API não retornou o caminho para vinculá-lo à apólice.');
    await request(`/api/Apolice/${id}/arquivos`, { method: 'POST', body: JSON.stringify({ nomeArquivo: file.name, caminhoArquivo, contentType: file.type || 'application/octet-stream', tamanhoBytes: file.size }) });
    return { nome: file.name, caminhoArquivo };
  },
  async listApoliceFiles(id) {
    const response = await apoliceFileRequest(`/api/Apolice/${id}/arquivos`);
    const data = await responseData(response);
    const files = downloadFiles(data);
    if (!files.length) throw new Error('A API não retornou arquivos para esta apólice.');
    return files;
  },
  async getApoliceDownloadUrl(id, arquivoId) {
    if (!arquivoId) throw new Error('Arquivo não identificado para download.');
    const response = await apoliceFileRequest(`/api/Apolice/${id}/arquivos/${arquivoId}/download`);
    const files = downloadFiles(await responseData(response));
    if (!files.length) throw new Error('A API não retornou a URL de acesso ao arquivo.');
    return files[0].url;
  },
  async downloadApoliceFile(id, arquivoId, fileName = `apolice-${id}`, signedUrl = '') {
    const url = signedUrl || await this.getApoliceDownloadUrl(id, arquivoId);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl; link.download = fileName; link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = url; link.download = fileName; link.click();
    }
  },
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
