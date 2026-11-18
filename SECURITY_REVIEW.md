# Revisão de segurança — frontend

Branch: `fix/security`, destinada a testes locais antes da integração.

## Proteções preparadas
- Revalidação da sessão por `GET /me` ao iniciar a aplicação.
- Encerramento de sessão quando a API sinaliza token inválido; controles administrativos esperam a revalidação.
- Bearer token anexado somente aos endpoints autenticados, nunca a solicitações públicas de camadas, busca e contato.
- Bloqueio de destinos externos nas chamadas do cliente API, com timeout definido.
- Logout local imediato e tentativa de revogar o token no servidor.
- Nomes GeoJSON exibidos em tooltips como nós de texto, sem interpretar HTML de atributos externos.
- Headers HTTP compatíveis com Leaflet (sem CSP rígida que quebraria tiles e estilos inline).
- Workflow GitHub Actions para verificar o build do Vite.

## Testes recomendados
1. `npm ci` e `npm run build` com `.env` local.
2. Login e logout de Visitante, Administrador e Superadministrador; navegador deve mostrar tela de acesso quando token expirar.
3. Aprovação/reprovação de cadastro, gerenciamento de usuários e camadas com API local.
4. Abrir, navegar e atualizar o mapa, ativar camadas GeoJSON, pesquisar, medir, desenhar e imprimir.
5. Ativar os mapas de base (OSM, CARTO, satélite e relevo), observando chamadas HTTP e erro CORS.
6. Validar que nomes como `<img src=x onerror=alert(1)>` são exibidos como texto nas etiquetas GeoJSON.
7. Conferir que `Authorization` não é enviado em `/map-data`, `/estatisticas`, `/contact` e `/send-message`.
8. Não integrar em produção até a aprovação do backend correspondente.

## Pendências planejadas
- `localStorage` não é inacessível a XSS. Migração para cookies HttpOnly exige suporte de sessão, CSRF, domínios e CORS coordenado no Laravel.
- `VITE_*` é exposto no JavaScript compilado por definição. Usar apenas valores públicos; proteger/limitar chaves de provedores no próprio provedor.
- `.env` já é rastreado na branch principal. Mover a configuração de build para a Vercel antes de removê-lo do Git para não interromper o site.
- Configurar CSP restritiva somente após inventariar os domínios de tiles, APIs, imagens e estilos inline.
