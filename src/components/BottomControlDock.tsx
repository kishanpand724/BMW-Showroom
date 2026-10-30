import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  INTERIOR_TRIMS,
  InteriorTrimOption,
  MAX_DOOR_ANGLE_DEG,
  PAINT_FINISHES,
  PaintFinishOption,
  ScrollKinematicState,
} from '../utils/carScrollChoreography';
import { S58AudioStatus } from '../utils/s58AudioEngine';

export interface BottomControlDockProps {
  kinematicState: ScrollKinematicState;
  collapsed: boolean;
  onToggleCollapse: () => void;
  paintFinish: PaintFinishOption;
  onSelectPaint: (finish: PaintFinishOption) => void;
  interiorTrim: InteriorTrimOption;
  onSelectInterior: (trim: InteriorTrimOption) => void;
  manualDoorAngleDeg: number | null;
  onChangeManualDoorAngle: (deg: number | null) => void;
  passengerDoorOpen: boolean;
  onTogglePassengerDoor: () => void;
  onToggleBothDoors: () => void;
  hoodOpen: boolean;
  onToggleHood: () => void;
  freeOrbitMode: boolean;
  onToggleFreeOrbit: () => void;
  onOpenHierarchyInspector: () => void;
  audioStatus: S58AudioStatus;
  onToggleAudio: () => void;
  onTriggerRev: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  kinematicState,
  collapsed,
  onToggleCollapse,
  paintFinish,
  onSelectPaint,
  interiorTrim,
  onSelectInterior,
  manualDoorAngleDeg,
  onChangeManualDoorAngle,
  passengerDoorOpen,
  onTogglePassengerDoor,
  onToggleBothDoors,
  hoodOpen,
  onToggleHood,
  freeOrbitMode,
  onToggleFreeOrbit,
  onOpenHierarchyInspector,
  audioStatus,
  onToggleAudio,
  onTriggerRev,
}) => {
  const effectiveDriverDeg =
    manualDoorAngleDeg !== null
      ? manualDoorAngleDeg
      : Math.round(kinematicState.driverDoorAngleDeg);

  const isDriverDoorOpen = effectiveDriverDeg > 10;
  const isPassengerDoorOpen = passengerDoorOpen;
  const isBothDoorsOpen = isDriverDoorOpen && isPassengerDoorOpen;
  const isHoodOpen = hoodOpen || kinematicState.hoodAngleDeg > 10;

  return (
    <div className="fixed bottom-6 right-6 md:right-14 z-30 pointer-events-auto flex items-center gap-2.5 max-w-[calc(100vw-3rem)]">
      {!collapsed && (
        <div className="bg-[#080A0F]/92 border border-white/10 px-4 py-2.5 flex flex-wrap items-center gap-3.5 shadow-2xl">
          {/* Exterior Paint Swatches (12 BMW M & Individual Finishes) */}
          <div
            className="flex items-center gap-1.5 flex-wrap"
            role="group"
            aria-label="Exterior Paint"
          >
            {PAINT_FINISHES.map((finish) => {
              const selected = paintFinish.id === finish.id;
              return (
                <button
                  key={finish.id}
                  type="button"
                  onClick={() => onSelectPaint(finish)}
                  aria-label={finish.name}
                  title={`${finish.name} (${finish.code})`}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                    selected
                      ? 'border-white scale-125 ring-1 ring-white/50'
                      : 'border-white/25 hover:scale-110'
                  }`}
                  style={{ backgroundColor: finish.hex }}
                />
              );
            })}
          </div>

          <span aria-hidden="true" className="w-[1px] h-3.5 bg-white/15" />

          {/* Cabin Leather Swatches (6 Merino Leather Options) */}
          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label="Interior Trim"
          >
            {INTERIOR_TRIMS.map((trim) => {
              const selected = interiorTrim.id === trim.id;
              return (
                <button
                  key={trim.id}
                  type="button"
                  onClick={() => onSelectInterior(trim)}
                  aria-label={trim.name}
                  title={trim.name}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                    selected
                      ? 'border-white scale-125 ring-1 ring-white/50'
                      : 'border-white/25 hover:scale-110'
                  }`}
                  style={{ backgroundColor: trim.primaryHex }}
                />
              );
            })}
          </div>

          <span
            aria-hidden="true"
            className="w-[1px] h-3.5 bg-white/15 hidden sm:inline-block"
          />

          {/* Minimal Physical & Acoustic Studio Controls */}
          <div className="flex items-center gap-2.5 text-[10px] font-mono tracking-[0.18em] uppercase">
            {/* Doors Control: Both Doors + Individual Left/Right */}
            <div className="flex items-center gap-1.5 border border-white/10 px-2 py-1 bg-white/[0.03]">
              <button
                type="button"
                onClick={onToggleBothDoors}
                title="Open or Close Both Frameless Doors (Left Driver & Right Passenger)"
                className={`transition-colors cursor-pointer ${
                  isBothDoorsOpen
                    ? 'text-white font-semibold'
                    : isDriverDoorOpen || isPassengerDoorOpen
                      ? 'text-[#1C69D4]'
                      : 'text-[#8E96A4] hover:text-white'
                }`}
              >
                Doors {isBothDoorsOpen ? '[Both]' : isDriverDoorOpen ? '[Left]' : isPassengerDoorOpen ? '[Right]' : ''}
              </button>
              <span className="text-white/20 select-none">|</span>
              <button
                type="button"
                onClick={() => {
                  if (manualDoorAngleDeg === null) {
                    onChangeManualDoorAngle(isDriverDoorOpen ? 0 : MAX_DOOR_ANGLE_DEG);
                  } else {
                    onChangeManualDoorAngle(
                      manualDoorAngleDeg > 10 ? 0 : MAX_DOOR_ANGLE_DEG
                    );
                  }
                }}
                title="Toggle Driver (Left) Door"
                className={`transition-colors cursor-pointer px-1 ${
                  isDriverDoorOpen ? 'text-white font-semibold' : 'text-[#8E96A4] hover:text-white'
                }`}
              >
                L
              </button>
              <button
                type="button"
                onClick={onTogglePassengerDoor}
                title="Toggle Passenger (Right) Door"
                className={`transition-colors cursor-pointer px-1 ${
                  isPassengerDoorOpen ? 'text-white font-semibold' : 'text-[#8E96A4] hover:text-white'
                }`}
              >
                R
              </button>
            </div>

            {/* Front Bonnet (Hood) Control revealing 3D S58 Engine Bay */}
            <button
              type="button"
              onClick={onToggleHood}
              title="Open / Close Front Bonnet (Twin-Dome Hood) to inspect S58 3.0L Engine Bay"
              className={`border border-white/10 px-2 py-1 transition-colors cursor-pointer ${
                isHoodOpen
                  ? 'text-white bg-white/10 border-white/30 font-semibold'
                  : 'text-[#8E96A4] bg-white/[0.03] hover:text-white'
              }`}
            >
              Bonnet {isHoodOpen ? '[38°]' : ''}
            </button>

            <button
              type="button"
              data-testid="rev-engine-button"
              onClick={onTriggerRev}
              title="Rev S58 3.0L TwinPower Turbo Inline-6"
              className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                audioStatus.isRevving
                  ? 'text-[#1C69D4]'
                  : audioStatus.engineActive
                    ? 'text-white'
                    : 'text-[#8E96A4] hover:text-white'
              }`}
            >
              <span>Rev</span>
              {audioStatus.engineActive && audioStatus.enabled && (
                <span className="text-[9px] tabular-nums text-[#8E96A4]">
                  {audioStatus.currentRpm}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="audio-toggle-button"
              onClick={onToggleAudio}
              aria-label={audioStatus.enabled ? 'Mute Engine Audio' : 'Enable Engine Audio'}
              title={
                audioStatus.enabled
                  ? 'S58 Studio Acoustics Active (Click to Mute)'
                  : 'S58 Studio Acoustics Muted (Click to Enable)'
              }
              className={`transition-colors cursor-pointer flex items-center gap-1 ${
                audioStatus.enabled
                  ? audioStatus.engineActive
                    ? 'text-white'
                    : 'text-[#C8D0DC] hover:text-white'
                  : 'text-[#59606D] hover:text-white'
              }`}
            >
              {audioStatus.enabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleFreeOrbit}
              className={`transition-colors cursor-pointer ${
                freeOrbitMode ? 'text-[#1C69D4]' : 'text-[#8E96A4] hover:text-white'
              }`}
            >
              360°
            </button>

            <button
              type="button"
              onClick={onOpenHierarchyInspector}
              className="text-[#8E96A4] hover:text-white transition-colors cursor-pointer"
            >
              Rig
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        className="px-3 py-2 bg-[#080A0F]/92 border border-white/10 text-[10px] font-mono tracking-[0.22em] uppercase text-[#8E96A4] hover:text-white transition-colors cursor-pointer shrink-0"
      >
        {collapsed ? 'Studio' : 'Hide'}
      </button>
    </div>
  );
};
