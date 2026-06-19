# ðŸ“Š Modelo de Dados

O atlas utiliza um banco de dados relacional (PostgreSQL no [[Banco de Dados - Neon|Neon]]). A estrutura Ã© definida pelo arquivo `schema.prisma`.

## ðŸ—ï¸ Principais Tabelas

### 1. Equipamento
A tabela central do sistema.
- `patrimonio`: Identificador Ãºnico (ex: 12345).
- `secaoId`: Onde o equipamento estÃ¡ alocado ([[Estrutura Organizacional]]).
- `statusId`: Estado atual (ATIVO, MANUTENÃ‡ÃƒO, etc).
- `especificacoes`: Campo JSON que guarda detalhes tÃ©cnicos (RAM, IMEI, etc).

### 2. ManutenÃ§Ã£o (OrdemServico)
Gerencia o [[Fluxo de ManutenÃ§Ã£o]].
- `descricaoProblema`: O que quebrou.
- `status`: ABERTA, EM_ANALISE, CONCLUIDA.

### 3. UsuÃ¡rio
- `perfil`: Define o que o usuÃ¡rio pode fazer (ADMIN_DTEC, COMANDANTE, etc).
- `secoesPermitidas`: Lista de seÃ§Ãµes que o usuÃ¡rio pode gerenciar.

## ðŸ”— Relacionamentos
- Um **Equipamento** pertence a uma **SeÃ§Ã£o**.
- Uma **SeÃ§Ã£o** pertence a um **BatalhÃ£o**.
- Um **BatalhÃ£o** pertence a uma **Diretoria**.

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[Comandos Ãšteis]]



