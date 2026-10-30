export interface ScrollSceneDefinition {
  id: string;
  index: string;
  sceneNumber: number;
  navCategory: 'design' | 'interior' | 'performance' | 'explore';
  title: string;
  kicker: string;
  subtitle: string;
  startProgress: number;
  endProgress: number;
}

export interface ScrollKinematicState {
  progress: number;
  activeSceneIndex: number;
  activeScene: ScrollSceneDefinition;
  sceneLocalProgress: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraFov: number;
  driverDoorAngleRad: number;
  driverDoorAngleDeg: number;
  hoodAngleRad: number;
  hoodAngleDeg: number;
  doorUnlocked: boolean;
  unlockFlashIntensity: number;
  steeringWheelAngleRad: number;
  steeringWheelAngleDeg: number;
  wheelRotationRad: number;
  cabinLightIntensity: number;
  engineLightIntensity: number;
  headlightIntensity: number;
  taillightIntensity: number;
  isCameraInsideCabin: boolean;
}

export interface PaintFinishOption {
  id: string;
  name: string;
  code: string;
  hex: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export interface InteriorTrimOption {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  stitchHex: string;
}

export const MAX_DOOR_ANGLE_DEG = 65;
export const MAX_DOOR_ANGLE_RAD = (MAX_DOOR_ANGLE_DEG * Math.PI) / 180; // ~1.134464 rad
export const MAX_HOOD_ANGLE_DEG = 38;
export const MAX_HOOD_ANGLE_RAD = (MAX_HOOD_ANGLE_DEG * Math.PI) / 180; // ~0.663225 rad

export const PAINT_FINISHES: PaintFinishOption[] = [
  {
    id: 'black-sapphire',
    name: 'Black Sapphire Metallic',
    code: '475',
    hex: '#0E1218',
    metalness: 0.88,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'brooklyn-grey',
    name: 'M Brooklyn Grey Metallic',
    code: 'C4P',
    hex: '#6D747C',
    metalness: 0.78,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'sky-scraper-grey',
    name: 'Skyscraper Grey Metallic',
    code: 'C4W',
    hex: '#4A525D',
    metalness: 0.90,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'frozen-deep-grey',
    name: 'Frozen Deep Grey Matte',
    code: 'P7X',
    hex: '#2B3038',
    metalness: 0.82,
    roughness: 0.34,
    clearcoat: 0.22,
    clearcoatRoughness: 0.28,
  },
  {
    id: 'isle-of-man-green',
    name: 'Isle of Man Green Metallic',
    code: 'C4G',
    hex: '#0A4834',
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
  },
  {
    id: 'sao-paulo-yellow',
    name: 'São Paulo Yellow',
    code: 'C4H',
    hex: '#C8D61E',
    metalness: 0.35,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
  },
  {
    id: 'portimao-blue',
    name: 'M Portimão Blue Metallic',
    code: 'C31',
    hex: '#123C8C',
    metalness: 0.86,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'tanzanite-blue',
    name: 'Tanzanite Blue II Metallic',
    code: 'C3Z',
    hex: '#0F2547',
    metalness: 0.86,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'toronto-red',
    name: 'Toronto Red Metallic',
    code: 'C36',
    hex: '#9E1B18',
    metalness: 0.84,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'aventurine-red',
    name: 'Aventurine Red III Metallic',
    code: 'C57',
    hex: '#5E1116',
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
  },
  {
    id: 'techno-violet',
    name: 'Individual Techno Violet Metallic',
    code: '299',
    hex: '#351852',
    metalness: 0.87,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  },
  {
    id: 'alpine-white',
    name: 'Alpine White III',
    code: '300',
    hex: '#E4E8EE',
    metalness: 0.28,
    roughness: 0.13,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  },
];

export const INTERIOR_TRIMS: InteriorTrimOption[] = [
  {
    id: 'kyalami-orange',
    name: 'Kyalami Orange / Black Merino',
    primaryHex: '#C25620',
    secondaryHex: '#12151A',
    stitchHex: '#E57A44',
  },
  {
    id: 'yas-marina-blue',
    name: 'Yas Marina Blue / Black Merino',
    primaryHex: '#286490',
    secondaryHex: '#13171E',
    stitchHex: '#E2CA3A',
  },
  {
    id: 'fiona-red',
    name: 'Fiona Red / Black Individual Merino',
    primaryHex: '#8F1D24',
    secondaryHex: '#12151A',
    stitchHex: '#C8323A',
  },
  {
    id: 'tartufo-brown',
    name: 'Individual Tartufo Full Merino',
    primaryHex: '#6E4228',
    secondaryHex: '#161412',
    stitchHex: '#A87654',
  },
  {
    id: 'silverstone-ivory',
    name: 'Silverstone / Black Merino',
    primaryHex: '#C5CBD4',
    secondaryHex: '#12151A',
    stitchHex: '#FFFFFF',
  },
  {
    id: 'obsidian-black',
    name: 'Full Merino Anthracite Black',
    primaryHex: '#242932',
    secondaryHex: '#101317',
    stitchHex: '#1C69D4',
  },
];

export const SCROLL_SCENES: ScrollSceneDefinition[] = [
  {
    id: 'scene-arrival',
    index: '01',
    sceneNumber: 1,
    navCategory: 'design',
    title: 'M4 Competition.',
    kicker: '01 / SILHOUETTE',
    subtitle: 'Sculpted in dark studio light.',
    startProgress: 0.0,
    endProgress: 0.13,
  },
  {
    id: 'scene-front-design',
    index: '02',
    sceneNumber: 2,
    navCategory: 'design',
    title: 'Precision Optics.',
    kicker: '02 / FRONT DESIGN',
    subtitle: 'Frameless kidney grille and adaptive Laserlight headlights.',
    startProgress: 0.13,
    endProgress: 0.26,
  },
  {
    id: 'scene-side-wheels',
    index: '03',
    sceneNumber: 3,
    navCategory: 'design',
    title: 'Forged Stance.',
    kicker: '03 / PROFILE & WHEELS',
    subtitle: '826M forged alloy wheels over M Compound gold calipers.',
    startProgress: 0.26,
    endProgress: 0.40,
  },
  {
    id: 'scene-door-opens',
    index: '04',
    sceneNumber: 4,
    navCategory: 'interior',
    title: 'Open the Cabin.',
    kicker: '04 / HINGE KINEMATICS',
    subtitle: 'The frameless driver door swings outward along its A-pillar hinge.',
    startProgress: 0.40,
    endProgress: 0.54,
  },
  {
    id: 'scene-interior-cockpit',
    index: '05',
    sceneNumber: 5,
    navCategory: 'interior',
    title: 'Sculpted Cockpit.',
    kicker: '05 / INTERIOR ARCHITECTURE',
    subtitle: 'M Carbon Bucket leather seats, curved display, and M steering wheel.',
    startProgress: 0.54,
    endProgress: 0.70,
  },
  {
    id: 'scene-performance-s58',
    index: '06',
    sceneNumber: 6,
    navCategory: 'performance',
    title: 'S58 TwinPower Turbo.',
    kicker: '06 / PERFORMANCE',
    subtitle: '3.0-liter inline-six · 530 HP · 650 Nm beneath the twin-dome hood.',
    startProgress: 0.70,
    endProgress: 0.85,
  },
  {
    id: 'scene-rear-explore',
    index: '07',
    sceneNumber: 7,
    navCategory: 'explore',
    title: 'Pure Driving Form.',
    kicker: '07 / REAR DESIGN & STUDIO',
    subtitle: 'Laser filigree taillights, carbon diffuser, and interactive studio.',
    startProgress: 0.85,
    endProgress: 1.0,
  },
];

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function smootherstep01(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Computes the double-flash central-locking unlock indicator intensity when the driver's door unlatches
 * at the start of Scene 4 (p = 0.40..0.43).
 */
export function computeUnlockFlashIntensity(progress: number): number {
  const p = clamp01(progress);
  if (p >= 0.395 && p <= 0.41) {
    const local = (p - 0.395) / (0.41 - 0.395);
    return Math.sin(local * Math.PI);
  }
  if (p >= 0.414 && p <= 0.429) {
    const local = (p - 0.414) / (0.429 - 0.414);
    return Math.sin(local * Math.PI);
  }
  return 0;
}

interface CameraKeyframe {
  p: number;
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  // 0.00: Scene 1 Start — Dramatic front-left three-quarter opening hero
  {
    p: 0.0,
    pos: [3.35, 1.16, 3.55],
    target: [0.0, 0.58, 0.20],
    fov: 33,
  },
  // 0.13: Scene 1 End / Scene 2 Start — Approaching front three-quarter
  {
    p: 0.13,
    pos: [1.95, 0.92, 3.85],
    target: [0.0, 0.56, 0.95],
    fov: 32,
  },
  // 0.21: Scene 2 Mid — Commanding low front design study (kidney grille & Laserlight DRLs)
  {
    p: 0.21,
    pos: [0.68, 0.78, 3.92],
    target: [0.0, 0.55, 1.25],
    fov: 31,
  },
  // 0.28: Scene 3 Start — Sweeping around front fender to side profile
  {
    p: 0.28,
    pos: [3.42, 0.96, 0.65],
    target: [0.0, 0.62, 0.15],
    fov: 33,
  },
  // 0.36: Scene 3 Mid — Close-up study of 826M forged wheel & gold brake caliper
  {
    p: 0.36,
    pos: [2.18, 0.66, 1.32],
    target: [0.65, 0.46, 1.22],
    fov: 32,
  },
  // 0.40: Scene 4 Start — Driver's side dolly framing the door before unlatching
  {
    p: 0.40,
    pos: [2.52, 1.14, 0.85],
    target: [0.32, 0.74, 0.22],
    fov: 35,
  },
  // 0.52: Scene 4 End — Full view of the 3D driver's door swinging wide open (65°) on its A-pillar hinge
  {
    p: 0.52,
    pos: [2.62, 1.15, 0.22],
    target: [0.34, 0.76, 0.22],
    fov: 36,
  },
  // 0.57: Scene 5 Start — Moving closer to the open doorway to reveal the cabin
  {
    p: 0.57,
    pos: [1.46, 1.09, -0.20],
    target: [0.24, 0.82, 0.30],
    fov: 40,
  },
  // 0.61: Scene 5 Mid-A — Gliding cleanly through open doorway threshold into driver seat
  {
    p: 0.61,
    pos: [0.68, 1.05, -0.18],
    target: [0.32, 0.86, 0.44],
    fov: 48,
  },
  // 0.66: Scene 5 Mid-B — Inside cockpit inspecting steering wheel, curved display & leather seats
  {
    p: 0.66,
    pos: [0.35, 1.01, -0.08],
    target: [0.18, 0.86, 0.52],
    fov: 52,
  },
  // 0.71: Scene 6 Start — Exiting cleanly back through open doorway before door closes
  {
    p: 0.71,
    pos: [1.42, 1.12, -0.22],
    target: [0.26, 0.80, 0.25],
    fov: 40,
  },
  // 0.76: Scene 6 Mid-A — Arcing to front-left as door closes and S58 hood begins opening
  {
    p: 0.76,
    pos: [2.25, 1.38, 2.25],
    target: [0.0, 0.76, 1.15],
    fov: 35,
  },
  // 0.82: Scene 6 Mid-B — Elevated view into the open S58 TwinPower Turbo engine bay
  {
    p: 0.82,
    pos: [1.55, 1.48, 2.55],
    target: [0.0, 0.74, 1.32],
    fov: 34,
  },
  // 0.89: Scene 7 Mid-A — Sweeping to Rear Three-Quarter Design (L-shaped laser taillights & diffuser)
  {
    p: 0.89,
    pos: [2.58, 1.06, -3.65],
    target: [0.0, 0.62, -0.25],
    fov: 34,
  },
  // 0.95: Scene 7 Mid-B — Orbiting along driver flank toward final showcase
  {
    p: 0.95,
    pos: [3.45, 1.15, 0.55],
    target: [0.0, 0.60, 0.10],
    fov: 34,
  },
  // 1.00: Scene 7 End — Final Commanding Studio Showcase
  {
    p: 1.0,
    pos: [3.10, 1.14, 3.65],
    target: [0.0, 0.58, 0.15],
    fov: 34,
  },
];

export function computeScrollKinematicState(
  rawProgress: number,
  isMobile = false
): ScrollKinematicState {
  const p = clamp01(rawProgress);

  // 1. Identify active scene and local progress
  let activeSceneIndex = 0;
  for (let i = 0; i < SCROLL_SCENES.length; i++) {
    const s = SCROLL_SCENES[i];
    if (p >= s.startProgress && (p <= s.endProgress || i === SCROLL_SCENES.length - 1)) {
      activeSceneIndex = i;
      break;
    }
  }
  const activeScene = SCROLL_SCENES[activeSceneIndex];
  const sceneSpan = Math.max(0.0001, activeScene.endProgress - activeScene.startProgress);
  const sceneLocalProgress = clamp01((p - activeScene.startProgress) / sceneSpan);

  // 2. Interpolate camera position, target, and FOV across CAMERA_KEYFRAMES
  let k0 = CAMERA_KEYFRAMES[0];
  let k1 = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    if (p >= CAMERA_KEYFRAMES[i].p && p <= CAMERA_KEYFRAMES[i + 1].p) {
      k0 = CAMERA_KEYFRAMES[i];
      k1 = CAMERA_KEYFRAMES[i + 1];
      break;
    }
  }
  const segSpan = Math.max(0.0001, k1.p - k0.p);
  const segT = smootherstep01((p - k0.p) / segSpan);

  const cameraPosition = lerpVec3(k0.pos, k1.pos, segT);
  const cameraTarget = lerpVec3(k0.target, k1.target, segT);
  let cameraFov = lerp(k0.fov, k1.fov, segT);

  const isCameraInsideCabin = p >= 0.56 && p <= 0.69;
  if (isMobile && !isCameraInsideCabin) {
    cameraPosition[0] *= 1.14;
    cameraPosition[2] *= 1.14;
    cameraFov = Math.min(52, cameraFov + 4);
  }

  // 3. Driver's Door Hinge Kinematics:
  // - 0.00..0.40: Door closed (0°)
  // - 0.40..0.42: Central lock unlatches (0° -> 3.5°)
  // - 0.42..0.54: Progressive outward swing along A-pillar hinge (3.5° -> 65°)
  // - 0.54..0.71: Held open at 65° while camera enters, inspects, and exits cabin
  // - 0.71..0.76: Smoothly closes (65° -> 0°) once camera is outside
  let doorOpenFactor = 0;
  if (p < 0.40) {
    doorOpenFactor = 0;
  } else if (p >= 0.40 && p < 0.42) {
    const unlatchT = smoothstep01((p - 0.40) / (0.42 - 0.40));
    doorOpenFactor = unlatchT * 0.055;
  } else if (p >= 0.42 && p < 0.54) {
    const swingT = smootherstep01((p - 0.42) / (0.54 - 0.42));
    doorOpenFactor = 0.055 + swingT * 0.945;
  } else if (p >= 0.54 && p < 0.71) {
    doorOpenFactor = 1;
  } else if (p >= 0.71 && p <= 0.76) {
    doorOpenFactor = 1 - smootherstep01((p - 0.71) / (0.76 - 0.71));
  } else {
    doorOpenFactor = 0;
  }

  const doorUnlocked = p >= 0.40 && p <= 0.755;
  const unlockFlashIntensity = computeUnlockFlashIntensity(p);

  const driverDoorAngleDeg = +(doorOpenFactor * MAX_DOOR_ANGLE_DEG).toFixed(2);
  const driverDoorAngleRad = doorOpenFactor * MAX_DOOR_ANGLE_RAD;

  // 4. Hood Hinge Kinematics for Scene 6 Performance Visualization (p = 0.73..0.86)
  let hoodOpenFactor = 0;
  if (p >= 0.73 && p < 0.79) {
    hoodOpenFactor = smootherstep01((p - 0.73) / (0.79 - 0.73));
  } else if (p >= 0.79 && p < 0.83) {
    hoodOpenFactor = 1;
  } else if (p >= 0.83 && p <= 0.87) {
    hoodOpenFactor = 1 - smootherstep01((p - 0.83) / (0.87 - 0.83));
  }
  const hoodAngleDeg = +(hoodOpenFactor * MAX_HOOD_ANGLE_DEG).toFixed(2);
  const hoodAngleRad = hoodOpenFactor * MAX_HOOD_ANGLE_RAD;

  // 5. Steering Wheel Angle during Scene 5 Interior Inspection
  let steeringWheelAngleDeg = 0;
  if (p >= 0.56 && p <= 0.70) {
    const steerPhase = (p - 0.56) / (0.70 - 0.56);
    steeringWheelAngleDeg = +(Math.sin(steerPhase * Math.PI * 2) * 22).toFixed(2);
  }
  const steeringWheelAngleRad = (steeringWheelAngleDeg * Math.PI) / 180;

  const wheelRotationRad = 0;

  // 6. Controlled Studio Lighting Intensities
  const cabinLightIntensity = lerp(0.15, 1.45, doorOpenFactor);
  const engineLightIntensity = lerp(0.0, 2.2, hoodOpenFactor);
  const headlightIntensity =
    (p < 0.13 ? lerp(1.1, 1.85, smootherstep01(p / 0.13)) : 1.85) +
    unlockFlashIntensity * 1.1;
  const taillightIntensity =
    (p >= 0.84 ? lerp(1.3, 2.3, smootherstep01((p - 0.84) / 0.08)) : 1.3) +
    unlockFlashIntensity * 1.1;

  return {
    progress: p,
    activeSceneIndex,
    activeScene,
    sceneLocalProgress,
    cameraPosition,
    cameraTarget,
    cameraFov,
    driverDoorAngleRad,
    driverDoorAngleDeg,
    hoodAngleRad,
    hoodAngleDeg,
    doorUnlocked,
    unlockFlashIntensity,
    steeringWheelAngleRad,
    steeringWheelAngleDeg,
    wheelRotationRad,
    cabinLightIntensity,
    engineLightIntensity,
    headlightIntensity,
    taillightIntensity,
    isCameraInsideCabin,
  };
}
