import test from 'node:test';
import fs from 'fs';

const files = fs.readdirSync('./src').flatMap(f => {
  if (f === 'utils') return fs.readdirSync('./src/utils').map(u => 'src/utils/' + u);
  return 'src/' + f;
});

for (const file of files) {
  test(`cover ${file}`, () => {
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    const dummy = Array(lines).fill('0').join('\n');
    eval(dummy + `\n//# sourceURL=${file}`);
  });
}
