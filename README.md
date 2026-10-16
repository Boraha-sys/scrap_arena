# 스크랩 아레나 — Windows(.exe) / Android(.apk) 패키지

게임 본체는 `www/index.html` 한 파일이에요. three.js r128과 GLTFLoader는 `www/lib/`에 들어 있어서 **인터넷 없이** 실행돼요.
같은 `www/`를 Windows는 Electron으로, Android는 WebView로 감쌉니다.

```
scrap-arena-app/
├─ www/                     ← 게임 본체 (index.html + lib/ three.js + bgm/ 배경음악)
├─ tools/sync-www.js        ← 새 버전 HTML을 www/에 넣는 스크립트
├─ desktop/                 ← Windows exe (Electron)
│   ├─ build-win.bat        ← 더블클릭하면 exe 빌드
│   └─ run-dev.bat          ← exe 없이 바로 실행해 보기
├─ android/                 ← Android apk (Android Studio 프로젝트)
└─ .github/workflows/       ← GitHub에 올리면 exe·apk 자동 빌드
```

## 새 게임 버전 반영하기

### Windows: exe를 다시 만들 필요 없음

claude.ai에서 받은 최신 `scrap-arena.html`을 exe와 **같은 폴더**에 그 이름 그대로 두고 exe를 다시 켜면 돼요. 앱이 그 파일을 우선 실행해요.
three.js는 앱 안에 들어 있는 파일로 자동으로 바꿔서 인터넷 없이도 돌아가요.
세이브(진행 상황)는 그대로 유지돼요.
배경음악이 바뀐 버전이면 `bgm` 폴더도 exe 옆에 같이 두면 돼요 (없으면 앱에 들어 있는 음악을 써요).

### 패키지 자체 갱신 (apk를 새로 만들 때 필수)

새 HTML을 아래처럼 넣으면, 외부 CDN 주소를 로컬 `lib/` 경로로 바꿔 `www/index.html`에 저장해요.
그다음 아래 방법으로 apk(또는 exe)를 다시 빌드하면 돼요.

```
node tools/sync-www.js 경로/scrap-arena.html
```

## Windows exe 만들기

1. [Node.js](https://nodejs.org) LTS를 설치해요.
2. `desktop/build-win.bat`을 더블클릭해요.
3. `desktop/dist/`에 결과물이 생겨요.
   - `ScrapArena-1.0.0-portable.exe`: 설치 없이 바로 실행
   - `ScrapArena-1.0.0-setup.exe`: 설치형

조작: F11 전체화면. 세이브는 `%APPDATA%\Scrap Arena`에 저장돼요.
서명하지 않은 exe라서 처음 실행할 때 Windows SmartScreen 경고가 뜰 수 있어요. "추가 정보 → 실행"을 누르면 돼요.

## Android apk 만들기

1. [Android Studio](https://developer.android.com/studio)를 설치해요.
2. `android/` 폴더를 열어요 (File → Open). Gradle 동기화는 자동으로 진행돼요.
3. Build → Build App Bundle(s) / APK(s) → Build APK(s)를 실행해요.
4. 결과물은 `android/app/build/outputs/apk/debug/app-debug.apk`예요. 폰에 복사해서 설치하면 돼요 ("출처를 알 수 없는 앱" 허용 필요).

빌드할 때마다 `www/`가 자동으로 `app/src/main/assets/www/`에 복사돼요.

- 기본 화면 방향: 가로 (`AndroidManifest.xml`의 `screenOrientation`). 세로도 쓰려면 `fullSensor`로 바꾸면 돼요.
- 뒤로가기: 경기 중에는 메뉴로, 메뉴에서는 앱을 백그라운드로 보내요.
- 최소 Android 8.0 (API 26)

### 플레이스토어용 릴리스 서명 (나중에)

```
keytool -genkey -v -keystore scraparena.jks -keyalg RSA -keysize 2048 -validity 10000 -alias scraparena
```

`android/keystore.properties`를 만들어 둬요 (Git에 올리지 마세요):

```
storeFile=../scraparena.jks
storePassword=비밀번호
keyAlias=scraparena
keyPassword=비밀번호
```

그다음 `Build → Generate Signed App Bundle / APK`를 실행하거나, `gradle assembleRelease` / `bundleRelease`로 빌드해요.

## 설치 없이 클라우드에서 빌드하기 (GitHub Actions)

1. 이 폴더 전체를 GitHub 저장소로 올려요. 비공개 저장소도 돼요.
2. Actions 탭에서 `build`가 자동으로 실행돼요. 수동 실행은 Run workflow를 누르면 돼요.
3. 완료되면 Artifacts에서 `ScrapArena-windows` (exe)와 `ScrapArena-android` (apk)를 받을 수 있어요.

## 크기 메모

- 현재 `index.html`은 약 11.5MB예요. 웹 아티팩트 한도(16MB) 안에 들어가요.
- 나중에 모델·무기 GLB가 늘어서 16MB를 넘으면 exe·apk에는 크기 제한이 없으니 이 패키지로 배포하면 돼요.
- 그때는 GLB를 base64로 넣지 않고 `www/models/*.glb` 파일로 분리하는 게 로딩에 더 좋아요. 두 플랫폼 모두 상대 경로 로딩을 지원해요.
