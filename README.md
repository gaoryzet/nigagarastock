# 이원 TODO

프로젝트와 일정을 함께 관리하는 공유형 TODO 웹앱입니다.

## 현재 구조

- 화면 배포: GitHub Pages
- 공동 데이터 저장: Supabase
- 앱 설치: PWA 방식
- 지원 환경: Windows, Mac, Chrome, Edge, Safari

## 중요한 안내

이 버전은 로그인 없이 같은 데이터를 공유하는 1차 협업 버전입니다.
앱 주소를 아는 사람은 데이터를 볼 수 있고 수정할 수 있습니다.
나중에 보안을 강화하려면 Supabase Auth 로그인과 사용자별 권한을 추가해야 합니다.

## Supabase 설정

1. Supabase 프로젝트를 엽니다.
2. 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
3. 이 저장소의 `supabase-schema.sql` 내용을 전체 복사합니다.
4. SQL Editor에 붙여넣고 실행합니다.
5. 앱을 새로고침합니다.

처음 테이블이 비어 있으면 앱이 기본 사용자와 예시 프로젝트를 자동으로 생성합니다.

## GitHub Pages에 올리는 방법

1. GitHub에서 새 repository를 만듭니다.
2. 이 폴더의 파일을 모두 업로드합니다.
3. repository의 `Settings`로 이동합니다.
4. `Pages` 메뉴를 엽니다.
5. `Deploy from a branch`를 선택합니다.
6. branch는 `main`, folder는 `/root`를 선택합니다.
7. 저장하면 잠시 뒤 웹 주소가 생깁니다.

## 앱처럼 설치하는 방법

### Windows

1. GitHub Pages 주소를 Edge 또는 Chrome에서 엽니다.
2. 주소창 오른쪽의 설치 아이콘을 누릅니다.
3. `이원 TODO 설치`를 선택합니다.
4. 시작 메뉴에 앱처럼 추가됩니다.

### Mac

1. GitHub Pages 주소를 Safari 또는 Chrome에서 엽니다.
2. Safari에서는 공유 버튼에서 `Dock에 추가`를 선택합니다.
3. Chrome에서는 주소창 오른쪽 설치 아이콘 또는 메뉴의 설치 항목을 선택합니다.
4. Dock 또는 Launchpad에서 앱처럼 실행할 수 있습니다.

## 포함된 앱 아이콘

- `assets/icon.svg`
- `assets/icon-192.png`
- `assets/icon-512.png`

## 파일 구성

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `sw.js`
- `supabase-schema.sql`
- `assets/`
