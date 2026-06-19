# ðŸš€ Deploy - VisÃ£o Geral

O atlas V2 utiliza uma arquitetura de microserviÃ§os distribuÃ­dos para garantir alta disponibilidade e custo zero (planos gratuitos).

## ðŸŒ Arquitetura em Nuvem

| Componente | Plataforma | FunÃ§Ã£o | Link |
| :--- | :--- | :--- | :--- |
| **Frontend** | [[Hospedagem - Vercel|Vercel]] | Interface Angular (UI) | [atlas.vercel.app](https://atlas.vercel.app) |
| **Backend** | [[Hospedagem - Render|Render]] | API NestJS (LÃ³gica) | [atlas.onrender.com](https://atlas.onrender.com) |
| **Banco de Dados** | [[Banco de Dados - Neon|Neon]] | PostgreSQL (Dados) | [neon.tech](https://neon.tech) |

## ðŸ”— Como eles se conectam?
1. O **Frontend** na Vercel envia requisiÃ§Ãµes para o **Backend** no Render.
2. O **Backend** processa a lÃ³gica e consulta/salva dados no **Neon**.
3. O **Neon** armazena os 12.000+ equipamentos e retorna as informaÃ§Ãµes.

## ðŸ› ï¸ Ciclo de AtualizaÃ§Ã£o (CI/CD)
Toda vez que um `git push` Ã© feito para o [[RepositÃ³rio GitHub]], tanto a Vercel quanto o Render detectam a mudanÃ§a e atualizam o sistema automaticamente.

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[VariÃ¡veis de Ambiente]]



