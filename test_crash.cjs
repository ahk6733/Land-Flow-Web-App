
require('esbuild').buildSync({
  entryPoints: ['src/data/defaultData.ts', 'src/utils/landAnalyzer.ts'],
  bundle: true,
  outdir: 'dist_test',
  format: 'cjs',
  platform: 'node',
});
const { INITIAL_TRANSACTIONS } = require('./dist_test/defaultData.js');
const { analyzeLandData } = require('./dist_test/landAnalyzer.js');

try {
  console.log("Transactions count:", INITIAL_TRANSACTIONS.length);
  const result = analyzeLandData(INITIAL_TRANSACTIONS);
  console.log("analyzeLandData succeeded. Total purchases:", result.totalPurchased);
} catch (e) {
  console.error("Crash during analyzeLandData:", e);
}
