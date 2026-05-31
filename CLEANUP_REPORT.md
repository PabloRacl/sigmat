***Relatório de Limpeza — Arquivos candidatos à remoção e justificativa***

Este documento lista arquivos e pastas que parecem ser gerados, obsoletos ou candidatos à remoção/arquivamento. Para cada item descrevo o que é, por que pode ser removido (ou mantido) e a ação recomendada com os comandos git correspondentes.

**Resumo — ações rápidas**
- Remover artefatos de build rastreados (`dist/`) do repositório e adicioná-los ao `.gitignore`.
- Manter arquivos de ambiente (`*.env`) fora do repositório. Manter `/.env.example` como modelo apenas se não contiver segredos; caso contrário, sanitizá-lo.
- Arquivar backups e relatórios grandes da pasta `Arquivos/` em um armazenamento externo ou em uma pasta `archive/` fora do controle de versão.
- Ignorar caches do Angular e arquivos incrementais do TypeScript (`.angular/`, `*.tsbuildinfo`).

**Arquivos/Pastas propostos para deixar de rastrear (git rm --cached) e por quê**

- `sigmat-backend/dist`: JavaScript compilado, sourcemaps e arquivos de declaração gerados pelo build TypeScript/Nest. São artefatos de build e não devem ser versionados — podem ficar grandes e desatualizados.
  - Ação: `git rm -r --cached sigmat-backend/dist` e depois adicionar `dist/` ao `.gitignore` (backend ou raiz).

- `sigmat-frontend/dist` (incluindo `dist/sigmat-frontend/browser`): artefatos de build de produção (HTML/CSS/JS chunks). Devem ser gerados pela pipeline/CI ou localmente e não commitados.
  - Ação: `git rm -r --cached sigmat-frontend/dist` e adicionar `/dist` ao `sigmat-frontend/.gitignore`.

- `sigmat-frontend/.angular/cache` e `.angular/cache/.../.tsbuildinfo`: cache do Angular e arquivos `.tsbuildinfo` usados para compilação incremental. São caches locais, sem razão para versionamento.
  - Ação: `git rm -r --cached sigmat-frontend/.angular/cache` e adicionar `.angular/` e `*.tsbuildinfo` ao `.gitignore`.

**Arquivos que parecem ser artefatos de build/incrementais em outros locais**
- `.tsbuildinfo`: metadados de compilação incremental do TypeScript. Já adicionamos `*.tsbuildinfo` ao `.gitignore` do backend; confirme a presença dessa regra também no `.gitignore` raiz e no do frontend.
  - Ação: atualizar os `.gitignore` do repositório para incluir `*.tsbuildinfo`.

**Backups, exports e documentos grandes para arquivar (não commitar no repositório)**
- `Arquivos/stg_equipamentos_completo_SIGMAT(1).bak` — backup de banco de dados (grande e sensível).
- `Arquivos/stg_equipamentos_completo_SIGMAT(1).xlsx` — exportação em planilha.
- `inventario_sigmat_2026-04-25 (2).csv` — exportação de dados.
- `relatorio_sigmat_2026-04-25 (1).docx` e `relatorio_sigmat_2026-04-25.docx` — relatórios.
  - Ação: mover para `archive/` fora do repositório ou para armazenamento em nuvem (Google Drive, S3) e remover do repositório com `git rm --cached <arquivo>`.

**Configurações e modelos — revisar, normalmente manter**
- `sigmat-backend/.env.example`: modelo de variáveis de ambiente. Útil para desenvolvedores e CI; NÃO deve conter segredos reais. Se houver segredos, sanitizar.
  - Observação sobre testes: testes usam variáveis do ambiente de testes/CI; `.env.example` é apenas referência.

- `sigmat-backend/import.env`: possivelmente usado por scripts de importação. Se contiver segredos, movê-lo para armazenamento seguro; caso seja exemplo, renomear para `.env.example.import`.

**Outros pontos**
- `node_modules/`: já ignorado pelo `.gitignore` — não commitar.
- Entradas `dist/` no `.gitignore` raiz: confirme que existem; se builds já estiverem rastreados, use `git rm --cached` para removê-los do índice.

**Fluxo Git recomendado (seguro — branch + PR)**
1. `git checkout -b cleanup/remove-built-files`
2. Atualizar os `.gitignore` (raiz, `sigmat-frontend/.gitignore`, `sigmat-backend/.gitignore`) para incluir:
   - `dist/`
   - `*.tsbuildinfo`
   - `.angular/`
   - Opcionalmente `*.bak`, `*.xlsx`, `*.docx` se desejar nunca versioná-los.
3. `git add` e `git commit` as mudanças do `.gitignore`.
4. Deixar de rastrear outputs e caches (mantendo os arquivos locais):
   - `git rm -r --cached sigmat-backend/dist`
   - `git rm -r --cached sigmat-frontend/dist`
   - `git rm -r --cached sigmat-frontend/.angular/cache`
   - `git rm --cached "Arquivos/stg_equipamentos_completo_SIGMAT(1).bak"` (e outros arquivos grandes)
5. `git commit -m "chore(cleanup): stop tracking build outputs and archive large files"`.
6. `git push --set-upstream origin cleanup/remove-built-files` e abrir PR.

**Por que manter `.env.example`**
- É um modelo de documentação das variáveis necessárias; ajuda no onboarding e na configuração de CI. Testes não usam esse arquivo automaticamente; portanto mantenha-o, mas sem segredos.

**Próximos passos que posso executar para você**
- Opção 1 (recomendada): eu crio a branch `cleanup/remove-built-files`, atualizo os `.gitignore`, deixo de rastrear os artefatos listados e envio a branch para o remote. Não apago arquivos locais — apenas paro de rastreá-los. Também preparo um rascunho de PR.
- Opção 2: eu gero um script com os comandos exatos para você executar localmente.

Diga qual opção prefere. Se escolher a Opção 1, eu sigo e crio a branch e o rascunho do PR.

***Fim do relatório***

*Gerado em: 2026-05-31*

*Autor: assistente de limpeza automatizada*
