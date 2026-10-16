// 스크랩 아레나 — Windows 데스크톱 실행기 (Electron)
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// 첫 터치 없이도 소리가 나도록, GPU 블랙리스트 무시(구형 내장 그래픽에서도 WebGL 사용)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

if (!app.requestSingleInstanceLock()) app.quit();

// 업데이트: exe 옆에 scrap-arena.html 이 있으면 그걸 우선 실행 (다시 빌드할 필요 없음)
// 웹용 HTML의 CDN 주소(three.js)는 앱에 들어 있는 로컬 파일로 자동 교체
const fs = require('fs');
function gamePage() {
  const bundled = path.join(__dirname, 'www', 'index.html');
  try {
    const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    const ext = path.join(exeDir, 'scrap-arena.html');
    if (!fs.existsSync(ext)) return bundled;
    const dir = path.join(app.getPath('userData'), 'game');
    fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
    for (const n of ['three.min.js', 'GLTFLoader.js'])
      fs.writeFileSync(path.join(dir, 'lib', n), fs.readFileSync(path.join(__dirname, 'www', 'lib', n)));
    const html = fs.readFileSync(ext, 'utf8').replace(
      /<script\s+src="https?:\/\/[^"]*\/(three\.min\.js|GLTFLoader\.js)"/g,
      (m, n) => `<script src="lib/${n}"`);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    // 배경음악 등 추가 폴더: exe 옆에 있으면 그것, 없으면 앱에 들어 있는 것을 사용
    for (const sub of ['bgm']) {
      const ext2 = path.join(exeDir, sub), own = path.join(__dirname, 'www', sub), to = path.join(dir, sub);
      const from = fs.existsSync(ext2) ? ext2 : own;
      if (!fs.existsSync(from)) continue;
      fs.mkdirSync(to, { recursive: true });
      for (const f of fs.readdirSync(from)) fs.writeFileSync(path.join(to, f), fs.readFileSync(path.join(from, f)));
    }
    return path.join(dir, 'index.html');
  } catch (e) {
    console.error('external game load failed, using bundled copy:', e);
    return bundled;
  }
}

let win = null;
function create() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 400,
    backgroundColor: '#0b0f14',
    title: '스크랩 아레나',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(gamePage());

  // F11 전체화면, (개발 중에만) F12 개발자 도구
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.key === 'F12' && !app.isPackaged) { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // 외부 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
