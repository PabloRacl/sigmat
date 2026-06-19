# ðŸ“Š RelatÃ³rios e ExportaÃ§Ã£o

O sistema permite extrair dados para uso externo em diversos formatos.

## ðŸ“ Formatos Suportados
- **Excel (.xlsx):** Via biblioteca `xlsx` (SheetJS). Usado para inventÃ¡rios completos.
- **PDF (.pdf):** Via `jsPDF` e `jspdf-autotable`. Usado para termos de responsabilidade e etiquetas.
- **Word (.docx):** Integrado via `docx.js` para modelos de ofÃ­cios.

## ðŸ·ï¸ GeraÃ§Ã£o de Etiquetas
Uma funÃ§Ã£o especial que gera PDFs formatados para impressÃ£o em impressoras de etiquetas, contendo QR Code com o link do equipamento.

## ðŸ“ LocalizaÃ§Ã£o no CÃ³digo
- Frontend: `src/app/services/pdf.service.ts`
- Frontend: `src/app/services/excel.service.ts`

---
#links: [[atlas V2 - Mapa de ConteÃºdo]], [[MÃ³dulo de TransferÃªncias]]



