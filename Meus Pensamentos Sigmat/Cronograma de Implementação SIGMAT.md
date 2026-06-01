# Cronograma de Implementação SIGMAT

Este cronograma organiza todas as recomendações para tornar o SIGMAT mais profissional, seguro e completo.

## Visão geral
- Objetivo: estabilizar o modelo de dados e workflow de aprovação, depois avançar para segurança, qualidade, frontend e deploy.
- Método: dividir em fases e concluir uma por vez.
- Tempo sugerido: 5 a 7 semanas, dependendo do ritmo da equipe.

---

## Fase 0 — Preparação e organização (já feito)
- [x] Organizar o vault Obsidian e criar o MOC principal.
- [x] Criar template de nota e README do vault.
- [x] Reorganizar documentação em pastas por área.
- [x] Ajustar nomes de arquivos para refletir conteúdo.

---

## Fase 1 — Estabilizar Modelo de Dados e Workflow de Aprovação
### Objetivo
Criar bases sólidas para o cadastro, validação e aprovação de alterações de equipamentos.

### Entregáveis
- Modelo Prisma/BD consistente e normalizado.
- Tabelas para `Equipamento`, `Usuario`, `Secao`, `Status`, `Disponibilidade`, `AlteracaoPendente` e `LogOperacao`.
- Endpoint de criação de pendência de aprovação.
- Endpoint de listagem de pendências.
- Endpoint de decisão (aprovar/negar).
- Registro de auditoria para cada operação.

### Tarefas
1. Definir os campos sensíveis que exigem aprovação.
2. Ajustar schema Prisma com `AlteracaoPendente` e `LogOperacao`.
3. Implementar service NestJS para gerar e processar pendências.
4. Criar DTOs e validação usando `class-validator`.
5. Ajustar lógica de atualização de equipamento para criar pendência quando necessário.
6. Testar o fluxo com casos reais de edição e aprovação.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 2 — Segurança e Controle de Acesso
### Objetivo
Garantir que o acesso ao sistema e a aprovação de operações seja controlado por perfis claros.

### Entregáveis
- Autenticação JWT robusta.
- Perfis de usuário definidos (`ADMIN`, `COMANDANTE`, `USUARIO_BATALHAO`).
- Guardas no NestJS para proteger endpoints.
- Verificação de permissão no frontend.

### Tarefas
1. Revisar e padronizar perfis de usuário.
2. Proteger endpoints de criação/listagem/decisão de pendências.
3. Validar entradas no backend e no frontend.
4. Implementar mensagens claras de erro e autorização.
5. Documentar regras de acesso.

### Tempo estimado
- 1 semana

---

## Fase 3 — Qualidade de Software e Testes
### Objetivo
Elevar a confiabilidade do sistema com testes e integração contínua.

### Entregáveis
- Unit tests para services e components.
- Testes de integração para API e Prisma.
- Testes e2e para fluxos críticos.
- Pipeline de CI executando lint/build/test.

### Tarefas
1. Definir cobertura mínima para os módulos críticos.
2. Criar testes unitários para backend e frontend.
3. Criar testes de integração para pontos de aprovação.
4. Adicionar CI (GitHub Actions ou equivalente).
5. Adicionar lint e formatação automática.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 4 — UX, Frontend e Relatórios
### Objetivo
Tornar o uso mais fácil e fortalecer a experiência visual e funcional.

### Entregáveis
- Interface clara para edição e aprovação.
- Feedback visual de pendências.
- Dashboard e relatórios de inventário.
- Exportação de informações (CSV/PDF).

### Tarefas
1. Ajustar telas de edição e detalhes de equipamento.
2. Criar views rápidas de pendências do usuário e do aprovador.
3. Melhorar navegação e consistência visual.
4. Acrescentar relatórios de auditoria e inventário.
5. Validar design com usuários ou stakeholders.

### Tempo estimado
- 1 a 2 semanas

---

## Fase 5 — Deploy, Documentação e Operação
### Objetivo
Produzir um ambiente de produção confiável e documentação operacional.

### Entregáveis
- Deploy automatizado.
- Ambiente de homologação e produção separados.
- Documentação de instalação e operação atualizada.
- Monitoramento básico e backups definidos.

### Tarefas
1. Configurar pipeline de deploy para frontend e backend.
2. Criar documentação de ambiente e variáveis.
3. Definir rotina de backup e rollback.
4. Preparar checklist de entrega/implantação.
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

## Prioridade de início
1. Fase 1: modelo de dados + workflow de aprovação
2. Fase 2: segurança e perfis
3. Fase 3: testes e CI
4. Fase 4: frontend e relatórios
5. Fase 5: deploy e documentação final
