# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-05-09

### Fixed

- **`pobo --version` and any version-aware code path** crashed with `ENOENT: no such file or directory ... @pobo/package.json` after a global install. Cause: CLI resolved `package.json` via a relative path that assumed the source `dist/<file>.js` layout, but the published tarball uses a flatten layout. The version is now baked at build time into `src/constants.generated.ts` (alongside the API URL), so no runtime filesystem lookup is needed.

## [1.0.0] - 2026-05-09

First public stable release.

### Added

- **Auth:** `pobo auth login` / `logout` / `me` (user info + connected eshops).
- **Widget management:**
  - `widget list` — table of your widgets (id, name, root_class, has_component).
  - `widget create` — interactive scaffold (API + local `widgets/<id>/`).
  - `widget show [id]` — server-side widget detail.
  - `widget push [id] [-y]` — compile SCSS, parse HTML, push to server.
  - `widget validate [id]` — server-side HTML validator with element tree output.
  - `widget connect [id]` — connect widget to an eshop (grouped picker by platform).
  - `widget disconnect [id] [-y]` — remove widget from an eshop.
  - `widget connections` — bulk overview matrix of widget × eshop.
  - `widget flush [id] [-y]` — delete widget elements (widget stays).
  - `widget delete [id] [-y]` — delete widget from server.
  - `widget proxy [url]` — live preview server with file watcher + SSE auto-reload (wizard mode if no URL; auto-fallback to next free port if 3001 is busy).
- **System:** `pobo doctor` — health check (env / config / connectivity / local widgets).
- **UX:**
  - Interactive widget pickers for both local (`push`/`validate`/`proxy`) and server (`delete`/`flush`/`connect`/`disconnect`/`show`) commands.
  - Eshop picker grouped by platform (Shopify / Shoptet / PrestaShop / Upgates / WordPress / Other).
  - All destructive `y/N` prompts replaced with explicit `select` ("No, cancel" / "Yes, …") to prevent muscle-memory accidents.
  - `cli-table3` rendering for `auth me`, `widget list`, `widget connections`, `doctor`, recursive help.
  - `ora` spinners during `widget push` pipeline.
- **Config:** `~/.pobo/config.json` (mode 0600 on POSIX), `POBO_API_URL` / `POBO_DEFAULT_API_URL` env, `.env` autoload via `dotenv/config` in the bin entrypoint.
- **Build:** TypeScript strict + NodeNext + `@/` path alias via `tsc-alias`. ESM-only.
- **Tests:** Vitest + MSW + `@inquirer/prompts` mocks. 157 tests, coverage 94 / 81.65 / 97.19 / 96.08 (statements / branches / functions / lines).
- **CI:** GitHub Actions matrix `{ubuntu, macos, windows} × Node {20, 22, 25}`.

### Requirements

- Node.js ≥ 20.12 (ESLint 10 needs `util.styleText`).
- A reachable Pobo Laravel API serving `/api/v3/cli/*`.

[1.0.0]: https://github.com/pobo-builder/pobo-cli/releases/tag/v1.0.0
