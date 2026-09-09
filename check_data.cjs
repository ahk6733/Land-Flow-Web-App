const fs = require('fs');

const content = fs.readFileSync('src/data/defaultData.ts', 'utf8');

// evaluate the file to get INITIAL_TRANSACTIONS
try {
    const tsCode = content.replace(/export const /g, 'const ').replace(/export interface .*{[^}]*}/gs, '');
    // Need to strip types to eval
} catch(e) {}
