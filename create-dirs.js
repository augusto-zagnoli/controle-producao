const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\Augusto Zagnoli\\Desktop\\Projects\\controle-producao\\src\\app\\auth',
  'c:\\Users\\Augusto Zagnoli\\Desktop\\Projects\\controle-producao\\src\\app\\login'
];

dirs.forEach(dir => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } catch (err) {
    console.error(`✗ Error creating ${dir}:`, err.message);
  }
});

console.log('\nDirectories created successfully!');
