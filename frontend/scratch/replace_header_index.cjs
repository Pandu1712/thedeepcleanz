const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = '{/* FIXED TOPBAR */}';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.error("Could not find FIXED TOPBAR start comment");
  process.exit(1);
}

// The block ends with "</header>\n      </div>" or "</header>\r\n      </div>"
// Let's search for "</header>" after startIndex
const headerCloseTag = '</header>';
const headerCloseIndex = content.indexOf(headerCloseTag, startIndex);

if (headerCloseIndex === -1) {
  console.error("Could not find header close tag");
  process.exit(1);
}

// Find the closing div of the fixed topbar container right after the header close tag
const wrapperCloseIndex = content.indexOf('</div>', headerCloseIndex + headerCloseTag.length);

if (wrapperCloseIndex === -1) {
  console.error("Could not find wrapper closing div after header");
  process.exit(1);
}

const endIndex = wrapperCloseIndex + '</div>'.length;

const newHeaderCall = `
      <Header
        cartCount={cartCount}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        onOpenReferral={() => setReferralModalOpen(true)}
        activeHash={activeHash}
        isSubPage={false}
      />
`;

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

fs.writeFileSync(filePath, before + newHeaderCall + after, 'utf8');
console.log("Successfully replaced inline header with <Header /> component call in index.tsx!");
