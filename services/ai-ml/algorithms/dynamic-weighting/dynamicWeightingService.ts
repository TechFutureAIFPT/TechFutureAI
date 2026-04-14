/**
 * dynamicWeightingService.ts — Entry point cho Dynamic Weighting
 */

export { applyDynamicBoost, calculateBoost, detectBoostLevel } from './dynamicBoost';
export type { BoostSignal, DynamicBoostConfig } from './dynamicBoost';

export { analyzeCareerVelocity, parseExperienceToMilestones } from './careerVelocity';
export type { CareerMilestone, CareerVelocityResult } from './careerVelocity';

export { adjustWeightsByContext } from './weightingEngine';
export type { WeightedContext, ContextualCriteria } from './weightingEngine';
