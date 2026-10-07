# Prompt Manager

콘텐츠 제작용 프롬프트와 사이트를 브라우저에서 관리하는 개인용 웹앱입니다.

## 현재 저장 구조
- 프롬프트 / 사이트 데이터: Cloudflare Worker → D1
- 브라우저 LocalStorage: 연결 장애 시 임시 캐시
- 레퍼런스 이미지 파일: GitHub `assets/references`

D1에 데이터가 비어 있는 첫 실행에서는 `data/store.json`을 초기 데이터로 가져옵니다. 이후 실제 편집 데이터의 기준은 D1입니다.

## 주요 기능
- 블로그 / 쇼츠 / 바이브코딩 / 콘텐츠 제작 사이트 분류
- 검색, 정렬, 즐겨찾기
- 프롬프트 추가, 수정, 복제, 삭제, 복사
- 사이트 추가, 수정, 삭제, 바로가기
- 모바일 반응형 UI
- Cloudflare D1 자동 저장
- GitHub 레퍼런스 이미지 추가 / 교체 / 삭제

## Cloudflare 자동 배포
GitHub Actions가 main 브랜치 변경 시 Worker와 정적 파일을 Cloudflare에 자동 배포합니다.

Repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`

## 레퍼런스 이미지
GitHub Personal Access Token은 레퍼런스 이미지 관리에만 사용합니다. 프롬프트와 사이트 데이터 저장에는 GitHub 토큰이 필요하지 않습니다.

권장 GitHub 토큰 범위:
- Repository access: Prompt-Manager only
- Contents: Read and write

토큰은 저장소 코드나 Cloudflare에 저장하지 않습니다. 기본은 sessionStorage이고, '이 기기에 이미지 연결 정보 기억'을 선택한 경우에만 localStorage에 저장됩니다.
