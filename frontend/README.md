# Giterra Frontend

Giterra frontend는 React + TypeScript 기반으로, GitHub 레포지토리를 2.5D 은하계로 시각화하는 UI를 담당합니다.

현재 `/planet`의 기본 화면은 **중앙 태양 + 8개 레포지토리 행성 공전 프로토타입**입니다. 기존 3D 행성 화면은 `Legacy 3D` 모드로 보존되어 있습니다.

---

## 기술 스택

- React 19
- TypeScript
- Vite / Rolldown Vite
- Zustand
- TanStack Query
- Framer Motion
- Three.js / React Three Fiber / Drei
- Lucide React
- CSS animation + SVG orbit + WebP assets

---

## 실행

```bash
npm ci
npm run dev -- --host localhost --port 5173
```

접속:

```text
http://localhost:5173/
```

빌드:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

> 현재 전체 lint는 기존 코드 이슈로 실패할 수 있습니다. 변경 파일 대상 lint는 별도 확인이 필요합니다.

---

## 환경 변수

`.env.sample`을 참고하여 `.env`를 만듭니다.

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_REDIRECT_URI=http://localhost:5173/login/callback
```

---

## 주요 구조

```text
src/
  App.tsx
  components/
    galaxy/
      GalaxyOrbitPreview.tsx
    layout/
      Header.tsx
    planet/
      ...기존 3D planet components
  pages/
    Main/
    Login/
      LoginCallback.tsx
    MyPage/
    Planet/
      PlanetPage.tsx
      LegacyPlanetPage.tsx
  services/
    api.ts
    apiConfig.ts
  store/
    useAuthStore.ts
    usePlanetStore.ts
  assets/
    models/
      *.webp
```

---

## 인증 흐름

```text
Header 로그인 버튼
  → useAuthStore.login()
  → `${VITE_API_BASE_URL}/auth/login`
  → GitHub OAuth
  → backend callback
  → `/login/callback?token={jwt}`
  → LoginCallback에서 `/auth/me` 호출
  → Zustand persist store 저장
```

상태 저장:

- store: `src/store/useAuthStore.ts`
- localStorage key: `auth-storage`

---

## 2.5D 은하계 UI

주요 파일:

```text
src/components/galaxy/GalaxyOrbitPreview.tsx
src/pages/Planet/PlanetPage.tsx
src/pages/Planet/LegacyPlanetPage.tsx
src/index.css
```

구현 방식:

- SVG `ellipse`로 궤도선 렌더링
- JavaScript에서 행성 중심 좌표 계산
- CSS transform으로 크기/깊이감 표현
- WebP asset으로 로딩 부담 감소
- `requestAnimationFrame`으로 공전 업데이트

현재는 visual prototype이며, 다음 단계에서 실제 선택 레포 데이터와 연결합니다.

---

## 알려진 정리 필요 사항

- `services/api.ts`의 base URL을 `VITE_API_BASE_URL` 기준으로 통일
- `Authorization` header 형식을 `Bearer` 또는 공통 helper로 통일
- `usePlanetStore`의 token 조회를 `auth-storage` 기준으로 정리
- 2.5D 행성 8개를 mock 데이터가 아닌 `/user/planets`/`/analyze` 결과와 연결
