import { FloorPlanVectorData, RoomType, ScanPoint2D, SemanticOpening, SemanticWall, CalibrationMethod } from './types';
import { ScanRoom, IScanRoom } from '@/models/ScanRoom';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanArtifact } from '@/models/ScanArtifact';
import { CalibrationReference } from '@/models/CalibrationReference';
import { ScanStorageAdapter } from './storageAdapter';
import { ScanService } from './scanService';
import { TokenPayload } from '@/lib/session';

export class FloorPlanEngine {
  /**
   * Synthesizes structured FloorPlanVectorData from an array of ScanRooms.
   * Preserves open wall contours without fabricating closing walls for incomplete scans.
   */
  static generateFloorPlanJson(
    rooms: IScanRoom[],
    optionsOrScale:
      | {
          scalePixelsPerMeter?: number;
          isCalibrated?: boolean;
          calibrationMethod?: CalibrationMethod;
        }
      | number = 50
  ): FloorPlanVectorData {
    const opts = typeof optionsOrScale === 'number'
      ? { scalePixelsPerMeter: optionsOrScale, isCalibrated: false }
      : optionsOrScale;
    const scalePixelsPerMeter = opts.scalePixelsPerMeter || 50;
    const isCalibrated = opts.isCalibrated ?? false;
    let totalAreaSqMeters = 0;

    const formattedRooms = rooms.map((room) => {
      const areaM = room.dimensions.areaSqMeters || (room.dimensions.lengthMeters * room.dimensions.widthMeters);
      totalAreaSqMeters += areaM;

      const polygon = room.polygon.length > 0
        ? room.polygon
        : [
            { x: 0, y: 0 },
            { x: room.dimensions.lengthMeters, y: 0 },
            { x: room.dimensions.lengthMeters, y: room.dimensions.widthMeters },
            { x: 0, y: room.dimensions.widthMeters },
          ];

      // Detect if polygon is explicitly marked as an open contour (missing wall) or open space
      const isOpen = (room as any).isOpenContour === true || (room as any).isClosedBoundary === false || (room as any).roomType === 'balcony';
      const numSegments = isOpen ? polygon.length - 1 : polygon.length;

      const walls: SemanticWall[] = [];
      for (let i = 0; i < numSegments; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        walls.push({
          id: `wall_${room._id}_${i}`,
          startPoint: p1,
          endPoint: p2,
          height: room.dimensions.heightMeters || 2.7,
          thickness: 0.15,
          confidence: 0.90,
          openings: [],
        });
      }

      // Preserve room openings or provide candidate doorway on wall 0
      const existingOpenings = (room as any).openings;
      const openings: SemanticOpening[] =
        Array.isArray(existingOpenings) && existingOpenings.length > 0
          ? existingOpenings
          : [
              {
                id: `door_${room._id}`,
                type: 'door',
                position: { x: (polygon[0].x + polygon[1].x) / 2, y: 0, z: polygon[0].y },
                dimensions: { width: 0.9, height: 2.1 },
                normal: { x: 0, y: 0, z: 1 },
                confidence: 0.85,
                swingAngle: 90,
              },
            ];

      if (walls.length > 0 && openings.length > 0) {
        walls[0].openings = openings;
      }

      return {
        id: room._id.toString(),
        name: room.name,
        roomType: room.roomType,
        polygon,
        walls,
        openings,
        isClosedBoundary: !isOpen,
        areaSqMeters: Math.round(areaM * 100) / 100,
        areaSqFeet: Math.round(areaM * 10.7639 * 10) / 10,
        ceilingHeightMeters: room.dimensions.heightMeters || 2.7,
      };
    });

    return {
      version: 1,
      isCalibrated,
      calibrationMethod: opts.calibrationMethod,
      disclaimer: isCalibrated
        ? undefined
        : 'UNCALIBRATED SCAN: Dimensions are relative geometric estimates and not authoritative for construction or real estate valuation.',
      rooms: formattedRooms,
      totalAreaSqMeters: Math.round(totalAreaSqMeters * 100) / 100,
      totalAreaSqFeet: Math.round(totalAreaSqMeters * 10.7639 * 10) / 10,
      scaleFactor: scalePixelsPerMeter,
    };
  }

  /**
   * Renders an architectural SVG markup document from FloorPlanVectorData.
   * Renders uncalibrated warning banners and handles open/incomplete wall contours.
   */
  static renderSvg(data: FloorPlanVectorData): string {
    const scale = data.scaleFactor || 50; // pixels per meter
    const padding = 60; // border padding in pixels
    const bannerHeight = data.isCalibrated ? 0 : 36;

    // Determine bounding envelope across all rooms
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const room of data.rooms) {
      for (const pt of room.polygon) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!isFinite(minX)) {
      minX = 0; maxX = 6; minY = 0; maxY = 5;
    }

    const widthMeters = Math.max(maxX - minX, 2);
    const heightMeters = Math.max(maxY - minY, 2);

    const svgWidth = Math.round(widthMeters * scale + padding * 2);
    const svgHeight = Math.round(heightMeters * scale + padding * 2 + bannerHeight);

    const toSvgX = (x: number) => Math.round((x - minX) * scale + padding);
    const toSvgY = (y: number) => Math.round((y - minY) * scale + padding + bannerHeight);

    const roomElements: string[] = [];

    for (const room of data.rooms) {
      const isClosed = (room as any).isClosedBoundary !== false;

      // Draw walls as distinct lines rather than closing open rooms
      if (isClosed) {
        const ptsString = room.polygon.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ');
        roomElements.push(
          `<polygon points="${ptsString}" fill="#182234" stroke="#3b82f6" stroke-width="3" fill-opacity="0.45" />`
        );
      } else {
        // Render open polyline with missing wall dashed indication
        const ptsString = room.polygon.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ');
        roomElements.push(
          `<polyline points="${ptsString}" fill="none" stroke="#3b82f6" stroke-width="3" />`
        );
        // Dashed line indicating incomplete/open boundary
        const pFirst = room.polygon[0];
        const pLast = room.polygon[room.polygon.length - 1];
        roomElements.push(
          `<line x1="${toSvgX(pLast.x)}" y1="${toSvgY(pLast.y)}" x2="${toSvgX(pFirst.x)}" y2="${toSvgY(pFirst.y)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,4" />`
        );
      }

      // Centroid for label
      let cX = 0;
      let cY = 0;
      for (const p of room.polygon) {
        cX += toSvgX(p.x);
        cY += toSvgY(p.y);
      }
      cX = Math.round(cX / room.polygon.length);
      cY = Math.round(cY / room.polygon.length);

      const areaText = data.isCalibrated
        ? `${room.areaSqFeet} sq ft (${room.areaSqMeters} m²)`
        : `~${room.areaSqFeet} sq ft (uncalibrated)`;

      // Room name & square footage badge
      roomElements.push(
        `<g transform="translate(${cX}, ${cY})">
          <text text-anchor="middle" y="-6" fill="#f8fafc" font-size="14" font-weight="600" font-family="sans-serif">${room.name}</text>
          <text text-anchor="middle" y="14" fill="${data.isCalibrated ? '#94a3b8' : '#f59e0b'}" font-size="11" font-family="sans-serif">${areaText}</text>
        </g>`
      );
    }

    const warningBanner = !data.isCalibrated
      ? `<g id="uncalibrated-warning-banner">
          <rect x="0" y="0" width="${svgWidth}" height="${bannerHeight}" fill="#7f1d1d" fill-opacity="0.9" />
          <text x="${svgWidth / 2}" y="22" fill="#fecaca" font-size="11" font-weight="700" text-anchor="middle" font-family="sans-serif">
            ⚠ UNCALIBRATED SCAN — ESTIMATED DIMENSIONS ONLY (NOT AUTHORITATIVE FOR APPRAISAL OR CONSTRUCTION)
          </text>
        </g>`
      : '';

    const dimensionFooter = data.isCalibrated
      ? `Total Area: ${data.totalAreaSqFeet} sq ft | Scale: 1m = ${scale}px | Metric Calibrated`
      : `Total Area: ${data.totalAreaSqFeet} sq ft | Scale: 1m = ${scale}px | Uncalibrated Draft`;

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`,
      `  <rect width="100%" height="100%" fill="#0a0f1d" />`,
      `  ${warningBanner}`,
      `  <!-- Grid Lines -->`,
      `  <defs>`,
      `    <pattern id="grid" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">`,
      `      <path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#1e293b" stroke-width="0.5" />`,
      `    </pattern>`,
      `  </defs>`,
      `  <rect y="${bannerHeight}" width="100%" height="${svgHeight - bannerHeight}" fill="url(#grid)" />`,
      `  <!-- Rooms & Walls -->`,
      `  ${roomElements.join('\n  ')}`,
      `  <!-- Dimension Stamp -->`,
      `  <text x="${padding}" y="${svgHeight - 20}" fill="${data.isCalibrated ? '#64748b' : '#f59e0b'}" font-size="11" font-family="sans-serif">${dimensionFooter}</text>`,
      `</svg>`,
    ].join('\n');
  }

  /**
   * Persists updated vector floor plan data, renders fresh SVG, updates ScanRooms,
   * and registers versioned ScanArtifact records.
   */
  static async saveFloorPlan(
    scanId: string,
    vectorData: FloorPlanVectorData,
    user: TokenPayload
  ): Promise<{ svgKey: string; jsonKey: string; version: number }> {
    const scan = await ScanService.getScan(scanId, user);

    // Latest version
    const latestArt = await ScanArtifact.findOne({ scanId: scan._id }).sort({ version: -1 });
    const version = latestArt ? latestArt.version + 1 : 1;

    // Check calibration state
    const calib = await CalibrationReference.findOne({ scanId: scan._id });
    vectorData.isCalibrated = !!(calib && calib.scaleFactor && calib.referenceType !== 'manual_scale');
    vectorData.calibrationMethod = calib?.referenceType;

    // 1. Save JSON artifact
    const jsonString = JSON.stringify(vectorData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf8');
    const jsonKey = `${scan.storagePrefix}/v${version}/floorplan.json`;
    const jsonSaved = await ScanStorageAdapter.saveFile(jsonKey, jsonBuffer, 'application/json');

    await ScanArtifact.create({
      scanId: scan._id,
      type: 'floorplan_json',
      version,
      storageKey: jsonKey,
      fileSizeBytes: jsonSaved.sizeBytes,
      checksumSha256: jsonSaved.sha256,
      mimeType: 'application/json',
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      metadata: { isCalibrated: vectorData.isCalibrated, calibrationMethod: vectorData.calibrationMethod },
    });

    // 2. Render and save SVG artifact
    const svgContent = this.renderSvg(vectorData);
    const svgBuffer = Buffer.from(svgContent, 'utf8');
    const svgKey = `${scan.storagePrefix}/v${version}/floorplan.svg`;
    const svgSaved = await ScanStorageAdapter.saveFile(svgKey, svgBuffer, 'image/svg+xml');

    await ScanArtifact.create({
      scanId: scan._id,
      type: 'floorplan_svg',
      version,
      storageKey: svgKey,
      fileSizeBytes: svgSaved.sizeBytes,
      checksumSha256: svgSaved.sha256,
      mimeType: 'image/svg+xml',
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      metadata: { isCalibrated: vectorData.isCalibrated, calibrationMethod: vectorData.calibrationMethod },
    });

    // 3. Synchronize ScanRoom records
    for (const r of vectorData.rooms) {
      await ScanRoom.findByIdAndUpdate(r.id, {
        polygon: r.polygon,
        'dimensions.areaSqMeters': r.areaSqMeters,
        'dimensions.areaSqFt': r.areaSqFeet,
      });
    }

    // Update scan metrics
    scan.metrics = {
      ...scan.metrics,
      totalAreaSqMeters: vectorData.totalAreaSqMeters,
      totalAreaSqFt: vectorData.totalAreaSqFeet,
    };
    await scan.save();

    await ScanService.logAudit(
      scan._id,
      'floorplan_generated',
      `2D Floor Plan v${version} generated (Calibrated: ${vectorData.isCalibrated}, ${vectorData.totalAreaSqFeet} sq ft)`,
      user,
      { version, totalRooms: vectorData.rooms.length, isCalibrated: vectorData.isCalibrated }
    );

    return { svgKey, jsonKey, version };
  }
}
