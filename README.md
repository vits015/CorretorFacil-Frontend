# Corretor Fácil

Aplicação web para gestão da rotina de corretores de seguros. O projeto centraliza clientes, seguradoras, apólices, pagamentos e sinistros em uma interface responsiva, com autenticação e integração a uma API REST em .NET.

**Demo:** [corretor-facil.vercel.app](https://corretor-facil.vercel.app/) · **API:** [Swagger](https://corretorfacil.onrender.com/swagger/index.html)

## Visão geral

O Corretor Fácil foi construído para reduzir a fragmentação das informações de uma corretora. A aplicação permite acompanhar a carteira de clientes e apólices, registrar pagamentos no próprio fluxo de contratação e controlar sinistros sem sair do contexto da apólice.

O frontend usa roteamento por hash, o que simplifica sua hospedagem como SPA estática e mantém links de navegação compartilháveis.

## Principais recursos

- Autenticação de usuário com token JWT persistido na sessão local.
- Painel inicial com indicadores de clientes, apólices, sinistros e renovações do mês.
- Cadastro, edição, detalhes, busca e exclusão de clientes.
- Endereços e contatos vinculados ao cliente, com consulta automática de CEP pela API ViaCEP.
- Máscaras para CPF, CNPJ e CEP; campos de estado civil e sexo com opções pré-definidas.
- Gestão de seguradoras e seus contatos.
- Cadastro de apólices com seleção de cliente e seguradora, tipos de seguro, produtos, vigência, comissão percentual e link do documento.
- Criação automática de um único pagamento no fluxo da nova apólice.
- Edição de pagamento e CRUD de sinistros diretamente na tela de edição da apólice.
- Tela detalhada de apólice com dados do cliente, seguradora, pagamento, sinistros e link do documento.
- Filtros de apólices por produto, seguradora, nome do cliente e mês/ano de vigência.
- Tema claro e escuro com preferência persistida.
- Interface adaptável para desktop e dispositivos menores.

## Tecnologias

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- JavaScript (ES Modules)
- CSS responsivo, sem dependência de framework visual
- API REST ASP.NET Core
- [ViaCEP](https://viacep.com.br/) para preenchimento de endereços
- [Vercel](https://vercel.com/) para hospedagem do frontend
- [Render](https://render.com/) para hospedagem da API

## Arquitetura e integração

```text
React + Vite
     |
     |  /api/*
     v
Proxy do Vite (desenvolvimento) / Rewrite do Vercel (produção)
     |
     v
API Corretor Fácil - ASP.NET Core
     |
     +-- Clientes, Endereços e Contatos
     +-- Seguradoras
     +-- Apólices e Pagamentos
     +-- Sinistros
     +-- Usuários e autenticação JWT
```

Para evitar problemas de CORS, o frontend chama rotas relativas (`/api/...`). Em desenvolvimento, o Vite encaminha as chamadas à API publicada. Em produção, o arquivo `vercel.json` faz o rewrite dessas chamadas para a API no Render.

## Estrutura do projeto

```text
src/
├── App.jsx             # Telas, componentes e fluxo principal
├── api.js              # Cliente HTTP, token JWT e normalização de respostas
├── main.jsx            # Ponto de entrada React
├── styles.css          # Estilos globais e layout base
├── client-form.css     # Formulários, cards e ações de listagens
└── theme.css           # Variações do tema escuro

vite.config.js          # Proxy local para a API
vercel.json             # Rewrite /api para a API publicada
```

## Executando localmente

### Pré-requisitos

- Node.js 18 ou superior
- npm

### Instalação

```bash
git clone https://github.com/vits015/CorretorFacil-Frontend.git
cd CorretorFacil-Frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Build de produção

```bash
npm run build
npm run preview
```

## API

A URL pública da API é:

```text
https://corretorfacil.onrender.com
```

Documentação interativa disponível em:

```text
https://corretorfacil.onrender.com/swagger/index.html
```

As principais rotas consumidas pelo frontend incluem:

- `POST /api/Usuario/Login`
- `GET|POST|PUT|DELETE /api/Cliente`
- `GET|POST|PUT|DELETE /api/Endereco`
- `GET|POST|PUT|DELETE /api/Contato`
- `GET|POST|PUT|DELETE /api/Seguradora`
- `GET|POST|PUT|DELETE /api/Apolice`
- `GET|POST|PUT|DELETE /api/Pagamento`
- `GET|POST|PUT|DELETE /api/Sinistro`

## Decisões de implementação

- **Pagamentos no fluxo da apólice:** o pagamento é criado antes da apólice e o identificador retornado pela API é usado no cadastro do contrato.
- **Sinistros no contexto correto:** inclusão, alteração e remoção ocorrem dentro da edição da apólice, reduzindo troca de contexto.
- **Respostas flexíveis da API:** a camada `api.js` normaliza diferenças de capitalização e estruturas de resposta, como objetos de criação encapsulados.
- **Sessão resiliente:** rotas de login/cadastro redirecionam para o painel quando há uma sessão ativa, evitando falhas ao reabrir a aplicação.
- **Deploy sem CORS no cliente:** rewrites do Vercel fazem a ponte entre a SPA e a API publicada.

## Autor

Desenvolvido por [Vitor](https://github.com/vits015) como projeto de portfólio.

---

Se este projeto foi útil para você, deixe uma estrela no repositório.
