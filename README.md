
# 🗺️ Sobral em Mapas — Front-end

Interface web da plataforma **Sobral em Mapas**, desenvolvida para organizar, visualizar e consultar informações geoespaciais do município de Sobral, Ceará.

Este repositório contém o front-end da aplicação, desenvolvido como parte do Trabalho de Conclusão de Curso (TCC) intitulado **"Sobral em Mapas: Engenharia de Software Aplicada ao Desenvolvimento de uma Plataforma WebGIS para Gestão de Dados Geoespaciais"**.

## 📌 Sobre o projeto

O Sobral em Mapas é uma plataforma WebGIS que permite visualizar e gerenciar dados geográficos por meio de uma interface interativa e responsiva.

O sistema disponibiliza ferramentas de navegação cartográfica, gerenciamento de camadas temáticas e recursos administrativos, permitindo a organização de informações geoespaciais de diferentes áreas do município.

## 🚀 Tecnologias utilizadas

- React 19
- Vite 7
- JavaScript
- Tailwind CSS 4
- Leaflet e React-Leaflet
- Leaflet Draw
- Axios
- React Router
- Lucide React
- jsPDF e html2canvas

## ✨ Funcionalidades

- Visualização de mapas interativos.
- Ativação e desativação de camadas geográficas.
- Suporte a camadas WMS e GeoJSON.
- Diferentes mapas-base, incluindo visualizações claras, escuras, topográficas e de satélite.
- Ferramentas de busca e localização.
- Medição de distâncias, áreas e perímetros.
- Desenho de pontos, linhas e polígonos.
- Personalização visual de camadas.
- Consulta de informações por popups.
- Exibição de legendas cartográficas.
- Exportação e impressão de mapas.
- Gerenciamento de categorias, subcategorias e camadas.
- Autenticação e controle de acesso por perfis.
- Painel administrativo.
- Interface responsiva para computadores e dispositivos móveis.
- Tutorial interativo de utilização.

## 📋 Pré-requisitos

Antes de executar o projeto, instale:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (versão 20.19+ ou 22.12+)
- npm (incluído no Node.js)

Para utilizar todas as funcionalidades, também é necessário executar a API do projeto.

Repositório do back-end:

https://github.com/walissonportela/sobral-em-mapas-backend

## ⚙️ Instalação e execução

### 1. Clonar o repositório

Abra um terminal e execute:

```bash
git clone https://github.com/walissonportela/sobral-em-mapas-frontend.git
```

Entre na pasta do projeto:

```bash
cd sobral-em-mapas-frontend
```

### 2. Instalar as dependências

Execute:

```bash
npm ci
```

Esse comando instalará as dependências registradas no `package-lock.json`.

### 3. Configurar as variáveis de ambiente

Na raiz do projeto, crie um arquivo chamado `.env.local`.

Adicione:

```env
VITE_API_URL=http://localhost:8080/api
```

Essa variável informa o endereço da API Laravel.

**Importante:** o endereço deve conter `/api` no final.

Caso utilize os mapas-base da CARTO, também poderá configurar:

```env
VITE_CARTO_BASEMAP_KEY=sua_chave_aqui
```

Essa chave é utilizada nas opções de mapas-base claro e escuro. O OpenStreetMap funciona sem essa configuração.

Não adicione senhas ou tokens privados às variáveis `VITE_`, pois elas ficam acessíveis no navegador.

### 4. Executar o projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Após a inicialização, acesse:

http://localhost:5173

A aplicação estará disponível no navegador.

## 🔗 Integração com o back-end

O front-end utiliza Axios para realizar requisições à API Laravel.

Durante o desenvolvimento local, o endereço padrão é:

```text
http://localhost:8080/api
```

Para verificar a comunicação, acesse:

http://localhost:8080/api/map-data

Esse endpoint retorna os dados públicos das categorias e camadas disponíveis.

**Observação:** uma instalação inicial do back-end não inclui automaticamente todas as camadas utilizadas na demonstração do projeto. Os dados geográficos devem ser cadastrados ou importados separadamente.

## 📁 Estrutura do projeto

```text
src/
├── assets/           # Recursos visuais
├── components/       # Componentes reutilizáveis
├── config/           # Configurações
├── context/          # Contextos da aplicação
├── hooks/            # Hooks personalizados
├── pages/            # Páginas públicas e administrativas
├── routes/           # Controle de rotas
├── services/         # Comunicação com a API
├── App.jsx           # Rotas principais
└── main.jsx          # Inicialização da aplicação
```

## 🛠️ Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run preview` | Pré-visualiza a versão de produção |
| `npm run lint` | Executa a análise do código com ESLint |

## 🔐 Perfis de acesso

A plataforma possui três perfis:

**Superadministrador:** acesso completo às funcionalidades administrativas, incluindo gerenciamento de usuários e solicitações.

**Administrador:** gerenciamento de categorias, subcategorias, camadas e arquivos geográficos, respeitando as permissões definidas pelo back-end.

**Visitante:** acesso às funcionalidades públicas de visualização e interação com os mapas.

As permissões de acesso são verificadas pela API Laravel.

## ❗ Possíveis problemas

### As camadas não aparecem

Verifique se:

- O back-end está em execução.
- A variável `VITE_API_URL` está configurada corretamente.
- O banco de dados contém camadas cadastradas.
- As camadas estão ativas e públicas.

### Erro de conexão com a API

Confirme se o endereço abaixo está acessível:

```text
http://localhost:8080/api/map-data
```

### Erro de CORS

Confira se a origem do front-end está autorizada no arquivo `config/cors.php` do back-end.

### Mapas-base claros ou escuros indisponíveis

Confira a configuração da variável `VITE_CARTO_BASEMAP_KEY` e reinicie o servidor Vite.

## 🌐 Implantação

O front-end foi preparado para implantação na plataforma [Vercel](https://vercel.com/).

Na configuração de produção, é necessário informar a variável `VITE_API_URL` apontando para a API publicada.

O comando de compilação é:

```bash
npm run build
```

O diretório de saída é:

```text
dist
```

## 📚 Repositórios

**Front-end:**

https://github.com/walissonportela/sobral-em-mapas-frontend

**Back-end:**

https://github.com/walissonportela/sobral-em-mapas-backend

## 👨‍💻 Autor

**Walisson Portela**

Projeto acadêmico desenvolvido como Trabalho de Conclusão de Curso (TCC), com foco na aplicação de conceitos de Engenharia de Software ao desenvolvimento de uma plataforma WebGIS para gestão de dados geoespaciais.
