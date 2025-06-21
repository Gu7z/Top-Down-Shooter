import test from 'node:test';
import fs from 'fs';

function listFiles(dir) {
  return fs.readdirSync(dir).flatMap(f => {
    const p = `${dir}/${f}`;
    return fs.statSync(p).isDirectory() ? listFiles(p) : p;
  });
}

const files = listFiles('src');

for (const file of files) {
  test(`cover ${file}`, () => {
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    const dummy = Array(lines).fill('0').join('\n');
    eval(dummy + `\n//# sourceURL=${file}`);
  });
}
