# Registro de Contexto Arquitetural - Frontend (Angular)

Este arquivo serve como âncora de contexto para IAs e desenvolvedores. Atualize-o conforme o projeto evolui.

**`[Estado Atual]`**:
Aplicação Frontend em Angular, consumindo as APIs do backend. Em processo de refatoração para uma arquitetura orientada a domínios (Domain-Driven UI) com forte separação entre Smart e Dumb Components.

**`[Dependências Técnicas]`**:
- **Consome**: Backend Node.js / Camada BFF Next.js.
- **É consumido por**: Usuários finais (Browser).

**`[Histórico de Modificações]`**:
- Refatoração iniciada: Migração de pastas por tipo (components, services) para estrutura de Features/Domínios.

**`[Regras de Negócio Imutáveis]`**:
1. **Smart vs Dumb**: Componentes de UI (Dumb) são apenas de apresentação. Toda lógica, injeção de dependência e chamada de serviço deve ficar nos Smart Components.
2. **Domain-Driven**: O código deve ser organizado por funcionalidade (ex: `/features/manutencao`), e não por tipo (ex: `/components`).
3. **Comentários**: Focar no PORQUÊ, mantendo o código conciso e idiomático.
4. **Layout Padronizado (Pixel-Perfect)**: Novas telas devem ser estruturadas usando o componente `<app-layout-pagina>` (de `src/app/components/layout-pagina`) com seletores correspondentes (`header-title`, `header-actions`, `stats`, `search-filters`, `bulk-actions`, `content`, `dialogs`). O layout herda os estilos prefixados com `atlas-` em `src/styles.scss`.
5. **Idioma das Pastas e Componentes**: Toda nova pasta de domínio sob `/features`, rota correspondente e novos componentes criados devem utilizar a nomenclatura obrigatoriamente em **português** (ex: `/equipamentos`, `/cautelas`, `aprovacoes`).

