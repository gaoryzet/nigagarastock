# GitHub 업로드 체크리스트

GitHub Pages에서 앱을 테스트하려면 아래 파일과 폴더를 올리면 됩니다.

## 꼭 올릴 파일

```text
index.html
styles.css
app.js
config.js
krx-stocks.json
README.md
.gitignore
```

## 같이 올리면 좋은 파일

```text
DEPLOY_GUIDE.md
GITHUB_UPLOAD_CHECKLIST.md
KRX_MASTER_GUIDE.md
.env.example
supabase/
tools/
```

## 올리지 않을 파일

```text
.env
.env.local
service_role 키가 들어간 파일
증권사 실제 API Secret이 적힌 파일
smoke-*.js
node_modules/
```

## 업로드 전 확인

`config.js`는 아래처럼 되어 있으면 됩니다.

```js
window.NGIK_CONFIG = {
  MARKET_DATA_FUNCTION_URL: "https://abwitqdxagdbcogsscsk.supabase.co/functions/v1/quick-handler",
  SUPABASE_ANON_KEY: ""
};
```

현재 Supabase Edge Function은 브라우저에서 공개 호출할 수 있게 JWT 검증을 꺼두는 방식입니다. 그래서 anon key는 비워도 됩니다.

## GitHub Pages 설정

1. GitHub 저장소로 이동합니다.
2. `Add file` > `Upload files`를 누릅니다.
3. 위 파일과 폴더를 드래그해서 올립니다.
4. 아래 초록색 `Commit changes` 버튼을 누릅니다.
5. 저장소의 `Settings`로 이동합니다.
6. 왼쪽 메뉴에서 `Pages`를 누릅니다.
7. Source를 `Deploy from a branch`로 선택합니다.
8. Branch는 `main`, Folder는 `/(root)`로 선택합니다.
9. `Save`를 누릅니다.
10. 몇 분 뒤 생성된 Pages 주소로 접속합니다.

## 테스트 순서

1. GitHub Pages 주소로 접속합니다.
2. 리그 탭에서 닉네임을 등록합니다.
3. 투자 탭에서 `005930` 또는 `삼성전자`를 검색합니다.
4. 차트와 현재가가 표시되는지 확인합니다.
5. 1,000,000원을 매수합니다.
6. 마지막 체결 카드에 수량, 체결가, 체결금액이 표시되는지 확인합니다.
7. 보유 종목을 누르고 일부 매도 또는 전량 매도를 테스트합니다.
8. 랭킹 탭에서 순위와 수익률이 바뀌는지 확인합니다.

## Supabase 함수 확인

Supabase `quick-handler` 함수의 Code 탭에는 아래 파일 내용을 붙여넣고 Deploy 해야 합니다.

```text
supabase/functions/market-data/index.ts
```

함수 설정에서 `Verify JWT with legacy secret`은 꺼두세요.
