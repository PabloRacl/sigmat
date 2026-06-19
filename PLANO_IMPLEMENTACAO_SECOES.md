# Plano de ImplementaÃ§Ã£o - Visibilidade por SeÃ§Ã£o e BatalhÃ£o

## Objetivo
Garantir que a visibilidade de equipamentos e relatÃ³rios respeite as regras de negÃ³cio por perfil:
- `ADMIN_DTEC` vÃª todos os equipamentos e todas as seÃ§Ãµes.
- `DIRETORIA` vÃª as seÃ§Ãµes e equipamentos da sua diretoria e dos batalhÃµes subordinados.
- `USUARIO_BATALHAO` / `COMANDANTE` vÃª todos os equipamentos do prÃ³prio batalhÃ£o, independentemente da seÃ§Ã£o interna.

## Problema atual
- O backend jÃ¡ filtra equipamentos por seÃ§Ã£o e batalhÃ£o, mas ainda falta robustez na regra de negÃ³cio para seÃ§Ãµes internas.
- O frontend carrega todas as seÃ§Ãµes sem aplicar o contexto do usuÃ¡rio.
- NÃ£o existe um fluxo explÃ­cito de CRUD de seÃ§Ãµes restrito por batalhÃ£o e diretoria.

## Escopo da entrega
1. Backend: endpoint(s) de seÃ§Ãµes contextualizados por perfil.
2. Backend: regras de autorizaÃ§Ã£o reutilizÃ¡veis para `secaoId` e `batalhaoId`.
3. Frontend: dropdowns e filtros de seÃ§Ã£o mostrando apenas opÃ§Ãµes permitidas.
4. Frontend: pÃ¡gina de gestÃ£o de seÃ§Ãµes para usuÃ¡rios com permissÃ£o.
5. Testes: validaÃ§Ã£o de visibilidade por perfil e filtros de seÃ§Ã£o.

## Regras de negÃ³cio detalhadas

### ADMIN_DTEC
- vÃª todas as seÃ§Ãµes e equipamentos.
- pode criar/editar/deletar seÃ§Ãµes em qualquer batalhÃ£o.

### DIRETORIA
- vÃª todas as seÃ§Ãµes da diretoria.
- vÃª tambÃ©m as seÃ§Ãµes de batalhÃµes subordinados Ã  diretoria.
- pode criar/editar seÃ§Ãµes apenas para batalhÃµes da sua diretoria.

### USUARIO_BATALHAO / COMANDANTE
- vÃª todas as seÃ§Ãµes do prÃ³prio batalhÃ£o.
- vÃª todos os equipamentos do prÃ³prio batalhÃ£o, mesmo se estiverem em seÃ§Ãµes diferentes.
- pode criar/editar seÃ§Ãµes apenas dentro do seu batalhÃ£o.
- pode atribuir/mover equipamentos apenas para seÃ§Ãµes do batalhÃ£o.

## ImplementaÃ§Ã£o tÃ©cnica

### Backend
1. Adicionar endpoints de CRUD para seÃ§Ãµes em `atlas-backend/src/modules/settings`.
2. Atualizar `SettingsService.listarSecoes()` para retornar apenas seÃ§Ãµes permitidas ao usuÃ¡rio:
   - ADMIN: todas.
   - DIRETORIA: seÃ§Ãµes da diretoria e seÃ§Ãµes de batalhÃµes subordinados.
   - BATALHÃƒO: seÃ§Ãµes do batalhÃ£o.
3. Criar utilitÃ¡rio/serviÃ§o para calcular `secoesPermitidas` e `batalhaoPermitido` a partir do usuÃ¡rio.
4. Reutilizar essa mesma regra em `EquipmentService.listarTodos()`, `ReportsService`, `DashboardService`, `UsersService` e `MaintenanceService`.
5. Validar em `EquipmentService.criar()` e `atualizar()` que o `secaoId` pertence Ã  unidade correta.
6. Garantir que filtros de relatÃ³rio e dashboard respeitem o contexto do usuÃ¡rio e nÃ£o retornem seÃ§Ãµes/batalhÃµes nÃ£o permitidos.
7. Proteger os endpoints de gerenciamento de seÃ§Ã£o com `JwtAuthGuard` e `RolesGuard`.

### Frontend
1. Ajustar `SettingsService.listarSecoes()` para consumir o backend filtrado por permissÃ£o.
2. Atualizar `equipment-form.component.ts/html` para exibir apenas seÃ§Ãµes permitidas no dropdown.
3. Atualizar `equipment-list.component.ts/html` e `reports.component.ts/html` para usar a lista de seÃ§Ãµes contextualizada e evitar filtros invÃ¡lidos.
4. Criar uma pÃ¡gina de gestÃ£o de seÃ§Ãµes com criaÃ§Ã£o/ediÃ§Ã£o, com batalhÃ£o selecionÃ¡vel apenas quando permitido.
5. Ajustar o menu e as permissÃµes de UI para esconder opÃ§Ãµes quando o perfil nÃ£o tiver acesso.

## Testes necessÃ¡rios
- Backend: `GET /configuracoes/secoes` por `ADMIN_DTEC`, `DIRETORIA` e `USUARIO_BATALHAO`.
- Backend: criaÃ§Ã£o/ediÃ§Ã£o de seÃ§Ã£o em batalhÃ£o permitido e rejeiÃ§Ã£o em batalhÃ£o proibido.
- Backend: filtro de equipamento por `secaoId` com usuÃ¡rio de batalhÃ£o e diretoria.
- Frontend: dropdown de seÃ§Ã£o sÃ³ mostra seÃ§Ãµes permitidas.
- Frontend: usuÃ¡rio de batalhÃ£o nÃ£o visualiza seÃ§Ãµes de outros batalhÃµes.

## Passo a passo imediato
1. Implementar o endpoint de seÃ§Ãµes condicionado ao perfil.
2. Revisar `EquipmentService.listarTodos()` para consolidar a regra de visibilidade.
3. Ajustar os formulÃ¡rios e filtros do frontend para o contexto do usuÃ¡rio.
4. Validar com testes e casos reais de `USUARIO_BATALHAO`, `DIRETORIA` e `ADMIN_DTEC`.

## PrÃ³ximo passo sugerido
ComeÃ§ar pela camada backend de `SettingsService` / `SettingsController`, porque essa regra de visibilidade afeta todos os filtros e formulÃ¡rios subsequentes.
