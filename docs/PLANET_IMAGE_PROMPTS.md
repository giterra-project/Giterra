# Giterra Planet Image Prompts

Giterra의 행성 에셋은 백엔드/프론트 공통 `PlanetType`과 같은 이름으로 관리한다.

```text
SUN
MERCURY
VENUS
EARTH
MARS
JUPITER
SATURN
URANUS
NEPTUNE
```

`SUN`은 중앙 항성 전용이고, 나머지 8개는 레포지토리 분석 결과에 따라 배정되는 행성 타입이다.

---

## Asset Naming

생성 후 최종 프론트 에셋은 소문자 `webp` 파일로 저장한다.

```text
frontend/src/assets/models/sun.webp
frontend/src/assets/models/mercury.webp
frontend/src/assets/models/venus.webp
frontend/src/assets/models/earth.webp
frontend/src/assets/models/mars.webp
frontend/src/assets/models/jupiter.webp
frontend/src/assets/models/saturn.webp
frontend/src/assets/models/uranus.webp
frontend/src/assets/models/neptune.webp
```

원본 PNG를 보존할 경우 같은 이름의 `.png`를 함께 둔다.

---

## Shared Core Style Prompt

아래 공통 스타일 프롬프트를 먼저 사용하고, 이어서 각 행성별 subject prompt를 붙인다.

```text
Create a standalone cute mobile game planet icon in the same visual language as a simple kawaii Earth sticker: thick smooth black outer outline, rounded cartoon surface shapes, clean pastel color fills, minimal soft shading, highly readable silhouette, centered square composition, friendly toy-like mobile game icon quality.

The asset should feel simple, bright, and child-friendly. Use bold shapes instead of realistic texture. Keep all decorative details large enough to read at small icon sizes. Use subtle inner gradients only for soft volume; keep the main look flat, clean, and graphic.

Composition: one single celestial body only, perfectly centered, generous padding, fully visible, no crop.

Face rule: planets may have two black dot eyes and a tiny curved smile. The Sun can be made without eyes or mouth if a cleaner asset is preferred.

Transparent output workflow: generate on a perfectly flat solid chroma-key background, then remove the background to alpha. The background must be one uniform color with no shadows, gradients, texture, floor, reflection, or lighting variation.

Avoid: text, watermark, frame, background scenery, cast shadow, contact shadow, extra props, satellites, unrelated characters, realistic high-detail texture, noisy lighting, thin outlines, complex small details.
```

---

## Chroma-Key Background Add-On

투명 배경 최종 파일이 필요하면 각 프롬프트 마지막에 아래 문장을 붙인다.

```text
Create the subject on a perfectly flat solid #ff00ff chroma-key background for background removal. The background must be uniform with no shadows, gradients, texture, floor, reflection, or lighting variation. Do not use #ff00ff anywhere in the subject.
```

---

## Per-Planet Subject Prompts

### SUN

```text
Sun: A perfectly centered spherical stylized Sun with no eyes and no mouth, bright warm yellow and orange bands, simple rounded flame bumps around the edge, smooth black outline, cheerful toy-like design.
```

### MERCURY

```text
Mercury: A small gray rocky spherical planet with large rounded crater patches, dark gray and light gray surface shapes, a few orange lava crack accents kept simple and readable, two black dot eyes, tiny curved smile.
```

### VENUS

```text
Venus: A creamy yellow and golden spherical planet with thick smooth cloud bands, simple rounded swirls, warm pastel tones, two black dot eyes, tiny curved smile.
```

### EARTH

```text
Earth: A vivid sky-blue ocean sphere with rounded light-green continents and two or three puffy white clouds, two black dot eyes, tiny curved smile.
```

### MARS

```text
Mars: A warm red-orange spherical planet with rounded darker red land patches, simple crater marks, a few pale dust-storm swirl shapes, two black dot eyes, tiny curved smile.
```

### JUPITER

```text
Jupiter: A large tan and orange striped gas giant sphere with rounded horizontal cloud bands, a simple red oval storm spot, two black dot eyes, tiny curved smile.
```

### SATURN

```text
Saturn: A pale yellow spherical planet with simple warm bands and one thick black-outlined flat ring crossing behind and in front of the planet, two black dot eyes, tiny curved smile. Keep the ring inside the same single icon and fully visible.
```

### URANUS

```text
Uranus: A soft mint-cyan spherical ice planet with a few very subtle rounded pale bands and small simple highlight shapes, two black dot eyes, tiny curved smile.
```

### NEPTUNE

```text
Neptune: A deep blue spherical ice giant with rounded navy and cyan cloud bands, a simple lighter storm swirl, two black dot eyes, tiny curved smile.
```

---

## Full Prompt Template

이미지 생성 시 아래 형식으로 조합한다.

```text
[Shared Core Style Prompt]

[Per-Planet Subject Prompt]

[Chroma-Key Background Add-On]
```

예시:

```text
Create a standalone cute mobile game planet icon in the same visual language as a simple kawaii Earth sticker: thick smooth black outer outline, rounded cartoon surface shapes, clean pastel color fills, minimal soft shading, highly readable silhouette, centered square composition, friendly toy-like mobile game icon quality.

The asset should feel simple, bright, and child-friendly. Use bold shapes instead of realistic texture. Keep all decorative details large enough to read at small icon sizes. Use subtle inner gradients only for soft volume; keep the main look flat, clean, and graphic.

Composition: one single celestial body only, perfectly centered, generous padding, fully visible, no crop.

Face rule: planets may have two black dot eyes and a tiny curved smile. The Sun can be made without eyes or mouth if a cleaner asset is preferred.

Transparent output workflow: generate on a perfectly flat solid chroma-key background, then remove the background to alpha. The background must be one uniform color with no shadows, gradients, texture, floor, reflection, or lighting variation.

Avoid: text, watermark, frame, background scenery, cast shadow, contact shadow, extra props, satellites, unrelated characters, realistic high-detail texture, noisy lighting, thin outlines, complex small details.

Earth: A vivid sky-blue ocean sphere with rounded light-green continents and two or three puffy white clouds, two black dot eyes, tiny curved smile.

Create the subject on a perfectly flat solid #ff00ff chroma-key background for background removal. The background must be uniform with no shadows, gradients, texture, floor, reflection, or lighting variation. Do not use #ff00ff anywhere in the subject.
```

---

## Frontend Usage Notes

- 생성 이미지는 먼저 PNG로 저장한다.
- `#ff00ff` 배경을 제거해 alpha PNG를 만든다.
- 최종 배포용은 WebP로 변환한다.
- 행성은 프론트에서 회전/공전 애니메이션을 적용하므로 이미지 자체에는 궤도선, 별 배경, 그림자, 프레임을 넣지 않는다.
- 같은 세트처럼 보이도록 9개 모두 같은 프롬프트 구조와 같은 이미지 비율을 사용한다.

