# Próximas Implementações Técnicas

Para concluir o sistema conforme a especificação, as seguintes mudanças serão realizadas:

## 1. Backend: Workflow de Aprovação
Atualmente, o `EquipamentosService` atualiza os dados diretamente. Vamos modificar isso:
- **Lógica**: Se o usuário logado for `USUARIO_BATALHAO`, o sistema interceptará o `PATCH` e salvará os dados em `alteracoes_pendentes`.
- **Módulo de Aprovações**: Criaremos endpoints para o Comandante listar e aprovar/negar essas solicitações.

## 2. Frontend: Modais e Filtros
- **Formulário Dinâmico**: O formulário de edição de equipamentos será adaptado para exibir campos específicos (ex: IMEI para Celular) baseados no tipo selecionado.
- **Badge de Notificação**: Adicionaremos um contador no header para o Comandante ver pendências em tempo real.

## 3. Banco de Dados: Sincronização SEI
- Refinaremos o `seed.ts` para incluir dados realistas da estrutura da PMPE, facilitando os testes.

---
> [!NOTE]
> Estas mudanças garantem que o sistema seja seguro e siga a hierarquia militar da PMPE.



