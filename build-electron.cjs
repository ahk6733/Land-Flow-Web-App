const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        if (fs.lstatSync(fromPath).isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else {
            copyFolderSync(fromPath, toPath);
        }
    });
}

const outDir = path.join(__dirname, 'dist_electron', 'Land Ledger');
const appDir = path.join(outDir, 'resources', 'app');

console.log('Cleaning output directory...');
if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}

console.log('Copying Electron binaries...');
const electronDist = path.join(__dirname, 'node_modules', 'electron', 'dist');
copyFolderSync(electronDist, outDir);

console.log('Renaming executable...');
if (fs.existsSync(path.join(outDir, 'electron.exe'))) {
    fs.renameSync(path.join(outDir, 'electron.exe'), path.join(outDir, 'Land Ledger.exe'));
}

console.log('Copying app files...');
fs.mkdirSync(appDir, { recursive: true });
copyFolderSync(path.join(__dirname, 'dist'), path.join(appDir, 'dist'));
fs.copyFileSync(path.join(__dirname, 'electron-main.cjs'), path.join(appDir, 'electron-main.cjs'));
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(appDir, 'package.json'));

console.log('Packaging complete! The app is in dist_electron/Land Ledger');
