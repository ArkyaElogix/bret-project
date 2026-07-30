const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\bbg-white\b(?! dark:bg-)/g, replace: 'bg-white dark:bg-gray-800' },
  { search: /\btext-gray-900\b(?! dark:text-)/g, replace: 'text-gray-900 dark:text-gray-100' },
  { search: /\btext-gray-800\b(?! dark:text-)/g, replace: 'text-gray-800 dark:text-gray-100' },
  { search: /\btext-gray-700\b(?! dark:text-)/g, replace: 'text-gray-700 dark:text-gray-200' },
  { search: /\btext-gray-600\b(?! dark:text-)/g, replace: 'text-gray-600 dark:text-gray-300' },
  { search: /\bbg-gray-50\b(?! dark:bg-)/g, replace: 'bg-gray-50 dark:bg-gray-900/50' },
  { search: /\bbg-gray-100\b(?! dark:bg-)/g, replace: 'bg-gray-100 dark:bg-gray-900' },
  { search: /\bborder-gray-200\b(?! dark:border-)/g, replace: 'border-gray-200 dark:border-gray-700' },
  { search: /\bborder-gray-300\b(?! dark:border-)/g, replace: 'border-gray-300 dark:border-gray-600' },
  { search: /\bhover:bg-gray-50\b(?! dark:hover:bg-)/g, replace: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
  { search: /\bhover:bg-gray-100\b(?! dark:hover:bg-)/g, replace: 'hover:bg-gray-100 dark:hover:bg-gray-700' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.search, rule.replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

const targetDir = 'c:\\Users\\Sovan Ghosh\\Desktop\\Arkyaprabha\\Projects\\bret-project\\frontend\\src';
processDirectory(targetDir);
console.log("Done.");
