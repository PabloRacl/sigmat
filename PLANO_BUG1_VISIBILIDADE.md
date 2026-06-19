# ðŸ“‹ Plano de ImplementaÃ§Ã£o - BUG1: Visibilidade de RelatÃ³rios

## ðŸ” Problema Identificado

O mÃ©todo `buildVisibilityConditions()` no `ReportsService` tem lÃ³gica de permissÃ£o confusa e incompleta, causando que usuÃ¡rios nÃ£o-admin nÃ£o veem corretamente os equipamentos relacionados ao batalhÃ£o ou diretoria ao qual pertencem.

## ðŸ“ Regras de NegÃ³cio (definidas pelo usuÃ¡rio)

| Perfil | Visibilidade | EdiÃ§Ã£o |
|--------|-------------|--------|
| **ADMIN_DTEC** | VÃª TUDO | Pode editar tudo |
| **DIRETORIA** | VÃª todos os batalhÃµes vinculados Ã  sua diretoria + sua prÃ³pria seÃ§Ã£o | NÃ£o pode editar batalhÃµes de outras diretorias, apenas a sua prÃ³pria seÃ§Ã£o |
| **COMANDANTE** | VÃª apenas equipamentos vinculados Ã  sua unidade (batalhÃ£o) | Aprova mudanÃ§as da sua unidade |
| **USUARIO_BATALHAO** | VÃª tudo sobre o seu batalhÃ£o | Depende de aprovaÃ§Ã£o do comandante para mudanÃ§as |

## ðŸ—ï¸ Estrutura Organizacional (Modelo)

```
Diretoria
â”œâ”€â”€ BatalhÃ£o 1
â”‚   â”œâ”€â”€ SeÃ§Ã£o 1.1
â”‚   â”œâ”€â”€ SeÃ§Ã£o 1.2
â”‚   â””â”€â”€ SeÃ§Ã£o 1.3
â”œâ”€â”€ BatalhÃ£o 2
â”‚   â”œâ”€â”€ SeÃ§Ã£o 2.1
â”‚   â””â”€â”€ SeÃ§Ã£o 2.2
â””â”€â”€ SeÃ§Ã£o Interna da Diretoria (sem batalhÃ£o)
```

**Regras do modelo:**
- Cada batalhÃ£o pode ter vÃ¡rias seÃ§Ãµes, todas pertencentes ao mesmo batalhÃ£o
- Todos os batalhÃµes pertencem a uma diretoria
- Diretoria pode ter seÃ§Ã£o interna (sem batalhÃ£o vinculado)
- `Secao.batalhaoId` e `Secao.diretoriaId` sÃ£o opcionais (mutualmente exclusivos na prÃ¡tica)

## âŒ Problemas no CÃ³digo Atual

### 1. `buildVisibilityConditions()` - LÃ³gica confusa e incompleta
- NÃ£o trata perfil `COMANDANTE` separadamente
- LÃ³gica de `OR` para `USUARIO_BATALHAO` estÃ¡ ambÃ­gua (pode puxar dados de outros batalhÃµes com mesma diretoria)
- NÃ£o considera `secoesPermitidas` corretamente para todos os perfis
- Faltam filtros para diretoria que tem seÃ§Ã£o interna

### 2. `buildTransferVisibility()` - Mesmos problemas
- NÃ£o trata `COMANDANTE` separadamente
- LÃ³gica de transferÃªncia nÃ£o respeita hierarquia corretamente

### 3. `logsAuditoria()` - Filtros de visibilidade inconsistentes
- Mesma lÃ³gica problemÃ¡tica de visibilidade
- NÃ£o garante consistÃªncia com os outros mÃ©todos

## âœ… Plano de CorreÃ§Ã£o

### Fase 1: Criar serviÃ§o de permissÃµes dedicado

**Arquivo novo:** `atlas-backend/src/modulos/compartilhado/permissoes.service.ts`

```typescript
@Injectable()
export class PermissoesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna as condiÃ§Ãµes de visibilidade para relatÃ³rios de equipamentos
   * Retorna array de condiÃ§Ãµes Prisma para uso em WHERE .AND[]
   */
  async buildVisibilityConditionsEquipamento(usuario: any): Promise<any[]>
  
  /**
   * Retorna condiÃ§Ãµes de visibilidade para transferÃªncias
   */
  async buildVisibilityConditionsTransferencia(usuario: any): Promise<any>
  
  /**
   * Retorna condiÃ§Ãµes de visibilidade para logs de auditoria
   */
  async buildVisibilityConditionsAuditoria(usuario: any): Promise<any>
  
  /**
   * Verifica se usuÃ¡rio pode editar um equipamento especÃ­fico
   */
  async podeEditarEquipamento(usuario: any, equipamentoId: number): Promise<boolean>
  
  /**
   * Verifica se usuÃ¡rio pode aprovar mudanÃ§as para um equipamento
   */
  async podeAprovarEquipamento(usuario: any, equipamentoId: number): Promise<boolean>
  
  /**
   * ObtÃ©m dados completos do usuÃ¡rio com hierarquia
   */
  private async obterUsuarioComHierarquia(usuarioId: number): Promise<any>
}
```

### Fase 2: Implementar lÃ³gica de visibilidade por perfil

#### Regras por perfil (implementaÃ§Ã£o):

**ADMIN_DTEC:**
```typescript
// Retorna [] (sem filtros - vÃª tudo)
return [];
```

**DIRETORIA:**
```typescript
// 1. Todas as seÃ§Ãµes vinculadas diretamente Ã  diretoria do usuÃ¡rio
// 2. Todas as seÃ§Ãµes dos batalhÃµes vinculados Ã  diretoria do usuÃ¡rio
// 3. As seÃ§Ãµes permitidas adicionalmente (secoesPermitidas)
const diretoriaId = usuario.secao?.diretoriaId || usuario.batalhao?.diretoriaId;

return [
  {
    OR: [
      { secao: { diretoriaId: diretoriaId } },
      { secao: { batalhao: { diretoriaId: diretoriaId } } },
      { secaoId: { in: secoesPermitidasIds } }
    ]
  }
];
```

**COMANDANTE:**
```typescript
// 1. Apenas o batalhÃ£o do comandante
// 2. Todas as seÃ§Ãµes desse batalhÃ£o
// 3. As seÃ§Ãµes permitidas adicionalmente
const batalhaoId = usuario.batalhaoId || usuario.secao?.batalhaoId;

return [
  {
    OR: [
      { secao: { batalhaoId: batalhaoId } },
      { secaoId: { in: secoesPermitidasIds } }
    ]
  }
];
```

**USUARIO_BATALHAO:**
```typescript
// 1. Apenas o batalhÃ£o do usuÃ¡rio
// 2. As seÃ§Ãµes permitidas adicionalmente
const batalhaoId = usuario.batalhaoId || usuario.secao?.batalhaoId;
const secoesIds = [usuario.secaoId, ...secoesPermitidasIds].filter(Boolean);

return [
  {
    OR: [
      { secao: { batalhaoId: batalhaoId } },
      { secaoId: { in: secoesIds } }
    ]
  }
];
```

### Fase 3: Atualizar ReportsService

**Arquivo:** `atlas-backend/src/modulos/relatorios/relatorios.service.ts`

1. Remover mÃ©todos `buildVisibilityConditions()` e `buildTransferVisibility()`
2. Injetar `PermissoesService`
3. Atualizar `inventarioGeral()` para usar novo serviÃ§o
4. Atualizar `transferencias()` para usar novo serviÃ§o
5. Atualizar `logsAuditoria()` para usar novo serviÃ§o

### Fase 4: Tipagem forte (substituir `any`)

**Arquivo novo:** `atlas-backend/src/modulos/relatorios/dtos/`

```
relatorios/
â”œâ”€â”€ dtos/
â”‚   â”œâ”€â”€ inventario-filtros.dto.ts
â”‚   â”œâ”€â”€ transferencias-filtros.dto.ts
â”‚   â”œâ”€â”€ auditoria-filtros.dto.ts
â”‚   â””â”€â”€ resposta-inventario.dto.ts
```

### Fase 5: Testes

**Arquivo novo:** `atlas-backend/src/modulos/relatorios/relatorios.service.spec.ts`

Testar cada perfil:
- [ ] ADMIN_DTEC vÃª todos os equipamentos (sem filtros)
- [ ] DIRETORIA vÃª todos os batalhÃµes da sua diretoria + sua seÃ§Ã£o
- [ ] COMANDANTE vÃª apenas equipamentos do seu batalhÃ£o
- [ ] USUARIO_BATALHAO vÃª apenas equipamentos do seu batalhÃ£o
- [ ] UsuÃ¡rio com seÃ§Ãµes permitidas extras vÃª alÃ©m do seu batalhÃ£o
- [ ] Diretoria com seÃ§Ã£o interna vÃª equipamentos da seÃ§Ã£o

## ðŸ“ Checklist de ImplementaÃ§Ã£o

- [ ] **Fase 1:** Criar `permissoes.service.ts` na pasta `compartilhado`
- [ ] **Fase 2:** Implementar lÃ³gica de visibilidade para cada perfil
- [ ] **Fase 3:** Atualizar `ReportsService` para usar `PermissoesService`
- [ ] **Fase 4:** Criar DTOs de filtro tipados
- [ ] **Fase 5:** Criar testes unitÃ¡rios para cada perfil
- [ ] **Fase 6:** Testes manuais com dados reais
- [ ] **Fase 7:** Atualizar `IMPLEMENTAR.md` com progresso

## âš ï¸ ConsideraÃ§Ãµes Importantes

1. **NÃ£o quebrar compatibilidade:** Manter nomes de campos respondidos ao frontend
2. **Performance:** Usar `select` estrito em queries para evitar carregar JSON pesado
3. **SeguranÃ§a:** Nunca confiar no `secaoId` enviado pelo frontend - sempre validar via backend
4. **secoesPermitidas:** UsuÃ¡rios podem ter acesso a seÃ§Ãµes adicionais via tabela `UsuarioSecao`

## ðŸš€ Ordem de ExecuÃ§Ã£o Recomendada

1. Criar `PermissoesService` (passo 1-2)
2. Atualizar `ReportsService` (passo 3)
3. Criar DTOs (passo 4)
4. Criar testes (passo 5)
5. Testes manuais (passo 6-7)
