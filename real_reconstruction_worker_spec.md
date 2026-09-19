# GPU Reconstruction Worker Specification & Contract

## 1. Executive Summary & Architecture Overview

The web platform decouples scan ingestion, UI management, and vector floor-planning from heavy 3D spatial reconstruction. Photogrammetry and Neural Radiance Field / 3D Gaussian Splatting algorithms require dedicated GPU compute (NVIDIA CUDA) and cannot run efficiently or deterministically inside a multi-tenant Node.js web server.

```
+-----------------------------------------------------------------------------------+
|                            Next.js Web Application                                |
|  - Camera Capture -> IndexedDB -> Chunked Upload -> Assembled Media               |
|  - Job Dispatcher (jobQueueService.ts) -> HMAC Token Generation                   |
|  - Webhook Callback Endpoint: /api/scans/[scanId]/jobs/callback                   |
+----------------------------------------+------------------------------------------+
                                         |
                       Secure Dispatch   |   HMAC-Signed Webhook Progress & Results
                       (POST Payload)    |   (X-Worker-Signature)
                                         v
+-----------------------------------------------------------------------------------+
|                         Dedicated GPU Reconstruction Worker                       |
|   (Python 3.10+ / PyTorch / CUDA 12.2 / COLMAP / OpenMVS / 3DGS / Draco)          |
|                                                                                   |
|  [Stage 1] Media Ingestion & Keyframe Extraction (FFmpeg + Laplacian variance)    |
|  [Stage 2] Camera Intrinsics & Feature Matching (SIFT / SuperPoint + LightGlue)   |
|  [Stage 3] Structure-from-Motion / Sparse Point Cloud (COLMAP / GLOMAP)           |
|  [Stage 4] Dense Multi-View Stereo (COLMAP Dense / Depth Anything v2)             |
|  [Stage 5] Poisson Surface Reconstruction or 3D Gaussian Splatting (OpenMVS/3DGS)  |
|  [Stage 6] Web Asset Optimization (Draco compression, .glb export, .ply binary)   |
|  [Stage 7] Quality Metrics & Artifact Delivery via Webhook Callback               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dispatch Job Contract (Web -> Worker)

When a scan upload is finalized (`POST /api/scans/[scanId]/upload/finalize`), the web application generates a durable `ProcessingJob` record and dispatches a JSON payload to the registered `ExternalGpuWorkerProvider`.

### 2.1 Webhook Dispatch Payload Schema
```json
{
  "jobId": "65fc0a1848a9030018f921a2",
  "scanId": "65fc09bc48a9030018f921a0",
  "tenantId": "tenant_real_estate_alpha",
  "sourceMediaStorageKey": "scans/tenant_real_estate_alpha/1789842355615_xvdixu/source/capture_assembled.bin",
  "manifestStorageKey": "scans/tenant_real_estate_alpha/1789842355615_xvdixu/manifest.json",
  "callbackWebhookUrl": "https://app.realestate.com/api/scans/65fc09bc48a9030018f921a0/jobs/callback",
  "webhookSecret": "b78a9c80d56b467e2311ff08a6",
  "options": {
    "denseResolution": "high",
    "generateSplats": false,
    "generateMesh": true,
    "targetFaceCount": 150000,
    "dracoCompression": true
  }
}
```

---

## 3. Worker Callback Contract (Worker -> Web)

During processing, the GPU worker periodically posts progress updates. Upon completion or failure, the worker delivers final artifacts and metrics. Every request MUST include the HMAC SHA-256 signature in the `X-Worker-Signature` header computed over the raw request body using `webhookSecret`.

### 3.1 HTTP Header Requirement
```http
POST /api/scans/65fc09bc48a9030018f921a0/jobs/callback HTTP/1.1
Host: app.realestate.com
Content-Type: application/json
X-Worker-Signature: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### 3.2 Interim Progress Update Payload
```json
{
  "jobId": "65fc0a1848a9030018f921a2",
  "stage": "sparse_pointcloud",
  "progress": 45,
  "stageDetails": "Matched 14,280 features across 128 keyframes. Estimated mean reprojection error: 0.62px."
}
```

### 3.3 Completion & Artifact Delivery Payload
```json
{
  "jobId": "65fc0a1848a9030018f921a2",
  "stage": "completed",
  "progress": 100,
  "stageDetails": "Reconstruction complete. Mesh optimized with Draco compression.",
  "artifacts": [
    {
      "type": "mesh_glb",
      "storageKey": "scans/tenant_real_estate_alpha/1789842355615_xvdixu/artifacts/reconstructed_mesh.glb",
      "base64Payload": null,
      "sizeBytes": 4210984,
      "metadata": {
        "vertexCount": 84210,
        "faceCount": 149800,
        "hasDracoCompression": true
      }
    },
    {
      "type": "pointcloud_ply",
      "storageKey": "scans/tenant_real_estate_alpha/1789842355615_xvdixu/artifacts/dense_pointcloud.ply",
      "base64Payload": null,
      "sizeBytes": 12890412,
      "metadata": {
        "pointCount": 650000,
        "format": "binary_little_endian"
      }
    }
  ],
  "metrics": {
    "pointCount": 650000,
    "meshVertexCount": 84210,
    "meshFaceCount": 149800,
    "coveragePercentage": 96.5,
    "meanReprojectionErrorPx": 0.62,
    "executionTimeSeconds": 184.2
  }
}
```

---

## 4. Pipeline Stages & Algorithms

A genuine 3D reconstruction worker performs the following mathematical and computer vision stages:

| Stage | Tool / Algorithm | Description | Output |
| :--- | :--- | :--- | :--- |
| **1. Frame Extraction** | FFmpeg / OpenCV | Decodes video container into timestamped frames. Filters out blurry frames via Laplacian variance thresholding ($Var(\nabla^2 I) < 120$). | Selected RGB keyframes (2-3 fps) |
| **2. Intrinsics Estimation** | Exif / Colmap Database | Extracts focal length, sensor dimension, and principal point. Initializes pinhole camera distortion parameters. | Camera calibration matrix $K$ |
| **3. Feature Extraction** | SuperPoint / SIFT | Detects scale-invariant local feature keypoints and descriptors across all frames. | 2,000 - 8,000 descriptors per frame |
| **4. Feature Matching** | LightGlue / SuperGlue / SIFT | Robust matching with epipolar geometry verification (RANSAC 8-point algorithm). | Verified pairwise frame matches |
| **5. Structure from Motion** | COLMAP / GLOMAP | Incremental or global bundle adjustment solving camera poses $R, T$ and 3D sparse landmark points. | Camera trajectory + Sparse point cloud |
| **6. Multi-View Stereo** | COLMAP Dense / PatchMatch Stereo / Depth Anything v2 | Computes photometric depth maps and normal vectors per view; fuses depth into a dense 3D point cloud. | Dense Point Cloud (.ply) |
| **7. Surface Mesh Generation** | OpenMVS / Screened Poisson Surface Reconstruction | Computes surface normals, reconstructs watertight triangular mesh, and projects photo textures. | Textured Polygon Mesh |
| **8. Web Optimization** | Trimesh / PyDraco / gltf-transform | Decimates polygon count to <150k faces; applies Draco edgebreaker geometric compression; exports binary `.glb`. | Optimized `.glb` (3-8 MB) |
| **9. Quality Validation** | Python Pipeline Evaluator | Validates reprojection error (< 1.5px), bounding volume realism, and non-empty surface area. | Quality metrics report |

---

## 5. Dockerfile & Infrastructure Specification

### 5.1 Hardware Requirements
- **GPU**: NVIDIA RTX 3090, RTX 4090, A10G, or A100 (Minimum 16 GB VRAM, Recommended 24 GB+).
- **CPU**: 8+ cores (x86_64, AMD EPYC or Intel Xeon).
- **RAM**: 32 GB System RAM.
- **Disk**: 100 GB NVMe scratch space for dense point cloud caching.

### 5.2 Container Dockerfile (`worker.Dockerfile`)
```dockerfile
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system tools, CMake, and build toolchain
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    ffmpeg \
    libboost-all-dev \
    libeigen3-dev \
    libfreeimage-dev \
    libgoogle-glog-dev \
    libgflags-dev \
    libatlas-base-dev \
    libsuitesparse-dev \
    libglew-dev \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install COLMAP with CUDA acceleration
WORKDIR /opt
RUN git clone https://github.com/colmap/colmap.git && \
    cd colmap && \
    git checkout 3.9.1 && \
    mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DCUDA_ENABLED=ON && \
    make -j$(nproc) && \
    make install && \
    cd /opt && rm -rf colmap

# Install Python requirements
COPY requirements.txt /opt/worker/requirements.txt
RUN pip3 install --no-cache-dir -r /opt/worker/requirements.txt

# Copy worker application
COPY worker/ /opt/worker/
WORKDIR /opt/worker

EXPOSE 9000
CMD ["python3", "main.py", "--port", "9000"]
```

### 5.3 Python Dependencies (`requirements.txt`)
```text
torch>=2.1.0+cu121 --extra-index-url https://download.pytorch.org/whl/cu121
torchvision>=0.16.0+cu121 --extra-index-url https://download.pytorch.org/whl/cu121
numpy>=1.24.0
scipy>=1.11.0
opencv-python-headless>=4.8.0
trimesh>=4.0.0
pygltflib>=1.15.0
open3d>=0.18.0
fastapi>=0.104.0
uvicorn>=0.24.0
requests>=2.31.0
pydantic>=2.4.0
```

---

## 6. Local Development vs Production Provider Configuration

The web application switches between the local development adapter and the remote GPU worker via environment configuration or platform settings:

| Environment Variable | Local Development (Default) | Remote GPU Reconstruction Worker |
| :--- | :--- | :--- |
| `RECONSTRUCTION_PROVIDER` | `development_adapter` | `external_gpu_worker` |
| `GPU_WORKER_URL` | *(None / Ignored)* | `https://gpu-worker-cluster.internal:9000/api/reconstruct` |
| `GPU_WORKER_SECRET` | *(None / Ignored)* | `high_entropy_shared_hmac_secret_key` |
| `Behavior` | Generates procedural bounding-box GLB and PLY within 150ms for UI verification | Dispatches job via HTTP POST; awaits streaming HMAC webhook callbacks |
| `Production Ready?` | **NO** (Strictly flagged `isDevelopmentOnly: true`) | **YES** (Executes genuine SfM + MVS + Mesh) |
