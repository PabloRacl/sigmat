# âœ… Checklist de ImplementaÃ§Ã£o - atlas

## Fase 1: CorreÃ§Ãµes CrÃ­ticas (P0)
- [ ] Criar `ApprovalsRepository` e `LoansRepository`
- [ ] Otimizar `AuditService` para evitar N+1 queries
- [ ] Remover rota `debug-ping` de produÃ§Ã£o

## Fase 2: Qualidade de CÃ³digo (P1)
- [ ] Substituir `any` por interfaces tipadas
- [ ] Extrair lÃ³gica de permissÃ£o para `PermissionsService`
- [ ] Melhorar filtragem de notificaÃ§Ãµes WebSocket

## Fase 3: RefatoraÃ§Ã£o de AutenticaÃ§Ã£o (Foco Atual)
- [ ] Avaliar cÃ³digo do colega (SGA + LDAP)
- [ ] Padronizar linguagem e nomenclatura
- [ ] Criar plano de implementaÃ§Ã£o do login autenticado

## Fase 4: Infraestrutura (P2)
- [ ] Mover uploads para S3
- [ ] Migrar seeds para JSON/SQL
- [ ] Adicionar testes unitÃ¡rios
