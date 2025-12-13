# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `setup-nu`, a GitHub Action that sets up a Nushell environment in GitHub Actions workflows. It downloads and installs Nushell binaries from GitHub releases, caches them using `@actions/tool-cache`, and optionally registers bundled plugins.

## Common Commands

- **Build**: `pnpm run build` - Compiles TypeScript and bundles with ncc into `dist/index.js`
- **Format**: `pnpm run fmt` - Formats code using Biome
- **Lint**: `pnpm lint` - Lints TypeScript files using Biome
- **Local test**: `pnpm run run` - Builds and runs locally with test environment variables

## Architecture

The action is a single-entry TypeScript application bundled with `@vercel/ncc`:

- `src/index.ts` - Entry point; parses inputs, calls setup, registers plugins
- `src/setup.ts` - Core logic for downloading/caching Nushell releases from GitHub API
- `src/plugins.ts` - Plugin registration logic; generates and executes Nushell scripts
- `src/plugins-tpl.ts` - Template version of plugins.ts with placeholder for embedded script
- `dist/index.js` - Bundled output consumed by the GitHub Action

**Key flow**: `index.ts` → `checkOrInstallTool()` (setup.ts) → add to PATH → `registerPlugins()` (plugins.ts)

## Platform Support

Platforms are mapped in `setup.ts` via `PLATFORM_DEFAULT_MAP` and `PLATFORM_FULL_MAP`. Supports darwin/linux/win32 on x64/arm64, plus linux on riscv64/loong64.

## Version Handling

- Uses NPM `semver` package for version matching
- Special versions: `*` (latest stable), `nightly` (latest nightly build)
- The `full` feature set was removed from Nushell after v0.93.1

## Pre-commit Hooks

Lefthook runs on pre-commit: spell-check (cspell), lint (biome), format (biome).
