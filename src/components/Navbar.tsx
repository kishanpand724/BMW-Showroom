import React from 'react';
import { ScrollSceneDefinition } from '../utils/carScrollChoreography';

export interface NavItem {
  id: string;
  label: string;
  category: 'design' | 'interior' | 'performance' | 'explore';
  sceneIndex: number;
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'nav-design', label: 'Design', category: 'design', sceneIndex: 1 },
  { id: 'nav-interior', label: 'Interior', category: 'interior', sceneIndex: 3 },
  { id: 'nav-performance', label: 'Performance', category: 'performance', sceneIndex: 5 },
  { id: 'nav-explore', label: 'Explore', category: 'explore', sceneIndex: 6 },
];

interface NavbarProps {
  activeScene: ScrollSceneDefinition;
  isBelowShowroom: boolean;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  onJumpToScene: (sceneIndex: number) => void;
  onOpenInquiry: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScene,
  isBelowShowroom,
  progressBarRef,
  onJumpToScene,
  onOpenInquiry,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#040508]/90 via-[#040508]/55 to-transparent">
      {/* Subtle 1px Scroll Progress Hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.06] overflow-hidden">
        <div
          ref={progressBarRef}
          className="h-full bg-[#1C69D4] origin-left will-change-transform"
          style={{ transform: 'scaleX(0.01)' }}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-14 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Minimal Brand Mark */}
        <button
          type="button"
          onClick={() => onJumpToScene(0)}
          className="flex items-center gap-3 text-left focus:outline-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <svg
            viewBox="0 0 48 48"
            className="w-6 h-6 shrink-0"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="22" fill="#080A0F" stroke="rgba(255,255,255,0.82)" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="14.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
            <path d="M24 9.5 A14.5 14.5 0 0 0 9.5 24 L24 24 Z" fill="#1C69D4" />
            <path d="M24 38.5 A14.5 14.5 0 0 0 38.5 24 L24 24 Z" fill="#1C69D4" />
            <path d="M24 9.5 A14.5 14.5 0 0 1 38.5 24 L24 24 Z" fill="#F5F7FA" />
            <path d="M24 38.5 A14.5 14.5 0 0 1 9.5 24 L24 24 Z" fill="#F5F7FA" />
          </svg>
          <span className="font-display text-xs font-bold tracking-[0.28em] text-[#F5F7FA] uppercase whitespace-nowrap shrink-0">
            BMW M4
          </span>
        </button>

        {/* Zone 2: Minimal Navigation (Design, Interior, Performance, Explore) */}
        <nav aria-label="Primary sections" className="hidden md:flex items-center gap-10">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive =
              !isBelowShowroom && activeScene.navCategory === item.category;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onJumpToScene(item.sceneIndex)}
                className={`relative py-1 text-[11px] font-medium tracking-[0.22em] uppercase transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'text-white' : 'text-[#8E96A4] hover:text-white'
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[1px] bg-white transition-transform duration-300 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Minimal Reserve Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenInquiry}
            className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#D8DEE8] hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reserve
          </button>
        </div>
      </div>
    </header>
  );
};
