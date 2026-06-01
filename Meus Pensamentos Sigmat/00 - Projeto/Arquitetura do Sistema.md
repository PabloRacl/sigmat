# 🏗️ Arquitetura do Sistema

O SIGMAT V2 é um sistema desacoplado (Frontend e Backend independentes).

## 🎨 Frontend (Pasta: `sigmat-frontend`)
Construído com **Angular 18+** e focado em performance.
- **UI Framework:** PrimeNG (Componentes de tabela, modais, gráficos).
- **Estilização:** CSS Customizado (Moderno, com efeitos de vidro/glassmorphism).
- **Gerenciamento de Estado:** Services com `Observable` e `BehaviorSubject`.

## ⚙️ Backend (Pasta: `sigmat-backend`)
Construído com **NestJS** (Node.js).
- **Banco de Dados:** PostgreSQL via **Prisma ORM**.
- **Segurança:** Passport.js + JWT (JSON Web Token).
- **Comunicação:** Socket.io para notificações em tempo real.

## 📁 Estrutura de Pastas
- `src/app/components`: Onde as telas e modais vivem.
- `src/app/services`: A ponte com o Backend.
- `src/modules`: No backend, cada pasta é uma funcionalidade (ex: `maintenance`, `equipment`).

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Deploy - Visão Geral]]



