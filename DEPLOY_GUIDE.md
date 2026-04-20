# 니가가라투자왕 배포 가이드

이 앱은 두 부분으로 나누어 배포하는 것을 추천합니다.

1. GitHub Pages: HTML, CSS, JS 화면 파일을 올리는 곳
2. Supabase: 데이터베이스와 시세 API 중계 함수를 올리는 곳

중요한 원칙:

- GitHub에는 실제 증권 API 키를 올리지 않습니다.
- 브라우저 HTML 파일에도 실제 증권 API 키를 넣지 않습니다.
- 실제 증권 API 키는 Supabase Edge Function의 Secret으로만 저장합니다.

## 1. 현재 파일 구조

```text
niga-gara-investment-king/
  index.html
  styles.css
  app.js
  config.js
  .gitignore
  .env.example
  supabase/
    functions/
      market-data/
        index.ts
    migrations/
      001_initial_schema.sql
```

## 2. GitHub에 올리는 방법

### 2.1 GitHub 저장소 만들기

1. GitHub에 로그인합니다.
2. 오른쪽 위 `+` 버튼을 누릅니다.
3. `New repository`를 누릅니다.
4. Repository name에 예를 들어 `niga-gara-investment-king`을 입력합니다.
5. Public으로 만들면 GitHub Pages를 쓰기 쉽습니다.
6. `Create repository`를 누릅니다.

### 2.2 파일 올리기

초보자라면 GitHub 웹 화면에서 직접 올리는 방식이 가장 쉽습니다.

1. 만든 저장소로 들어갑니다.
2. `Add file`을 누릅니다.
3. `Upload files`를 누릅니다.
4. 이 폴더 안의 파일들을 업로드합니다.
5. 아래 파일과 폴더를 포함합니다.

```text
index.html
styles.css
app.js
config.js
.gitignore
.env.example
supabase/
```

6. `Commit changes`를 누릅니다.

주의:

- `.env` 파일은 올리면 안 됩니다.
- 실제 증권 API 키가 들어간 파일은 GitHub에 올리면 안 됩니다.

## 3. GitHub Pages 켜기

1. GitHub 저장소에서 `Settings`로 갑니다.
2. 왼쪽 메뉴에서 `Pages`를 누릅니다.
3. `Build and deployment`에서 Source를 `Deploy from a branch`로 선택합니다.
4. Branch는 `main`을 선택합니다.
5. Folder는 `/(root)`를 선택합니다.
6. `Save`를 누릅니다.
7. 잠시 기다리면 사이트 주소가 생깁니다.

주소 예시:

```text
https://내아이디.github.io/niga-gara-investment-king/
```

## 4. Supabase 프로젝트 만들기

1. Supabase에 로그인합니다.
2. `New project`를 누릅니다.
3. 프로젝트 이름을 입력합니다.
4. Database password를 설정합니다.
5. Region은 한국 사용자라면 가까운 지역을 고릅니다.
6. 프로젝트 생성이 끝날 때까지 기다립니다.

## 5. Supabase 데이터베이스 테이블 만들기

1. Supabase 프로젝트로 들어갑니다.
2. 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
3. `New query`를 누릅니다.
4. 아래 파일 내용을 복사해서 붙여넣습니다.

```text
supabase/migrations/001_initial_schema.sql
```

5. `Run`을 누릅니다.

이 작업은 리그, 참여자, 보유 종목, 거래 기록 테이블을 만듭니다.

## 6. Supabase Edge Function 만들기

초보자에게는 Supabase 대시보드에서 만드는 방법이 쉽습니다.

1. Supabase 프로젝트 왼쪽 메뉴에서 `Edge Functions`를 엽니다.
2. `Create a new function`을 누릅니다.
3. 함수 이름을 `market-data`로 입력합니다.
4. 코드 편집 화면에 아래 파일 내용을 붙여넣습니다.

```text
supabase/functions/market-data/index.ts
```

5. 저장 또는 배포 버튼을 누릅니다.

배포 후 함수 주소는 보통 이런 형태입니다.

```text
https://프로젝트ID.supabase.co/functions/v1/market-data
```

## 7. 증권 API 키를 Supabase에 저장하기

실제 증권 API를 쓰려면 키를 Supabase Secret으로 저장합니다.

1. Supabase 프로젝트에서 `Edge Functions`로 갑니다.
2. `Secrets` 또는 `Environment Variables` 메뉴를 찾습니다.
3. 아래 값을 추가합니다.

```text
MARKET_PROVIDER_URL=증권사_또는_시세_API_URL
MARKET_PROVIDER_KEY=실제_API_KEY
```

처음 테스트할 때는 이 값을 비워둬도 됩니다. 비워두면 Supabase 함수가 샘플 종목 데이터를 반환합니다.

## 8. config.js 연결하기

GitHub에 올린 앱이 Supabase 함수를 부르려면 `config.js`를 수정해야 합니다.

```js
window.NGIK_CONFIG = {
  MARKET_DATA_FUNCTION_URL: "https://프로젝트ID.supabase.co/functions/v1/market-data",
  SUPABASE_ANON_KEY: "Supabase anon key"
};
```

Supabase anon key 찾는 곳:

1. Supabase 프로젝트로 갑니다.
2. `Project Settings`를 누릅니다.
3. `API` 메뉴를 엽니다.
4. `anon` 또는 `publishable` key를 복사합니다.

주의:

- anon key는 브라우저에 넣어도 되는 공개용 키입니다.
- service_role key는 절대 브라우저나 GitHub에 넣으면 안 됩니다.

## 9. 작동 확인 방법

1. GitHub Pages 주소로 앱을 엽니다.
2. `투자` 탭을 누릅니다.
3. 검색창에 `삼성전자` 또는 `005930`을 입력합니다.
4. 종목이 나오면 연결 성공입니다.
5. 개발자 도구를 열 수 있다면 Network 탭에서 `market-data` 요청이 보이는지 확인합니다.

## 10. 현재 구현 상태

지금 앱은 세 단계로 동작합니다.

1. `config.js`에 Supabase 함수 주소가 없으면 샘플 종목으로 작동합니다.
2. Supabase 함수 주소가 있으면 `market-data` 함수를 호출합니다.
3. Supabase 함수에 실제 증권 API Secret이 있으면 실제 API를 호출하고, 없으면 샘플 데이터를 반환합니다.

그래서 처음에는 API 없이 배포 테스트를 할 수 있고, 나중에 증권 API 키를 받은 뒤 Secret만 추가하면 됩니다.

## 11. 실제 증권 API를 붙일 때 수정할 곳

수정할 파일:

```text
supabase/functions/market-data/index.ts
```

수정할 함수:

```ts
fetchFromExternalProvider(query)
```

증권사 API마다 응답 형식이 다르기 때문에, 이 함수에서 실제 응답을 아래 형태로 맞춰주면 됩니다.

```json
{
  "stocks": [
    {
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "price": 80200,
      "change": 1.4
    }
  ]
}
```

프론트 앱은 이 형태만 받으면 종목 검색, 현재가 표시, 시장가 모의 체결을 그대로 할 수 있습니다.

