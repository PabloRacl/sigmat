# Sistema ATLAS — Documento de Requisitos

> **Projeto:** ATLAS — Sistema de Gestão Patrimonial da PMPE
> **Estrutura:** Redmine (Projeto > Atividades > Tarefas)
> **Versão:** 1.0.0

---

## 1. Visão Geral do Projeto

Sistema web para gerenciamento de equipamentos, cautelas, transferências, manutenção e controle patrimonial da Polícia Militar de Pernambuco. Integrado aos sistemas corporativos LDAP (autenticação), SGPM (dados funcionais) e SGA (perfis de acesso).

### Público-alvo
- **ADMIN_DTEC** — Administração total do sistema
- **DIRETORIA** — Gestão em nível de diretoria
- **COMANDANTE** — Gestão em nível de batalhão
- **USUARIO_BATALHAO** — Usuário operacional (edições requerem aprovação)

### Stack Tecnológica
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 19 (standalone, Signals), PrimeNG, SCSS |
| Backend | NestJS 11, Prisma ORM, PostgreSQL (Neon) |
| Autenticação | JWT + Passport, LDAP corporativo |
| Tempo Real | Socket.IO (WebSocket) |
| PDF | PDFKit |
| Cache | In-memory (frontend) |

---

## 2. Atividades e Tarefas (R-1 ... R-N)

Cada atividade representa um módulo/épico. Dentro de cada uma, as tarefas são numeradas como **R-N**.

---

### ATIVIDADE 1 — Autenticação e Controle de Acesso

**Responsável:** Backend + Frontend
**Prioridade:** Crítica
**Dependência:** Nenhuma
**Previsão:** Semana 1-2

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-1.1 | Integração LDAP corporativo (validação de usuário/senha, retorno de CPF) | 3 dias | ✅ |
| R-1.2 | Integração SGPM (consulta de dados funcionais: nome_guerra, matrícula, posto, OME) | 2 dias | ✅ |
| R-1.3 | Integração SGA (validação de permissão por sistema ID 19, mapeamento de perfil) | 2 dias | ✅ |
| R-1.4 | Fluxo de login corporativo (LDAP → SGPM → SGA → upsert local → JWT) | 3 dias | ✅ |
| R-1.5 | Mock mode offline (usuários fictícios para desenvolvimento) | 1 dia | ✅ |
| R-1.6 | Refresh token (UUID, 7 dias, blacklist de JWT) | 2 dias | ✅ |
| R-1.7 | Logout com invalidação de token | 1 dia | ✅ |
| R-1.8 | Solicitação de acesso (formulário público → aprovação ADMIN_DTEC) | 3 dias | ✅ |
| R-1.9 | Rate limiting (5 req/min login, 3 req/min solicitação) | 1 dia | ✅ |
| R-1.10 | Tela de login (entrada.component) — formulário com campos usuário/senha | 1 dia | ✅ |
| R-1.11 | Guardas de rota (JwtAuthGuard, RolesGuard) para proteção das páginas | 1 dia | ✅ |
| R-1.12 | Perfis de usuário: ADMIN_DTEC, DIRETORIA, COMANDANTE, USUARIO_BATALHAO | 1 dia | ✅ |

---

### ATIVIDADE 2 — Cadastro e Gestão de Equipamentos

**Responsável:** Backend + Frontend
**Prioridade:** Crítica
**Dependência:** Atividade 5 (Configurações)
**Previsão:** Semana 2-4

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-2.1 | CRUD de equipamentos (patrimônio, nº série, SEI, tipo, marca, modelo, status, disponibilidade, seção, batalhão) | 4 dias | ✅ |
| R-2.2 | Filtros de busca (texto geral, tipo, status, disponibilidade, seção, marca, etc.) | 2 dias | ✅ |
| R-2.3 | Paginação servidor-side | 1 dia | ✅ |
| R-2.4 | Filtro de visibilidade por perfil (batalhão/diretoria) | 2 dias | ✅ |
| R-2.5 | Regras de criação: DIRETORIA bloqueada, não-admin limitado ao próprio batalhão | 1 dia | ✅ |
| R-2.6 | Regras de edição: ADMIN direto, COMANDANTE direto, USUARIO_BATALHAO cria solicitação de aprovação | 2 dias | ✅ |
| R-2.7 | Regras de exclusão: ADMIN direto, demais via aprovação | 1 dia | ✅ |
| R-2.8 | Atualização em massa (status, seção, disponibilidade) | 2 dias | ✅ |
| R-2.9 | Especificações dinâmicas por tipo (CPU→processador/RAM/SSD, Monitor→tamanho, Rádio→frequência, etc.) | 2 dias | ✅ |
| R-2.10 | Campos específicos para Celular (IMEI, telefone, chip vinculado) | 1 dia | ✅ |
| R-2.11 | Histórico de alterações do equipamento (logs de auditoria) | 1 dia | ✅ |
| R-2.12 | **Tela: Lista de Equipamentos** — tabela com filtros, paginação, ações em lote | 3 dias | ✅ |
| R-2.13 | **Tela: Formulário de Cadastro/Edição** — modal com campos, seleção de OME, seção, especificações dinâmicas | 3 dias | ✅ |
| R-2.14 | Upload de fotos do equipamento (campo JSON no schema, pendente implementação frontend) | 2 dias | ⏳ Pendente |
| R-2.15 | Gerar etiqueta patrimonial em PDF | 2 dias | ✅ |

---

### ATIVIDADE 3 — Cautelas Diárias (Empréstimos)

**Responsável:** Backend + Frontend
**Prioridade:** Alta
**Dependência:** Atividade 2
**Previsão:** Semana 3-4

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-3.1 | Registro de saída (solicitante, datas, disponibilidade → EMPRESTIMO) | 2 dias | ✅ |
| R-3.2 | Registro de retorno (disponibilidade → DISPONÍVEL, limpa dados de empréstimo) | 1 dia | ✅ |
| R-3.3 | Listagem de cautelas ativas (equipamentos com disponibilidade = EMPRESTIMO) | 1 dia | ✅ |
| R-3.4 | Histórico de cautelas (todos que já tiveram solicitante preenchido) | 1 dia | ✅ |
| R-3.5 | Cautelas vencidas (dataRetornoEmprestimo < hoje) | 1 dia | ✅ |
| R-3.6 | Gerar cautela em PDF (termo de responsabilidade individual) | 2 dias | ✅ |
| R-3.7 | Gerar tabela de cautela em PDF (múltiplos equipamentos) | 1 dia | ✅ |
| R-3.8 | **Tela: Cautelas** — listagem de ativos, vencidos, histórico + botões saída/retorno | 3 dias | ✅ |

---

### ATIVIDADE 4 — Movimentações e Aprovações

**Responsável:** Backend + Frontend
**Prioridade:** Alta
**Dependência:** Atividade 2
**Previsão:** Semana 4-6

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-4.1 | Modelo de aprovação (AlteracaoPendente: equipamento, dadosAntigos, dadosNovos, status) | 2 dias | ✅ |
| R-4.2 | Criar solicitação de aprovação ao editar equipamento (USUARIO_BATALHAO) | 2 dias | ✅ |
| R-4.3 | Listar pendências pendentes (filtradas por batalhão) | 1 dia | ✅ |
| R-4.4 | Contagem de pendências (para badge no sino) | 1 dia | ✅ |
| R-4.5 | Aprovar/rejeitar solicitação (com justificativa) | 2 dias | ✅ |
| R-4.6 | Notificação WebSocket ao solicitar (decisao_alteracao) | 1 dia | ✅ |
| R-4.7 | Transferência de equipamento entre seções | 3 dias | ✅ |
| R-4.8 | Transferência em lote (múltiplos equipamentos) | 1 dia | ✅ |
| R-4.9 | Confirmação de recebimento (COMANDANTE/ADMIN do destino) | 1 dia | ✅ |
| R-4.10 | Cancelamento de transferência (ADMIN ou solicitante) | 1 dia | ✅ |
| R-4.11 | Notificação WebSocket de nova transferência por batalhão | 1 dia | ✅ |
| R-4.12 | **Tela: Movimentações & Aprovações** — lista de pendências com ações aprovar/rejeitar, transferências pendentes | 3 dias | ✅ |

---

### ATIVIDADE 5 — Configurações (Tabelas de Apoio)

**Responsável:** Backend + Frontend
**Prioridade:** Alta
**Dependência:** Nenhuma
**Previsão:** Semana 1-2

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-5.1 | CRUD Tipos de Equipamento (nome único, validação duplicata case-insensitive) | 1 dia | ✅ |
| R-5.2 | CRUD Marcas (nome único) | 1 dia | ✅ |
| R-5.3 | CRUD Modelos (nome + marcaId, unique por marca) | 1 dia | ✅ |
| R-5.4 | CRUD Status de Equipamento (nome único, descrição amigável, cor/emoji) | 1 dia | ✅ |
| R-5.5 | Listagem de Disponibilidades e Tipos de Aquisição | 1 dia | ✅ |
| R-5.6 | CRUD de Seções (sigla, nome, vínculo com batalhão/diretoria) | 2 dias | ✅ |
| R-5.7 | Listagem de Batalhões (sincronizados do SGPM) | 1 dia | ✅ |
| R-5.8 | Proteção contra exclusão de registros vinculados a equipamentos | 1 dia | ✅ |
| R-5.9 | Cache frontend da lista de batalhões (evitar chamadas repetidas) | 1 dia | ✅ |
| R-5.10 | **Tela: Configurações** — abas para cada tabela, CRUD inline com confirmação | 3 dias | ✅ |

---

### ATIVIDADE 6 — Manutenção (Ordens de Serviço)

**Responsável:** Backend + Frontend
**Prioridade:** Média
**Dependência:** Atividade 2
**Previsão:** Semana 5-6

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-6.1 | Criar OS (equipamento, descrição do problema, solicitante) | 2 dias | ✅ |
| R-6.2 | Criar OS em lote (múltiplos equipamentos) | 1 dia | ✅ |
| R-6.3 | Fluxo de status: ABERTA → EM_ANDAMENTO → AGUARDANDO_PEÇA → CONCLUIDA / CANCELADA | 2 dias | ✅ |
| R-6.4 | Ao abrir OS, equipamento muda status para MANUTENÇÃO | 1 dia | ✅ |
| R-6.5 | Ao concluir/cancelar OS, equipamento volta para ATIVO | 1 dia | ✅ |
| R-6.6 | Campos: técnico responsável, data previsão, solução aplicada, valor gasto | 1 dia | ✅ |
| R-6.7 | Contagem de OS pendentes (para badge no sino) | 1 dia | ✅ |
| R-6.8 | Histórico de alterações da OS | 1 dia | ✅ |
| R-6.9 | Regra: DIRETORIA não abre OS; não-admin só do mesmo batalhão | 1 dia | ✅ |
| R-6.10 | **Tela: Manutenção** — listagem de OS, modal de criação, timeline de status | 3 dias | ✅ |

---

### ATIVIDADE 7 — Visão Geral (Dashboard)

**Responsável:** Backend + Frontend
**Prioridade:** Média
**Dependência:** Atividade 2
**Previsão:** Semana 4-5

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-7.1 | Cards de resumo: total, ativos, manutenção, inativos, emprestados | 2 dias | ✅ |
| R-7.2 | Gráfico de pizza: equipamentos por status (colorido) | 1 dia | ✅ |
| R-7.3 | Gráfico de barras: top 10 tipos de equipamento | 1 dia | ✅ |
| R-7.4 | Gráfico de rosca: por disponibilidade | 1 dia | ✅ |
| R-7.5 | Gráfico de barras: equipamentos por batalhão (top 15) | 1 dia | ✅ |
| R-7.6 | Gráfico de barras: top 10 marcas | 1 dia | ✅ |
| R-7.7 | Timeline de atividades recentes (últimos 6 logs) | 1 dia | ✅ |
| R-7.8 | Filtro de visibilidade por perfil nos dados do dashboard | 2 dias | ✅ |
| R-7.9 | **Tela: Visão Geral** — layout de cards + grid de gráficos + timeline | 3 dias | ✅ |

---

### ATIVIDADE 8 — Relatórios

**Responsável:** Backend + Frontend
**Prioridade:** Média
**Dependência:** Atividade 2
**Previsão:** Semana 6-7

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-8.1 | Relatório de inventário (todos os campos + filtros) | 2 dias | ✅ |
| R-8.2 | Relatório de resumo por unidade (agrupado por batalhão/diretoria) | 1 dia | ✅ |
| R-8.3 | Relatório de transferências (filtros por data, status, origem, destino) | 2 dias | ✅ |
| R-8.4 | Relatório de auditoria (filtros por ação, usuário, data, equipamento) | 2 dias | ✅ |
| R-8.5 | **Tela: Relatórios** — seções com filtros e tabelas exportáveis | 3 dias | ✅ |

---

### ATIVIDADE 9 — Usuários

**Responsável:** Backend + Frontend
**Prioridade:** Média
**Dependência:** Atividade 1
**Previsão:** Semana 5-6

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-9.1 | CRUD de usuários (ADMIN_DTEC apenas) | 2 dias | ✅ |
| R-9.2 | Listagem com filtro por perfil, batalhão, seção | 1 dia | ✅ |
| R-9.3 | Soft delete (renomeia login para "removido_{id}") | 1 dia | ✅ |
| R-9.4 | Associação de permissões extras (UsuarioSecao, UsuarioTipoEquipamento) | 2 dias | ✅ |
| R-9.5 | Filtro de visibilidade: ADMIN vê todos, DIRETORIA vê diretoria, demais vê batalhão | 1 dia | ✅ |
| R-9.6 | Flag autorizado (bloqueio de acesso sem excluir) | 1 dia | ✅ |
| R-9.7 | **Tela: Usuários** — tabela com CRUD, filtros, toggle autorizado | 3 dias | ✅ |

---

### ATIVIDADE 10 — Auditoria

**Responsável:** Backend + Frontend
**Prioridade:** Baixa
**Dependência:** Atividade 2
**Previsão:** Semana 6-7

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-10.1 | Registro de log para CREATE, UPDATE, DELETE, APPROVE, REJECT, TRANSFER, LOGIN, LOGOUT | 2 dias | ✅ |
| R-10.2 | Geração de diff entre valores antigos e novos | 1 dia | ✅ |
| R-10.3 | Resolução de labels (FK → nomes legíveis) nos logs | 1 dia | ✅ |
| R-10.4 | Filtros por ação, usuário, equipamento, período | 1 dia | ✅ |
| R-10.5 | **Tela: Auditoria** — tabela de logs com filtros e detalhes expandíveis | 2 dias | ✅ |

---

### ATIVIDADE 11 — Notificações (Tempo Real)

**Responsável:** Backend + Frontend
**Prioridade:** Média
**Dependência:** Atividade 4
**Previsão:** Semana 6-7

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-11.1 | Gateway WebSocket (namespace /notificacoes, transporte WebSocket + polling) | 2 dias | ✅ |
| R-11.2 | Registro de usuário por socket (conexão user → socket) | 1 dia | ✅ |
| R-11.3 | Evento de atualizar notificações (broadcast) | 1 dia | ✅ |
| R-11.4 | Notificação individual de decisão de alteração (aprovado/rejeitado) | 1 dia | ✅ |
| R-11.5 | Notificação de nova transferência por batalhão | 1 dia | ✅ |
| R-11.6 | Notificação de nova solicitação de acesso (broadcast) | 1 dia | ✅ |
| R-11.7 | Badge no sino com contagem (aprovações + transferências + manutenção + acesso) | 2 dias | ✅ |
| R-11.8 | **Dropdown de notificações** — categorias com ícones, contagens, links diretos | 2 dias | ✅ |
| R-11.9 | Refresh automático a cada 5 minutos (fallback) | 1 dia | ✅ |

---

### ATIVIDADE 12 — Infraestrutura e Qualidade

**Responsável:** DevOps/Fullstack
**Prioridade:** Alta
**Dependência:** Todas
**Previsão:** Contínuo

| Código | Tarefa | Estimativa | Status |
|--------|--------|-----------|--------|
| R-12.1 | Configuração do banco Neon PostgreSQL + Prisma ORM | 1 dia | ✅ |
| R-12.2 | Migrations do Prisma (schema inicial + evoluções) | 2 dias | ✅ |
| R-12.3 | Variáveis de ambiente (.env) para todos os ambientes | 1 dia | ✅ |
| R-12.4 | CORS configurado para frontend local e produção | 1 dia | ✅ |
| R-12.5 | Tratamento global de exceções (GlobalExceptionFilter) | 1 dia | ✅ |
| R-12.6 | Validação de DTOs com class-validator + whitelist | 1 dia | ✅ |
| R-12.7 | Testes unitários (services, controllers, guards) | 5 dias | ✅ |
| R-12.8 | Compilação TypeScript limpa (backend `nest build`, frontend `tsc --noEmit`) | 1 dia | ✅ |
| R-12.9 | Linter + formatter (ESLint, Prettier) | 1 dia | ✅ |
| R-12.10 | Documentação Swagger/OpenAPI | 2 dias | ⏳ Pendente |

---

## 3. Telas do Sistema

### Tela 1 — Login

**Rota:** `/login`
**Componente:** `EntradaComponent`
**Perfil:** Público (sem autenticação)

**Conteúdo:**
- Formulário com campos: Usuário (CPF) e Senha
- Botão "Entrar" com loading state
- Link "Solicitar Acesso" para formulário de registro
- Validação inline de campos obrigatórios
- Mensagens de erro para credenciais inválidas
- Rate limiting visual (após tentativas)

---

### Tela 2 — Visão Geral (Dashboard)

**Rota:** `/visao-geral/inicio`
**Componente:** `DashboardHomeComponent`
**Perfil:** Todos autenticados

**Conteúdo:**
- **Cards de resumo** (5 cards): Total, Ativos, Em Manutenção, Inativos, Emprestados
- **Gráfico de rosca** — distribuição por status (ATIVO, MANUTENÇÃO, INATIVO, EXTRAVIADO, etc.)
- **Gráfico de barras vertical** — top 10 tipos de equipamento
- **Gráfico de rosca** — por disponibilidade (CARGA vs EMPRESTIMO)
- **Gráfico de barras vertical** — equipamentos por batalhão (top 15)
- **Gráfico de barras vertical** — top 10 marcas
- **Timeline lateral** — últimas 6 atividades (logs de operação)
- Sidebar com navegação entre módulos

---

### Tela 3 — Equipamentos (Lista)

**Rota:** `/visao-geral/equipamentos`
**Componente:** `EquipmentListComponent`
**Perfil:** Todos autenticados

**Conteúdo:**
- **Barra de busca** — campo de texto com busca geral + botão "Novo Equipamento"
- **Filtros avançados** — dropdowns para Tipo, Status, Disponibilidade, Seção, Marca
- **Tabela** — colunas: Patrimônio, Tipo, Marca/Modelo, Status, Disponibilidade, Seção, Ações
- **Ações em lote** — selecionar múltiplos + alterar Status/Seção/Disponibilidade
- **Paginação** no rodapé da tabela
- **Modal de cadastro/edição** (EquipmentFormComponent):
  - Campos: Patrimônio, Nº Série, SEI, Tipo, Marca, Modelo, Status, Disponibilidade
  - OME (Batalhão/Diretoria) — dropdown que filtra as Seções
  - Seção — dropdown filtrado pelo OME selecionado
  - Especificações dinâmicas (CPU→processador/RAM, Monitor→tamanho, etc.)
  - Dados de Celular: IMEI, Telefone, Chip vinculado
  - Data de Aquisição, Observações
  - Botões: Cancelar (gradiente cinza) | Cadastrar/Salvar (gradiente índigo)
- **Modal de exclusão** — confirmação antes de remover

---

### Tela 4 — Cautelas Diárias

**Rota:** `/visao-geral/cautelas`
**Componente:** `LoansManagementComponent`
**Perfil:** Todos autenticados

**Conteúdo:**
- **Abas:** Ativas | Vencidas | Histórico
- **Tabela de cautelas ativas** — equipamentos com disponibilidade EMPRESTIMO
  - Colunas: Patrimônio, Tipo, Solicitante, Data Saída, Previsão Retorno, Status (dias vencido)
  - Ações: Botão "Registrar Retorno"
- **Aba Vencidas** — cautelas com data de retorno expirada
  - Destaque visual (vermelho) nos registros atrasados
- **Aba Histórico** — todas as cautelas já realizadas
- **Modal de saída** — campos: Solicitante, Data Saída, Previsão Retorno
- **Botão "Gerar PDF"** — individual ou em lote

---

### Tela 5 — Movimentações & Aprovações

**Rota:** `/visao-geral/aprovacoes`
**Componente:** `ApprovalsListComponent`
**Perfil:** ADMIN_DTEC, COMANDANTE (aprovam) / USUARIO_BATALHAO (visualizam)

**Conteúdo:**
- **Abas:** Pendentes | Aprovadas | Rejeitadas
- **Lista de aprovações pendentes:**
  - Equipamento, campos alterados (diff visual), solicitante, data
  - Ações: Aprovar (verde) | Rejeitar (vermelho com modal de justificativa)
- **Lista de transferências pendentes:**
  - Equipamento, origem → destino, solicitante, data
  - Ações: Confirmar Recebimento | Cancelar
- **Badge no menu lateral** com contagem de pendências
- **Modal de rejeição** — campo de texto obrigatório para justificativa

---

### Tela 6 — Seções

**Rota:** `/visao-geral/secoes`
**Componente:** `SettingsSectionsComponent`
**Perfil:** ADMIN_DTEC, DIRETORIA, COMANDANTE

**Conteúdo:**
- **Tabela de seções** — colunas: Sigla, Nome, Batalhão, Diretoria, Ações
- **Filtro por batalhão** — dropdown para selecionar OME
- **Modal de cadastro/edição** — Sigla, Nome, Batalhão (dropdown), Diretoria (auto)
- **Exclusão** com confirmação
- Visibilidade filtrada: ADMIN vê tudo, DIRETORIA vê suas diretorias, COMANDANTE vê seu batalhão

---

### Tela 7 — Manutenção

**Rota:** `/visao-geral/manutencao`
**Componente:** `MaintenanceListComponent`
**Perfil:** ADMIN_DTEC, COMANDANTE, USUARIO_BATALHAO (visualizar/criar)

**Conteúdo:**
- **Tabela de OS** — colunas: ID, Equipamento, Status, Técnico, Data Abertura, Previsão, Ações
- **Filtros** — por status (ABERTA, EM_ANDAMENTO, CONCLUIDA), equipamento
- **Modal de criação** — selecionar equipamento, descrição do problema, técnico responsável, data previsão
- **Timeline de status** — visualização do histórico de alterações
- **Ação de atualizar status** — dropdown com próximos estados válidos
- **Botão "Criar OS em Lote"** — selecionar múltiplos equipamentos

---

### Tela 8 — Relatórios

**Rota:** `/visao-geral/relatorios`
**Componente:** `ReportsComponent`
**Perfil:** ADMIN_DTEC, DIRETORIA, COMANDANTE

**Conteúdo:**
- **Seção: Inventário** — filtros por seção, tipo, status, disponibilidade + tabela com todos os campos
- **Seção: Resumo por Unidade** — tabela agrupada (batalhão → total de equipamentos)
- **Seção: Transferências** — filtros por data, status, origem, destino, patrimônio
- **Seção: Auditoria** — filtros por ação, usuário, período, equipamento
- **Exportação** — cada seção com dados em tabela (preparado para CSV/PDF)

---

### Tela 9 — Usuários

**Rota:** `/visao-geral/usuarios`
**Componente:** `UsersListComponent`
**Perfil:** ADMIN_DTEC (CRUD), DIRETORIA/COMANDANTE (visualização)

**Conteúdo:**
- **Tabela** — colunas: Nome, Matrícula, Posto/Graduação, Perfil, Batalhão, Seção, Autorizado, Ações
- **Filtros** — por perfil, batalhão, seção, texto livre
- **Modal de cadastro/edição** — dados pessoais, perfil, batalhão, seção, permissões extras
- **Toggle "Autorizado"** — habilita/desabilita acesso sem excluir
- **Exclusão** — soft delete (confirmação + motivo)
- **Seção de Solicitações de Acesso** — listagem de pedidos pendentes com aprovar/rejeitar

---

### Tela 10 — Auditoria

**Rota:** `/visao-geral/auditoria`
**Componente:** `AuditLogsComponent`
**Perfil:** ADMIN_DTEC, DIRETORIA (COMANDANTE vê apenas do próprio batalhão)

**Conteúdo:**
- **Tabela de logs** — colunas: Data/Hora, Usuário, Ação, Equipamento, Descrição
- **Filtros:**
  - Período (data inicial/final)
  - Tipo de ação (CREATE, UPDATE, DELETE, APPROVE, LOGIN, etc.)
  - Usuário (texto)
  - Equipamento (patrimônio)
- **Detalhes expansíveis** — clique na linha para ver diff (antes → depois) com labels resolvidos

---

### Tela 11 — Configurações

**Rota:** `/visao-geral/configuracoes`
**Componente:** `SettingsSectionsComponent` (compartilhado com Seções)
**Perfil:** ADMIN_DTEC, DIRETORIA

**Conteúdo:**
- **Abas:** Tipos | Marcas | Modelos | Status | Disponibilidades | Tipos Aquisição | Batalhões
- **Cada aba:**
  - Tabela com registros existentes
  - Botão "Adicionar" → prompt inline para criar
  - Ações: Editar (ícone), Excluir (ícone com confirmação)
- **Validações:** nome único, proteção contra exclusão de registros vinculados

---

### Tela 12 — Topbar e Perfil

**Componente:** `PainelComponent` (layout fixo em todas as telas)

**Conteúdo:**
- **Sidebar:** Logo PMPE + "ATLAS", menu de navegação com ícones, toggle colapso
- **Topbar:**
  - **Sino de notificações:** ícone com badge de contagem, dropdown com categorias:
    - Aprovações (azul) → link para tela
    - Transferências (laranja) → link para tela
    - Manutenção (amarelo) → link para tela
    - Solicitações de Acesso (vermelho) → link para Usuários
    - "Ver todas as pendências" → link para Aprovações
  - **Avatar do usuário:** imagem UI Avatars com nome, fallback para inicial
  - **Dropdown de perfil:** nome completo, matrícula, perfil, seção, batalhão, diretoria
  - **Botão "Sair"** — logout com redirecionamento

---

## 4. Fluxos de Negócio

### 4.1 Fluxo de Login
```
Usuário → Tela de Login → [LDAP] → [SGPM: dados funcionais] → [SGA: permissão]
  → upsert local (cria/atualiza usuário + batalhão/seção/diretoria se não existirem)
  → JWT + Refresh Token → Dashboard
```

### 4.2 Fluxo de Edição com Aprovação
```
USUARIO_BATALHAO edita equipamento → backend cria AlteracaoPendente
  → WebSocket notifica ADMIN/COMANDANTE
  → ADMIN/COMANDANTE aprova ou rejeita
  → Se aprovado: equipamento atualizado + WebSocket notifica solicitante
  → Se rejeitado: registro marcado + motivo + WebSocket notifica
```

### 4.3 Fluxo de Transferência
```
Usuário solicita transferência (equipamento → seção destino)
  → Transferencia status = PENDENTE
  → COMANDANTE/ADMIN do destino confirma recebimento
  → equipamento.secaoId = destino
  → Transferencia status = CONCLUIDA
  → Log de auditoria
```

### 4.4 Fluxo de Manutenção
```
Usuário abre OS → equipamento.status = MANUTENÇÃO
  → Técnico atualiza status (EM_ANDAMENTO, AGUARDANDO_PEÇA)
  → Ao CONCLUIDA/CANCELADA → equipamento.status = ATIVO
  → Log de auditoria em cada transição
```

---

## 5. Regras de Negócio Imutáveis

1. **Hierarquia de visibilidade:** ADMIN_DTEC > DIRETORIA > COMANDANTE > USUARIO_BATALHAO
2. **DIRETORIA NÃO cadastra equipamentos nem abre OS**
3. **USUARIO_BATALHAO edita equipamento via aprovação obrigatória**
4. **Usuário só gerencia recursos do próprio batalhão/diretoria**
5. **OME (Batalhão) nunca se desvincula da Seção** — relação permanente
6. **Seção é obrigatória no equipamento** (OME é desnormalização para performance)
7. **LDAP é a fonte da verdade para senha**, SGA para perfil, SGPM para dados funcionais
8. **Refresh token expira em 7 dias** e é invalidado no logout
9. **Soft delete em usuários** (nunca remove fisicamente)
10. **Proteção cascata**: não deletar Tipo/Marca/Modelo/Status se vinculado a equipamento

---

## 6. Cronograma Estimado

| Atividade | Semanas | Início | Término |
|-----------|---------|--------|---------|
| 1 — Autenticação | 2 | Semana 1 | Semana 2 |
| 5 — Configurações | 2 | Semana 1 | Semana 2 |
| 2 — Equipamentos | 3 | Semana 2 | Semana 4 |
| 3 — Cautelas | 2 | Semana 3 | Semana 4 |
| 7 — Dashboard | 2 | Semana 4 | Semana 5 |
| 9 — Usuários | 2 | Semana 5 | Semana 6 |
| 6 — Manutenção | 2 | Semana 5 | Semana 6 |
| 4 — Aprovações/Transferências | 3 | Semana 4 | Semana 6 |
| 11 — Notificações | 2 | Semana 6 | Semana 7 |
| 8 — Relatórios | 2 | Semana 6 | Semana 7 |
| 10 — Auditoria | 2 | Semana 6 | Semana 7 |
| 12 — Infraestrutura | Contínuo | Semana 1 | Semana 8 |

> **Total estimado:** 8 semanas para desenvolvimento completo
> **Situação atual:** ~90% concluído (pendente: upload de fotos, Swagger, refinamentos)

---

## 7. Glossário

| Termo | Definição |
|-------|-----------|
| OME | Organização Militar Estadual (Batalhão/Diretoria) |
| SGPM | Sistema de Gestão de Pessoal Militar (banco de dados corporativo) |
| SGA | Sistema de Gestão de Acesso (controle de permissões) |
| LDAP | Protocolo de autenticação corporativo da PMPE |
| SEI | Sistema Eletrônico de Informações (protocolo) |
| OS | Ordem de Serviço (manutenção) |
| Cautela | Termo de responsabilidade por empréstimo de equipamento |
| PMPE | Polícia Militar de Pernambuco |
