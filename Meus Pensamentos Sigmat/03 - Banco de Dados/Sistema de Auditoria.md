# 🕵️‍♂️ Sistema de Auditoria

O SIGMAT é "auditável", o que significa que nada acontece sem deixar rastro.

## 📝 O que é registrado?
- Quem logou e quando.
- Quem alterou um patrimônio.
- Quem aprovou uma transferência.
- Endereço IP e Navegador utilizado.

## 🗄️ Tabela `LogOperacao`
Todos os logs vivem nesta tabela. No Frontend, o administrador pode ver a tela de **"Atividades Recentes"** que consulta esses dados.

## 🔍 Como buscar
No Obsidian ou no código, procure por `AuditService`. É ele quem dispara os logs silenciosamente toda vez que um comando importante é executado.

---
#links: [[Modelo de Dados]], [[SIGMAT V2 - Mapa de Conteúdo]]



