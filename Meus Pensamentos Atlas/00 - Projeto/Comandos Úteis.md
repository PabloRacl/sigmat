# ðŸ› ï¸ Comandos Ãšteis

Lista de comandos essenciais para manter o atlas operando.

## ðŸ“¦ Banco de Dados (Prisma)
Rodar dentro da pasta `atlas-backend`:

- **Sincronizar Schema:** `npx prisma db push`
  *(Cria as tabelas no Neon se vocÃª mudar o arquivo schema.prisma)*
- **Rodar ImportaÃ§Ã£o (Seed):** `npx prisma db seed`
  *(Importa os 12 mil equipamentos das planilhas)*
- **Abrir Painel Visual:** `npx prisma studio`
  *(Abre um navegador para vocÃª editar os dados manualmente)*

## ðŸš€ Git e Deploy
Rodar na pasta raiz `atlas`:

- **Salvar MudanÃ§as:** `git add .`
- **Criar VersÃ£o:** `git commit -m "ExplicaÃ§Ã£o da mudanÃ§a"`
- **Enviar para Nuvem:** `git push`
  *(Isso atualiza automaticamente a Vercel e o Render)*

## ðŸ’» Desenvolvimento Local
- **Subir Frontend:** `npm start` (na pasta `atlas-frontend`)
- **Subir Backend:** `npm run start:dev` (na pasta `atlas-backend`)

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[Banco de Dados - Neon]]



