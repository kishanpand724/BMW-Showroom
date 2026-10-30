import { NAV_CHAPTERS } from '../data/bmwData';

/**
 * Clamps a numeric value between min and max.
 */
export function clampProgress(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes the active navigation chapter ID across the 8 main story chapters based on page scroll progress (0..1).
 */
export function getActiveChapterIdFromProgress(progress: number): string {
  const p = clampProgress(progress, 0, 1);
  const count = NAV_CHAPTERS.length;
  const idx = Math.min(count - 1, Math.floor(p * count));
  return NAV_CHAPTERS[idx].id;
}

/**
 * Computes the active 0-based index for a multi-step scroll sequence given a normalized progress [0, 1].
 */
export function getSequenceStepIndex(progress: number, totalSteps: number): number {
  if (totalSteps <= 1) return 0;
  const p = clampProgress(progress, 0, 1);
  return Math.min(totalSteps - 1, Math.floor(p * totalSteps));
}

export interface ConsultationFormInput {
  fullName: string;
  email: string;
  city: string;
}

export interface ConsultationValidationResult {
  valid: boolean;
  error?: string;
}

export function validateConsultationForm(input: ConsultationFormInput): ConsultationValidationResult {
  const name = input.fullName.trim();
  const email = input.email.trim();
  const city = input.city.trim();

  if (name.length < 2) {
    return { valid: false, error: 'Please enter your name.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (city.length < 2) {
    return { valid: false, error: 'Please enter your preferred city or showroom location.' };
  }
  return { valid: true };
}
