const electronInstaller = require('electron-winstaller');

async function createInstaller() {
  try {
    console.log('Creating windows installer...');
    await electronInstaller.createWindowsInstaller({
      appDirectory: 'c:/Users/AHK/Desktop/land-buy-sell-ms/dist_electron/LandLedgerApp',
      outputDirectory: 'c:/Users/AHK/Desktop/land-buy-sell-ms/dist_electron/installer',
      authors: 'Arif Hossain',
      description: 'Land Buy-Sell Management System',
      exe: 'LandLedger.exe',
      setupExe: 'LandLedgerSetup.exe',
      noMsi: true
    });
    console.log('Installer creation successfully completed!');
  } catch (e) {
    console.error(`Installer creation failed: ${e.message}`);
  }
}

createInstaller();
