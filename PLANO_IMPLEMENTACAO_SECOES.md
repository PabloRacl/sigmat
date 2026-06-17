# Plano de Implementação - Visibilidade por Seção e Batalhão

## Objetivo
Garantir que a visibilidade de equipamentos e relatórios respeite as regras de negócio por perfil:
- `ADMIN_DTEC` vê todos os equipamentos e todas as seções.
- `DIRETORIA` vê as seções e equipamentos da sua diretoria e dos batalhões subordinados.
- `USUARIO_BATALHAO` / `COMANDANTE` vê todos os equipamentos do próprio batalhão, independentemente da seção interna.

## Problema atual
- O backend já filtra equipamentos por seção e batalhão, mas ainda falta robustez na regra de negócio para seções internas.
- O frontend carrega todas as seções sem aplicar o contexto do usuário.
- Não existe um fluxo explícito de CRUD de seções restrito por batalhão e diretoria.

## Escopo da entrega
1. Backend: endpoint(s) de seções contextualizados por perfil.
2. Backend: regras de autorização reutilizáveis para `secaoId` e `batalhaoId`.
3. Frontend: dropdowns e filtros de seção mostrando apenas opções permitidas.
4. Frontend: página de gestão de seções para usuários com permissão.
5. Testes: validação de visibilidade por perfil e filtros de seção.

## Regras de negócio detalhadas

### ADMIN_DTEC
- vê todas as seções e equipamentos.
- pode criar/editar/deletar seções em qualquer batalhão.

### DIRETORIA
- vê todas as seções da diretoria.
- vê também as seções de batalhões subordinados à diretoria.
- pode criar/editar seções apenas para batalhões da sua diretoria.

### USUARIO_BATALHAO / COMANDANTE
- vê todas as seções do próprio batalhão.
- vê todos os equipamentos do próprio batalhão, mesmo se estiverem em seções diferentes.
- pode criar/editar seções apenas dentro do seu batalhão.
- pode atribuir/mover equipamentos apenas para seções do batalhão.

## Implementação técnica

### Backend
1. Adicionar endpoints de CRUD para seções em `atlas-backend/src/modules/settings`.
2. Atualizar `SettingsService.listarSecoes()` para retornar apenas seções permitidas ao usuário:
   - ADMIN: todas.
   - DIRETORIA: seções da diretoria e seções de batalhões subordinados.
   - BATALHÃO: seções do batalhão.
3. Criar utilitário/serviço para calcular `secoesPermitidas` e `batalhaoPermitido` a partir do usuário.
4. Reutilizar essa mesma regra em `EquipmentService.listarTodos()`, `ReportsService`, `DashboardService`, `UsersService` e `MaintenanceService`.
5. Validar em `EquipmentService.criar()` e `atualizar()` que o `secaoId` pertence à unidade correta.
6. Garantir que filtros de relatório e dashboard respeitem o contexto do usuário e não retornem seções/batalhões não permitidos.
7. Proteger os endpoints de gerenciamento de seção com `JwtAuthGuard` e `RolesGuard`.

### Frontend
1. Ajustar `SettingsService.listarSecoes()` para consumir o backend filtrado por permissão.
2. Atualizar `equipment-form.component.ts/html` para exibir apenas seções permitidas no dropdown.
3. Atualizar `equipment-list.component.ts/html` e `reports.component.ts/html` para usar a lista de seções contextualizada e evitar filtros inválidos.
4. Criar uma página de gestão de seções com criação/edição, com batalhão selecionável apenas quando permitido.
5. Ajustar o menu e as permissões de UI para esconder opções quando o perfil não tiver acesso.

## Testes necessários
- Backend: `GET /configuracoes/secoes` por `ADMIN_DTEC`, `DIRETORIA` e `USUARIO_BATALHAO`.
- Backend: criação/edição de seção em batalhão permitido e rejeição em batalhão proibido.
- Backend: filtro de equipamento por `secaoId` com usuário de batalhão e diretoria.
- Frontend: dropdown de seção só mostra seções permitidas.
- Frontend: usuário de batalhão não visualiza seções de outros batalhões.

## Passo a passo imediato
1. Implementar o endpoint de seções condicionado ao perfil.
2. Revisar `EquipmentService.listarTodos()` para consolidar a regra de visibilidade.
3. Ajustar os formulários e filtros do frontend para o contexto do usuário.
4. Validar com testes e casos reais de `USUARIO_BATALHAO`, `DIRETORIA` e `ADMIN_DTEC`.

## Próximo passo sugerido
Começar pela camada backend de `SettingsService` / `SettingsController`, porque essa regra de visibilidade afeta todos os filtros e formulários subsequentes.
