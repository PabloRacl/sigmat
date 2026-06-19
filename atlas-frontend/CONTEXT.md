# Registro de Contexto Arquitetural - Frontend (Angular)

Este arquivo serve como Ã¢ncora de contexto para IAs e desenvolvedores. Atualize-o conforme o projeto evolui.

**`[Estado Atual]`**:
AplicaÃ§Ã£o Frontend em Angular, consumindo as APIs do backend. Em processo de refatoraÃ§Ã£o para uma arquitetura orientada a domÃ­nios (Domain-Driven UI) com forte separaÃ§Ã£o entre Smart e Dumb Components.

**`[DependÃªncias TÃ©cnicas]`**:
- **Consome**: Backend Node.js / Camada BFF Next.js.
- **Ã‰ consumido por**: UsuÃ¡rios finais (Browser).

**`[HistÃ³rico de ModificaÃ§Ãµes]`**:
- RefatoraÃ§Ã£o iniciada: MigraÃ§Ã£o de pastas por tipo (components, services) para estrutura de Features/DomÃ­nios.

**`[Regras de NegÃ³cio ImutÃ¡veis]`**:
1. **Smart vs Dumb**: Componentes de UI (Dumb) sÃ£o apenas de apresentaÃ§Ã£o. Toda lÃ³gica, injeÃ§Ã£o de dependÃªncia e chamada de serviÃ§o deve ficar nos Smart Components.
2. **Domain-Driven**: O cÃ³digo deve ser organizado por funcionalidade (ex: `/features/manutencao`), e nÃ£o por tipo (ex: `/components`).
3. **ComentÃ¡rios**: Focar no PORQUÃŠ, mantendo o cÃ³digo conciso e idiomÃ¡tico.
4. **Layout Padronizado (Pixel-Perfect)**: Novas telas devem ser estruturadas usando o componente `<app-layout-pagina>` (de `src/app/components/layout-pagina`) com seletores correspondentes (`header-title`, `header-actions`, `stats`, `search-filters`, `bulk-actions`, `content`, `dialogs`). O layout herda os estilos prefixados com `atlas-` em `src/styles.scss`.
5. **Idioma das Pastas e Componentes**: Toda nova pasta de domÃ­nio sob `/features`, rota correspondente e novos componentes criados devem utilizar a nomenclatura obrigatoriamente em **portuguÃªs** (ex: `/equipamentos`, `/cautelas`, `aprovacoes`).

