# 📊 Giterra 데이터 자산 관리 가이드 (Data Asset Guide)

이 문서는 Giterra 서비스의 핵심인 개발자 페르소나 분석 데이터와 이를 관리하는 방법에 대해 설명합니다. 팀원 누구나 이 가이드를 통해 분석 엔진의 원리를 이해하고, 로컬 환경에 실전 데이터를 빠르게 주입할 수 있습니다.

---

## 🚀 1. 빠른 시작: 실전 데이터 로드 (Quick Start)

백엔드 인프라가 구축된 후, 정교하게 분석된 **162건의 실전 행성 데이터**를 즉시 본인의 로컬 DB에 반영할 수 있습니다.

```bash
# 1. backend 폴더로 이동
cd backend

# 2. 시드 데이터 로드 (loaddata 방식)
uv run scripts/load_seed.py
```
*   **파일 위치**: `backend/data/seed_data.json`
*   **포함 데이터**: 글로벌 네임드(tiangolo, yyx990803 등) 및 국내 유명 개발자들의 분석된 레포지토리 정보.

---

## 🧠 2. 데이터 분석 원리 (Summary)

Giterra는 단순 커밋 횟수가 아닌 활동의 **'희소 가중치'**를 기반으로 유저의 페르소나를 결정합니다. 상세한 수치와 설계 배경은 [데이터 파이프라인 문서](./DATA_PIPELINE.md)를 참조하세요.

### ⚖️ 가중치 정책 (Weighting Policy)
*   **고가치 활동**: `Test`, `Fix`, `Docs` (전문성 및 유지보수 역량)
*   **중간 가치**: `Refactor` (구조 개선 역량)
*   **기준 활동**: `Feat` (기본 구현 활동)
*   👉 *상세 가중치 수치는 [DATA_PIPELINE.md - 페르소나 분석 로직](./DATA_PIPELINE.md#4-페르소나-분석-로직-persona-analysis-logic)에서 확인할 수 있습니다.*

### 🛠️ 우선순위 알고리즘 (Best 8 System)
사용자가 분석을 요청하면, 시스템은 자동으로 다음 기준에 따라 가장 가치 있는 **8개의 레포지토리**를 선정합니다.
1.  **1순위**: 스타(Stars) 개수가 많은 순
2.  **2순위**: 최신 업데이트(Updated AT) 날짜가 최근인 순

---

## 🛠️ 3. 데이터 관리 도구 (Internal Scripts)

`backend/scripts/` 폴더 내의 도구들을 활용해 데이터를 관리할 수 있습니다.

1.  **`batch_collector.py`**: 정해진 유저 리스트를 GitHub API를 통해 실시간 수집 및 분석합니다.
2.  **`view_data.py`**: 현재 DB에 수집된 유저와 레포지토리의 페르소나 분포를 한눈에 보여줍니다.
3.  **`dump_seed.py`**: 현재 로컬 DB의 분석 데이터를 `seed_data.json`으로 추출합니다.
4.  **`load_seed.py`**: `seed_data.json`을 로컬 DB에 주입합니다.

---

## 🌌 4. 페르소나별 대표 표본 (Sample Leads)
프론트엔드 작업 시 아래 유저들을 기준으로 UI를 테스트하면 좋습니다.

*   **Builder**: `antfu`, `sindresorhus`, `karpathy`
*   **Fixer**: `tiangolo`, `yyx990803`
*   **Documenter**: `jwasham`, `donnemartin`
*   **Refactorer**: `woowacourse`
*   **Tester**: `aelassas` (가장 희귀한 타입)

---

## 🚀 5. 새로운 데이터 추가 수집하기 (Collecting More Data)

팀원들이 직접 특정 유저를 분석해서 DB에 넣고 공유하고 싶을 때 아래 절차를 따릅니다.

1.  **아이디 추가**: `scripts/batch_collector.py` 파일의 `NAMED_USERS` 리스트에 분석하고 싶은 GitHub 아이디를 추가합니다.
2.  **수집 및 분석 실행**: 아래 명령어를 실행하면 해당 유저의 상위 8개 레포지토리를 자동으로 분석하여 DB에 저장합니다.
    ```bash
    uv run scripts/batch_collector.py
    ```
3.  **데이터 공유 (Optional)**: 수집된 데이터를 다른 팀원들과 공유하고 싶다면, 데이터를 추출하여 커밋합니다.
    ```bash
    uv run scripts/dump_seed.py
    # 이후 생성된 backend/data/seed_data.json 파일을 git commit & push
    ```

---
*최종 업데이트: 2026-01-29 - Giterra Backend Team*
