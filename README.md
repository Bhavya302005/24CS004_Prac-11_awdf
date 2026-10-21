# Practical 11: Containerization with Docker and Docker Compose

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Institution:** Charotar University of Science and Technology (CHARUSAT)  
**Faculty:** Faculty of Technology and Engineering (DEPSTAR / CSPIT)  
**Department:** B.Tech (IT / CE / CSE / AIML)  
**CO/PO Mapping:** CO5 / PO3, PO5  
**GitHub Repository:** [24CS004_Prac-11_awdf](https://github.com/Bhavya302005/24CS004_Prac-11_awdf.git)

---

## 🎯 Objective
To containerize a full-stack Task Management application (React frontend, Node/Express backend, and MongoDB database) using Docker and orchestrate all multi-container services seamlessly using Docker Compose with persistent data storage and inter-container networking.

---

## 🏗️ Architecture & Service Topology

```
                  ┌───────────────────────────────────────────┐
                  │            docker-compose.yml             │
                  │          Network: app-network             │
                  └───────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
   ┌───────────────┐            ┌───────────────┐            ┌───────────────┐
   │   frontend    │            │    backend    │            │    mongodb    │
   │  (React/Vite) │ ──(HTTP)─► │ (Node/Express)│ ──(Mongoose)► (Official)   │
   │   Port 5173   │            │   Port 5000   │            │  Port 27017   │
   └───────────────┘            └───────────────┘            └───────────────┘
           │                            │                            │
     Host: 5173                   Host: 5000                   Named Volume
                                                              (mongo-data)
                                        │
                                        └──(Dual-Sync)──► Host Windows MongoDB
                                                          (MongoDB Compass: 27017)
```

### Services Overview
| Service | Image / Build Context | Container Port | Host Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`mongodb`** | `mongo:latest` | `27017` | `27017` | Official MongoDB document database with persistent named volume (`mongo-data`). |
| **`backend`** | `./backend/Dockerfile` (`node:18`) | `5000` | `5000` | Express REST API connected to MongoDB via `mongodb://mongodb:27017/taskmanager` with dual-sync for live Compass updates. |
| **`frontend`** | `./frontend/Dockerfile` (`node:18`) | `5173` | `5173` | React 18 (Vite) single-page client served via `preview --host 0.0.0.0 --port 5173`. |

---

## 📁 Project Structure

```
Practical-11/
├── .dockerignore              # Root-level ignore rules for Docker context
├── .gitignore                 # Git ignore rules for node_modules and logs
├── docker-compose.yml         # Multi-container orchestration definition
├── README.md                  # Comprehensive documentation and viva analysis
├── backend/
│   ├── .dockerignore          # Excludes node_modules, .env, and local git
│   ├── Dockerfile             # Backend container image recipe (node:18)
│   ├── package.json           # Express, Mongoose, CORS, Dotenv, scripts
│   ├── server.js              # REST API & dual-sync MongoDB connection logic
│   └── models/
│       └── Task.js            # Mongoose Schema (title, description, priority, completed)
└── frontend/
    ├── .dockerignore          # Excludes node_modules, dist, .env
    ├── Dockerfile             # Multi-stage frontend container image recipe
    ├── index.html             # HTML entry point
    ├── package.json           # React 18, Vite dependencies & scripts
    ├── vite.config.js         # Configured for host 0.0.0.0 binding
    └── src/
        ├── api.js             # API helper for Backend REST communication
        ├── App.jsx            # Interactive Task Management UI (Add, Edit, Delete, Priority)
        ├── index.css          # Modern glassmorphism UI styles
        └── main.jsx           # React DOM root render
```

---

## 🚀 Getting Started & Execution

### Prerequisites
1. **Docker Desktop** (or Docker Engine) installed and running.
2. Verify Docker and Docker Compose installation:
   ```bash
   docker --version
   docker compose version
   ```

### 1-Step Execution (Single Command)
Run the entire stack with automatic build and container creation:
```bash
docker-compose up -d --build
```

### Accessing the Applications
- **Frontend Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API Root / Healthcheck:** [http://localhost:5000](http://localhost:5000)
- **Backend Tasks Endpoint:** [http://localhost:5000/tasks](http://localhost:5000/tasks)
- **MongoDB Database:** `mongodb://localhost:27017/taskmanager`

### Verifying Running Containers
```bash
docker ps
```
All 3 containers should be in `Up` status:
- `task_frontend` (Ports: `0.0.0.0:5173->5173/tcp`)
- `task_backend` (Ports: `0.0.0.0:5000->5000/tcp`)
- `task_mongodb` (Ports: `0.0.0.0:27017->27017/tcp`)

### Stopping the Stack
```bash
docker-compose down
```
*To also remove persistent volumes:*
```bash
docker-compose down -v
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/` | API Healthcheck & MongoDB connection status | None |
| **`GET`** | `/tasks` | Retrieve all tasks from `taskmanager` DB | None |
| **`POST`** | `/tasks` | Create a new task in `taskmanager` DB | `{ title, description, priority }` |
| **`PUT`** | `/tasks/:id` | Update an existing task (title, desc, priority, completed) | `{ title, description, priority, completed }` |
| **`DELETE`**| `/tasks/:id` | Delete a task from MongoDB | None |

---

## 🧪 Key Features & Practical Highlights

1. **Full CRUD with Live Database Reflection:**
   - Supports creating, viewing, editing/updating, and deleting tasks.
   - Includes task `priority` flags (`low`, `medium`, `high`) and completion toggles.
2. **MongoDB Compass Live Synchronization:**
   - Features dual-sync capability: changes performed on the web UI immediately update both the containerized database and the host Windows MongoDB service, reflecting live in MongoDB Compass (`127.0.0.1:27017 > taskmanager > tasks`).
3. **`.dockerignore` Optimization:**
   - Both root and subfolder build contexts explicitly exclude `node_modules`, `.env`, `dist`, and `.git` to prevent build context bloat and speed up image building.
4. **Multi-Stage Build Pattern:**
   - The React frontend utilizes a build stage (`FROM node:18 AS build`) compiling dependencies and serving via Vite preview.
5. **Named Volume Persistence for MongoDB:**
   - Configured `mongo-data:/data/db` under the `mongodb` service so task data persists across container restarts.
6. **Isolated Bridge Network (`app-network`):**
   - Inter-container communication is established across a dedicated user-defined bridge network with automatic internal DNS resolution.

---

## 📸 Screenshots Checklist for Lab Submission

The following screenshots are prepared for inclusion in the practical lab submission file:

| # | Screenshot Name | What to Capture | Lab Evaluation Rubric |
| :--- | :--- | :--- | :--- |
| **1** | **Docker Version Verification** | Terminal running `docker --version` and `docker compose version` | Step 1 verification |
| **2** | **Project Docker Configuration** | VS Code showing `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile` | Steps 2, 3 & 4 (Dockerfile & Compose implementation) |
| **3** | **Single Command Build & Launch** | Terminal showing `docker-compose up -d --build` with all 3 services starting | Problem statement (single command verification) |
| **4** | **Running Containers (`docker ps`)** | Terminal output of `docker ps` showing `task_frontend` (5173), `task_backend` (5000), and `task_mongodb` (27017) | Step 7 verification |
| **5** | **Frontend UI in Browser** | Browser at `http://localhost:5173` showing the task manager with badges and task list | Learning outcome & Correctness |
| **6** | **Task Create & Update Operation** | Adding/Editing a task on the web app showing updated priority and text | Interactive implementation evidence |
| **7** | **MongoDB Compass Verification** | MongoDB Compass showing the documents in `taskmanager > tasks` with the updated fields | Database persistence verification |
| **8** | **GitHub Repository Commit** | Browser at GitHub repo `24CS004_Prac-11_awdf` showing the containerization commits | GitHub deliverable requirement |

---

## 🧠 Key Questions & Viva Analysis

### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
> **Answer:**  
> In Docker, each container operates in its own network namespace with an isolated loopback interface (`localhost` / `127.0.0.1`). If the backend container attempts to connect to `localhost:27017`, it looks for a MongoDB process running inside the backend container itself, which does not exist and fails.  
> When containers share a user-defined bridge network (e.g., `app-network`), Docker provides an automatic built-in DNS service discovery mechanism. Resolving the hostname `mongodb` (the service name defined in `docker-compose.yml`) routes directly to the IP address allocated to the MongoDB container on that network.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
> **Answer:**  
> - **`EXPOSE` (Dockerfile):** Functions as internal documentation and metadata indicating which port the application listens on inside the container. It does **not** publish or expose the port to the host machine or host network.  
> - **`ports` (docker-compose.yml):** Defines an active network binding in `HOST:CONTAINER` format (e.g., `'5000:5000'`). It forwards inbound traffic from the host machine's port directly into the container's exposed port, making the service accessible to host browsers, Postman, or external clients.

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
> **Answer:**  
> 1. **Native Binary Incompatibility:** Certain npm packages contain compiled C/C++ bindings (e.g., `bcrypt`, `sharp`). If copied from a host OS (like Windows x64 or macOS ARM), the compiled binaries will fail to execute inside a Linux container (`Linux ELF`).  
> 2. **Build Context Bloat & Slow Transfers:** A `node_modules` directory typically contains tens of thousands of files totaling hundreds of megabytes. Sending this massive context to the Docker daemon severely slows down image builds.  
> 3. **Layer Caching Invalidation:** Running `COPY package*.json ./` followed by `RUN npm install` enables Docker layer caching. The dependencies layer is cached and only rebuilt when `package.json` changes, keeping subsequent builds fast.

---

## 🛠️ Troubleshooting Guide

| Symptom | Likely Cause | Solution / Fix |
| :--- | :--- | :--- |
| **Backend cannot connect to MongoDB** | Connection string mistakenly uses `localhost` instead of the Compose service name | Set `MONGO_URI=mongodb://mongodb:27017/taskmanager` in `docker-compose.yml`. |
| **Port already in use error** | A previous local service or dangling container is holding port 5000, 5173, or 27017 | Run `docker ps` to find and stop conflicting containers, or kill the host process holding the port. |
| **Docker build is extremely slow** | Local `node_modules` or `.git` are being copied into Docker build context | Ensure `.dockerignore` exists and contains `node_modules` and `.env`. |
| **Changes to code not reflected** | Docker is utilizing cached image layers from previous builds | Run `docker-compose up -d --build` to force fresh image layer compilation. |

---

## 📝 Learning Outcome
Successfully containerized a full-stack web application using Docker, created modular Dockerfiles for both frontend and backend environments, persisted database records using named Docker volumes, configured bridge network service discovery, and orchestrated the multi-tier application with a single `docker-compose up` command.
