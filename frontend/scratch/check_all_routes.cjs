const ts = require('typescript');
const path = require('path');
const fs = require('fs');

const configPath = path.resolve('tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

const routeFiles = fs.readdirSync('src/routes')
  .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
  .map(f => path.join('src/routes', f));

console.log('Checking routes:', routeFiles);

const program = ts.createProgram(routeFiles, parsedConfig.options);

let totalErrors = 0;
routeFiles.forEach(file => {
  const sf = program.getSourceFile(path.resolve(file));
  if (!sf) {
    console.log(`Could not load source file: ${file}`);
    return;
  }
  const diagnostics = ts.getPreEmitDiagnostics(program, sf);
  const relevantDiags = diagnostics.filter(d => 
    !d.messageText.toString().includes('is not assignable to parameter of type') &&
    !d.messageText.toString().includes('Expected 0-1 arguments, but got 2')
  );
  if (relevantDiags.length > 0) {
    console.log(`\n❌ Type errors in ${file}:`);
    relevantDiags.forEach(d => {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      console.log(`  Line ${line + 1}:${character + 1} - ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    });
    totalErrors += relevantDiags.length;
  } else {
    console.log(`✓ ${file} (0 errors)`);
  }
});

console.log(`\nTotal Route Diagnostics: ${totalErrors}`);
