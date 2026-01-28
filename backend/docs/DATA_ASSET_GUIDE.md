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

## 🧠 2. 데이터 분석 원리 (Heuristic Weighting)

Giterra는 단순 커밋 횟수가 아닌, 활동의 **'희소 가중치(Scarcity Weighting)'**를 기반으로 유저의 페르소나를 결정합니다.

### ⚖️ 커밋 타입별 가중치 (Weights)
가중치가 높을수록 해당 성향을 나타내는 '결정적 증거'로 간주됩니다.

| 커밋 타입 | 가중치 | 페르소나 (Persona) | 설명 |
| :--- | :--- | :--- | :--- |
| **Feat** | **1.0** | **미래 도시 숲 (Builder)** | 기능 구현 중심의 개척자 |
| **Refactor** | **3.0** | **장인의 정원 (Refactorer)** | 코드 품질을 개선하는 조경사 |
| **Test** | **4.0** | **심해의 관측 기지 (Tester)** | 시스템의 안정성을 지키는 수호자 |
| **Fix** | **4.0** | **연구소 돔 (Fixer)** | 버그를 해결하는 전문 해결사 |
| **Docs** | **4.0** | **지식의 도서관 (Documenter)** | 기록을 통해 지식을 전파하는 기록가 |

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
*최종 업데이트: 2026-01-29 - Giterra Backend Team*
