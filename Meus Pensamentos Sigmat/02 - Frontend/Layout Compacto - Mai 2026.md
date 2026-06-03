# Layout Compacto — Todas as Páginas (Mai 2026)

> **Data:** 25/05/2026  
> **Tipo:** Melhoria Visual / UX  
> **Escopo:** Frontend — todas as páginas do SIGMAT  

---

## 🎯 Objetivo

Aplicar um layout **denso e compacto** em todas as telas do sistema, priorizando o conteúdo principal (tabelas, gráficos e dados) em vez dos cabeçalhos e cards de estatísticas.

A mudança foi motivada pela necessidade de maximizar o espaço útil da tela, especialmente em monitores com resolução padrão (1366x768 e 1920x1080), onde os cabeçalhos grandes consumiam uma parte significativa da área visível.

---

## 📐 Padrão Aplicado

O mesmo padrão compacto foi padronizado em **todas as 9 páginas** do sistema:

| Elemento              | Antes       | Depois      | Redução |
|-----------------------|-------------|-------------|---------|
| Título da página (`h1`) | `1.85rem` | `1.35rem`   | ~27%    |
| Margem inferior do header | `2rem` | `0.75rem`   | ~62%    |
| Padding dos stat cards  | `1.25rem` | `0.5rem 0.85rem` | ~60% |
| Tamanho dos ícones nos cards | `48px` | `34px`  | ~29%    |
| Padding das células da tabela | `1rem 1.5rem` | `0.65rem 1rem` | ~35% |
| Fonte cabeçalho de coluna | `0.75rem` | `0.70rem` | ~7%  |
| Gap entre stat cards    | `1.25rem`   | `0.75rem`   | ~40%    |

---

## 🗂️ Páginas Alteradas

| Página                    | Componente SCSS                          |
|---------------------------|------------------------------------------|
| Visão Geral (Dashboard)   | `dashboard-home.component.scss`          |
| Equipamentos              | `equipment-list.component.scss`          |
| Cautelas Diárias          | `loans-management.component.scss`        |
| Usuários                  | `users-list.component.scss`              |
| Transferência de Unidade  | `transfers-list.component.scss`          |
| Manutenção                | `maintenance-list.component.scss`        |
| Aprovações                | `approvals-list.component.scss`          |
| Relatórios                | `reports.component.scss`                 |
| Auditoria                 | `audit-logs.component.scss`              |

---

## 🛠️ Alterações Técnicas por Tipo

### Cabeçalhos de Página
- Fonte `h1` reduzida de `1.85rem → 1.35rem`
- `margin-bottom` reduzido de `2rem → 0.75rem`
- Subtítulo `p` reduzido de `0.95rem → 0.85rem`
- Botão de ação principal compactado: `padding: 8px 16px; font-size: 0.85rem`

### Cards de Estatísticas
- `padding: 1.25rem → 0.5rem 0.85rem`
- `border-radius: 16px → 10px`
- `box-shadow` suavizado
- Ícone: `48px → 34px`, `border-radius: 12px → 8px`
- Valor numérico: `1.5rem → 1.2rem`
- Rótulo: `0.75rem → 0.65rem`
- Gap entre cards: `1.25rem → 0.75rem`
- Margem inferior: `2rem → 0.75rem`

### Tabelas (PrimeNG e nativas)
- `th padding: 1.1rem 1.5rem → 0.75rem 1rem`
- `td padding: 1rem 1.5rem → 0.65rem 1rem`
- Fonte `th`: `0.75rem → 0.70rem`

### Dashboard — Especificidades
- Grid de gráficos: `gap: 24px → 0.75rem`
- Cards de gráfico: `padding cabeçalho: 24px → 0.5rem 0.85rem`
- Atividades recentes: `padding: 16px 24px → 0.6rem 0.85rem`
- Ícones de atividade: `36px → 28px`
- `min-height` do chart wrapper: `350px → 280px`

### Manutenção — Especificidades
- `:host padding: 24px → 12px 16px`
- Cards de status (sum-cards): `padding: 16px → 0.5rem 0.85rem`
- Valor dos sum-cards: `1.9rem → 1.25rem`
- Toolbar: `padding: 16px 20px → 0.65rem 1rem`

---

## 📎 Relacionado

- [[Melhorias Visuais e Filtros - Mai 2026]]
- [[SIGMAT V2 - Mapa de Conteúdo]]



