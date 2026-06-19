# ðŸ“‹ Backlog de Necessidades atlas - Priorizadas

Este arquivo lista todas as necessidades identificadas no backend do atlas, organizadas por ordem de prioridade (P0 = CrÃ­tico, P1 = Alto, P2 = MÃ©dio).

## ðŸ”´ P0 - CrÃ­tico (SeguranÃ§a e Estabilidade)

1.  **Corrigir ViolaÃ§Ã£o de Camadas (Leaky Abstraction)**
    *   **Problema:** `ApprovalsService` e `LoansService` importam `PrismaService` diretamente.
    *   **Impacto:** Viola a regra de isolamento do banco de dados. Se o ORM mudar ou houver erro de conexÃ£o, o serviÃ§o quebra.
    *   **SoluÃ§Ã£o:** Criar `ApprovalsRepository` e `LoansRepository`.

2.  **Problema de Performance no AuditService (N+1 Queries)**
    *   **Problema:** O mÃ©todo `labelFromId` faz uma query ao banco para cada ID encontrado no log.
    *   **Impacto:** Se um log tiver 10 campos com IDs, sÃ£o 10 queries extras. Em lotes grandes, isso trava o banco.
    *   **SoluÃ§Ã£o:** Buscar todos os labels em lote (batch) e montar um mapa em memÃ³ria.

3.  **ExposiÃ§Ã£o de Debug em ProduÃ§Ã£o**
    *   **Problema:** Rota `@Get('debug-ping')` expÃµe se o sistema estÃ¡ em modo Mock ou ProduÃ§Ã£o.
    *   **Impacto:** Vazamento de informaÃ§Ã£o de infraestrutura.
    *   **SoluÃ§Ã£o:** Remover a rota ou protegÃª-la com uma variÃ¡vel de ambiente secreta.

## ðŸŸ  P1 - Alto (Qualidade de CÃ³digo e Tipagem)

4.  **ReduÃ§Ã£o de `any` Types**
    *   **Problema:** Excesso de tipagem `any` em controllers e services (ex: `usuario: any`, `dados: any`).
    *   **Impacto:** Perda de IntelliSense, erros em runtime que o TypeScript nÃ£o pegaria.
    *   **SoluÃ§Ã£o:** Criar interfaces tipadas (`UserDto`, `EquipmentFiltersDto`, etc.).

5.  **Refatorar `EquipmentService.listarTodos()`**
    *   **Problema:** MÃ©todo com 140+ linhas e lÃ³gica de permissÃ£o misturada com filtros de busca.
    *   **Impacto:** Dificuldade de manutenÃ§Ã£o e teste.
    *   **SoluÃ§Ã£o:** Extrair a lÃ³gica de permissÃ£o para um `PermissionsService` e a lÃ³gica de filtros para um `FilterBuilder`.

6.  **Melhoria na LÃ³gica de NotificaÃ§Ãµes**
    *   **Problema:** `notificarAtualizacaoGlobal()` envia dados para TODOS os clientes WebSocket.
    *   **Impacto:** TrÃ¡fego desnecessÃ¡rio e possÃ­vel "flash" de UI em usuÃ¡rios que nÃ£o foram afetados.
    *   **SoluÃ§Ã£o:** Filtrar por `batalhaoId` ou `secaoId` antes de emitir o evento.

## ðŸŸ¡ P2 - MÃ©dio (Manutenibilidade e Recursos)

7.  **Hardcoded Strings de Status**
    *   **Problema:** Busca por nomes como `'EMPRESTIMO'` ou `'DISPONÃVEL'`.
    *   **Impacto:** Se renomear a categoria no DB, o cÃ³digo quebra.
    *   **SoluÃ§Ã£o:** Usar constantes ou Enums do Prisma.

8.  **Uploads em Sistema de Arquivos Local**
    *   **Problema:** Fotos ficam na pasta `uploads/`.
    *   **Impacto:** ImpossÃ­vel escalar para mÃºltiplos containers/servidores.
    *   **SoluÃ§Ã£o:** Implementar integraÃ§Ã£o com AWS S3 ou Azure Blob Storage.

9.  **Seed de Dados FrÃ¡gil**
    *   **Problema:** Seeds dependem de arquivos `.xlsx`.
    *   **Impacto:** DifÃ­cil de manter e versionar no Git.
    *   **SoluÃ§Ã£o:** Migrar para JSON ou SQL scripts.

---

### ðŸ“ Resumo do Status
- [ ] P0-1: Criar RepositÃ³rios ausentes
- [ ] P0-2: Otimizar AuditService (Batch Load)
- [ ] P0-3: Remover rota debug
- [ ] P1-4: Tipagem forte (Interfaces)
- [ ] P1-5: Extrair lÃ³gica de permissÃ£o
- [ ] P2-8: Mover uploads para S3
