# Visão Geral do Backend (NestJS)

O backend do SIGMAT foi construído utilizando **NestJS**, seguindo uma arquitetura modular e escalável. Ele é a peça central que conecta o [[Banco de Dados]] à interface do [[Visão Geral Frontend]].

## 1. Estrutura Modular

O sistema é dividido em módulos independentes que implementam as regras do [[Fluxo de Aprovação]]:

- **`autenticacao`**: Integração com a API do SEI e geração de tokens JWT.
- **`usuarios`**: Gestão de perfis e sincronização de dados de lotação.
- **`equipamentos`**: CRUD principal e lógica de campos específicos por tipo.
- **`aprovacoes`**: Gerenciamento do workflow de solicitações pendentes.
- **`estrutura-organizacional`**: Gerenciamento de Diretorias, Batalhões e Seções.
- **`emprestimos`**: Lógica de temporalidade e termos de responsabilidade.
- **`logs`**: Serviço global de auditoria.
- **`relatorios`**: Geração de dados para exportação (PDF/Excel).

## 2. Tecnologias Utilizadas

- **Framework**: NestJS 10+
- **ORM**: Prisma (Conectado ao [[Banco de Dados]])
- **Validação**: `class-validator`
- **Documentação**: Swagger (`/api/docs`)

## 3. Segurança

- **JWT**: Proteção de rotas.
- **Guards de Perfil**: Controle baseado em `PerfilUsuario`.

---
> [!IMPORTANT]
> A evolução lógica deste módulo pode ser acompanhada em [[Evolução do Pensamento]].



