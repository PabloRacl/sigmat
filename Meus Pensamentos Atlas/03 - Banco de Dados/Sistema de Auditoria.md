# ðŸ•µï¸â€â™‚ï¸ Sistema de Auditoria

O atlas Ã© "auditÃ¡vel", o que significa que nada acontece sem deixar rastro.

## ðŸ“ O que Ã© registrado?
- Quem logou e quando.
- Quem alterou um patrimÃ´nio.
- Quem aprovou uma transferÃªncia.
- EndereÃ§o IP e Navegador utilizado.

## ðŸ—„ï¸ Tabela `LogOperacao`
Todos os logs vivem nesta tabela. No Frontend, o administrador pode ver a tela de **"Atividades Recentes"** que consulta esses dados.

## ðŸ” Como buscar
No Obsidian ou no cÃ³digo, procure por `AuditService`. Ã‰ ele quem dispara os logs silenciosamente toda vez que um comando importante Ã© executado.

---
#links: [[Modelo de Dados]], [[atlas V2 - Mapa de ConteÃºdo]]



