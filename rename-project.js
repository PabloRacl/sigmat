const fs = require('fs');
const path = require('path');

const OLD_NAME_LOWER = 'sigmat';
const NEW_NAME_LOWER = 'atlas';
const OLD_NAME_CAP = 'Sigmat';
const NEW_NAME_CAP = 'Atlas';
const OLD_NAME_UPPER = 'SIGMAT';
const NEW_NAME_UPPER = 'ATLAS';

const IGNORE_DIRS = ['.git', 'node_modules', 'dist', 'build', '.vscode', '.gemini', 'atlas'];
const IGNORE_FILES = ['rename-project.js', 'package-lock.json'];

function replaceContent(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(new RegExp(OLD_NAME_LOWER, 'g'), NEW_NAME_LOWER);
    content = content.replace(new RegExp(OLD_NAME_CAP, 'g'), NEW_NAME_CAP);
    content = content.replace(new RegExp(OLD_NAME_UPPER, 'g'), NEW_NAME_UPPER);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Modificado] Conteúdo: ${filePath}`);
    }
}

function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(item)) continue;
            processDirectory(fullPath);
        } else {
            if (IGNORE_FILES.includes(item)) continue;
            
            // Apenas processa arquivos de texto (heurística simples por extensão)
            const ext = path.extname(item).toLowerCase();
            const textExtensions = ['.ts', '.js', '.html', '.scss', '.css', '.json', '.md', '.env', '.yml', '.yaml', '.txt', '.ps1'];
            if (textExtensions.includes(ext) || item === '.env' || item === 'import.env') {
                try {
                    replaceContent(fullPath);
                } catch (err) {
                    console.error(`Erro ao ler ${fullPath}:`, err.message);
                }
            }
        }
    }
}

function renameItems(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        let stat;
        try {
             stat = fs.statSync(fullPath);
        } catch(e) {
            continue;
        }

        if (stat.isDirectory() && !IGNORE_DIRS.includes(item)) {
            renameItems(fullPath);
        }

        // Renomeia o próprio item se contiver "sigmat"
        if (item.toLowerCase().includes(OLD_NAME_LOWER)) {
            let newItem = item.replace(new RegExp(OLD_NAME_LOWER, 'g'), NEW_NAME_LOWER);
            newItem = newItem.replace(new RegExp(OLD_NAME_CAP, 'g'), NEW_NAME_CAP);
            newItem = newItem.replace(new RegExp(OLD_NAME_UPPER, 'g'), NEW_NAME_UPPER);

            const newPath = path.join(dirPath, newItem);
            fs.renameSync(fullPath, newPath);
            console.log(`[Renomeado] ${fullPath} -> ${newPath}`);
        }
    }
}

console.log('Iniciando substituição de conteúdo...');
processDirectory(__dirname);

console.log('Iniciando renomeação de arquivos e pastas...');
renameItems(__dirname);

console.log('Concluído!');
