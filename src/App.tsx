import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, CheckCircle2, Volume2, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BmwShowroomCanvas } from './components/BmwShowroomCanvas';
import { BottomControlDock } from './components/BottomControlDock';
import { ModelHierarchyDrawer } from './components/ModelHierarchyDrawer';
import {
  INTERIOR_TRIMS,
  InteriorTrimOption,
  MAX_DOOR_ANGLE_DEG,
  PAINT_FINISHES,
  PaintFinishOption,
  SCROLL_SCENES,
  ScrollKinematicState,
  clamp01,
  computeScrollKinematicState,
} from './utils/carScrollChoreography';
import { ModelInspectionReport } from './utils/carModelRig';
import { validateConsultationForm } from './utils/showroomLogic';
import { S58AudioStatus, s58AudioEngine } from './utils/s58AudioEngine';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const sequenceWrapperRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Master scroll-linked kinematic state (0..1 across the 7 chapters)
  const [kinematicState, setKinematicState] = useState<ScrollKinematicState>(() =>
    computeScrollKinematicState(0, false)
  );
  const [isBelowShowroom, setIsBelowShowroom] = useState(false);

  // Model loading state & inspection report
  const [modelUrl, setModelUrl] = useState<string>('/models/bmw_m4.glb');
  const [loadProgress, setLoadProgress] = useState<number>(12);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [inspectionReport, setInspectionReport] = useState<ModelInspectionReport | null>(
    null
  );

  // Interactive studio finish & physical overrides
  const [paintFinish, setPaintFinish] = useState<PaintFinishOption>(PAINT_FINISHES[0]);
  const [interiorTrim, setInteriorTrim] = useState<InteriorTrimOption>(INTERIOR_TRIMS[0]);
  const [manualDoorAngleDeg, setManualDoorAngleDeg] = useState<number | null>(null);
  const [passengerDoorOpen, setPassengerDoorOpen] = useState<boolean>(false);
  const [hoodOpen, setHoodOpen] = useState<boolean>(false);
  const [trunkOpen] = useState<boolean>(false);
  const [freeOrbitMode, setFreeOrbitMode] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [hierarchyDrawerOpen, setHierarchyDrawerOpen] = useState<boolean>(false);

  // S58 TwinPower Turbo Atmospheric Audio State
  const [audioStatus, setAudioStatus] = useState<S58AudioStatus>(() =>
    s58AudioEngine.getStatus()
  );
  const prevDoorUnlockedRef = useRef<boolean>(false);
  const prevPerformanceActiveRef = useRef<boolean>(false);

  // Private Consultation Modal state
  const [inquiryOpen, setInquiryOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);

  useEffect(() => {
    return s58AudioEngine.subscribe(setAudioStatus);
  }, []);

  // Synchronize S58 Audio Engine with 'Performance' chapter, Hood state, and Scroll Door kinematics
  useEffect(() => {
    const isPerformanceChapter =
      !isBelowShowroom && kinematicState.activeScene.navCategory === 'performance';
    const isEngineExposed =
      isPerformanceChapter || hoodOpen || kinematicState.hoodAngleDeg > 10;

    if (isEngineExposed !== prevPerformanceActiveRef.current) {
      prevPerformanceActiveRef.current = isEngineExposed;
      s58AudioEngine.setEngineActive(isEngineExposed, isEngineExposed);
    }

    if (isPerformanceChapter) {
      s58AudioEngine.setScrollPerformanceRpm(kinematicState.sceneLocalProgress);
    }

    // Trigger subtle door unlatch / close acoustics when scrolling across Chapter 04/05 boundaries
    if (kinematicState.doorUnlocked !== prevDoorUnlockedRef.current) {
      prevDoorUnlockedRef.current = kinematicState.doorUnlocked;
      if (kinematicState.doorUnlocked) {
        s58AudioEngine.playMechanicalSound('lock-chime');
        s58AudioEngine.playMechanicalSound('door-open');
      } else {
        s58AudioEngine.playMechanicalSound('door-close');
      }
    }
  }, [kinematicState, hoodOpen, isBelowShowroom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        s58AudioEngine.triggerRev(5400, 820);
      } else if (e.key === 'm' || e.key === 'M') {
        s58AudioEngine.toggleEnabled();
      } else if (e.key === 'Escape') {
        setHierarchyDrawerOpen(false);
        setInquiryOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Master GSAP ScrollTrigger controlling the 1000vh 7-Chapter 3D Sequence
  useEffect(() => {
    const wrapper = sequenceWrapperRef.current;
    if (!wrapper) return;

    const proxy = { progress: 0 };

    const updateFromScroll = (rawProgress: number) => {
      const p = clamp01(rawProgress);
      const nextState = computeScrollKinematicState(p, window.innerWidth < 768);
      setKinematicState(nextState);
    };

    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            updateFromScroll(self.progress);
          },
        },
      });

      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${Math.max(
              0.01,
              self.progress
            )})`;
          }
          if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            setIsBelowShowroom(rect.bottom <= window.innerHeight + 40);
          }
        },
      });
    });

    const onDirectScroll = () => {
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const scrollableDistance = Math.max(1, wrapper.offsetHeight - window.innerHeight);
      const scrolled = -rect.top;
      const directProgress = clamp01(scrolled / scrollableDistance);
      updateFromScroll(directProgress);
      setIsBelowShowroom(rect.bottom <= window.innerHeight + 40);
    };

    window.addEventListener('scroll', onDirectScroll, { passive: true });
    onDirectScroll();

    return () => {
      window.removeEventListener('scroll', onDirectScroll);
      ctx.revert();
    };
  }, [isMobile]);

  const handleJumpToScene = useCallback((sceneIndex: number) => {
    const wrapper = sequenceWrapperRef.current;
    if (!wrapper) return;
    const clampedIdx = Math.max(0, Math.min(SCROLL_SCENES.length - 1, sceneIndex));
    const targetScene = SCROLL_SCENES[clampedIdx];

    // Land at each chapter's signature moment
    const targetProgress =
      clampedIdx === 0
        ? 0.0
        : clampedIdx === 1
          ? 0.21
          : clampedIdx === 2
            ? 0.35
            : clampedIdx === 3
              ? 0.52
              : clampedIdx === 4
                ? 0.65
                : clampedIdx === 5
                  ? 0.81
                  : (targetScene.startProgress + targetScene.endProgress) * 0.5;

    const scrollableDistance = Math.max(1, wrapper.offsetHeight - window.innerHeight);
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const targetScrollY = Math.round(wrapperTop + targetProgress * scrollableDistance);

    setFreeOrbitMode(false);
    setManualDoorAngleDeg(null);
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }, []);

  const handleSelectPaint = useCallback((finish: PaintFinishOption) => {
    setPaintFinish(finish);
    s58AudioEngine.playMechanicalSound('swatch-click');
  }, []);

  const handleSelectInterior = useCallback((trim: InteriorTrimOption) => {
    setInteriorTrim(trim);
    s58AudioEngine.playMechanicalSound('swatch-click');
  }, []);

  const handleManualDoorAngle = useCallback(
    (nextDeg: number | null) => {
      const currentDeg =
        manualDoorAngleDeg !== null
          ? manualDoorAngleDeg
          : Math.round(kinematicState.driverDoorAngleDeg);
      const willBeOpen = nextDeg !== null ? nextDeg > 10 : false;
      const wasOpen = currentDeg > 10;
      setManualDoorAngleDeg(nextDeg);
      s58AudioEngine.playMechanicalSound(willBeOpen && !wasOpen ? 'door-open' : 'door-close');
    },
    [manualDoorAngleDeg, kinematicState.driverDoorAngleDeg]
  );

  const handleToggleHood = useCallback(() => {
    setHoodOpen((prev) => {
      const next = !prev;
      s58AudioEngine.playMechanicalSound(next ? 'hood-open' : 'hood-close');
      return next;
    });
  }, []);

  const handleTogglePassengerDoor = useCallback(() => {
    setPassengerDoorOpen((prev) => {
      const next = !prev;
      s58AudioEngine.playMechanicalSound(next ? 'door-open' : 'door-close');
      return next;
    });
  }, []);

  const handleToggleBothDoors = useCallback(() => {
    const isDriverOpen =
      (manualDoorAngleDeg !== null
        ? manualDoorAngleDeg
        : kinematicState.driverDoorAngleDeg) > 10;
    const isEitherOpen = isDriverOpen || passengerDoorOpen;
    if (isEitherOpen) {
      setManualDoorAngleDeg(0);
      setPassengerDoorOpen(false);
      s58AudioEngine.playMechanicalSound('door-close');
    } else {
      setManualDoorAngleDeg(MAX_DOOR_ANGLE_DEG);
      setPassengerDoorOpen(true);
      s58AudioEngine.playMechanicalSound('door-open');
    }
  }, [manualDoorAngleDeg, kinematicState.driverDoorAngleDeg, passengerDoorOpen]);

  const handleToggleFreeOrbit = useCallback(() => {
    setFreeOrbitMode((prev) => !prev);
    s58AudioEngine.playMechanicalSound('swatch-click');
  }, []);

  const handleToggleAudio = useCallback(() => {
    s58AudioEngine.toggleEnabled();
  }, []);

  const handleTriggerRev = useCallback(() => {
    s58AudioEngine.triggerRev(5400, 820);
  }, []);

  const handleCustomGlbFile = useCallback((file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setModelError(null);
    setModelReady(false);
    setLoadProgress(10);
    setModelUrl(blobUrl);
  }, []);

  const handleResetDefaultModel = useCallback(() => {
    setModelError(null);
    setModelReady(false);
    setLoadProgress(10);
    setModelUrl('/models/bmw_m4.glb');
  }, []);

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateConsultationForm({ fullName, email, city });
    if (!validation.valid) {
      setFormError(validation.error || 'Please complete all required fields.');
      return;
    }
    setFormError(null);
    setInquirySubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#040508] text-[#F5F7FA] selection:bg-[#1C69D4] selection:text-white">
      {/* Minimal Luxury Header (Design, Interior, Performance, Explore) */}
      <Navbar
        activeScene={kinematicState.activeScene}
        isBelowShowroom={isBelowShowroom}
        progressBarRef={progressBarRef}
        onJumpToScene={handleJumpToScene}
        onOpenInquiry={() => setInquiryOpen(true)}
      />

      {/* =====================================================================
          LONG-FORM 7-CHAPTER SCROLL-CONTROLLED 3D EXPERIENCE (1000VH)
      ====================================================================== */}
      <main>
        <section
          id="scroll-sequence-stage"
          ref={sequenceWrapperRef}
          aria-label="Scroll-Controlled 3D BMW M4 Experience"
          className="relative w-full h-[1000vh]"
        >
          {/* Sticky Full-Screen 3D Studio Viewport */}
          <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
            <BmwShowroomCanvas
              kinematicState={kinematicState}
              modelUrl={modelUrl}
              paintFinish={paintFinish}
              interiorTrim={interiorTrim}
              manualDoorAngleDeg={manualDoorAngleDeg}
              passengerDoorOpen={passengerDoorOpen}
              hoodOpen={hoodOpen}
              trunkOpen={trunkOpen}
              freeOrbitMode={freeOrbitMode}
              onLoadProgress={(pct) => setLoadProgress(pct)}
              onModelReady={(report) => {
                setInspectionReport(report);
                setModelReady(true);
                setModelError(null);
              }}
              onModelError={(err) => {
                setModelError(err);
              }}
            />

            {/* Subtle Top & Bottom Atmospheric Vignette Gradients */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#040508]/75 to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040508]/90 via-[#040508]/40 to-transparent z-10"
            />

            {/* Discreet Loading Indicator while 3D Asset Streams */}
            {!modelReady && !modelError && (
              <div
                data-testid="model-loading-indicator"
                className="pointer-events-none absolute top-24 right-6 md:right-14 z-20 flex items-center gap-3"
              >
                <div className="w-20 h-[1px] bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-200"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#8E96A4] tabular-nums">
                  {loadProgress}%
                </span>
              </div>
            )}

            {/* Error State Banner with Replaceable Model Loader Action */}
            {modelError && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-[#120A0C] border border-red-500/30 px-6 py-4 max-w-md text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400 mb-1">
                  3D Asset Load Notice
                </p>
                <p className="text-xs text-[#C8D0DC] mb-3">{modelError}</p>
                <button
                  type="button"
                  onClick={() => setHierarchyDrawerOpen(true)}
                  className="px-4 py-1.5 bg-[#1C69D4] text-[10px] font-mono uppercase tracking-[0.2em] text-white cursor-pointer"
                >
                  Replace Model Asset
                </button>
              </div>
            )}

            {/* Right-Edge Minimal 7-Chapter Dot Indicator */}
            <div
              aria-label="Scroll chapters"
              className="hidden md:flex flex-col items-end gap-3 absolute right-14 top-1/2 -translate-y-1/2 z-20"
            >
              {SCROLL_SCENES.map((scene, idx) => {
                const active = kinematicState.activeSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleJumpToScene(idx)}
                    aria-label={scene.title}
                    title={`${scene.index} — ${scene.title}`}
                    className="group flex items-center gap-3 py-1 cursor-pointer"
                  >
                    <span
                      className={`font-mono text-[9px] tracking-[0.24em] uppercase transition-opacity duration-300 ${
                        active
                          ? 'opacity-100 text-white'
                          : 'opacity-0 group-hover:opacity-70 text-[#8E96A4]'
                      }`}
                    >
                      {scene.index}
                    </span>
                    <span
                      className={`block transition-all duration-300 ${
                        active
                          ? 'w-5 h-[1.5px] bg-white'
                          : 'w-2 h-[1px] bg-white/30 group-hover:bg-white/60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Minimal Bottom-Left Editorial Caption (Unboxed, Generous Negative Space) */}
            <div className="pointer-events-none absolute bottom-8 left-6 md:left-14 z-20 max-w-sm">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#8E96A4]">
                  {kinematicState.activeScene.kicker}
                </p>
                {audioStatus.engineActive && audioStatus.enabled && (
                  <span
                    data-testid="s58-acoustic-telemetry"
                    className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-[#1C69D4] tabular-nums"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{audioStatus.currentRpm} RPM</span>
                  </span>
                )}
              </div>
              <h1
                data-testid="active-scene-heading"
                className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white leading-[1.08]"
              >
                {kinematicState.activeScene.title}
              </h1>
              <p className="mt-2 text-xs md:text-sm text-[#A6B0C0] leading-relaxed">
                {kinematicState.activeScene.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 08 — TECHNICAL SPECIFICATION & BESPOKE COMMISSION
        ====================================================================== */}
        <section
          id="section-specifications"
          className="relative z-20 bg-[#05070B] border-t border-white/10 py-32 md:py-44 px-6 md:px-14"
        >
          <div className="max-w-[1280px] mx-auto space-y-28">
            {/* Minimal Architectural Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-16 border-b border-white/10">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#8E96A4] mb-4">
                  08 / SPECIFICATION
                </p>
                <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-white">
                  M TwinPower Turbo.
                </h2>
              </div>
              <p className="text-sm text-[#8E96A4] max-w-sm leading-relaxed">
                High-revving 3.0-liter inline six-cylinder engine with two mono-scroll
                turbochargers, forged crankshaft, and M xDrive all-wheel drive.
              </p>
            </div>

            {/* 4 Essential Figures — Spacious Editorial Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E96A4]">
                  Output
                </p>
                <p className="font-display text-4xl md:text-5xl font-semibold tabular-nums text-white mt-3">
                  530 HP
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E96A4]">
                  0–100 km/h
                </p>
                <p className="font-display text-4xl md:text-5xl font-semibold tabular-nums text-white mt-3">
                  3.4 s
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E96A4]">
                  Peak Torque
                </p>
                <p className="font-display text-4xl md:text-5xl font-semibold tabular-nums text-white mt-3">
                  650 Nm
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8E96A4]">
                  Displacement
                </p>
                <p className="font-display text-4xl md:text-5xl font-semibold tabular-nums text-white mt-3">
                  2,993 cc
                </p>
              </div>
            </div>

            {/* BMW Individual Paint & Merino Leather Palette Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E96A4]">
                    EXTERIOR FINISH ({PAINT_FINISHES.length} PALETTES)
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white">
                    {paintFinish.name} · {paintFinish.code}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {PAINT_FINISHES.map((finish) => {
                    const active = paintFinish.id === finish.id;
                    return (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() => handleSelectPaint(finish)}
                        className={`group p-2.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? 'border-white bg-white/[0.06]'
                            : 'border-white/10 hover:border-white/35 bg-white/[0.015]'
                        }`}
                      >
                        <span
                          className="block w-full h-6 mb-2 border border-white/20"
                          style={{ backgroundColor: finish.hex }}
                        />
                        <span className="block font-mono text-[9px] tracking-[0.14em] uppercase text-white truncate">
                          {finish.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8E96A4]">
                    MERINO LEATHER ({INTERIOR_TRIMS.length} TRIMS)
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white truncate">
                    {interiorTrim.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTERIOR_TRIMS.map((trim) => {
                    const active = interiorTrim.id === trim.id;
                    return (
                      <button
                        key={trim.id}
                        type="button"
                        onClick={() => handleSelectInterior(trim)}
                        className={`p-2.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? 'border-white bg-white/[0.06]'
                            : 'border-white/10 hover:border-white/35 bg-white/[0.015]'
                        }`}
                      >
                        <span
                          className="block w-full h-6 mb-2 border border-white/20"
                          style={{ backgroundColor: trim.primaryHex }}
                        />
                        <span className="block font-mono text-[9px] tracking-[0.12em] uppercase text-white truncate">
                          {trim.name.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Minimal Bespoke Finish & Reservation Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8E96A4]">
                  ACTIVE CONFIGURATION
                </p>
                <p className="font-display text-2xl md:text-3xl font-medium text-white">
                  {paintFinish.name} <span className="text-white/30">·</span>{' '}
                  <span className="text-[#A6B0C0]">{interiorTrim.name}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={handleTriggerRev}
                  className="px-6 py-3.5 border border-white/15 hover:border-white/40 text-xs font-mono uppercase tracking-[0.22em] text-white transition-colors cursor-pointer"
                >
                  Rev S58 Engine
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToScene(3)}
                  className="px-6 py-3.5 border border-white/15 hover:border-white/40 text-xs font-mono uppercase tracking-[0.22em] text-white transition-colors cursor-pointer"
                >
                  Inspect Cabin
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryOpen(true)}
                  className="px-7 py-3.5 bg-[#1C69D4] hover:bg-[#1557B2] text-xs font-mono uppercase tracking-[0.22em] text-white inline-flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <span>Reserve Consultation</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          REFINED MINIMAL FOOTER
      ====================================================================== */}
      <footer className="relative z-20 bg-[#030406] border-t border-white/10 py-16 px-6 md:px-14">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-[11px] text-[#8E96A4]">
          <div className="space-y-1">
            <p className="font-display font-semibold tracking-[0.24em] text-white uppercase">
              BMW M4 Competition Coupé
            </p>
            <p>
              WLTP Combined: 10.1–10.0 l/100 km · CO₂: 230–226 g/km · 3D Asset CC BY 4.0
            </p>
          </div>

          <div className="flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.22em]">
            <button
              type="button"
              onClick={() => handleJumpToScene(0)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Top
            </button>
            <button
              type="button"
              onClick={handleTogglePassengerDoor}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Passenger Door
            </button>
            <button
              type="button"
              onClick={() => setHierarchyDrawerOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              3D Rig
            </button>
          </div>
        </div>
      </footer>

      {/* Minimal Bottom-Right Studio Bar */}
      <BottomControlDock
        kinematicState={kinematicState}
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
        paintFinish={paintFinish}
        onSelectPaint={handleSelectPaint}
        interiorTrim={interiorTrim}
        onSelectInterior={handleSelectInterior}
        manualDoorAngleDeg={manualDoorAngleDeg}
        onChangeManualDoorAngle={handleManualDoorAngle}
        passengerDoorOpen={passengerDoorOpen}
        onTogglePassengerDoor={handleTogglePassengerDoor}
        onToggleBothDoors={handleToggleBothDoors}
        hoodOpen={hoodOpen}
        onToggleHood={handleToggleHood}
        freeOrbitMode={freeOrbitMode}
        onToggleFreeOrbit={handleToggleFreeOrbit}
        onOpenHierarchyInspector={() => setHierarchyDrawerOpen(true)}
        audioStatus={audioStatus}
        onToggleAudio={handleToggleAudio}
        onTriggerRev={handleTriggerRev}
      />

      {/* GLB Model Hierarchy & Replaceable Asset Drawer */}
      <ModelHierarchyDrawer
        open={hierarchyDrawerOpen}
        onClose={() => setHierarchyDrawerOpen(false)}
        report={inspectionReport}
        currentModelUrl={modelUrl}
        onSelectCustomGlbFile={handleCustomGlbFile}
        onResetDefaultModel={handleResetDefaultModel}
      />

      {/* Private Consultation Modal */}
      {inquiryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consultation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="relative w-full max-w-md bg-[#090C12] border border-white/15 p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#1C69D4]">
                  BMW M BESPOKE
                </p>
                <h2 id="consultation-modal-title" className="text-xl font-semibold mt-1">
                  Reserve Private Consultation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                aria-label="Close Modal"
                className="p-1.5 text-[#8E96A4] hover:text-white border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#1C69D4] mx-auto" />
                <h3 className="text-lg font-medium">Request Confirmed</h3>
                <p className="text-xs text-[#8E96A4] leading-relaxed">
                  Thank you, <strong className="text-white">{fullName}</strong>. Your
                  specification in <strong className="text-white">{paintFinish.name}</strong>{' '}
                  has been registered for <strong className="text-white">{city}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInquirySubmitted(false);
                    setInquiryOpen(false);
                  }}
                  className="mt-4 px-5 py-2 bg-[#1C69D4] text-xs font-mono uppercase tracking-wider text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-4 pt-5" noValidate>
                <div className="p-3 bg-white/[0.03] border border-white/10 text-xs font-mono text-[#C8D0DC] space-y-1">
                  <div>
                    EXTERIOR: {paintFinish.name} ({paintFinish.code})
                  </div>
                  <div>INTERIOR: {interiorTrim.name}</div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs text-red-400 font-medium">
                    {formError}
                  </p>
                )}

                <div>
                  <label
                    htmlFor="consultation-name"
                    className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E96A4] mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="consultation-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Lukas Weber"
                    className="w-full px-3.5 py-2.5 bg-[#040508] border border-white/15 text-sm text-white focus:border-[#1C69D4] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="consultation-email"
                    className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E96A4] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="consultation-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lukas.weber@bmw-m.de"
                    className="w-full px-3.5 py-2.5 bg-[#040508] border border-white/15 text-sm text-white focus:border-[#1C69D4] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="consultation-city"
                    className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8E96A4] mb-1.5"
                  >
                    Showroom / City
                  </label>
                  <input
                    id="consultation-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Munich"
                    className="w-full px-3.5 py-2.5 bg-[#040508] border border-white/15 text-sm text-white focus:border-[#1C69D4] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1C69D4] hover:bg-[#1557B2] text-xs font-mono uppercase tracking-[0.2em] text-white font-medium transition-colors cursor-pointer"
                >
                  Confirm Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
