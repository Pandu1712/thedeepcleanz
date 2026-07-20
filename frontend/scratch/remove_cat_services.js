const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We want to find the exact block:
// {/* Services for selected category */}
// up to:
// )}
// inside the section element.
const targetStart = '{/* Services for selected category */}';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.error("Could not find start index");
  process.exit(1);
}

// Find the corresponding closing tag for activeCategory block
// activeCategory starts at startIndex + targetStart.length
// Let's find the closing ")}" of "{activeCategory && ("
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

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

fs.writeFileSync(filePath, before + after, 'utf8');
console.log("Successfully removed selected category services section from index.tsx!");
