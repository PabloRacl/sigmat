# Evolução do Pensamento e Implementação

> Navegação: [[SIGMAT - Mapa de Conteúdo]] · [[Manual do Obsidian]] · [[Fluxo do Sistema SIGMAT]]

Este documento registra a jornada lógica de construção do SIGMAT, conectando cada decisão técnica ao seu propósito funcional.

## 🟢 Fase 1: Fundação e Estrutura de Dados
Tudo começou com a definição da base. Não podemos gerenciar materiais sem uma estrutura sólida de onde eles estão e quem manda.
- [[Banco de Dados]]: Aqui definimos que o sistema seria focado na Hierarquia da PMPE.
- Decidimos usar o campo `matricula` em vez de `cpf` para alinhar com a identidade funcional da corporação.

## 🔵 Fase 2: Segurança e Integração
Com o banco pronto, o foco mudou para: "Quem pode entrar?".
- [[Visão Geral Backend]]: Implementação da integração com o SEI e segurança JWT.
- Evolução: Corrigimos inconsistências de campos entre o SEI e o Banco local para garantir que o login funcionasse com o formato `pablo.ricardo`.

## 🟡 Fase 3: Workflow de Aprovação
O grande diferencial do SIGMAT. Como garantir que um soldado não mude a lotação de um fuzil sem o Capitão saber?
- [[Fluxo de Aprovação]]: Criamos a lógica de "Alteração Pendente".
- Implementamos o `AprovacoesService` no Backend para interceptar edições sensíveis.

## 🔴 Fase 4: Interface e Estética Militar
A interface precisa transparecer a seriedade da instituição.
- [[Visão Geral Frontend]]: Refinamos as cores para Azul Marinho/Navy, removendo tons informais.
- Simplificamos a jornada de login para ser direta e funcional.

## 🚀 Próximos Passos
- [[Próximas Etapas]]: Focar na geração de PDFs e relatórios de inventário.

---
*Este gráfico evolutivo ajuda a entender por que cada peça do quebra-cabeça foi colocada em seu lugar.*



