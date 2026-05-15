# 말랑연두 바텀 연구소

둘만 쓰는 롤 바텀 듀오 전적/픽 추천 웹앱입니다.

## 실행

실시간 픽창 감지를 쓰려면 파일을 직접 여는 대신 로컬 프록시로 실행하세요.

```bash
npm start
```

그다음 브라우저에서 엽니다.

```text
http://localhost:4173
```

자동 사용자 링크:

- `http://localhost:4173?user=malang`
- `http://localhost:4173?user=yeondoo`

픽창이 없을 때 자동 패널 테스트:

- `http://localhost:4173?user=yeondoo&mock=champselect`

사용자 선택값은 브라우저 `localStorage`에 저장됩니다.

## 게임 오버레이 자동 실행

피시방 Windows PC에서는 GitHub Actions에서 만든 `MalangYeondooOverlay.exe`를 내려받아 실행하면 됩니다. Node.js 설치가 필요 없습니다.

EXE가 없을 때 임시로 스크립트 버전을 실행하려면 아래 파일을 실행합니다.

```text
start-overlay-windows.cmd
```

또는 터미널에서 직접 실행할 수 있습니다.

```bash
npm run start:overlay:windows
```

Windows 런처는 LoL 클라이언트의 `lockfile`을 직접 읽고 LCU의 `/lol-gameflow/v1/gameflow-phase`를 2초마다 확인합니다. 상태가 `InProgress`가 되면 왼쪽 위에 작은 TopMost 오버레이 창을 띄웁니다. 게임이 끝나면 자동으로 숨깁니다.

피시방에서 LoL이 D/E/F 드라이브나 별도 게임 폴더에 설치된 경우도 자동으로 찾습니다. 그래도 못 찾으면 아래처럼 직접 지정할 수 있습니다.

```powershell
$env:LCU_LOCKFILE="D:\Riot Games\League of Legends\lockfile"
.\start-overlay-windows.cmd
```

문제 확인용 로그는 아래 파일에 남습니다.

```text
%TEMP%\MalangYeondooOverlay.log
```

LoL을 독점 전체화면으로 켜면 Windows의 일반 TopMost 창이 게임 위에 안 보일 수 있습니다. 오버레이가 안 보이면 LoL 화면 모드를 `테두리 없음` 또는 `창 모드`로 바꿔 테스트하세요.

macOS에서 테스트할 때는 아래 명령을 씁니다.

```bash
npm run start:overlay
```

Windows 런처는 웹뷰가 아니라 작은 네이티브 버튼창입니다. `말랑`, `연두` 버튼을 누르면 현재 게임 카운트 숫자가 즉시 올라가고, 배포 서버 DB에 저장됩니다.

오버레이 카운트는 기본적으로 배포 서버 API에 저장됩니다.

```text
https://malang-yeondoo-bot-lab.onrender.com/api/tilt
```

로컬 DB에 저장하고 싶으면 이렇게 실행할 수 있습니다.

```powershell
$env:TILT_API_URL="http://localhost:4173/api/tilt"
.\start-overlay-windows.cmd
```

Windows EXE는 GitHub Actions의 `Build Windows Overlay` 워크플로우가 `dist/MalangYeondooOverlay.exe` 아티팩트로 생성합니다. 로컬 Windows PC에서 직접 빌드할 때는 PowerShell에서 아래 명령을 실행합니다.

```powershell
.\scripts\build-windows-exe.ps1
```

## Windows 앱 방향

피시방에서 가장 안정적인 방식은 웹사이트를 그대로 Windows 앱으로 묶는 것입니다. `BotLane Analytics` 앱은 Electron으로 실행되며, 앱 안에서 로컬 서버를 자동으로 띄웁니다.

앱 구조:

- 메인 화면: 기존 웹사이트 UI를 앱 창 안에 표시
- 로컬 감지: 앱 내부 서버가 PC 안의 LoL `lockfile`과 LCU API를 직접 읽음
- 전적/티어/짜증 DB: Render 서버(`https://malang-yeondoo-bot-lab.onrender.com`) API를 사용
- 게임 중 오버레이: LCU 상태가 `InProgress`가 되면 왼쪽 위에 짜증 카운트 창을 자동 표시

로컬에서 Electron 앱을 실행하려면 의존성을 설치한 뒤 실행합니다.

```bash
npm install
npm run electron
```

Windows portable EXE 빌드는 아래 명령으로 만듭니다.

```bash
npm run build:windows-app
```

GitHub Actions의 `Build Windows App` 워크플로우가 `BotLane-Analytics-Windows.exe` 아티팩트를 생성합니다.

## Riot API 키

제가 직접 Riot API 키를 발급하거나 넣은 것은 아닙니다. Riot API 키는 사용자가 [Riot Developer Portal](https://developer.riotgames.com/)에서 발급받아야 합니다.

로컬 개발에서는 `.env`에 넣습니다.

```text
RIOT_API_KEY=RGAPI-your-development-key
RIOT_REGION=asia
RIOT_PLATFORM=kr
```

Development 키는 24시간마다 만료됩니다. `401 Unknown apikey`가 뜨면 Developer Portal에서 새 Development API Key를 복사해 `.env`의 `RIOT_API_KEY`만 교체한 뒤 `npm start`를 다시 실행하면 됩니다.

중요한 차이:

- 전적/통계: Riot 공식 웹 API 사용. API 키 필요.
- 픽창 실시간 감지: Riot 웹 API가 아니라 PC 안에서 실행 중인 LoL Client LCU API 사용. API 키는 필요 없지만 LoL 클라이언트와 로컬 프록시가 필요.

API 키는 브라우저 코드에 넣으면 노출되므로, 실제 배포에서는 Vercel Serverless Function, Netlify Function, 작은 Node 서버 같은 백엔드에서만 사용해야 합니다.

## 통계 데이터와 DB를 같이 쓰는 이유

전적 원본은 Riot API가 맞습니다. 다만 화면을 열 때마다 모든 매치를 다시 긁으면 느리고, Development API 키는 호출 제한에 자주 걸립니다. 그래서 서버 DB를 캐시 겸 분석 저장소로 둡니다.

현재 구현:

- Riot Match-V5에서 `말랑말랑바우게#KR1`의 최근 매치 ID를 최대 80개까지 조회
- 각 매치 상세에서 `연두색연두#KR1`가 같은 팀인지 확인
- 말랑은 `BOTTOM`, 연두는 `UTILITY`인 실제 바텀 듀오 게임만 저장
- 화면 통계는 저장된 데이터 중 최근 바텀 듀오 게임 최대 20개로 계산
- 저장된 매치로 승률, KDA, 킬 관여율, 첫 용 연결률, 베스트 조합, 평균 게임 시간, 최근 흐름을 계산
- `/overlay.html`의 작은 게임 오버레이에서 누른 짜증 카운트는 `tilt_events` 테이블에 저장
- 짜증 카운트는 현재 게임 `sessionId`별 카운트와 최근 듀오 게임 기준 게임당 평균, 20회 간식 게이지로 계산
- SQLite DB 경로: `data/duo.sqlite`
- 배포 서버 DB가 비어 있으면 `seed/duo-matches.json`의 실제 Riot API 수집분으로 먼저 채운 뒤 최신 동기화를 시도
- 사용자 선택값만 브라우저 `localStorage`에 저장

현재 화면 기준은 “최근 바텀 듀오 게임 최대 20개”입니다. 새 게임을 하면 DB에는 계속 누적되고, 화면 통계는 최신 듀오 게임 20개 중심으로 다시 계산됩니다.

DB를 따로 쓰는 이유:

- Riot API 호출 제한에 걸려도 마지막으로 저장된 실제 통계를 바로 보여주기 위해
- matchId 중복 저장을 막고 새 게임만 증분 동기화하기 위해
- 픽창 추천에 “우리 듀오가 실제로 잘한 조합”을 빠르게 반영하기 위해
- 나중에 로컬 픽창 이벤트, 추천 결과, 선택한 챔피언, 빌드 확인 같은 Riot API에 없는 데이터를 저장하기 위해

op.gg 같은 사이트를 계속 긁는 방식은 권장하지 않습니다. 안정성과 이용약관 측면에서 공식 Riot API + 자체 캐시가 맞습니다.

## 픽창 자동 감지

`lcu-proxy.js`는 LoL 클라이언트의 `lockfile`을 읽고 아래 LCU 엔드포인트를 호출합니다.

- `/lol-gameflow/v1/gameflow-phase`
- `/lol-champ-select/v1/session`

웹앱은 `/api/live`를 2.5초마다 폴링합니다. 현재 상태가 `ChampSelect`이면 추천 패널과 3코어 빌드 패널이 자동으로 열립니다.

Windows 오버레이 런처는 PC 안의 LCU에서 현재 상태가 `InProgress`인지 확인하고, 짜증 카운트는 배포 서버의 `/api/tilt`에 저장합니다.

macOS에서 lockfile 경로가 다르면 이렇게 직접 지정할 수 있습니다.

```bash
LCU_LOCKFILE="/path/to/League of Legends/lockfile" npm start
```

## 배포

Render 배포 서버는 전적 통계와 DB 캐시를 제공합니다. 다만 픽창 실시간 감지는 사용자의 PC 안 LoL 클라이언트를 읽어야 하므로, 배포된 웹사이트만으로는 로컬 LoL 클라이언트에 직접 접근할 수 없습니다.

실시간 추천까지 편하게 쓰려면:

- 웹 UI와 전적 API는 Render에 배포
- 각자 PC에서 작은 로컬 프록시 앱 실행
- 배포 웹앱이 로컬 프록시를 읽도록 허용

이 구조가 제일 현실적입니다.

현재 `MalangYeondooOverlay.exe`는 짜증 카운트용 게임 오버레이입니다. 픽창 추천까지 피시방에서 자동으로 띄우려면 같은 방식으로 `/api/live` 로컬 프록시까지 포함한 Windows 헬퍼 앱을 별도로 패키징해야 합니다.
