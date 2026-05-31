import earthWebp from '../../assets/models/earth.webp';
import jupiterWebp from '../../assets/models/jupiter.webp';
import marsWebp from '../../assets/models/mars.webp';
import mercuryWebp from '../../assets/models/mercury.webp';
import neptuneWebp from '../../assets/models/neptune.webp';
import saturnWebp from '../../assets/models/saturn.webp';
import sunWebp from '../../assets/models/sun.webp';
import uranusWebp from '../../assets/models/uranus.webp';
import venusWebp from '../../assets/models/venus.webp';
import type { PlanetType } from '../../types';

export const PLANET_ASSETS: Record<PlanetType, string> = {
  SUN: sunWebp,
  MERCURY: mercuryWebp,
  VENUS: venusWebp,
  EARTH: earthWebp,
  MARS: marsWebp,
  JUPITER: jupiterWebp,
  SATURN: saturnWebp,
  URANUS: uranusWebp,
  NEPTUNE: neptuneWebp,
};
