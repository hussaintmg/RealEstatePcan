import { CameraPose } from './types';

export interface DeviceAngles {
  alpha: number | null; // Z axis (0 to 360)
  beta: number | null;  // X axis (-180 to 180)
  gamma: number | null; // Y axis (-90 to 90)
}

export interface AngularVelocity {
  alphaDot: number;
  betaDot: number;
  gammaDot: number;
  magnitude: number; // deg/sec or rad/sec
}

export class PoseMath {
  /**
   * Converts device orientation Euler angles (degrees) to a normalized unit quaternion [x, y, z, w].
   * Uses Tait-Bryan angles Z-X'-Y'' convention standard for DeviceOrientationEvent.
   */
  static eulerToQuaternion(angles: DeviceAngles): [number, number, number, number] {
    const degToRad = Math.PI / 180;
    const alpha = (angles.alpha || 0) * degToRad;
    const beta = (angles.beta || 0) * degToRad;
    const gamma = (angles.gamma || 0) * degToRad;

    const c1 = Math.cos(alpha / 2);
    const s1 = Math.sin(alpha / 2);
    const c2 = Math.cos(beta / 2);
    const s2 = Math.sin(beta / 2);
    const c3 = Math.cos(gamma / 2);
    const s3 = Math.sin(gamma / 2);

    const w = c1 * c2 * c3 + s1 * s2 * s3;
    const x = c1 * s2 * c3 + s1 * c2 * s3;
    const y = c1 * c2 * s3 - s1 * s2 * c3;
    const z = s1 * c2 * c3 - c1 * s2 * s3;

    const norm = Math.sqrt(x * x + y * y + z * z + w * w) || 1;
    return [x / norm, y / norm, z / norm, w / norm];
  }

  /**
   * Calculates instantaneous angular velocity between two timestamped orientation samples.
   */
  static computeAngularVelocity(
    prev: { angles: DeviceAngles; timestamp: number },
    curr: { angles: DeviceAngles; timestamp: number }
  ): AngularVelocity {
    const dt = Math.max((curr.timestamp - prev.timestamp) / 1000, 0.001); // in seconds

    const dAlpha = ((curr.angles.alpha || 0) - (prev.angles.alpha || 0)) / dt;
    const dBeta = ((curr.angles.beta || 0) - (prev.angles.beta || 0)) / dt;
    const dGamma = ((curr.angles.gamma || 0) - (prev.angles.gamma || 0)) / dt;

    const magnitude = Math.sqrt(dAlpha * dAlpha + dBeta * dBeta + dGamma * dGamma);

    return {
      alphaDot: dAlpha,
      betaDot: dBeta,
      gammaDot: dGamma,
      magnitude,
    };
  }

  /**
   * Estimates camera focal length (in pixels) given image width, height, and estimated horizontal FOV (degrees).
   */
  static estimateIntrinsics(width: number, height: number, horizontalFovDeg: number = 65) {
    const fovRad = (horizontalFovDeg * Math.PI) / 180;
    const fx = width / (2 * Math.tan(fovRad / 2));
    const fy = fx; // Assume square pixels
    const cx = width / 2;
    const cy = height / 2;

    return {
      width,
      height,
      fx,
      fy,
      cx,
      cy,
      fov: horizontalFovDeg,
    };
  }
}
