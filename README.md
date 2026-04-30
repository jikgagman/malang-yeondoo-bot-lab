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

- Riot Match-V5에서 `말랑말랑바우게#KR1`의 최근 20개 매치 ID를 조회
- 각 매치 상세에서 `연두색연두#KR1`가 같은 팀인지 확인
- 말랑은 `BOTTOM`, 연두는 `UTILITY`인 실제 바텀 듀오 게임만 저장
- 저장된 매치로 승률, KDA, 킬 관여율, 첫 용 연결률, 베스트 조합, 최근 게임을 계산
- SQLite DB 경로: `data/duo.sqlite`
- 배포 서버 DB가 비어 있으면 `seed/duo-matches.json`의 실제 Riot API 수집분으로 먼저 채운 뒤 최신 동기화를 시도
- 사용자 선택값만 브라우저 `localStorage`에 저장

현재 수집 범위는 “최근 20개 매치 ID 중 둘이 같은 팀 바텀 듀오로 뛴 게임”입니다. Riot API 호출 제한이 넉넉해지면 `count` 값을 늘리거나 날짜별 증분 동기화를 붙여 몇 개월치까지 확장할 수 있습니다.

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
