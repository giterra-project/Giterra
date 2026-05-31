import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { PLANET_ASSETS } from './planetAssets';
import { ORBIT_PLANET_TYPES, PLANET_TYPE_LABELS } from '../../types';
import type { PlanetType } from '../../types';

export interface GalaxyRepoPlanet {
  repoId: number;
  repoName: string;
  planetType: Exclude<PlanetType, 'SUN'>;
}

interface OrbitBody {
  id: number;
  planetType: Exclude<PlanetType, 'SUN'>;
  label: string;
  repoId?: number;
  repoName?: string;
  orbitPlanetType: Exclude<PlanetType, 'SUN'>;
  durationMs: number;
  orbitScale: number;
  size: number;
  phase: number;
  glowColor: string;
}

interface OrbitMetrics {
  x: number;
  y: number;
  depth: number;
  scale: number;
  zIndex: number;
}

interface OrbitRadii {
  radiusX: number;
  radiusY: number;
}

const TAU = Math.PI * 2;
const ORBIT_TILT_DEG = -8;
const ORBIT_TILT_RAD = (ORBIT_TILT_DEG * Math.PI) / 180;
const ORBIT_CENTER_Y_PERCENT = 51;

const ORBIT_BODY_CONFIGS = [
  { durationMs: 30000, orbitScale: 0.82, size: 68, phase: 0, glowColor: 'rgba(148, 163, 184, 0.34)' },
  { durationMs: 38500, orbitScale: 0.94, size: 80, phase: TAU / 8, glowColor: 'rgba(250, 204, 21, 0.36)' },
  { durationMs: 48500, orbitScale: 1.06, size: 88, phase: (TAU / 8) * 2, glowColor: 'rgba(56, 189, 248, 0.36)' },
  { durationMs: 61000, orbitScale: 1.18, size: 82, phase: (TAU / 8) * 3, glowColor: 'rgba(248, 113, 113, 0.36)' },
  { durationMs: 96000, orbitScale: 1.31, size: 110, phase: (TAU / 8) * 4, glowColor: 'rgba(251, 146, 60, 0.34)' },
  { durationMs: 124000, orbitScale: 1.44, size: 124, phase: (TAU / 8) * 5, glowColor: 'rgba(253, 224, 71, 0.32)' },
  { durationMs: 169000, orbitScale: 1.56, size: 94, phase: (TAU / 8) * 6, glowColor: 'rgba(45, 212, 191, 0.34)' },
  { durationMs: 190000, orbitScale: 1.66, size: 98, phase: (TAU / 8) * 7, glowColor: 'rgba(59, 130, 246, 0.34)' },
];

const PLANET_ROTATION_CONFIGS: Record<PlanetType, { spinDurationMs: number; axisTiltDeg: number; reverse?: boolean }> = {
  SUN: { spinDurationMs: 36000, axisTiltDeg: 7.25 },
  MERCURY: { spinDurationMs: 42000, axisTiltDeg: 0.03 },
  VENUS: { spinDurationMs: 56000, axisTiltDeg: 177.4, reverse: true },
  EARTH: { spinDurationMs: 10000, axisTiltDeg: 23.44 },
  MARS: { spinDurationMs: 10300, axisTiltDeg: 25.19 },
  JUPITER: { spinDurationMs: 5200, axisTiltDeg: 3.13 },
  SATURN: { spinDurationMs: 5800, axisTiltDeg: 26.73 },
  URANUS: { spinDurationMs: 8500, axisTiltDeg: 97.77, reverse: true },
  NEPTUNE: { spinDurationMs: 7500, axisTiltDeg: 28.32 },
};

const DEFAULT_ORBIT_BODIES: OrbitBody[] = ORBIT_PLANET_TYPES.map((planetType, index) => ({
  id: index + 1,
  planetType,
  orbitPlanetType: planetType,
  label: PLANET_TYPE_LABELS[planetType],
  ...ORBIT_BODY_CONFIGS[index],
}));

const getOrbitRadii = (bounds: { width: number; height: number }, orbitScale: number): OrbitRadii => ({
  radiusX: Math.min(bounds.width * 0.275, 420) * orbitScale,
  radiusY: Math.min(bounds.height * 0.19, 172) * orbitScale,
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
    scale: 0.94 + depth * 0.12,
    zIndex: Math.round(8 + depth * 42),
  };
};

interface GalaxyOrbitPreviewProps {
  planets?: Array<GalaxyRepoPlanet | null>;
  paused?: boolean;
  showDefaultBodies?: boolean;
}

const GalaxyOrbitPreview = ({ planets = [], paused = false, showDefaultBodies = true }: GalaxyOrbitPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const pausedAccumulatedMsRef = useRef(0);
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
    if (paused) {
      pauseStartedAtRef.current ??= performance.now();
      return;
    }

    if (pauseStartedAtRef.current !== null) {
      pausedAccumulatedMsRef.current += performance.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }

    let frameId = 0;

    const tick = (now: number) => {
      startRef.current ??= now;
      setElapsedMs(now - startRef.current - pausedAccumulatedMsRef.current);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [paused]);

  const orbitBodies = useMemo<OrbitBody[]>(
    () =>
      DEFAULT_ORBIT_BODIES.map((body, index) => {
        const planet = planets[index];
        if (!planet) return body;

        return {
          ...body,
          repoId: planet.repoId,
          planetType: planet.planetType,
          label: PLANET_TYPE_LABELS[planet.planetType],
          repoName: planet.repoName,
        };
      }),
    [planets],
  );

  const orbitRings = useMemo(() => DEFAULT_ORBIT_BODIES.map((body) => body.orbitScale), []);
  const activeBody = orbitBodies.find((body) => body.id === activeBodyId);
  const placedCount = planets.filter(Boolean).length;
  const orbitCenterX = bounds.width / 2;
  const orbitCenterY = bounds.height * (ORBIT_CENTER_Y_PERCENT / 100);

  return (
    <section ref={containerRef} className="galaxy-orbit-stage" aria-label="Giterra 2.5D galaxy orbit prototype">
      <div className="galaxy-nebula" />

      <div className="galaxy-system">
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
          <span
            className="galaxy-orbit-body-axis"
            style={{ '--planet-axis-tilt': `${PLANET_ROTATION_CONFIGS.SUN.axisTiltDeg}deg` } as CSSProperties}
          >
            <img
              src={PLANET_ASSETS.SUN}
              alt={PLANET_TYPE_LABELS.SUN}
              draggable={false}
              style={{ '--planet-spin-duration': `${PLANET_ROTATION_CONFIGS.SUN.spinDurationMs}ms` } as CSSProperties}
            />
          </span>
        </div>

        {orbitBodies.map((body, index) => {
          const planet = planets[index];
          if (!showDefaultBodies && !planet) return null;

          const metrics = getOrbitMetrics(elapsedMs, body, bounds);
          const isActive = activeBodyId === body.id;
          const rotation = PLANET_ROTATION_CONFIGS[body.planetType];
          const bodyStyle = {
            width: body.size,
            height: body.size,
            left: `calc(50% + ${metrics.x}px)`,
            top: `calc(${ORBIT_CENTER_Y_PERCENT}% + ${metrics.y}px)`,
            zIndex: isActive ? 70 : metrics.zIndex,
            transform: 'translate(-50%, -50%)',
            '--planet-glow': body.glowColor,
          } as CSSProperties;

          return (
            <button
              key={body.id}
              className="galaxy-orbit-body"
              type="button"
              onMouseEnter={() => setActiveBodyId(body.id)}
              onMouseLeave={() => setActiveBodyId(null)}
              onFocus={() => setActiveBodyId(body.id)}
              onBlur={() => setActiveBodyId(null)}
              style={bodyStyle}
              aria-label={`${body.label} 레포 행성`}
            >
              <span
                className="galaxy-orbit-body-visual"
                style={{
                  filter: 'brightness(1.06)',
                  transform: `scale(${metrics.scale * (isActive ? 1.06 : 1)})`,
                }}
              >
                <span
                  className="galaxy-orbit-body-axis"
                  style={{ '--planet-axis-tilt': `${rotation.axisTiltDeg}deg` } as CSSProperties}
                >
                  <img
                    src={PLANET_ASSETS[body.planetType]}
                    alt=""
                    draggable={false}
                    style={
                      {
                        '--planet-spin-duration': `${rotation.spinDurationMs}ms`,
                        '--planet-spin-direction': rotation.reverse ? 'reverse' : 'normal',
                      } as CSSProperties
                    }
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="galaxy-status-panel">
        <span>{paused ? 'Placement mode' : 'Active orbit'}</span>
        <strong>{activeBody ? (activeBody.repoName ?? activeBody.label) : paused ? '공전 일시정지' : 'Hover a planet'}</strong>
        <p>
          {paused
            ? `${placedCount}/8개 행성 배치 중입니다. 체크 저장 후 한 번에 반영됩니다.`
            : activeBody
              ? `${Math.round(activeBody.durationMs / 1000)}초 주기로 공전`
              : '각 행성은 서로 다른 속도로 공전 중입니다.'}
        </p>
      </div>
    </section>
  );
};

export default GalaxyOrbitPreview;
