const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname);
const frontendRoot = path.join(projectRoot, 'atlas-frontend', 'src', 'app');
const backendRoot = path.join(projectRoot, 'atlas-backend', 'src');

const renameItems = [
  // frontend files
  [path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'approvals-list.component.html'), path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'lista-aprovacoes.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'approvals-list.component.scss'), path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'lista-aprovacoes.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'approvals-list.component.spec.ts'), path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'lista-aprovacoes.component.spec.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'approvals-list.component.ts'), path.join(frontendRoot, 'funcionalidades', 'aprovacoes', 'lista', 'lista-aprovacoes.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'audit-logs.component.html'), path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'registros-auditoria.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'audit-logs.component.scss'), path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'registros-auditoria.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'audit-logs.component.ts'), path.join(frontendRoot, 'funcionalidades', 'auditoria', 'registros', 'registros-auditoria.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'login.component.html'), path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'entrada.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'login.component.scss'), path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'entrada.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'login.component.spec.ts'), path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'entrada.component.spec.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'login.component.ts'), path.join(frontendRoot, 'funcionalidades', 'autenticacao', 'entrada', 'entrada.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'loans-management.component.html'), path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'gestao-cautelas.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'loans-management.component.scss'), path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'gestao-cautelas.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'loans-management.component.ts'), path.join(frontendRoot, 'funcionalidades', 'cautelas', 'gestao', 'gestao-cautelas.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'mobile-qrcode.component.html'), path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'qr-movel.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'mobile-qrcode.component.scss'), path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'qr-movel.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'mobile-qrcode.component.ts'), path.join(frontendRoot, 'funcionalidades', 'celular', 'qrcode-movel', 'qr-movel.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'equipment-details.component.html'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'detalhes-equipamento.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'equipment-details.component.scss'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'detalhes-equipamento.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'equipment-details.component.ts'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'detalhes', 'detalhes-equipamento.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'equipment-form.component.html'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'formulario-equipamento.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'equipment-form.component.scss'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'formulario-equipamento.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'equipment-form.component.ts'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'formulario', 'formulario-equipamento.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'equipment-timeline.component.html'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'linha-do-tempo-equipamento.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'equipment-timeline.component.scss'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'linha-do-tempo-equipamento.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'equipment-timeline.component.ts'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'linha-do-tempo', 'linha-do-tempo-equipamento.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'equipment-list.component.html'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'lista-equipamentos.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'equipment-list.component.scss'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'lista-equipamentos.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'equipment-list.component.spec.ts'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'lista-equipamentos.component.spec.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'equipment-list.component.ts'), path.join(frontendRoot, 'funcionalidades', 'equipamentos', 'lista', 'lista-equipamentos.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'maintenance-list.component.html'), path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'lista-manutencao.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'maintenance-list.component.scss'), path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'lista-manutencao.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'maintenance-list.component.ts'), path.join(frontendRoot, 'funcionalidades', 'manutencao', 'lista', 'lista-manutencao.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'reports.component.html'), path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'relatorios.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'reports.component.scss'), path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'relatorios.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'reports.component.ts'), path.join(frontendRoot, 'funcionalidades', 'relatorios', 'lista', 'relatorios.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'transfers-list.component.html'), path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'lista-transferencias.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'transfers-list.component.scss'), path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'lista-transferencias.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'transfers-list.component.ts'), path.join(frontendRoot, 'funcionalidades', 'transferencias', 'lista', 'lista-transferencias.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'users-list.component.html'), path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'lista-usuarios.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'users-list.component.scss'), path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'lista-usuarios.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'users-list.component.ts'), path.join(frontendRoot, 'funcionalidades', 'usuarios', 'lista', 'lista-usuarios.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'dashboard-home.component.html'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'visao-inicial.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'dashboard-home.component.scss'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'visao-inicial.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'dashboard-home.component.ts'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'inicio', 'visao-inicial.component.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'dashboard.component.html'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'painel.component.html')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'dashboard.component.scss'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'painel.component.scss')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'dashboard.component.spec.ts'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'painel.component.spec.ts')],
  [path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'dashboard.component.ts'), path.join(frontendRoot, 'funcionalidades', 'visao-geral', 'painel', 'painel.component.ts')],
  [path.join(frontendRoot, 'interceptadores', 'auth.interceptor.ts'), path.join(frontendRoot, 'interceptadores', 'autenticacao.interceptor.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'approvals.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'aprovacoes.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'auth.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'autenticacao.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'dashboard.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'painel.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'equipment.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'equipamentos.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'loans.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'cautelas.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'maintenance.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'manutencao.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'mock-mode.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'modo-mock.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'notifications.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'notificacoes.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'reports.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'relatorios.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'settings.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'configuracoes.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'transfers.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'transferencias.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'upload.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'carregamento.service.ts')],
  [path.join(frontendRoot, 'nucleo', 'servicos', 'users.service.ts'), path.join(frontendRoot, 'nucleo', 'servicos', 'usuarios.service.ts')],

  // backend directories and files
  [path.join(backendRoot, 'compartilhado', 'services'), path.join(backendRoot, 'compartilhado', 'servicos')],
  [path.join(backendRoot, 'comum', 'guards'), path.join(backendRoot, 'comum', 'guardas')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'auth.controller.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'autenticacao.controller.ts')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'auth.module.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'autenticacao.module.ts')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'auth.repository.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'autenticacao.repository.ts')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'auth.service.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'autenticacao.service.ts')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'dto', 'login.dto.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'dto', 'entrada.dto.ts')],
  [path.join(backendRoot, 'modulos', 'autenticacao', 'guards', 'jwt-auth.guard.ts'), path.join(backendRoot, 'modulos', 'autenticacao', 'guards', 'jwt-autenticacao.guard.ts')],
  [path.join(backendRoot, 'modulos', 'configuracoes', 'settings.controller.ts'), path.join(backendRoot, 'modulos', 'configuracoes', 'configuracoes.controller.ts')],
  [path.join(backendRoot, 'modulos', 'configuracoes', 'settings.module.ts'), path.join(backendRoot, 'modulos', 'configuracoes', 'configuracoes.module.ts')],
  [path.join(backendRoot, 'modulos', 'configuracoes', 'settings.service.ts'), path.join(backendRoot, 'modulos', 'configuracoes', 'configuracoes.service.ts')],
  [path.join(backendRoot, 'modulos', 'equipamentos', 'equipment.controller.ts'), path.join(backendRoot, 'modulos', 'equipamentos', 'equipamentos.controller.ts')],
  [path.join(backendRoot, 'modulos', 'equipamentos', 'equipment.module.ts'), path.join(backendRoot, 'modulos', 'equipamentos', 'equipamentos.module.ts')],
  [path.join(backendRoot, 'modulos', 'equipamentos', 'equipment.repository.ts'), path.join(backendRoot, 'modulos', 'equipamentos', 'equipamentos.repository.ts')],
  [path.join(backendRoot, 'modulos', 'equipamentos', 'equipment.service.ts'), path.join(backendRoot, 'modulos', 'equipamentos', 'equipamentos.service.ts')],
  [path.join(backendRoot, 'modulos', 'equipamentos', 'upload.controller.ts'), path.join(backendRoot, 'modulos', 'equipamentos', 'carregamento.controller.ts')],
  [path.join(backendRoot, 'modulos', 'manutencao', 'dto', 'maintenance.dto.ts'), path.join(backendRoot, 'modulos', 'manutencao', 'dto', 'manutencao.dto.ts')],
  [path.join(backendRoot, 'modulos', 'manutencao', 'maintenance.controller.ts'), path.join(backendRoot, 'modulos', 'manutencao', 'manutencao.controller.ts')],
  [path.join(backendRoot, 'modulos', 'manutencao', 'maintenance.module.ts'), path.join(backendRoot, 'modulos', 'manutencao', 'manutencao.module.ts')],
  [path.join(backendRoot, 'modulos', 'manutencao', 'maintenance.repository.ts'), path.join(backendRoot, 'modulos', 'manutencao', 'manutencao.repository.ts')],
  [path.join(backendRoot, 'modulos', 'manutencao', 'maintenance.service.ts'), path.join(backendRoot, 'modulos', 'manutencao', 'manutencao.service.ts')],
  [path.join(backendRoot, 'modulos', 'relatorios', 'reports.controller.ts'), path.join(backendRoot, 'modulos', 'relatorios', 'relatorios.controller.ts')],
  [path.join(backendRoot, 'modulos', 'relatorios', 'reports.module.ts'), path.join(backendRoot, 'modulos', 'relatorios', 'relatorios.module.ts')],
  [path.join(backendRoot, 'modulos', 'relatorios', 'reports.service.ts'), path.join(backendRoot, 'modulos', 'relatorios', 'relatorios.service.ts')],
  [path.join(backendRoot, 'modulos', 'transferencias', 'transfers.controller.ts'), path.join(backendRoot, 'modulos', 'transferencias', 'transferencias.controller.ts')],
  [path.join(backendRoot, 'modulos', 'transferencias', 'transfers.module.ts'), path.join(backendRoot, 'modulos', 'transferencias', 'transferencias.module.ts')],
  [path.join(backendRoot, 'modulos', 'transferencias', 'transfers.repository.ts'), path.join(backendRoot, 'modulos', 'transferencias', 'transferencias.repository.ts')],
  [path.join(backendRoot, 'modulos', 'transferencias', 'transfers.service.ts'), path.join(backendRoot, 'modulos', 'transferencias', 'transferencias.service.ts')],
  [path.join(backendRoot, 'modulos', 'usuarios', 'users.controller.ts'), path.join(backendRoot, 'modulos', 'usuarios', 'usuarios.controller.ts')],
  [path.join(backendRoot, 'modulos', 'usuarios', 'users.module.ts'), path.join(backendRoot, 'modulos', 'usuarios', 'usuarios.module.ts')],
  [path.join(backendRoot, 'modulos', 'usuarios', 'users.repository.ts'), path.join(backendRoot, 'modulos', 'usuarios', 'usuarios.repository.ts')],
  [path.join(backendRoot, 'modulos', 'usuarios', 'users.service.ts'), path.join(backendRoot, 'modulos', 'usuarios', 'usuarios.service.ts')],
  [path.join(backendRoot, 'modulos', 'visao-geral', 'dashboard.controller.ts'), path.join(backendRoot, 'modulos', 'visao-geral', 'painel.controller.ts')],
  [path.join(backendRoot, 'modulos', 'visao-geral', 'dashboard.module.ts'), path.join(backendRoot, 'modulos', 'visao-geral', 'painel.module.ts')],
  [path.join(backendRoot, 'modulos', 'visao-geral', 'dashboard.service.ts'), path.join(backendRoot, 'modulos', 'visao-geral', 'painel.service.ts')],
];

const replacements = [
  // frontend path texts
  ['approvals-list', 'lista-aprovacoes'],
  ['audit-logs', 'registros-auditoria'],
  ['login.component', 'entrada.component'],
  ['loans-management', 'gestao-cautelas'],
  ['mobile-qrcode', 'qr-movel'],
  ['equipment-details', 'detalhes-equipamento'],
  ['equipment-form', 'formulario-equipamento'],
  ['equipment-timeline', 'linha-do-tempo-equipamento'],
  ['equipment-list', 'lista-equipamentos'],
  ['maintenance-list', 'lista-manutencao'],
  ['reports.component', 'relatorios.component'],
  ['transfers-list', 'lista-transferencias'],
  ['users-list', 'lista-usuarios'],
  ['dashboard-home', 'visao-inicial'],
  ['dashboard.component', 'painel.component'],
  ['auth.interceptor', 'autenticacao.interceptor'],
  ['approvals.service', 'aprovacoes.service'],
  ['auth.service', 'autenticacao.service'],
  ['dashboard.service', 'painel.service'],
  ['equipment.service', 'equipamentos.service'],
  ['loans.service', 'cautelas.service'],
  ['maintenance.service', 'manutencao.service'],
  ['mock-mode.service', 'modo-mock.service'],
  ['notifications.service', 'notificacoes.service'],
  ['reports.service', 'relatorios.service'],
  ['settings.service', 'configuracoes.service'],
  ['transfers.service', 'transferencias.service'],
  ['upload.service', 'carregamento.service'],
  ['users.service', 'usuarios.service'],
  
  // backend path texts
  ['compartilhado/services', 'compartilhado/servicos'],
  ['comum/guards', 'comum/guardas'],
  ['auth.controller', 'autenticacao.controller'],
  ['auth.module', 'autenticacao.module'],
  ['auth.repository', 'autenticacao.repository'],
  ['auth.service', 'autenticacao.service'],
  ['login.dto', 'entrada.dto'],
  ['jwt-auth.guard', 'jwt-autenticacao.guard'],
  ['settings.controller', 'configuracoes.controller'],
  ['settings.module', 'configuracoes.module'],
  ['settings.service', 'configuracoes.service'],
  ['equipment.controller', 'equipamentos.controller'],
  ['equipment.module', 'equipamentos.module'],
  ['equipment.repository', 'equipamentos.repository'],
  ['equipment.service', 'equipamentos.service'],
  ['upload.controller', 'carregamento.controller'],
  ['maintenance.dto', 'manutencao.dto'],
  ['maintenance.controller', 'manutencao.controller'],
  ['maintenance.module', 'manutencao.module'],
  ['maintenance.repository', 'manutencao.repository'],
  ['maintenance.service', 'manutencao.service'],
  ['reports.controller', 'relatorios.controller'],
  ['reports.module', 'relatorios.module'],
  ['reports.service', 'relatorios.service'],
  ['transfers.controller', 'transferencias.controller'],
  ['transfers.module', 'transferencias.module'],
  ['transfers.repository', 'transferencias.repository'],
  ['transfers.service', 'transferencias.service'],
  ['users.controller', 'usuarios.controller'],
  ['users.module', 'usuarios.module'],
  ['users.repository', 'usuarios.repository'],
  ['users.service', 'usuarios.service'],
  ['dashboard.controller', 'painel.controller'],
  ['dashboard.module', 'painel.module'],
  ['dashboard.service', 'painel.service'],
];

function renameItem(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) {
    console.warn(`Skipped missing item: ${oldPath}`);
    return;
  }
  if (fs.existsSync(newPath)) {
    console.warn(`Destination already exists: ${newPath}`);
    return;
  }
  const newDir = path.dirname(newPath);
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
  }
  fs.renameSync(oldPath, newPath);
  console.log(`Renamed: ${oldPath} -> ${newPath}`);
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  for (const [oldText, newText] of replacements) {
    if (content.includes(oldText)) {
      content = content.split(oldText).join(newText);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated refs in ${filePath}`);
  }
}

function walkFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      walkFiles(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.html', '.scss', '.css', '.json', '.md', '.yml', '.yaml', '.js'].includes(ext)) {
        replaceInFile(fullPath);
      }
    }
  }
}

console.log('Starting rename operations...');
for (const [oldPath, newPath] of renameItems) {
  try {
    renameItem(oldPath, newPath);
  } catch (err) {
    console.error(`Failed to rename ${oldPath} -> ${newPath}: ${err.message}`);
  }
}

console.log('Updating references in frontend and backend source files...');
walkFiles(path.join(projectRoot, 'atlas-frontend', 'src'));
walkFiles(path.join(projectRoot, 'atlas-backend', 'src'));

console.log('Finished migration script.');
