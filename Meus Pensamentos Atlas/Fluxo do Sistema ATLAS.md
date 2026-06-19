# Fluxo do Sistema atlas PMPE

> NavegaÃ§Ã£o: [[atlas - Mapa de ConteÃºdo]] Â· [[Manual do Obsidian]] Â· [[EvoluÃ§Ã£o do Pensamento]]

Este documento detalha o fluxo de dados e as conexÃµes entre o frontend (Angular) e o backend (NestJS) do sistema atlas.

## 1. Arquitetura Geral

```mermaid
graph TD
    subgraph Frontend_Angular
        UI[Interface do UsuÃ¡rio]
        SC[Standalone Components]
        SV[Services HttpClient]
        GR[Guards / Interceptors]
    end

    subgraph Backend_NestJS
        CT[Controllers]
        MS[Modules / Services]
        PR[Prisma ORM]
        JWT[AutenticaÃ§Ã£o JWT]
    end

    DB[(PostgreSQL)]

    UI --> SC
    SC --> SV
    SV --> GR
    GR --> CT
    CT --> MS
    MS --> PR
    PR --> DB
    JWT -.-> GR
```

## 2. Fluxo: Cadastro de Equipamento

```mermaid
sequenceDiagram
    participant U as UsuÃ¡rio
    participant F as Frontend (EquipamentosLista)
    participant S as Frontend Service
    participant B as Backend Controller
    participant D as Banco de Dados (Prisma)

    U->>F: Preenche FormulÃ¡rio
    F->>F: Valida Campos (PatrimÃ´nio, Tipo, etc.)
    U->>F: Clica em Salvar
    F->>S: post('/equipamentos', dados)
    S->>B: Request com Token JWT
    B->>D: prisma.equipamento.create()
    D-->>B: Equipamento Criado
    B-->>S: Response 201 Created
    S-->>F: Sucesso
    F->>U: Mostra Toast de Sucesso e Atualiza Lista
```

## 3. Fluxo DinÃ¢mico: Carga / Descarga (EmprÃ©stimo)

O sistema monitora a disponibilidade e habilita campos especÃ­ficos.

```mermaid
graph LR
    A[Selecionar Equipamento] --> B{Disponibilidade?}
    B -- Emprestado --> C[Habilitar Campos de Retorno]
    C --> D[Solicitante]
    C --> E[Data SolicitaÃ§Ã£o]
    C --> F[Data Retorno Prevista]
    B -- DisponÃ­vel --> G[Ocultar Campos de Retorno]
```

## 4. ConexÃµes de Dados (Prisma Schema)

| Tabela | FunÃ§Ã£o | RelaÃ§Ã£o Principal |
| :--- | :--- | :--- |
| `Equipamento` | Tabela Central | `tipoEquipamentoId`, `statusId`, `secaoId` |
| `Usuario` | GestÃ£o de Acesso | `secaoId`, `perfil` |
| `Disponibilidade`| Estado do Material | `Equipamento.disponibilidadeId` |
| `LogOperacao` | Auditoria | `equipamentoId`, `usuarioId` |

## 5. Workflow de AprovaÃ§Ã£o (Auditoria)

O sistema garante que alteraÃ§Ãµes sensÃ­veis feitas por usuÃ¡rios de batalhÃ£o passem por validaÃ§Ã£o.

```mermaid
sequenceDiagram
    participant U as UsuÃ¡rio BatalhÃ£o
    participant A as AprovacoesService
    participant C as Comandante / Admin
    participant E as Equipamento (Tabela)

    U->>A: Solicita AlteraÃ§Ã£o (dados novos)
    A->>A: Salva em 'AlteracaoPendente'
    C->>A: Lista PendÃªncias
    C->>A: Processar DecisÃ£o (Aprovar/Negar)
    alt Aprovado
        A->>E: Aplica 'dadosNovos' no Equipamento
    else Negado
        A->>A: Marca como reprovado + Motivo
    end
```

## 6. Dashboard AnalÃ­tico

O dashboard consome o endpoint `/dashboard/estatisticas` que consolida:
1. **Contagem por Status** (Ativo, Inativo, ManutenÃ§Ã£o)
2. **Contagem por Tipo** (RÃ¡dio, CPU, Monitor)
3. **DistribuiÃ§Ã£o por BatalhÃ£o** (Soma de equipamentos em todas as seÃ§Ãµes do batalhÃ£o)
4. **Resumo Executivo** (Cards de topo)

## 7. RelatÃ³rios e Auditoria

O sistema permite a rastreabilidade total das operaÃ§Ãµes.

```mermaid
graph TD
    A[UsuÃ¡rio] --> B{RelatÃ³rios}
    B --> C[InventÃ¡rio Geral]
    B --> D[Auditoria de OperaÃ§Ãµes]
    C --> E[Filtros: SeÃ§Ã£o/Tipo]
    E --> F[Exportar CSV]
    D --> G[Logs: Quem/Quando/O que]
```

| OperaÃ§Ã£o | DescriÃ§Ã£o |
| :--- | :--- |
| `CREATE` | Novo material inserido no sistema |
| `UPDATE` | AlteraÃ§Ã£o de dados cadastrais ou estado |
| `DELETE` | RemoÃ§Ã£o de material do inventÃ¡rio |

### 7.1. Detalhamento de AlteraÃ§Ãµes (Diff)
O sistema captura o "Antes" e "Depois" de cada campo alterado, armazenando em formato JSON para auditoria retroativa.

```mermaid
graph TD
    A[UsuÃ¡rio/Admin] --> B{OperaÃ§Ã£o}
    B -- Update --> C[Gerar Diff]
    C --> D[Salvar LogOperacao]
    D --> E[VisualizaÃ§Ã£o no RelatÃ³rio]
```

## 8. GestÃ£o Visual (Fotos)

O sistema permite anexar mÃºltiplas fotos a cada equipamento:
- **Upload:** Armazenamento local no servidor via Multer.
- **VisualizaÃ§Ã£o:** Miniaturas na listagem principal e grade de fotos no detalhamento.
- **Formatos:** Suporte a JPG e PNG com limite de 5MB por arquivo.

## 9. DocumentaÃ§Ã£o Legal (Cautela)

O sistema gera automaticamente o Termo de Responsabilidade (PDF).

```mermaid
graph LR
    A[Registro de SaÃ­da] --> B[Gerar PDF]
    B --> C[Dados Equipamento]
    B --> D[Termo de Responsabilidade]
    B --> E[Campos de Assinatura]
    E --> F[ImpressÃ£o e Assinatura FÃ­sica]
```

---
*DocumentaÃ§Ã£o gerada automaticamente para visualizaÃ§Ã£o no Obsidian.*



