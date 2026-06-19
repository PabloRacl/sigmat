# Fluxo de AprovaÃ§Ã£o e ValidaÃ§Ã£o

O atlas implementa um modelo de governanÃ§a onde alteraÃ§Ãµes sensÃ­veis precisam de aprovaÃ§Ã£o de um superior (Comandante de BatalhÃ£o).

## 1. O Processo

1. **SolicitaÃ§Ã£o**: Um usuÃ¡rio comum (`USUARIO_BATALHAO`) tenta editar um equipamento.
2. **IntercepÃ§Ã£o**: O sistema detecta que a alteraÃ§Ã£o requer validaÃ§Ã£o.
3. **Pendente**: Em vez de atualizar a tabela `equipamentos`, o sistema cria um registro em `alteracoes_pendentes`.
4. **NotificaÃ§Ã£o**: O Comandante visualiza uma pendÃªncia em sua dashboard.
5. **DecisÃ£o**:
    - **Aprovar**: Os dados novos sÃ£o aplicados ao equipamento original.
    - **Negar**: A alteraÃ§Ã£o Ã© descartada e o solicitante Ã© notificado com o motivo.

## 2. Diagrama de Fluxo

```mermaid
sequenceDiagram
    participant U as UsuÃ¡rio BatalhÃ£o
    participant B as Backend (NestJS)
    participant C as Comandante
    participant DB as Banco de Dados

    U->>B: Tenta Editar Equipamento
    B->>DB: Registra AlteraÃ§Ã£o Pendente
    B->>C: Notifica PendÃªncia
    C->>B: Revisa e Aprova
    B->>DB: Atualiza Tabela Equipamentos
    B->>DB: Marca PendÃªncia como Aprovada
    B->>U: Notifica Sucesso
```

## 3. Campos que Exigem AprovaÃ§Ã£o
- Status do Equipamento
- SeÃ§Ã£o de LotaÃ§Ã£o
- ResponsÃ¡vel Direto
- Dados CrÃ­ticos (IMEI, PatrimÃ´nio, NÃºmero de SÃ©rie)

## 4. Endpoints Principais
- `GET /aprovacoes/pendentes` â€” lista pendÃªncias de aprovaÃ§Ã£o da unidade.
- `GET /aprovacoes/contagem` â€” retorna total de pendÃªncias ativas.
- `GET /aprovacoes/:id` â€” obtÃ©m detalhes de uma pendÃªncia especÃ­fica.
- `POST /aprovacoes/:id/decisao` â€” aprova ou nega uma pendÃªncia.
- `PATCH /equipamentos/:id` â€” atualiza equipamento; para usuÃ¡rios comuns cria pendÃªncia.
- `DELETE /equipamentos/:id` â€” exclui equipamento; para nÃ£o-admin cria pendÃªncia de exclusÃ£o.

## 5. Regras atuais do workflow
- `ADMIN_DTEC` pode atualizar ou excluir direto sem pendÃªncia.
- `COMANDANTE` pode atualizar direto e processar aprovaÃ§Ãµes apenas da sua unidade.
- Outros perfis criam pendÃªncia para alteraÃ§Ãµes sensÃ­veis e aguardam decisÃ£o.
- Uma pendÃªncia que jÃ¡ foi aprovada ou negada nÃ£o pode ser processada novamente.

---
> [!IMPORTANT]
> Administradores da DTEC (`ADMIN_DTEC`) podem ignorar este fluxo e editar diretamente qualquer item.



