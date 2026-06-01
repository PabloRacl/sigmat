# 🛠️ Fluxo de Manutenção

O módulo de manutenção é responsável por tirar equipamentos da "Disponibilidade" e registrar seu histórico técnico.

## 🔄 Ciclo de Vida da OS
1. **Abertura:** O usuário seleciona equipamentos e usa a função `enviarParaManutencao`.
2. **Impacto:** O status do equipamento muda automaticamente para **MANUTENÇÃO**.
3. **Processamento:** 
   - No Frontend: `MaintenanceService.criarMassa`
   - No Backend: `MaintenanceController.criarMassa`
4. **Finalização:** Quando o técnico conclui, o equipamento volta ao status **ATIVO** (ou outro definido).

## 🚀 Ações em Massa
O sistema permite enviar 100+ equipamentos para manutenção de uma vez só. 
- **Lógica:** O backend usa uma `transaction` do Prisma para garantir que ou todos os equipamentos mudam de status, ou nenhum muda (evitando erros de dados).

---
#links: [[Modelo de Dados]], [[Comandos Úteis]]



