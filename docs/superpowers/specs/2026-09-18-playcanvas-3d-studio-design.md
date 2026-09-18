# Design Specification: Module 5 — PlayCanvas 3D Real Estate Studio

**Date:** 2026-09-18  
**Topic:** PlayCanvas 3D Real Estate Studio, GLB Pipeline, Scene Editor, Floor/Unit Mapping, Hotspots, Live CRM Integration, and Public Viewer  
**Status:** Approved for Implementation Planning  

---

## 1. Executive Summary & Goals

Module 5 delivers a complete, production-grade 3D Architectural Spatial Experience for luxury real estate properties powered by the official **PlayCanvas Engine** (`playcanvas@^1.72.3`).

Key tenets:
1. **Zero External PlayCanvas Editor Dependency**: Property owners and staff manage models, viewports, bookmarks, floor maps, unit bindings, and hotspots entirely within the Next.js application dashboard (`/dashboard/properties/:propertyId/3d`).
2. **First-Class GLB Upload & Binary Inspection Pipeline**: Binary header validation (`0x46546C67`), glTF 2.0 JSON chunk extraction, model hierarchy parsing, triangle/mesh/texture/material counting, bounding box calculation, auto-framing estimation, and non-destructive versioning.
3. **Unified 3D Runtime (`RealEstate3DViewer`)**: A single high-performance component operating across three distinct modes: `editor`, `preview`, and `public`. Supports mouse orbit/pan/zoom, mobile single-touch orbit and pinch-to-zoom, camera bookmark transitions, node picking with emissive highlight materials, and 3D-to-2D projected screen hotspots.
4. **Live CRM Data Binding**: Semantic node mapping connects 3D elements (`Floor_02`, `Unit_A201`) to real database records. Price, availability (`available`, `reserved`, `sold`), bedrooms, and bathrooms resolve dynamically at runtime from database records without re-uploading or modifying GLB assets.
5. **Direct Lead & Viewing Integration**: Interacting with units or inquiry hotspots opens public-safe booking modals connected directly to Module 4's `/api/appointments` and `/api/leads`.
6. **Draft vs. Published Isolation & Version Rollback**: Draft configurations remain secure and inaccessible to public visitors until explicitly published. Previous versions are retained to permit safe rollback.
7. **Strict Governance**: Feature flag (`playcanvas3d`), granular RBAC (`property3d.view`, `property3d.upload`, `property3d.edit`, `property3d.map`, `property3d.publish`, `property3d.rollback`), and audit logging for all mutations.

---

## 2. Architecture & Data Structures

### 2.1 Database Schema: `Property3DExperience`

Located at `src/models/Property3DExperience.ts`:

- `propertyId`: ObjectId (ref: Property, unique, indexed)
- `title`: String (default: "3D Spatial Architectural Walkthrough")
- `status`: Enum (`uploading` | `processing` | `ready` | `configuration_required` | `published` | `failed` | `archived`)
- `currentVersion`: Number (default: 1)
- `publishedVersion`: Number (optional)
- `sourceAsset`:
  - `url`: String
  - `fileName`: String
  - `fileSizeBytes`: Number
  - `storageKey`: String
  - `uploadedAt`: Date
- `optimizedAsset`: (optional)
  - `url`: String
  - `fileSizeBytes`: Number
  - `preset`: Enum (`original` | `balanced` | `mobile_optimized` | `high_quality`)
  - `optimizedAt`: Date
- `previewImageUrl`: String (poster image for below-fold/pre-load)
- `modelMetadata`:
  - `nodeCount`: Number
  - `meshCount`: Number
  - `materialCount`: Number
  - `textureCount`: Number
  - `triangleCount`: Number
  - `boundingBox`:
    - `min`: [Number, Number, Number]
    - `max`: [Number, Number, Number]
  - `dimensions`:
    - `width`: Number
    - `height`: Number
    - `depth`: Number
  - `namedNodes`: [String]
  - `extensionsUsed`: [String]
- `sceneSettings`:
  - `rootTransform`:
    - `position`: [Number, Number, Number]
    - `rotation`: [Number, Number, Number]
    - `scale`: [Number, Number, Number]
  - `environmentPreset`: Enum (`golden_hour` | `twilight_night` | `studio_bright` | `sunset` | `dark_presentation`)
  - `exposure`: Number
  - `ambientIntensity`: Number
  - `shadowQuality`: Enum (`off` | `low` | `medium` | `high`)
- `cameraSettings`:
  - `defaultPosition`: [Number, Number, Number]
  - `defaultTarget`: [Number, Number, Number]
  - `fov`: Number
  - `minDistance`: Number
  - `maxDistance`: Number
  - `minPitch`: Number
  - `maxPitch`: Number
- `bookmarks`: Array:
  - `id`: String
  - `label`: String
  - `position`: [Number, Number, Number]
  - `target`: [Number, Number, Number]
  - `fov`: Number
  - `order`: Number
- `floorMappings`: Array:
  - `id`: String
  - `nodePath`: String
  - `nodeName`: String
  - `floorLabel`: String
  - `levelIndex`: Number
  - `elevation`: Number
- `unitMappings`: Array:
  - `id`: String
  - `nodePath`: String
  - `nodeName`: String
  - `propertyUnitId`: String (references Property or internal Unit)
  - `unitName`: String
  - `cameraBookmarkId`: String (optional jump viewpoint)
- `hotspots`: Array:
  - `id`: String
  - `type`: Enum (`info` | `unit` | `floor` | `amenity` | `camera_jump` | `inquiry_cta`)
  - `label`: String
  - `content`: String
  - `position`: [Number, Number, Number]
  - `targetLookAt`: [Number, Number, Number]
  - `targetEntityId`: String
  - `action`: String
- `versions`: Array (snapshot history containing model metadata, camera, scene, and mappings for rollback)
- `createdBy`: ObjectId (ref: User)
- `updatedBy`: ObjectId (ref: User)

---

## 3. GLB Server-Side Pipeline (`src/lib/3d/glbPipeline.ts`)

1. **Header & Magic Validation**:
   - Verify minimum 12 bytes.
   - Verify magic header equals `0x46546C67` (`"glTF"`).
   - Verify version equals 2 (glTF 2.0).
   - Check file length in header matches actual buffer length.
2. **Chunk 0 JSON Parsing**:
   - Extract glTF JSON chunk (`0x4E4F534A`).
   - Extract node hierarchy: Traverse `scenes[scene].nodes` and recursively collect full tree with paths and names.
   - Extract mesh and primitive data; estimate triangle count from accessor `count` (triangles = count / 3 or count for indexed primitives).
   - Extract accessors `min` and `max` on positions to compute global bounding box (`min`, `max`, dimensions `[x, y, z]`).
   - Calculate bounding sphere radius and auto-frame camera distance: `dist = (radius / Math.sin((fov / 2) * (Math.PI / 180))) * 1.25`.
3. **Named Node Preservation & Mapping Validation**:
   - When a model is updated or replaced, existing `floorMappings` and `unitMappings` are cross-referenced against the new GLB's `namedNodes`.
   - Returns a structured mapping compatibility report: `{ matched: string[], missing: string[], changed: string[] }`.
4. **Limits & Safeguards**:
   - Configurable `MAX_3D_MODEL_UPLOAD_MB` (default 100MB).
   - Server-side timeouts (processing finishes synchronously within 2 seconds for metadata parsing).
   - Safe disk storage in `public/uploads/models/` with collision-safe filenames.

---

## 4. PlayCanvas 3D Runtime (`src/components/3d/RealEstate3DViewer.tsx`)

### 4.1 Lifecycle & Resource Management
- In `useEffect`, initializes `pc.Application` on `<canvas>`.
- Configures mouse (`pc.Mouse`) and touch (`pc.TouchDevice`).
- Sets up main camera (`MainCamera`) and directional sun light with shadows.
- Asset loading: `app.assets.loadFromUrl(modelUrl, 'container', callback)`.
- Cleanup: Destroys app, releases loaded container assets, removes all event listeners on unmount.

### 4.2 Controls & Interactions
- **Desktop Orbit/Pan/Zoom**: Mouse drag rotates yaw/pitch within clamped limits; wheel zooms distance; right-drag pans camera target.
- **Mobile Touch**: 1-finger drag orbits; 2-finger distance delta zooms (pinch-zoom); touch movement threshold distinguishes clicks from drags.
- **Auto-Framing**: On load, positions camera at calculated auto-frame coordinates facing the bounding box center.
- **Node Selection & Raycast Picking**: Clicking on a mesh casts a ray from camera (`camera.screenToWorld`) into the scene graph. Highlights the selected node using an emissive clone material.
- **Hotspot Screen Projection**: Every frame (`app.on('update')`), hotspot 3D world coordinates are projected to screen coordinates via `camera.worldToScreen`. Hides markers behind the camera (`dot(forward, dir) <= 0`).

### 4.3 Modes:
- **`editor` Mode**: Shows hierarchy inspector tree, node details panel, camera bookmark creators, coordinate visualizer, and manual transform controls.
- **`preview` Mode**: Simulates public view using draft configuration with a "Visitor Preview" banner.
- **`public` Mode**: Clean, high-end luxury UI with floor selector, unit availability drawer, camera bookmarks, full-screen toggle, inquiry CTA modal, and help guide.

---

## 5. Live CRM Data Binding

1. **Unit Mapping Resolution**:
   - When rendering mapped units in 3D, the component dynamically resolves data against the property's live units from the database (e.g. `Property.units` or linked units).
   - Renders live badge (`Available` [emerald], `Reserved` [amber], `Sold` [rose]) and current price.
   - Any price or status change in the CRM updates the 3D presentation immediately on the next page view without touching the 3D asset.
2. **Inquiry & Viewing CTAs**:
   - Clicking "Book VIP Viewing" from a 3D unit or hotspot opens a modal pre-filled with the property ID, unit name, and source `3d_viewer`.
   - Submits to `/api/appointments` and `/api/leads` with full validation.

---

## 6. Security, RBAC & Audit

- **Feature Flag**: Guarded by `playcanvas3d`. If disabled, API returns 403 / feature disabled, navigation is hidden, and public page displays non-3D imagery without empty skeletons.
- **RBAC**:
  - `property3d.view`: View 3D experience in dashboard.
  - `property3d.upload`: Upload new GLB files.
  - `property3d.edit`: Update scene, lighting, camera, hotspots.
  - `property3d.map`: Map floors and units to real entities.
  - `property3d.publish`: Publish draft version to public.
  - `property3d.rollback`: Revert to a previous published version.
- **Audit Logging**: Module 3 `recordAudit` logs:
  - `3d.uploaded`, `3d.processed`, `3d.camera_updated`, `3d.mapping_updated`, `3d.hotspot_created`, `3d.version_published`, `3d.version_rolled_back`.
- **Public API Isolation**: `/api/properties/:id/3d/public` returns only published configurations and strips internal admin notes and draft assets.

---

## 7. Verification & Testing

1. Automated test suite `tests/module5-playcanvas-3d.test.ts`:
   - Valid GLB generation, upload, and header verification.
   - Corrupt/non-GLB rejection.
   - Metadata extraction: node hierarchy, bounding box, triangle counts.
   - Floor and unit mapping persistence and live CRM data binding.
   - Camera bookmarks and scene presets.
   - Draft vs. published access control.
   - RBAC capability checks.
   - Audit event verification.
2. Live HTTP endpoint verification and PlayCanvas runtime compilation.
3. Full test run via `tests/run-all.js`.
4. Production build check via `npm run build`.
