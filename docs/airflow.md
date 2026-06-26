---
type: Guide
title: Airflow
description: Oracle Cloud setup, Docker Compose configuration, and dynamic_runner DAG design.
tags: [airflow, oracle-cloud, execution, docker]
timestamp: 2026-06-26T00:00:00Z
---

# Airflow

> **Status: v2 planned.** Not implemented in v1. v1 uses browser-side JS execution. See [Roadmap](roadmap.md).

Airflow runs on an Oracle Cloud free-tier ARM instance via Docker Compose. See [Architecture](architecture.md) for how it fits the broader system.

## Docker Compose Services

```
airflow-webserver   port 8080 (REST API + UI)
airflow-scheduler
postgres            Airflow metadata DB (separate from Supabase)
```

LocalExecutor — no Redis or Celery worker needed for MVP.

## dynamic_runner.py

Single DAG file placed in Airflow's `dags/` folder. Reads run config from `dag_run.conf` (passed by the Next.js API at trigger time), walks the node graph topologically, and creates a `PythonOperator` per node.

**Config payload shape** (sent from `POST /api/dags/[id]/run`):
```json
{
  "nodes": [
    { "id": "uuid", "code": "print('hello')", "files": ["https://...signed-url"] }
  ],
  "edges": [
    { "source": "uuid", "target": "uuid" }
  ]
}
```

**Execution per node:**
1. Download any attached files from Supabase Storage signed URLs into `/tmp/run_<run_id>/`
2. `exec()` the node's code with files available in working directory
3. Report status back (Airflow task state maps to `dag_runs.status`)

## REST API

Airflow REST API enabled by default on port 8080.

Trigger a run:
```
POST /api/v1/dags/dynamic_runner/dagRuns
Authorization: Basic <base64(user:pass)>
Content-Type: application/json
{ "conf": { ...payload } }
```

Poll status:
```
GET /api/v1/dags/dynamic_runner/dagRuns/<run_id>
```

Credentials stored as `AIRFLOW_URL` + `AIRFLOW_TOKEN` env vars in Vercel.

## Oracle Cloud Firewall

Open port 8080 (or 443 with nginx reverse proxy) in the OCI security list and instance iptables. See [[oci]] skill for commands.
