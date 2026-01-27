# 📊 Giterra Data Pipeline & Methodology

이 문서는 Giterra 프로젝트의 핵심인 **데이터 수집(Data Collection) 및 가공(Process)**의 로직과 설계 방식을 기록합니다.

---

## 🏗️ 1. 데이터 파이프라인 개요
사용자의 GitHub 데이터를 수집하여 개발자 성향을 분석하고, 이를 행성(Planet) 데이터로 변환하기 위한 저장 과정까지를 포함합니다.

### 🔄 전체 흐름
1. **Source**: GitHub REST API (v3)
2. **Collect**: `httpx` 비동기 통신을 통한 사용자/레포/커밋/언어 데이터 수집
3. **Store**: `PostgreSQL` (SQLModel)을 사용한 물리적 데이터 영속화
4. **Process**: 커밋 메시지 키워드 분석 및 성향 태그 할당

---

## 🛠️ 2. 데이터 수집 및 가공 로직

### 🔍 수집 데이터 항목
- **User**: ID, Login Name, Avatar, Profile URL, Access Token
- **Repository**: Name, Description, Stars, Main Language
- **Commits**: 최근 50개의 커밋 메시지 및 최종 커밋 일시
- **Languages**: 해당 레포지토리의 언어별 사용량(Bytes)

### 🏷️ 키워드 매핑 (Keyword Map)
커밋 메시지를 분석하여 다음과 같은 카테고리로 분류합니다.
| 카테고리 | 매핑 키워드 |
| :--- | :--- |
| **Feat** | `feat`, `add`, `create`, `implement`, `추가`, `구현`, `생성` |
| **Fix** | `fix`, `bug`, `patch`, `issue`, `수정`, `해결`, `고침`, `오류` |
| **Docs** | `docs`, `readme`, `document`, `문서`, `설명`, `주석` |
| **Refactor** | `refactor`, `clean`, `simplify`, `개선`, `리팩` |

---

## 🧠 3. 성향 분석 알고리즘 (Persona Logic)

수집된 통계를 바탕으로 개발자의 성향을 다음과 같이 정의합니다.

1. **미래 도시 숲 (Builder)**
   - 조건: `Feat` 커밋 수가 `Fix` 커밋 수보다 많을 때.
   - 특징: 새로운 기능을 창조하고 확장하는 데 강점이 있음.

2. **연구소 돔 (Fixer)**
   - 조건: `Fix` 커밋 수가 `Refactor` 커밋 수보다 많을 때.
   - 특징: 안정성을 유지하고 문제를 해결하는 버그 헌터 스타일.

3. **지식의 도서관 (Documenter)**
   - 조건: `Docs` 커밋 비중이 가장 높을 때.
   - 특징: 기록을 중요시하며 협업의 기초를 닦는 스타일.

4. **새싹이 돋아나는 땅 (Beginner)**
   - 조건: 전체 분석 데이터가 부족하거나 신규 계정일 때.

---

## 🗄️ 4. 데이터베이스 연동 (Persistence)

### DB Upsert 전략
- **OAuth Callback**: 로그인 시 유저의 `github_id`를 기준으로 기존 정보를 업데이트(Update)하거나 신규 생성(Insert)합니다.
- **Analysis Storage**: 분석이 완료된 레포지토리는 `repositories` 테이블에 분석 타입(Type)과 요약(Summary)을 저장하여, 재방문 시 분석 시간을 단축합니다.

---

## 📅 5. 개발 로그 (Dev Log)

### 2026-01-28
- ✅ GitHub OAuth 콜백 시 DB 유저 정보Upsert 로직 구현
- ✅ `AnalyzeSelectedRepos` 서비스 내 분석 결과 DB 저장 기능 추가
- ✅ 레포지토리별 최신 커밋 날짜(`latest_commit`) 자동 추적 및 저장
- ✅ 서비스 함수와 라우터 함수의 재귀 호출 버그 해결
