export interface NavChapter {
  id: string;
  index: string;
  label: string;
}

export interface PerformanceSpec {
  index: string;
  value: string;
  unit: string;
  label: string;
  detail: string;
}

export const NAV_CHAPTERS: readonly NavChapter[] = [
  { id: 'scene-hero', index: '01', label: 'HERO' },
  { id: 'scene-exterior', index: '02', label: 'EXTERIOR' },
  { id: 'scene-front', index: '03', label: 'OPTICS' },
  { id: 'scene-side', index: '04', label: 'PROFILE' },
  { id: 'scene-rear', index: '05', label: 'REAR' },
  { id: 'scene-driving', index: '06', label: 'DYNAMICS' },
  { id: 'scene-performance', index: '07', label: 'POWER' },
  { id: 'scene-closing', index: '08', label: 'DISCOVER' },
] as const;

/**
 * Scene 1: Dramatic Full-Screen BMW Hero
 */
export const SCENE_1_HERO = {
  id: 'scene-hero',
  index: '01 / 08',
  kicker: 'THE BMW M4 COUPÉ · G82',
  headlineTop: 'SHEER DRIVING',
  headlineBottom: 'PLEASURE.',
  subline: 'Sculpted in Munich. Honed on the Nürburgring Nordschleife.',
  image: '/campaign/m4-hero-studio.jpg',
  alt: 'BMW M4 G82 Coupé in dark studio lighting with forged wheels and carbon splitter',
  objectPosition: '78% 58%',
  colorGrade: 'brightness(0.88) contrast(1.14) saturate(0.90)',
};

/**
 * Scene 2: Exterior Beauty Shot with Slow Image Scaling & Parallax
 */
export const SCENE_2_EXTERIOR = {
  id: 'scene-exterior',
  index: '02 / 08',
  kicker: 'EXTERIOR SCULPTURE',
  headline: 'PROPORTION IN TENSION.',
  subline: 'Every surface is drawn tight over muscular wheel arches and functional aerodynamic ductwork.',
  caption: 'THE M4 CSL · FROZEN BROOKLYN GREY METALLIC',
  image: '/campaign/m4-csl-front.jpg',
  alt: 'BMW M4 CSL G82 exterior beauty shot in Frozen Brooklyn Grey with red accents',
  objectPosition: '54% 62%',
  colorGrade: 'brightness(0.88) contrast(1.15) saturate(0.94)',
};

/**
 * Scene 3: Front Grille & Headlight Close-Up with Cinematic Image Reveal
 */
export const SCENE_3_FRONT = {
  id: 'scene-front',
  index: '03 / 08',
  stageA: {
    kicker: 'FRONT ARCHITECTURE',
    headline: 'UNMISTAKABLE PRESENCE.',
    subline: 'Symmetrical Frozen Portimao Blue bodywork anchored by the frameless twin kidney intake.',
    tag: 'MUNICH · BMW WELT',
    image: '/campaign/m4-front-monolith.jpg',
    alt: 'BMW M4 G82 symmetrical front view in Frozen Portimao Blue at BMW Welt',
    objectPosition: '50% 44%',
    colorGrade: 'brightness(0.86) contrast(1.16) saturate(0.95)',
  },
  stageB: {
    kicker: 'OPTICAL & THERMAL PRECISION',
    headline: 'LASERLIGHT & INTAKES.',
    subline: 'Adaptive BMW Laserlight headlamps and horizontal double-louver intakes feed high-volume cooling air to the S58 core.',
    tag: 'ADAPTIVE LASERLIGHT · 550M RANGE',
    image: '/campaign/m4-detail-headlight.jpg',
    secondaryDetailImage: '/campaign/m4-detail-grille.jpg',
    alt: 'Close-up of BMW M4 G82 Laserlight headlamp and front fascia in Brooklyn Grey Metallic',
    secondaryAlt: 'Macro close-up of the BMW M4 G82 kidney grille and M4 emblem',
    objectPosition: '42% 58%',
    colorGrade: 'brightness(0.86) contrast(1.16) saturate(0.92)',
  },
};

/**
 * Scene 4: Side Profile with Long, Smooth Horizontal Image Movement
 */
export const SCENE_4_SIDE = {
  id: 'scene-side',
  index: '04 / 08',
  kicker: 'COUPÉ SILHOUETTE',
  headline: 'FASTBACK AERODYNAMICS.',
  subline: 'A long wheelbase, stretched aluminum hood, and sloping carbon-fiber roofline channel laminar flow toward the rear deck.',
  tag: 'LENGTH 4,794 MM · WHEELBASE 2,857 MM',
  image: '/campaign/m4-side-profile.jpg',
  alt: 'Full side profile of the BMW M4 Competition G82 Coupé',
  objectPosition: '50% 66%',
  colorGrade: 'brightness(0.84) contrast(1.16) saturate(0.90)',
};

/**
 * Scene 5: Rear Design & Taillight Photography with Layered Transitions
 */
export const SCENE_5_REAR = {
  id: 'scene-rear',
  index: '05 / 08',
  stageA: {
    kicker: 'REAR HAUNCHES',
    headline: 'PLANTED AUTHORITY.',
    subline: 'Flared rear fenders and staggered forged alloy wheels transfer 650 Nm of torque cleanly to the tarmac.',
    tag: 'DRAVIT GREY METALLIC · M COMPOUND BRAKES',
    image: '/campaign/m4-rear-dravit.jpg',
    alt: 'Rear three-quarter angle of the BMW M4 Competition G82 in Dravit Grey Metallic',
    objectPosition: '50% 56%',
    colorGrade: 'brightness(0.88) contrast(1.16) saturate(0.92)',
  },
  stageB: {
    kicker: 'REAR SIGNATURE',
    headline: 'LEAVE ONLY TAIL LIGHTS.',
    subline: 'Three-dimensional laser-illuminated glass threads hover above a carbon-fiber diffuser and quad 100mm titanium tailpipes.',
    tag: 'THE M4 CSL · LASER WIRE OPTICS',
    image: '/campaign/m4-rear-csl.jpg',
    alt: 'Symmetrical rear view of the BMW M4 CSL showing laser taillights and quad exhaust',
    objectPosition: '50% 86%',
    colorGrade: 'brightness(0.85) contrast(1.18) saturate(0.94)',
  },
};

/**
 * Scene 6: BMW Driving Photography with Immersive Full-Screen Imagery
 */
export const SCENE_6_DRIVING = {
  id: 'scene-driving',
  index: '06 / 08',
  kicker: 'DYNAMIC PRECISION',
  headline: 'BORN ON THE ASPHALT.',
  subline: 'Active M Differential and Adaptive M Suspension read the road every millisecond, translating driver input into immediate lateral response.',
  roadImage: '/campaign/m4-driving-asphalt.jpg',
  roadAlt: 'Isle of Man Green BMW M4 G82 driving on dark asphalt tarmac with headlights illuminated',
  roadObjectPosition: '50% 54%',
  roadColorGrade: 'brightness(0.84) contrast(1.18) saturate(0.95)',
  trackImage: '/campaign/m4-track-gt3.jpg',
  trackAlt: 'BMW M4 GT3 race car on circuit tarmac in official BMW M Motorsport livery',
  trackObjectPosition: '52% 64%',
  trackColorGrade: 'brightness(0.84) contrast(1.16) saturate(0.92)',
  trackCaption: 'DEVELOPED ALONGSIDE THE BMW M4 GT3 ENDURANCE RACER',
};

/**
 * Scene 7: Spacious Performance Section with Carefully Presented Specifications
 */
export const SCENE_7_PERFORMANCE = {
  id: 'scene-performance',
  index: '07 / 08',
  kicker: 'S58 POWERTRAIN & CHASSIS',
  headline: 'ENGINEERED WITHOUT COMPROMISE.',
  subline: 'Two mono-scroll turbochargers, forged lightweight crankshaft, and track-tested cooling architecture.',
  roofImage: '/campaign/m4-studio-aerial.jpg',
  roofAlt: 'Elevated studio view of the BMW M4 G82 exposed carbon-fiber roof and powerdome hood',
  roofObjectPosition: '50% 48%',
  roofColorGrade: 'brightness(0.88) contrast(1.15) saturate(0.88)',
  wheelImage: '/campaign/m4-detail-wheel.jpg',
  wheelAlt: 'Close-up of BMW M4 Competition G82 forged cross-spoke wheel and front splitter',
  wheelObjectPosition: '46% 68%',
  wheelColorGrade: 'brightness(0.86) contrast(1.16) saturate(0.90)',
  specs: [
    {
      index: '01',
      value: '3.0',
      unit: 'LITER',
      label: 'M TWINPOWER TURBO',
      detail: 'High-revving straight-six with closed-deck crankcase and wire-arc sprayed cylinder bores.',
    },
    {
      index: '02',
      value: '530',
      unit: 'HP / 390 KW',
      label: 'PEAK OUTPUT',
      detail: 'Sustained linear power delivery across the upper tachometer band up to 7,200 rpm.',
    },
    {
      index: '03',
      value: '3.4',
      unit: 'SECONDS',
      label: '0–100 KM/H',
      detail: '8-speed M Steptronic transmission with Drivelogic and M xDrive rear-biased all-wheel drive.',
    },
    {
      index: '04',
      value: '290',
      unit: 'KM/H',
      label: 'TOP SPEED',
      detail: 'Electronically governed with the optional M Driver’s Package and carbon-ceramic brakes.',
    },
  ] satisfies PerformanceSpec[],
};

/**
 * Scene 8: Full-Screen Closing Image with a Refined Final Reveal
 */
export const SCENE_8_CLOSING = {
  id: 'scene-closing',
  index: '08 / 08',
  kicker: 'BMW M INDIVIDUAL',
  headline: 'DISCOVER YOUR BMW M4.',
  subline: 'Commission your bespoke specification in Tanzanite Blue Metallic, Frozen Brooklyn Grey, or Isle of Man Green.',
  image: '/campaign/m4-detail-tanzanite.jpg',
  alt: 'BMW M4 Competition G82 in Tanzanite Blue Metallic with bronze forged wheels',
  objectPosition: '50% 64%',
  colorGrade: 'brightness(0.84) contrast(1.18) saturate(0.96)',
};

export function getAllCampaignImagePaths(): string[] {
  return [
    SCENE_1_HERO.image,
    SCENE_2_EXTERIOR.image,
    SCENE_3_FRONT.stageA.image,
    SCENE_3_FRONT.stageB.image,
    SCENE_3_FRONT.stageB.secondaryDetailImage,
    SCENE_4_SIDE.image,
    SCENE_5_REAR.stageA.image,
    SCENE_5_REAR.stageB.image,
    SCENE_6_DRIVING.roadImage,
    SCENE_6_DRIVING.trackImage,
    SCENE_7_PERFORMANCE.roofImage,
    SCENE_7_PERFORMANCE.wheelImage,
    SCENE_8_CLOSING.image,
  ];
}
