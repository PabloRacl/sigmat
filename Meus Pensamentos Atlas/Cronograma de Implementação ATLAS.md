# Cronograma de ImplementaÃ§Ã£o atlas

Este cronograma organiza todas as recomendaÃ§Ãµes para tornar o atlas mais profissional, seguro e completo.

## VisÃ£o geral
- Objetivo: estabilizar o modelo de dados e workflow de aprovaÃ§Ã£o, depois avanÃ§ar para seguranÃ§a, qualidade, frontend e deploy.
- MÃ©todo: dividir em fases e concluir uma por vez.
- Tempo sugerido: 5 a 7 semanas, dependendo do ritmo da equipe.

---

## Fase 0 â€” PreparaÃ§Ã£o e organizaÃ§Ã£o (jÃ¡ feito)
- [x] Organizar o vault Obsidian e criar o MOC principal.
- [x] Criar template de nota e README do vault.
- [x] Reorganizar documentaÃ§Ã£o em pastas por Ã¡rea.
- [x] Ajustar nomes de arquivos para refletir conteÃºdo.

---

## Fase 1 â€” Estabilizar Modelo de Dados e Workflow de AprovaÃ§Ã£o
### Objetivo
Criar bases sÃ³lidas para o cadastro, validaÃ§Ã£o e aprovaÃ§Ã£o de alteraÃ§Ãµes de equipamentos.

### EntregÃ¡veis
- Modelo Prisma/BD consistente e normalizado.
- Tabelas para `Equipamento`, `Usuario`, `Secao`, `Status`, `Disponibilidade`, `AlteracaoPendente` e `LogOperacao`.
- Endpoint de criaÃ§Ã£o de pendÃªncia de aprovaÃ§Ã£o.
- Endpoint de listagem de pendÃªncias.
- Endpoint de decisÃ£o (aprovar/negar).
- Registro de auditoria para cada operaÃ§Ã£o.

### Tarefas
1. Definir os campos sensÃ­veis que exigem aprovaÃ§Ã£o.
2. Ajustar schema Prisma com `AlteracaoPendente` e `LogOperacao`.
3. Implementar service NestJS para gerar e processar pendÃªncias.
4. Criar DTOs e validaÃ§Ã£o usando `class-validator`.
5. Ajustar lÃ³gica de atualizaÃ§Ã£o de equipamento para criar pendÃªncia quando necessÃ¡rio.
6. Testar o fluxo com casos reais de ediÃ§Ã£o e aprovaÃ§Ã£o.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 2 â€” SeguranÃ§a e Controle de Acesso
### Objetivo
Garantir que o acesso ao sistema e a aprovaÃ§Ã£o de operaÃ§Ãµes seja controlado por perfis claros.

### EntregÃ¡veis
- AutenticaÃ§Ã£o JWT robusta.
- Perfis de usuÃ¡rio definidos (`ADMIN`, `COMANDANTE`, `USUARIO_BATALHAO`).
- Guardas no NestJS para proteger endpoints.
- VerificaÃ§Ã£o de permissÃ£o no frontend.

### Tarefas
1. Revisar e padronizar perfis de usuÃ¡rio.
2. Proteger endpoints de criaÃ§Ã£o/listagem/decisÃ£o de pendÃªncias.
3. Validar entradas no backend e no frontend.
4. Implementar mensagens claras de erro e autorizaÃ§Ã£o.
5. Documentar regras de acesso.

### Tempo estimado
- 1 semana

---

## Fase 3 â€” Qualidade de Software e Testes
### Objetivo
Elevar a confiabilidade do sistema com testes e integraÃ§Ã£o contÃ­nua.

### EntregÃ¡veis
- Unit tests para services e components.
- Testes de integraÃ§Ã£o para API e Prisma.
- Testes e2e para fluxos crÃ­ticos.
- Pipeline de CI executando lint/build/test.

### Tarefas
1. Definir cobertura mÃ­nima para os mÃ³dulos crÃ­ticos.
2. Criar testes unitÃ¡rios para backend e frontend.
3. Criar testes de integraÃ§Ã£o para pontos de aprovaÃ§Ã£o.
4. Adicionar CI (GitHub Actions ou equivalente).
5. Adicionar lint e formataÃ§Ã£o automÃ¡tica.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 4 â€” UX, Frontend e RelatÃ³rios
### Objetivo
Tornar o uso mais fÃ¡cil e fortalecer a experiÃªncia visual e funcional.

### EntregÃ¡veis
- Interface clara para ediÃ§Ã£o e aprovaÃ§Ã£o.
- Feedback visual de pendÃªncias.
- Dashboard e relatÃ³rios de inventÃ¡rio.
- ExportaÃ§Ã£o de informaÃ§Ãµes (CSV/PDF).

### Tarefas
1. Ajustar telas de ediÃ§Ã£o e detalhes de equipamento.
2. Criar views rÃ¡pidas de pendÃªncias do usuÃ¡rio e do aprovador.
3. Melhorar navegaÃ§Ã£o e consistÃªncia visual.
4. Acrescentar relatÃ³rios de auditoria e inventÃ¡rio.
5. Validar design com usuÃ¡rios ou stakeholders.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 5 â€” Deploy, DocumentaÃ§Ã£o e OperaÃ§Ã£o
### Objetivo
Produzir um ambiente de produÃ§Ã£o confiÃ¡vel e documentaÃ§Ã£o operacional.

### EntregÃ¡veis
- Deploy automatizado.
- Ambiente de homologaÃ§Ã£o e produÃ§Ã£o separados.
- DocumentaÃ§Ã£o de instalaÃ§Ã£o e operaÃ§Ã£o atualizada.
- Monitoramento bÃ¡sico e backups definidos.

### Tarefas
1. Configurar pipeline de deploy para frontend e backend.
2. Criar documentaÃ§Ã£o de ambiente e variÃ¡veis.
3. Definir rotina de backup e rollback.
4. Preparar checklist de entrega/implantaÃ§Ã£o.
5. Revisar o vault Obsidian com os processos atualizados.

### Tempo estimado
- 1 semana

---

## Como trabalhar por partes
- Parte 1: Fase 1
- Parte 2: Fase 2
- Parte 3: Fase 3
- Parte 4: Fase 4
- Parte 5: Fase 5

Cada parte pode ser quebrada em sprints semanais ou entregas menores.

---

## Prioridade de inÃ­cio
1. Fase 1: modelo de dados + workflow de aprovaÃ§Ã£o
2. Fase 2: seguranÃ§a e perfis
3. Fase 3: testes e CI
4. Fase 4: frontend e relatÃ³rios
5. Fase 5: deploy e documentaÃ§Ã£o final
