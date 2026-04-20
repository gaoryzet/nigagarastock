# 코스피/코스닥 전종목 검색 만들기

전종목 검색은 Yahoo 검색만으로 처리하면 안 됩니다.  
Yahoo는 현재가와 차트를 가져오는 용도로 쓰고, 종목명 검색은 `krx-stocks.json` 파일을 기준으로 처리합니다.

## 지금 구조

```text
krx-stocks.json
  코스피/코스닥 종목코드, 종목명, 시장구분

app.js
  krx-stocks.json을 읽어 종목명/코드 검색

quick-handler
  선택된 종목의 Yahoo 현재가/차트 조회
```

## 전종목 파일 만들기

PC에서 Python을 쓸 수 있으면 아래 명령으로 최신 KOSPI/KOSDAQ 종목 파일을 만들 수 있습니다.

```powershell
pip install finance-datareader
python tools\build-krx-stocks.py
```

성공하면 아래 파일이 최신 전종목으로 갱신됩니다.

```text
krx-stocks.json
```

이 파일을 GitHub에 같이 올리면 앱에서 전종목 검색이 됩니다.

## 수동으로 만들어도 됩니다

`krx-stocks.json`은 아래 형식만 지키면 됩니다.

```json
[
  {
    "symbol": "042660",
    "ySymbol": "042660.KS",
    "name": "한화오션",
    "market": "KOSPI"
  },
  {
    "symbol": "086520",
    "ySymbol": "086520.KQ",
    "name": "에코프로",
    "market": "KOSDAQ"
  }
]
```

시장별 Yahoo 심볼 규칙:

```text
KOSPI  -> 종목코드.KS
KOSDAQ -> 종목코드.KQ
```

## 주의

KRX 상장 종목은 수시로 바뀝니다.  
실제 서비스에서는 `krx-stocks.json`을 주기적으로 갱신하거나 Supabase 테이블에 넣고 관리하는 방식이 좋습니다.
