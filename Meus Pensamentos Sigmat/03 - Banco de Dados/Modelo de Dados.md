# 📊 Modelo de Dados

O SIGMAT utiliza um banco de dados relacional (PostgreSQL no [[Banco de Dados - Neon|Neon]]). A estrutura é definida pelo arquivo `schema.prisma`.

## 🏗️ Principais Tabelas

### 1. Equipamento
A tabela central do sistema.
- `patrimonio`: Identificador único (ex: 12345).
- `secaoId`: Onde o equipamento está alocado ([[Estrutura Organizacional]]).
- `statusId`: Estado atual (ATIVO, MANUTENÇÃO, etc).
- `especificacoes`: Campo JSON que guarda detalhes técnicos (RAM, IMEI, etc).

### 2. Manutenção (OrdemServico)
Gerencia o [[Fluxo de Manutenção]].
- `descricaoProblema`: O que quebrou.
- `status`: ABERTA, EM_ANALISE, CONCLUIDA.

### 3. Usuário
- `perfil`: Define o que o usuário pode fazer (ADMIN_DTEC, COMANDANTE, etc).
- `secoesPermitidas`: Lista de seções que o usuário pode gerenciar.

## 🔗 Relacionamentos
- Um **Equipamento** pertence a uma **Seção**.
- Uma **Seção** pertence a um **Batalhão**.
- Um **Batalhão** pertence a uma **Diretoria**.

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Comandos Úteis]]



