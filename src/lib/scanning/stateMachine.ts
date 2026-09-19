import { PropertyScanStatus, ProcessingStage, ProcessingJobStatus } from './types';

/**
 * Permitted transitions for the top-level PropertyScan entity.
 */
const VALID_SCAN_TRANSITIONS: Record<PropertyScanStatus, PropertyScanStatus[]> = {
  draft: ['capturing', 'uploading', 'failed'],
  capturing: ['uploading', 'draft', 'failed'],
  uploading: ['processing', 'capturing', 'failed'],
  processing: ['ready', 'failed'],
  ready: ['processing', 'draft'], // allows re-processing or archive/draft
  failed: ['draft', 'capturing', 'uploading', 'processing'], // allows retry
};

/**
 * Permitted transitions for the asynchronous reconstruction job.
 */
const VALID_JOB_TRANSITIONS: Record<ProcessingJobStatus, ProcessingJobStatus[]> = {
  queued: ['processing', 'cancelled', 'failed'],
  processing: ['completed', 'failed', 'cancelled'],
  completed: ['queued'], // allows retry/re-queue
  failed: ['queued'],
  cancelled: ['queued'],
};

/**
 * Permitted sequential stage progression during processing.
 */
const STAGE_ORDER: ProcessingStage[] = [
  'queued',
  'validating',
  'camera_tracking',
  'sparse_pointcloud',
  'dense_reconstruction',
  'mesh_generation',
  'texturing',
  'gaussian_splatting',
  'floor_plan_synthesis',
  'completed',
];

export class ScanStateMachine {
  /**
   * Evaluates whether a proposed scan state transition is legal.
   */
  static canTransitionScan(current: PropertyScanStatus, next: PropertyScanStatus): boolean {
    if (current === next) return true;
    const allowed = VALID_SCAN_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Asserts that a scan transition is legal or throws a standardized error.
   */
  static assertScanTransition(current: PropertyScanStatus, next: PropertyScanStatus): void {
    if (!this.canTransitionScan(current, next)) {
      throw new Error(
        `Invalid PropertyScan state transition from '${current}' to '${next}'. Allowed targets: [${
          VALID_SCAN_TRANSITIONS[current]?.join(', ') || 'none'
        }]`
      );
    }
  }

  /**
   * Evaluates whether a proposed processing job transition is legal.
   */
  static canTransitionJob(current: ProcessingJobStatus, next: ProcessingJobStatus): boolean {
    if (current === next) return true;
    const allowed = VALID_JOB_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Validates stage progression for an active reconstruction worker.
   */
  static getNextStage(currentStage: ProcessingStage): ProcessingStage | null {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
      return null;
    }
    return STAGE_ORDER[currentIndex + 1];
  }

  /**
   * Calculates estimated percentage progress from current stage.
   */
  static getStageProgressPercentage(stage: ProcessingStage): number {
    switch (stage) {
      case 'queued':
        return 5;
      case 'validating':
        return 12;
      case 'camera_tracking':
        return 25;
      case 'sparse_pointcloud':
        return 40;
      case 'dense_reconstruction':
        return 58;
      case 'mesh_generation':
        return 72;
      case 'texturing':
        return 84;
      case 'gaussian_splatting':
        return 92;
      case 'floor_plan_synthesis':
        return 98;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  }
}
