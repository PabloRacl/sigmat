# ðŸ” VariÃ¡veis de Ambiente

Estas sÃ£o as configuraÃ§Ãµes "secretas" que fazem o sistema funcionar. Elas **nunca** devem ser enviadas para o GitHub (estÃ£o protegidas pelo `.env`).

## âš™ï¸ No Backend (Render)
Para o motor funcionar, estas variÃ¡veis precisam estar configuradas no painel do Render:

| VariÃ¡vel | DescriÃ§Ã£o | Valor Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Link de conexÃ£o com o [[Banco de Dados - Neon]] | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Chave de seguranÃ§a para o [[Sistema de Login]] | `uma_frase_longa_e_secreta` |
| `FRONTEND_URL` | EndereÃ§o do site para autorizar o acesso (CORS) | `https://atlas.vercel.app` |
| `PORT` | Porta que o servidor vai escutar | `10000` (PadrÃ£o Render) |

## âš™ï¸ No Frontend (Local e Vercel)
O arquivo `atlas-frontend/src/app/environment.ts` define para onde o site olha:

- **ProduÃ§Ã£o:** `https://atlas.onrender.com`
- **Desenvolvimento:** `http://localhost:3001`

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[Deploy - VisÃ£o Geral]]



