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
cd sigmat-frontend
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

Observações

- Não foram alteradas APIs de backend; mudanças são restritas ao frontend e testes adicionados/ajustados.
