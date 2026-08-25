/**
 * 웹 자산을 www/ 로 모읍니다. Capacitor 가 www/ 를 앱 안에 그대로 넣습니다.
 * 저장소 루트는 Vercel 정적 배포도 겸하므로, 앱용 사본만 따로 만듭니다.
 */
import { cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

var root = join(dirname(fileURLToPath(import.meta.url)), '..');
var out = join(root, 'www');

var ASSETS = [
  'index.html',
  'week.html',
  'month.html',
  'app.js',
  'app.css',
  'fonts.css',
  'fonts'
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (var name of ASSETS) {
  await cp(join(root, name), join(out, name), { recursive: true });
}

console.log('www/ <- ' + ASSETS.length + ' entries');
