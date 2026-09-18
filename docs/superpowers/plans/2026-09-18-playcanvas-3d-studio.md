# PlayCanvas 3D Real Estate Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the integrated PlayCanvas 3D Real Estate Studio, server-side binary GLB pipeline, model hierarchy inspector, camera bookmarking, floor/unit live CRM data mapping, interactive hotspots, and responsive public viewer.

**Architecture:** A pure Node.js binary parser inspects and validates GLB files, computes bounding boxes, triangle counts, and hierarchy trees without external binary dependencies. A unified PlayCanvas 1.72 runtime component (`RealEstate3DViewer`) operates across `editor`, `preview`, and `public` modes. Mapped nodes resolve live CRM inventory, availability, and pricing dynamically at runtime, and connect to Module 4 booking/inquiry workflows.

**Tech Stack:** Next.js 14 App Router, PlayCanvas (`playcanvas@^1.72.3`), Mongoose / MongoDB, TypeScript, Framer Motion, Tailwind CSS, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-09-18-playcanvas-3d-studio-design.md`

## Global Constraints

- Engine: Official PlayCanvas engine (`playcanvas@^1.72.3`) only; no Three.js or manual external PlayCanvas editor requirement.
- Model Format: Binary glTF (.glb) with 12-byte header validation (`0x46546C67`), glTF 2.0 version, and glTF JSON chunk inspection.
- Limits: Configurable `MAX_3D_MODEL_UPLOAD_MB` (default: 100 MB).
- Deliberate Statuses: `uploading`, `processing`, `ready`, `configuration_required`, `published`, `failed`, `archived`.
- Versioning: Draft version isolated from public view; published version delivered to public; history preserved for safe rollback.
- Live Data: Pricing, unit status (`available`, `reserved`, `sold`), and details resolve from database at runtime without GLB re-upload.
- RBAC: Scoped capabilities `property3d.view`, `property3d.upload`, `property3d.edit`, `property3d.map`, `property3d.publish`, `property3d.rollback`.
- Feature Flag: Fully controlled by `playcanvas3d`.
- Audit Logging: Events `3d.uploaded`, `3d.processed`, `3d.camera_updated`, `3d.mapping_updated`, `3d.hotspot_created`, `3d.version_published`, `3d.version_rolled_back`.

---

### Task 1: Schema & RBAC Permissions for 3D Experience

**Files:**
- Modify: `src/models/Property3DExperience.ts`
- Modify: `src/lib/permissions/modules/properties.ts`
- Modify: `src/lib/permissions/registry.ts`
- Test: `tests/module5-playcanvas-3d.test.ts`

**Interfaces:**
- Consumes: Mongoose schema, RBAC permission definitions.
- Produces: `Property3DExperience` model with full status lifecycle, version snapshots, metadata, camera, scene, mapping, and hotspot fields; `property3d.*` permissions registered in RBAC.

- [ ] **Step 1: Write test for Property3DExperience schema and RBAC registration**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `Property3DExperience.ts` with comprehensive schema**
- [ ] **Step 4: Register `property3d.*` capabilities in `src/lib/permissions/modules/properties.ts`**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit changes**

---

### Task 2: Server-Side GLB Binary Validation & Metadata Inspection Pipeline

**Files:**
- Create: `src/lib/3d/glbPipeline.ts`
- Create: `src/lib/3d/types.ts`
- Test: `tests/module5-playcanvas-3d.test.ts`

**Interfaces:**
- Consumes: Buffer of uploaded file.
- Produces:
  ```typescript
  export interface GlbValidationResult {
    valid: boolean;
    error?: string;
    metadata?: GlbMetadata;
    autoFraming?: CameraFraming;
  }
  export function validateAndInspectGlb(buffer: Buffer): GlbValidationResult;
  export function checkMappingCompatibility(namedNodes: string[], existingMappings: { nodeName: string }[]): { matched: string[]; missing: string[] };
  ```

- [ ] **Step 1: Write test for GLB header validation, JSON chunk parsing, and corrupt file rejection**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/lib/3d/glbPipeline.ts` with binary parsing and auto-framing calculation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 3: 3D Experience API Endpoints (Upload, Process, Config, Mapping, Publish, Rollback)

**Files:**
- Modify: `src/app/api/properties/[id]/3d/route.ts`
- Create: `src/app/api/properties/[id]/3d/upload/route.ts`
- Create: `src/app/api/properties/[id]/3d/publish/route.ts`
- Create: `src/app/api/properties/[id]/3d/rollback/route.ts`
- Create: `src/app/api/properties/[id]/3d/public/route.ts`
- Test: `tests/module5-playcanvas-3d.test.ts`

**Interfaces:**
- Consumes: NextRequest, `validateAndInspectGlb`, `can` (RBAC), `recordAudit`, `verifyFeatureAllowed`.
- Produces:
  - `POST /api/properties/:id/3d/upload` (accepts multipart GLB, validates header, saves asset, updates status to `ready` or `configuration_required`).
  - `GET /api/properties/:id/3d` (returns draft experience with metadata and mappings for authorized staff).
  - `PUT /api/properties/:id/3d` (saves debounced camera, scene, hotspots, and floor/unit mappings).
  - `POST /api/properties/:id/3d/publish` (promotes draft to published version, snapshots history, logs audit).
  - `POST /api/properties/:id/3d/rollback` (reverts to selected prior published version).
  - `GET /api/properties/:id/3d/public` (returns only published version, public-safe data, and resolves live inventory).

- [ ] **Step 1: Write tests for upload, publish, public isolation, and RBAC rejection**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement all 3D experience API routes with audit logging and RBAC**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 4: Unified PlayCanvas 3D Runtime Component (`RealEstate3DViewer`)

**Files:**
- Create: `src/components/3d/RealEstate3DViewer.tsx`
- Modify: `src/components/3d/PlayCanvasViewer.tsx` (re-export or adapt for backwards compatibility)
- Test: `tests/module5-playcanvas-3d.test.ts`

**Interfaces:**
- Consumes: `Property3DExperience` data, `mode: 'editor' | 'preview' | 'public'`, live unit availability maps.
- Produces: PlayCanvas interactive canvas with orbit-pan-zoom, mobile touch gestures, camera bookmarks, mesh picking with emissive highlight, projected screen hotspots, and WebGL error fallback.

- [ ] **Step 1: Write component unit/render test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `RealEstate3DViewer.tsx` with complete PlayCanvas lifecycle, controls, raycast selection, and projected hotspots**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 5: 3D Spatial Studio Dashboard (`/dashboard/properties/:id/3d`)

**Files:**
- Modify: `src/app/dashboard/properties/[id]/3d/page.tsx`
- Create: `src/components/3d/HierarchyInspector.tsx`
- Create: `src/components/3d/MappingPanel.tsx`
- Create: `src/components/3d/HotspotEditor.tsx`
- Create: `src/components/3d/CameraBookmarksEditor.tsx`

**Interfaces:**
- Consumes: `/api/properties/:id/3d`, `RealEstate3DViewer` in `editor` and `preview` modes, `/api/properties/:id` for live units.
- Produces: Full spatial studio layout: Top toolbar (Save, Preview as Visitor, Publish, Status badge), Left/Center 3D viewport, Right tabbed inspector (Hierarchy & GLB, Camera & Bookmarks, Floor/Unit Mappings, Hotspots, Performance Health).

- [ ] **Step 1: Build sub-components: HierarchyInspector, MappingPanel, HotspotEditor, CameraBookmarksEditor**
- [ ] **Step 2: Update `page.tsx` with drag-and-drop GLB uploader, debounced auto-save, unsaved changes guard, and publish flow**
- [ ] **Step 3: Verify with automated tests and TypeScript check**
- [ ] **Step 4: Commit changes**

---

### Task 6: Public Property Page Integration & CRM Viewing Action

**Files:**
- Modify: `src/app/properties/[id]/page.tsx`
- Test: `tests/module5-playcanvas-3d.test.ts`

**Interfaces:**
- Consumes: `/api/properties/:id/3d/public`, live `/api/appointments` and `/api/leads`.
- Produces: Lazy-loaded 3D viewer section, below-the-fold "Explore in 3D" trigger, fallback image/gallery if 3D is absent or WebGL unavailable, and direct "Book VIP Viewing" inquiry modal from 3D unit selection.

- [ ] **Step 1: Write integration tests for public property page 3D lazy-loading and inquiry flow**
- [ ] **Step 2: Update `src/app/properties/[id]/page.tsx` to use `/api/properties/:id/3d/public` and dynamic units**
- [ ] **Step 3: Run tests to verify they pass**
- [ ] **Step 4: Commit changes**

---

### Task 7: Comprehensive Automated Test Suite & Full Verification

**Files:**
- Create: `tests/module5-playcanvas-3d.test.ts`
- Modify: `tests/run-all.js`
- Create: `tests/verify-http-3d.js`

**Interfaces:**
- Consumes: All Module 5 services, APIs, and PlayCanvas components.
- Produces: 100% automated test coverage, live HTTP verification script, clean build, and verified definition of done.

- [ ] **Step 1: Implement end-to-end tests for all 43 Definition of Done items**
- [ ] **Step 2: Run all test suites via `node tests/run-all.js`**
- [ ] **Step 3: Verify live endpoints against background server**
- [ ] **Step 4: Run `npm run build` to verify production compilation**
- [ ] **Step 5: Final commit and walkthrough documentation**
