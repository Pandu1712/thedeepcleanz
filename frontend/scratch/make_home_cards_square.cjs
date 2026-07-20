const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Hero Showcase Card
content = content.replace(
  'rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]',
  'rounded-none overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]'
);

content = content.replace(
  'border-[#cb9f5a]/30 rounded-2xl py-2 px-3.5',
  'border-[#cb9f5a]/30 rounded-none py-2 px-3.5'
);

content = content.replace(
  'bg-[#cb9f5a] text-[#002a22] font-black text-xs shadow-sm',
  'bg-[#cb9f5a] text-[#002a22] font-black text-xs shadow-sm rounded-none'
);

content = content.replace(
  'border-white/20 rounded-2xl py-2 px-3.5',
  'border-white/20 rounded-none py-2 px-3.5'
);

content = content.replace(
  'rounded-xl bg-emerald-500 text-white',
  'rounded-none bg-emerald-500 text-white'
);

content = content.replace(
  'border-[#cb9f5a]/30 rounded-2xl p-3.5 text-white',
  'border-[#cb9f5a]/30 rounded-none p-3.5 text-white'
);

// 2. Category Cards
content = content.replace(
  'rounded-[28px] text-left transition-all duration-500 border flex flex-col p-5',
  'rounded-none text-left transition-all duration-500 border flex flex-col p-5'
);

content = content.replace(
  'relative w-full h-44 overflow-hidden rounded-[22px] bg-slate-100',
  'relative w-full h-44 overflow-hidden rounded-none bg-slate-100'
);

content = content.replace(
  'place-items-center rounded-2xl bg-white text-[#002a22]',
  'place-items-center rounded-none bg-white text-[#002a22]'
);

// 3. How It Works steps
// Match: className="relative rounded-2xl bg-white border border-[#cb9f5a]/10 p-5 text-center
content = content.replace(
  'className="relative rounded-2xl bg-white border border-[#cb9f5a]/10 p-5 text-center',
  'className="relative rounded-none bg-white border border-[#cb9f5a]/10 p-5 text-center'
);

content = content.replace(
  'place-items-center rounded-xl bg-gradient-to-br from-[#002a22]',
  'place-items-center rounded-none bg-gradient-to-br from-[#002a22]'
);

// 4. Recent completed transformations
// Match: className="group relative overflow-hidden rounded-2xl shadow-sm aspect-[4/3] w-full
content = content.replace(
  'className="group relative overflow-hidden rounded-2xl shadow-sm aspect-[4/3] w-full',
  'className="group relative overflow-hidden rounded-none shadow-sm aspect-[4/3] w-full'
);

// 5. Customer Reviews cards
// Match: className="hover-lift rounded-2xl bg-white p-5 border border-[#cb9f5a]/10 flex flex-col
content = content.replace(
  'className="hover-lift rounded-2xl bg-white p-5 border border-[#cb9f5a]/10 flex flex-col',
  'className="hover-lift rounded-none bg-white p-5 border border-[#cb9f5a]/10 flex flex-col'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully transformed homepage cards to square type!");
