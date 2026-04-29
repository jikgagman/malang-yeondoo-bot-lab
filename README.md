# 말랑연두 바텀 연구소

둘만 쓰는 롤 바텀 듀오 전적/픽 추천 웹앱 프로토타입입니다.

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

## 데이터 저장 방식

현재 구현:

- 사용자 선택값만 `localStorage`에 저장
- 전적 통계는 Riot API에서 가져온 뒤 SQLite DB에 저장
- 픽창 추천은 `lcu-proxy.js`가 LoL 클라이언트 상태를 읽어 즉시 계산
- SQLite DB 경로: `data/duo.sqlite`
- JSON 캐시는 기존 데이터 마이그레이션/비상 fallback 용도로만 사용

실서비스 권장 구조:

- Riot API에서 매치 목록/상세 전적을 주기적으로 가져오기
- 우리 둘이 같이 바텀으로 간 게임만 필터링
- SQLite, Supabase, Firebase 같은 DB에 matchId, champion pair, lane stats, item/rune snapshot 저장
- 다음 접속 때 DB 캐시를 먼저 보여주고, 새 게임만 Riot API로 증분 동기화

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

통계 화면만 보여주는 정적 배포는 GitHub Pages, Vercel, Netlify에 올릴 수 있습니다. 다만 픽창 실시간 감지는 사용자의 PC 안 LoL 클라이언트를 읽어야 하므로, 배포된 웹사이트만으로는 동작하지 않습니다.

실시간 추천까지 편하게 쓰려면:

- 웹 UI는 Vercel/Netlify에 배포
- 각자 PC에서 작은 로컬 프록시 앱 실행
- 배포 웹앱이 `localhost` 프록시를 읽도록 허용

이 구조가 제일 현실적입니다.
