# Walkthrough: Local Development Setup & Deployment Automation

This walkthrough summarizes the configuration changes and automation scripts implemented to simplify your local testing workflow and ECR/ECS production deployments.

---

## 1. Summary of Changes

### Frontend (`WhatIEat`)
*   **[NEW]** [.env.example](file:///Users/ayouba/Documents/WhatIEat/.env.example): A template environment configuration explaining how to toggle between `localhost`, a local IP, and the AWS production backend URL.
*   **[MODIFY]** [.env](file:///Users/ayouba/Documents/WhatIEat/.env): Switched the default target to `http://localhost:8000` to allow immediate testing with a local backend server.

### Backend (`fridge_detector`)
*   **[NEW]** [start_dev.sh](file:///Users/ayouba/Documents/laboratoire/fridge_detector/start_dev.sh): A single-command shell script to launch the FastAPI backend server in development mode.
*   **[NEW]** [deploy_prod.sh](file:///Users/ayouba/Documents/laboratoire/fridge_detector/deploy_prod.sh): An interactive script that automatically builds the application Docker container (skipping heavy weights), handles ECR authentication, and tags/pushes the image.

---

## 2. Verification Results

### Local Server Startup Test
Running `./start_dev.sh` starts the backend correctly on port `8000`:
```text
=== [INFO] Starting FastAPI Backend in Development Mode ===
=== [INFO] Running server on http://localhost:8000 ===
INFO:     Started server process [37937]
INFO:     Waiting for application startup.
INFO:src.utils.database:✅ Pool NeonDB créé.
INFO:src.api.main:✅ NeonDB connecté.
INFO:src.api.main:✅ Détecteur FRCNN chargé.
INFO:root:Loaded checkpoint successfully
INFO:src.api.main:SAM 2 status : SAM 2 enabled (tiny on cpu)
INFO:src.models.recommender:Chargement dataset : /Users/ayouba/Documents/laboratoire/fridge_detector/data/recipes.json
INFO:src.models.two_tower:Two-Tower : calcul IDF…
INFO:src.models.two_tower:Two-Tower : encodage des recettes…
INFO:src.models.two_tower:Two-Tower prêt — 9901 recettes encodées
INFO:src.models.recommender:Recommender prêt — 9901 recettes
INFO:src.api.main:✅ Two-Tower prêt — 9901 recettes.
INFO:src.api.main:✅ ModelUpdater démarré.
INFO:src.utils.model_updater:📡 Watcher démarré sur data/recipes.json (vérif toutes les 60s)
INFO:src.utils.model_updater:⏰ Re-fit périodique programmé toutes les 24h
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Local `/health` Endpoint Check
A `GET` request to `http://localhost:8000/health` confirms the server is fully ready, using backend version `5.0.0`, and connected to the cloud Neon database:
```json
{
  "status": "ok",
  "version": "5.0.0",
  "db": "connected",
  "detector": {
    "loaded": true
  },
  "sam": {
    "status": "SAM 2 enabled (tiny on cpu)"
  },
  "recommender": {
    "recipes_loaded": 9901,
    "refit_count": 0
  }
}
```

---

## 3. Operational Guidelines

### How to Test Locally
1.  **Launch the backend**:
    ```bash
    cd /Users/ayouba/Documents/laboratoire/fridge_detector
    ./start_dev.sh
    ```
2.  **Launch the frontend**:
    ```bash
    cd /Users/ayouba/Documents/WhatIEat
    npm start
    ```

### How to Deploy to AWS ECR/ECS
When you are ready to update the ECS container service:
1.  Run the deployment script:
    ```bash
    cd /Users/ayouba/Documents/laboratoire/fridge_detector
    ./deploy_prod.sh
    ```
2.  Trigger a new deployment on ECS using the printed AWS command:
    ```bash
    aws ecs update-service --cluster default --service fridge-detector-8bfa --force-new-deployment --region eu-west-3
    ```
