const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'sigmat-frontend', 'src', 'app');
const mappings = [
  ['features/autenticacao/login','features/autenticacao/entrada'],
  ['features/aprovacoes/approvals-list','features/aprovacoes/lista'],
  ['features/auditoria/audit-logs','features/auditoria/registros'],
  ['features/cautelas/loans-management','features/cautelas/gestao'],
  ['features/celular/mobile-qrcode','features/celular/qrcode-movel'],
  ['features/equipamentos/equipment-details','features/equipamentos/detalhes'],
  ['features/equipamentos/equipment-form','features/equipamentos/formulario'],
  ['features/equipamentos/equipment-list','features/equipamentos/lista'],
  ['features/equipamentos/equipment-timeline','features/equipamentos/linha-do-tempo'],
  ['features/manutencao/maintenance-list','features/manutencao/lista'],
  ['features/relatorios/reports','features/relatorios/lista'],
  ['features/transferencias/transfers-list','features/transferencias/lista'],
  ['features/usuarios/users-list','features/usuarios/lista'],
  ['features/visao-geral/dashboard','features/visao-geral/painel'],
  ['features/visao-geral/dashboard-home','features/visao-geral/inicio'],
  ['nucleo/guards','nucleo/guardas'],
  ['nucleo/services','nucleo/servicos'],
];

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
const renameDirectory = (oldRel, newRel) => {
  const oldPath = path.join(root, oldRel);
  const newPath = path.join(root, newRel);
  if (fs.existsSync(oldPath)) {
    if (fs.existsSync(newPath)) {
      console.log('skipping rename, already exists:', newRel);
    } else {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.renameSync(oldPath, newPath);
      console.log('renamed', oldRel, '=>', newRel);
    }
  } else {
    console.warn('missing path', oldRel);
  }
};

for (const [oldRel, newRel] of mappings) {
  renameDirectory(oldRel, newRel);
}

const files = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|html|scss|css)$/.test(entry.name)) files.push(full);
  }
};
walk(root);
let updated = 0;
for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [oldRel, newRel] of mappings) {
    const regex = new RegExp(escapeRegExp(oldRel), 'g');
    content = content.replace(regex, newRel);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
    console.log('updated', path.relative(root, filePath));
  }
}
console.log('finished:', updated, 'files updated');
