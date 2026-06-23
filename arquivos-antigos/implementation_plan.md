# Implantação do Perfil POLICIAL (Carga Pessoal)

A introdução do perfil `POLICIAL` transforma o Atlas, permitindo que o efetivo da ponta consiga visualizar sua própria carga (equipamentos acautelados) com total transparência e segurança.

## User Review Required

> [!IMPORTANT]
> **Vinculação de Cautela ao Usuário:** Atualmente, quando uma seção empresta (acautela) um equipamento, o nome de quem pegou é digitado em texto livre no campo `solicitante`. Para que o sistema saiba de quem é o equipamento, **nós precisaremos alterar o formulário de "Nova Cautela" para que você busque o Policial cadastrado no sistema** em vez de apenas digitar o nome dele. Isso está previsto neste plano. Você concorda com essa mudança?

## Open Questions

1. Para que o usuário do tipo `POLICIAL` receba um equipamento no seu nome, **ele já precisará ter logado no Atlas pelo menos uma vez** (para o sistema criar a ficha local dele a partir do SGA). Isso é um problema, ou é um fluxo aceitável (ex: mandar a tropa acessar o sistema pelo menos uma vez para constar no banco)?

## Proposed Changes

---

### Prisma Schema

#### [MODIFY] [schema.prisma](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-backend/prisma/schema.prisma)
- Adicionar o valor `POLICIAL` no `enum PerfilUsuario`.

---

### Backend (SGA & Permissões)

#### [MODIFY] [sga.service.ts](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-backend/src/integracoes/sga/sga.service.ts)
- Em `mapearPerfilSga`, adicionar a condição para retornar `PerfilUsuario.POLICIAL` quando o perfil do SGA for `POLICIAL`.

#### [MODIFY] [permissoes.service.ts](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-backend/src/modulos/compartilhado/permissoes.service.ts)
- No método `construirCondicoesVisibilidadeEquipamento`, adicionar a regra absoluta: se `userFull.perfil === 'POLICIAL'`, retornar `[{ usuarioResponsavelId: userFull.id }]`.

#### [MODIFY] [equipamentos.service.ts](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-backend/src/modulos/equipamentos/equipamentos.service.ts)
- Atualizar a função que registra a saída de cautela para aceitar `usuarioResponsavelId` no payload e gravá-lo no banco.

---

### Frontend (Roteamento & UI)

#### [MODIFY] [menu-lateral.component.ts](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-frontend/src/app/componentes/menu-lateral/menu-lateral.component.ts)
- Ajustar a lógica do menu para que, se o perfil for `POLICIAL`, seja exibido **apenas** o botão de "Minha Carga" (que apontará para a tela de Cautelas).

#### [MODIFY] [gestao-cautelas.component.ts](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-frontend/src/app/funcionalidades/cautelas/gestao/gestao-cautelas.component.ts)
- Injetar o usuário logado para descobrir se ele é `POLICIAL`.
- Esconder botões administrativos ("Registrar Saída", "Baixa em Lote", "Gerar Cautela SEI") caso o perfil seja `POLICIAL`.
- Mudar o nome do campo texto `Solicitante` para um componente de **busca/autocomplete de usuários** quando os administradores forem fazer um acautelamento.

#### [MODIFY] [gestao-cautelas.component.html](file:///c:/Users/pablo.ricardo/Documents/atlas/atlas-frontend/src/app/funcionalidades/cautelas/gestao/gestao-cautelas.component.html)
- Ocultar colunas e botões administrativos via `*ngIf="usuario.perfil !== 'POLICIAL'"`.
- Alterar o modal de nova cautela para incluir a busca de usuário.

## Verification Plan

### Manual Verification
1. Rodar `npx prisma db push` para subir o novo perfil.
2. Logar como `ADMIN_DTEC`. Ir na tela de Cautela e registrar uma saída buscando um usuário do sistema (que já logou e tem ficha no banco).
3. Logar no sistema como o usuário `POLICIAL`.
4. Verificar se a tela inicial é apenas a tela de Cautelas e se mostra apenas os equipamentos alocados no ID dele, sem botões de edição ou de nova saída.
