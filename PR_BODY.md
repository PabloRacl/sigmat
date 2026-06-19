Resumo

Este PR contÃ©m correÃ§Ãµes e migraÃ§Ãµes relacionadas ao PrimeNG e pequenas correÃ§Ãµes de decoradores:

- Corrige `styleUrl` â†’ `styleUrls` em mÃºltiplos componentes.
- MigraÃ§Ãµes PrimeNG: `p-dropdown` â†’ `p-select`, `pInputTextarea` â†’ `pTextarea`, `TabView` â†’ `TabsModule`/`p-tabs` quando aplicÃ¡vel.
- VerificaÃ§Ã£o e compatibilidade do `p-datepicker` (propriedades usadas mantidas).
- AtualizaÃ§Ãµes pontuais de estilos `.scss` para classes novas do Select.

Principais arquivos alterados

- VÃ¡rios componentes em `src/app/features/*` (corrigidos decoradores e templates).
- Ajustes em `src/app/features/*/*.scss` relacionados a `.p-select`.

Checklist (para revisÃ£o)

- [x] Build (`npx ng build --configuration development`) concluÃ­do localmente
- [x] Testes unitÃ¡rios (`npx ng test --watch=false --browsers=ChromeHeadless`) passando
- [ ] Revisar manualmente fluxo de AprovaÃ§Ãµes (`approvals`) â€” receber/aprovar/negar
- [ ] Verificar telas responsivas e estilos apÃ³s migraÃ§Ã£o

InstruÃ§Ãµes de teste rÃ¡pido

1. Instalar dependÃªncias:

```bash
cd atlas-frontend
npm ci
```

2. Rodar build:

```bash
npx ng build --configuration development
```

3. Rodar testes unitÃ¡rios:

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

4. Rodar a aplicaÃ§Ã£o em dev e testar fluxos principais (AprovaÃ§Ãµes, EmprÃ©stimos, TransferÃªncias):

```bash
npx ng serve
```

Impacto

- MigraÃ§Ã£o de componentes PrimeNG para versÃ£o compatÃ­vel com o frontend atual.
- CorreÃ§Ãµes de decoradores Angular (`styleUrl` â†’ `styleUrls`) para evitar erros de compilaÃ§Ã£o.
- Ajustes de estilo no SCSS para manter a aparÃªncia dos selects migrados.
- Nenhuma alteraÃ§Ã£o no backend ou contratos de API.

VerificaÃ§Ãµes adicionais

- [ ] Validar carregamento e comportamento dos novos `p-select` em todos os formulÃ¡rios.
- [ ] Confirmar navegaÃ§Ã£o/responsividade nos `p-tabs` migrados de `TabView`.
- [ ] Revisar visual do `p-datepicker` e dos campos `pTextarea` com classes existentes.

Melhorias e prÃ³xima fase

- Exibir no cabeÃ§alho do usuÃ¡rio o vÃ­nculo ao batalhÃ£o ou Ã  diretoria: se for diretorias, mostrar apenas a diretoria; se for batalhÃ£o, mostrar apenas o batalhÃ£o.
- Evoluir arquitetura do backend com mÃ³dulos bem delimitados (`auth`, `equipamentos`, `workflow`, `relatÃ³rios`, `auditoria`).
- Garantir camada de serviÃ§os isolada de `controller` e `Prisma`, com DTOs/validation pipes no NestJS e tipos/interfaces no Angular.
- Padronizar erros, validaÃ§Ãµes e nomenclatura em todo o cÃ³digo.
- Adicionar testes unitÃ¡rios, de integraÃ§Ã£o e E2E para fluxos crÃ­ticos.
- Configurar CI para rodar lint, build e testes automaticamente.
- Revisar autenticaÃ§Ã£o/autorizaÃ§Ã£o JWT, roles/perfis e proteÃ§Ã£o de endpoints.
- Auditar dados, migraÃ§Ãµes Prisma, Ã­ndices e histÃ³rico de auditoria.
- Melhorar UX com formulÃ¡rio, feedback, acessibilidade e consistÃªncia visual.
- Documentar arquitetura, endpoints, modelo de dados e deploy.

Problemas conhecidos

- UsuÃ¡rios que nÃ£o sÃ£o admin nÃ£o estÃ£o visualizando corretamente no relatÃ³rio os equipamentos do batalhÃ£o ou diretoria a que pertencem.
- RelatÃ³rios estÃ£o lentos com poucos dados; Ã© necessÃ¡rio otimizar consultas e paginaÃ§Ã£o antes que o histÃ³rico cresÃ§a.

ObservaÃ§Ãµes

- NÃ£o foram alteradas APIs de backend; mudanÃ§as sÃ£o restritas ao frontend e testes adicionados/ajustados.
