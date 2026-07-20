const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the inline Choose your category heading
const categoryHeadingBlock = `        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-navy">
            <CheckCircle2 className="h-2.5 w-2.5 text-gold" /> Your Space, Our Expertise
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-navy md:text-3xl">
            Choose your category
          </h2>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            Pick a category to see all services available under it.
          </p>
        </div>`;

const newCategoryHeadingBlock = `        <div className="w-full text-left font-sans">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#cb9f5a] font-black block mb-1">
            Your Space, Our Expertise
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#002a22] via-[#00382d] to-[#cb9f5a] w-fit">
            Choose your category
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
            Pick a category to see all services available under it.
          </p>
        </div>`;

const categoryIndex = content.indexOf(categoryHeadingBlock);
if (categoryIndex === -1) {
  // Let's try with windows line endings in block
  const categoryHeadingBlockWindows = categoryHeadingBlock.replace(/\n/g, '\r\n');
  const categoryIndexWindows = content.indexOf(categoryHeadingBlockWindows);
  if (categoryIndexWindows !== -1) {
    content = content.substring(0, categoryIndexWindows) + newCategoryHeadingBlock + content.substring(categoryIndexWindows + categoryHeadingBlockWindows.length);
  } else {
    console.error("Could not find inline category heading block");
  }
} else {
  content = content.substring(0, categoryIndex) + newCategoryHeadingBlock + content.substring(categoryIndex + categoryHeadingBlock.length);
}

// 2. Replace the SectionHeader component definition
const sectionHeaderDefinition = `function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#cb9f5a] font-extrabold">
        {eyebrow}
      </span>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}`;

const newSectionHeaderDefinition = `function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="w-full text-left font-sans mb-8">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#cb9f5a] font-black block mb-1">
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#002a22] via-[#00382d] to-[#cb9f5a] w-fit">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}`;

const sectionIndex = content.indexOf(sectionHeaderDefinition);
if (sectionIndex === -1) {
  const sectionHeaderDefinitionWindows = sectionHeaderDefinition.replace(/\n/g, '\r\n');
  const sectionIndexWindows = content.indexOf(sectionHeaderDefinitionWindows);
  if (sectionIndexWindows !== -1) {
    content = content.substring(0, sectionIndexWindows) + newSectionHeaderDefinition + content.substring(sectionIndexWindows + sectionHeaderDefinitionWindows.length);
  } else {
    console.error("Could not find SectionHeader definition block");
  }
} else {
  content = content.substring(0, sectionIndex) + newSectionHeaderDefinition + content.substring(sectionIndex + sectionHeaderDefinition.length);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully transformed headings on home page to left-aligned premium linear gradient!");
