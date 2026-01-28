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
| **Test** | `test`, `testing`, `spec`, `테스트` |

---

## 🧠 3. 성향 분석 알고리즘 (Persona Logic)

수집된 통계를 바탕으로 개발자의 성향을 다음과 같이 정의하며, 단순 개수 비교가 아닌 **업계 표준 분포를 재해석한 휴리스틱 가중치**를 적용하여 판정합니다.

### ⚖️ 성향 판정 가중치 (Scarcity-based Weighting)

단순 커밋 숫자가 아닌, 각 활동의 **'상대적 희소성'과 '가치'**를 반영하여 가중치 점수를 산출합니다. 이는 기능 구현(`Feat`)이 기본적으로 가장 많은 비중을 차지하는 개발 환경을 고려한 설계입니다.

| 커밋 타입 | 가중치(Weight) | **최종 페르소나 (Persona Name)** | 판정 근거 (Rationale) |
| :--- | :--- | :--- | :--- |
| **Feat** | **1.0** | **미래 도시 숲 (Builder)** | 가장 빈번한 활동으로 성향 판정의 기준점이 됨. |
| **Refactor** | **2.0** | **장인의 정원 (Refactorer)** | 코드 질 개선에 2배의 가치를 부여하여 '장인' 성향 발굴. |
| **Test** | **2.7** | **심해의 관측 기지 (Tester)** | 전문적 테스트 습관에 높은 가산점을 부여하여 '수호자' 성향 발굴. |
| **Fix** | **4.0** | **연구소 돔 (Fixer)** | 희소하지만 필수적인 문제 해결 능력을 최우선 가치로 평가. |
| **Docs** | **4.0** | **지식의 도서관 (Documenter)** | 협업의 기초가 되는 기록 정신을 고가치로 평가. |

### 🛠️ 성향 결정 로직 (The Algorithm)
1. 각 카테고리별 점수 = `커밋 개수 * 가중치(Weight)`
2. 가장 높은 최종 점수를 가진 카테고리가 해당 개발자의 **메인 페르소나**로 결정됩니다.
3. 데이터가 부족한 경우(Total Score < 5) 혹은 신규 계정은 `Beginner`로 분류됩니다.

---

## 🏗️ 4. 포트폴리오를 위한 로직 설계 배경 (Internal Design Rationale)

이 서비스의 가공 로직은 단순히 "무엇을 많이 했는가"가 아니라 **"남들이 하지 않는 가치 있는 일을 얼마나 더 적극적으로 수행했는가"**를 정량적으로 증명하는 데 목적이 있습니다.

1. **정규화의 필요성**: 오픈소스 데이터 분석 결과 `Feat` 커밋은 `Fix` 보다 약 4배 더 빈번하게 발생합니다. 가중치 없이 단순히 개수로만 성향을 뽑으면 모든 유저가 `Builder`로 편향되는 **데이터 왜곡(Data Bias)**이 발생합니다.
2. **희소 가치 이론(Scarcity Value)**: 업계 평균 빈도의 역수를 가중치로 활용하여, 소홀히 하기 쉬운 `Test`, `Fix`, `Docs` 활동에 정당한 가치를 부여했습니다.
3. **사용자 경험(UX)**: 사용자는 자신의 가장 흔한 습관인 `Feat`이 아닌, 본인의 특별한 강점(예: 꼼꼼한 테스트 습관 등)을 짚어주는 분석 결과에 더 높은 신뢰와 흥미를 느끼게 됩니다.

---

## 🗄️ 4. 데이터베이스 연동 (Persistence)

### DB Upsert 전략
- **OAuth Callback**: 로그인 시 유저의 `github_id`를 기준으로 기존 정보를 업데이트(Update)하거나 신규 생성(Insert)합니다.
- **Analysis Storage**: 분석이 완료된 레포지토리는 `repositories` 테이블에 분석 타입(Type)과 요약(Summary)을 저장하여, 재방문 시 분석 시간을 단축합니다.

---

## 📡 5. API 데이터 스냅샷 (Data Snapshot)

다른 파트(프론트엔드 등)와의 협업을 위한 실제 응답 데이터의 구조입니다.

### 분석 결과 샘플 (Response)
```json
{
  "status": "success",
  "summary": {
    "username": "jih19984",
    "persona": "연구소 돔 (Fixer)",
    "main_languages": ["Python"],
    "total_commit_summary": {
      "feat": 1, "fix": 1, "docs": 0, "refactor": 0, "test": 0, "chore": 0
    }
  },
  "detailed_results": [
    {
      "repo": "TIL_Summary",
      "total_commits": 10,
      "commit_stats": { "feat": 1, "fix": 1, "docs": 0, "refactor": 0 },
      "languages": { "Python": 6474 },
      "latest_commit_date": "2025-10-09T13:11:16",
      "status": "success"
    }
  ]
}
```

---

## 📅 6. 개발 로그 (Dev Log)

### 2026-01-28
- ✅ GitHub OAuth 콜백 시 DB 유저 정보Upsert 로직 구현
- ✅ `AnalyzeSelectedRepos` 서비스 내 분석 결과 DB 저장 기능 추가
- ✅ 레포지토리별 최신 커밋 날짜(`latest_commit`) 자동 추적 및 저장
- ✅ 서비스 함수와 라우터 함수의 재귀 호출 버그 해결
- ✅ 데이터 분석 결과 API 스냅샷 문서화 및 임시 파일 정리
