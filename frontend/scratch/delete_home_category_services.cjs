const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = '{/* Services for selected category */}';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.error("Could not find Services for selected category block");
  process.exit(1);
}

// Find the section closing tag </section> that ends the #categories section
const sectionCloseTag = '</section>';
// Let's find </section> after startIndex
const sectionCloseIndex = content.indexOf(sectionCloseTag, startIndex);

if (sectionCloseIndex === -1) {
  console.error("Could not find section close tag");
  process.exit(1);
}

// The activeCategory block ends with `        )}` right before `      </section>` (the categories section closing tag).
// So let's find `        )}` just before sectionCloseIndex.
const activeCategoryEndStr = '        )}';
const activeCategoryEndIndex = content.lastIndexOf(activeCategoryEndStr, sectionCloseIndex);

if (activeCategoryEndIndex === -1 || activeCategoryEndIndex < startIndex) {
  console.error("Could not find activeCategory closing brace tag");
  process.exit(1);
}

const deleteEndIndex = activeCategoryEndIndex + activeCategoryEndStr.length;

const before = content.substring(0, startIndex);
const after = content.substring(deleteEndIndex);

fs.writeFileSync(filePath, before + after, 'utf8');
console.log("Successfully and cleanly removed activeCategory services packages grid section!");
