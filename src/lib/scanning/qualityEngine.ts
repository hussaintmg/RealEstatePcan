export interface QualityAssessmentResult {
  isAccepted: boolean;
  blurScore: number;
  meanLuminance: number;
  motionVelocity: number;
  overlapScore: number;
  warnings: string[];
  guidanceMessage: string;
}

export interface QualityEvaluationParams {
  imageData?: { data: Uint8ClampedArray | Uint8Array; width: number; height: number };
  grayData?: Uint8Array;
  width: number;
  height: number;
  motionVelocity: number;
  currPoseQuaternion: [number, number, number, number];
  prevPoseQuaternion?: [number, number, number, number];
  blurThreshold?: number;
  minLuminance?: number;
  maxLuminance?: number;
  maxVelocityDegPerSec?: number;
}

export class QualityEngine {
  /**
   * Evaluates image brightness, shadow clipping, and highlight blowout.
   * Standard Rec. 709 luminance weights: 0.2126*R + 0.7152*G + 0.0722*B.
   */
  static computeLuminance(
    data: Uint8ClampedArray | Uint8Array,
    pixelCount: number
  ): { meanLuminance: number; underexposedRatio: number; overexposedRatio: number; isAcceptable: boolean } {
    let sumLuminance = 0;
    let underexposedCount = 0;
    let overexposedCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      sumLuminance += lum;
      if (lum < 25) underexposedCount++;
      if (lum > 240) overexposedCount++;
    }

    const meanLuminance = sumLuminance / pixelCount;
    const underexposedRatio = underexposedCount / pixelCount;
    const overexposedRatio = overexposedCount / pixelCount;

    const isAcceptable =
      meanLuminance >= 35 &&
      meanLuminance <= 225 &&
      underexposedRatio < 0.35 &&
      overexposedRatio < 0.25;

    return {
      meanLuminance,
      underexposedRatio,
      overexposedRatio,
      isAcceptable,
    };
  }

  /**
   * Computes blur score via variance of the discrete Laplacian operator on grayscale pixel data.
   * Discrete 3x3 Laplacian kernel:
   * [ 0,  1,  0]
   * [ 1, -4,  1]
   * [ 0,  1,  0]
   */
  static computeLaplacianVariance(
    grayData: Uint8Array,
    width: number,
    height: number
  ): number {
    if (width < 3 || height < 3) return 0;

    let sum = 0;
    let sumSq = 0;
    let count = 0;

    // Convolve with 3x3 Laplacian kernel omitting boundary pixels
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const center = grayData[rowOffset + x];
        const up = grayData[rowOffset - width + x];
        const down = grayData[rowOffset + width + x];
        const left = grayData[rowOffset + x - 1];
        const right = grayData[rowOffset + x + 1];

        // L = up + down + left + right - 4 * center
        const laplacian = up + down + left + right - 4 * center;

        sum += laplacian;
        sumSq += laplacian * laplacian;
        count++;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;

    return Math.max(variance, 0);
  }

  /**
   * Estimates visual overlap percentage (0.0 to 1.0) between consecutive orientations using quaternion dot product.
   * Overlap is proportional to angular distance between camera viewing directions.
   */
  static estimateOverlap(
    q1: [number, number, number, number],
    q2: [number, number, number, number]
  ): number {
    // Quaternion dot product = cos(theta / 2)
    const dot = Math.abs(q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3]);
    const clampedDot = Math.min(Math.max(dot, 0), 1.0);

    // Half angle in radians
    const halfAngleRad = Math.acos(clampedDot);
    const angleDeg = halfAngleRad * 2 * (180 / Math.PI);

    // Overlap model: 0 deg = 100% overlap, 60 deg = 0% overlap
    const overlap = Math.max(0, 1.0 - angleDeg / 60);
    return Math.min(overlap, 1.0);
  }

  /**
   * Full quality evaluation against configurable thresholds.
   */
  static evaluateFrameQuality(params: QualityEvaluationParams): QualityAssessmentResult {
    const blurThreshold = params.blurThreshold ?? 80;
    const minLuminance = params.minLuminance ?? 40;
    const maxLuminance = params.maxLuminance ?? 220;
    const maxVelocity = params.maxVelocityDegPerSec ?? 45;

    const warnings: string[] = [];

    // 1. Motion velocity check
    if (params.motionVelocity > maxVelocity) {
      warnings.push('Slow down: Camera movement too fast');
    }

    // 2. Luminance check
    let meanLuminance = 120;
    if (params.imageData) {
      const lumResult = this.computeLuminance(
        params.imageData.data,
        params.imageData.width * params.imageData.height
      );
      meanLuminance = lumResult.meanLuminance;
      if (meanLuminance < minLuminance) {
        warnings.push('Too dark: Increase room lighting');
      } else if (meanLuminance > maxLuminance) {
        warnings.push('Too bright: Glare or overexposed');
      }
    }

    // 3. Blur score check
    let blurScore = 150;
    if (params.grayData) {
      blurScore = this.computeLaplacianVariance(params.grayData, params.width, params.height);
      if (blurScore < blurThreshold) {
        warnings.push('Blurry image: Hold steady');
      }
    }

    // 4. Overlap check
    let overlapScore = 0.8;
    if (params.prevPoseQuaternion) {
      overlapScore = this.estimateOverlap(params.prevPoseQuaternion, params.currPoseQuaternion);
      if (overlapScore < 0.6) {
        warnings.push('Insufficient overlap: Move slower to maintain coverage');
      } else if (overlapScore > 0.96) {
        // Redundant / duplicate view
        warnings.push('Negligible movement: Continue panning');
      }
    }

    // Decision logic
    const isAccepted =
      warnings.length === 0 ||
      (warnings.length === 1 && warnings[0].startsWith('Negligible') === false);

    let guidanceMessage = 'Scanning active: Excellent motion & clarity';
    if (warnings.length > 0) {
      guidanceMessage = warnings[0];
    }

    return {
      isAccepted: isAccepted && warnings.length === 0,
      blurScore,
      meanLuminance,
      motionVelocity: params.motionVelocity,
      overlapScore,
      warnings,
      guidanceMessage,
    };
  }

  /**
   * Estimates cumulative room coverage percentage (0 to 100%) by dividing the surrounding
   * 360-degree cylinder into discrete angular bins and tracking visited bins.
   */
  static estimateCoverage(
    poses: Array<[number, number, number, number]>,
    totalBins: number = 36 // 10 degrees per bin
  ): { percentage: number; visitedBins: number; totalBins: number } {
    if (poses.length === 0) {
      return { percentage: 0, visitedBins: 0, totalBins };
    }

    const visited = new Set<number>();

    const binSize = 360 / totalBins;
    for (const q of poses) {
      // Extract yaw (heading) from quaternion
      // yaw = atan2(2*(w*z + x*y), 1 - 2*(y^2 + z^2))
      const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
      const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
      let yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
      if (yaw < 0) yaw += 360;

      const binIndex = Math.floor((yaw + 1e-5) / binSize) % totalBins;
      visited.add(binIndex);
    }

    const percentage = Math.min(Math.round((visited.size / totalBins) * 100), 100);

    return {
      percentage,
      visitedBins: visited.size,
      totalBins,
    };
  }
}
