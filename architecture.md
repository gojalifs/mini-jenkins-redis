# Coding Orchestrator (Mini Jenkins) – Specification

## 1. Tujuan

Membangun **Coding Orchestrator** berbasis JavaScript yang berfungsi sebagai CI/CD engine lokal (tanpa GitHub / internet), mirip Jenkins namun ringan.

Fokus utama:

* Local Git Server
* Build Orchestration
* Artifact Management
* Deployment (atomic)
* Monitoring via Web UI

Target environment:

* Local network (LAN)
* Node.js backend
* React.js frontend

---

## 2. High-Level Architecture

```
┌─────────────┐
│   Developer │
│  git push   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Local Git   │  (bare repo)
│ Server      │
└──────┬──────┘
       │ post-receive hook
       ▼
┌─────────────┐
│ Orchestrator│  (Node.js)
│ API         │
└──────┬──────┘
       │ enqueue job
       ▼
┌─────────────┐
│ Build Queue │
└──────┬──────┘
       │ worker
       ▼
┌─────────────┐
│ Build Worker│
│ (isolated)  │
└──────┬──────┘
       │ artifact
       ▼
┌─────────────┐
│ Artifact    │
│ Storage     │
└──────┬──────┘
       │ deploy
       ▼
┌─────────────┐
│ Deployment  │
│ (atomic)    │
└─────────────┘
```

---

## 3. Local Git Server (Tanpa GitHub)

### 3.1 Struktur Repository

```
/git
 ├── projects/
 │    └── my-app.git   (bare repo)
 └── hooks/
```

### 3.2 Membuat Bare Repository

```bash
git init --bare /git/projects/my-app.git
```

### 3.3 Git Access

* SSH (direkomendasikan)
* Atau file-based (`git clone /git/projects/my-app.git`)

### 3.4 post-receive Hook

File: `/git/projects/my-app.git/hooks/post-receive`

```bash
#!/bin/bash
while read oldrev newrev ref
 do
   curl -X POST http://localhost:4000/webhook \
     -H "Content-Type: application/json" \
     -d '{"repo":"my-app","commit":"'$newrev'","ref":"'$ref'"}'
 done
```

---

## 4. Backend (Node.js Orchestrator)

### 4.1 Tech Stack

* Node.js (>=18)
* Express.js
* BullMQ / custom queue
* SQLite / PostgreSQL

### 4.2 Folder Structure

```
orchestrator
 ├── src
 │   ├── api
 │   │   ├── webhook.controller.js
 │   │   ├── build.controller.js
 │   ├── core
 │   │   ├── queue.js
 │   │   ├── worker.js
 │   │   ├── executor.js
 │   ├── services
 │   │   ├── git.service.js
 │   │   ├── build.service.js
 │   │   ├── deploy.service.js
 │   ├── models
 │   │   ├── build.model.js
 │   └── app.js
 └── package.json
```

---

## 5. Build Flow

### 5.1 Build Identity

Setiap build **harus immutable**.

```
buildId = <timestamp>-<commit-hash>
```

### 5.2 Workspace

```
/ci/workspaces/build-<buildId>
```

### 5.3 Checkout

```bash
git clone /git/projects/my-app.git .
git checkout <commit>
```

### 5.4 Build Script (configurable)

Contoh `pipeline.json`:

```json
{
  "build": [
    "npm ci",
    "npm run build"
  ],
  "artifact": "dist",
  "deploy": true
}
```

---

## 6. Artifact Management

### 6.1 Artifact Output

```
/ci/artifacts/my-app/app-<buildId>.tar.gz
```

### 6.2 Create Artifact

```bash
tar -czf app-<buildId>.tar.gz dist
```

Artifact **tidak tergantung git**.

---

## 7. Deployment (Atomic)

### 7.1 Struktur Deployment

```
/deploy/my-app
 ├── releases
 │    ├── 20260131-a91f3e2
 │    └── 20260130-b12caa1
 └── current -> releases/20260131-a91f3e2
```

### 7.2 Deploy Flow

1. Extract artifact ke folder release baru
2. Jalankan migration / restart service
3. Update symlink `current`

Rollback = ganti symlink.

---

## 8. Queue & Worker

### 8.1 Queue

State:

* pending
* running
* success
* failed

### 8.2 Worker Rules

* Satu worker = satu build
* Isolated workspace
* Timeout per step

---

## 9. Logging

### 9.1 Log per Build

```
/logs/build-<buildId>.log
```

### 9.2 Capture

* stdout
* stderr
* exit code

---

## 10. Frontend (React.js)

### 10.1 Features

* Build list
* Status realtime
* Log viewer
* Deploy history
* Rollback button

### 10.2 Pages

* Dashboard
* Project Detail
* Build Detail

### 10.3 API Example

```
GET /api/builds
GET /api/builds/:id
POST /api/builds/:id/retry
POST /api/deploy/:id/rollback
```

---

## 11. Security (LAN-level)

* IP whitelist
* SSH key auth for git
* Role-based UI (admin / viewer)

---

## 12. Roadmap

### Phase 1

* Single project
* Sequential build
* Manual deploy

### Phase 2

* Multi project
* Parallel worker
* Realtime logs (WebSocket)

### Phase 3

* Docker executor
* Build cache
* Pipeline UI editor

---

## 13. Prinsip Utama

* Build harus reproducible
* Deploy harus atomic
* Git hanya source, bukan runtime
* Semua build bisa diulang

> Ini bukan Jenkins killer.
> Ini **Jenkins yang lo pahami dari dalam**.
