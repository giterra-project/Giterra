import { useEffect, useMemo, useRef, useState } from 'react';
import sunWebp from '../../assets/models/sun.webp';

interface OrbitBody {
  id: number;
  label: string;
  durationMs: number;
  orbitScale: number;
  size: number;
  phase: number;
}

interface OrbitMetrics {
  x: number;
  y: number;
  depth: number;
  scale: number;
  opacity: number;
  zIndex: number;
  blur: number;
}

interface OrbitRadii {
  radiusX: number;
  radiusY: number;
}

const TAU = Math.PI * 2;
const ORBIT_TILT_DEG = -8;
const ORBIT_TILT_RAD = (ORBIT_TILT_DEG * Math.PI) / 180;
const ORBIT_CENTER_Y_PERCENT = 52;

const ORBIT_BODIES: OrbitBody[] = [
  { id: 1, label: 'Repo Orbit 01', durationMs: 30000, orbitScale: 0.74, size: 74, phase: 0 },
  { id: 2, label: 'Repo Orbit 02', durationMs: 36000, orbitScale: 0.86, size: 88, phase: TAU / 8 },
  { id: 3, label: 'Repo Orbit 03', durationMs: 43000, orbitScale: 0.98, size: 80, phase: (TAU / 8) * 2 },
  { id: 4, label: 'Repo Orbit 04', durationMs: 50000, orbitScale: 1.1, size: 96, phase: (TAU / 8) * 3 },
  { id: 5, label: 'Repo Orbit 05', durationMs: 58000, orbitScale: 1.22, size: 78, phase: (TAU / 8) * 4 },
  { id: 6, label: 'Repo Orbit 06', durationMs: 66000, orbitScale: 1.34, size: 90, phase: (TAU / 8) * 5 },
  { id: 7, label: 'Repo Orbit 07', durationMs: 75000, orbitScale: 1.46, size: 82, phase: (TAU / 8) * 6 },
  { id: 8, label: 'Repo Orbit 08', durationMs: 86000, orbitScale: 1.58, size: 100, phase: (TAU / 8) * 7 },
];

const getOrbitRadii = (bounds: { width: number; height: number }, orbitScale: number): OrbitRadii => ({
  radiusX: Math.min(bounds.width * 0.235, 330) * orbitScale,
  radiusY: Math.min(bounds.height * 0.155, 132) * orbitScale,
});

const getOrbitMetrics = (
  elapsedMs: number,
  body: OrbitBody,
  bounds: { width: number; height: number },
): OrbitMetrics => {
  const { radiusX, radiusY } = getOrbitRadii(bounds, body.orbitScale);
  const angle = body.phase + (elapsedMs / body.durationMs) * TAU;
  const orbitX = Math.cos(angle) * radiusX;
  const orbitY = Math.sin(angle) * radiusY;
  const x = orbitX * Math.cos(ORBIT_TILT_RAD) - orbitY * Math.sin(ORBIT_TILT_RAD);
  const y = orbitX * Math.sin(ORBIT_TILT_RAD) + orbitY * Math.cos(ORBIT_TILT_RAD);
  const depth = (Math.sin(angle) + 1) / 2;

  return {
    x,
    y,
    depth,
    scale: 0.86 + depth * 0.22,
    opacity: 0.48 + depth * 0.52,
    zIndex: Math.round(8 + depth * 42),
    blur: (1 - depth) * 1.2,
  };
};

const GalaxyOrbitPreview = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bounds, setBounds] = useState({ width: 1280, height: 720 });
  const [activeBodyId, setActiveBodyId] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const syncBounds = () => {
      const rect = element.getBoundingClientRect();
      setBounds({ width: rect.width, height: rect.height });
    };

    syncBounds();
    const observer = new ResizeObserver(syncBounds);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frameId = 0;

    const tick = (now: number) => {
      startRef.current ??= now;
      setElapsedMs(now - startRef.current);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  const orbitRings = useMemo(() => ORBIT_BODIES.map((body) => body.orbitScale), []);
  const activeBody = ORBIT_BODIES.find((body) => body.id === activeBodyId);
  const orbitCenterX = bounds.width / 2;
  const orbitCenterY = bounds.height * (ORBIT_CENTER_Y_PERCENT / 100);

  return (
    <section ref={containerRef} className="galaxy-orbit-stage" aria-label="Giterra 2.5D galaxy orbit prototype">
      <div className="galaxy-nebula" />
      <div className="galaxy-copy">
        <span className="galaxy-kicker">2.5D Galaxy Prototype</span>
        <h1>중앙 태양을 기준으로 8개의 레포 행성이 공전합니다.</h1>
        <p>모든 궤도체는 같은 WebP 태양 에셋을 사용하고, 속도·크기·깊이만 다르게 둔 가벼운 로딩 테스트입니다.</p>
      </div>

      <div className="galaxy-system" aria-hidden="true">
        <svg className="galaxy-orbit-svg" viewBox={`0 0 ${bounds.width} ${bounds.height}`} preserveAspectRatio="none">
          <g transform={`rotate(${ORBIT_TILT_DEG} ${orbitCenterX} ${orbitCenterY})`}>
            {orbitRings.map((orbitScale, index) => {
              const { radiusX, radiusY } = getOrbitRadii(bounds, orbitScale);
              return (
                <ellipse
                  key={orbitScale}
                  className="galaxy-orbit-ellipse"
                  cx={orbitCenterX}
                  cy={orbitCenterY}
                  rx={radiusX}
                  ry={radiusY}
                  opacity={0.26 + index * 0.012}
                />
              );
            })}
          </g>
        </svg>

        <div className="galaxy-center-sun">
          <img src={sunWebp} alt="Central sun" draggable={false} />
        </div>

        {ORBIT_BODIES.map((body) => {
          const metrics = getOrbitMetrics(elapsedMs, body, bounds);
          const isActive = activeBodyId === body.id;

          return (
            <button
              key={body.id}
              className="galaxy-orbit-body"
              type="button"
              onMouseEnter={() => setActiveBodyId(body.id)}
              onMouseLeave={() => setActiveBodyId(null)}
              onFocus={() => setActiveBodyId(body.id)}
              onBlur={() => setActiveBodyId(null)}
              style={{
                width: body.size,
                height: body.size,
                left: `calc(50% + ${metrics.x}px)`,
                top: `calc(${ORBIT_CENTER_Y_PERCENT}% + ${metrics.y}px)`,
                zIndex: isActive ? 70 : metrics.zIndex,
                opacity: metrics.opacity,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${body.label} sun-like planet`}
            >
              <span
                className="galaxy-orbit-body-visual"
                style={{
                  filter: `brightness(${0.72 + metrics.depth * 0.42}) blur(${metrics.blur}px)`,
                  transform: `scale(${metrics.scale * (isActive ? 1.06 : 1)})`,
                }}
              >
                <img src={sunWebp} alt="" draggable={false} />
                <span>{body.id}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="galaxy-status-panel">
        <span>Active orbit</span>
        <strong>{activeBody ? activeBody.label : 'Hover a sun'}</strong>
        <p>{activeBody ? `${Math.round(activeBody.durationMs / 1000)}초 주기로 공전` : '각 태양은 서로 다른 속도로 공전 중입니다.'}</p>
      </div>
    </section>
  );
};

export default GalaxyOrbitPreview;
