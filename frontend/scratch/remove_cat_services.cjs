const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the comment first
const commentText = '{/* Services for selected category */}';
const commentIndex = content.indexOf(commentText);

if (commentIndex === -1) {
  console.error("Could not find comment");
  process.exit(1);
}

// Find the activeCategory start brace after the comment
const targetStart = '{activeCategory && (';
const startIndex = content.indexOf(targetStart, commentIndex);

if (startIndex === -1) {
  console.error("Could not find activeCategory start index");
  process.exit(1);
}

// Find the corresponding closing tag for activeCategory block
const searchScope = content.substring(startIndex);
let openBrackets = 0;
let endIndex = -1;

for (let i = 0; i < searchScope.length; i++) {
  if (searchScope[i] === '{') {
    openBrackets++;
  } else if (searchScope[i] === '}') {
    openBrackets--;
    if (openBrackets === 0) {
      endIndex = startIndex + i + 1;
      break;
    }
  }
}

if (endIndex === -1) {
  console.error("Could not find matching end curly brace for activeCategory");
  process.exit(1);
}

// We want to delete from the commentIndex to the endIndex!
const before = content.substring(0, commentIndex);
const after = content.substring(endIndex);

fs.writeFileSync(filePath, before + after, 'utf8');
console.log("Successfully removed activeCategory block from index.tsx!");
