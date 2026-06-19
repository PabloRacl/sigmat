# Layout Compacto â€” Todas as PÃ¡ginas (Mai 2026)

> **Data:** 25/05/2026  
> **Tipo:** Melhoria Visual / UX  
> **Escopo:** Frontend â€” todas as pÃ¡ginas do atlas  

---

## ðŸŽ¯ Objetivo

Aplicar um layout **denso e compacto** em todas as telas do sistema, priorizando o conteÃºdo principal (tabelas, grÃ¡ficos e dados) em vez dos cabeÃ§alhos e cards de estatÃ­sticas.

A mudanÃ§a foi motivada pela necessidade de maximizar o espaÃ§o Ãºtil da tela, especialmente em monitores com resoluÃ§Ã£o padrÃ£o (1366x768 e 1920x1080), onde os cabeÃ§alhos grandes consumiam uma parte significativa da Ã¡rea visÃ­vel.

---

## ðŸ“ PadrÃ£o Aplicado

O mesmo padrÃ£o compacto foi padronizado em **todas as 9 pÃ¡ginas** do sistema:

| Elemento              | Antes       | Depois      | ReduÃ§Ã£o |
|-----------------------|-------------|-------------|---------|
| TÃ­tulo da pÃ¡gina (`h1`) | `1.85rem` | `1.35rem`   | ~27%    |
| Margem inferior do header | `2rem` | `0.75rem`   | ~62%    |
| Padding dos stat cards  | `1.25rem` | `0.5rem 0.85rem` | ~60% |
| Tamanho dos Ã­cones nos cards | `48px` | `34px`  | ~29%    |
| Padding das cÃ©lulas da tabela | `1rem 1.5rem` | `0.65rem 1rem` | ~35% |
| Fonte cabeÃ§alho de coluna | `0.75rem` | `0.70rem` | ~7%  |
| Gap entre stat cards    | `1.25rem`   | `0.75rem`   | ~40%    |

---

## ðŸ—‚ï¸ PÃ¡ginas Alteradas

| PÃ¡gina                    | Componente SCSS                          |
|---------------------------|------------------------------------------|
| VisÃ£o Geral (Dashboard)   | `dashboard-home.component.scss`          |
| Equipamentos              | `equipment-list.component.scss`          |
| Cautelas DiÃ¡rias          | `loans-management.component.scss`        |
| UsuÃ¡rios                  | `users-list.component.scss`              |
| TransferÃªncia de Unidade  | `transfers-list.component.scss`          |
| ManutenÃ§Ã£o                | `maintenance-list.component.scss`        |
| AprovaÃ§Ãµes                | `approvals-list.component.scss`          |
| RelatÃ³rios                | `reports.component.scss`                 |
| Auditoria                 | `audit-logs.component.scss`              |

---

## ðŸ› ï¸ AlteraÃ§Ãµes TÃ©cnicas por Tipo

### CabeÃ§alhos de PÃ¡gina
- Fonte `h1` reduzida de `1.85rem â†’ 1.35rem`
- `margin-bottom` reduzido de `2rem â†’ 0.75rem`
- SubtÃ­tulo `p` reduzido de `0.95rem â†’ 0.85rem`
- BotÃ£o de aÃ§Ã£o principal compactado: `padding: 8px 16px; font-size: 0.85rem`

### Cards de EstatÃ­sticas
- `padding: 1.25rem â†’ 0.5rem 0.85rem`
- `border-radius: 16px â†’ 10px`
- `box-shadow` suavizado
- Ãcone: `48px â†’ 34px`, `border-radius: 12px â†’ 8px`
- Valor numÃ©rico: `1.5rem â†’ 1.2rem`
- RÃ³tulo: `0.75rem â†’ 0.65rem`
- Gap entre cards: `1.25rem â†’ 0.75rem`
- Margem inferior: `2rem â†’ 0.75rem`

### Tabelas (PrimeNG e nativas)
- `th padding: 1.1rem 1.5rem â†’ 0.75rem 1rem`
- `td padding: 1rem 1.5rem â†’ 0.65rem 1rem`
- Fonte `th`: `0.75rem â†’ 0.70rem`

### Dashboard â€” Especificidades
- Grid de grÃ¡ficos: `gap: 24px â†’ 0.75rem`
- Cards de grÃ¡fico: `padding cabeÃ§alho: 24px â†’ 0.5rem 0.85rem`
- Atividades recentes: `padding: 16px 24px â†’ 0.6rem 0.85rem`
- Ãcones de atividade: `36px â†’ 28px`
- `min-height` do chart wrapper: `350px â†’ 280px`

### ManutenÃ§Ã£o â€” Especificidades
- `:host padding: 24px â†’ 12px 16px`
- Cards de status (sum-cards): `padding: 16px â†’ 0.5rem 0.85rem`
- Valor dos sum-cards: `1.9rem â†’ 1.25rem`
- Toolbar: `padding: 16px 20px â†’ 0.65rem 1rem`

---

## ðŸ“Ž Relacionado

- [[Melhorias Visuais e Filtros - Mai 2026]]
- [[atlas V2 - Mapa de ConteÃºdo]]



