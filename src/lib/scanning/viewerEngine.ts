import * as THREE from 'three';
import { ScanPoint3D } from './types';

export type ViewerCameraMode = 'orbit' | 'dollhouse' | 'first_person';

export interface ViewerRoomBookmark {
  id: string;
  name: string;
  targetPosition: [number, number, number];
  cameraPosition: [number, number, number];
}

export class ViewerEngine {
  /**
   * Calculates camera position and target for Dollhouse mode with an elevated 45-degree view.
   */
  static computeDollhouseCamera(
    bounds: { min: ScanPoint3D; max: ScanPoint3D }
  ): { position: [number, number, number]; target: [number, number, number]; clippingPlaneY: number } {
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;

    const spanX = bounds.max.x - bounds.min.x;
    const spanZ = bounds.max.z - bounds.min.z;
    const radius = Math.max(spanX, spanZ, 4) * 1.5;

    // 45-degree elevation
    const cameraX = centerX;
    const cameraY = centerY + radius * Math.sin(Math.PI / 4);
    const cameraZ = centerZ + radius * Math.cos(Math.PI / 4);

    // Ceiling clipping plane slightly below maximum Y to expose interior floorplan
    const clippingPlaneY = bounds.max.y - 0.2;

    return {
      position: [cameraX, cameraY, cameraZ],
      target: [centerX, centerY, centerZ],
      clippingPlaneY,
    };
  }

  /**
   * Calculates camera position for First-Person mode placed at eye level (1.6m) inside a room.
   */
  static computeFirstPersonCamera(
    roomCenter: ScanPoint3D,
    floorElevation: number = 0
  ): { position: [number, number, number]; target: [number, number, number] } {
    const eyeHeight = floorElevation + 1.6; // 1.6 meters eye height
    const position: [number, number, number] = [roomCenter.x, eyeHeight, roomCenter.z];
    const target: [number, number, number] = [roomCenter.x, eyeHeight, roomCenter.z - 3.0]; // Looking forward

    return { position, target };
  }

  /**
   * Projects a 3D world coordinate to 2D normalized device coordinates (NDC: [-1, 1]) and screen pixels.
   */
  static project3DToScreen(
    point: ScanPoint3D,
    cameraPosition: [number, number, number],
    cameraTarget: [number, number, number],
    screenWidth: number,
    screenHeight: number,
    fov: number = 60
  ): { screenX: number; screenY: number; isVisible: boolean } {
    const camera = new THREE.PerspectiveCamera(fov, screenWidth / screenHeight, 0.1, 100);
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const v = new THREE.Vector3(point.x, point.y, point.z);
    v.project(camera);

    // Visible if in front of camera (z between -1 and 1)
    const isVisible = v.z < 1.0;

    const screenX = Math.round(((v.x + 1) / 2) * screenWidth);
    const screenY = Math.round(((-v.y + 1) / 2) * screenHeight);

    return { screenX, screenY, isVisible };
  }

  /**
   * Creates clipping plane for dollhouse ceiling removal.
   */
  static createCeilingClippingPlane(height: number): THREE.Plane {
    // Plane pointing down (0, -1, 0) with constant height
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), height);
  }
}
