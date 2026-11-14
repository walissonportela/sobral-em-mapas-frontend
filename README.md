# Sobral em Mapas — Front-end

Interface web do **Sobral em Mapas**, plataforma WebGIS desenvolvida para organizar, consultar e visualizar informações geoespaciais do município de Sobral (CE). Este repositório corresponde ao **front-end** do projeto de Trabalho de Conclusão de Curso (TCC) *“Sobral em Mapas: Engenharia de Software Aplicada ao Desenvolvimento de uma Plataforma WebGIS para Gestão de Dados Geoespaciais”*.

> A API é mantida em outro repositório: [sobral-em-mapas-backend](https://github.com/walissonportela/sobral-em-mapas-backend).

## Tecnologias principais

- **React 19** e **Vite 7** — interface e servidor de desenvolvimento;
- **Leaflet**, **React-Leaflet** e **Leaflet Draw** — visualização e desenho de elementos geográficos;
- **Tailwind CSS 4** — estilização responsiva;
- **Axios** — comunicação com a API REST;
- **React Router** — navegação;
- **jsPDF** e **html2canvas** — recursos de exportação e impressão.

## Funcionalidades

- Visualização de mapas-base e camadas temáticas;
- Consulta de camadas WMS e GeoJSON disponibilizadas pelo back-end;
- Busca, legendas, medições, desenho de geometrias e impressão;
- Interface responsiva, tutorial e páginas de informações;
- Login e acesso ao painel administrativo conforme o perfil do usuário;
- Gerenciamento de categorias, subcategorias, camadas, WMS, arquivos GeoJSON e usuários, de acordo com as permissões da API.

## Pré-requisitos

- **Git**;
- **Node.js** compatível com Vite 7 (Node 20.19+ ou 22.12+);
- **npm** (distribuído com o Node.js);
- **Back-end em execução** para autenticação, listagem de camadas e recursos administrativos.

O mapa-base OpenStreetMap pode ser carregado sem a API, mas os dados cadastrais e as camadas publicadas dependem do back-end.

## Como executar localmente

### 1. Clone este repositório

```bash
git clone https://github.com/walissonportela/sobral-em-mapas-frontend.git
cd sobral-em-mapas-frontend
```

### 2. Instale as dependências

```bash
npm ci
```

O comando utiliza o `package-lock.json` para instalar as versões registradas no projeto. Se estiver modificando as dependências, utilize `npm install` quando necessário.

### 3. Configure as variáveis de ambiente

Na raiz do front-end, crie o arquivo **`.env.local`**:

```dotenv
VITE_API_URL=http://localhost:8080/api
# Opcional: chave de acesso aos mapas-base claro e escuro da CARTO
# VITE_CARTO_BASEMAP_KEY=sua_chave_aqui
```

- `VITE_API_URL` **inclui o sufixo `/api`** e deve apontar para o Laravel.
- A aplicação utiliza `http://localhost:8080/api` como valor de reserva, porém o repositório contém um `.env` versionado. O `.env.local` permite **sobrescrever a configuração sem alterar arquivos rastreados pelo Git**.
- `VITE_CARTO_BASEMAP_KEY` é necessária para selecionar os mapas-base **claro** e **escuro** da CARTO na implementação atual. O mapa padrão OpenStreetMap não depende dessa chave.
- Variáveis prefixadas com `VITE_` são expostas ao código do navegador: **não coloque senhas nem tokens privados nesse arquivo**.

Para executar o Laravel localmente, siga o [README do back-end](https://github.com/walissonportela/sobral-em-mapas-backend#readme).

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:5173** (porta padrão do Vite, salvo indicação diferente no terminal).

### 5. Teste a integração

Com o back-end iniciado, verifique:

- **Mapa público:** http://localhost:5173/
- **Página sobre:** http://localhost:5173/sobre
- **Painel administrativo:** http://localhost:5173/admin (é necessário entrar com um usuário autorizado);
- **API:** http://localhost:8080/api/map-data

O back-end recém-inicializado cria categorias e subcategorias, mas **não importa automaticamente as camadas e os arquivos GeoJSON utilizados na demonstração**. Eles devem ser cadastrados ou importados separadamente.

## Comandos disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento com Vite |
| `npm run build` | Gera os arquivos de produção em `dist/` |
| `npm run preview` | Pré-visualiza o build localmente |
| `npm run lint` | Executa as regras de ESLint |

## Organização do código

```text
src/
├── components/    # Interface do mapa, painéis, controles e modais
├── config/        # Configurações da aplicação
├── context/       # Contextos de estado e autenticação
├── hooks/         # Hooks reutilizáveis
├── pages/         # Mapa público, páginas e administração
├── routes/        # Rotas protegidas
└── services/      # Chamadas à API Laravel
```

## Problemas comuns

**A página abre, mas não aparecem camadas:** confira se a API está acessível em `http://localhost:8080/api/map-data`, se `VITE_API_URL` contém `/api` e se existem camadas públicas ativas no banco. Uma instalação nova não inclui todas as camadas de exemplo.

**Erro de CORS:** execute o front-end na origem `http://localhost:5173` ou ajuste as origens permitidas em `config/cors.php` do back-end.

**Mapas-base claro/escuro não funcionam:** configure uma chave CARTO válida em `.env.local` e reinicie o Vite.

**Login não funciona:** confira se as migrações e os seeders do back-end foram executados e se o usuário foi aprovado.

**Alterações no `.env.local` não surtiram efeito:** interrompa e reinicie `npm run dev`.

## Repositórios e autoria

- [Front-end — este repositório](https://github.com/walissonportela/sobral-em-mapas-frontend)
- [Back-end — API Laravel](https://github.com/walissonportela/sobral-em-mapas-backend)

Projeto acadêmico desenvolvido por **Walisson Portela**, no contexto do TCC **Sobral em Mapas**.
