# CloudLab Dashboard

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Self-Hosted](https://img.shields.io/badge/Self--Hosted-FF6F00?logo=homeassistant&logoColor=white)
![Last Commit](https://img.shields.io/github/last-commit/LRenTi/cloudlab)
![Repo Size](https://img.shields.io/github/repo-size/LRenTi/cloudlab)
![Works on My Machine](https://img.shields.io/badge/Works_on-My_Machine-success)

A static landing page for a personal homelab "playground": link self-hosted services, show Docker-backed status, and jump between tools. It is meant to feel like a real lab -- experiment, break things, fix them -- not a generic portal.

## What it does

- **Single entry point** for your reverse proxy, auth, monitoring, apps, and quick links.
- **Live container status** via a small Node API that reads the Docker socket (`GET /api/containers`).
- **Card grids** (e.g. Infrastructure and Services) are sorted the same way after each poll: online > idle > offline, then alphabetically by card title within each group (DOM reorder, not only CSS `order`).
- **One config file** (`data/services.js`): hero copy, sections, cards, Lucide icons, tags, URLs.

The hero is intentionally short on the headline (**CloudLab** / **Place to experiment.**) with a longer **description** in `DASHBOARD_CONFIG.hero.description`. That block uses the full content width (not a narrow column) and supports multiple paragraphs if you use `\n\n` in the string (`white-space: pre-line`).

## Project layout

| Path | Role |
|------|------|
| `index.html` | Shell, header, theme toggle, loads assets |
| `css/styles.css` | Layout and theming |
| `js/main.js` | Boot, theme, API polling |
| `js/renderer.js` | Builds hero, cards, quicklinks from config |
| `data/services.js` | **`DASHBOARD_CONFIG`** -- hero, sections, services |
| `api/` | Minimal HTTP server for Docker (typically run in a container) |
| `docker-compose.yml` | `cloudlab-api` with Docker socket mount |

## Configuration

1. Open **`data/services.js`**.
2. Under **`hero`**, set `title`, `subtitle`, `description`, `badge`, and optional `network` label.
3. Under **`sections`**, maintain **`cards`** (`type: 'cards'`) or **`quicklinks`** (`type: 'quicklinks'`).
4. Set **`container`** on each item to the Docker container name so the API can match running containers.

Icons: [Lucide](https://lucide.dev/icons/) -- use the icon name without a prefix in the `icon` field.

Optional: override the API base URL with `api.dockerUrl` (default `null` = same origin, `/api/containers`).

## Docker API service

The Compose service listens on port **2999** by default and needs read access to **`/var/run/docker.sock`**. The browser calls **`/api/containers`** relative to the site (your reverse proxy must forward `/api` to this service).

- **Health:** `GET /health`
- **CORS:** `CORS_ORIGINS` env (e.g. `*` or a comma-separated list)

## Authentication (Authelia)

The dashboard integrates with [Authelia](https://www.authelia.com/) for SSO and two-factor authentication. Authelia runs as a **separate** Docker Compose stack (it protects the entire host, not just this dashboard), but shares the same Docker network (`npm_default`).

### How the dashboard uses it

- `js/main.js` polls **`/auth/api/state`** (with cookies) to show a logged-in user badge or a "Sign in" link.
- Sign-out calls **`POST /auth/api/logout`**.
- The auth prefix is configured as `AUTH_PREFIX = '/auth'` in `main.js`.

### Nginx forward-auth setup

Authelia sits behind Nginx Proxy Manager via a custom `server_proxy.conf`. The key pieces:

1. **Internal authz endpoint** -- Nginx calls this on every protected request:

```nginx
location = /internal/auth/authz {
    internal;
    proxy_pass http://authelia:9091/api/authz/auth-request;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-Method $request_method;
    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

2. **Public login portal** (no `auth_request`, users need to reach it):

```nginx
location /auth/ {
    auth_request off;
    proxy_pass http://authelia:9091;
    proxy_set_header Host $http_host;
    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

3. **Protected service** -- add these three lines to any location block:

```nginx
location /some-service/ {
    auth_request      /internal/auth/authz;
    auth_request_set  $redirection_url $upstream_http_location;
    error_page 401 =302 $redirection_url;

    proxy_pass http://some-service:8080/;
    # ... usual proxy headers ...
}
```

### Deploying Authelia

Authelia is **not** included in this repo's `docker-compose.yml` to keep secrets (`jwt_secret`, `session.secret`, `encryption_key`) out of a public repository. Deploy it separately:

1. Create a directory with `docker-compose.yml`, `config/configuration.yml`, and `config/users_database.yml`.
2. Join the same external network (`npm_default`).
3. Point your Nginx custom config at the Authelia container on port `9091`.

See the [Authelia docs](https://www.authelia.com/configuration/prologue/introduction/) for full configuration reference.

## Deployment notes

- Serve **static files** (HTML, CSS, JS, images) with your web server or Nginx Proxy Manager.
- Build and run the **API** with `docker compose`; adjust **`docker-compose.yml`** if your external network name is not `npm_default` (it is declared as `external: true`).
- Bump the `?v=` query on `css/styles.css` in `index.html` after CSS changes so browsers pick up updates.

## License / usage

Private homelab project; fork and replace `data/services.js` and branding for your own environment.
