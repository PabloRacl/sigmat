const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir('src/app/funcionalidades', function(filePath) {
  if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // We want to replace lines containing: this.messageService.add({ severity: 'error'... })
    // But ONLY if it's inside an error: () => block or catch block.
    // Actually, any this.messageService.add({ severity: 'error'... }) that isn't validation
    // Let's just comment it out to be safe, or remove it.
    
    // Pattern to find error toasts:
    // error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir equipamento.' })
    // Replace with: error: (err) => console.error(err)
    
    let modified = content.replace(/error:\s*\([^)]*\)\s*=>\s*this\.messageService\.add\(\{\s*severity:\s*'error'[^}]+\}\)/g, 'error: (err) => console.error(err)');
    
    // Multi-line versions:
    // error: (err) => {
    //   this.messageService.add({ severity: 'error', ... });
    // }
    modified = modified.replace(/this\.messageService\.add\(\{\s*severity:\s*'error'(?!.*'Erro de validação')[^}]+\}\);?/g, '// toast removido pois o interceptor global já exibe a mensagem de erro');
    
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      count++;
      console.log(`Modified: ${filePath}`);
    }
  }
});

console.log(`Total files modified: ${count}`);
