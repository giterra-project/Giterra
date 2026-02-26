# 행성 배치(Planet Placement) API 구현 작업 요약

## 📌 개요
기존의 단일 행성 구역 분할 방식에서 **8개의 개별 행성 매핑 방식**으로 변경됨에 따라 관련 데이터 구조와 API를 새롭게 설계했습니다.

## 🛠 주요 변경 사항

### 1. DB 모델 변경 (`app/models.py`)
*   **Placement 테이블 수정**: 각 슬롯(slot_index)에 어떤 행성 타입이 배치되었는지 저장하기 위해 `planet_type` 컬럼을 추가했습니다.
*   **데이터 필드**:
    *   **데이터 필드**:
    *   `slot_index`: 0~7 사이의 정수 (행성 배치 위치)
    *   `planet_type`: 분석 결과 기반 타입 (예: `Builder`, `Fixer`, `Normal`)

### 2. API 스케마 정의 (`app/schemas.py`)
*   프론트엔드와 백엔드 간 일관된 데이터 통신을 위해 Pydantic 모델을 정의했습니다.
    *   `PlanetPlacementItem`: 개별 행성 배치 정보 (repo_id, slot_index) - **행성 타입은 서버에서 자동 결정**
    *   `PlanetPlacementRequest`: 배치 리스트와 저장 모드 (`replace`)
    *   `PlanetPlacementResponse`: 성공 시 반환할 표준 응답 규격

### 3. 신규 API 엔드포인트 구현 (`app/routers/user.py`)
*   **PUT /user/planets**: 행성 배치 정보를 일괄 저장합니다.
*   **핵심 로직**:
    *   **권한 검증**: 요청된 `repo_id`가 현재 로그인한 유저의 소유물인지 확인하여 무단 배치를 방지합니다.
    *   **행성 타입 자동 매핑**: DB에 저장된 각 레포지토리의 분석 결과(`analysis_type`)를 조회하여 `planet_type`으로 자동 지정합니다.
    *   **유효성 검사**: 슬롯 범위(0~7)가 규칙에 맞는지 검사합니다. (위반 시 400 Bad Request)
    *   **원자적 저장**: `mode: "replace"` 정책에 따라 기존 배치를 삭제하고 새 배치를 저장하는 과정을 단일 트랜잭션으로 처리합니다.

### 4. 서버 앱 등록 (`main.py`)
*   새롭게 생성한 유저 관련 라우터를 `/user` 프리픽스로 등록했습니다. 이제 모든 요청은 `/user/planets`를 통해 접근 가능합니다.

## 💾 DB 마이그레이션 안내
*   **상태**: `placements` 테이블에 `planet_type` 컬럼 추가가 완료되었습니다.
*   **참고**: 현재 로컬 환경의 PostgreSQL DB에 수동 마이그레이션이 반영된 상태이므로, 다른 팀원이 개발 환경을 공유할 경우 해당 컬럼 유무를 확인해야 합니다.

## 🚀 테스트 가이드

### API 엔드포인트
`PUT http://localhost:8000/user/planets`

### Request Body 예시
```json
{
  "placements": [
    { "repo_id": 101, "slot_index": 0 },
    { "repo_id": 102, "slot_index": 3 }
  ],
  "mode": "replace"
}
```

### 성공 응답 (200 OK)
```json
{
  "code": 200,
  "message": "placements updated",
  "data": {
    "placements": [
      { "repo_id": 101, "slot_index": 0, "planet_type": "Builder" },
      { "repo_id": 102, "slot_index": 3, "planet_type": "Fixer" }
    ]
  }
}
```
## 📊 테스트 결과 및 검증 완료 (2026-02-27)

실제 개발 환경에서 백엔드 로직 및 DB 연동 테스트를 완료했습니다.

### 1. 검증된 시나리오
*   **성공 (200 OK)**: 유효한 JWT 토큰과 함께 소유한 레포지토리 ID를 전송했을 때 DB에 원자적으로 저장됨을 확인. (행성 타입 자동 지정 포함)
*   **인증 실패 (401 Unauthorized)**: 토큰 누락 또는 만료된 토큰 사용 시 적절히 거절됨을 확인.
*   **유효성 검사 실패 (400 Bad Request)**: 
    *   `slot_index`가 범위를 벗어난 경우 (예: 9) 에러 메시지 반환 확인.
*   **권한 위반 (400 Bad Request)**: 타인의 `repo_id`를 포함하여 요청 시 `access denied` 처리됨을 확인.

### 2. Swagger UI 테스트 방법
1.  `GET /auth/me` 또는 브라우저 로그인 흐름을 통해 발급받은 **JWT 토큰**을 준비합니다.
2.  Swagger UI 우측 상단 **Authorize** 버튼을 누르고 토큰을 입력합니다.
3.  `PUT /user/planets` 엔드포인트에서 **Try it out**을 클릭합니다.
4.  JSON 데이터를 입력하고 **Execute**를 눌러 결과를 확인합니다.

---