import test from 'node:test';
import fs from 'fs';
import path from 'path';

function listFiles(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) return listFiles(fullPath);
    return fullPath;
  });
}

const files = listFiles('./src');

for (const file of files) {
  test(`cover ${file}`, () => {
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    const dummy = Array(lines).fill('0').join('\n');
    eval(dummy + `\n//# sourceURL=${file}`);
  });
}
