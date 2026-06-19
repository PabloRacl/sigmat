# ðŸ“ Guia de MudanÃ§as e ImplementaÃ§Ã£o - MÃ³dulo de AutenticaÃ§Ã£o

## 1. AvaliaÃ§Ã£o TÃ©cnica do CÃ³digo Atual

O mÃ³dulo de autenticaÃ§Ã£o desenvolvido conecta o atlas Ã s bases de dados corporativas da PM-PE (LDAP, SGPM e SGA). Abaixo estÃ£o os pontos crÃ­ticos a serem ajustados antes da homologaÃ§Ã£o.

### âœ… Pontos Positivos
1.  **IntegraÃ§Ã£o Corporativa Real:** A validaÃ§Ã£o em trÃªs camadas (LDAP â†’ SGPM â†’ SGA) garante que apenas militares autorizados e ativos acessem o sistema.
2.  **ResiliÃªncia (Mock Mode):** A presenÃ§a do modo de desenvolvimento (`USE_MOCK_AUTH`) permite que a equipe continue programando mesmo sem rede da corporaÃ§Ã£o.
3.  **GestÃ£o de SessÃ£o:** ImplementaÃ§Ã£o correta de Refresh Tokens (7 dias) e Blacklist (para logout imediato).
4.  **ConexÃ£o Direta ao Banco:** O uso de `pg` (Pool) para consultar SGPM e SGA diretamente Ã© uma decisÃ£o tÃ©cnica vÃ¡lida e performÃ¡tica, evitando dependÃªncia de APIs intermediÃ¡rias nÃ£o documentadas.

### âš ï¸ Pontos de AtenÃ§Ã£o e CorreÃ§Ã£o

1.  **Nomenclatura em InglÃªs:** O cÃ³digo mistura termos em inglÃªs (`loginCorporativo`, `obterDadosSgpm`, `obterPermissao`) com a estrutura em portuguÃªs. **AÃ§Ã£o:** Padronizar tudo para portuguÃªs para facilitar a manutenÃ§Ã£o pelo time.
2.  **Vazamento de Erros (Stack Trace):** No `AuthService`, os erros internos estÃ£o sendo lanÃ§ados diretamente para o frontend (`error.message`). Isso pode vazar caminhos do servidor. **AÃ§Ã£o:** Logar o erro internamente e retornar uma mensagem genÃ©rica ao usuÃ¡rio.
3.  **Hardcoded de Email:** O sistema gera o email automaticamente (`${nome_guerra}@pm.pe.gov.br`). **AÃ§Ã£o:** Buscar o campo de email real na tabela `ViewSgpm` se disponÃ­vel.
4.  **CÃ³digo Morto/Debug:** A rota `/debug-ping` nÃ£o deve existir em produÃ§Ã£o. **AÃ§Ã£o:** Remover ou proteger com variÃ¡vel de ambiente secreta.

---

## 2. Tabela de PadronizaÃ§Ã£o de Linguagem

Todas as pastas, mÃ©todos e variÃ¡veis devem seguir o padrÃ£o **PortuguÃªs do Brasil**. Abaixo estÃ¡ a tabela de substituiÃ§Ã£o para refatoraÃ§Ã£o.

### MÃ©todos e FunÃ§Ãµes (Service)

| Termo Atual (InglÃªs/Misto) | Termo Novo (PortuguÃªs) | Justificativa |
| :--- | :--- | :--- |
| `autenticar` | `validarNoLdap` | Mais especÃ­fico sobre a aÃ§Ã£o |
| `obterDadosSgpm` | `consultarDadosFuncionais` | Termo mais formal e claro |
| `obterPermissao` | `consultarPerfisAcesso` | Reflete melhor a consulta ao SGA |
| `loginCorporativo` | `autenticarMilitar` | Foco no sujeito (militar) |
| `solicitarAcessoCorporativo` | `solicitarAcessoInicial` | Evita repetiÃ§Ã£o de "corporativo" |
| `gerarRefreshToken` | `criarTokenRenovacao` | Termo tÃ©cnico mais preciso |
| `testarConexoes` | `verificarStatusSistemas` | Mais claro para monitoramento |
| `isTokenBlacklisted` | `verificarTokenBloqueado` | PadrÃ£o PT-BR |

### VariÃ¡veis e Modelos de Dados

| Termo Atual | Termo Novo |
| :--- | :--- |
| `sgpmData` | `dadosFuncionais` |
| `sgaPermissao` | `dadosAcessoSga` |
| `cpfLdap` | `cpfValidado` |
| `isMock` | `usarModoMock` |
| `allowedMocks` | `usuariosPermitidosMock` |
| `responseReturn` | `listaLogin` |

### Nomes de Pastas e Arquivos (SugestÃ£o de RenomeaÃ§Ã£o)

Atualmente, algumas pastas estÃ£o em inglÃªs. Recomenda-se a seguinte estrutura para o diretÃ³rio `src/`:

*   `src/integracoes/ldap/` â†’ `src/integracoes/validacao-ldap/`
*   `src/integracoes/sga/` â†’ `src/integracoes/bases-corporativas/`
*   `src/modulos/autenticacao/` â†’ `src/modulos/acesso/`
*   `src/modulos/solicitacoes-acesso/` â†’ `src/modulos/solicitacoes-acesso/` (Manter)
*   `src/modulos/usuarios/` â†’ `src/modulos/pessoal/`
*   `src/modulos/equipamentos/` â†’ `src/modulos/materiais/`
*   `src/modulos/manutencao/` â†’ `src/modulos/assistencia-tecnica/`
*   `src/modulos/transferencias/` â†’ `src/modulos/movimentacoes/`

---

## 3. Plano de ImplementaÃ§Ã£o do Login

Este passo a passo deve ser seguido para garantir que a conexÃ£o com os sistemas da PM funcione corretamente.

### Passo 1: ConfiguraÃ§Ã£o das VariÃ¡veis de Ambiente (.env)

Crie ou atualize o arquivo `.env` na raiz do projeto com os dados de conexÃ£o das bases da corporaÃ§Ã£o. **AtenÃ§Ã£o:** Nunca commite este arquivo para o Git.

```env
# ConfiguraÃ§Ã£o de ConexÃ£o com a Rede da PM
API_LDAP=https://ldap.pm.pe.gov.br/api/validacao
SGA_DB_HOST=ip-do-banco-sga.pm.pe.gov.br
SGA_DB_PORT=5432
SGA_DB_USER=usuario_sistema_sga
SGA_DB_PASSWORD=sua_senha_sga
SGA_DB_DATABASE=nome_base_sga
SGA_SYSTEM_ID=19

SGPM_DB_HOST=ip-do-banco-sgpm.pm.pe.gov.br
SGPM_DB_PORT=5432
SGPM_DB_USER=usuario_sistema_sgpm
SGPM_DB_PASSWORD=sua_senha_sgpm
SGPM_DB_DATABASE=nome_base_sgpm
```

### Passo 2: Executar a RefatoraÃ§Ã£o de Nomenclatura

1.  Renomear o arquivo `src/modulos/autenticacao/` para `src/modulos/acesso/`.
2.  No `AcessoService` (antigo `AuthService`):
    *   Renomear `loginCorporativo` para `autenticarMilitar`.
    *   Renomear `obterDadosSgpm` para `consultarDadosFuncionais`.
    *   Renomear `obterPermissao` para `consultarPerfisAcesso`.
3.  Atualizar os `imports` em todos os arquivos que referenciam esses serviÃ§os.

### Passo 3: ImplementaÃ§Ã£o Segura do Backend

Garanta que o cÃ³digo final do serviÃ§o de autenticaÃ§Ã£o (em portuguÃªs) fique similar ao exemplo abaixo:

```typescript
// Exemplo de estrutura refatorada
@Injectable()
export class AcessoService {
  constructor(
    private readonly validacaoLdap: ValidacaoLdapService,
    private readonly basesCorporativas: BasesCorporativasService
  ) {}

  async autenticarMilitar(login: string, senha: string) {
    try {
      // 1. ValidaÃ§Ã£o no LDAP
      const cpfValidado = await this.validacaoLdap.validarNoLogin(login, senha);
      
      // 2. Consulta de Dados Funcionais (SGPM)
      const dadosFuncionais = await this.basesCorporativas.consultarDadosFuncionais(cpfValidado);
      
      // 3. Consulta de Perfis (SGA)
      const dadosAcessoSga = await this.basesCorporativas.consultarPerfisAcesso(cpfValidado);

      // ... restante da lÃ³gica de geraÃ§Ã£o de token ...
      
    } catch (erro) {
      this.logger.error(`Falha na autenticaÃ§Ã£o: ${erro.message}`, erro.stack);
      throw new ErroNaoAutorizado('Credenciais invÃ¡lidas ou usuÃ¡rio sem permissÃ£o.');
    }
  }
}
```

### Passo 4: ValidaÃ§Ã£o e Testes

1.  **Teste Local (Mock):** Rodar a aplicaÃ§Ã£o localmente para testar a UI.
2.  **Teste de Rede (Staging):** Conectar o servidor a uma rede que tenha acesso Ã s bases da PM (VPN ou intranet).
3.  **Teste de UsuÃ¡rio:**
    *   Tentar login com usuÃ¡rio inexistente.
    *   Tentar login com senha errada.
    *   Tentar login com usuÃ¡rio ativo no LDAP, mas sem acesso no SGA.
    *   Tentar login com usuÃ¡rio autorizado no SGA, mas inativo.

---

## 4. Checklist de AprovaÃ§Ã£o

- [ ] VariÃ¡veis de ambiente configuradas no servidor de produÃ§Ã£o.
- [ ] RenomeaÃ§Ã£o de todas as pastas e mÃ©todos para PortuguÃªs.
- [ ] RemoÃ§Ã£o da rota `/debug-ping`.
- [ ] Tratamento de erros padronizado (sem stack trace para o usuÃ¡rio).
- [ ] Teste de login realizado com um usuÃ¡rio real da corporaÃ§Ã£o.
- [ ] Garantias de conexÃ£o com o banco de dados (timeout e retry) implementadas.
