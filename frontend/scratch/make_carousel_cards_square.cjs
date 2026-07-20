const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace rounded-3xl with rounded-none for CategoryCarousel cards
content = content.replace(
  'className="relative min-w-[260px] sm:min-w-[280px] md:min-w-[300px] flex flex-col rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start select-none bg-white border border-[#cb9f5a]/15 group/card cursor-pointer"',
  'className="relative min-w-[260px] sm:min-w-[280px] md:min-w-[300px] flex flex-col rounded-none overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start select-none bg-white border border-[#cb9f5a]/15 group/card cursor-pointer"'
);

// Replace rounded-full with rounded-none for the Rating Badge Overlay inside CategoryCarousel cards
content = content.replace(
  'bg-[#002a22]/90 backdrop-blur-md border border-[#cb9f5a]/40 px-2.5 py-1 rounded-full text-[10px] font-black text-[#cb9f5a] flex items-center gap-1 shadow-sm',
  'bg-[#002a22]/90 backdrop-blur-md border border-[#cb9f5a]/40 px-2.5 py-1 rounded-none text-[10px] font-black text-[#cb9f5a] flex items-center gap-1 shadow-sm'
);

// Replace rounded-xl with rounded-none for View details and Add buttons in CategoryCarousel cards
content = content.replace(
  'text-[10px] font-bold rounded-xl text-[#002a22] bg-white transition-all shadow-3xs cursor-pointer',
  'text-[10px] font-bold rounded-none text-[#002a22] bg-white transition-all shadow-3xs cursor-pointer'
);

content = content.replace(
  'rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] text-[10px] font-bold uppercase transition-all shadow-md cursor-pointer',
  'rounded-none bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] text-[10px] font-bold uppercase transition-all shadow-md cursor-pointer'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully transformed CategoryCarousel product cards to square type!");
