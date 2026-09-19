import {
  GlbValidationResult,
  GlbMetadata,
  HierarchyNode,
  CameraFraming,
  MappingCompatibilityReport,
} from './types';

export const MAX_3D_MODEL_UPLOAD_MB = parseInt(process.env.MAX_3D_MODEL_UPLOAD_MB || '100', 10);
export const MAX_3D_MODEL_UPLOAD_BYTES = MAX_3D_MODEL_UPLOAD_MB * 1024 * 1024;

const GLB_MAGIC = 0x46546c67; // 'glTF' in ASCII LE
const CHUNK_TYPE_JSON = 0x4e4f534a; // 'JSON' in ASCII LE

/**
 * Validates and inspects a binary GLB buffer server-side.
 * Extracts scene hierarchy, named nodes, bounding boxes, dimensions, and computes camera auto-framing.
 */
export function validateAndInspectGlb(buffer: Buffer, fileName?: string): GlbValidationResult {
  if (!buffer || buffer.length < 12) {
    return {
      valid: false,
      error: 'File is too small to be a valid GLB container (minimum 12 bytes required).',
    };
  }

  if (buffer.length > MAX_3D_MODEL_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `File size exceeds configured limit of ${MAX_3D_MODEL_UPLOAD_MB}MB.`,
    };
  }

  // 1. Validate 12-byte header
  const magic = buffer.readUInt32LE(0);
  if (magic !== GLB_MAGIC) {
    return {
      valid: false,
      error: 'Invalid GLB magic header. File is not a valid glTF 2.0 binary asset.',
    };
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    return {
      valid: false,
      error: `Unsupported glTF container version (${version}). Only glTF 2.0 binary assets are supported.`,
    };
  }

  const declaredLength = buffer.readUInt32LE(8);
  if (Math.abs(declaredLength - buffer.length) > 8) {
    return {
      valid: false,
      error: `Corrupt GLB file: declared container length (${declaredLength} bytes) does not match received buffer (${buffer.length} bytes).`,
    };
  }

  // 2. Read Chunk 0 (glTF JSON)
  if (buffer.length < 20) {
    return {
      valid: false,
      error: 'Truncated GLB container: missing JSON chunk header.',
    };
  }

  const chunk0Length = buffer.readUInt32LE(12);
  const chunk0Type = buffer.readUInt32LE(16);

  if (chunk0Type !== CHUNK_TYPE_JSON) {
    return {
      valid: false,
      error: 'First GLB chunk is not JSON chunk type (0x4E4F534A).',
    };
  }

  if (20 + chunk0Length > buffer.length) {
    return {
      valid: false,
      error: 'Truncated GLB container: JSON chunk length exceeds buffer size.',
    };
  }

  let gltf: any;
  try {
    const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
    gltf = JSON.parse(jsonStr);
  } catch (err: any) {
    return {
      valid: false,
      error: `Malformed glTF JSON payload: ${err.message}`,
    };
  }

  // 3. Extract Metadata
  const rawNodes: any[] = Array.isArray(gltf.nodes) ? gltf.nodes : [];
  const rawMeshes: any[] = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const rawMaterials: any[] = Array.isArray(gltf.materials) ? gltf.materials : [];
  const rawTextures: any[] = Array.isArray(gltf.textures) ? gltf.textures : [];
  const rawAccessors: any[] = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const extensionsUsed: string[] = Array.isArray(gltf.extensionsUsed) ? gltf.extensionsUsed : [];
  const extensionsRequired: string[] = Array.isArray(gltf.extensionsRequired) ? gltf.extensionsRequired : [];

  const namedNodes = rawNodes
    .map((n) => (typeof n.name === 'string' ? n.name.trim() : ''))
    .filter((name) => name.length > 0);

  // Calculate Triangle Count
  let triangleCount = 0;
  for (const mesh of rawMeshes) {
    if (Array.isArray(mesh.primitives)) {
      for (const prim of mesh.primitives) {
        if (typeof prim.indices === 'number' && rawAccessors[prim.indices]) {
          const count = rawAccessors[prim.indices].count || 0;
          triangleCount += Math.floor(count / 3);
        } else if (prim.attributes && typeof prim.attributes.POSITION === 'number' && rawAccessors[prim.attributes.POSITION]) {
          const count = rawAccessors[prim.attributes.POSITION].count || 0;
          triangleCount += Math.floor(count / 3);
        }
      }
    }
  }

  // Calculate Bounding Box across POSITION accessors
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let hasValidBounds = false;

  for (const mesh of rawMeshes) {
    if (Array.isArray(mesh.primitives)) {
      for (const prim of mesh.primitives) {
        if (prim.attributes && typeof prim.attributes.POSITION === 'number') {
          const posAcc = rawAccessors[prim.attributes.POSITION];
          if (posAcc && Array.isArray(posAcc.min) && Array.isArray(posAcc.max)) {
            minX = Math.min(minX, posAcc.min[0]);
            minY = Math.min(minY, posAcc.min[1]);
            minZ = Math.min(minZ, posAcc.min[2]);
            maxX = Math.max(maxX, posAcc.max[0]);
            maxY = Math.max(maxY, posAcc.max[1]);
            maxZ = Math.max(maxZ, posAcc.max[2]);
            hasValidBounds = true;
          }
        }
      }
    }
  }

  if (!hasValidBounds) {
    minX = -5;
    minY = 0;
    minZ = -5;
    maxX = 5;
    maxY = 4;
    maxZ = 5;
  }

  const width = Math.max(0.1, Number((maxX - minX).toFixed(3)));
  const height = Math.max(0.1, Number((maxY - minY).toFixed(3)));
  const depth = Math.max(0.1, Number((maxZ - minZ).toFixed(3)));

  const centerX = Number(((minX + maxX) / 2).toFixed(3));
  const centerY = Number(((minY + maxY) / 2).toFixed(3));
  const centerZ = Number(((minZ + maxZ) / 2).toFixed(3));

  const radius = Number(
    (Math.sqrt(width * width + height * height + depth * depth) / 2).toFixed(3)
  );

  // Auto-framing calculation
  const fov = 55;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const distance = Math.max(3, Number(((radius / Math.sin(fovRad)) * 1.25).toFixed(2)));

  const autoFraming: CameraFraming = {
    center: [centerX, centerY, centerZ],
    radius,
    recommendedDistance: distance,
    recommendedPosition: [
      centerX,
      Number((centerY + height * 0.4).toFixed(2)),
      Number((centerZ + distance).toFixed(2)),
    ],
    recommendedTarget: [centerX, centerY, centerZ],
    recommendedFov: fov,
  };

  // 4. Build Hierarchy Tree
  const hierarchy: HierarchyNode[] = [];
  const rootNodeIndices = new Set<number>();

  const activeSceneIndex = typeof gltf.scene === 'number' ? gltf.scene : 0;
  if (Array.isArray(gltf.scenes) && gltf.scenes[activeSceneIndex] && Array.isArray(gltf.scenes[activeSceneIndex].nodes)) {
    for (const idx of gltf.scenes[activeSceneIndex].nodes) {
      rootNodeIndices.add(idx);
    }
  } else {
    // If no explicit scene root, consider nodes without parent as roots
    const childIndices = new Set<number>();
    for (const n of rawNodes) {
      if (Array.isArray(n.children)) {
        for (const c of n.children) childIndices.add(c);
      }
    }
    for (let i = 0; i < rawNodes.length; i++) {
      if (!childIndices.has(i)) rootNodeIndices.add(i);
    }
  }

  function buildNode(nodeIndex: number, parentPath: string): HierarchyNode {
    const raw = rawNodes[nodeIndex] || {};
    const name = raw.name || `Node_${nodeIndex}`;
    const currentPath = parentPath ? `${parentPath}/${name}` : name;

    const children: HierarchyNode[] = [];
    if (Array.isArray(raw.children)) {
      for (const childIdx of raw.children) {
        if (typeof childIdx === 'number' && childIdx < rawNodes.length) {
          children.push(buildNode(childIdx, currentPath));
        }
      }
    }

    return {
      name,
      index: nodeIndex,
      path: currentPath,
      children,
      meshIndex: typeof raw.mesh === 'number' ? raw.mesh : undefined,
      translation: Array.isArray(raw.translation) ? raw.translation : undefined,
      rotation: Array.isArray(raw.rotation) ? raw.rotation : undefined,
      scale: Array.isArray(raw.scale) ? raw.scale : undefined,
    };
  }

  for (const rootIdx of Array.from(rootNodeIndices)) {
    if (rootIdx < rawNodes.length) {
      hierarchy.push(buildNode(rootIdx, ''));
    }
  }

  const metadata: GlbMetadata = {
    fileSizeBytes: buffer.length,
    nodeCount: rawNodes.length,
    meshCount: rawMeshes.length,
    materialCount: rawMaterials.length,
    textureCount: rawTextures.length,
    triangleCount,
    boundingBox: {
      min: [Number(minX.toFixed(3)), Number(minY.toFixed(3)), Number(minZ.toFixed(3))],
      max: [Number(maxX.toFixed(3)), Number(maxY.toFixed(3)), Number(maxZ.toFixed(3))],
    },
    dimensions: {
      width,
      height,
      depth,
    },
    namedNodes,
    extensionsUsed,
    extensionsRequired,
  };

  return {
    valid: true,
    metadata,
    hierarchy,
    autoFraming,
  };
}

/**
 * Checks compatibility between existing floor/unit node mappings and a replacement GLB model's named nodes.
 */
export function checkMappingCompatibility(
  namedNodes: string[],
  existingMappings: Array<{ nodeName: string }>
): MappingCompatibilityReport {
  const set = new Set(namedNodes);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const m of existingMappings) {
    if (set.has(m.nodeName)) {
      matched.push(m.nodeName);
    } else {
      missing.push(m.nodeName);
    }
  }

  const mappedSet = new Set(existingMappings.map((m) => m.nodeName));
  const unmappedNodes = namedNodes.filter((n) => !mappedSet.has(n));

  return {
    matched,
    missing,
    unmappedNodes,
  };
}

/**
 * Generates a minimal, valid glTF 2.0 binary GLB container in memory.
 * Useful for automated tests and default fixtures.
 */
export function createMinimalValidGlb(buildingName = 'AuraLuxuryTower'): Buffer {
  const gltf = {
    asset: { version: '2.0', generator: 'AuraHeights3DPipeline' },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [
      {
        name: buildingName,
        children: [1, 2, 3],
      },
      {
        name: 'Floor_01',
        children: [4, 5],
        translation: [0, 0, 0],
      },
      {
        name: 'Floor_02',
        children: [6, 7],
        translation: [0, 4, 0],
      },
      {
        name: 'Roof_Terrace',
        translation: [0, 8, 0],
      },
      {
        name: 'Unit_A101',
        mesh: 0,
        translation: [-2, 0, 0],
      },
      {
        name: 'Unit_A102',
        mesh: 0,
        translation: [2, 0, 0],
      },
      {
        name: 'Unit_B201',
        mesh: 0,
        translation: [-2, 4, 0],
      },
      {
        name: 'Unit_B202',
        mesh: 0,
        translation: [2, 4, 0],
      },
    ],
    meshes: [
      {
        name: 'ApartmentBoxMesh',
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'LuxuryStoneMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [0.85, 0.85, 0.9, 1.0],
          roughnessFactor: 0.4,
        },
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 8,
        type: 'VEC3',
        min: [-2.0, 0.0, -2.0],
        max: [2.0, 3.5, 2.0],
      },
      {
        bufferView: 1,
        componentType: 5123, // UNSIGNED_SHORT
        count: 36,
        type: 'SCALAR',
        min: [0],
        max: [7],
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 96, target: 34962 },
      { buffer: 0, byteOffset: 96, byteLength: 72, target: 34963 },
    ],
    buffers: [{ byteLength: 168 }],
  };

  const jsonStr = JSON.stringify(gltf);
  // Pad JSON string with spaces to align to 4-byte boundary
  const jsonPadding = (4 - (jsonStr.length % 4)) % 4;
  const paddedJsonStr = jsonStr + ' '.repeat(jsonPadding);
  const jsonBuf = Buffer.from(paddedJsonStr, 'utf8');

  // Binary buffer (168 bytes of vertex & index data)
  const binBuf = Buffer.alloc(168);

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const headerBuf = Buffer.alloc(12);
  headerBuf.writeUInt32LE(GLB_MAGIC, 0);
  headerBuf.writeUInt32LE(2, 4);
  headerBuf.writeUInt32LE(totalLength, 8);

  const chunk0Header = Buffer.alloc(8);
  chunk0Header.writeUInt32LE(jsonBuf.length, 0);
  chunk0Header.writeUInt32LE(CHUNK_TYPE_JSON, 4);

  const chunk1Header = Buffer.alloc(8);
  chunk1Header.writeUInt32LE(binBuf.length, 0);
  chunk1Header.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([headerBuf, chunk0Header, jsonBuf, chunk1Header, binBuf]);
}
