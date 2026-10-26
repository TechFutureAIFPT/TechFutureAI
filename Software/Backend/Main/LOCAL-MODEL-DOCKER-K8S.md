# CV Match v2: local Docker and Kubernetes

This setup runs only on this Windows computer. It does not push images, model weights, or application data to a registry or cloud service. The local CV Match tag is `cv-match:7b-local-sft-v2`.

The evaluation report says v2 is the newest trained candidate, but it scored worse than the original model on the current synthetic CV evaluation and is not HR-validated. This configuration selects v2 because the local owner requested the latest version; it does not mark v2 as production-approved.

## Local Ollama

Ollama contains one CV Match tag: `cv-match:7b-local-sft-v2`. `qwen2.5-coder:7b` remains available for general local LLM calls, and `nomic-embed-text:latest` remains available for embeddings. Those are separate roles, not older CV Match candidates.

The regular local backend runner now defaults to v2:

```powershell
cd D:\cv match\Software\Backend\Main\api_server
python run_local.py --port 8010
```

`api_server/.env.local-runtime` now points the local host runner to the Docker Ollama endpoint on `127.0.0.1:11435`; the file contains no credentials and is gitignored. It selects v2 for CV matching, Qwen for general local LLM calls, and Nomic for embeddings.

## Docker Compose

Docker Desktop Linux Engine must be running. The Compose file seeds a dedicated Ollama volume from the host model store, exposes Ollama only on `127.0.0.1:11435`, and exposes the API only on `127.0.0.1:8011`. The API uses its own local SQLite volume and the internal Ollama service.

CPU mode:

```powershell
cd D:\cv match\Software\Backend\Main
docker compose -f docker-compose.local-model.yml up -d --build
```

For Docker Desktop GPU passthrough on a machine where it is available:

```powershell
docker compose -f docker-compose.local-model.yml -f docker-compose.local-model.gpu.yml up -d --build
```

Open the Compose API at `http://127.0.0.1:8011/docs`. Ollama's container endpoint is `http://127.0.0.1:11435`; the API talks to it over the private Compose network. The host-run API on port 8010 and Compose API on port 8011 are separate local entry points.

```powershell
ollama stop cv-match:7b-local-sft-v2
```

## Local Kubernetes with kind

This overlay mounts the host Ollama model store read-only and a separate local SQLite directory into a single-node kind cluster. Model and database paths stay on this machine, without copying the 9 GB model store into another volume. The local Ollama pod uses CPU; kind GPU passthrough is not configured, so inference is slower than the Docker GPU setup. The local overlay keeps one API and worker replica because kind has no metrics server for HPA scaling.

With Docker Desktop running, build the backend image, create the local cluster with its host mounts, load the image, and apply the local-only overlay:

```powershell
cd D:\cv match\Software\Backend\Main
.\deploy\kubernetes\overlays\local-model\Start-Local-Model-K8s.ps1
```

Expose the API on loopback:

```powershell
kubectl -n supporthr-local port-forward service/supporthr-api 8011:80
```

Then open `http://127.0.0.1:8011/docs`. The script verifies local mounts before reusing the `kind` cluster. It persists a separate SQLite database under the backend `.cache` directory instead of sharing the host API database. Stop the port-forward before starting the Compose API because they use the same local port. Inspect the local cluster before removing it.

## Local-only boundaries

- Do not use `deploy/kubernetes/overlays/production`, `deploy/kubernetes/overlays/oci-free`, `docker-compose.yml`, or any push/deploy workflow for this setup.
- The Compose and Kubernetes API endpoints bind or forward only to localhost.
- No model training or model upload runs as part of these startup commands.
