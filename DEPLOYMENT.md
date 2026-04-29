# 배포 메모

이 앱은 두 부분으로 나뉩니다.

1. 전적/통계 서버
   - Riot API 호출
   - SQLite DB 저장
   - 웹 UI 제공
   - Render, Railway, Fly.io 같은 서버형 호스팅에 배포 가능

2. 픽창 실시간 감지
   - 사용자의 PC 안 LoL 클라이언트 LCU API를 읽어야 함
   - 원격 서버에서는 사용자의 로컬 LoL 클라이언트를 직접 볼 수 없음
   - 실사용하려면 각 PC에서 로컬 프록시 앱을 실행하거나, 이후 별도 데스크톱 앱으로 패키징해야 함

## 서버형 배포 권장값

환경변수:

```text
RIOT_API_KEY=RGAPI-...
RIOT_REGION=asia
RIOT_PLATFORM=kr
PORT=4173
```

영구 디스크:

```text
/app/data
```

SQLite DB는 `/app/data/duo.sqlite`에 저장됩니다. 영구 디스크가 없는 호스팅에 올리면 재시작 때 DB가 사라질 수 있습니다.

## Render 배포 예시

- Blueprint 배포: `render.yaml` 선택
- 또는 New Web Service
- Runtime: Docker
- Root Directory: 현재 프로젝트 폴더
- Environment Variables에 위 값 입력
- Disk 추가: mount path `/app/data`

## 로컬 실행

```bash
npm start
```

브라우저:

```text
http://localhost:4173
```

강제 동기화:

```text
http://localhost:4173/api/stats?refresh=1
```
