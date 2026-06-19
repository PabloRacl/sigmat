# ðŸ—ï¸ Arquitetura do Sistema

O atlas V2 Ã© um sistema desacoplado (Frontend e Backend independentes).

## ðŸŽ¨ Frontend (Pasta: `atlas-frontend`)
ConstruÃ­do com **Angular 18+** e focado em performance.
- **UI Framework:** PrimeNG (Componentes de tabela, modais, grÃ¡ficos).
- **EstilizaÃ§Ã£o:** CSS Customizado (Moderno, com efeitos de vidro/glassmorphism).
- **Gerenciamento de Estado:** Services com `Observable` e `BehaviorSubject`.

## âš™ï¸ Backend (Pasta: `atlas-backend`)
ConstruÃ­do com **NestJS** (Node.js).
- **Banco de Dados:** PostgreSQL via **Prisma ORM**.
- **SeguranÃ§a:** Passport.js + JWT (JSON Web Token).
- **ComunicaÃ§Ã£o:** Socket.io para notificaÃ§Ãµes em tempo real.

## ðŸ“ Estrutura de Pastas
- `src/app/components`: Onde as telas e modais vivem.
- `src/app/services`: A ponte com o Backend.
- `src/modules`: No backend, cada pasta Ã© uma funcionalidade (ex: `maintenance`, `equipment`).

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[Deploy - VisÃ£o Geral]]



