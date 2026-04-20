# GitHub 업로드 체크리스트

GitHub에 아래 파일과 폴더를 업로드하세요.

## 꼭 올릴 파일

```text
index.html
styles.css
app.js
config.js
```

## 같이 올리면 좋은 파일

```text
DEPLOY_GUIDE.md
GITHUB_UPLOAD_CHECKLIST.md
.gitignore
.env.example
supabase/
```

## 올리면 안 되는 파일

```text
.env
실제 service_role 키가 들어간 파일
증권사 실제 API Secret이 적힌 파일
```

## 업로드 전 config.js 확인

`config.js`가 아래처럼 되어 있어야 합니다.

```js
window.NGIK_CONFIG = {
  MARKET_DATA_FUNCTION_URL: "https://abwitqdxagdbcogsscsk.supabase.co/functions/v1/quick-handler",
  SUPABASE_ANON_KEY: "여기에_본인_anon_key"
};
```

`SUPABASE_ANON_KEY`에는 Supabase의 `anon` 또는 `publishable` key를 넣습니다.

절대 넣으면 안 되는 키:

```text
service_role
```

## GitHub Pages 설정

1. GitHub 저장소에서 `Settings` 클릭
2. `Pages` 클릭
3. Source: `Deploy from a branch`
4. Branch: `main`
5. Folder: `/(root)`
6. Save

주소가 생기면 휴대폰에서 접속해 테스트합니다.

## 테스트 순서

1. 앱 접속
2. 리그 탭에서 닉네임 등록
3. 투자 탭에서 `005930` 검색
4. 삼성전자 표시 확인
5. 1,000,000원 매수
6. 랭킹 탭에서 내 순위 확인
7. Supabase Edge Functions 로그에서 `quick-handler` 호출 확인

