# 📊 Relatórios e Exportação

O sistema permite extrair dados para uso externo em diversos formatos.

## 📁 Formatos Suportados
- **Excel (.xlsx):** Via biblioteca `xlsx` (SheetJS). Usado para inventários completos.
- **PDF (.pdf):** Via `jsPDF` e `jspdf-autotable`. Usado para termos de responsabilidade e etiquetas.
- **Word (.docx):** Integrado via `docx.js` para modelos de ofícios.

## 🏷️ Geração de Etiquetas
Uma função especial que gera PDFs formatados para impressão em impressoras de etiquetas, contendo QR Code com o link do equipamento.

## 📍 Localização no Código
- Frontend: `src/app/services/pdf.service.ts`
- Frontend: `src/app/services/excel.service.ts`

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Módulo de Transferências]]



