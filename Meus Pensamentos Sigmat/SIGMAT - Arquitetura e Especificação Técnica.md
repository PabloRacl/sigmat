Vou enviar um projeto completo de Controle de Equipamentos Organize as Ideias

> Navegação: [[SIGMAT - Mapa de Conteúdo]] · [[Manual do Obsidian]] · [[Evolução do Pensamento]]

================================================================================
                    SISTEMA SIGMAT - PMPE
        SISTEMA DE GESTÃO DE MATERIAIS E EQUIPAMENTOS
           POLÍCIA MILITAR DE PERNAMBUCO
================================================================================

DOCUMENTO DE ARQUITETURA E ESPECIFICAÇÃO TÉCNICA
Versão: 1.0
Data: Abril/2026
Responsável: Desenvolvimento SIGMAT

================================================================================
                         ÍNDICE
================================================================================

1. VISÃO GERAL DO PROJETO
2. STACK TECNOLÓGICA
3. ARQUITETURA DE DADOS
4. MODELO DE BANCO DE DADOS (PRISMA SCHEMA)
5. HIERARQUIA ORGANIZACIONAL
6. FLUXOS DE TRABALHO
7. FUNCIONALIDADES DO SISTEMA
8. ESTRUTURA DE PASTAS DO PROJETO
9. API REST - ENDPOINTS PRINCIPAIS
10. TELAS DO FRONTEND
11. RELATÓRIOS
12. PLANO DE DESENVOLVIMENTO
13. MIGRAÇÃO DE DADOS
14. SEGURANÇA E AUTENTICAÇÃO
15. CONSIDERAÇÕES FINAIS

================================================================================
                    1. VISÃO GERAL DO PROJETO
================================================================================

SISTEMA: SIGMAT - Sistema de Gestão de Materiais da PMPE
CLIENTE: Polícia Militar de Pernambuco
OBJETIVO: Controle completo de equipamentos (inventário, empréstimos, 
          validações, relatórios e auditoria)

QUANTIDADE ATUAL: 12.029 equipamentos cadastrados
TIPOS DE EQUIPAMENTOS:
  - Rádios comunicadores
  - Celulares e chips
  - Computadores (CPU, monitor, teclado, mouse)
  - Tablets
  - Modems
  - Fontes/Carregadores
  - Outros equipamentos

PROBLEMA ATUAL: Sistema em Oracle APEX 24.1 com limitações
SOLUÇÃO: Migração para arquitetura moderna Angular + Node.js + PostgreSQL

================================================================================
                    2. STACK TECNOLÓGICA
================================================================================

FRONTEND:
  - Framework: Angular 18 (Standalone Components + Signals)
  - UI Library: PrimeNG 18 (componentes enterprise)
  - Estilização: Tailwind CSS 3.4+
  - Ícones: PrimeIcons
  - Gráficos: PrimeNG Charts (Chart.js)
  - HTTP Client: Angular HttpClient + RxJS
  - Roteamento: Angular Router
  - Estado: Angular Signals + RxJS BehaviorSubject
  - Validação: Reactive Forms + Validators personalizados

BACKEND:
  - Runtime: Node.js 20+ LTS
  - Framework: NestJS 10+ (arquitetura enterprise modular)
  - ORM: Prisma 5+ (type-safe, migrations automáticas)
  - Banco: PostgreSQL 15+
  - Autenticação: JWT (JSON Web Tokens) + Passport
  - Validação: class-validator + class-transformer
  - Documentação: Swagger/OpenAPI (automática)
  - Logs: Winston + Morgan
  - Cache: Redis (opcional para performance)

INFRAESTRUTURA:
  - Frontend: Vercel (CDN global, deploy automático via Git)
  - Backend: Servidor PMPE (Linux/Ubuntu 22.04) ou Docker Compose
  - Banco de Dados: PostgreSQL em servidor PMPE (dados sensíveis)
  - Versionamento: Git/GitHub ou GitLab
  - CI/CD: GitHub Actions ou GitLab CI

INTEGRAÇÕES:
  - API do SEI (Sistema Eletrônico de Informações)
    * Autenticação: Login usuário/senha via API
    * Formato: JSON
    * Endpoints: Dados do usuário, lotação, estrutura organizacional
  - Ambiente: Desenvolvimento local → Homologação → Produção (PMPE)

================================================================================
                    3. ARQUITETURA DE DADOS
================================================================================

PRINCÍPIOS:
  - Normalização: 3ª Forma Normal (3NF)
  - Integridade: Foreign Keys e Constraints
  - Performance: Índices estratégicos
  - Auditoria: Logs completos de todas as operações
  - Flexibilidade: Campos JSON para dados específicos por tipo

CARACTERÍSTICAS:
  - Equipamento é a tabela principal
  - Tabelas auxiliares para normalização (tipos, marcas, modelos, status)
  - Tabelas específicas para campos extras por tipo de equipamento
  - Workflow de aprovação com tabela de pendências
  - Log de operações para auditoria completa
  - Histórico de transferências (empréstimos/devoluções)

================================================================================
                    4. MODELO DE BANCO DE DADOS
================================================================================

-- ESTRUTURA ORGANIZACIONAL

CREATE TABLE diretorias (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batalhoes (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    diretoria_id INTEGER REFERENCES diretorias(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE secoes (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    batalhao_id INTEGER REFERENCES batalhoes(id),
    diretoria_id INTEGER REFERENCES diretorias(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USUÁRIOS (SINCRONIZADO COM SEI)

CREATE TYPE perfil_usuario AS ENUM (
    'ADMIN_DTEC',
    'COMANDANTE',
    'USUARIO_BATALHAO'
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    posto_graduacao VARCHAR(100),
    batalhao_id INTEGER REFERENCES batalhoes(id),
    secao_id INTEGER REFERENCES secoes(id),
    perfil perfil_usuario NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELAS AUXILIARES DE EQUIPAMENTOS

CREATE TABLE tipos_equipamento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marcas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modelos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    marca_id INTEGER REFERENCES marcas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE status_equipamento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_aquisicao (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disponibilidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA PRINCIPAL: EQUIPAMENTOS

CREATE TABLE equipamentos (
    id SERIAL PRIMARY KEY,
    patrimonio VARCHAR(50) UNIQUE NOT NULL,
    numero_serie VARCHAR(200),
    sei VARCHAR(200),
    data_aquisicao DATE,
    observacao TEXT,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relacionamentos
    tipo_equipamento_id INTEGER NOT NULL REFERENCES tipos_equipamento(id),
    marca_id INTEGER REFERENCES marcas(id),
    modelo_id INTEGER REFERENCES modelos(id),
    status_id INTEGER NOT NULL REFERENCES status_equipamento(id),
    tipo_aquisicao_id INTEGER REFERENCES tipos_aquisicao(id),
    disponibilidade_id INTEGER NOT NULL REFERENCES disponibilidades(id),
    secao_id INTEGER NOT NULL REFERENCES secoes(id),
    usuario_responsavel_id INTEGER REFERENCES usuarios(id),
    
    -- Controle de Empréstimo
    data_retorno_emprestimo DATE,
    
    -- Aprovação (workflow)
    data_aprovacao TIMESTAMP,
    usuario_aprovador_id INTEGER REFERENCES usuarios(id),
    motivo_negacao TEXT,
    usuario_negador_id INTEGER REFERENCES usuarios(id),
    
    -- Dados específicos (JSON flexível)
    dados_especificos JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WORKFLOW DE VALIDAÇÃO

CREATE TABLE alteracoes_pendentes (
    id SERIAL PRIMARY KEY,
    equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
    
    dados_antigos JSONB NOT NULL,
    dados_novos JSONB NOT NULL,
    campos_alterados TEXT[] NOT NULL,
    
    solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Aprovação
    aprovado_por_id INTEGER REFERENCES usuarios(id),
    data_aprovacao TIMESTAMP,
    aprovado BOOLEAN,
    motivo_negacao TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOGS E AUDITORIA

CREATE TABLE log_operacoes (
    id SERIAL PRIMARY KEY,
    equipamento_id INTEGER REFERENCES equipamentos(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    acao VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    dados_alterados JSONB,
    ip VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA PERFORMANCE

CREATE INDEX idx_equipamentos_patrimonio ON equipamentos(patrimonio);
CREATE INDEX idx_equipamentos_secao ON equipamentos(secao_id);
CREATE INDEX idx_equipamentos_status ON equipamentos(status_id);
CREATE INDEX idx_equipamentos_tipo ON equipamentos(tipo_equipamento_id);
CREATE INDEX idx_equipamentos_responsavel ON equipamentos(usuario_responsavel_id);
CREATE INDEX idx_pendencias_equipamento ON alteracoes_pendentes(equipamento_id);
CREATE INDEX idx_pendencias_solicitante ON alteracoes_pendentes(solicitante_id);
CREATE INDEX idx_logs_equipamento ON log_operacoes(equipamento_id);
CREATE INDEX idx_logs_usuario ON log_operacoes(usuario_id);
CREATE INDEX idx_logs_data ON log_operacoes(created_at);

================================================================================
                    5. HIERARQUIA ORGANIZACIONAL
================================================================================

ESTRUTURA DA PMPE:

COMANDO GERAL
│
├── SUBCOMANDO GERAL / ESTADO-MAIOR GERAL (EMG)
│
└── DPO (Diretoria de Planejamento Operacional) / DGA (Diretoria Geral de Administração)
    │
    ├── DIM (Diretoria Integrada Metropolitana)
    │   ├── 1º BPM
    │   ├── 6º BPM
    │   ├── 11º BPM
    │   ├── 12º BPM
    │   ├── 13º BPM
    │   ├── 8º BPM
    │   ├── 17º BPM
    │   ├── 18º BPM
    │   ├── 19º BPM
    │   ├── 20º BPM
    │   ├── 25º BPM
    │   └── 26º BPM
    │
    ├── DINTER I (Diretoria Integrada do Interior I)
    │   ├── 2º BPM
    │   ├── 4º BPM
    │   ├── 9º BPM
    │   ├── 10º BPM
    │   ├── 15º BPM
    │   ├── 21º BPM
    │   ├── 22º BPM
    │   ├── 24º BPM
    │   └── Companhias Independentes (3ª, 5ª, 6ª, 8ª, 10ª, 11ª CIPM)
    │
    ├── DINTER II (Diretoria Integrada do Interior II)
    │   ├── 3º BPM
    │   ├── 5º BPM
    │   ├── 7º BPM
    │   ├── 8º BPM
    │   ├── 14º BPM
    │   ├── 23º BPM
    │   └── Companhias Independentes (1ª, 2ª, 4ª, 7ª, 9ª CIPM)
    │
    ├── DIRESP (Diretoria Integrada Especializada)
    │   ├── BPRP (Batalhão de Policiamento de Radiopatrulha)
    │   ├── BPCHOQUE (Batalhão de Policiamento de Choque)
    │   ├── BPTran (Batalhão de Policiamento de Trânsito)
    │   ├── BEPI (Batalhão Especializado de Policiamento do Interior)
    │   ├── BOPE (Batalhão de Operações Policiais Especiais)
    │   ├── CIPMoto (Companhia Independente de Policiamento com Motocicletas)
    │   ├── CIPCães (Companhia Independente de Policiamento com Cães)
    │   ├── BPGd (Batalhão de Policiamento de Guardas)
    │   ├── RPMon (Regimento de Policia Montada)
    │   ├── BPRV (Batalhão de Polícia Rodoviária)
    │   ├── BIEsp (Batalhão do Interior Especializado)
    │   ├── CIPOMA (Companhia Independente de Policiamento do Meio Ambiente)
    │   └── CIATur (Companhia de Apoio ao Turista)
    │
    ├── DTEC (Diretoria de Tecnologia)
    │   └── Seções Administrativas
    │
    ├── DAL (Diretoria de Apoio Logístico)
    │   ├── CSM/MB (Centro de Suprimento e Manutenção de Material Bélico)
    │   ├── CSM/Int (Centro de Suprimento e Manutenção de Material de Intendência)
    │   └── CSM/Moto (Centro de Suprimento e Manutenção de Motomecanização)
    │
    ├── DGP (Diretoria de Gestão de Pessoas)
    │   ├── CPM (Colégio da Polícia Militar)
    │   ├── CREED (Centro de Reeducação)
    │   └── CRESEP (Centro de Recrutamento e Seleção de Pessoal)
    │
    ├── DF (Diretoria de Finanças)
    │
    ├── DEIP (Diretoria de Ensino, Instrução e Pesquisa)
    │   ├── APMP (Academia de Polícia Militar de Paudalho)
    │   ├── CFAP (Centro de Formação e Aperfeiçoamento de Praças)
    │   ├── CEFD (Centro de Educação Física e Desporto)
    │   └── CTT (Centro de Treinamento Técnico)
    │
    ├── DASIS (Diretoria de Apoio Administrativo ao Sistema de Saúde)
    │   ├── DS (Diretoria de Saúde)
    │   ├── CMH (Centro Médico Hospitalar)
    │   ├── CODONT (Centro Odontológico)
    │   └── CFARM (Centro Farmacêutico)
    │
    ├── DASDH (Diretoria de Articulação Social e Direitos Humanos)
    │   └── CIMus (Companhia Independente de Música)
    │
    ├── DIP (Diretoria de Inativos e Pensionistas)
    ├── DAS (Diretoria de Assistência Social)
    └── Outras Diretorias e Órgãos

OBSERVAÇÃO IMPORTANTE:
  - Equipamentos sempre são vinculados a uma SEÇÃO
  - Seção pode pertencer a um BATALHÃO (que pertence a uma DIRETORIA)
  - Seção pode pertencer DIRETAMENTE a uma DIRETORIA (sem batalhão)
  
  EXEMPLOS:
  1. Equipamento → Seção SSCOM-1BPM → Batalhão 1º BPM → Diretoria DIM
  2. Equipamento → Seção Administrativa → Diretoria DTEC (direto)

================================================================================
                    6. FLUXOS DE TRABALHO
================================================================================

6.1 FLUXO DE VALIDAÇÃO DE ALTERAÇÕES
=====================================

USUÁRIO BATALHÃO solicita alteração de equipamento
        ↓
Sistema valida se todos os campos obrigatórios estão preenchidos
        ↓
Sistema cria registro em ALTERACOES_PENDENTES:
  - equipamento_id: ID do equipamento
  - dados_antigos: JSON com snapshot dos dados atuais
  - dados_novos: JSON com novos dados propostos
  - campos_alterados: Array com nomes dos campos modificados
  - solicitante_id: ID do usuário que solicitou
  - data_solicitacao: NOW()
        ↓
Sistema NOTIFICA Comandante do Batalhão:
  - Ícone de notificação no header (badge vermelho com contador)
  - Lista de pendências na dashboard
        ↓
COMANDANTE visualiza modal comparativo:
  ┌─────────────────────────────────────────────────────┐
  │ ALTERAÇÃO DE EQUIPAMENTO - PATRIMÔNIO: XXXXX      │
  ├─────────────────────────────────────────────────────┤
  │ CAMPO            │ ANTES          │ DEPOIS         │
  ├─────────────────────────────────────────────────────┤
  │ Status           │ ATIVO          │ CONSERTO       │
  │ Observação       │ -              │ Em manutenção  │
  │ Responsável      │ Sgt Silva      │ Cb Oliveira    │
  └─────────────────────────────────────────────────────┘
        ↓
COMANDANTE decide:
  │
  ├── APROVAR (Botão Verde)
  │     ↓
  │   Sistema atualiza tabela EQUIPAMENTOS com dados_novos
  │   Sistema registra em LOG_OPERACOES (ação: UPDATE_APROVADO)
  │   Sistema atualiza alteracoes_pendentes:
  │     - aprovado = true
  │     - aprovado_por_id = ID do comandante
  │     - data_aprovacao = NOW()
  │   Sistema remove pendência (ou marca como processada)
  │   Notificação enviada ao solicitante (aprovação concedida)
  │
  └── NEGAR (Botão Vermelho)
        ↓
      Sistema abre campo para MOTIVO DA NEGAÇÃO (obrigatório)
        ↓
      Sistema registra em alteracoes_pendentes:
        - aprovado = false
        - motivo_negacao = Texto informado
        - usuario_negador_id = ID do comandante
        - data_aprovacao = NOW()
      Sistema mantém equipamento com dados originais
      Sistema registra em LOG_OPERACOES (ação: UPDATE_NEGADO)
      Notificação enviada ao solicitante (aprovação negada + motivo)

6.2 FLUXO DE CARGA (ENTREGA DEFINITIVA À UNIDADE)
==================================================

DTEC (Administrador) registra novo equipamento:
  - Tipo: CARGA
  - disponibilidade_id = ID de "CARGA"
  - data_retorno_emprestimo = NULL
  - secao_id = Seção da unidade destinatária
  - status_id = ATIVO
        ↓
Equipamento é alocado definitivamente à seção
        ↓
Unidade (Batalhão/Seção) pode usar o equipamento
        ↓
Usuário da unidade pode solicitar alterações (com validação do comandante)
        ↓
Responsabilidade pelo equipamento é da SEÇÃO/BATALHÃO

6.3 FLUXO DE EMPRÉSTIMO TEMPORÁRIO
===================================

DTEC ou Comandante registra empréstimo:
  - Tipo: EMPRÉSTIMO
  - disponibilidade_id = ID de "EMPRESTIMO"
  - data_retorno_emprestimo = DATA FUTURA (obrigatória)
  - usuario_responsavel_id = Pessoa que recebeu
  - status_id = EMPRESTADO
        ↓
Sistema registra em LOG_OPERACOES (ação: EMPRESTIMO_REALIZADO)
        ↓
Sistema pode enviar lembretes automáticos antes do vencimento:
  - 7 dias antes
  - 1 dia antes
  - No dia do vencimento
        ↓
Quando equipamento é devolvido:
  - data_retorno_emprestimo = NULL
  - disponibilidade_id = CARGA (ou DISPONIVEL)
  - status_id = ATIVO
  - usuario_responsavel_id = NULL (ou mantém seção)
        ↓
Sistema registra em LOG_OPERACOES (ação: EMPRESTIMO_DEVOLVIDO)

6.4 FLUXO DE AUTENTICAÇÃO VIA SEI
==================================

Usuário acessa sistema SIGMAT
        ↓
Tela de login solicita:
  - Usuário (matrícula)
  - Senha
        ↓
Backend chama API do SEI:
  POST /api/auth/login
  Body: { matricula: "...", senha: "..." }
        ↓
API SEI valida credenciais e retorna:
  - Token de autenticação
  - Dados do usuário:
    * nome
    * matricula
    * email
    * lotacao (batalhao/secao)
    * posto_graduacao
        ↓
Backend SIGMAT:
  - Valida token do SEI
  - Busca ou cria usuário local (sincronização)
  - Determina perfil de acesso baseado na lotação:
    * Se for DTEC → ADMIN_DTEC
    * Se for Comandante de Batalhão → COMANDANTE
    * Caso contrário → USUARIO_BATALHAO
  - Gera JWT próprio para SIGMAT
        ↓
Usuário logado no sistema com permissões adequadas

================================================================================
                    7. FUNCIONALIDADES DO SISTEMA
================================================================================

7.1 AUTENTICAÇÃO E AUTORIZAÇÃO
===============================
✓ Login via API do SEI (usuário e senha)
✓ Sincronização automática de dados do usuário
✓ JWT para autenticação stateless
✓ Refresh token para renovação de sessão
✓ Logout automático após inatividade
✓ Bloqueio de tela (opcional)

7.2 CONTROLE DE ACESSO POR PERFIL
==================================

ADMIN_DTEC (Administradores da DTEC):
  ✓ Visualizar TODOS os equipamentos de toda a PMPE
  ✓ Cadastrar novos equipamentos
  ✓ Editar qualquer equipamento (sem necessidade de aprovação)
  ✓ Excluir equipamentos (com justificativa)
  ✓ Transferir equipamentos entre unidades
  ✓ Aprovar/negar solicitações de qualquer batalhão
  ✓ Configurar tabelas auxiliares (marcas, modelos, tipos)
  ✓ Gerenciar usuários e permissões
  ✓ Acessar todos os relatórios
  ✓ Exportar dados (CSV, Excel, PDF)
  ✓ Visualizar logs completos de auditoria

COMANDANTE (Comandante de Batalhão):
  ✓ Visualizar equipamentos do seu batalhão e seções
  ✓ Visualizar equipamentos das companhias subordinadas
  ✓ Aprovar/negar alterações solicitadas por usuários do batalhão
  ✓ Solicitar alterações de equipamentos (sujeito a auto-aprovação?)
  ✓ Cadastrar novos equipamentos para o batalhão (sujeito a aprovação DTEC?)
  ✓ Visualizar relatórios do seu batalhão
  ✓ Receber notificações de pendências de aprovação

USUARIO_BATALHAO (Usuário comum do batalhão):
  ✓ Visualizar equipamentos da sua seção/batalhão
  ✓ Solicitar alterações de equipamentos (aguarda aprovação do comandante)
  ✓ Visualizar status das suas solicitações (pendente/aprovada/negada)
  ✓ Registrar ocorrências com equipamentos (avaria, perda, roubo)
  ✓ Consultar histórico do equipamento
  ✓ Visualizar relatórios básicos da sua unidade

7.3 CADASTRO DE EQUIPAMENTOS
=============================

Campos Comuns (todos os equipamentos):
  - Patrimônio (obrigatório, único)
  - Número de Série
  - SEI (número do processo)
  - Data de Aquisição
  - Observação
  - Tipo de Equipamento (select: RÁDIO, CELULAR, CPU, etc.)
  - Marca (select + opção "Nova")
  - Modelo (select + opção "Nova")
  - Status (select: ATIVO, BAIXA, CONSERTO, EMPRESTADO, etc.)
  - Tipo de Aquisição (select: COMODATO, DOAÇÃO, COMPRA)
  - Disponibilidade (select: CARGA, EMPRÉSTIMO)
  - Seção (select baseado na lotação do usuário)
  - Usuário Responsável (select)
  - Data de Retorno (apenas se EMPRÉSTIMO)

Campos Específicos - RÁDIO:
  - Tipo de Rádio (HT, Móvel, Base, Repetidora)
  - Frequência (VHF, UHF, HF)
  - Potência (Watts)
  - Tecnologia (Analógico, Digital, DMR, P25)
  - IMEI/ID

Campos Específicos - CELULAR/CHIP:
  - Número do Telefone
  - Código do Chip (ICCID)
  - Operadora (Claro, Vivo, TIM, etc.)
  - Plano de Serviço

Campos Específicos - COMPUTADOR (CPU):
  - Processador (Intel i5, AMD Ryzen, etc.)
  - Memória RAM (4GB, 8GB, 16GB, etc.)
  - Armazenamento (HD 500GB, SSD 240GB, etc.)
  - Sistema Operacional (Windows 10, Linux, etc.)
  - Placa de Vídeo (Integrada, Dedicada - modelo)

Campos Específicos - MONITOR:
  - Polegadas (19", 22", 24", etc.)
  - Resolução (HD, Full HD, 4K)
  - Tipo (LCD, LED, IPS)

Campos Específicos - TABLET:
  - Polegadas
  - Sistema Operacional
  - Armazenamento
  - IMEI

7.4 FILTROS E BUSCAS
=====================

Filtros Principais (sempre visíveis):
  ✓ Patrimônio (busca rápida)
  ✓ Tipo de Equipamento
  ✓ Status
  ✓ Seção/Batalhão/Diretoria (hierárquico)
  ✓ Responsável

Filtros Avançados (toggle show/hide):
  ✓ Marca
  ✓ Modelo
  ✓ Tipo de Aquisição
  ✓ Disponibilidade (Carga/Emprestimo)
  ✓ Período de Aquisição (data inicial/final)
  ✓ Número de Série
  ✓ SEI
  ✓ Data de Entrada no Sistema
  ✓ Com/sem usuário responsável
  ✓ Equipamentos com pendência de aprovação

Busca Global:
  ✓ Campo de busca única que pesquisa em:
    - Patrimônio
    - Número de Série
    - SEI
    - Marca
    - Modelo
    - Observação
    - Nome do responsável

7.5 VALIDAÇÃO E APROVAÇÃO
==========================

Para Comandantes:
  ✓ Badge de notificação no header (contador vermelho)
  ✓ Página/Modal "Pendências de Aprovação"
  ✓ Visualização comparativa (Antes vs Depois)
  ✓ Lista de campos alterados destacados
  ✓ Botões Aprovar/Negar com confirmação
  ✓ Campo obrigatório para motivo de negação
  ✓ Histórico de aprovações/negações
  ✓ Filtros por data, tipo de alteração, solicitante

Para Usuários:
  ✓ Visualizar minhas solicitações pendentes
  ✓ Status de cada solicitação (Pendente/Aprovada/Negada)
  ✓ Motivo da negação (quando aplicável)
  ✓ Cancelar solicitação pendente
  ✓ Histórico completo das minhas solicitações

7.6 EMPRÉSTIMOS E DEVOLUÇÕES
=============================

Registro de Empréstimo:
  ✓ Selecionar equipamento disponível
  ✓ Definir tipo (Carga/Emprestimo)
  ✓ Se Empréstimo:
    - Data de retorno obrigatória
    - Usuário responsável obrigatório
    - Observações do empréstimo
  ✓ Validar se equipamento não está emprestado
  ✓ Gerar termo de responsabilidade (PDF opcional)
  ✓ Notificar responsável

Controle de Devolução:
  ✓ Lista de empréstimos ativos
  ✓ Filtro por data de vencimento (atrasados, próximos)
  ✓ Registrar devolução:
    - Data real de devolução
    - Estado do equipamento na devolução
    - Observações
  ✓ Calcular dias de atraso (se houver)
  ✓ Notificar administradores sobre atrasos

Relatórios de Empréstimos:
  ✓ Todos os empréstimos ativos
  ✓ Empréstimos por período
  ✓ Empréstimos por responsável
  ✓ Empréstimos por unidade
  ✓ Empréstimos atrasados
  ✓ Histórico de empréstimos por equipamento

7.7 RELATÓRIOS
===============

Relatório Geral (com filtros dinâmicos):
  ✓ Selecionar colunas a exibir
  ✓ Aplicar todos os filtros disponíveis
  ✓ Ordenar por qualquer coluna
  ✓ Agrupar por (Diretoria, Batalhão, Tipo, Status, etc.)
  ✓ Exportar para:
    - Excel (XLSX)
    - CSV
    - PDF
    - Imprimir

Relatórios Pré-definidos:
  1. Inventário Completo
     - Todos os equipamentos
     - Agrupado por Diretoria/Batalhão/Seção
     - Totais por tipo/status
  
  2. Equipamentos por Status
     - Ativos
     - Em Conserto
     - Baixados
     - Emprestados
     - Extraviados
  
  3. Equipamentos por Responsável
     - Por usuário
     - Por seção
     - Por batalhão
  
  4. Equipamentos por Período de Aquisição
     - Últimos 6 meses
     - Último ano
     - Personalizado
  
  5. Equipamentos Emprestados
     - Todos os empréstimos ativos
     - Empréstimos próximos do vencimento
     - Empréstimos atrasados
     - Histórico de empréstimos
  
  6. Pendências de Aprovação
     - Solicitações pendentes
     - Tempo médio de aprovação
     - Taxa de aprovação/negação
  
  7. Relatório de Logs/Auditoria
     - Todas as operações
     - Por usuário
     - Por equipamento
     - Por período
     - Ações específicas (criação, alteração, exclusão)
  
  8. Equipamentos por Tipo/Marca/Modelo
     - Quantitativo por tipo
     - Marcas mais comuns
     - Modelos por fabricante
  
  9. Equipamentos sem Responsável
     - Disponíveis para alocação
     - Em estoque
  
  10. Resumo Executivo (Dashboard)
      - Totais gerais
      - Gráficos
      - Indicadores

7.8 DASHBOARD (PÁGINA INICIAL)
===============================

Para ADMIN_DTEC:
  ✓ Total geral de equipamentos (12.029+)
  ✓ Equipamentos por Diretoria (gráfico pizza/barra)
  ✓ Equipamentos por Status (gráfico pizza)
  ✓ Equipamentos por Tipo (gráfico barra)
  ✓ Últimos equipamentos cadastrados (lista)
  ✓ Pendências de aprovação (total)
  ✓ Empréstimos ativos (total)
  ✓ Empréstimos atrasados (alerta vermelho)
  ✓ Últimas alterações realizadas (log recente)
  ✓ Gráfico de aquisições por mês (linha)

Para COMANDANTE:
  ✓ Total de equipamentos do batalhão
  ✓ Equipamentos por Seção (gráfico)
  ✓ Equipamentos por Status (gráfico)
  ✓ Pendências de aprovação do batalhão (lista)
  ✓ Empréstimos ativos do batalhão
  ✓ Últimas alterações aprovadas/negadas
  ✓ Notificações recentes

Para USUARIO_BATALHAO:
  ✓ Total de equipamentos da minha seção
  ✓ Meus equipamentos responsáveis
  ✓ Minhas solicitações pendentes
  ✓ Últimas alterações aprovadas
  ✓ Empréstimos ativos (meus)

7.9 NOTIFICAÇÕES
=================

Tipos de Notificação:
  ✓ Aprovação pendente (Comandante)
  ✓ Solicitação aprovada (Usuário)
  ✓ Solicitação negada (Usuário)
  ✓ Empréstimo próximo do vencimento (Responsável)
  ✓ Empréstimo atrasado (Responsável + Admin)
  ✓ Novo equipamento alocado (Seção)
  ✓ Alteração realizada (Interessados)

Canais de Notificação:
  ✓ Dentro do sistema (ícone no header com badge)
  ✓ Central de notificações (lista completa)
  ✓ Marcar como lida/não lida
  ✓ Limpar notificações antigas
  ✓ Filtros por tipo/data

7.10 LOGS E AUDITORIA
======================

Registro Automático de:
  ✓ Login/Logout de usuários
  ✓ Criação de equipamentos
  ✓ Alterações solicitadas
  ✓ Aprovações/Negações
  ✓ Exclusões (com justificativa)
  ✓ Transferências entre unidades
  ✓ Empréstimos/Devoluções
  ✓ Exportação de relatórios
  ✓ Mudanças de permissão

Dados Registrados:
  ✓ Usuário que realizou a ação
  ✓ Data/hora exata
  ✓ IP de origem
  ✓ User Agent (navegador/sistema)
  ✓ Tipo de ação (CREATE, UPDATE, DELETE, etc.)
  ✓ Equipamento afetado
  ✓ Dados alterados (JSON diff)
  ✓ Descrição detalhada

Consultas de Log:
  ✓ Filtro por período
  ✓ Filtro por usuário
  ✓ Filtro por equipamento
  ✓ Filtro por tipo de ação
  ✓ Filtro por batalhão/diretoria
  ✓ Exportação de logs (CSV/PDF)

7.11 CONFIGURAÇÕES E PARÂMETROS
================================

Tabelas Auxiliares (CRUD completo):
  ✓ Tipos de Equipamento
  ✓ Marcas
  ✓ Modelos (vinculado à marca)
  ✓ Status de Equipamento
  ✓ Tipos de Aquisição
  ✓ Tipos de Disponibilidade
  ✓ Operadoras de Telefonia
  ✓ Planos de Serviço

Parâmetros do Sistema:
  ✓ Dias para alerta de empréstimo (7, 3, 1 dia antes)
  ✓ Tempo de sessão (minutos de inatividade)
  ✓ Quantidade de itens por página (paginação)
  ✓ Formato de data/hora
  ✓ Fuso horário

Estrutura Organizacional:
  ✓ Diretorias (CRUD - apenas admin)
  ✓ Batalhões (CRUD - apenas admin)
  ✓ Seções (CRUD - apenas admin)
  ✓ Vínculos hierárquicos

================================================================================
                    8. ESTRUTURA DE PASTAS DO PROJETO
================================================================================

FRONTEND (Angular 18):
======================

sigmat-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   ├── role.guard.ts
│   │   │   │   │   └── pending-changes.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts
│   │   │   │   │   ├── error.interceptor.ts
│   │   │   │   │   └── loading.interceptor.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── user.model.ts
│   │   │   │   │   ├── token.model.ts
│   │   │   │   │   └── permissions.model.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts
│   │   │   │       ├── token.service.ts
│   │   │   │       └── permissions.service.ts
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── loading.service.ts
│   │   │   │   └── error-handler.service.ts
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   ├── sidebar/
│   │   │   │   ├── footer/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   ├── loading-overlay/
│   │   │   │   └── notification-badge/
│   │   │   ├── directives/
│   │   │   │   ├── permissions.directive.ts
│   │   │   │   └── mask.directive.ts
│   │   │   ├── pipes/
│   │   │   │   ├── format-cpf.pipe.ts
│   │   │   │   ├── format-date.pipe.ts
│   │   │   │   └── filter.pipe.ts
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── dashboard.component.scss
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── equipamentos/
│   │   │   │   ├── lista/
│   │   │   │   │   ├── equipamento-lista.component.ts
│   │   │   │   │   ├── equipamento-lista.component.html
│   │   │   │   │   └── equipamento-lista.component.scss
│   │   │   │   ├── cadastro/
│   │   │   │   │   ├── equipamento-form.component.ts
│   │   │   │   │   ├── equipamento-form.component.html
│   │   │   │   │   └── equipamento-form.component.scss
│   │   │   │   ├── detalhe/
│   │   │   │   │   └── equipamento-detalhe.component.ts
│   │   │   │   ├── filtros/
│   │   │   │   │   └── equipamento-filtros.component.ts
│   │   │   │   └── equipamentos.routes.ts
│   │   │   │
│   │   │   ├── aprovacoes/
│   │   │   │   ├── pendencias/
│   │   │   │   │   ├── pendencias-lista.component.ts
│   │   │   │   │   └── pendencias-lista.component.html
│   │   │   │   ├── modal-aprovacao/
│   │   │   │   │   ├── modal-aprovacao.component.ts
│   │   │   │   │   └── modal-aprovacao.component.html
│   │   │   │   └── aprovacoes.routes.ts
│   │   │   │
│   │   │   ├── emprestimos/
│   │   │   │   ├── lista/
│   │   │   │   │   └── emprestimo-lista.component.ts
│   │   │   │   ├── cadastro/
│   │   │   │   │   └── emprestimo-form.component.ts
│   │   │   │   ├── devolucao/
│   │   │   │   │   └── emprestimo-devolucao.component.ts
│   │   │   │   └── emprestimos.routes.ts
│   │   │   │
│   │   │   ├── relatorios/
│   │   │   │   ├── relatorio-geral/
│   │   │   │   │   └── relatorio-geral.component.ts
│   │   │   │   ├── relatorios-predefinidos/
│   │   │   │   │   └── relatorios-predefinidos.component.ts
│   │   │   │   └── relatorios.routes.ts
│   │   │   │
│   │   │   ├── logs/
│   │   │   │   ├── logs-lista.component.ts
│   │   │   │   └── logs.routes.ts
│   │   │   │
│   │   │   └── configuracoes/
│   │   │       ├── tabelas-auxiliares/
│   │   │       │   └── tabelas-auxiliares.component.ts
│   │   │       ├── estrutura-organizacional/
│   │   │       │   └── estrutura-organizacional.component.ts
│   │   │       └── configuracoes.routes.ts
│   │   │
│   │   ├── models/
│   │   │   ├── equipamento.model.ts
│   │   │   ├── diretorio.model.ts
│   │   │   ├── batalhao.model.ts
│   │   │   ├── secao.model.ts
│   │   │   ├── pendencia.model.ts
│   │   │   ├── emprestimo.model.ts
│   │   │   └── log.model.ts
│   │   │
│   │   ├── services/
│   │   │   ├── equipamentos.service.ts
│   │   │   ├── aprovacoes.service.ts
│   │   │   ├── emprestimos.service.ts
│   │   │   ├── relatorios.service.ts
│   │   │   ├── logs.service.ts
│   │   │   └── configuracoes.service.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── formatters.ts
│   │   │
│   │   ├── app.routes.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.config.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── i18n/
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   └── styles.scss
│   │
│   └── index.html
│
├── angular.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md

BACKEND (NestJS):
=================

sigmat-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── api-response.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── validation-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── pipes/
│   │   │   └── parse-object-id.pipe.ts
│   │   └── interfaces/
│   │       ├── paginated-response.interface.ts
│   │       └── jwt-payload.interface.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── sei.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── interfaces/
│   │   │       └── sei-user.interface.ts
│   │   │
│   │   ├── usuarios/
│   │   │   ├── usuarios.controller.ts
│   │   │   ├── usuarios.service.ts
│   │   │   ├── usuarios.module.ts
│   │   │   ├── entities/
│   │   │   │   └── usuario.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-usuario.dto.ts
│   │   │       └── update-usuario.dto.ts
│   │   │
│   │   ├── equipamentos/
│   │   │   ├── equipamentos.controller.ts
│   │   │   ├── equipamentos.service.ts
│   │   │   ├── equipamentos.module.ts
│   │   │   ├── entities/
│   │   │   │   ├── equipamento.entity.ts
│   │   │   │   ├── tipo-equipamento.entity.ts
│   │   │   │   ├── marca.entity.ts
│   │   │   │   ├── modelo.entity.ts
│   │   │   │   ├── status-equipamento.entity.ts
│   │   │   │   └── ...
│   │   │   ├── dto/
│   │   │   │   ├── create-equipamento.dto.ts
│   │   │   │   ├── update-equipamento.dto.ts
│   │   │   │   └── filters-equipamento.dto.ts
│   │   │   └── interfaces/
│   │   │       └── equipamento-specifics.interface.ts
│   │   │
│   │   ├── aprovacoes/
│   │   │   ├── aprovacoes.controller.ts
│   │   │   ├── aprovacoes.service.ts
│   │   │   ├── aprovacoes.module.ts
│   │   │   ├── entities/
│   │   │   │   └── alteracao-pendente.entity.ts
│   │   │   └── dto/
│   │   │       ├── criar-pendencia.dto.ts
│   │   │       └── aprovar-pendencia.dto.ts
│   │   │
│   │   ├── emprestimos/
│   │   │   ├── emprestimos.controller.ts
│   │   │   ├── emprestimos.service.ts
│   │   │   ├── emprestimos.module.ts
│   │   │   └── dto/
│   │   │       ├── registrar-emprestimo.dto.ts
│   │   │       └── registrar-devolucao.dto.ts
│   │   │
│   │   ├── relatorios/
│   │   │   ├── relatorios.controller.ts
│   │   │   ├── relatorios.service.ts
│   │   │   ├── relatorios.module.ts
│   │   │   └── utils/
│   │   │       ├── excel-generator.ts
│   │   │       ├── pdf-generator.ts
│   │   │       └── csv-generator.ts
│   │   │
│   │   ├── logs/
│   │   │   ├── logs.controller.ts
│   │   │   ├── logs.service.ts
│   │   │   ├── logs.module.ts
│   │   │   └── entities/
│   │   │       └── log-operacao.entity.ts
│   │   │
│   │   ├── estrutura-organizacional/
│   │   │   ├── estrutura.controller.ts
│   │   │   ├── estrutura.service.ts
│   │   │   ├── estrutura.module.ts
│   │   │   └── entities/
│   │   │       ├── diretorio.entity.ts
│   │   │       ├── batalhao.entity.ts
│   │   │       └── secao.entity.ts
│   │   │
│   │   └── configuracoes/
│   │       ├── configuracoes.controller.ts
│   │       ├── configuracoes.service.ts
│   │       └── configuracoes.module.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── prisma.service.ts
│   │
│   └── integrations/
│       ├── sei/
│       │   ├── sei.service.ts
│       │   ├── sei.module.ts
│       │   └── sei.interfaces.ts
│       └── notifications/
│           ├── notifications.service.ts
│           └── notifications.module.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   │   └── migration_lock.toml
│   └── seed.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md

================================================================================
                    9. API REST - ENDPOINTS PRINCIPAIS
================================================================================

BASE URL: /api/v1

AUTENTICAÇÃO:
=============
POST   /auth/login                    - Login via SEI
POST   /auth/refresh                  - Refresh token
POST   /auth/logout                   - Logout
GET    /auth/me                       - Dados do usuário logado

USUÁRIOS:
=========
GET    /usuarios                      - Listar usuários (paginado)
GET    /usuarios/:id                  - Buscar usuário por ID
POST   /usuarios                      - Criar usuário (admin)
PUT    /usuarios/:id                  - Atualizar usuário
DELETE /usuarios/:id                  - Excluir usuário (admin)
GET    /usuarios/me/perfil            - Perfil do usuário logado

EQUIPAMENTOS:
=============
GET    /equipamentos                  - Listar equipamentos (filtros, paginado)
GET    /equipamentos/:id              - Buscar equipamento por ID
POST   /equipamentos                  - Criar equipamento
PUT    /equipamentos/:id              - Solicitar alteração (cria pendência)
DELETE /equipamentos/:id              - Excluir equipamento (admin)
GET    /equipamentos/:id/historico    - Histórico de alterações
GET    /equipamentos/:id/logs         - Logs do equipamento
POST   /equipamentos/:id/transferir   - Transferir entre unidades

APROVAÇÕES:
===========
GET    /aprovacoes/pendentes          - Listar pendências (comandante)
GET    /aprovacoes/pendentes/:id      - Detalhes da pendência
POST   /aprovacoes/:id/aprovar        - Aprovar alteração
POST   /aprovacoes/:id/negar          - Negar alteração
GET    /aprovacoes/historico          - Histórico de aprovações

EMPRÉSTIMOS:
============
GET    /emprestimos                   - Listar empréstimos
GET    /emprestimos/ativos            - Empréstimos ativos
GET    /emprestimos/atrasados         - Empréstimos atrasados
POST   /emprestimos                   - Registrar empréstimo
POST   /emprestimos/:id/devolver      - Registrar devolução
GET    /emprestimos/:id               - Detalhes do empréstimo
PUT    /emprestimos/:id               - Atualizar empréstimo

RELATÓRIOS:
===========
GET    /relatorios/geral              - Relatório geral (com filtros)
GET    /relatorios/inventario         - Inventário completo
GET    /relatorios/por-status         - Equipamentos por status
GET    /relatorios/por-responsavel    - Por responsável
GET    /relatorios/emprestimos        - Relatório de empréstimos
GET    /relatorios/pendencias         - Pendências de aprovação
POST   /relatorios/export/excel       - Exportar para Excel
POST   /relatorios/export/pdf         - Exportar para PDF
POST   /relatorios/export/csv         - Exportar para CSV

LOGS:
=====
GET    /logs                          - Listar logs (filtros)
GET    /logs/:id                      - Detalhes do log
GET    /logs/usuario/:usuarioId       - Logs por usuário
GET    /logs/equipamento/:equipId     - Logs por equipamento

ESTRUTURA ORGANIZACIONAL:
=========================
GET    /diretorias                    - Listar diretorias
GET    /diretorias/:id                - Detalhes da diretoria
GET    /diretorias/:id/batalhoes      - Batalhões da diretoria
GET    /batalhoes                     - Listar batalhões
GET    /batalhoes/:id                 - Detalhes do batalhão
GET    /batalhoes/:id/secoes          - Seções do batalhão
GET    /secoes                        - Listar seções
GET    /secoes/:id                    - Detalhes da seção

CONFIGURAÇÕES:
==============
GET    /configuracoes/tipos-equipamento    - Tipos de equipamento
POST   /configuracoes/tipos-equipamento    - Criar tipo
PUT    /configuracoes/tipos-equipamento/:id
DELETE /configuracoes/tipos-equipamento/:id

GET    /configuracoes/marcas               - Marcas
POST   /configuracoes/marcas               - Criar marca
PUT    /configuracoes/marcas/:id
DELETE /configuracoes/marcas/:id

GET    /configuracoes/modelos              - Modelos
POST   /configuracoes/modelos              - Criar modelo
PUT    /configuracoes/modelos/:id
DELETE /configuracoes/modelos/:id

GET    /configuracoes/status               - Status
GET    /configuracoes/tipos-aquisicao      - Tipos de aquisição
GET    /configuracoes/disponibilidades     - Disponibilidades

NOTIFICAÇÕES:
=============
GET    /notificacoes                  - Listar notificações do usuário
GET    /notificacoes/nao-lidas        - Contador de não lidas
PUT    /notificacoes/:id/lida         - Marcar como lida
PUT    /notificacoes/todas-lidas      - Marcar todas como lidas
DELETE /notificacoes/:id              - Excluir notificação

DASHBOARD:
==========
GET    /dashboard/resumo              - Resumo do dashboard (por perfil)
GET    /dashboard/estatisticas        - Estatísticas gerais
GET    /dashboard/graficos/tipo       - Gráfico por tipo
GET    /dashboard/graficos/status     - Gráfico por status
GET    /dashboard/graficos/diretoria  - Gráfico por diretoria

================================================================================
                    10. TELAS DO FRONTEND
================================================================================

1. LOGIN
========
- Logo PMPE + SIGMAT
- Campos: Matrícula, Senha
- Botão: Entrar
- Link: Esqueci minha senha
- Validação: Login via API SEI

2. DASHBOARD
============
Layout: Grid com cards e gráficos

Cards Superiores:
- Total de Equipamentos
- Pendências de Aprovação
- Empréstimos Ativos
- Empréstimos Atrasados

Gráficos:
- Equipamentos por Tipo (Barra)
- Equipamentos por Status (Pizza)
- Equipamentos por Diretoria/Batalhão (Barra Horizontal)
- Aquisições por Mês (Linha)

Listas:
- Últimos Equipamentos Cadastrados
- Pendências Recentes
- Empréstimos Próximos do Vencimento

3. LISTA DE EQUIPAMENTOS
=========================
Layout: Tabela PrimeNG com filtros

Filtros Principais (topo):
- Campo de busca rápida (patrimônio)
- Dropdown: Tipo de Equipamento
- Dropdown: Status
- Dropdown: Seção/Batalhão (hierárquico)
- Botão: Filtros Avançados (toggle)

Filtros Avançados (expansível):
- Marca, Modelo
- Tipo de Aquisição
- Disponibilidade
- Período de Aquisição (date range)
- Número de Série
- Responsável

Tabela:
- Colunas: Edit | Patrimônio | Tipo | Marca | Modelo | Status | Seção | Responsável
- Ações por linha: Editar | Visualizar | Histórico
- Paginação: 10, 25, 50, 100 itens
- Ordenação por coluna
- Seleção múltipla (checkbox)
- Exportar seleção

Botões:
- + Novo Equipamento (permissão)
- Exportar (Excel/CSV/PDF)
- Imprimir

4. CADASTRO/EDIÇÃO DE EQUIPAMENTO
==================================
Layout: Formulário em abas ou steps

Step 1 - Informações Básicas:
- Patrimônio (obrigatório)
- Número de Série
- SEI
- Data de Aquisição (calendar)
- Tipo de Equipamento (dropdown)
- Marca (dropdown + botão "Nova")
- Modelo (dropdown + botão "Novo")
- Status (dropdown)
- Tipo de Aquisição (dropdown)
- Observação (textarea)

Step 2 - Alocação:
- Disponibilidade (Carga/Emprestimo - radio)
- Seção (dropdown hierárquico)
- Usuário Responsável (dropdown)
- Data de Retorno (aparece se Empréstimo)

Step 3 - Dados Específicos (dinâmico por tipo):
Se RÁDIO:
- Tipo de Rádio
- Frequência
- Potência
- Tecnologia
- IMEI

Se CELULAR:
- Número do Telefone
- Código do Chip
- Operadora
- Plano de Serviço

Se COMPUTADOR:
- Processador
- Memória RAM
- Armazenamento
- Sistema Operacional
- Placa de Vídeo

Se MONITOR:
- Polegadas
- Resolução
- Tipo

Botões:
- Salvar (cria pendência se não for admin)
- Cancelar
- Voltar

5. DETALHES DO EQUIPAMENTO
===========================
Layout: Tabs com informações

Tab 1 - Informações Gerais:
- Todos os dados do equipamento (somente leitura)
- Badge de status colorido
- QR Code do patrimônio (opcional)

Tab 2 - Histórico de Alterações:
- Timeline com todas as alterações
- Data, usuário, campos modificados
- Status da aprovação

Tab 3 - Logs:
- Tabela com logs de operações
- Data, ação, usuário, IP

Tab 4 - Empréstimos:
- Histórico de empréstimos
- Datas, responsáveis, observações

Botões de Ação:
- Editar (solicitar alteração)
- Transferir
- Emprestar/Devolver
- Imprimir ficha
- Exportar PDF

6. PENDÊNCIAS DE APROVAÇÃO (Comandante)
========================================
Layout: Tabela com badge de notificação

Tabela de Pendências:
- Colunas: Data | Equipamento | Solicitante | Tipo Alteração | Status
- Ações: Visualizar | Aprovar | Negar
- Filtros: Período, Solicitante, Tipo

Modal de Aprovação:
- Header: Patrimônio + Tipo + Responsável
- Tabela Comparativa:
  CAMPO            | ANTES          | DEPOIS
  Status           | ATIVO          | CONSERTO
  Observação       | -              | Em manutenção
  
- Botões:
  - APROVAR (verde)
  - NEGAR (vermelho - abre campo motivo)
  - CANCELAR

7. EMPRÉSTIMOS
===============
Layout: Tabs

Tab 1 - Empréstimos Ativos:
- Tabela: Equipamento | Responsável | Data Ida | Data Retorno | Status
- Filtros: Próximos do vencimento, Atrasados
- Ações: Registrar Devolução | Visualizar

Tab 2 - Registrar Empréstimo:
- Selecionar Equipamento (dropdown com filtros)
- Tipo (Carga/Emprestimo)
- Se Empréstimo:
  - Data de Retorno (obrigatória)
  - Usuário Responsável (obrigatório)
  - Observações
- Botão: Confirmar Empréstimo

Tab 3 - Histórico:
- Todos os empréstimos
- Filtros por período, responsável, equipamento

8. RELATÓRIOS
==============
Layout: Sidebar com opções + área principal

Sidebar:
- Relatório Geral
- Inventário Completo
- Por Status
- Por Responsável
- Por Período
- Empréstimos
- Pendências
- Logs/Auditoria

Área Principal (Relatório Geral):
- Seletor de Colunas (checkboxes)
- Filtros Dinâmicos (todos os campos)
- Agrupamento (dropdown)
- Ordenação
- Botão: Gerar Relatório

Resultado:
- Tabela com dados
- Totalizador
- Botões: Exportar Excel | Exportar PDF | Imprimir

9. LOGS/AUDITORIA
==================
Layout: Tabela avançada

Filtros:
- Período (date range)
- Usuário (dropdown)
- Equipamento (busca)
- Tipo de Ação (checkboxes: CREATE, UPDATE, DELETE...)
- Batalhão/Diretoria

Tabela:
- Data/Hora
- Usuário
- Ação
- Equipamento
- Descrição
- IP
- Botão: Visualizar Detalhes

Modal de Detalhes:
- Dados completos do log
- JSON dos dados alterados (formatado)

10. CONFIGURAÇÕES
=================
Layout: Menu lateral + conteúdo

Menu:
- Tabelas Auxiliares
  - Tipos de Equipamento
  - Marcas
  - Modelos
  - Status
  - Tipos de Aquisição
  - Disponibilidades

- Estrutura Organizacional
  - Diretorias
  - Batalhões
  - Seções

- Parâmetros do Sistema
  - Dias de alerta
  - Tempo de sessão
  - etc.

Cada tela de CRUD:
- Tabela com listagem
- Botão: Novo
- Ações: Editar | Excluir
- Modal de cadastro/edição

================================================================================
                    11. RELATÓRIOS
================================================================================

11.1 RELATÓRIO GERAL (DINÂMICO)
================================

Funcionalidades:
✓ Seleção de colunas (checkboxes)
✓ Todos os filtros disponíveis
✓ Agrupamento por qualquer campo
✓ Ordenação múltipla
✓ Totais e subtotais
✓ Exportação multi-formato

Colunas Disponíveis:
- Patrimônio
- Tipo de Equipamento
- Marca
- Modelo
- Número de Série
- SEI
- Data de Aquisição
- Status
- Tipo de Aquisição
- Disponibilidade
- Diretoria
- Batalhão
- Seção
- Usuário Responsável
- Data de Entrada
- Data de Retorno (se empréstimo)
- Observação
- Dados específicos (por tipo)

Agrupamentos:
- Por Diretoria
- Por Batalhão
- Por Seção
- Por Tipo de Equipamento
- Por Status
- Por Responsável
- Por Marca
- Por Tipo de Aquisição

Formatos de Exportação:
- Excel (XLSX) - com formatação, fórmulas
- CSV - separador configurável
- PDF - layout profissional
- Impressão direta

11.2 RELATÓRIO DE INVENTÁRIO
=============================

Objetivo: Listagem completa para conferência física

Conteúdo:
- Todos os equipamentos ativos
- Agrupado por Diretoria → Batalhão → Seção
- Subtotais por seção
- Total geral

Campos:
- Patrimônio
- Tipo
- Marca/Modelo
- Status
- Responsável
- Localização (Seção)

Recursos:
- Geração de etiquetas (código de barras/QR Code)
- Checklist para conferência
- Exportação para planilha de conferência

11.3 RELATÓRIO POR STATUS
==========================

Objetivo: Situação atual dos equipamentos

Seções:
1. Equipamentos Ativos
   - Em uso
   - Disponíveis
   
2. Equipamentos em Conserto
   - Data de envio
   - Previsão de retorno
   - Responsável pelo conserto
   
3. Equipamentos Baixados
   - Motivo da baixa
   - Data
   - Responsável pela baixa
   
4. Equipamentos Emprestados
   - Responsável
   - Data de retorno
   - Status (em dia/atrasado)

5. Equipamentos Extraviados
   - Data do extravio
   - BO registrado
   - Responsável

11.4 RELATÓRIO POR RESPONSÁVEL
===============================

Objetivo: Equipamentos sob responsabilidade de cada usuário

Conteúdo:
- Listagem por usuário
- Total de equipamentos por responsável
- Histórico de responsabilidades
- Equipamentos sem responsável

Campos:
- Nome do Responsável
- Matrícula
- Lotação (Seção/Batalhão)
- Quantidade de Equipamentos
- Lista de Patrimônios
- Data da Última Alocação

11.5 RELATÓRIO DE EMPRÉSTIMOS
==============================

Objetivo: Controle completo de empréstimos

Seções:

1. Empréstimos Ativos
   - Equipamento
   - Responsável
   - Data de Ida
   - Data de Retorno Prevista
   - Dias Restantes
   - Status (Em dia / Atrasado)

2. Empréstimos Próximos do Vencimento
   - Vencem em até 7 dias
   - Alerta visual (amarelo/laranja/vermelho)

3. Empréstimos Atrasados
   - Equipamento
   - Responsável
   - Data Prevista
   - Dias de Atraso
   - Contato do Responsável

4. Histórico de Empréstimos
   - Todos os empréstimos realizados
   - Período configurável
   - Tempo médio de empréstimo

11.6 RELATÓRIO DE PENDÊNCIAS
=============================

Objetivo: Acompanhamento do workflow de aprovação

Conteúdo:
- Pendências por Comandante
- Tempo médio de aprovação
- Taxa de aprovação vs negação
- Pendências antigas (alerta)

Campos:
- Data da Solicitação
- Equipamento
- Solicitante
- Tipo de Alteração
- Campos Modificados
- Tempo de Pendência
- Status

11.7 RELATÓRIO DE LOGS/AUDITORIA
=================================

Objetivo: Auditoria completa do sistema

Filtros:
- Período
- Usuário
- Equipamento
- Tipo de Ação
- Batalhão/Diretoria

Conteúdo:
- Data/Hora
- Usuário
- Ação (CREATE, UPDATE, DELETE, APROVAR, NEGAR)
- Equipamento Afetado
- IP de Origem
- Descrição Detalhada
- Dados Alterados (JSON)

Recursos:
- Exportação para auditoria externa
- Busca full-text
- Filtros avançados

11.8 RELATÓRIO DE AQUISIÇÕES
=============================

Objetivo: Controle de entradas de equipamentos

Conteúdo:
- Equipamentos adquiridos por período
- Por tipo de aquisição (Compra, Comodato, Doação)
- Por fornecedor (se disponível)
- Valor total (se disponível)

Campos:
- Data de Aquisição
- Tipo de Equipamento
- Tipo de Aquisição
- Quantidade
- Empenho (se disponível)
- Origem

11.9 RELATÓRIO EXECUTIVO/DASHBOARD
===================================

Objetivo: Visão gerencial para comando

Indicadores:
- Total de Equipamentos
- Total por Diretoria
- Total por Status
- Equipamentos por Tipo
- Taxa de Equipamentos Ativos
- Empréstimos Ativos
- Empréstimos Atrasados
- Pendências de Aprovação

Gráficos:
- Evolução de aquisições (últimos 12 meses)
- Distribuição por tipo
- Distribuição por status
- Top 10 marcas
- Equipamentos por batalhão

Tabelas Resumo:
- Top 10 equipamentos mais emprestados
- Batalhões com mais equipamentos
- Usuários com mais equipamentos responsáveis

================================================================================
                    12. PLANO DE DESENVOLVIMENTO
================================================================================

FASE 1 - INFRAESTRUTURA E AUTENTICAÇÃO (Semanas 1-2)
=====================================================

Semana 1:
✓ Configurar ambiente de desenvolvimento
✓ Criar repositórios Git (frontend/backend)
✓ Configurar NestJS + Prisma
✓ Configurar Angular 18 + PrimeNG + Tailwind
✓ Modelagem do banco de dados (Prisma Schema)
✓ Migrations iniciais
✓ Seed de dados básicos (tabelas auxiliares)

Semana 2:
✓ Integração com API do SEI
✓ Autenticação JWT
✓ Guards de autenticação e autorização
✓ Serviço de usuários
✓ Sincronização de dados do SEI
✓ Tela de Login
✓ Proteção de rotas

Entregáveis Fase 1:
- Ambiente configurado
- Banco de dados criado
- Login funcional via SEI
- Usuários sincronizados

FASE 2 - CADASTRO DE EQUIPAMENTOS (Semanas 3-5)
================================================

Semana 3:
✓ CRUD de tabelas auxiliares (backend)
✓ CRUD de estrutura organizacional
✓ Entidades de equipamentos
✓ Relacionamentos
✓ Validações

Semana 4:
✓ API de equipamentos (CRUD completo)
✓ Upload de dados específicos por tipo
✓ Filtros e buscas
✓ Paginação
✓ Documentação Swagger

Semana 5:
✓ Tela de lista de equipamentos
✓ Componentes de filtro
✓ Tabela PrimeNG
✓ Paginação e ordenação
✓ Busca global

Entregáveis Fase 2:
- CRUD completo de equipamentos
- Listagem com filtros
- Dados específicos por tipo

FASE 3 - WORKFLOW DE APROVAÇÃO (Semanas 6-7)
=============================================

Semana 6:
✓ Modelo de pendências de aprovação
✓ Serviço de aprovações
✓ Comparação de dados (diff)
✓ API de aprovação/negação
✓ Notificações

Semana 7:
✓ Tela de pendências (Comandante)
✓ Modal comparativo (Antes/Depois)
✓ Fluxo de aprovação
✓ Notificações no frontend
✓ Histórico de aprovações

Entregáveis Fase 3:
- Workflow completo de validação
- Aprovações funcionais
- Notificações

FASE 4 - EMPRÉSTIMOS E DEVOLUÇÕES (Semanas 8-9)
================================================

Semana 8:
✓ Modelo de empréstimos
✓ API de registro de empréstimo
✓ API de devolução
✓ Cálculo de atrasos
✓ Alertas de vencimento

Semana 9:
✓ Tela de empréstimos
✓ Formulário de registro
✓ Tela de devolução
✓ Lista de empréstimos ativos/atrasados
✓ Relatórios de empréstimos

Entregáveis Fase 4:
- Controle completo de empréstimos
- Alertas de vencimento
- Relatórios

FASE 5 - RELATÓRIOS (Semanas 10-11)
====================================

Semana 10:
✓ Serviço de relatórios
✓ Exportação Excel (xlsx)
✓ Exportação CSV
✓ Exportação PDF
✓ Filtros dinâmicos

Semana 11:
✓ Telas de relatórios
✓ Relatório geral dinâmico
✓ Relatórios pré-definidos
✓ Visualização de dados
✓ Impressão

Entregáveis Fase 5:
- Todos os relatórios funcionais
- Exportação em múltiplos formatos

FASE 6 - DASHBOARD E LOGS (Semanas 12-13)
==========================================

Semana 12:
✓ API de estatísticas
✓ Agregações de dados
✓ Gráficos (backend)
✓ Logs de operação
✓ Auditoria

Semana 13:
✓ Dashboard (por perfil)
✓ Gráficos PrimeNG
✓ Cards de indicadores
✓ Tela de logs
✓ Filtros de logs

Entregáveis Fase 6:
- Dashboard completo
- Logs e auditoria

FASE 7 - MIGRAÇÃO DE DADOS (Semana 14)
=======================================

Semana 14:
✓ Script de exportação Oracle → CSV
✓ Mapeamento de campos
✓ Script de importação CSV → PostgreSQL
✓ Validação de dados migrados
✓ Ajustes e correções
✓ Testes de integridade

Entregáveis Fase 7:
- 12.029 equipamentos migrados
- Dados validados
- Integridade garantida

FASE 8 - TESTES E AJUSTES (Semanas 15-16)
==========================================

Semana 15:
✓ Testes unitários (backend)
✓ Testes de integração
✓ Testes e2e (frontend)
✓ Correção de bugs
✓ Otimizações de performance

Semana 16:
✓ Testes de usabilidade
✓ Ajustes de UI/UX
✓ Validação com usuários reais
✓ Documentação técnica
✓ Manual do usuário

Entregáveis Fase 8:
- Sistema testado e estável
- Documentação completa
- Pronto para produção

FASE 9 - DEPLOY E TREINAMENTO (Semana 17)
==========================================

Semana 17:
✓ Configurar servidor de produção
✓ Deploy backend (servidor PMPE)
✓ Deploy frontend (Vercel ou PMPE)
✓ Configurar banco de dados produção
✓ Backup automático
✓ Monitoramento
✓ Treinamento de administradores
✓ Treinamento de comandantes
✓ Treinamento de usuários

Entregáveis Fase 9:
- Sistema em produção
- Usuários treinados
- Suporte inicial

CRONOGRAMA RESUMO:
==================

Fase 1: Infraestrutura e Auth        - 2 semanas
Fase 2: Cadastro Equipamentos        - 3 semanas
Fase 3: Workflow Aprovação           - 2 semanas
Fase 4: Empréstimos                  - 2 semanas
Fase 5: Relatórios                    - 2 semanas
Fase 6: Dashboard e Logs             - 2 semanas
Fase 7: Migração de Dados            - 1 semana
Fase 8: Testes e Ajustes             - 2 semanas
Fase 9: Deploy e Treinamento         - 1 semana

TOTAL: 17 SEMANAS (~4 meses)

================================================================================
                    13. MIGRAÇÃO DE DADOS
================================================================================

13.1 ESTRATÉGIA DE MIGRAÇÃO
============================

Fonte: Oracle APEX (sistema atual)
Destino: PostgreSQL (novo sistema)
Formato: CSV intermediário
Volume: ~12.029 equipamentos

13.2 MAPEAMENTO DE CAMPOS
==========================

ORACLE APEX                    →    POSTGRESQL (NOVO)
-------------------                -------------------
EQUIPAMENTO.ID                   →   equipamentos.id
EQUIPAMENTO.PATRIMONIO           →   equipamentos.patrimonio
EQUIPAMENTO.NUMERO_SERIE         →   equipamentos.numero_serie
EQUIPAMENTO.SEI                  →   equipamentos.sei
EQUIPAMENTO.DATA_AQUISICAO       →   equipamentos.data_aquisicao
EQUIPAMENTO.OBSERVACAO           →   equipamentos.observacao
EQUIPAMENTO.ID_TIPO              →   equipamentos.tipo_equipamento_id
EQUIPAMENTO.ID_MODELO            →   equipamentos.modelo_id
EQUIPAMENTO.ID_STATUS            →   equipamentos.status_id
EQUIPAMENTO.ID_TIPO_AQUISICAO    →   equipamentos.tipo_aquisicao_id
EQUIPAMENTO.ID_SECAO             →   equipamentos.secao_id
EQUIPAMENTO.USUARIO_SOLICITANTE  →   equipamentos.usuario_responsavel_id
EQUIPAMENTO.DATA_RETORNO_EMPRESTIMO → equipamentos.data_retorno_emprestimo
EQUIPAMENTO.ID_DISPONIBILIDADE   →   equipamentos.disponibilidade_id

TABELAS ESPECÍFICAS:
CELULAR.*                        →   equipamentos.dados_especificos (JSON)
RADIO.*                          →   equipamentos.dados_especificos (JSON)
CPU.*                            →   equipamentos.dados_especificos (JSON)
MONITOR.*                        →   equipamentos.dados_especificos (JSON)
MODEM.*                          →   equipamentos.dados_especificos (JSON)
CHIP.*                           →   equipamentos.dados_especificos (JSON)

13.3 SCRIPT DE EXPORTAÇÃO (ORACLE)
===================================

-- Exportar equipamentos principais
SPOOL equipamentos.csv

SELECT 
    e.ID_EQUIPAMENTO,
    e.PATRIMONIO,
    e.NUMERO_SERIE,
    e.SEI,
    TO_CHAR(e.DATA_AQUISICAO, 'YYYY-MM-DD') as DATA_AQUISICAO,
    e.OBSERVACAO,
    e.ID_TIPO,
    e.ID_MODELO,
    e.ID_STATUS,
    e.ID_TIPO_AQUISICAO,
    e.ID_SECAO,
    e.USUARIO_SOLICITANTE,
    TO_CHAR(e.DATA_RETORNO_EMPRESTIMO, 'YYYY-MM-DD') as DATA_RETORNO,
    e.ID_DISPONIBILIDADE,
    -- Dados específicos (unir todas as tabelas)
    CASE 
        WHEN t.nome = 'CELULAR' THEN c.numero_telefone
        ELSE NULL
    END as numero_telefone,
    -- ... outros campos específicos
FROM EQUIPAMENTO e
LEFT JOIN TIPO_EQUIPAMENTO t ON e.ID_TIPO = t.ID
LEFT JOIN CELULAR c ON e.ID_EQUIPAMENTO = c.ID_EQUIPAMENTO
LEFT JOIN RADIO r ON e.ID_EQUIPAMENTO = r.ID_EQUIPAMENTO
-- ... outros joins

SPOOL OFF

13.4 SCRIPT DE IMPORTAÇÃO (POSTGRESQL)
=======================================

-- Script Node.js/TypeScript com Prisma

import * as fs from 'fs';
import * as csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateEquipamentos() {
    const resultados = [];
    
    fs.createReadStream('equipamentos.csv')
        .pipe(csv())
        .on('data', async (row) => {
            try {
                // Mapear dados
                const equipamento = {
                    patrimonio: row.PATRIMONIO,
                    numeroSerie: row.NUMERO_SERIE,
                    sei: row.SEI,
                    dataAquisicao: row.DATA_AQUISICAO ? new Date(row.DATA_AQUISICAO) : null,
                    observacao: row.OBSERVACAO,
                    tipoEquipamentoId: parseInt(row.ID_TIPO),
                    modeloId: row.ID_MODELO ? parseInt(row.ID_MODELO) : null,
                    statusId: parseInt(row.ID_STATUS),
                    tipoAquisicaoId: row.ID_TIPO_AQUISICAO ? parseInt(row.ID_TIPO_AQUISICAO) : null,
                    secaoId: parseInt(row.ID_SECAO),
                    usuarioResponsavelId: row.USUARIO_SOLICITANTE ? parseInt(row.USUARIO_SOLICITANTE) : null,
                    dataRetornoEmprestimo: row.DATA_RETORNO ? new Date(row.DATA_RETORNO) : null,
                    disponibilidadeId: parseInt(row.ID_DISPONIBILIDADE),
                    
                    // Dados específicos em JSON
                    dadosEspecificos: {
                        numeroTelefone: row.numero_telefone || null,
                        // ... outros campos
                    }
                };
                
                // Inserir no banco
                const created = await prisma.equipamento.create({
                    data: equipamento
                });
                
                resultados.push({ sucesso: true, patrimonio: row.PATRIMONIO });
                
            } catch (error) {
                resultados.push({ 
                    sucesso: false, 
                    patrimonio: row.PATRIMONIO,
                    erro: error.message 
                });
            }
        })
        .on('end', () => {
            console.log('Migração concluída!');
            console.log(`Total: ${resultados.length}`);
            console.log(`Sucessos: ${resultados.filter(r => r.sucesso).length}`);
            console.log(`Erros: ${resultados.filter(r => !r.sucesso).length}`);
            
            // Salvar log de erros
            fs.writeFileSync('migracao-log.json', JSON.stringify(resultados, null, 2));
        });
}

migrateEquipamentos();

13.5 VALIDAÇÃO PÓS-MIGRAÇÃO
============================

✓ Contagem total: 12.029 equipamentos
✓ Verificar patrimônios duplicados
✓ Validar relacionamentos (foreign keys)
✓ Verificar dados nulos obrigatórios
✓ Validar datas (formato e consistência)
✓ Testar consultas principais
✓ Validar dados específicos por tipo
✓ Verificar estrutura organizacional
✓ Testar login de usuários migrados

13.6 PLANO DE ROLLBACK
=======================

Em caso de problemas na migração:

1. Backup completo do PostgreSQL antes da migração
2. Script de limpeza (truncate tables)
3. Restaurar backup se necessário
4. Corrigir problemas identificados
5. Tentar nova migração

================================================================================
                    14. SEGURANÇA E AUTENTICAÇÃO
================================================================================

14.1 AUTENTICAÇÃO
==================

Mecanismo: JWT (JSON Web Tokens)
Validade: 
- Access Token: 15 minutos
- Refresh Token: 7 dias

Fluxo:
1. Usuário informa matrícula e senha
2. Backend valida credenciais na API do SEI
3. SEI retorna dados do usuário
4. Backend gera JWT próprio
5. Frontend armazena tokens (httpOnly cookie + memory)
6. Requisições subsequentes usam Authorization: Bearer <token>
7. Refresh token automático antes da expiração

14.2 AUTORIZAÇÃO
=================

Perfis de Acesso (Roles):

ADMIN_DTEC:
- Acesso total a todos os recursos
- Bypass em validações
- Gestão de usuários e permissões
- Configurações do sistema
- Logs completos

COMANDANTE:
- Visualizar equipamentos do seu batalhão
- Aprovar/negar pendências do batalhão
- Relatórios do batalhão
- Gestão de usuários do batalhão

USUARIO_BATALHAO:
- Visualizar equipamentos da sua seção/batalhão
- Solicitar alterações (sujeito a aprovação)
- Relatórios básicos da unidade

Guards:
- @Roles() decorator no NestJS
- Verificação em cada endpoint
- Retorno 403 Forbidden se sem permissão

14.3 SEGURANÇA DA APLICAÇÃO
============================

Backend:
✓ Helmet (headers de segurança)
✓ CORS configurado (domínios permitidos)
✓ Rate limiting (prevenção de brute force)
✓ Validação de inputs (class-validator)
✓ Sanitização de dados
✓ SQL Injection prevention (Prisma ORM)
✓ XSS Protection
✓ HTTPS obrigatório (produção)
✓ Hash de senhas (bcrypt) - se houver
✓ Logs de segurança

Frontend:
✓ Sanitização de inputs
✓ Proteção contra XSS
✓ CSRF tokens
✓ Content Security Policy
✓ Armazenamento seguro de tokens
✓ Logout automático por inatividade
✓ Bloqueio de tela (opcional)

14.4 PROTEÇÃO DE DADOS
=======================

Dados Sensíveis:
- Dados de policiais militares
- Localização de equipamentos
- Informações operacionais

Medidas:
✓ Criptografia em trânsito (HTTPS/TLS)
✓ Criptografia em repouso (banco de dados)
✓ Backup automático criptografado
✓ Controle de acesso rigoroso
✓ Logs de auditoria completos
✓ Máscara de dados em logs
✓ Política de retenção de logs
✓ Conformidade com LGPD

14.5 AUDITORIA E COMPLIANCE
============================

Logs de Segurança:
- Todos os logins (sucesso/fracasso)
- Alterações de permissões
- Acessos a dados sensíveis
- Exportação de relatórios
- Mudanças de configuração

Retenção:
- Logs de autenticação: 2 anos
- Logs de operação: 5 anos
- Logs de segurança: 5 anos

Relatórios de Auditoria:
- Acesso por período
- Ações por usuário
- Tentativas de acesso não autorizado
- Mudanças críticas

================================================================================
                    15. CONSIDERAÇÕES FINAIS
================================================================================

15.1 BENEFÍCIOS DA NOVA ARQUITETURA
====================================

✓ Performance: Angular + Node.js são mais rápidos que Oracle APEX
✓ Escalabilidade: Arquitetura moderna e distribuída
✓ Manutenibilidade: Código organizado e documentado
✓ Flexibilidade: Fácil adição de novas funcionalidades
✓ UX/UI: Interface moderna e responsiva (PrimeNG + Tailwind)
✓ Integração: API REST facilita integrações futuras
✓ Segurança: Práticas modernas de segurança
✓ Mobile: Responsivo para acesso via tablet/celular

15.2 PRÓXIMOS PASSOS APÓS IMPLANTAÇÃO
======================================

Fase 2 (Futuro):
□ Aplicativo mobile nativo (React Native/Flutter)
□ Leitura de QR Code para inventário
□ Notificações push
□ Assinatura digital de termos
□ Integração com sistema de chamados
□ Relatórios avançados com BI
□ Machine Learning para previsão de manutenção
□ Integração com sistema financeiro (empenhos)
□ Multi-tenancy (outras polícias militares)

15.3 SUPORTE E MANUTENÇÃO
==========================

Suporte Técnico:
- Canal de atendimento (email/telefone)
- Documentação online
- FAQ e tutoriais
- Treinamento contínuo

Manutenção:
- Correção de bugs (SLA definido)
- Atualizações de segurança
- Melhorias incrementais
- Backup automático diário
- Monitoramento 24/7

15.4 INDICADORES DE SUCESSO
============================




