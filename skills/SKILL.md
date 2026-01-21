---
name: git-commit-formatter
description: 팀의 커밋 메시지 규칙에 따라 git 커밋 메시지를 포맷합니다. 사용자가 변경사항을 커밋하거나 커밋 메시지를 작성하도록 요청할 때 사용하세요.
---

# Git Commit Formatter Skill

커밋 메시지를 작성할 때는 반드시 아래의 규칙을 따라야 합니다.

**중요**: 커밋 메시지의 types는 영어로 적되 설명은 한글로 작성합니다.

## Format
```
키워드(대문자) : (영어로 위치/함수/기능) + 설명
```

## Allowed Types
- **CREATE**: 첫 커밋
- **Add**: 새로운 파일 추가
- **Delete**: 파일 삭제
- **Feat**: 새로운 기능 추가, 기존의 기능을 요구 사항에 맞추어 수정
- **Fix**: 기능에 대한 버그 수정
- **Build**: 빌드 관련 수정
- **Chore**: 패키지 매니저 수정, 그 외 기타 수정 ex) .gitignore
- **Docs**: 문서(주석) 수정
- **Style**: 코드 스타일, 포맷팅에 대한 수정
- **Refactor**: 기능의 변화가 아닌 코드 리팩터링 ex) 변수 이름 변경
- **Test**: 테스트 코드 추가/수정
- **Release**: 버전 릴리즈
- **Rename**: 파일 혹은 폴더명을 수정만 한 경우
- **Readme**: README
- **Comment**: 주석관련

## Instructions
1. 변경사항을 분석하여 적절한 `type`을 결정합니다.
2. 위치/함수/기능을 영어로 명시합니다.
3. 설명은 한글로 작성합니다.
4. 키워드는 대문자로 시작합니다 (CREATE, Add, Delete, Feat, Fix, Build, Chore, Docs, Style, Refactor, Test, Release, Rename, Readme, Comment).

## Examples
- `CREATE : start project`
- `Feat : UserService 로그인 기능 추가`
- `Fix : AuthController 토큰 검증 로직 수정`
- `Add : UserDTO 파일 추가`
- `Delete : deprecated API 파일 삭제`
- `Refactor : UserRepository 변수명 변경`
- `Docs : README 설치 가이드 추가`
- `Style : LoginPage 코드 포맷팅 적용`
- `Comment : calculateTotal 함수 주석 추가`