# 🚚 Módulo de Transferências

Gerencia a movimentação física e lógica dos equipamentos entre diferentes unidades da PMPE.

## 📋 Tipos de Movimentação
- **Solicitação Direta:** Uma seção pede um item.
- **Transferência Ativa:** Uma seção envia um item para outra.

## 🛡️ Segurança e Aprovação
Para evitar fraudes ou erros, a transferência tem dois estados:
1. **PENDENTE:** O item ainda está na unidade de origem, mas "reservado".
2. **CONCLUÍDA:** O destino confirma o recebimento e o sistema atualiza a `secaoId` do equipamento no banco de dados.

## 📄 Geração de Documentos
O sistema gera automaticamente o termo de transferência (PDF) via `PdfService`.

---
#links: [[Modelo de Dados]], [[Relatórios e Exportação]]



