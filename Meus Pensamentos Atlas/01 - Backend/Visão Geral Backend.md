# VisÃ£o Geral do Backend (NestJS)

O backend do atlas foi construÃ­do utilizando **NestJS**, seguindo uma arquitetura modular e escalÃ¡vel. Ele Ã© a peÃ§a central que conecta o [[Banco de Dados]] Ã  interface do [[VisÃ£o Geral Frontend]].

## 1. Estrutura Modular

O sistema Ã© dividido em mÃ³dulos independentes que implementam as regras do [[Fluxo de AprovaÃ§Ã£o]]:

- **`autenticacao`**: IntegraÃ§Ã£o com a API do SEI e geraÃ§Ã£o de tokens JWT.
- **`usuarios`**: GestÃ£o de perfis e sincronizaÃ§Ã£o de dados de lotaÃ§Ã£o.
- **`equipamentos`**: CRUD principal e lÃ³gica de campos especÃ­ficos por tipo.
- **`aprovacoes`**: Gerenciamento do workflow de solicitaÃ§Ãµes pendentes.
- **`estrutura-organizacional`**: Gerenciamento de Diretorias, BatalhÃµes e SeÃ§Ãµes.
- **`emprestimos`**: LÃ³gica de temporalidade e termos de responsabilidade.
- **`logs`**: ServiÃ§o global de auditoria.
- **`relatorios`**: GeraÃ§Ã£o de dados para exportaÃ§Ã£o (PDF/Excel).

## 2. Tecnologias Utilizadas

- **Framework**: NestJS 10+
- **ORM**: Prisma (Conectado ao [[Banco de Dados]])
- **ValidaÃ§Ã£o**: `class-validator`
- **DocumentaÃ§Ã£o**: Swagger (`/api/docs`)

## 3. SeguranÃ§a

- **JWT**: ProteÃ§Ã£o de rotas.
- **Guards de Perfil**: Controle baseado em `PerfilUsuario`.

---
> [!IMPORTANT]
> A evoluÃ§Ã£o lÃ³gica deste mÃ³dulo pode ser acompanhada em [[EvoluÃ§Ã£o do Pensamento]].



