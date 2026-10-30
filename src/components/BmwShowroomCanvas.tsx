import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  InteriorTrimOption,
  PaintFinishOption,
  ScrollKinematicState,
} from '../utils/carScrollChoreography';
import {
  ModelInspectionReport,
  RiggedCarAssembly,
  rigAndCalibrateBmwModel,
} from '../utils/carModelRig';

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

const IS_SOFTWARE_GL = detectSoftwareWebGL();

const MODEL_ASCII_CHUNKS = [
  '/models/bmw_m4.part0.txt',
  '/models/bmw_m4.part1.txt',
  '/models/bmw_m4.part2.txt',
  '/models/bmw_m4.part3.txt',
  '/models/bmw_m4.part4.txt',
  '/models/bmw_m4.part5.txt',
  '/models/bmw_m4.part6.txt',
  '/models/bmw_m4.part7.txt',
  '/models/bmw_m4.part8.txt',
];

let cachedDefaultModelBlobUrlPromise: Promise<string> | null = null;

async function resolveStudioModelUrl(
  modelUrl: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (modelUrl !== '/models/bmw_m4.glb') {
    return modelUrl;
  }
  if (!cachedDefaultModelBlobUrlPromise) {
    cachedDefaultModelBlobUrlPromise = (async () => {
      let loadedChunks = 0;
      const chunkTexts = await Promise.all(
        MODEL_ASCII_CHUNKS.map(async (chunkPath) => {
          const res = await fetch(chunkPath);
          if (!res.ok) {
            throw new Error(`Failed to fetch model chunk ${chunkPath} (${res.status})`);
          }
          const txt = await res.text();
          loadedChunks += 1;
          onProgress?.(
            Math.min(75, Math.round((loadedChunks / MODEL_ASCII_CHUNKS.length) * 75))
          );
          return txt.replace(/\s+/g, '');
        })
      );

      const joinedBase64 = chunkTexts.join('');
      const binStr = atob(joinedBase64);
      const compressedBytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        compressedBytes[i] = binStr.charCodeAt(i);
      }

      onProgress?.(85);
      const compressedBlob = new Blob([compressedBytes], { type: 'application/gzip' });
      const ds = new DecompressionStream('gzip');
      const decompressedStream = compressedBlob.stream().pipeThrough(ds);
      const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
      const glbBlob = new Blob([decompressedBuffer], { type: 'model/gltf-binary' });
      return URL.createObjectURL(glbBlob);
    })().catch((err) => {
      cachedDefaultModelBlobUrlPromise = null;
      throw err;
    });
  }
  return cachedDefaultModelBlobUrlPromise;
}

/**
 * Builds a dark luxury automotive photo-studio cyclorama environment scene for PMREM cubemap baking.
 * Unlike Three's default bright RoomEnvironment (which washes out dark paint and cabin leather),
 * this cyclorama has a deep obsidian studio enclosure with precision overhead and beltline softbox
 * light banks that produce authentic, high-contrast automotive clearcoat reflections.
 */
function createAutomotiveCycloramaEnvironment(): THREE.Scene {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x030407);

  const addSoftbox = (
    pos: [number, number, number],
    rot: [number, number, number],
    size: [number, number],
    hex: number,
    intensity: number
  ) => {
    const geom = new THREE.PlaneGeometry(size[0], size[1]);
    const color = new THREE.Color(hex).multiplyScalar(intensity);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    envScene.add(mesh);
  };

  // Main overhead longitudinal studio softbox bank
  addSoftbox([0, 6.2, 0], [Math.PI / 2, 0, 0], [2.1, 10.5], 0xfffaf4, 3.2);

  // Driver-side (+X) & Passenger-side (-X) beltline softbox ribbons for shoulder & door reflections
  addSoftbox([5.4, 2.3, 0], [0, -Math.PI / 2, 0], [9.5, 1.05], 0xeef5ff, 2.4);
  addSoftbox([-5.4, 2.3, 0], [0, Math.PI / 2, 0], [9.5, 1.05], 0xd8e8ff, 1.9);

  // Upper 45-degree studio fill strips
  addSoftbox([3.4, 4.8, 0], [Math.PI / 2, 0.48, 0], [0.65, 9.0], 0xdceaff, 2.1);
  addSoftbox([-3.4, 4.8, 0], [Math.PI / 2, -0.48, 0], [0.65, 9.0], 0x9ec5ff, 1.6);

  // Front (+Z) & Rear (-Z) key reflection panels for grille, headlights, and rear diffuser
  addSoftbox([0, 2.8, 7.2], [0, Math.PI, 0], [4.8, 1.6], 0xffffff, 2.2);
  addSoftbox([0, 2.6, -7.2], [0, 0, 0], [4.8, 1.4], 0xc8dfff, 1.8);

  // Subtle dark studio floor bounce
  addSoftbox([0, -1.5, 0], [-Math.PI / 2, 0, 0], [16, 16], 0x090c12, 1.0);

  return envScene;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 512);
    const grad = ctx.createRadialGradient(128, 256, 18, 128, 256, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.96)');
    grad.addColorStop(0.62, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.scale(1, 2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 124, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export interface BmwShowroomCanvasProps {
  kinematicState: ScrollKinematicState;
  modelUrl: string;
  paintFinish: PaintFinishOption;
  interiorTrim: InteriorTrimOption;
  manualDoorAngleDeg: number | null;
  passengerDoorOpen: boolean;
  hoodOpen: boolean;
  trunkOpen: boolean;
  freeOrbitMode: boolean;
  onLoadProgress: (progressPct: number) => void;
  onModelReady: (report: ModelInspectionReport) => void;
  onModelError: (errMessage: string) => void;
}

interface StudioSceneContentProps extends BmwShowroomCanvasProps {
  isSoftwareGl: boolean;
}

const StudioSceneContent: React.FC<StudioSceneContentProps> = ({
  kinematicState,
  modelUrl,
  paintFinish,
  interiorTrim,
  manualDoorAngleDeg,
  passengerDoorOpen,
  hoodOpen,
  trunkOpen,
  freeOrbitMode,
  isSoftwareGl,
  onLoadProgress,
  onModelReady,
  onModelError,
}) => {
  const { gl, scene, camera, invalidate } = useThree();
  const carMountRef = useRef<THREE.Group>(null);
  const riggedRef = useRef<RiggedCarAssembly | null>(null);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  const keyDirLightRef = useRef<THREE.DirectionalLight>(null);
  const rimDirLightRef = useRef<THREE.DirectionalLight>(null);
  const sideDirLightRef = useRef<THREE.DirectionalLight>(null);
  const cabinMainLightRef = useRef<THREE.PointLight>(null);
  const cabinConsoleLightRef = useRef<THREE.PointLight>(null);
  const engineBayLightRef = useRef<THREE.PointLight>(null);
  const mirrorUnlockLightRef = useRef<THREE.PointLight>(null);

  const renderBusyRef = useRef(false);
  const renderDirtyRef = useRef(false);
  const fenceTimeoutRef = useRef<number>(0);

  const [shadowTex] = useState<THREE.CanvasTexture>(() => createContactShadowTexture());

  const requestSceneRender = useCallback(() => {
    if (!isSoftwareGl) {
      invalidate();
      return;
    }
    if (renderBusyRef.current) {
      renderDirtyRef.current = true;
      return;
    }
    renderBusyRef.current = true;
    invalidate();

    const glCtx = gl.getContext() as WebGL2RenderingContext;
    if (glCtx && typeof glCtx.fenceSync === 'function') {
      const sync = glCtx.fenceSync(glCtx.SYNC_GPU_COMMANDS_COMPLETE, 0);
      glCtx.flush();
      const poll = () => {
        if (!sync) return;
        const state = glCtx.getSyncParameter(sync, glCtx.SYNC_STATUS);
        if (state === glCtx.UNSIGNALED) {
          fenceTimeoutRef.current = window.setTimeout(poll, 5);
        } else {
          glCtx.deleteSync(sync);
          fenceTimeoutRef.current = window.setTimeout(() => {
            renderBusyRef.current = false;
            if (renderDirtyRef.current) {
              renderDirtyRef.current = false;
              requestSceneRender();
            }
          }, 80);
        }
      };
      fenceTimeoutRef.current = window.setTimeout(poll, 5);
    } else {
      fenceTimeoutRef.current = window.setTimeout(() => {
        renderBusyRef.current = false;
        if (renderDirtyRef.current) {
          renderDirtyRef.current = false;
          requestSceneRender();
        }
      }, 80);
    }
  }, [gl, invalidate, isSoftwareGl]);

  // 1. Configure Renderer, Dark Automotive Studio Environment & Seamless Cyclorama Fog
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const studioEnvScene = createAutomotiveCycloramaEnvironment();
    const envTex = pmremGenerator.fromScene(studioEnvScene, 0.025).texture;
    scene.environment = envTex;
    scene.background = new THREE.Color(0x040508);
    scene.fog = new THREE.FogExp2(0x040508, 0.055);
    pmremGenerator.dispose();

    const persp = camera as THREE.PerspectiveCamera;
    persp.near = 0.04;
    persp.far = 80;
    persp.updateProjectionMatrix();

    requestSceneRender();

    return () => {
      window.clearTimeout(fenceTimeoutRef.current);
      envTex.dispose();
    };
  }, [gl, scene, camera, requestSceneRender]);

  // 2. Load and rig the BMW M4 GLB model (supports GitHub-safe chunked ASCII transport)
  useEffect(() => {
    let cancelled = false;
    onLoadProgress(5);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    resolveStudioModelUrl(modelUrl, (pct) => {
      if (!cancelled) onLoadProgress(pct);
    })
      .then((resolvedUrl) => {
        if (cancelled) return;
        loader.load(
          resolvedUrl,
          (gltf) => {
            if (cancelled) return;
            try {
              const rigged = rigAndCalibrateBmwModel(
                gltf.scene,
                modelUrl,
                paintFinish,
                interiorTrim,
                isSoftwareGl
              );
              riggedRef.current = rigged;

              if (carMountRef.current) {
                while (carMountRef.current.children.length > 0) {
                  carMountRef.current.remove(carMountRef.current.children[0]);
                }
                carMountRef.current.add(rigged.rootGroup);
              }

              const effectiveDoorRad =
                manualDoorAngleDeg !== null
                  ? (manualDoorAngleDeg * Math.PI) / 180
                  : kinematicState.driverDoorAngleRad;

              const effectiveHoodRad = hoodOpen
                ? (38 * Math.PI) / 180
                : kinematicState.hoodAngleRad;

              rigged.applyPose({
                driverDoorAngleRad: effectiveDoorRad,
                passengerDoorAngleRad: passengerDoorOpen ? (62 * Math.PI) / 180 : 0,
                hoodAngleRad: effectiveHoodRad,
                trunkAngleRad: trunkOpen ? (36 * Math.PI) / 180 : 0,
                steeringWheelAngleRad: kinematicState.steeringWheelAngleRad,
                wheelRotationRad: kinematicState.wheelRotationRad,
                headlightIntensity: kinematicState.headlightIntensity,
                taillightIntensity: kinematicState.taillightIntensity,
                unlockFlashIntensity: kinematicState.unlockFlashIntensity,
              });

              onLoadProgress(100);
              onModelReady(rigged.inspectionReport);
              requestSceneRender();
            } catch (err) {
              onModelError(
                err instanceof Error
                  ? err.message
                  : 'Failed to rig loaded GLB vehicle hierarchy.'
              );
            }
          },
          (evt) => {
            if (cancelled) return;
            if (evt.lengthComputable && evt.total > 0) {
              const pct = Math.min(98, 85 + Math.round((evt.loaded / evt.total) * 14));
              onLoadProgress(pct);
            } else {
              onLoadProgress(92);
            }
          },
          (err) => {
            if (cancelled) return;
            onModelError(
              err instanceof Error
                ? err.message
                : `Unable to load 3D vehicle asset from ${modelUrl}`
            );
          }
        );
      })
      .catch((err) => {
        if (cancelled) return;
        onModelError(
          err instanceof Error
            ? err.message
            : `Unable to stream 3D vehicle chunks for ${modelUrl}`
        );
      });

    return () => {
      cancelled = true;
      dracoLoader.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, isSoftwareGl]);

  // 3. Update Paint Finish in real time
  useEffect(() => {
    if (riggedRef.current) {
      riggedRef.current.setPaintFinish(paintFinish);
      requestSceneRender();
    }
  }, [paintFinish, requestSceneRender]);

  // 4. Update Interior Merino Leather Trim in real time
  useEffect(() => {
    if (riggedRef.current) {
      riggedRef.current.setInteriorTrim(interiorTrim);
      requestSceneRender();
    }
  }, [interiorTrim, requestSceneRender]);

  // 5. Apply scroll-linked camera & physical vehicle pose
  useEffect(() => {
    const effectiveDoorRad =
      manualDoorAngleDeg !== null
        ? (manualDoorAngleDeg * Math.PI) / 180
        : kinematicState.driverDoorAngleRad;

    const effectiveHoodRad = hoodOpen
      ? (38 * Math.PI) / 180
      : kinematicState.hoodAngleRad;

    if (riggedRef.current) {
      riggedRef.current.applyPose({
        driverDoorAngleRad: effectiveDoorRad,
        passengerDoorAngleRad: passengerDoorOpen ? (62 * Math.PI) / 180 : 0,
        hoodAngleRad: effectiveHoodRad,
        trunkAngleRad: trunkOpen ? (36 * Math.PI) / 180 : 0,
        steeringWheelAngleRad: kinematicState.steeringWheelAngleRad,
        wheelRotationRad: kinematicState.wheelRotationRad,
        headlightIntensity: kinematicState.headlightIntensity,
        taillightIntensity: kinematicState.taillightIntensity,
        unlockFlashIntensity: kinematicState.unlockFlashIntensity,
      });
    }

    const doorOpenRatio = Math.max(
      effectiveDoorRad / 1.134,
      passengerDoorOpen ? 1 : 0,
      kinematicState.isCameraInsideCabin ? 1 : 0
    );

    // Attenuate overhead exterior directional lights when camera is inside cabin so roof doesn't pass harsh light
    const extDim = kinematicState.isCameraInsideCabin ? 0.35 : 1.0;
    if (keyDirLightRef.current) keyDirLightRef.current.intensity = 1.65 * extDim;
    if (rimDirLightRef.current) rimDirLightRef.current.intensity = 1.15 * extDim;
    if (sideDirLightRef.current) sideDirLightRef.current.intensity = 1.10 * extDim;

    if (cabinMainLightRef.current) {
      cabinMainLightRef.current.intensity = 0.25 + doorOpenRatio * 1.35;
    }
    if (cabinConsoleLightRef.current) {
      cabinConsoleLightRef.current.intensity = 0.20 + doorOpenRatio * 0.95;
    }
    if (engineBayLightRef.current) {
      engineBayLightRef.current.intensity =
        effectiveHoodRad > 0.05 ? 2.2 : kinematicState.engineLightIntensity;
    }
    if (mirrorUnlockLightRef.current) {
      mirrorUnlockLightRef.current.intensity = kinematicState.unlockFlashIntensity * 3.5;
    }

    if (!freeOrbitMode) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.position.set(...kinematicState.cameraPosition);
      persp.lookAt(...kinematicState.cameraTarget);
      if (Math.abs(persp.fov - kinematicState.cameraFov) > 0.05) {
        persp.fov = kinematicState.cameraFov;
        persp.updateProjectionMatrix();
      }
      if (orbitRef.current) {
        orbitRef.current.target.set(...kinematicState.cameraTarget);
      }
    }

    requestSceneRender();
  }, [
    kinematicState,
    manualDoorAngleDeg,
    passengerDoorOpen,
    hoodOpen,
    trunkOpen,
    freeOrbitMode,
    camera,
    requestSceneRender,
  ]);

  return (
    <>
      {/* Subtle Dark Studio Hemisphere Fill */}
      <hemisphereLight args={[0xbfd4ff, 0x06080c, 0.55]} />

      {/* Controlled 3-Point Studio Directional Rig */}
      <directionalLight
        ref={keyDirLightRef}
        position={[5.2, 7.2, 4.2]}
        intensity={1.65}
        color={0xfff8f0}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-bias={-0.0005}
      />

      <directionalLight
        ref={rimDirLightRef}
        position={[-4.8, 4.0, -5.2]}
        intensity={1.15}
        color={0x6ea8ff}
      />

      <directionalLight
        ref={sideDirLightRef}
        position={[5.8, 2.4, 0.4]}
        intensity={1.10}
        color={0xe6f0ff}
      />

      {/* Central-Locking Mirror Unlock Indicator Flash Light */}
      <pointLight
        ref={mirrorUnlockLightRef}
        position={[1.18, 0.96, 0.62]}
        intensity={0}
        distance={2.2}
        decay={1.8}
        color={0xff9900}
      />

      {/* Controlled Interior Cabin Welcome & Ambient Contour Lights */}
      <pointLight
        ref={cabinMainLightRef}
        position={[0.34, 1.15, 0.05]}
        intensity={0.9}
        distance={2.4}
        decay={1.6}
        color={0xfff2e0}
      />
      <pointLight
        ref={cabinConsoleLightRef}
        position={[0.10, 0.86, 0.38]}
        intensity={0.7}
        distance={1.8}
        decay={1.6}
        color={0xcce2ff}
      />

      {/* S58 TwinPower Turbo Engine Bay Light (illuminates when hood opens in Chapter 06) */}
      <pointLight
        ref={engineBayLightRef}
        position={[0.0, 1.42, 1.42]}
        intensity={0}
        distance={2.8}
        decay={1.5}
        color={0xf2f7ff}
      />

      {/* Dark Munich Cyclorama Studio Floor + Soft Tire Contact Shadow */}
      <group position={[0, 0, 0]}>
        <mesh
          position={[0, -0.006, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow={!isSoftwareGl}
        >
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial
            color={0x050609}
            roughness={0.44}
            metalness={0.18}
            envMapIntensity={0.32}
          />
        </mesh>

        {/* Grounding Contact Shadow Under Chassis */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.55, 5.35]} />
          <meshBasicMaterial
            map={shadowTex}
            transparent
            opacity={0.86}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </group>

      {/* Mounted Rigged BMW M4 (G82) 3D Assembly */}
      <group ref={carMountRef} />

      {/* Interactive OrbitControls when Free 3D Orbit Mode is active */}
      <OrbitControls
        ref={orbitRef}
        enabled={freeOrbitMode}
        enableDamping={!isSoftwareGl}
        dampingFactor={0.07}
        minDistance={0.35}
        maxDistance={9.5}
        maxPolarAngle={Math.PI / 2 - 0.03}
        onChange={() => requestSceneRender()}
      />
    </>
  );
};

export const BmwShowroomCanvas: React.FC<BmwShowroomCanvasProps> = (props) => {
  const [contextLost, setContextLost] = useState(false);

  return (
    <div
      data-testid="bmw-3d-canvas-container"
      data-active-scene={props.kinematicState.activeScene.id}
      data-door-angle={props.kinematicState.driverDoorAngleDeg}
      data-hood-angle={props.kinematicState.hoodAngleDeg}
      data-cabin-inside={props.kinematicState.isCameraInsideCabin ? 'true' : 'false'}
      className="relative w-full h-full bg-[#040508] select-none overflow-hidden"
    >
      {contextLost ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#040508]">
          <p className="font-mono text-xs tracking-[0.24em] uppercase text-[#1C69D4] mb-2">
            STUDIO VIEWPORT RESTORING
          </p>
          <p className="text-sm text-[#9BA3B0] max-w-md">
            Re-initializing the 3D BMW M4 studio viewport...
          </p>
        </div>
      ) : (
        <Canvas
          frameloop="demand"
          dpr={IS_SOFTWARE_GL ? 1 : [1, 2]}
          shadows={!IS_SOFTWARE_GL}
          gl={{
            antialias: !IS_SOFTWARE_GL,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
          }}
          camera={{
            position: [3.35, 1.16, 3.55],
            fov: 33,
            near: 0.04,
            far: 80,
          }}
          onCreated={({ gl }) => {
            const dom = gl.domElement;
            dom.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setContextLost(true);
            });
            dom.addEventListener('webglcontextrestored', () => {
              setContextLost(false);
            });
          }}
        >
          <StudioSceneContent {...props} isSoftwareGl={IS_SOFTWARE_GL} />
        </Canvas>
      )}
    </div>
  );
};
