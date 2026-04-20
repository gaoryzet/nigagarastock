# 니가가라투자왕

친구들과 1,000만원의 가상 투자금으로 경쟁하는 모바일형 모의투자 리그 앱입니다.

## 주요 기능

- 링크 티켓으로 리그 참여
- 한 리그에서 한 아이디는 1회만 1,000만원 지급
- 새 리그 시작 시 새 링크 티켓 발급
- KOSPI/KOSDAQ 종목 검색
- 현재가와 차트 표시
- 금액 기준 일부 매수
- 보유 종목 선택 후 일부 매도 또는 전량 매도
- 체결 수량, 체결가, 체결금액 표시
- 현금, 총자산, 수익률, 순위 계산
- 리그 종료와 리그 관리 화면

## GitHub Pages 배포

1. 이 폴더의 파일을 GitHub 저장소에 업로드합니다.
2. GitHub 저장소에서 `Settings` > `Pages`로 이동합니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch는 `main`, Folder는 `/(root)`로 선택합니다.
5. `Save`를 누릅니다.
6. 생성된 GitHub Pages 주소로 접속해 테스트합니다.

## Supabase Edge Function

현재가와 차트는 Supabase Edge Function을 통해 불러옵니다.

Supabase Dashboard에서 `quick-handler` 함수의 Code 탭에 아래 파일 내용을 붙여넣고 Deploy 하세요.

```text
supabase/functions/market-data/index.ts
```

Function Settings에서 `Verify JWT with legacy secret`은 꺼두는 것을 권장합니다.

## 배포 전 체크

`config.js`가 아래처럼 되어 있으면 됩니다.

```js
window.NGIK_CONFIG = {
  MARKET_DATA_FUNCTION_URL: "https://abwitqdxagdbcogsscsk.supabase.co/functions/v1/quick-handler",
  SUPABASE_ANON_KEY: ""
};
```

## 올리지 말아야 할 파일

아래 파일은 GitHub에 올리지 마세요.

```text
.env
service_role 키가 들어간 파일
실제 증권 API Secret이 들어간 파일
smoke-*.js
node_modules/
```
