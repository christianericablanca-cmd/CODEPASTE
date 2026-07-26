# CodePaste

A modern, developer-friendly code sharing platform with a VS Code-inspired editor, end-to-end encryption, multi-tab editing, 15 themes, and full privacy controls.

Built with **Next.js 14**, **Supabase**, **Monaco Editor**, and **Tailwind CSS**.

---

## Features

### Editor
- **Multi-tab editing** — open, close, rename, and reorder tabs like VS Code
- **Monaco Editor** — full VS Code editing experience with syntax highlighting, intellisense, and bracket matching
- **23 languages** — JavaScript, TypeScript, Python, Rust, Go, and more
- **15 themes** — Dark+, Light+, Monokai, Nord, One Dark Pro, GitHub Dark, Dracula, Tokyo Night, SynthWave '84, Catppuccin Mocha, Night Owl, Gruvbox Dark, Ayu Dark, Cobalt2, Shades of Purple

### Security & Privacy
- **End-to-end encryption** — pastes are encrypted with AES-256-GCM in the browser before reaching the server
- **Password protection** — optional PBKDF2-derived key wrapping for an additional security layer
- **Visibility controls** — Public, Unlisted (anyone with the link), or Private (signed-in user only)
- **Auto-expiry** — set pastes to expire from 10 minutes to 1 month

### Sharing & Discovery
- **Live paste counter** — landing page shows real-time total public paste count
- **Syntax-highlighted previews** — typewriter code preview on landing page with theme-aware syntax coloring
- **Forking** — fork any public paste into your own account
- **Version history** — track changes to your pastes over time
- **Profile pages** — `u/[username]` shows a user's public pastes
- **My Pastes** — signed-in users can view/manage all their pastes

### User Experience
- **Google OAuth** — one-click sign-in
- **Customizable preferences** — theme, font size, word wrap, minimap (persisted to account)
- **Settings panel** — nickname, theme grid, API token management, data export, account deletion
- **Search panel** — sidebar search within the active paste
- **Activity bar** — explorer, search, theme palette switcher
- **Toast notifications** — non-intrusive feedback for all actions
- **Landing page animations** — animated counter, typewriter code preview, staggered feature cards, floating gradient orbs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Icons** | Lucide React |

---

## Project Structure

```
app/
├── api/
│   ├── count/route.ts           # Paste count endpoint
│   ├── export/route.ts          # Export all user pastes as JSON
│   ├── pastes/route.ts          # List & create pastes
│   ├── pastes/[slug]/route.ts   # Get, update, delete single paste
│   ├── pastes/[slug]/versions/  # Version history for a paste
│   ├── profile/route.ts         # User profile CRUD
│   ├── search/route.ts          # Full-text search on public pastes
│   ├── tokens/route.ts          # API token management
│   └── tokens/[id]/route.ts     # Delete specific API token
├── auth/
│   ├── callback/route.ts        # OAuth callback handler
│   ├── login/page.tsx           # Sign-in page
│   └── signup/page.tsx          # Sign-up page
├── my-pastes/page.tsx           # Signed-in user's paste list
├── new/page.tsx                 # Multi-tab paste editor
├── p/[slug]/page.tsx            # Single paste viewer
├── p/[slug]/paste-viewer.tsx    # Paste display logic (decrypt, edit, fork)
├── settings/page.tsx            # User preferences & account management
├── u/[username]/page.tsx        # Public user profile
├── api-docs/page.tsx            # API documentation
├── browse/page.tsx              # Browse public pastes
├── layout.tsx                   # Root layout with theme initialization
├── page.tsx                     # Landing page with animations
├── providers.tsx                # Client-side providers
└── globals.css                  # Global styles & theme CSS variables

components/
├── activity-bar.tsx             # VS Code-style activity bar (Explorer, Search, Palette, Settings)
├── auth-status.tsx              # Sign-in status with Google avatar
├── editor.tsx                   # Monaco Editor wrapper with theme registration
├── sidebar.tsx                  # Explorer + Search panels
├── status-bar.tsx               # VS Code-style status bar
├── theme-panel.tsx              # Theme grid selector
└── toast.tsx                    # Toast notification system

lib/
├── auth.ts                      # Cookie + Bearer token auth helpers
├── crypto.ts                    # AES-256-GCM encrypt/decrypt, PBKDF2 key wrapping
├── monaco-themes.ts             # 15 custom Monaco syntax theme definitions
├── slug.ts                      # URL-safe slug generation
├── supabase.ts                  # Supabase server client (service_role key)
├── supabase-client.ts           # Supabase browser client (anon key)
├── supabase-server.ts           # Supabase SSR auth client
├── theme-context.tsx            # Theme & preferences context with server sync
└── themes.ts                    # Theme definitions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- A Google OAuth 2.0 client ID

### 1. Clone & Install

```bash
git clone https://github.com/christianericablanca-cmd/CODEPASTE.git
cd CODEPASTE
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Database

Run `supabase-migration-v2.sql` in your Supabase SQL editor to create all tables, indexes, RLS policies, and grants:

```sql
-- Executes the full schema including:
-- * pastes (slug, title, content, language, visibility, expires_at, password_protected, etc.)
-- * profiles (nickname, preferences JSON, etc.)
-- * api_tokens (hashed tokens with scopes)
-- * paste_versions (snapshot history per paste)
-- * RLS policies for row-level security
-- * Service role grants
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 Web Client
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Copy the client ID into `.env.local` and Supabase Auth settings

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## API Reference

### `GET /api/pastes`

List public pastes (paginated).

| Query | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max results (max 100) |
| `offset` | number | 0 | Pagination offset |
| `count` | boolean | — | If `true`, returns `{"count": N}` instead of paste list |

### `POST /api/pastes`

Create a new paste.

```json
{
  "content": "encrypted-base64-content",
  "language": "typescript",
  "title": "My Paste",
  "visibility": "public",
  "expiresIn": "1day",
  "password_protected": false,
  "wrapped_key": "base64-key",
  "wrapped_key_salt": "base64-salt",
  "wrapped_key_iv": "base64-iv"
}
```

### `GET /api/pastes/[slug]`

Retrieve a single paste by slug.

### `PUT /api/pastes/[slug]`

Update a paste (owner only).

### `DELETE /api/pastes/[slug]`

Delete a paste (owner only).

### `GET /api/pastes/[slug]/versions`

Get version history for a paste.

### `GET /api/profile`

Get the authenticated user's profile.

### `PUT /api/profile`

Update profile (nickname, preferences).

### `DELETE /api/profile`

Delete account and all associated data.

### `POST /api/tokens`

Create a new API token (returns the raw token once).

### `GET /api/tokens`

List all tokens for the authenticated user (token values are masked).

### `DELETE /api/tokens/[id]`

Revoke a specific API token.

### `GET /api/export`

Download all user pastes as a JSON file.

### `GET /api/search?q=keyword`

Full-text search on public pastes.

---

## Database Schema

### `pastes`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `slug` | TEXT (unique) | URL-safe identifier |
| `title` | TEXT | Paste title |
| `content` | TEXT | Encrypted content |
| `language` | TEXT | Programming language |
| `visibility` | TEXT | `public`, `unlisted`, or `private` |
| `user_id` | UUID (nullable) | Owner's auth ID |
| `password_protected` | BOOLEAN | Whether PBKDF2 wrapping is applied |
| `wrapped_key` | TEXT | Encrypted AES key |
| `wrapped_key_salt` | TEXT | PBKDF2 salt |
| `wrapped_key_iv` | TEXT | IV for key wrapping |
| `expires_at` | TIMESTAMPTZ (nullable) | Auto-expiry timestamp |
| `views` | INTEGER | View counter |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches auth.users) |
| `nickname` | TEXT | Display name |
| `preferences` | JSONB | Theme, font size, word wrap, minimap |
| `created_at` | TIMESTAMPTZ | |

### `api_tokens`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | TEXT | Token label |
| `token_hash` | TEXT | bcrypt hash of token |
| `scopes` | TEXT[] | Permission scopes |
| `last_used_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

### `paste_versions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `paste_id` | UUID | Reference to pastes |
| `content` | TEXT | Snapshot of content |
| `created_at` | TIMESTAMPTZ | |

---

## Encryption Details

CodePaste uses **client-side encryption** so the server never sees plaintext content:

1. A random 256-bit AES key is generated per paste
2. Content is encrypted with AES-256-GCM (12-byte IV, 16-byte auth tag)
3. The encrypted content (base64) is sent to the server
4. For password-protected pastes, the AES key is wrapped with a PBKDF2-derived key (100,000 iterations, SHA-256)
5. The wrapped key, salt, and IV are stored alongside the encrypted content
6. Decryption happens entirely in the browser

---

## Themes

15 themes are defined as CSS variable blocks in `globals.css`. Each theme sets colors for the full VS Code UI simulation (sidebar, tabs, borders, buttons, status bar) plus syntax highlighting colors for the landing page typewriter preview.

| Theme | Class | Monaco Theme |
|-------|-------|-------------|
| Dark+ | `theme-vscode-dark` | `vs-dark` |
| Light+ | `theme-vscode-light` | `vs` |
| Monokai | `theme-monokai` | `monokai` |
| Nord | `theme-nord` | `nord` |
| One Dark Pro | `theme-one-dark` | `one-dark` |
| GitHub Dark | `theme-github-dark` | `github-dark` |
| Dracula | `theme-dracula` | `dracula` |
| Tokyo Night | `theme-tokyo-night` | `tokyo-night` |
| SynthWave '84 | `theme-synthwave` | `synthwave` |
| Catppuccin Mocha | `theme-catppuccin` | `catppuccin` |
| Night Owl | `theme-night-owl` | `night-owl` |
| Gruvbox Dark | `theme-gruvbox` | `gruvbox` |
| Ayu Dark | `theme-ayu-dark` | `ayu-dark` |
| Cobalt2 | `theme-cobalt2` | `cobalt2` |
| Shades of Purple | `theme-shades-of-purple` | `shades-of-purple` |

---

## License

MIT
