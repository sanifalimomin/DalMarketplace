# CI/CD

GitLab CI builds a Docker image per package, pushes both to Docker Hub, then
pings Render's deploy hooks so Render pulls the new images.

```
git push (main) ──▶ GitLab CI ──▶ Docker images ──▶ Docker Hub ──▶ Render deploy hooks ──▶ live
```

## Files

| File | Contains |
|---|---|
| `../.gitlab-ci.yml` | Entry point (required at the repo root): stages, image names, `include`s |
| `common.gitlab-ci.yml` | Shared bases — `.dal_runner` (runner tag + main-only rule), `.docker_build` (dind + Docker Hub login) |
| `build.gitlab-ci.yml` | `build:api`, `build:client` — build and push images |
| `deploy.gitlab-ci.yml` | `deploy:render` — POST both Render deploy hooks |

The whole pipeline is gated on `$CI_COMMIT_BRANCH == "main"`, so feature branches
and merge requests never publish an image or trigger a deploy.

Images are tagged twice: `$CI_COMMIT_SHORT_SHA` (immutable — use it to roll back
by pinning a Render service to an older tag) and `latest` (what Render pulls).

## Required CI/CD variables

Set under **Settings > CI/CD > Variables**. Mask *and* protect every secret; the
`VITE_*` values are public (they end up in the client bundle) but still need to
be set here because they are baked in at build time.

| Variable | Purpose | Secret |
|---|---|---|
| `DOCKERHUB_USER` | Docker Hub username / namespace | no |
| `DOCKERHUB_TOKEN` | Docker Hub access token (read/write) | yes |
| `VITE_API_BASE_URL` | Public URL of the deployed API | no |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | no |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset | no |
| `VITE_STREAM_API_KEY` | Stream Chat API key (client-side, public) | no |
| `RENDER_DEPLOY_HOOK_API` | Render deploy hook URL for the API service | yes |
| `RENDER_DEPLOY_HOOK_CLIENT` | Render deploy hook URL for the client service | yes |

Server-side secrets (`JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`,
`STREAM_SECRET`, email credentials, ...) are **not** CI variables — they are set
directly on the Render API service, since the server reads them at runtime.

## Adding a job

Put it in the file for its stage (or add a new `ci/<name>.gitlab-ci.yml` plus an
`include:` line in the root `.gitlab-ci.yml`), and `extends: .dal_runner` so it
picks up the runner tag and the main-only rule.
