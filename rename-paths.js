const fs = require('fs');
const path = require('path');
const roots = [
  path.join(process.cwd(), 'atlas-frontend', 'src', 'app'),
  path.join(process.cwd(), 'atlas-backend', 'src'),
  path.join(process.cwd(), 'atlas-backend', 'test')
];
const replacements = [
  ['\.\/interceptors\/', './interceptadores/'],
  ['\.\.\/core\/', '../nucleo/'],
  ['\.\/core\/', './nucleo/'],
  ['\.\.\.\/core\/', '../../nucleo/'],
  ['\.\.\.\.\/core\/', '../../../nucleo/'],
  ['\.\.\.\.\.\/core\/', '../../../../nucleo/'],
  ['\.\.\/components\/', '../componentes/'],
  ['\.\/components\/', './componentes/'],
  ['\.\.\.\/components\/', '../../componentes/'],
  ['\.\/features\/auth\/', './features/autenticacao/'],
  ['\.\/features\/mobile\/', './features/celular/'],
  ['\.\/interceptors\/', './interceptadores/'],
  ['\.\/database\/', './banco-dados/'],
  ['\.\.\/database\/', '../banco-dados/'],
  ['\.\.\.\/database\/', '../../banco-dados/'],
  ['\.\/integrations\/', './integracoes/'],
  ['\.\.\/integrations\/', '../integracoes/'],
  ['\.\.\.\/integrations\/', '../../integracoes/'],
  ['\.\/modules\/', './modulos/'],
  ['\.\.\/modules\/', '../modulos/'],
  ['\.\.\.\/modules\/', '../../modulos/'],
  ['src/modules\/', 'src/modulos/'],
  ['\.\/shared\/', './compartilhado/'],
  ['\.\.\/shared\/', '../compartilhado/'],
  ['\.\.\.\/shared\/', '../../compartilhado/'],
  ['\.\.\/access-requests\/', '../solicitacoes-acesso/'],
  ['\.\/access-requests\/', './solicitacoes-acesso/'],
  ['\.\/org-structure\/', './estrutura-organizacional/'],
  ['\.\.\/org-structure\/', '../estrutura-organizacional/'],
  ['\.\/dashboard\/', './visao-geral/'],
  ['\.\/equipment\/', './equipamentos/'],
  ['\.\/loans\/', './cautelas/'],
  ['\.\/reports\/', './relatorios/'],
  ['\.\/settings\/', './configuracoes/'],
  ['\.\/transfers\/', './transferencias/'],
  ['\.\/maintenance\/', './manutencao/'],
  ['\.\/notifications\/', './notificacoes/'],
  ['\.\/logs\/', './registros/'],
  ['access-requests\/', 'solicitacoes-acesso/'],
  ['org-structure\/', 'estrutura-organizacional/'],
  ['dashboard\/', 'visao-geral/'],
  ['equipment\/', 'equipamentos/'],
  ['loans\/', 'cautelas/'],
  ['reports\/', 'relatorios/'],
  ['settings\/', 'configuracoes/'],
  ['transfers\/', 'transferencias/'],
  ['maintenance\/', 'manutencao/'],
  ['notifications\/', 'notificacoes/'],
  ['logs\/', 'registros/']
];
function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(walk(p));
    } else if (item.isFile() && p.endsWith('.ts')) {
      files.push(p);
    }
  }
  return files;
}
let modified = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const allFiles = walk(root);
  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    for (const [from, to] of replacements) {
      const re = new RegExp(from, 'g');
      content = content.replace(re, to);
    }
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      modified++;
    }
  }
}
console.log(`Updated ${modified} files`);
