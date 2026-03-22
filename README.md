# CloudLab Dashboard

A static landing page for a personal homelab “playground”: link self-hosted services, show Docker-backed status, and jump between tools. It is meant to feel like a real lab — experiment, break things, fix them — not a generic portal.

## What it does

- **Single entry point** for your reverse proxy, auth, monitoring, apps, and quick links.
- **Live container status** via a small Node API that reads the Docker socket (`GET /api/containers`).
- **One config file** (`data/services.js`): hero copy, sections, cards, Lucide icons, tags, URLs.

The hero is intentionally short on the headline (**CloudLab** / **Place to experiment.**) with a longer **description** in `DASHBOARD_CONFIG.hero.description`. That block uses the full content width (not a narrow column) and supports multiple paragraphs if you use `\n\n` in the string (`white-space: pre-line`).

## Project layout

| Path | Role |
|------|------|
| `index.html` | Shell, header, theme toggle, loads assets |
| `css/styles.css` | Layout and theming |
| `js/main.js` | Boot, theme, API polling |
| `js/renderer.js` | Builds hero, cards, quicklinks from config |
| `data/services.js` | **`DASHBOARD_CONFIG`** — hero, sections, services |
| `api/` | Minimal HTTP server for Docker (typically run in a container) |
| `docker-compose.yml` | `cloudlab-api` with Docker socket mount |

## Configuration

1. Open **`data/services.js`**.
2. Under **`hero`**, set `title`, `subtitle`, `description`, `badge`, and optional `network` label.
3. Under **`sections`**, maintain **`cards`** (`type: 'cards'`) or **`quicklinks`** (`type: 'quicklinks'`).
4. Set **`container`** on each item to the Docker container name so the API can match running containers.

Icons: [Lucide](https://lucide.dev/icons/) — use the icon name without a prefix in the `icon` field.

Optional: override the API base URL with `api.dockerUrl` (default `null` = same origin, `/api/containers`).

## Docker API service

The Compose service listens on port **2999** by default and needs read access to **`/var/run/docker.sock`**. The browser calls **`/api/containers`** relative to the site (your reverse proxy must forward `/api` to this service).

- **Health:** `GET /health`
- **CORS:** `CORS_ORIGINS` env (e.g. `*` or a comma-separated list)

## Deployment notes

- Serve **static files** (HTML, CSS, JS, images) with your web server or Nginx Proxy Manager.
- Build and run the **API** with `docker compose`; adjust **`docker-compose.yml`** if your external network name is not `npm_default` (it is declared as `external: true`).
- Bump the `?v=` query on `css/styles.css` in `index.html` after CSS changes so browsers pick up updates.

## License / usage

Private homelab project; fork and replace `data/services.js` and branding for your own environment.
