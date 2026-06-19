Vou enviar um projeto completo de Controle de Equipamentos Organize as Ideias

> NavegaÃ§Ã£o: [[atlas - Mapa de ConteÃºdo]] Â· [[Manual do Obsidian]] Â· [[EvoluÃ§Ã£o do Pensamento]]

================================================================================
                    SISTEMA atlas - PMPE
        SISTEMA DE GESTÃƒO DE MATERIAIS E EQUIPAMENTOS
           POLÃCIA MILITAR DE PERNAMBUCO
================================================================================

DOCUMENTO DE ARQUITETURA E ESPECIFICAÃ‡ÃƒO TÃ‰CNICA
VersÃ£o: 1.0
Data: Abril/2026
ResponsÃ¡vel: Desenvolvimento atlas

================================================================================
                         ÃNDICE
================================================================================

1. VISÃƒO GERAL DO PROJETO
2. STACK TECNOLÃ“GICA
3. ARQUITETURA DE DADOS
4. MODELO DE BANCO DE DADOS (PRISMA SCHEMA)
5. HIERARQUIA ORGANIZACIONAL
6. FLUXOS DE TRABALHO
7. FUNCIONALIDADES DO SISTEMA
8. ESTRUTURA DE PASTAS DO PROJETO
9. API REST - ENDPOINTS PRINCIPAIS
10. TELAS DO FRONTEND
11. RELATÃ“RIOS
12. PLANO DE DESENVOLVIMENTO
13. MIGRAÃ‡ÃƒO DE DADOS
14. SEGURANÃ‡A E AUTENTICAÃ‡ÃƒO
15. CONSIDERAÃ‡Ã•ES FINAIS

================================================================================
                    1. VISÃƒO GERAL DO PROJETO
================================================================================

SISTEMA: atlas - Sistema de GestÃ£o de Materiais da PMPE
CLIENTE: PolÃ­cia Militar de Pernambuco
OBJETIVO: Controle completo de equipamentos (inventÃ¡rio, emprÃ©stimos, 
          validaÃ§Ãµes, relatÃ³rios e auditoria)

QUANTIDADE ATUAL: 12.029 equipamentos cadastrados
TIPOS DE EQUIPAMENTOS:
  - RÃ¡dios comunicadores
  - Celulares e chips
  - Computadores (CPU, monitor, teclado, mouse)
  - Tablets
  - Modems
  - Fontes/Carregadores
  - Outros equipamentos

PROBLEMA ATUAL: Sistema em Oracle APEX 24.1 com limitaÃ§Ãµes
SOLUÃ‡ÃƒO: MigraÃ§Ã£o para arquitetura moderna Angular + Node.js + PostgreSQL

================================================================================
                    2. STACK TECNOLÃ“GICA
================================================================================

FRONTEND:
  - Framework: Angular 18 (Standalone Components + Signals)
  - UI Library: PrimeNG 18 (componentes enterprise)
  - EstilizaÃ§Ã£o: Tailwind CSS 3.4+
  - Ãcones: PrimeIcons
  - GrÃ¡ficos: PrimeNG Charts (Chart.js)
  - HTTP Client: Angular HttpClient + RxJS
  - Roteamento: Angular Router
  - Estado: Angular Signals + RxJS BehaviorSubject
  - ValidaÃ§Ã£o: Reactive Forms + Validators personalizados

BACKEND:
  - Runtime: Node.js 20+ LTS
  - Framework: NestJS 10+ (arquitetura enterprise modular)
  - ORM: Prisma 5+ (type-safe, migrations automÃ¡ticas)
  - Banco: PostgreSQL 15+
  - AutenticaÃ§Ã£o: JWT (JSON Web Tokens) + Passport
  - ValidaÃ§Ã£o: class-validator + class-transformer
  - DocumentaÃ§Ã£o: Swagger/OpenAPI (automÃ¡tica)
  - Logs: Winston + Morgan
  - Cache: Redis (opcional para performance)

INFRAESTRUTURA:
  - Frontend: Vercel (CDN global, deploy automÃ¡tico via Git)
  - Backend: Servidor PMPE (Linux/Ubuntu 22.04) ou Docker Compose
  - Banco de Dados: PostgreSQL em servidor PMPE (dados sensÃ­veis)
  - Versionamento: Git/GitHub ou GitLab
  - CI/CD: GitHub Actions ou GitLab CI

INTEGRAÃ‡Ã•ES:
  - API do SEI (Sistema EletrÃ´nico de InformaÃ§Ãµes)
    * AutenticaÃ§Ã£o: Login usuÃ¡rio/senha via API
    * Formato: JSON
    * Endpoints: Dados do usuÃ¡rio, lotaÃ§Ã£o, estrutura organizacional
  - Ambiente: Desenvolvimento local â†’ HomologaÃ§Ã£o â†’ ProduÃ§Ã£o (PMPE)

================================================================================
                    3. ARQUITETURA DE DADOS
================================================================================

PRINCÃPIOS:
  - NormalizaÃ§Ã£o: 3Âª Forma Normal (3NF)
  - Integridade: Foreign Keys e Constraints
  - Performance: Ãndices estratÃ©gicos
  - Auditoria: Logs completos de todas as operaÃ§Ãµes
  - Flexibilidade: Campos JSON para dados especÃ­ficos por tipo

CARACTERÃSTICAS:
  - Equipamento Ã© a tabela principal
  - Tabelas auxiliares para normalizaÃ§Ã£o (tipos, marcas, modelos, status)
  - Tabelas especÃ­ficas para campos extras por tipo de equipamento
  - Workflow de aprovaÃ§Ã£o com tabela de pendÃªncias
  - Log de operaÃ§Ãµes para auditoria completa
  - HistÃ³rico de transferÃªncias (emprÃ©stimos/devoluÃ§Ãµes)

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

-- USUÃRIOS (SINCRONIZADO COM SEI)

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
    
    -- Controle de EmprÃ©stimo
    data_retorno_emprestimo DATE,
    
    -- AprovaÃ§Ã£o (workflow)
    data_aprovacao TIMESTAMP,
    usuario_aprovador_id INTEGER REFERENCES usuarios(id),
    motivo_negacao TEXT,
    usuario_negador_id INTEGER REFERENCES usuarios(id),
    
    -- Dados especÃ­ficos (JSON flexÃ­vel)
    dados_especificos JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WORKFLOW DE VALIDAÃ‡ÃƒO

CREATE TABLE alteracoes_pendentes (
    id SERIAL PRIMARY KEY,
    equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
    
    dados_antigos JSONB NOT NULL,
    dados_novos JSONB NOT NULL,
    campos_alterados TEXT[] NOT NULL,
    
    solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- AprovaÃ§Ã£o
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

-- ÃNDICES PARA PERFORMANCE

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
â”‚
â”œâ”€â”€ SUBCOMANDO GERAL / ESTADO-MAIOR GERAL (EMG)
â”‚
â””â”€â”€ DPO (Diretoria de Planejamento Operacional) / DGA (Diretoria Geral de AdministraÃ§Ã£o)
    â”‚
    â”œâ”€â”€ DIM (Diretoria Integrada Metropolitana)
    â”‚   â”œâ”€â”€ 1Âº BPM
    â”‚   â”œâ”€â”€ 6Âº BPM
    â”‚   â”œâ”€â”€ 11Âº BPM
    â”‚   â”œâ”€â”€ 12Âº BPM
    â”‚   â”œâ”€â”€ 13Âº BPM
    â”‚   â”œâ”€â”€ 8Âº BPM
    â”‚   â”œâ”€â”€ 17Âº BPM
    â”‚   â”œâ”€â”€ 18Âº BPM
    â”‚   â”œâ”€â”€ 19Âº BPM
    â”‚   â”œâ”€â”€ 20Âº BPM
    â”‚   â”œâ”€â”€ 25Âº BPM
    â”‚   â””â”€â”€ 26Âº BPM
    â”‚
    â”œâ”€â”€ DINTER I (Diretoria Integrada do Interior I)
    â”‚   â”œâ”€â”€ 2Âº BPM
    â”‚   â”œâ”€â”€ 4Âº BPM
    â”‚   â”œâ”€â”€ 9Âº BPM
    â”‚   â”œâ”€â”€ 10Âº BPM
    â”‚   â”œâ”€â”€ 15Âº BPM
    â”‚   â”œâ”€â”€ 21Âº BPM
    â”‚   â”œâ”€â”€ 22Âº BPM
    â”‚   â”œâ”€â”€ 24Âº BPM
    â”‚   â””â”€â”€ Companhias Independentes (3Âª, 5Âª, 6Âª, 8Âª, 10Âª, 11Âª CIPM)
    â”‚
    â”œâ”€â”€ DINTER II (Diretoria Integrada do Interior II)
    â”‚   â”œâ”€â”€ 3Âº BPM
    â”‚   â”œâ”€â”€ 5Âº BPM
    â”‚   â”œâ”€â”€ 7Âº BPM
    â”‚   â”œâ”€â”€ 8Âº BPM
    â”‚   â”œâ”€â”€ 14Âº BPM
    â”‚   â”œâ”€â”€ 23Âº BPM
    â”‚   â””â”€â”€ Companhias Independentes (1Âª, 2Âª, 4Âª, 7Âª, 9Âª CIPM)
    â”‚
    â”œâ”€â”€ DIRESP (Diretoria Integrada Especializada)
    â”‚   â”œâ”€â”€ BPRP (BatalhÃ£o de Policiamento de Radiopatrulha)
    â”‚   â”œâ”€â”€ BPCHOQUE (BatalhÃ£o de Policiamento de Choque)
    â”‚   â”œâ”€â”€ BPTran (BatalhÃ£o de Policiamento de TrÃ¢nsito)
    â”‚   â”œâ”€â”€ BEPI (BatalhÃ£o Especializado de Policiamento do Interior)
    â”‚   â”œâ”€â”€ BOPE (BatalhÃ£o de OperaÃ§Ãµes Policiais Especiais)
    â”‚   â”œâ”€â”€ CIPMoto (Companhia Independente de Policiamento com Motocicletas)
    â”‚   â”œâ”€â”€ CIPCÃ£es (Companhia Independente de Policiamento com CÃ£es)
    â”‚   â”œâ”€â”€ BPGd (BatalhÃ£o de Policiamento de Guardas)
    â”‚   â”œâ”€â”€ RPMon (Regimento de Policia Montada)
    â”‚   â”œâ”€â”€ BPRV (BatalhÃ£o de PolÃ­cia RodoviÃ¡ria)
    â”‚   â”œâ”€â”€ BIEsp (BatalhÃ£o do Interior Especializado)
    â”‚   â”œâ”€â”€ CIPOMA (Companhia Independente de Policiamento do Meio Ambiente)
    â”‚   â””â”€â”€ CIATur (Companhia de Apoio ao Turista)
    â”‚
    â”œâ”€â”€ DTEC (Diretoria de Tecnologia)
    â”‚   â””â”€â”€ SeÃ§Ãµes Administrativas
    â”‚
    â”œâ”€â”€ DAL (Diretoria de Apoio LogÃ­stico)
    â”‚   â”œâ”€â”€ CSM/MB (Centro de Suprimento e ManutenÃ§Ã£o de Material BÃ©lico)
    â”‚   â”œâ”€â”€ CSM/Int (Centro de Suprimento e ManutenÃ§Ã£o de Material de IntendÃªncia)
    â”‚   â””â”€â”€ CSM/Moto (Centro de Suprimento e ManutenÃ§Ã£o de MotomecanizaÃ§Ã£o)
    â”‚
    â”œâ”€â”€ DGP (Diretoria de GestÃ£o de Pessoas)
    â”‚   â”œâ”€â”€ CPM (ColÃ©gio da PolÃ­cia Militar)
    â”‚   â”œâ”€â”€ CREED (Centro de ReeducaÃ§Ã£o)
    â”‚   â””â”€â”€ CRESEP (Centro de Recrutamento e SeleÃ§Ã£o de Pessoal)
    â”‚
    â”œâ”€â”€ DF (Diretoria de FinanÃ§as)
    â”‚
    â”œâ”€â”€ DEIP (Diretoria de Ensino, InstruÃ§Ã£o e Pesquisa)
    â”‚   â”œâ”€â”€ APMP (Academia de PolÃ­cia Militar de Paudalho)
    â”‚   â”œâ”€â”€ CFAP (Centro de FormaÃ§Ã£o e AperfeiÃ§oamento de PraÃ§as)
    â”‚   â”œâ”€â”€ CEFD (Centro de EducaÃ§Ã£o FÃ­sica e Desporto)
    â”‚   â””â”€â”€ CTT (Centro de Treinamento TÃ©cnico)
    â”‚
    â”œâ”€â”€ DASIS (Diretoria de Apoio Administrativo ao Sistema de SaÃºde)
    â”‚   â”œâ”€â”€ DS (Diretoria de SaÃºde)
    â”‚   â”œâ”€â”€ CMH (Centro MÃ©dico Hospitalar)
    â”‚   â”œâ”€â”€ CODONT (Centro OdontolÃ³gico)
    â”‚   â””â”€â”€ CFARM (Centro FarmacÃªutico)
    â”‚
    â”œâ”€â”€ DASDH (Diretoria de ArticulaÃ§Ã£o Social e Direitos Humanos)
    â”‚   â””â”€â”€ CIMus (Companhia Independente de MÃºsica)
    â”‚
    â”œâ”€â”€ DIP (Diretoria de Inativos e Pensionistas)
    â”œâ”€â”€ DAS (Diretoria de AssistÃªncia Social)
    â””â”€â”€ Outras Diretorias e Ã“rgÃ£os

OBSERVAÃ‡ÃƒO IMPORTANTE:
  - Equipamentos sempre sÃ£o vinculados a uma SEÃ‡ÃƒO
  - SeÃ§Ã£o pode pertencer a um BATALHÃƒO (que pertence a uma DIRETORIA)
  - SeÃ§Ã£o pode pertencer DIRETAMENTE a uma DIRETORIA (sem batalhÃ£o)
  
  EXEMPLOS:
  1. Equipamento â†’ SeÃ§Ã£o SSCOM-1BPM â†’ BatalhÃ£o 1Âº BPM â†’ Diretoria DIM
  2. Equipamento â†’ SeÃ§Ã£o Administrativa â†’ Diretoria DTEC (direto)

================================================================================
                    6. FLUXOS DE TRABALHO
================================================================================

6.1 FLUXO DE VALIDAÃ‡ÃƒO DE ALTERAÃ‡Ã•ES
=====================================

USUÃRIO BATALHÃƒO solicita alteraÃ§Ã£o de equipamento
        â†“
Sistema valida se todos os campos obrigatÃ³rios estÃ£o preenchidos
        â†“
Sistema cria registro em ALTERACOES_PENDENTES:
  - equipamento_id: ID do equipamento
  - dados_antigos: JSON com snapshot dos dados atuais
  - dados_novos: JSON com novos dados propostos
  - campos_alterados: Array com nomes dos campos modificados
  - solicitante_id: ID do usuÃ¡rio que solicitou
  - data_solicitacao: NOW()
        â†“
Sistema NOTIFICA Comandante do BatalhÃ£o:
  - Ãcone de notificaÃ§Ã£o no header (badge vermelho com contador)
  - Lista de pendÃªncias na dashboard
        â†“
COMANDANTE visualiza modal comparativo:
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ ALTERAÃ‡ÃƒO DE EQUIPAMENTO - PATRIMÃ”NIO: XXXXX      â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ CAMPO            â”‚ ANTES          â”‚ DEPOIS         â”‚
  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
  â”‚ Status           â”‚ ATIVO          â”‚ CONSERTO       â”‚
  â”‚ ObservaÃ§Ã£o       â”‚ -              â”‚ Em manutenÃ§Ã£o  â”‚
  â”‚ ResponsÃ¡vel      â”‚ Sgt Silva      â”‚ Cb Oliveira    â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â†“
COMANDANTE decide:
  â”‚
  â”œâ”€â”€ APROVAR (BotÃ£o Verde)
  â”‚     â†“
  â”‚   Sistema atualiza tabela EQUIPAMENTOS com dados_novos
  â”‚   Sistema registra em LOG_OPERACOES (aÃ§Ã£o: UPDATE_APROVADO)
  â”‚   Sistema atualiza alteracoes_pendentes:
  â”‚     - aprovado = true
  â”‚     - aprovado_por_id = ID do comandante
  â”‚     - data_aprovacao = NOW()
  â”‚   Sistema remove pendÃªncia (ou marca como processada)
  â”‚   NotificaÃ§Ã£o enviada ao solicitante (aprovaÃ§Ã£o concedida)
  â”‚
  â””â”€â”€ NEGAR (BotÃ£o Vermelho)
        â†“
      Sistema abre campo para MOTIVO DA NEGAÃ‡ÃƒO (obrigatÃ³rio)
        â†“
      Sistema registra em alteracoes_pendentes:
        - aprovado = false
        - motivo_negacao = Texto informado
        - usuario_negador_id = ID do comandante
        - data_aprovacao = NOW()
      Sistema mantÃ©m equipamento com dados originais
      Sistema registra em LOG_OPERACOES (aÃ§Ã£o: UPDATE_NEGADO)
      NotificaÃ§Ã£o enviada ao solicitante (aprovaÃ§Ã£o negada + motivo)

6.2 FLUXO DE CARGA (ENTREGA DEFINITIVA Ã€ UNIDADE)
==================================================

DTEC (Administrador) registra novo equipamento:
  - Tipo: CARGA
  - disponibilidade_id = ID de "CARGA"
  - data_retorno_emprestimo = NULL
  - secao_id = SeÃ§Ã£o da unidade destinatÃ¡ria
  - status_id = ATIVO
        â†“
Equipamento Ã© alocado definitivamente Ã  seÃ§Ã£o
        â†“
Unidade (BatalhÃ£o/SeÃ§Ã£o) pode usar o equipamento
        â†“
UsuÃ¡rio da unidade pode solicitar alteraÃ§Ãµes (com validaÃ§Ã£o do comandante)
        â†“
Responsabilidade pelo equipamento Ã© da SEÃ‡ÃƒO/BATALHÃƒO

6.3 FLUXO DE EMPRÃ‰STIMO TEMPORÃRIO
===================================

DTEC ou Comandante registra emprÃ©stimo:
  - Tipo: EMPRÃ‰STIMO
  - disponibilidade_id = ID de "EMPRESTIMO"
  - data_retorno_emprestimo = DATA FUTURA (obrigatÃ³ria)
  - usuario_responsavel_id = Pessoa que recebeu
  - status_id = EMPRESTADO
        â†“
Sistema registra em LOG_OPERACOES (aÃ§Ã£o: EMPRESTIMO_REALIZADO)
        â†“
Sistema pode enviar lembretes automÃ¡ticos antes do vencimento:
  - 7 dias antes
  - 1 dia antes
  - No dia do vencimento
        â†“
Quando equipamento Ã© devolvido:
  - data_retorno_emprestimo = NULL
  - disponibilidade_id = CARGA (ou DISPONIVEL)
  - status_id = ATIVO
  - usuario_responsavel_id = NULL (ou mantÃ©m seÃ§Ã£o)
        â†“
Sistema registra em LOG_OPERACOES (aÃ§Ã£o: EMPRESTIMO_DEVOLVIDO)

6.4 FLUXO DE AUTENTICAÃ‡ÃƒO VIA SEI
==================================

UsuÃ¡rio acessa sistema atlas
        â†“
Tela de login solicita:
  - UsuÃ¡rio (matrÃ­cula)
  - Senha
        â†“
Backend chama API do SEI:
  POST /api/auth/login
  Body: { matricula: "...", senha: "..." }
        â†“
API SEI valida credenciais e retorna:
  - Token de autenticaÃ§Ã£o
  - Dados do usuÃ¡rio:
    * nome
    * matricula
    * email
    * lotacao (batalhao/secao)
    * posto_graduacao
        â†“
Backend atlas:
  - Valida token do SEI
  - Busca ou cria usuÃ¡rio local (sincronizaÃ§Ã£o)
  - Determina perfil de acesso baseado na lotaÃ§Ã£o:
    * Se for DTEC â†’ ADMIN_DTEC
    * Se for Comandante de BatalhÃ£o â†’ COMANDANTE
    * Caso contrÃ¡rio â†’ USUARIO_BATALHAO
  - Gera JWT prÃ³prio para atlas
        â†“
UsuÃ¡rio logado no sistema com permissÃµes adequadas

================================================================================
                    7. FUNCIONALIDADES DO SISTEMA
================================================================================

7.1 AUTENTICAÃ‡ÃƒO E AUTORIZAÃ‡ÃƒO
===============================
âœ“ Login via API do SEI (usuÃ¡rio e senha)
âœ“ SincronizaÃ§Ã£o automÃ¡tica de dados do usuÃ¡rio
âœ“ JWT para autenticaÃ§Ã£o stateless
âœ“ Refresh token para renovaÃ§Ã£o de sessÃ£o
âœ“ Logout automÃ¡tico apÃ³s inatividade
âœ“ Bloqueio de tela (opcional)

7.2 CONTROLE DE ACESSO POR PERFIL
==================================

ADMIN_DTEC (Administradores da DTEC):
  âœ“ Visualizar TODOS os equipamentos de toda a PMPE
  âœ“ Cadastrar novos equipamentos
  âœ“ Editar qualquer equipamento (sem necessidade de aprovaÃ§Ã£o)
  âœ“ Excluir equipamentos (com justificativa)
  âœ“ Transferir equipamentos entre unidades
  âœ“ Aprovar/negar solicitaÃ§Ãµes de qualquer batalhÃ£o
  âœ“ Configurar tabelas auxiliares (marcas, modelos, tipos)
  âœ“ Gerenciar usuÃ¡rios e permissÃµes
  âœ“ Acessar todos os relatÃ³rios
  âœ“ Exportar dados (CSV, Excel, PDF)
  âœ“ Visualizar logs completos de auditoria

COMANDANTE (Comandante de BatalhÃ£o):
  âœ“ Visualizar equipamentos do seu batalhÃ£o e seÃ§Ãµes
  âœ“ Visualizar equipamentos das companhias subordinadas
  âœ“ Aprovar/negar alteraÃ§Ãµes solicitadas por usuÃ¡rios do batalhÃ£o
  âœ“ Solicitar alteraÃ§Ãµes de equipamentos (sujeito a auto-aprovaÃ§Ã£o?)
  âœ“ Cadastrar novos equipamentos para o batalhÃ£o (sujeito a aprovaÃ§Ã£o DTEC?)
  âœ“ Visualizar relatÃ³rios do seu batalhÃ£o
  âœ“ Receber notificaÃ§Ãµes de pendÃªncias de aprovaÃ§Ã£o

USUARIO_BATALHAO (UsuÃ¡rio comum do batalhÃ£o):
  âœ“ Visualizar equipamentos da sua seÃ§Ã£o/batalhÃ£o
  âœ“ Solicitar alteraÃ§Ãµes de equipamentos (aguarda aprovaÃ§Ã£o do comandante)
  âœ“ Visualizar status das suas solicitaÃ§Ãµes (pendente/aprovada/negada)
  âœ“ Registrar ocorrÃªncias com equipamentos (avaria, perda, roubo)
  âœ“ Consultar histÃ³rico do equipamento
  âœ“ Visualizar relatÃ³rios bÃ¡sicos da sua unidade

7.3 CADASTRO DE EQUIPAMENTOS
=============================

Campos Comuns (todos os equipamentos):
  - PatrimÃ´nio (obrigatÃ³rio, Ãºnico)
  - NÃºmero de SÃ©rie
  - SEI (nÃºmero do processo)
  - Data de AquisiÃ§Ã£o
  - ObservaÃ§Ã£o
  - Tipo de Equipamento (select: RÃDIO, CELULAR, CPU, etc.)
  - Marca (select + opÃ§Ã£o "Nova")
  - Modelo (select + opÃ§Ã£o "Nova")
  - Status (select: ATIVO, BAIXA, CONSERTO, EMPRESTADO, etc.)
  - Tipo de AquisiÃ§Ã£o (select: COMODATO, DOAÃ‡ÃƒO, COMPRA)
  - Disponibilidade (select: CARGA, EMPRÃ‰STIMO)
  - SeÃ§Ã£o (select baseado na lotaÃ§Ã£o do usuÃ¡rio)
  - UsuÃ¡rio ResponsÃ¡vel (select)
  - Data de Retorno (apenas se EMPRÃ‰STIMO)

Campos EspecÃ­ficos - RÃDIO:
  - Tipo de RÃ¡dio (HT, MÃ³vel, Base, Repetidora)
  - FrequÃªncia (VHF, UHF, HF)
  - PotÃªncia (Watts)
  - Tecnologia (AnalÃ³gico, Digital, DMR, P25)
  - IMEI/ID

Campos EspecÃ­ficos - CELULAR/CHIP:
  - NÃºmero do Telefone
  - CÃ³digo do Chip (ICCID)
  - Operadora (Claro, Vivo, TIM, etc.)
  - Plano de ServiÃ§o

Campos EspecÃ­ficos - COMPUTADOR (CPU):
  - Processador (Intel i5, AMD Ryzen, etc.)
  - MemÃ³ria RAM (4GB, 8GB, 16GB, etc.)
  - Armazenamento (HD 500GB, SSD 240GB, etc.)
  - Sistema Operacional (Windows 10, Linux, etc.)
  - Placa de VÃ­deo (Integrada, Dedicada - modelo)

Campos EspecÃ­ficos - MONITOR:
  - Polegadas (19", 22", 24", etc.)
  - ResoluÃ§Ã£o (HD, Full HD, 4K)
  - Tipo (LCD, LED, IPS)

Campos EspecÃ­ficos - TABLET:
  - Polegadas
  - Sistema Operacional
  - Armazenamento
  - IMEI

7.4 FILTROS E BUSCAS
=====================

Filtros Principais (sempre visÃ­veis):
  âœ“ PatrimÃ´nio (busca rÃ¡pida)
  âœ“ Tipo de Equipamento
  âœ“ Status
  âœ“ SeÃ§Ã£o/BatalhÃ£o/Diretoria (hierÃ¡rquico)
  âœ“ ResponsÃ¡vel

Filtros AvanÃ§ados (toggle show/hide):
  âœ“ Marca
  âœ“ Modelo
  âœ“ Tipo de AquisiÃ§Ã£o
  âœ“ Disponibilidade (Carga/Emprestimo)
  âœ“ PerÃ­odo de AquisiÃ§Ã£o (data inicial/final)
  âœ“ NÃºmero de SÃ©rie
  âœ“ SEI
  âœ“ Data de Entrada no Sistema
  âœ“ Com/sem usuÃ¡rio responsÃ¡vel
  âœ“ Equipamentos com pendÃªncia de aprovaÃ§Ã£o

Busca Global:
  âœ“ Campo de busca Ãºnica que pesquisa em:
    - PatrimÃ´nio
    - NÃºmero de SÃ©rie
    - SEI
    - Marca
    - Modelo
    - ObservaÃ§Ã£o
    - Nome do responsÃ¡vel

7.5 VALIDAÃ‡ÃƒO E APROVAÃ‡ÃƒO
==========================

Para Comandantes:
  âœ“ Badge de notificaÃ§Ã£o no header (contador vermelho)
  âœ“ PÃ¡gina/Modal "PendÃªncias de AprovaÃ§Ã£o"
  âœ“ VisualizaÃ§Ã£o comparativa (Antes vs Depois)
  âœ“ Lista de campos alterados destacados
  âœ“ BotÃµes Aprovar/Negar com confirmaÃ§Ã£o
  âœ“ Campo obrigatÃ³rio para motivo de negaÃ§Ã£o
  âœ“ HistÃ³rico de aprovaÃ§Ãµes/negaÃ§Ãµes
  âœ“ Filtros por data, tipo de alteraÃ§Ã£o, solicitante

Para UsuÃ¡rios:
  âœ“ Visualizar minhas solicitaÃ§Ãµes pendentes
  âœ“ Status de cada solicitaÃ§Ã£o (Pendente/Aprovada/Negada)
  âœ“ Motivo da negaÃ§Ã£o (quando aplicÃ¡vel)
  âœ“ Cancelar solicitaÃ§Ã£o pendente
  âœ“ HistÃ³rico completo das minhas solicitaÃ§Ãµes

7.6 EMPRÃ‰STIMOS E DEVOLUÃ‡Ã•ES
=============================

Registro de EmprÃ©stimo:
  âœ“ Selecionar equipamento disponÃ­vel
  âœ“ Definir tipo (Carga/Emprestimo)
  âœ“ Se EmprÃ©stimo:
    - Data de retorno obrigatÃ³ria
    - UsuÃ¡rio responsÃ¡vel obrigatÃ³rio
    - ObservaÃ§Ãµes do emprÃ©stimo
  âœ“ Validar se equipamento nÃ£o estÃ¡ emprestado
  âœ“ Gerar termo de responsabilidade (PDF opcional)
  âœ“ Notificar responsÃ¡vel

Controle de DevoluÃ§Ã£o:
  âœ“ Lista de emprÃ©stimos ativos
  âœ“ Filtro por data de vencimento (atrasados, prÃ³ximos)
  âœ“ Registrar devoluÃ§Ã£o:
    - Data real de devoluÃ§Ã£o
    - Estado do equipamento na devoluÃ§Ã£o
    - ObservaÃ§Ãµes
  âœ“ Calcular dias de atraso (se houver)
  âœ“ Notificar administradores sobre atrasos

RelatÃ³rios de EmprÃ©stimos:
  âœ“ Todos os emprÃ©stimos ativos
  âœ“ EmprÃ©stimos por perÃ­odo
  âœ“ EmprÃ©stimos por responsÃ¡vel
  âœ“ EmprÃ©stimos por unidade
  âœ“ EmprÃ©stimos atrasados
  âœ“ HistÃ³rico de emprÃ©stimos por equipamento

7.7 RELATÃ“RIOS
===============

RelatÃ³rio Geral (com filtros dinÃ¢micos):
  âœ“ Selecionar colunas a exibir
  âœ“ Aplicar todos os filtros disponÃ­veis
  âœ“ Ordenar por qualquer coluna
  âœ“ Agrupar por (Diretoria, BatalhÃ£o, Tipo, Status, etc.)
  âœ“ Exportar para:
    - Excel (XLSX)
    - CSV
    - PDF
    - Imprimir

RelatÃ³rios PrÃ©-definidos:
  1. InventÃ¡rio Completo
     - Todos os equipamentos
     - Agrupado por Diretoria/BatalhÃ£o/SeÃ§Ã£o
     - Totais por tipo/status
  
  2. Equipamentos por Status
     - Ativos
     - Em Conserto
     - Baixados
     - Emprestados
     - Extraviados
  
  3. Equipamentos por ResponsÃ¡vel
     - Por usuÃ¡rio
     - Por seÃ§Ã£o
     - Por batalhÃ£o
  
  4. Equipamentos por PerÃ­odo de AquisiÃ§Ã£o
     - Ãšltimos 6 meses
     - Ãšltimo ano
     - Personalizado
  
  5. Equipamentos Emprestados
     - Todos os emprÃ©stimos ativos
     - EmprÃ©stimos prÃ³ximos do vencimento
     - EmprÃ©stimos atrasados
     - HistÃ³rico de emprÃ©stimos
  
  6. PendÃªncias de AprovaÃ§Ã£o
     - SolicitaÃ§Ãµes pendentes
     - Tempo mÃ©dio de aprovaÃ§Ã£o
     - Taxa de aprovaÃ§Ã£o/negaÃ§Ã£o
  
  7. RelatÃ³rio de Logs/Auditoria
     - Todas as operaÃ§Ãµes
     - Por usuÃ¡rio
     - Por equipamento
     - Por perÃ­odo
     - AÃ§Ãµes especÃ­ficas (criaÃ§Ã£o, alteraÃ§Ã£o, exclusÃ£o)
  
  8. Equipamentos por Tipo/Marca/Modelo
     - Quantitativo por tipo
     - Marcas mais comuns
     - Modelos por fabricante
  
  9. Equipamentos sem ResponsÃ¡vel
     - DisponÃ­veis para alocaÃ§Ã£o
     - Em estoque
  
  10. Resumo Executivo (Dashboard)
      - Totais gerais
      - GrÃ¡ficos
      - Indicadores

7.8 DASHBOARD (PÃGINA INICIAL)
===============================

Para ADMIN_DTEC:
  âœ“ Total geral de equipamentos (12.029+)
  âœ“ Equipamentos por Diretoria (grÃ¡fico pizza/barra)
  âœ“ Equipamentos por Status (grÃ¡fico pizza)
  âœ“ Equipamentos por Tipo (grÃ¡fico barra)
  âœ“ Ãšltimos equipamentos cadastrados (lista)
  âœ“ PendÃªncias de aprovaÃ§Ã£o (total)
  âœ“ EmprÃ©stimos ativos (total)
  âœ“ EmprÃ©stimos atrasados (alerta vermelho)
  âœ“ Ãšltimas alteraÃ§Ãµes realizadas (log recente)
  âœ“ GrÃ¡fico de aquisiÃ§Ãµes por mÃªs (linha)

Para COMANDANTE:
  âœ“ Total de equipamentos do batalhÃ£o
  âœ“ Equipamentos por SeÃ§Ã£o (grÃ¡fico)
  âœ“ Equipamentos por Status (grÃ¡fico)
  âœ“ PendÃªncias de aprovaÃ§Ã£o do batalhÃ£o (lista)
  âœ“ EmprÃ©stimos ativos do batalhÃ£o
  âœ“ Ãšltimas alteraÃ§Ãµes aprovadas/negadas
  âœ“ NotificaÃ§Ãµes recentes

Para USUARIO_BATALHAO:
  âœ“ Total de equipamentos da minha seÃ§Ã£o
  âœ“ Meus equipamentos responsÃ¡veis
  âœ“ Minhas solicitaÃ§Ãµes pendentes
  âœ“ Ãšltimas alteraÃ§Ãµes aprovadas
  âœ“ EmprÃ©stimos ativos (meus)

7.9 NOTIFICAÃ‡Ã•ES
=================

Tipos de NotificaÃ§Ã£o:
  âœ“ AprovaÃ§Ã£o pendente (Comandante)
  âœ“ SolicitaÃ§Ã£o aprovada (UsuÃ¡rio)
  âœ“ SolicitaÃ§Ã£o negada (UsuÃ¡rio)
  âœ“ EmprÃ©stimo prÃ³ximo do vencimento (ResponsÃ¡vel)
  âœ“ EmprÃ©stimo atrasado (ResponsÃ¡vel + Admin)
  âœ“ Novo equipamento alocado (SeÃ§Ã£o)
  âœ“ AlteraÃ§Ã£o realizada (Interessados)

Canais de NotificaÃ§Ã£o:
  âœ“ Dentro do sistema (Ã­cone no header com badge)
  âœ“ Central de notificaÃ§Ãµes (lista completa)
  âœ“ Marcar como lida/nÃ£o lida
  âœ“ Limpar notificaÃ§Ãµes antigas
  âœ“ Filtros por tipo/data

7.10 LOGS E AUDITORIA
======================

Registro AutomÃ¡tico de:
  âœ“ Login/Logout de usuÃ¡rios
  âœ“ CriaÃ§Ã£o de equipamentos
  âœ“ AlteraÃ§Ãµes solicitadas
  âœ“ AprovaÃ§Ãµes/NegaÃ§Ãµes
  âœ“ ExclusÃµes (com justificativa)
  âœ“ TransferÃªncias entre unidades
  âœ“ EmprÃ©stimos/DevoluÃ§Ãµes
  âœ“ ExportaÃ§Ã£o de relatÃ³rios
  âœ“ MudanÃ§as de permissÃ£o

Dados Registrados:
  âœ“ UsuÃ¡rio que realizou a aÃ§Ã£o
  âœ“ Data/hora exata
  âœ“ IP de origem
  âœ“ User Agent (navegador/sistema)
  âœ“ Tipo de aÃ§Ã£o (CREATE, UPDATE, DELETE, etc.)
  âœ“ Equipamento afetado
  âœ“ Dados alterados (JSON diff)
  âœ“ DescriÃ§Ã£o detalhada

Consultas de Log:
  âœ“ Filtro por perÃ­odo
  âœ“ Filtro por usuÃ¡rio
  âœ“ Filtro por equipamento
  âœ“ Filtro por tipo de aÃ§Ã£o
  âœ“ Filtro por batalhÃ£o/diretoria
  âœ“ ExportaÃ§Ã£o de logs (CSV/PDF)

7.11 CONFIGURAÃ‡Ã•ES E PARÃ‚METROS
================================

Tabelas Auxiliares (CRUD completo):
  âœ“ Tipos de Equipamento
  âœ“ Marcas
  âœ“ Modelos (vinculado Ã  marca)
  âœ“ Status de Equipamento
  âœ“ Tipos de AquisiÃ§Ã£o
  âœ“ Tipos de Disponibilidade
  âœ“ Operadoras de Telefonia
  âœ“ Planos de ServiÃ§o

ParÃ¢metros do Sistema:
  âœ“ Dias para alerta de emprÃ©stimo (7, 3, 1 dia antes)
  âœ“ Tempo de sessÃ£o (minutos de inatividade)
  âœ“ Quantidade de itens por pÃ¡gina (paginaÃ§Ã£o)
  âœ“ Formato de data/hora
  âœ“ Fuso horÃ¡rio

Estrutura Organizacional:
  âœ“ Diretorias (CRUD - apenas admin)
  âœ“ BatalhÃµes (CRUD - apenas admin)
  âœ“ SeÃ§Ãµes (CRUD - apenas admin)
  âœ“ VÃ­nculos hierÃ¡rquicos

================================================================================
                    8. ESTRUTURA DE PASTAS DO PROJETO
================================================================================

FRONTEND (Angular 18):
======================

atlas-frontend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ guards/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ auth.guard.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ role.guard.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ pending-changes.guard.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ interceptors/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ auth.interceptor.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ error.interceptor.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ loading.interceptor.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ user.model.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ token.model.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ permissions.model.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ services/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ auth.service.ts
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ token.service.ts
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ permissions.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ api.service.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ notification.service.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ loading.service.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ error-handler.service.ts
â”‚   â”‚   â”‚   â””â”€â”€ core.module.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ shared/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ header/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ header.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ header.component.html
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ header.component.scss
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ sidebar/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ footer/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ confirm-dialog/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ loading-overlay/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ notification-badge/
â”‚   â”‚   â”‚   â”œâ”€â”€ directives/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ permissions.directive.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ mask.directive.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ pipes/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ format-cpf.pipe.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ format-date.pipe.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ filter.pipe.ts
â”‚   â”‚   â”‚   â””â”€â”€ shared.module.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ features/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ login/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ login.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ login.component.html
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ login.component.scss
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ auth.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.component.html
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.component.scss
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ dashboard.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamentos/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ lista/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento-lista.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento-lista.component.html
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ equipamento-lista.component.scss
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ cadastro/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento-form.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento-form.component.html
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ equipamento-form.component.scss
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ detalhe/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ equipamento-detalhe.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ filtros/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ equipamento-filtros.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ equipamentos.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ aprovacoes/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ pendencias/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ pendencias-lista.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ pendencias-lista.component.html
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ modal-aprovacao/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ modal-aprovacao.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ modal-aprovacao.component.html
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ aprovacoes.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimos/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ lista/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ emprestimo-lista.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ cadastro/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ emprestimo-form.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ devolucao/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ emprestimo-devolucao.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ emprestimos.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ relatorio-geral/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ relatorio-geral.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios-predefinidos/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ relatorios-predefinidos.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ relatorios.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â”œâ”€â”€ logs/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ logs-lista.component.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ logs.routes.ts
â”‚   â”‚   â”‚   â”‚
â”‚   â”‚   â”‚   â””â”€â”€ configuracoes/
â”‚   â”‚   â”‚       â”œâ”€â”€ tabelas-auxiliares/
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ tabelas-auxiliares.component.ts
â”‚   â”‚   â”‚       â”œâ”€â”€ estrutura-organizacional/
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ estrutura-organizacional.component.ts
â”‚   â”‚   â”‚       â””â”€â”€ configuracoes.routes.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ diretorio.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ batalhao.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ secao.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ pendencia.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimo.model.ts
â”‚   â”‚   â”‚   â””â”€â”€ log.model.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamentos.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ aprovacoes.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimos.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ logs.service.ts
â”‚   â”‚   â”‚   â””â”€â”€ configuracoes.service.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”‚   â”œâ”€â”€ validators.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ constants.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ helpers.ts
â”‚   â”‚   â”‚   â””â”€â”€ formatters.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ app.routes.ts
â”‚   â”‚   â”œâ”€â”€ app.component.ts
â”‚   â”‚   â”œâ”€â”€ app.component.html
â”‚   â”‚   â””â”€â”€ app.config.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â”œâ”€â”€ icons/
â”‚   â”‚   â””â”€â”€ i18n/
â”‚   â”‚
â”‚   â”œâ”€â”€ environments/
â”‚   â”‚   â”œâ”€â”€ environment.ts
â”‚   â”‚   â””â”€â”€ environment.prod.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ styles/
â”‚   â”‚   â”œâ”€â”€ _variables.scss
â”‚   â”‚   â”œâ”€â”€ _mixins.scss
â”‚   â”‚   â””â”€â”€ styles.scss
â”‚   â”‚
â”‚   â””â”€â”€ index.html
â”‚
â”œâ”€â”€ angular.json
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ tailwind.config.js
â””â”€â”€ README.md

BACKEND (NestJS):
=================

atlas-backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.ts
â”‚   â”œâ”€â”€ app.module.ts
â”‚   â”œâ”€â”€ app.controller.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ common/
â”‚   â”‚   â”œâ”€â”€ decorators/
â”‚   â”‚   â”‚   â”œâ”€â”€ public.decorator.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ roles.decorator.ts
â”‚   â”‚   â”‚   â””â”€â”€ api-response.decorator.ts
â”‚   â”‚   â”œâ”€â”€ filters/
â”‚   â”‚   â”‚   â”œâ”€â”€ http-exception.filter.ts
â”‚   â”‚   â”‚   â””â”€â”€ validation-exception.filter.ts
â”‚   â”‚   â”œâ”€â”€ interceptors/
â”‚   â”‚   â”‚   â”œâ”€â”€ response.interceptor.ts
â”‚   â”‚   â”‚   â””â”€â”€ cache.interceptor.ts
â”‚   â”‚   â”œâ”€â”€ guards/
â”‚   â”‚   â”‚   â”œâ”€â”€ jwt-auth.guard.ts
â”‚   â”‚   â”‚   â””â”€â”€ roles.guard.ts
â”‚   â”‚   â”œâ”€â”€ pipes/
â”‚   â”‚   â”‚   â””â”€â”€ parse-object-id.pipe.ts
â”‚   â”‚   â””â”€â”€ interfaces/
â”‚   â”‚       â”œâ”€â”€ paginated-response.interface.ts
â”‚   â”‚       â””â”€â”€ jwt-payload.interface.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ modules/
â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.module.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ strategies/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ jwt.strategy.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ sei.strategy.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ dto/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ login.dto.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ refresh-token.dto.ts
â”‚   â”‚   â”‚   â””â”€â”€ interfaces/
â”‚   â”‚   â”‚       â””â”€â”€ sei-user.interface.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ usuarios/
â”‚   â”‚   â”‚   â”œâ”€â”€ usuarios.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ usuarios.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ usuarios.module.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ usuario.entity.ts
â”‚   â”‚   â”‚   â””â”€â”€ dto/
â”‚   â”‚   â”‚       â”œâ”€â”€ create-usuario.dto.ts
â”‚   â”‚   â”‚       â””â”€â”€ update-usuario.dto.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ equipamentos/
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamentos.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamentos.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ equipamentos.module.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ equipamento.entity.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ tipo-equipamento.entity.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ marca.entity.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ modelo.entity.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ status-equipamento.entity.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚   â”‚   â”œâ”€â”€ dto/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ create-equipamento.dto.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ update-equipamento.dto.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ filters-equipamento.dto.ts
â”‚   â”‚   â”‚   â””â”€â”€ interfaces/
â”‚   â”‚   â”‚       â””â”€â”€ equipamento-specifics.interface.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ aprovacoes/
â”‚   â”‚   â”‚   â”œâ”€â”€ aprovacoes.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ aprovacoes.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ aprovacoes.module.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ alteracao-pendente.entity.ts
â”‚   â”‚   â”‚   â””â”€â”€ dto/
â”‚   â”‚   â”‚       â”œâ”€â”€ criar-pendencia.dto.ts
â”‚   â”‚   â”‚       â””â”€â”€ aprovar-pendencia.dto.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ emprestimos/
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimos.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimos.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ emprestimos.module.ts
â”‚   â”‚   â”‚   â””â”€â”€ dto/
â”‚   â”‚   â”‚       â”œâ”€â”€ registrar-emprestimo.dto.ts
â”‚   â”‚   â”‚       â””â”€â”€ registrar-devolucao.dto.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ relatorios/
â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ relatorios.module.ts
â”‚   â”‚   â”‚   â””â”€â”€ utils/
â”‚   â”‚   â”‚       â”œâ”€â”€ excel-generator.ts
â”‚   â”‚   â”‚       â”œâ”€â”€ pdf-generator.ts
â”‚   â”‚   â”‚       â””â”€â”€ csv-generator.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ logs/
â”‚   â”‚   â”‚   â”œâ”€â”€ logs.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ logs.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ logs.module.ts
â”‚   â”‚   â”‚   â””â”€â”€ entities/
â”‚   â”‚   â”‚       â””â”€â”€ log-operacao.entity.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ estrutura-organizacional/
â”‚   â”‚   â”‚   â”œâ”€â”€ estrutura.controller.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ estrutura.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ estrutura.module.ts
â”‚   â”‚   â”‚   â””â”€â”€ entities/
â”‚   â”‚   â”‚       â”œâ”€â”€ diretorio.entity.ts
â”‚   â”‚   â”‚       â”œâ”€â”€ batalhao.entity.ts
â”‚   â”‚   â”‚       â””â”€â”€ secao.entity.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ configuracoes/
â”‚   â”‚       â”œâ”€â”€ configuracoes.controller.ts
â”‚   â”‚       â”œâ”€â”€ configuracoes.service.ts
â”‚   â”‚       â””â”€â”€ configuracoes.module.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ database/
â”‚   â”‚   â”œâ”€â”€ database.module.ts
â”‚   â”‚   â”œâ”€â”€ database.service.ts
â”‚   â”‚   â””â”€â”€ prisma.service.ts
â”‚   â”‚
â”‚   â””â”€â”€ integrations/
â”‚       â”œâ”€â”€ sei/
â”‚       â”‚   â”œâ”€â”€ sei.service.ts
â”‚       â”‚   â”œâ”€â”€ sei.module.ts
â”‚       â”‚   â””â”€â”€ sei.interfaces.ts
â”‚       â””â”€â”€ notifications/
â”‚           â”œâ”€â”€ notifications.service.ts
â”‚           â””â”€â”€ notifications.module.ts
â”‚
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma
â”‚   â”œâ”€â”€ migrations/
â”‚   â”‚   â””â”€â”€ migration_lock.toml
â”‚   â””â”€â”€ seed.ts
â”‚
â”œâ”€â”€ test/
â”‚   â”œâ”€â”€ app.e2e-spec.ts
â”‚   â””â”€â”€ jest-e2e.json
â”‚
â”œâ”€â”€ .env
â”œâ”€â”€ .env.example
â”œâ”€â”€ nest-cli.json
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â””â”€â”€ README.md

================================================================================
                    9. API REST - ENDPOINTS PRINCIPAIS
================================================================================

BASE URL: /api/v1

AUTENTICAÃ‡ÃƒO:
=============
POST   /auth/login                    - Login via SEI
POST   /auth/refresh                  - Refresh token
POST   /auth/logout                   - Logout
GET    /auth/me                       - Dados do usuÃ¡rio logado

USUÃRIOS:
=========
GET    /usuarios                      - Listar usuÃ¡rios (paginado)
GET    /usuarios/:id                  - Buscar usuÃ¡rio por ID
POST   /usuarios                      - Criar usuÃ¡rio (admin)
PUT    /usuarios/:id                  - Atualizar usuÃ¡rio
DELETE /usuarios/:id                  - Excluir usuÃ¡rio (admin)
GET    /usuarios/me/perfil            - Perfil do usuÃ¡rio logado

EQUIPAMENTOS:
=============
GET    /equipamentos                  - Listar equipamentos (filtros, paginado)
GET    /equipamentos/:id              - Buscar equipamento por ID
POST   /equipamentos                  - Criar equipamento
PUT    /equipamentos/:id              - Solicitar alteraÃ§Ã£o (cria pendÃªncia)
DELETE /equipamentos/:id              - Excluir equipamento (admin)
GET    /equipamentos/:id/historico    - HistÃ³rico de alteraÃ§Ãµes
GET    /equipamentos/:id/logs         - Logs do equipamento
POST   /equipamentos/:id/transferir   - Transferir entre unidades

APROVAÃ‡Ã•ES:
===========
GET    /aprovacoes/pendentes          - Listar pendÃªncias (comandante)
GET    /aprovacoes/pendentes/:id      - Detalhes da pendÃªncia
POST   /aprovacoes/:id/aprovar        - Aprovar alteraÃ§Ã£o
POST   /aprovacoes/:id/negar          - Negar alteraÃ§Ã£o
GET    /aprovacoes/historico          - HistÃ³rico de aprovaÃ§Ãµes

EMPRÃ‰STIMOS:
============
GET    /emprestimos                   - Listar emprÃ©stimos
GET    /emprestimos/ativos            - EmprÃ©stimos ativos
GET    /emprestimos/atrasados         - EmprÃ©stimos atrasados
POST   /emprestimos                   - Registrar emprÃ©stimo
POST   /emprestimos/:id/devolver      - Registrar devoluÃ§Ã£o
GET    /emprestimos/:id               - Detalhes do emprÃ©stimo
PUT    /emprestimos/:id               - Atualizar emprÃ©stimo

RELATÃ“RIOS:
===========
GET    /relatorios/geral              - RelatÃ³rio geral (com filtros)
GET    /relatorios/inventario         - InventÃ¡rio completo
GET    /relatorios/por-status         - Equipamentos por status
GET    /relatorios/por-responsavel    - Por responsÃ¡vel
GET    /relatorios/emprestimos        - RelatÃ³rio de emprÃ©stimos
GET    /relatorios/pendencias         - PendÃªncias de aprovaÃ§Ã£o
POST   /relatorios/export/excel       - Exportar para Excel
POST   /relatorios/export/pdf         - Exportar para PDF
POST   /relatorios/export/csv         - Exportar para CSV

LOGS:
=====
GET    /logs                          - Listar logs (filtros)
GET    /logs/:id                      - Detalhes do log
GET    /logs/usuario/:usuarioId       - Logs por usuÃ¡rio
GET    /logs/equipamento/:equipId     - Logs por equipamento

ESTRUTURA ORGANIZACIONAL:
=========================
GET    /diretorias                    - Listar diretorias
GET    /diretorias/:id                - Detalhes da diretoria
GET    /diretorias/:id/batalhoes      - BatalhÃµes da diretoria
GET    /batalhoes                     - Listar batalhÃµes
GET    /batalhoes/:id                 - Detalhes do batalhÃ£o
GET    /batalhoes/:id/secoes          - SeÃ§Ãµes do batalhÃ£o
GET    /secoes                        - Listar seÃ§Ãµes
GET    /secoes/:id                    - Detalhes da seÃ§Ã£o

CONFIGURAÃ‡Ã•ES:
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
GET    /configuracoes/tipos-aquisicao      - Tipos de aquisiÃ§Ã£o
GET    /configuracoes/disponibilidades     - Disponibilidades

NOTIFICAÃ‡Ã•ES:
=============
GET    /notificacoes                  - Listar notificaÃ§Ãµes do usuÃ¡rio
GET    /notificacoes/nao-lidas        - Contador de nÃ£o lidas
PUT    /notificacoes/:id/lida         - Marcar como lida
PUT    /notificacoes/todas-lidas      - Marcar todas como lidas
DELETE /notificacoes/:id              - Excluir notificaÃ§Ã£o

DASHBOARD:
==========
GET    /dashboard/resumo              - Resumo do dashboard (por perfil)
GET    /dashboard/estatisticas        - EstatÃ­sticas gerais
GET    /dashboard/graficos/tipo       - GrÃ¡fico por tipo
GET    /dashboard/graficos/status     - GrÃ¡fico por status
GET    /dashboard/graficos/diretoria  - GrÃ¡fico por diretoria

================================================================================
                    10. TELAS DO FRONTEND
================================================================================

1. LOGIN
========
- Logo PMPE + atlas
- Campos: MatrÃ­cula, Senha
- BotÃ£o: Entrar
- Link: Esqueci minha senha
- ValidaÃ§Ã£o: Login via API SEI

2. DASHBOARD
============
Layout: Grid com cards e grÃ¡ficos

Cards Superiores:
- Total de Equipamentos
- PendÃªncias de AprovaÃ§Ã£o
- EmprÃ©stimos Ativos
- EmprÃ©stimos Atrasados

GrÃ¡ficos:
- Equipamentos por Tipo (Barra)
- Equipamentos por Status (Pizza)
- Equipamentos por Diretoria/BatalhÃ£o (Barra Horizontal)
- AquisiÃ§Ãµes por MÃªs (Linha)

Listas:
- Ãšltimos Equipamentos Cadastrados
- PendÃªncias Recentes
- EmprÃ©stimos PrÃ³ximos do Vencimento

3. LISTA DE EQUIPAMENTOS
=========================
Layout: Tabela PrimeNG com filtros

Filtros Principais (topo):
- Campo de busca rÃ¡pida (patrimÃ´nio)
- Dropdown: Tipo de Equipamento
- Dropdown: Status
- Dropdown: SeÃ§Ã£o/BatalhÃ£o (hierÃ¡rquico)
- BotÃ£o: Filtros AvanÃ§ados (toggle)

Filtros AvanÃ§ados (expansÃ­vel):
- Marca, Modelo
- Tipo de AquisiÃ§Ã£o
- Disponibilidade
- PerÃ­odo de AquisiÃ§Ã£o (date range)
- NÃºmero de SÃ©rie
- ResponsÃ¡vel

Tabela:
- Colunas: Edit | PatrimÃ´nio | Tipo | Marca | Modelo | Status | SeÃ§Ã£o | ResponsÃ¡vel
- AÃ§Ãµes por linha: Editar | Visualizar | HistÃ³rico
- PaginaÃ§Ã£o: 10, 25, 50, 100 itens
- OrdenaÃ§Ã£o por coluna
- SeleÃ§Ã£o mÃºltipla (checkbox)
- Exportar seleÃ§Ã£o

BotÃµes:
- + Novo Equipamento (permissÃ£o)
- Exportar (Excel/CSV/PDF)
- Imprimir

4. CADASTRO/EDIÃ‡ÃƒO DE EQUIPAMENTO
==================================
Layout: FormulÃ¡rio em abas ou steps

Step 1 - InformaÃ§Ãµes BÃ¡sicas:
- PatrimÃ´nio (obrigatÃ³rio)
- NÃºmero de SÃ©rie
- SEI
- Data de AquisiÃ§Ã£o (calendar)
- Tipo de Equipamento (dropdown)
- Marca (dropdown + botÃ£o "Nova")
- Modelo (dropdown + botÃ£o "Novo")
- Status (dropdown)
- Tipo de AquisiÃ§Ã£o (dropdown)
- ObservaÃ§Ã£o (textarea)

Step 2 - AlocaÃ§Ã£o:
- Disponibilidade (Carga/Emprestimo - radio)
- SeÃ§Ã£o (dropdown hierÃ¡rquico)
- UsuÃ¡rio ResponsÃ¡vel (dropdown)
- Data de Retorno (aparece se EmprÃ©stimo)

Step 3 - Dados EspecÃ­ficos (dinÃ¢mico por tipo):
Se RÃDIO:
- Tipo de RÃ¡dio
- FrequÃªncia
- PotÃªncia
- Tecnologia
- IMEI

Se CELULAR:
- NÃºmero do Telefone
- CÃ³digo do Chip
- Operadora
- Plano de ServiÃ§o

Se COMPUTADOR:
- Processador
- MemÃ³ria RAM
- Armazenamento
- Sistema Operacional
- Placa de VÃ­deo

Se MONITOR:
- Polegadas
- ResoluÃ§Ã£o
- Tipo

BotÃµes:
- Salvar (cria pendÃªncia se nÃ£o for admin)
- Cancelar
- Voltar

5. DETALHES DO EQUIPAMENTO
===========================
Layout: Tabs com informaÃ§Ãµes

Tab 1 - InformaÃ§Ãµes Gerais:
- Todos os dados do equipamento (somente leitura)
- Badge de status colorido
- QR Code do patrimÃ´nio (opcional)

Tab 2 - HistÃ³rico de AlteraÃ§Ãµes:
- Timeline com todas as alteraÃ§Ãµes
- Data, usuÃ¡rio, campos modificados
- Status da aprovaÃ§Ã£o

Tab 3 - Logs:
- Tabela com logs de operaÃ§Ãµes
- Data, aÃ§Ã£o, usuÃ¡rio, IP

Tab 4 - EmprÃ©stimos:
- HistÃ³rico de emprÃ©stimos
- Datas, responsÃ¡veis, observaÃ§Ãµes

BotÃµes de AÃ§Ã£o:
- Editar (solicitar alteraÃ§Ã£o)
- Transferir
- Emprestar/Devolver
- Imprimir ficha
- Exportar PDF

6. PENDÃŠNCIAS DE APROVAÃ‡ÃƒO (Comandante)
========================================
Layout: Tabela com badge de notificaÃ§Ã£o

Tabela de PendÃªncias:
- Colunas: Data | Equipamento | Solicitante | Tipo AlteraÃ§Ã£o | Status
- AÃ§Ãµes: Visualizar | Aprovar | Negar
- Filtros: PerÃ­odo, Solicitante, Tipo

Modal de AprovaÃ§Ã£o:
- Header: PatrimÃ´nio + Tipo + ResponsÃ¡vel
- Tabela Comparativa:
  CAMPO            | ANTES          | DEPOIS
  Status           | ATIVO          | CONSERTO
  ObservaÃ§Ã£o       | -              | Em manutenÃ§Ã£o
  
- BotÃµes:
  - APROVAR (verde)
  - NEGAR (vermelho - abre campo motivo)
  - CANCELAR

7. EMPRÃ‰STIMOS
===============
Layout: Tabs

Tab 1 - EmprÃ©stimos Ativos:
- Tabela: Equipamento | ResponsÃ¡vel | Data Ida | Data Retorno | Status
- Filtros: PrÃ³ximos do vencimento, Atrasados
- AÃ§Ãµes: Registrar DevoluÃ§Ã£o | Visualizar

Tab 2 - Registrar EmprÃ©stimo:
- Selecionar Equipamento (dropdown com filtros)
- Tipo (Carga/Emprestimo)
- Se EmprÃ©stimo:
  - Data de Retorno (obrigatÃ³ria)
  - UsuÃ¡rio ResponsÃ¡vel (obrigatÃ³rio)
  - ObservaÃ§Ãµes
- BotÃ£o: Confirmar EmprÃ©stimo

Tab 3 - HistÃ³rico:
- Todos os emprÃ©stimos
- Filtros por perÃ­odo, responsÃ¡vel, equipamento

8. RELATÃ“RIOS
==============
Layout: Sidebar com opÃ§Ãµes + Ã¡rea principal

Sidebar:
- RelatÃ³rio Geral
- InventÃ¡rio Completo
- Por Status
- Por ResponsÃ¡vel
- Por PerÃ­odo
- EmprÃ©stimos
- PendÃªncias
- Logs/Auditoria

Ãrea Principal (RelatÃ³rio Geral):
- Seletor de Colunas (checkboxes)
- Filtros DinÃ¢micos (todos os campos)
- Agrupamento (dropdown)
- OrdenaÃ§Ã£o
- BotÃ£o: Gerar RelatÃ³rio

Resultado:
- Tabela com dados
- Totalizador
- BotÃµes: Exportar Excel | Exportar PDF | Imprimir

9. LOGS/AUDITORIA
==================
Layout: Tabela avanÃ§ada

Filtros:
- PerÃ­odo (date range)
- UsuÃ¡rio (dropdown)
- Equipamento (busca)
- Tipo de AÃ§Ã£o (checkboxes: CREATE, UPDATE, DELETE...)
- BatalhÃ£o/Diretoria

Tabela:
- Data/Hora
- UsuÃ¡rio
- AÃ§Ã£o
- Equipamento
- DescriÃ§Ã£o
- IP
- BotÃ£o: Visualizar Detalhes

Modal de Detalhes:
- Dados completos do log
- JSON dos dados alterados (formatado)

10. CONFIGURAÃ‡Ã•ES
=================
Layout: Menu lateral + conteÃºdo

Menu:
- Tabelas Auxiliares
  - Tipos de Equipamento
  - Marcas
  - Modelos
  - Status
  - Tipos de AquisiÃ§Ã£o
  - Disponibilidades

- Estrutura Organizacional
  - Diretorias
  - BatalhÃµes
  - SeÃ§Ãµes

- ParÃ¢metros do Sistema
  - Dias de alerta
  - Tempo de sessÃ£o
  - etc.

Cada tela de CRUD:
- Tabela com listagem
- BotÃ£o: Novo
- AÃ§Ãµes: Editar | Excluir
- Modal de cadastro/ediÃ§Ã£o

================================================================================
                    11. RELATÃ“RIOS
================================================================================

11.1 RELATÃ“RIO GERAL (DINÃ‚MICO)
================================

Funcionalidades:
âœ“ SeleÃ§Ã£o de colunas (checkboxes)
âœ“ Todos os filtros disponÃ­veis
âœ“ Agrupamento por qualquer campo
âœ“ OrdenaÃ§Ã£o mÃºltipla
âœ“ Totais e subtotais
âœ“ ExportaÃ§Ã£o multi-formato

Colunas DisponÃ­veis:
- PatrimÃ´nio
- Tipo de Equipamento
- Marca
- Modelo
- NÃºmero de SÃ©rie
- SEI
- Data de AquisiÃ§Ã£o
- Status
- Tipo de AquisiÃ§Ã£o
- Disponibilidade
- Diretoria
- BatalhÃ£o
- SeÃ§Ã£o
- UsuÃ¡rio ResponsÃ¡vel
- Data de Entrada
- Data de Retorno (se emprÃ©stimo)
- ObservaÃ§Ã£o
- Dados especÃ­ficos (por tipo)

Agrupamentos:
- Por Diretoria
- Por BatalhÃ£o
- Por SeÃ§Ã£o
- Por Tipo de Equipamento
- Por Status
- Por ResponsÃ¡vel
- Por Marca
- Por Tipo de AquisiÃ§Ã£o

Formatos de ExportaÃ§Ã£o:
- Excel (XLSX) - com formataÃ§Ã£o, fÃ³rmulas
- CSV - separador configurÃ¡vel
- PDF - layout profissional
- ImpressÃ£o direta

11.2 RELATÃ“RIO DE INVENTÃRIO
=============================

Objetivo: Listagem completa para conferÃªncia fÃ­sica

ConteÃºdo:
- Todos os equipamentos ativos
- Agrupado por Diretoria â†’ BatalhÃ£o â†’ SeÃ§Ã£o
- Subtotais por seÃ§Ã£o
- Total geral

Campos:
- PatrimÃ´nio
- Tipo
- Marca/Modelo
- Status
- ResponsÃ¡vel
- LocalizaÃ§Ã£o (SeÃ§Ã£o)

Recursos:
- GeraÃ§Ã£o de etiquetas (cÃ³digo de barras/QR Code)
- Checklist para conferÃªncia
- ExportaÃ§Ã£o para planilha de conferÃªncia

11.3 RELATÃ“RIO POR STATUS
==========================

Objetivo: SituaÃ§Ã£o atual dos equipamentos

SeÃ§Ãµes:
1. Equipamentos Ativos
   - Em uso
   - DisponÃ­veis
   
2. Equipamentos em Conserto
   - Data de envio
   - PrevisÃ£o de retorno
   - ResponsÃ¡vel pelo conserto
   
3. Equipamentos Baixados
   - Motivo da baixa
   - Data
   - ResponsÃ¡vel pela baixa
   
4. Equipamentos Emprestados
   - ResponsÃ¡vel
   - Data de retorno
   - Status (em dia/atrasado)

5. Equipamentos Extraviados
   - Data do extravio
   - BO registrado
   - ResponsÃ¡vel

11.4 RELATÃ“RIO POR RESPONSÃVEL
===============================

Objetivo: Equipamentos sob responsabilidade de cada usuÃ¡rio

ConteÃºdo:
- Listagem por usuÃ¡rio
- Total de equipamentos por responsÃ¡vel
- HistÃ³rico de responsabilidades
- Equipamentos sem responsÃ¡vel

Campos:
- Nome do ResponsÃ¡vel
- MatrÃ­cula
- LotaÃ§Ã£o (SeÃ§Ã£o/BatalhÃ£o)
- Quantidade de Equipamentos
- Lista de PatrimÃ´nios
- Data da Ãšltima AlocaÃ§Ã£o

11.5 RELATÃ“RIO DE EMPRÃ‰STIMOS
==============================

Objetivo: Controle completo de emprÃ©stimos

SeÃ§Ãµes:

1. EmprÃ©stimos Ativos
   - Equipamento
   - ResponsÃ¡vel
   - Data de Ida
   - Data de Retorno Prevista
   - Dias Restantes
   - Status (Em dia / Atrasado)

2. EmprÃ©stimos PrÃ³ximos do Vencimento
   - Vencem em atÃ© 7 dias
   - Alerta visual (amarelo/laranja/vermelho)

3. EmprÃ©stimos Atrasados
   - Equipamento
   - ResponsÃ¡vel
   - Data Prevista
   - Dias de Atraso
   - Contato do ResponsÃ¡vel

4. HistÃ³rico de EmprÃ©stimos
   - Todos os emprÃ©stimos realizados
   - PerÃ­odo configurÃ¡vel
   - Tempo mÃ©dio de emprÃ©stimo

11.6 RELATÃ“RIO DE PENDÃŠNCIAS
=============================

Objetivo: Acompanhamento do workflow de aprovaÃ§Ã£o

ConteÃºdo:
- PendÃªncias por Comandante
- Tempo mÃ©dio de aprovaÃ§Ã£o
- Taxa de aprovaÃ§Ã£o vs negaÃ§Ã£o
- PendÃªncias antigas (alerta)

Campos:
- Data da SolicitaÃ§Ã£o
- Equipamento
- Solicitante
- Tipo de AlteraÃ§Ã£o
- Campos Modificados
- Tempo de PendÃªncia
- Status

11.7 RELATÃ“RIO DE LOGS/AUDITORIA
=================================

Objetivo: Auditoria completa do sistema

Filtros:
- PerÃ­odo
- UsuÃ¡rio
- Equipamento
- Tipo de AÃ§Ã£o
- BatalhÃ£o/Diretoria

ConteÃºdo:
- Data/Hora
- UsuÃ¡rio
- AÃ§Ã£o (CREATE, UPDATE, DELETE, APROVAR, NEGAR)
- Equipamento Afetado
- IP de Origem
- DescriÃ§Ã£o Detalhada
- Dados Alterados (JSON)

Recursos:
- ExportaÃ§Ã£o para auditoria externa
- Busca full-text
- Filtros avanÃ§ados

11.8 RELATÃ“RIO DE AQUISIÃ‡Ã•ES
=============================

Objetivo: Controle de entradas de equipamentos

ConteÃºdo:
- Equipamentos adquiridos por perÃ­odo
- Por tipo de aquisiÃ§Ã£o (Compra, Comodato, DoaÃ§Ã£o)
- Por fornecedor (se disponÃ­vel)
- Valor total (se disponÃ­vel)

Campos:
- Data de AquisiÃ§Ã£o
- Tipo de Equipamento
- Tipo de AquisiÃ§Ã£o
- Quantidade
- Empenho (se disponÃ­vel)
- Origem

11.9 RELATÃ“RIO EXECUTIVO/DASHBOARD
===================================

Objetivo: VisÃ£o gerencial para comando

Indicadores:
- Total de Equipamentos
- Total por Diretoria
- Total por Status
- Equipamentos por Tipo
- Taxa de Equipamentos Ativos
- EmprÃ©stimos Ativos
- EmprÃ©stimos Atrasados
- PendÃªncias de AprovaÃ§Ã£o

GrÃ¡ficos:
- EvoluÃ§Ã£o de aquisiÃ§Ãµes (Ãºltimos 12 meses)
- DistribuiÃ§Ã£o por tipo
- DistribuiÃ§Ã£o por status
- Top 10 marcas
- Equipamentos por batalhÃ£o

Tabelas Resumo:
- Top 10 equipamentos mais emprestados
- BatalhÃµes com mais equipamentos
- UsuÃ¡rios com mais equipamentos responsÃ¡veis

================================================================================
                    12. PLANO DE DESENVOLVIMENTO
================================================================================

FASE 1 - INFRAESTRUTURA E AUTENTICAÃ‡ÃƒO (Semanas 1-2)
=====================================================

Semana 1:
âœ“ Configurar ambiente de desenvolvimento
âœ“ Criar repositÃ³rios Git (frontend/backend)
âœ“ Configurar NestJS + Prisma
âœ“ Configurar Angular 18 + PrimeNG + Tailwind
âœ“ Modelagem do banco de dados (Prisma Schema)
âœ“ Migrations iniciais
âœ“ Seed de dados bÃ¡sicos (tabelas auxiliares)

Semana 2:
âœ“ IntegraÃ§Ã£o com API do SEI
âœ“ AutenticaÃ§Ã£o JWT
âœ“ Guards de autenticaÃ§Ã£o e autorizaÃ§Ã£o
âœ“ ServiÃ§o de usuÃ¡rios
âœ“ SincronizaÃ§Ã£o de dados do SEI
âœ“ Tela de Login
âœ“ ProteÃ§Ã£o de rotas

EntregÃ¡veis Fase 1:
- Ambiente configurado
- Banco de dados criado
- Login funcional via SEI
- UsuÃ¡rios sincronizados

FASE 2 - CADASTRO DE EQUIPAMENTOS (Semanas 3-5)
================================================

Semana 3:
âœ“ CRUD de tabelas auxiliares (backend)
âœ“ CRUD de estrutura organizacional
âœ“ Entidades de equipamentos
âœ“ Relacionamentos
âœ“ ValidaÃ§Ãµes

Semana 4:
âœ“ API de equipamentos (CRUD completo)
âœ“ Upload de dados especÃ­ficos por tipo
âœ“ Filtros e buscas
âœ“ PaginaÃ§Ã£o
âœ“ DocumentaÃ§Ã£o Swagger

Semana 5:
âœ“ Tela de lista de equipamentos
âœ“ Componentes de filtro
âœ“ Tabela PrimeNG
âœ“ PaginaÃ§Ã£o e ordenaÃ§Ã£o
âœ“ Busca global

EntregÃ¡veis Fase 2:
- CRUD completo de equipamentos
- Listagem com filtros
- Dados especÃ­ficos por tipo

FASE 3 - WORKFLOW DE APROVAÃ‡ÃƒO (Semanas 6-7)
=============================================

Semana 6:
âœ“ Modelo de pendÃªncias de aprovaÃ§Ã£o
âœ“ ServiÃ§o de aprovaÃ§Ãµes
âœ“ ComparaÃ§Ã£o de dados (diff)
âœ“ API de aprovaÃ§Ã£o/negaÃ§Ã£o
âœ“ NotificaÃ§Ãµes

Semana 7:
âœ“ Tela de pendÃªncias (Comandante)
âœ“ Modal comparativo (Antes/Depois)
âœ“ Fluxo de aprovaÃ§Ã£o
âœ“ NotificaÃ§Ãµes no frontend
âœ“ HistÃ³rico de aprovaÃ§Ãµes

EntregÃ¡veis Fase 3:
- Workflow completo de validaÃ§Ã£o
- AprovaÃ§Ãµes funcionais
- NotificaÃ§Ãµes

FASE 4 - EMPRÃ‰STIMOS E DEVOLUÃ‡Ã•ES (Semanas 8-9)
================================================

Semana 8:
âœ“ Modelo de emprÃ©stimos
âœ“ API de registro de emprÃ©stimo
âœ“ API de devoluÃ§Ã£o
âœ“ CÃ¡lculo de atrasos
âœ“ Alertas de vencimento

Semana 9:
âœ“ Tela de emprÃ©stimos
âœ“ FormulÃ¡rio de registro
âœ“ Tela de devoluÃ§Ã£o
âœ“ Lista de emprÃ©stimos ativos/atrasados
âœ“ RelatÃ³rios de emprÃ©stimos

EntregÃ¡veis Fase 4:
- Controle completo de emprÃ©stimos
- Alertas de vencimento
- RelatÃ³rios

FASE 5 - RELATÃ“RIOS (Semanas 10-11)
====================================

Semana 10:
âœ“ ServiÃ§o de relatÃ³rios
âœ“ ExportaÃ§Ã£o Excel (xlsx)
âœ“ ExportaÃ§Ã£o CSV
âœ“ ExportaÃ§Ã£o PDF
âœ“ Filtros dinÃ¢micos

Semana 11:
âœ“ Telas de relatÃ³rios
âœ“ RelatÃ³rio geral dinÃ¢mico
âœ“ RelatÃ³rios prÃ©-definidos
âœ“ VisualizaÃ§Ã£o de dados
âœ“ ImpressÃ£o

EntregÃ¡veis Fase 5:
- Todos os relatÃ³rios funcionais
- ExportaÃ§Ã£o em mÃºltiplos formatos

FASE 6 - DASHBOARD E LOGS (Semanas 12-13)
==========================================

Semana 12:
âœ“ API de estatÃ­sticas
âœ“ AgregaÃ§Ãµes de dados
âœ“ GrÃ¡ficos (backend)
âœ“ Logs de operaÃ§Ã£o
âœ“ Auditoria

Semana 13:
âœ“ Dashboard (por perfil)
âœ“ GrÃ¡ficos PrimeNG
âœ“ Cards de indicadores
âœ“ Tela de logs
âœ“ Filtros de logs

EntregÃ¡veis Fase 6:
- Dashboard completo
- Logs e auditoria

FASE 7 - MIGRAÃ‡ÃƒO DE DADOS (Semana 14)
=======================================

Semana 14:
âœ“ Script de exportaÃ§Ã£o Oracle â†’ CSV
âœ“ Mapeamento de campos
âœ“ Script de importaÃ§Ã£o CSV â†’ PostgreSQL
âœ“ ValidaÃ§Ã£o de dados migrados
âœ“ Ajustes e correÃ§Ãµes
âœ“ Testes de integridade

EntregÃ¡veis Fase 7:
- 12.029 equipamentos migrados
- Dados validados
- Integridade garantida

FASE 8 - TESTES E AJUSTES (Semanas 15-16)
==========================================

Semana 15:
âœ“ Testes unitÃ¡rios (backend)
âœ“ Testes de integraÃ§Ã£o
âœ“ Testes e2e (frontend)
âœ“ CorreÃ§Ã£o de bugs
âœ“ OtimizaÃ§Ãµes de performance

Semana 16:
âœ“ Testes de usabilidade
âœ“ Ajustes de UI/UX
âœ“ ValidaÃ§Ã£o com usuÃ¡rios reais
âœ“ DocumentaÃ§Ã£o tÃ©cnica
âœ“ Manual do usuÃ¡rio

EntregÃ¡veis Fase 8:
- Sistema testado e estÃ¡vel
- DocumentaÃ§Ã£o completa
- Pronto para produÃ§Ã£o

FASE 9 - DEPLOY E TREINAMENTO (Semana 17)
==========================================

Semana 17:
âœ“ Configurar servidor de produÃ§Ã£o
âœ“ Deploy backend (servidor PMPE)
âœ“ Deploy frontend (Vercel ou PMPE)
âœ“ Configurar banco de dados produÃ§Ã£o
âœ“ Backup automÃ¡tico
âœ“ Monitoramento
âœ“ Treinamento de administradores
âœ“ Treinamento de comandantes
âœ“ Treinamento de usuÃ¡rios

EntregÃ¡veis Fase 9:
- Sistema em produÃ§Ã£o
- UsuÃ¡rios treinados
- Suporte inicial

CRONOGRAMA RESUMO:
==================

Fase 1: Infraestrutura e Auth        - 2 semanas
Fase 2: Cadastro Equipamentos        - 3 semanas
Fase 3: Workflow AprovaÃ§Ã£o           - 2 semanas
Fase 4: EmprÃ©stimos                  - 2 semanas
Fase 5: RelatÃ³rios                    - 2 semanas
Fase 6: Dashboard e Logs             - 2 semanas
Fase 7: MigraÃ§Ã£o de Dados            - 1 semana
Fase 8: Testes e Ajustes             - 2 semanas
Fase 9: Deploy e Treinamento         - 1 semana

TOTAL: 17 SEMANAS (~4 meses)

================================================================================
                    13. MIGRAÃ‡ÃƒO DE DADOS
================================================================================

13.1 ESTRATÃ‰GIA DE MIGRAÃ‡ÃƒO
============================

Fonte: Oracle APEX (sistema atual)
Destino: PostgreSQL (novo sistema)
Formato: CSV intermediÃ¡rio
Volume: ~12.029 equipamentos

13.2 MAPEAMENTO DE CAMPOS
==========================

ORACLE APEX                    â†’    POSTGRESQL (NOVO)
-------------------                -------------------
EQUIPAMENTO.ID                   â†’   equipamentos.id
EQUIPAMENTO.PATRIMONIO           â†’   equipamentos.patrimonio
EQUIPAMENTO.NUMERO_SERIE         â†’   equipamentos.numero_serie
EQUIPAMENTO.SEI                  â†’   equipamentos.sei
EQUIPAMENTO.DATA_AQUISICAO       â†’   equipamentos.data_aquisicao
EQUIPAMENTO.OBSERVACAO           â†’   equipamentos.observacao
EQUIPAMENTO.ID_TIPO              â†’   equipamentos.tipo_equipamento_id
EQUIPAMENTO.ID_MODELO            â†’   equipamentos.modelo_id
EQUIPAMENTO.ID_STATUS            â†’   equipamentos.status_id
EQUIPAMENTO.ID_TIPO_AQUISICAO    â†’   equipamentos.tipo_aquisicao_id
EQUIPAMENTO.ID_SECAO             â†’   equipamentos.secao_id
EQUIPAMENTO.USUARIO_SOLICITANTE  â†’   equipamentos.usuario_responsavel_id
EQUIPAMENTO.DATA_RETORNO_EMPRESTIMO â†’ equipamentos.data_retorno_emprestimo
EQUIPAMENTO.ID_DISPONIBILIDADE   â†’   equipamentos.disponibilidade_id

TABELAS ESPECÃFICAS:
CELULAR.*                        â†’   equipamentos.dados_especificos (JSON)
RADIO.*                          â†’   equipamentos.dados_especificos (JSON)
CPU.*                            â†’   equipamentos.dados_especificos (JSON)
MONITOR.*                        â†’   equipamentos.dados_especificos (JSON)
MODEM.*                          â†’   equipamentos.dados_especificos (JSON)
CHIP.*                           â†’   equipamentos.dados_especificos (JSON)

13.3 SCRIPT DE EXPORTAÃ‡ÃƒO (ORACLE)
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
    -- Dados especÃ­ficos (unir todas as tabelas)
    CASE 
        WHEN t.nome = 'CELULAR' THEN c.numero_telefone
        ELSE NULL
    END as numero_telefone,
    -- ... outros campos especÃ­ficos
FROM EQUIPAMENTO e
LEFT JOIN TIPO_EQUIPAMENTO t ON e.ID_TIPO = t.ID
LEFT JOIN CELULAR c ON e.ID_EQUIPAMENTO = c.ID_EQUIPAMENTO
LEFT JOIN RADIO r ON e.ID_EQUIPAMENTO = r.ID_EQUIPAMENTO
-- ... outros joins

SPOOL OFF

13.4 SCRIPT DE IMPORTAÃ‡ÃƒO (POSTGRESQL)
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
                    
                    // Dados especÃ­ficos em JSON
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
            console.log('MigraÃ§Ã£o concluÃ­da!');
            console.log(`Total: ${resultados.length}`);
            console.log(`Sucessos: ${resultados.filter(r => r.sucesso).length}`);
            console.log(`Erros: ${resultados.filter(r => !r.sucesso).length}`);
            
            // Salvar log de erros
            fs.writeFileSync('migracao-log.json', JSON.stringify(resultados, null, 2));
        });
}

migrateEquipamentos();

13.5 VALIDAÃ‡ÃƒO PÃ“S-MIGRAÃ‡ÃƒO
============================

âœ“ Contagem total: 12.029 equipamentos
âœ“ Verificar patrimÃ´nios duplicados
âœ“ Validar relacionamentos (foreign keys)
âœ“ Verificar dados nulos obrigatÃ³rios
âœ“ Validar datas (formato e consistÃªncia)
âœ“ Testar consultas principais
âœ“ Validar dados especÃ­ficos por tipo
âœ“ Verificar estrutura organizacional
âœ“ Testar login de usuÃ¡rios migrados

13.6 PLANO DE ROLLBACK
=======================

Em caso de problemas na migraÃ§Ã£o:

1. Backup completo do PostgreSQL antes da migraÃ§Ã£o
2. Script de limpeza (truncate tables)
3. Restaurar backup se necessÃ¡rio
4. Corrigir problemas identificados
5. Tentar nova migraÃ§Ã£o

================================================================================
                    14. SEGURANÃ‡A E AUTENTICAÃ‡ÃƒO
================================================================================

14.1 AUTENTICAÃ‡ÃƒO
==================

Mecanismo: JWT (JSON Web Tokens)
Validade: 
- Access Token: 15 minutos
- Refresh Token: 7 dias

Fluxo:
1. UsuÃ¡rio informa matrÃ­cula e senha
2. Backend valida credenciais na API do SEI
3. SEI retorna dados do usuÃ¡rio
4. Backend gera JWT prÃ³prio
5. Frontend armazena tokens (httpOnly cookie + memory)
6. RequisiÃ§Ãµes subsequentes usam Authorization: Bearer <token>
7. Refresh token automÃ¡tico antes da expiraÃ§Ã£o

14.2 AUTORIZAÃ‡ÃƒO
=================

Perfis de Acesso (Roles):

ADMIN_DTEC:
- Acesso total a todos os recursos
- Bypass em validaÃ§Ãµes
- GestÃ£o de usuÃ¡rios e permissÃµes
- ConfiguraÃ§Ãµes do sistema
- Logs completos

COMANDANTE:
- Visualizar equipamentos do seu batalhÃ£o
- Aprovar/negar pendÃªncias do batalhÃ£o
- RelatÃ³rios do batalhÃ£o
- GestÃ£o de usuÃ¡rios do batalhÃ£o

USUARIO_BATALHAO:
- Visualizar equipamentos da sua seÃ§Ã£o/batalhÃ£o
- Solicitar alteraÃ§Ãµes (sujeito a aprovaÃ§Ã£o)
- RelatÃ³rios bÃ¡sicos da unidade

Guards:
- @Roles() decorator no NestJS
- VerificaÃ§Ã£o em cada endpoint
- Retorno 403 Forbidden se sem permissÃ£o

14.3 SEGURANÃ‡A DA APLICAÃ‡ÃƒO
============================

Backend:
âœ“ Helmet (headers de seguranÃ§a)
âœ“ CORS configurado (domÃ­nios permitidos)
âœ“ Rate limiting (prevenÃ§Ã£o de brute force)
âœ“ ValidaÃ§Ã£o de inputs (class-validator)
âœ“ SanitizaÃ§Ã£o de dados
âœ“ SQL Injection prevention (Prisma ORM)
âœ“ XSS Protection
âœ“ HTTPS obrigatÃ³rio (produÃ§Ã£o)
âœ“ Hash de senhas (bcrypt) - se houver
âœ“ Logs de seguranÃ§a

Frontend:
âœ“ SanitizaÃ§Ã£o de inputs
âœ“ ProteÃ§Ã£o contra XSS
âœ“ CSRF tokens
âœ“ Content Security Policy
âœ“ Armazenamento seguro de tokens
âœ“ Logout automÃ¡tico por inatividade
âœ“ Bloqueio de tela (opcional)

14.4 PROTEÃ‡ÃƒO DE DADOS
=======================

Dados SensÃ­veis:
- Dados de policiais militares
- LocalizaÃ§Ã£o de equipamentos
- InformaÃ§Ãµes operacionais

Medidas:
âœ“ Criptografia em trÃ¢nsito (HTTPS/TLS)
âœ“ Criptografia em repouso (banco de dados)
âœ“ Backup automÃ¡tico criptografado
âœ“ Controle de acesso rigoroso
âœ“ Logs de auditoria completos
âœ“ MÃ¡scara de dados em logs
âœ“ PolÃ­tica de retenÃ§Ã£o de logs
âœ“ Conformidade com LGPD

14.5 AUDITORIA E COMPLIANCE
============================

Logs de SeguranÃ§a:
- Todos os logins (sucesso/fracasso)
- AlteraÃ§Ãµes de permissÃµes
- Acessos a dados sensÃ­veis
- ExportaÃ§Ã£o de relatÃ³rios
- MudanÃ§as de configuraÃ§Ã£o

RetenÃ§Ã£o:
- Logs de autenticaÃ§Ã£o: 2 anos
- Logs de operaÃ§Ã£o: 5 anos
- Logs de seguranÃ§a: 5 anos

RelatÃ³rios de Auditoria:
- Acesso por perÃ­odo
- AÃ§Ãµes por usuÃ¡rio
- Tentativas de acesso nÃ£o autorizado
- MudanÃ§as crÃ­ticas

================================================================================
                    15. CONSIDERAÃ‡Ã•ES FINAIS
================================================================================

15.1 BENEFÃCIOS DA NOVA ARQUITETURA
====================================

âœ“ Performance: Angular + Node.js sÃ£o mais rÃ¡pidos que Oracle APEX
âœ“ Escalabilidade: Arquitetura moderna e distribuÃ­da
âœ“ Manutenibilidade: CÃ³digo organizado e documentado
âœ“ Flexibilidade: FÃ¡cil adiÃ§Ã£o de novas funcionalidades
âœ“ UX/UI: Interface moderna e responsiva (PrimeNG + Tailwind)
âœ“ IntegraÃ§Ã£o: API REST facilita integraÃ§Ãµes futuras
âœ“ SeguranÃ§a: PrÃ¡ticas modernas de seguranÃ§a
âœ“ Mobile: Responsivo para acesso via tablet/celular

15.2 PRÃ“XIMOS PASSOS APÃ“S IMPLANTAÃ‡ÃƒO
======================================

Fase 2 (Futuro):
â–¡ Aplicativo mobile nativo (React Native/Flutter)
â–¡ Leitura de QR Code para inventÃ¡rio
â–¡ NotificaÃ§Ãµes push
â–¡ Assinatura digital de termos
â–¡ IntegraÃ§Ã£o com sistema de chamados
â–¡ RelatÃ³rios avanÃ§ados com BI
â–¡ Machine Learning para previsÃ£o de manutenÃ§Ã£o
â–¡ IntegraÃ§Ã£o com sistema financeiro (empenhos)
â–¡ Multi-tenancy (outras polÃ­cias militares)

15.3 SUPORTE E MANUTENÃ‡ÃƒO
==========================

Suporte TÃ©cnico:
- Canal de atendimento (email/telefone)
- DocumentaÃ§Ã£o online
- FAQ e tutoriais
- Treinamento contÃ­nuo

ManutenÃ§Ã£o:
- CorreÃ§Ã£o de bugs (SLA definido)
- AtualizaÃ§Ãµes de seguranÃ§a
- Melhorias incrementais
- Backup automÃ¡tico diÃ¡rio
- Monitoramento 24/7

15.4 INDICADORES DE SUCESSO
============================




