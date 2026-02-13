// ============================================
// DISTANCE CONSTANTS
// ============================================
export const DISTANCES = {
  '1mile': { meters: 1609.344, name: '1 Mile', shortName: '1mi' },
  '5k': { meters: 5000, name: '5K', shortName: '5K' },
  '10k': { meters: 10000, name: '10K', shortName: '10K' },
  '15k': { meters: 15000, name: '15K', shortName: '15K' },
  '10mile': { meters: 16093.44, name: '10 Mile', shortName: '10mi' },
  'halfMarathon': { meters: 21097.5, name: 'Half Marathon', shortName: 'HM' },
  'marathon': { meters: 42195, name: 'Marathon', shortName: 'Mar' },
  '50k': { meters: 50000, name: '50K Ultra', shortName: '50K' },
} as const;

export type DistanceKey = keyof typeof DISTANCES;

// ============================================
// TIME UTILITIES
// ============================================
export interface RunTime {
  hours: number;
  minutes: number;
  seconds: number;
}

export function timeToSeconds(time: RunTime): number {
  return time.hours * 3600 + time.minutes * 60 + time.seconds;
}

export function secondsToTime(totalSeconds: number): RunTime {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { hours, minutes, seconds };
}

export function formatTime(time: RunTime): string {
  if (time.hours > 0) {
    return `${time.hours}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
  }
  return `${time.minutes}:${String(time.seconds).padStart(2, '0')}`;
}

export function formatTimeFromSeconds(totalSeconds: number): string {
  return formatTime(secondsToTime(totalSeconds));
}

// ============================================
// PACE CALCULATIONS
// ============================================

export function calculatePace(
  distanceMeters: number,
  totalSeconds: number,
  unit: 'km' | 'mile'
): RunTime {
  const unitDistance = unit === 'km' ? 1000 : 1609.344;
  const paceSeconds = totalSeconds / (distanceMeters / unitDistance);
  return secondsToTime(paceSeconds);
}

export function calculatePaceSeconds(
  distanceMeters: number,
  totalSeconds: number,
  unit: 'km' | 'mile'
): number {
  const unitDistance = unit === 'km' ? 1000 : 1609.344;
  return totalSeconds / (distanceMeters / unitDistance);
}

export function calculateTime(
  distanceMeters: number,
  paceSecondsPerUnit: number,
  unit: 'km' | 'mile'
): number {
  const unitDistance = unit === 'km' ? 1000 : 1609.344;
  return paceSecondsPerUnit * (distanceMeters / unitDistance);
}

export function calculateDistance(
  totalSeconds: number,
  paceSecondsPerUnit: number,
  unit: 'km' | 'mile'
): number {
  const unitDistance = unit === 'km' ? 1000 : 1609.344;
  return (totalSeconds / paceSecondsPerUnit) * unitDistance;
}

export function convertPace(
  paceSeconds: number,
  from: 'km' | 'mile',
  to: 'km' | 'mile'
): number {
  if (from === to) return paceSeconds;
  const factor = 1609.344 / 1000;
  return from === 'km' ? paceSeconds * factor : paceSeconds / factor;
}

export function paceToSpeed(paceSecondsPerUnit: number): number {
  return 3600 / paceSecondsPerUnit;
}

// ============================================
// RACE PREDICTION (Riegel Formula)
// ============================================

export function predictRaceTime(
  knownDistanceMeters: number,
  knownTimeSeconds: number,
  targetDistanceMeters: number,
  fatigueFactor: number = 1.06
): number {
  return knownTimeSeconds * Math.pow(
    targetDistanceMeters / knownDistanceMeters,
    fatigueFactor
  );
}

export function predictRaceTimeCameron(
  knownDistanceMeters: number,
  knownTimeSeconds: number,
  targetDistanceMeters: number
): number {
  const a = 13.49681 - (0.000030363 * knownDistanceMeters) +
    (835.7114 / Math.pow(knownDistanceMeters, 0.7905));
  const b = 13.49681 - (0.000030363 * targetDistanceMeters) +
    (835.7114 / Math.pow(targetDistanceMeters, 0.7905));
  return (knownTimeSeconds / a) * b;
}

// ============================================
// VO2MAX ESTIMATION (Jack Daniels)
// ============================================

export function estimateVO2max(
  distanceMeters: number,
  timeSeconds: number
): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes;

  const percentVO2max = 0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const vo2 = -4.60 +
    0.182258 * velocity +
    0.000104 * Math.pow(velocity, 2);

  return vo2 / percentVO2max;
}

// ============================================
// VDOT / TRAINING PACES (Daniels-based)
// ============================================

export interface TrainingPaces {
  easy: { min: number; max: number };
  marathon: { min: number; max: number };
  threshold: { min: number; max: number };
  interval: { min: number; max: number };
  repetition: { min: number; max: number };
}

export function calculateTrainingPaces(
  raceDistanceMeters: number,
  raceTimeSeconds: number
): TrainingPaces {
  const easyPace = raceTimeSeconds / (raceDistanceMeters / 1000);

  return {
    easy: {
      min: Math.round(easyPace * 1.25),
      max: Math.round(easyPace * 1.40),
    },
    marathon: {
      min: Math.round(easyPace * 1.10),
      max: Math.round(easyPace * 1.15),
    },
    threshold: {
      min: Math.round(easyPace * 1.00),
      max: Math.round(easyPace * 1.05),
    },
    interval: {
      min: Math.round(easyPace * 0.88),
      max: Math.round(easyPace * 0.93),
    },
    repetition: {
      min: Math.round(easyPace * 0.80),
      max: Math.round(easyPace * 0.85),
    },
  };
}

// ============================================
// AGE GRADING
// ============================================

export function calculateAgeGrade(
  timeSeconds: number,
  distanceMeters: number,
  age: number,
  gender: 'male' | 'female'
): { percentage: number; ageGradedTime: number; level: string } {
  const peakAge = gender === 'male' ? 27 : 29;
  const declineRate = gender === 'male' ? 0.005 : 0.006;

  let ageFactor: number;
  if (age <= peakAge) {
    const youngAdjust = age < 20 ? 1 + (20 - age) * 0.008 : 1;
    ageFactor = youngAdjust;
  } else {
    const yearsOverPeak = age - peakAge;
    ageFactor = 1 + (yearsOverPeak * declineRate) +
      (yearsOverPeak > 40 ? (yearsOverPeak - 40) * 0.003 : 0);
  }

  const percentage = (1 / ageFactor) * 100;
  const ageGradedTime = timeSeconds / ageFactor;

  let level: string;
  if (percentage >= 90) level = 'World Class';
  else if (percentage >= 80) level = 'National';
  else if (percentage >= 70) level = 'Regional';
  else if (percentage >= 60) level = 'Local';
  else level = 'Recreational';

  return { percentage, ageGradedTime, level };
}

// ============================================
// HEART RATE ZONES (Karvonen Method)
// ============================================

export interface HRZone {
  min: number;
  max: number;
  name: string;
  description: string;
  color: string;
}

export interface HRZones {
  zone1: HRZone;
  zone2: HRZone;
  zone3: HRZone;
  zone4: HRZone;
  zone5: HRZone;
}

export function calculateHRZones(
  maxHR: number,
  restingHR: number
): HRZones {
  const hrReserve = maxHR - restingHR;

  const zone = (lowPct: number, highPct: number) => ({
    min: Math.round(restingHR + hrReserve * lowPct),
    max: Math.round(restingHR + hrReserve * highPct),
  });

  return {
    zone1: { ...zone(0.50, 0.60), name: 'Recovery', description: 'Very easy effort, active recovery walks and easy jogs', color: '#3B82F6' },
    zone2: { ...zone(0.60, 0.70), name: 'Aerobic / Easy', description: 'Conversational pace, the bulk of your training should be here', color: '#22C55E' },
    zone3: { ...zone(0.70, 0.80), name: 'Tempo', description: 'Comfortably hard, marathon to half marathon effort', color: '#EAB308' },
    zone4: { ...zone(0.80, 0.90), name: 'Threshold', description: 'Hard effort, 10K to 5K race intensity', color: '#F97316' },
    zone5: { ...zone(0.90, 1.00), name: 'VO2max / Speed', description: 'Maximum effort, interval and sprint training', color: '#EF4444' },
  };
}

export function estimateMaxHR(age: number): number {
  return Math.round(208 - 0.7 * age);
}

// ============================================
// CALORIE ESTIMATION
// ============================================

export function calculateCalories(
  weightKg: number,
  distanceKm: number,
  paceMinPerKm: number
): number {
  let met: number;
  if (paceMinPerKm > 7.5) met = 6.0;
  else if (paceMinPerKm > 6.2) met = 8.3;
  else if (paceMinPerKm > 5.4) met = 9.8;
  else if (paceMinPerKm > 4.8) met = 11.0;
  else if (paceMinPerKm > 4.3) met = 11.8;
  else if (paceMinPerKm > 3.7) met = 12.8;
  else met = 14.5;

  const durationHours = (distanceKm * paceMinPerKm) / 60;
  return Math.round(met * weightKg * durationHours);
}

// ============================================
// SPLIT CALCULATIONS
// ============================================

export interface Split {
  number: number;
  distance: string;
  splitTime: string;
  cumulativeTime: string;
  pace: string;
}

export function calculateEvenSplits(
  totalDistanceMeters: number,
  totalTimeSeconds: number,
  splitDistanceMeters: number,
  unit: 'km' | 'mile'
): Split[] {
  const numFullSplits = Math.floor(totalDistanceMeters / splitDistanceMeters);
  const remainderMeters = totalDistanceMeters % splitDistanceMeters;
  const pacePerMeter = totalTimeSeconds / totalDistanceMeters;

  const splits: Split[] = [];
  let cumulativeSeconds = 0;

  for (let i = 1; i <= numFullSplits; i++) {
    const splitSeconds = pacePerMeter * splitDistanceMeters;
    cumulativeSeconds += splitSeconds;
    splits.push({
      number: i,
      distance: `${i} ${unit}`,
      splitTime: formatTime(secondsToTime(splitSeconds)),
      cumulativeTime: formatTime(secondsToTime(cumulativeSeconds)),
      pace: formatTime(secondsToTime(splitSeconds)) + `/${unit}`,
    });
  }

  if (remainderMeters > 0) {
    const splitSeconds = pacePerMeter * remainderMeters;
    cumulativeSeconds += splitSeconds;
    const remainderDisplay = unit === 'km'
      ? (remainderMeters / 1000).toFixed(2)
      : (remainderMeters / 1609.344).toFixed(2);
    splits.push({
      number: numFullSplits + 1,
      distance: `${remainderDisplay} ${unit}`,
      splitTime: formatTime(secondsToTime(splitSeconds)),
      cumulativeTime: formatTime(secondsToTime(cumulativeSeconds)),
      pace: formatTime(calculatePace(remainderMeters, splitSeconds, unit)) + `/${unit}`,
    });
  }

  return splits;
}

export function calculateNegativeSplits(
  totalDistanceMeters: number,
  totalTimeSeconds: number,
  splitDistanceMeters: number,
  negativeSplitPercent: number,
  unit: 'km' | 'mile'
): Split[] {
  const halfDistance = totalDistanceMeters / 2;
  const factor = negativeSplitPercent / 100;

  const firstHalfPacePerMeter = (2 * totalTimeSeconds) / (totalDistanceMeters * (2 - factor));
  const secondHalfPacePerMeter = firstHalfPacePerMeter * (1 - factor);

  const numFullSplits = Math.floor(totalDistanceMeters / splitDistanceMeters);
  const remainderMeters = totalDistanceMeters % splitDistanceMeters;
  const splits: Split[] = [];
  let cumulativeSeconds = 0;

  for (let i = 1; i <= numFullSplits; i++) {
    const splitStart = (i - 1) * splitDistanceMeters;
    const splitEnd = i * splitDistanceMeters;
    const midpoint = (splitStart + splitEnd) / 2;
    const isSecondHalf = midpoint > halfDistance;
    const pacePerMeter = isSecondHalf ? secondHalfPacePerMeter : firstHalfPacePerMeter;

    const splitSeconds = pacePerMeter * splitDistanceMeters;
    cumulativeSeconds += splitSeconds;
    splits.push({
      number: i,
      distance: `${i} ${unit}`,
      splitTime: formatTime(secondsToTime(splitSeconds)),
      cumulativeTime: formatTime(secondsToTime(cumulativeSeconds)),
      pace: formatTime(secondsToTime(splitSeconds)) + `/${unit}`,
    });
  }

  if (remainderMeters > 0) {
    const splitStart = numFullSplits * splitDistanceMeters;
    const midpoint = splitStart + remainderMeters / 2;
    const isSecondHalf = midpoint > halfDistance;
    const pacePerMeter = isSecondHalf ? secondHalfPacePerMeter : firstHalfPacePerMeter;

    const splitSeconds = pacePerMeter * remainderMeters;
    cumulativeSeconds += splitSeconds;
    const remainderDisplay = unit === 'km'
      ? (remainderMeters / 1000).toFixed(2)
      : (remainderMeters / 1609.344).toFixed(2);
    splits.push({
      number: numFullSplits + 1,
      distance: `${remainderDisplay} ${unit}`,
      splitTime: formatTime(secondsToTime(splitSeconds)),
      cumulativeTime: formatTime(secondsToTime(cumulativeSeconds)),
      pace: formatTime(calculatePace(remainderMeters, splitSeconds, unit)) + `/${unit}`,
    });
  }

  return splits;
}

// ============================================
// SIMPLE SPLIT CALCULATION (for race strategy)
// ============================================

/**
 * Calculate split times per km with a gradient (negative/positive)
 * @param totalTimeSeconds - Target finish time
 * @param totalDistanceKm - Race distance in km
 * @param numSplits - Number of splits (usually one per km)
 * @param gradientPercent - Negative = negative split (faster finish), Positive = positive split
 * @returns Array of split times in seconds per split
 */
export function calculateSplits(
  totalTimeSeconds: number,
  totalDistanceKm: number,
  numSplits: number,
  gradientPercent: number
): number[] {
  const baseSplit = totalTimeSeconds / numSplits;
  const splits: number[] = [];

  for (let i = 0; i < numSplits; i++) {
    // Linear gradient from start to finish
    const progress = i / Math.max(numSplits - 1, 1); // 0 to 1
    const adjustment = 1 + (gradientPercent / 100) * (0.5 - progress);
    splits.push(baseSplit * adjustment);
  }

  // Handle partial last split
  const fullKm = Math.floor(totalDistanceKm);
  const partial = totalDistanceKm - fullKm;
  if (partial > 0 && numSplits > fullKm) {
    splits[splits.length - 1] *= partial;
  }

  // Normalize so they sum to totalTimeSeconds
  const sum = splits.reduce((a, b) => a + b, 0);
  const factor = totalTimeSeconds / sum;
  return splits.map((s) => s * factor);
}

// ============================================
// TREADMILL CONVERSION
// ============================================

export function treadmillToOutdoorPace(
  treadmillPaceSecondsPerKm: number,
  inclinePercent: number
): number {
  const windResistanceAdjustment = 4;
  const inclineAdjustment = inclinePercent * 4.5;
  return treadmillPaceSecondsPerKm - inclineAdjustment + windResistanceAdjustment;
}

export function speedToPace(speedKmh: number): number {
  if (speedKmh <= 0) return 0;
  return 3600 / speedKmh;
}

// ============================================
// RUN/WALK CALCULATOR
// ============================================

export function calculateRunWalk(
  distanceMeters: number,
  runPaceSecondsPerKm: number,
  walkPaceSecondsPerKm: number,
  runIntervalMinutes: number,
  walkIntervalMinutes: number
): { totalTimeSeconds: number; effectivePaceSecondsPerKm: number; intervals: number } {
  const runSpeedMps = 1000 / runPaceSecondsPerKm;
  const walkSpeedMps = 1000 / walkPaceSecondsPerKm;

  const cycleTime = (runIntervalMinutes + walkIntervalMinutes) * 60;
  const runDistance = runSpeedMps * runIntervalMinutes * 60;
  const walkDistance = walkSpeedMps * walkIntervalMinutes * 60;
  const cycleDistance = runDistance + walkDistance;

  const fullCycles = Math.floor(distanceMeters / cycleDistance);
  const remainder = distanceMeters - fullCycles * cycleDistance;

  let totalTime = fullCycles * cycleTime;

  if (remainder > 0) {
    const runDistInCycle = runSpeedMps * runIntervalMinutes * 60;
    if (remainder <= runDistInCycle) {
      totalTime += remainder / runSpeedMps;
    } else {
      totalTime += runIntervalMinutes * 60 + (remainder - runDistInCycle) / walkSpeedMps;
    }
  }

  const effectivePace = totalTime / (distanceMeters / 1000);
  const intervals = Math.ceil(distanceMeters / cycleDistance);

  return {
    totalTimeSeconds: Math.round(totalTime),
    effectivePaceSecondsPerKm: Math.round(effectivePace),
    intervals,
  };
}

