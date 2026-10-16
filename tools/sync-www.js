#!/usr/bin/env node
// 스크랩 아레나 — 웹 빌드 동기화 스크립트
// 사용법:
//   node tools/sync-www.js                 → www/ 를 desktop/www 로 복사만
//   node tools/sync-www.js 새게임.html     → 새 HTML의 CDN 스크립트를 로컬 lib로 바꿔 www/index.html 갱신 후 복사
// 안드로이드는 Gradle 빌드 때 www/ 를 자동으로 assets/www 로 복사합니다.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const LOCAL = {
  'three.min.js': 'lib/three.min.js',
  'GLTFLoader.js': 'lib/GLTFLoader.js',
};

function localize(html) {
  // <script src="https://.../three.min.js"> → <script src="lib/three.min.js">
  let n = 0;
  html = html.replace(/<script\s+src="https?:\/\/[^"]*\/(three\.min\.js|GLTFLoader\.js)"/g, (m, f) => {
    n++;
    return `<script src="${LOCAL[f]}"`;
  });
  if (n !== 2) console.warn(`경고: CDN 스크립트를 ${n}개만 바꿨어요 (예상 2개). HTML의 <script src> 를 확인하세요.`);
  const left = html.match(/https?:\/\/[^\s"'<>)]+/g);
  if (left) console.warn('경고: 아직 외부 주소가 남아 있어요 (오프라인에서 실패할 수 있음):', [...new Set(left)].slice(0, 5));
  // PWA (아이폰/안드로이드 '홈 화면에 추가'용): 매니페스트, 아이콘, 오프라인 캐시 등록
  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="스크랩 아레나">
<meta name="theme-color" content="#0b0f14">
<script>if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js'))</script>
</head>`);
  }
  return html;
}

const src = process.argv[2];
if (src) {
  const html = fs.readFileSync(path.resolve(src), 'utf8');
  fs.writeFileSync(path.join(WWW, 'index.html'), localize(html));
  console.log('www/index.html 갱신 완료');
  // 오프라인 캐시 버전 올리기 → 폰에 설치된 홈 화면 앱도 새 버전으로 갱신됨
  const swp = path.join(WWW, 'sw.js');
  if (fs.existsSync(swp)) fs.writeFileSync(swp, fs.readFileSync(swp, 'utf8').replace(/const VERSION = 'sa-[^']*'/, `const VERSION = 'sa-${Date.now()}'`));
}

for (const f of Object.values(LOCAL)) {
  if (!fs.existsSync(path.join(WWW, f))) {
    console.error(`www/${f} 가 없어요. three.js r128 의 같은 파일을 넣어 주세요.`);
    process.exit(1);
  }
}

const dst = path.join(ROOT, 'desktop', 'www');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(WWW, dst, { recursive: true });
console.log('desktop/www 복사 완료');
