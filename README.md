# Prompt Manager

콘텐츠 제작용 프롬프트와 사이트를 브라우저에서 관리하는 개인용 웹앱입니다.

## 주요 기능
- 블로그 / 쇼츠 / 바이브코딩 / 콘텐츠 제작 사이트 분류
- 검색, 정렬, 즐겨찾기
- 프롬프트 추가, 수정, 복제, 삭제, 복사
- 사이트 추가, 수정, 삭제, 바로가기
- 모바일 반응형 UI
- 브라우저 LocalStorage 저장
- GitHub 저장소 동기화

## GitHub 동기화
데이터는 `data/store.json`에 저장됩니다.

브라우저에서 GitHub 동기화 메뉴를 열고 Fine-grained Personal Access Token을 연결하세요.
권장 권한:
- Repository access: Prompt-Manager only
- Contents: Read and write

토큰은 저장소 파일에 저장되지 않습니다. 기본값은 sessionStorage이며, '이 기기에 연결 정보 기억'을 선택한 경우에만 localStorage에 저장됩니다.

연결 후 프롬프트/사이트를 저장하거나 즐겨찾기를 바꾸면 GitHub에 자동 동기화됩니다.
