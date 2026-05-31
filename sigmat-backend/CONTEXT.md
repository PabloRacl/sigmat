# Registro de Contexto Arquitetural - Backend (Node.js + Prisma)

Este arquivo serve como âncora de contexto para IAs e desenvolvedores. Atualize-o conforme o projeto evolui.

**`[Estado Atual]`**:
Backend construído em Node.js, gerenciando as regras de negócio centrais, integração com banco de dados via Prisma ORM e exposição de APIs REST. Atualmente sendo refatorado para um modelo rigoroso de Repository/Service, separando responsabilidades.

**`[Dependências Técnicas]`**:
- **Consome**: Banco de Dados Relacional (via Prisma), possivelmente integrações externas.
- **É consumido por**: Frontend Angular e (futuramente) BFF Next.js.

**`[Histórico de Modificações]`**:
- Refatoração iniciada: Remoção de chamadas diretas ao `PrismaClient` nos Controllers.
- Aplicação de Clean Code e Domain-Driven Design no backend.

**`[Regras de Negócio Imutáveis]`**:
1. **Isolamento do DB**: Controllers NUNCA devem importar ou chamar diretamente o Prisma.
2. **Tipagem de Ponta a Ponta**: Toda entrada/saída deve utilizar DTOs e tipos gerados pelo Prisma.
3. **Comentários**: Focar no PORQUÊ da lógica de negócio, não em descrever o que o código faz.
