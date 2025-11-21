// Re-process the 2 failed PDF files
const { exec } = require('child_process');
const path = require('path');

const failedFiles = [
  '2024_SUMMARY_OF_BASIC_AGREEMENT_NEGOTIATIONS_6.28.24_FINAL.pdf',
  'DGA-BasicAgreement2020-2023.pdf'
];

console.log('🔄 Re-processing 2 failed PDF files...\n');

// Import the main extraction script
const extractScript = path.join(__dirname, 'extract-agreements.js');

// Temporarily modify the script to only process these 2 files
const fs = require('fs');
const originalScript = fs.readFileSync(extractScript, 'utf8');

// Replace the file filter to only include our failed files
const modifiedScript = originalScript.replace(
  "const files = fs.readdirSync(AGREEMENTS_DIR)\n    .filter(f => f.endsWith('.pdf'))\n    .filter(f => !f.startsWith('.'));",
  `const files = ${JSON.stringify(failedFiles)};`
);

// Write temporary script
const tempScript = path.join(__dirname, 'temp-retry.js');
fs.writeFileSync(tempScript, modifiedScript);

// Run it
exec(`node ${tempScript}`, (error, stdout, stderr) => {
  console.log(stdout);
  if (stderr) console.error(stderr);

  // Clean up
  fs.unlinkSync(tempScript);

  if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n✅ Retry complete!');
});
