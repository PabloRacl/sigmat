# 🛠️ Comandos Úteis

Lista de comandos essenciais para manter o SIGMAT operando.

## 📦 Banco de Dados (Prisma)
Rodar dentro da pasta `sigmat-backend`:

- **Sincronizar Schema:** `npx prisma db push`
  *(Cria as tabelas no Neon se você mudar o arquivo schema.prisma)*
- **Rodar Importação (Seed):** `npx prisma db seed`
  *(Importa os 12 mil equipamentos das planilhas)*
- **Abrir Painel Visual:** `npx prisma studio`
  *(Abre um navegador para você editar os dados manualmente)*

## 🚀 Git e Deploy
Rodar na pasta raiz `sigmat`:

- **Salvar Mudanças:** `git add .`
- **Criar Versão:** `git commit -m "Explicação da mudança"`
- **Enviar para Nuvem:** `git push`
  *(Isso atualiza automaticamente a Vercel e o Render)*

## 💻 Desenvolvimento Local
- **Subir Frontend:** `npm start` (na pasta `sigmat-frontend`)
- **Subir Backend:** `npm run start:dev` (na pasta `sigmat-backend`)

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Banco de Dados - Neon]]



