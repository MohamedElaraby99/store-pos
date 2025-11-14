const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  Building Portable FikraPOS Package');
console.log('========================================\n');

console.log('Step 1: Installing dependencies...');
exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies: ${error.message}`);
    return;
  }
  
  console.log('✓ Dependencies installed\n');
  console.log('Step 2: Building Windows executable...');
  console.log('This may take 5-10 minutes...\n');
  
  // Run electron-packager to create portable version
  const buildCmd = 'npm run package-win';
  
  exec(buildCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error building: ${error.message}`);
      console.log('\nTrying alternative build method...');
      
      // Try electron-builder as fallback
      exec('npm run build-win', (error2, stdout2, stderr2) => {
        if (error2) {
          console.error(`Build failed: ${error2.message}`);
          console.log('\n❌ Build failed. Please check the errors above.');
          return;
        }
        console.log(stdout2);
        console.log('\n✓ Build completed!');
        console.log('\n========================================');
        console.log('  BUILD SUCCESSFUL!');
        console.log('========================================');
        console.log('\nYour installer is located at:');
        console.log('  dist\\Fikra POS Setup 0.1.0.exe');
        console.log('\nYou can copy this file to another computer and install it there.');
        console.log('\n========================================\n');
      });
      return;
    }
    
    console.log(stdout);
    console.log('\n✓ Build completed!');
    console.log('\n========================================');
    console.log('  BUILD SUCCESSFUL!');
    console.log('========================================');
    console.log('\nYour portable app is located at:');
    console.log('  release-builds\\FikraPOS-win32-x64\\');
    console.log('\nTo create a ZIP file for easy transfer:');
    console.log('  1. Navigate to release-builds folder');
    console.log('  2. Right-click on "FikraPOS-win32-x64" folder');
    console.log('  3. Select "Send to > Compressed (zipped) folder"');
    console.log('\nThen you can copy the ZIP to another computer!');
    console.log('\n========================================\n');
  });
});

