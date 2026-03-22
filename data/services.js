/**
 * ╔══════════════════════════════════════════════════╗
 * ║          CloudLab Dashboard — configuration      ║
 * ║  Edit services, links, and hero copy here       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * status:     "online" | "idle" | "offline"
 * container:  Docker container name (for live status from the API)
 * icon:       any Lucide icon → https://lucide.dev/icons/
 * tag:        Short badge (role/category), e.g. "Proxy", "Auth"
 * quicklinks: label = same idea (shown to the right of the name)
 */

const DASHBOARD_CONFIG = {

  /* ── Docker API ─────────────────────────────────── */
  api: {
    // Optional: override URL. null = relative /api/containers
    dockerUrl: null,
  },

  /* ── Hero ──────────────────────────────────────── */
  hero: {
    title:    'CloudLab',
    subtitle: 'Place to experiment.',
    description:
      'My homelab playground: a single place to self-host services, manage the stack, and try ideas without worrying about a “perfect” setup. Docker, reverse proxy, auth, monitoring — break things, fix them, learn. This dashboard is the map: links, quick access, and live container status so I always know what’s running.',
    badge:    'Playground · Self-hosted · Homelab',
    network:  '192.168.x.x',
  },

  /* ── Sections ─────────────────────────────────── */
  sections: [

    /* ── 1. Infrastructure (cards) ── */
    {
      id:    'infrastructure',
      title: 'Infrastructure',
      type:  'cards',
      items: [
        {
          name:      'Portainer',
          desc:      'Manage Docker containers, images, and stacks in the browser.',
          icon:      'layout-dashboard',
          tag:       'Docker',
          url:       '/portainer',
          status:    'online',
          container: 'portainer',
        },
        {
          name:      'Nginx Proxy Manager',
          desc:      'Reverse proxy with SSL termination, hosts, and forwarding rules.',
          icon:      'shield-check',
          tag:       'Proxy',
          url:       '130.61.227.197:81',
          status:    'online',
          container: 'nginx-proxy-manager',
        },
        {
          name:      'Authelia',
          desc:      'Sign-in portal with 2FA (TOTP): protects services on lab.rtbg.dev — login and account settings.',
          icon:      'key-round',
          tag:       'Auth & 2FA',
          url:       '/auth/',
          status:    'offline',
          container: 'authelia',
        },
        {
          name:      'Uptime Kuma',
          desc:      'Uptime monitoring with alerts and a public status page.',
          icon:      'activity',
          tag:       'Monitoring',
          url:       '#',
          status:    'offline',
          container: 'uptime-kuma',
        },
        {
          name:      'Netdata',
          desc:      'Real-time CPU, RAM, disk, network, and Docker container metrics.',
          icon:      'gauge',
          tag:       'Metrics',
          url:       '/netdata/',
          status:    'offline',
          container: 'netdata',
        },
      ],
    },

    /* ── 2. Services (cards) ── */
    {
      id:    'services',
      title: 'Services',
      type:  'cards',
      items: [
        {
          name:      'Nextcloud',
          desc:      'Private cloud for files, calendar, contacts, and collaboration.',
          icon:      'cloud',
          tag:       'cloud',
          url:       '#',
          status:    'offline',
          container: 'nextcloud',
        },
        {
          name:      'Gitea',
          desc:      'Self-hosted Git for repositories, issues, and CI/CD.',
          icon:      'git-branch',
          tag:       'git',
          url:       '#',
          status:    'offline',
          container: 'gitea',
        },
        {
          name:      'Vaultwarden',
          desc:      'Bitwarden-compatible password manager — self-hosted and secure.',
          icon:      'shield',
          tag:       'vault',
          url:       '#',
          status:    'offline',
          container: 'vaultwarden',
        },
        {
          name:      'Jellyfin',
          desc:      'Media server for movies, shows, and music — stream anywhere.',
          icon:      'film',
          tag:       'Streaming',
          url:       '#',
          status:    'offline',
          container: 'jellyfin',
        },
        {
          name:      'Outline',
          desc:      'Team wiki and knowledge base with a clean editor and versioning.',
          icon:      'book-open',
          tag:       'wiki',
          url:       '#',
          status:    'offline',
          container: 'outline',
        },
        {
          name:      'Obsidian',
          desc:      'Notes vault - linked notes, graph, and plugins.',
          icon:      'notebook-pen',
          logoUrl:   'img/obsidian-logo.svg',
          tag:       'Notes',
          url:       '/obsidian/',
          status:    'offline',
          container: 'obsidian',
        },
        {
          name:      'OpenClaw',
          desc:      'Self-hosted AI assistant — connects messaging apps to models across 50+ channels (WhatsApp, Telegram, Discord, and more).',
          icon:      'bot',
          logoUrl:   'img/openclaw-logo.svg',
          tag:       'ai',
          url:       '/openclaw/',
          status:    'offline',
          container: 'openclaw-openclaw-gateway-1',
        },
      ],
    },

    /* ── 3. Quick access (two-column link list) ── */
    {
      id:    'quick-access',
      title: 'Quick access',
      type:  'quicklinks',
      columns: [
        [
          { name: 'Cockpit',    icon: 'terminal',    url: '#', label: 'System',   container: 'cockpit'    },
          { name: 'Adminer',    icon: 'database',    url: '#', label: 'SQL',        container: 'adminer'    },
          { name: 'Mailserver', icon: 'mail',        url: '#', label: 'Mail',       container: 'mailserver' },
          { name: 'Pi-hole',    icon: 'wifi',        url: '#', label: 'DNS',        container: 'pihole'     },
        ],
        [
          { name: 'Prometheus', icon: 'box',         url: '#', label: 'Metrics',    container: 'prometheus' },
          { name: 'Gotify',     icon: 'send',        url: '#', label: 'Push',         container: 'gotify'     },
          { name: 'Authelia',   icon: 'key',         url: '/auth/', label: 'Auth',      container: 'authelia'   },
          { name: 'Grafana',    icon: 'bar-chart-2', url: '#', label: 'Charts',       container: 'grafana'    },
        ],
      ],
    },

  ], // end sections
}; // end DASHBOARD_CONFIG
