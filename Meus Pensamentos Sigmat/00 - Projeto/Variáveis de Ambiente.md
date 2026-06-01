# 🔐 Variáveis de Ambiente

Estas são as configurações "secretas" que fazem o sistema funcionar. Elas **nunca** devem ser enviadas para o GitHub (estão protegidas pelo `.env`).

## ⚙️ No Backend (Render)
Para o motor funcionar, estas variáveis precisam estar configuradas no painel do Render:

| Variável | Descrição | Valor Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Link de conexão com o [[Banco de Dados - Neon]] | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Chave de segurança para o [[Sistema de Login]] | `uma_frase_longa_e_secreta` |
| `FRONTEND_URL` | Endereço do site para autorizar o acesso (CORS) | `https://sigmat.vercel.app` |
| `PORT` | Porta que o servidor vai escutar | `10000` (Padrão Render) |

## ⚙️ No Frontend (Local e Vercel)
O arquivo `sigmat-frontend/src/app/environment.ts` define para onde o site olha:

- **Produção:** `https://sigmat.onrender.com`
- **Desenvolvimento:** `http://localhost:3001`

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Deploy - Visão Geral]]



