Resumo

Este PR contém correções e migrações relacionadas ao PrimeNG e pequenas correções de decoradores:

- Corrige `styleUrl` → `styleUrls` em múltiplos componentes.
- Migrações PrimeNG: `p-dropdown` → `p-select`, `pInputTextarea` → `pTextarea`, `TabView` → `TabsModule`/`p-tabs` quando aplicável.
- Verificação e compatibilidade do `p-datepicker` (propriedades usadas mantidas).
- Atualizações pontuais de estilos `.scss` para classes novas do Select.

Principais arquivos alterados

- Vários componentes em `src/app/features/*` (corrigidos decoradores e templates).
- Ajustes em `src/app/features/*/*.scss` relacionados a `.p-select`.

Checklist (para revisão)

- [x] Build (`npx ng build --configuration development`) concluído localmente
- [x] Testes unitários (`npx ng test --watch=false --browsers=ChromeHeadless`) passando
- [ ] Revisar manualmente fluxo de Aprovações (`approvals`) — receber/aprovar/negar
- [ ] Verificar telas responsivas e estilos após migração

Instruções de teste rápido

1. Instalar dependências:

```bash
cd atlas-frontend
npm ci
```

2. Rodar build:

```bash
npx ng build --configuration development
```

3. Rodar testes unitários:

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

4. Rodar a aplicação em dev e testar fluxos principais (Aprovações, Empréstimos, Transferências):

```bash
npx ng serve
```

Impacto

- Migração de componentes PrimeNG para versão compatível com o frontend atual.
- Correções de decoradores Angular (`styleUrl` → `styleUrls`) para evitar erros de compilação.
- Ajustes de estilo no SCSS para manter a aparência dos selects migrados.
- Nenhuma alteração no backend ou contratos de API.

Verificações adicionais

- [ ] Validar carregamento e comportamento dos novos `p-select` em todos os formulários.
- [ ] Confirmar navegação/responsividade nos `p-tabs` migrados de `TabView`.
- [ ] Revisar visual do `p-datepicker` e dos campos `pTextarea` com classes existentes.

Melhorias e próxima fase

- Exibir no cabeçalho do usuário o vínculo ao batalhão ou à diretoria: se for diretorias, mostrar apenas a diretoria; se for batalhão, mostrar apenas o batalhão.
- Evoluir arquitetura do backend com módulos bem delimitados (`auth`, `equipamentos`, `workflow`, `relatórios`, `auditoria`).
- Garantir camada de serviços isolada de `controller` e `Prisma`, com DTOs/validation pipes no NestJS e tipos/interfaces no Angular.
- Padronizar erros, validações e nomenclatura em todo o código.
- Adicionar testes unitários, de integração e E2E para fluxos críticos.
- Configurar CI para rodar lint, build e testes automaticamente.
- Revisar autenticação/autorização JWT, roles/perfis e proteção de endpoints.
- Auditar dados, migrações Prisma, índices e histórico de auditoria.
- Melhorar UX com formulário, feedback, acessibilidade e consistência visual.
- Documentar arquitetura, endpoints, modelo de dados e deploy.

Problemas conhecidos

- Usuários que não são admin não estão visualizando corretamente no relatório os equipamentos do batalhão ou diretoria a que pertencem.
- Relatórios estão lentos com poucos dados; é necessário otimizar consultas e paginação antes que o histórico cresça.

Observações

- Não foram alteradas APIs de backend; mudanças são restritas ao frontend e testes adicionados/ajustados.
