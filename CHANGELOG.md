# Changelog
All notable changes to this project will be documented in this file.

## [3.22] - 2025-12-13

### Bug Fixes

- Added input validation for plugin registration to prevent injection vulnerabilities (#195)

### Features

- Add strict input validation and robust plugin registration; improve target selection and caching (#190)
- Support proxies (#194)

### Miscellaneous Tasks

- Update .lefthook/pre-push/sync.nu
- Update README.md
- Bump actions/checkout from 5 to 6 (#191)
- Drop 0.88.1 check
- Update README
- Update lefthook.yml
- Upgrade runner os from macos-13 to macos-15
- Update dist & format code

### Deps

- Upgrade @octokit/rest,lefthook,@types/node, and @biomejs/biome
- Upgrade pnpm to v10
- Upgrade @biomejs/biome,cspell & lefthook
- Upgrade globby, @biomejs/biome & cspell
- Upgrade @biomejs/biome,lefthook & cspell (#193)
- Upgrade @actions/core & lefthook

## [3.21] - 2025-10-25

### Bug Fixes

- Fix for Nu 0.106 and later versions
- Update full matrix check

### Features

- Rewrite git pre push hook from bash to nu (#169)

### Miscellaneous Tasks

- Update test workflows
- Bump `actions/checkout` from 4 to 5 (#164)
- Bump `actions/setup-node` from 4 to 5 (#170)
- Bump `actions/setup-node` from 5 to 6 (#181)
- Add `nu` 0.108 to test matrix (#182)

### Deps

- Upgrade typescript,cspell, and @biomejs/biome (#163)
- Upgrade @biomejs/biome, @types/node and lefthook (#167)
- Upgrade Node engine to 24 (#168)
- Upgrade @biomejs/biome,@vercel/ncc & cspell (#173)
- Upgrade globby, typescript, and @biomejs/biome (#176)
- Upgrade semver & @types/node
- Upgrade @biomejs/biome,@types/node,cspell & lefthook

## [3.20] - 2025-07-15

### Features

- Use public GitHub API for Nushell assets query, try to make it work for GitHub Enterprise (#140)
- Update setup-nu for future versions of Nu( >= 0.106) (#157)

### Miscellaneous Tasks

- Test Nu on Windows arm64 runner (#147)

### Deps

- Upgrade `cspell`,`lefthook` and `typescript` (#144)
- Upgrade `cspell`,`lefthook`,`semver`, etc. (#148)
- Upgrade `@octokit/rest` and `@types/node` (#150)
- Upgrade `@biomejs/biome` and `cspell` (#154)
- Upgrade `@biomejs/biome`,`@types/shelljs`,`cspell` and `lefthook` (#158)
- Bump `@types/node` from 22.13.14 to 22.14.0 (#141)
- Bump `cspell` from 8.18.1 to 8.19.2 (#142)
- Bump `@types/node` from 22.14.0 to 22.15.3 (#143)
- Bump `cspell` from 8.19.3 to 9.0.0 (#145)
- Bump `shelljs` from 0.9.2 to 0.10.0 (#146)

## [3.19] - 2025-03-30

### Bug Fixes

- Fix known security issues (#136)

### Features

- Add `latest-matrix.yaml` workflow to test latest Nu on various platform (#135)
- Add `linux_riscv64` platform setup support (#137)
- Add `linux_loong64` platform setup support (#138)

### Miscellaneous Tasks

- Update `exclude-patterns` for code review
- Update code review prompt
- Update `Nu` version in workflows and README files to 0.103 (#139)

### Deps

- Upgrade `shelljs`,`cspell` and `lefthook` (#134)

## [3.18] - 2025-03-15

### Documentation

- Update README.md docs (#127)

### Miscellaneous Tasks

- Add AI code review by using `hustcer/deepseek-review`
- Bump `@types/node` from 22.12.0 to 22.13.0 (#128)
- Bump `globby` from 14.0.2 to 14.1.0 (#129)
- Bump `lefthook` from 1.10.10 to 1.11.0 (#130)
- Bump `typescript` from 5.7.3 to 5.8.2 (#131)
- Bump `shelljs` from 0.8.5 to 0.9.1 (#132)
- Rebuild setup scripts

### Deps

- Upgrade `cspell` and `semver` (#124)
- Upgrade `semver`,`@octokit/rest` and `@types/node`
- Upgrade `@types/node`,`cspell` and `lefthook`

## [3.17] - 2025-01-29

**Celebrate Chinese New Year with our festive update!** 🐉✨

May prosperity glow brighter and workflows soar higher! 🎇

**Cheers to innovation, luck, and new beginnings!** 🧧🎉

### Miscellaneous Tasks

- Cleanup Github workflows (#119)
- Add `ubuntu-22.04-arm` runner test (#122)
- Add more debug info while setting up `nushell`
- Add use Nu Modules by setting `NU_LIB_DIRS` constant example to README.md

### Deps

- Upgrade `@vercel/ncc`, `lefthook` and `typescript`
- Upgrade `cspell`, `@octokit/rest` and `@actions/tool-cache`

## [3.16] - 2024-11-13

### Miscellaneous Tasks

- Fix some typos
- Add `cspell` check hook for lefthook (#116)
- Use `hustcer/milestone-action` to set milestone to merged PRs or closed issues automatically (#115)

### Deps

- Upgrade `cspell` and `lefthook` (#117)

## [3.15] - 2024-10-25

### Miscellaneous Tasks

- Add milestone.yaml
- Add more nu release to workflows
- Simplify console output for plugin registering (#113)

### Deps

- Upgrade typescript,@vercel/ncc,biomejs and @typescript-eslint/*
- Upgrade @actions/core to 1.11.1
- Use actions/checkout@v4
- Upgrade typescript and @typescript-eslint/* (#109)
- Use biomejs instead of eslint for code linting (#111)
- Upgrade @biomejs/biome and lefthook

## [3.13] - 2024-09-07

### Features

- Add `aarch64_linux` and `aarch64_windows` runners support

### Deps

- Upgrade @octokit/rest,globby,@biomejs/biome,lefthook, etc.
- Upgrade semver,lefthook,@octokit/rest and @typescript-eslint/*

## [3.12] - 2024-06-27

### Bug Fixes

- Fix release script of pushing release Tags
- Fix plugin register related issue for all platforms
- Fix register of all plugins with `enablePlugins: true` input

### Features

- `enable-plugins` could be set to a comma-separated string of plugin names like `nu_plugin_polars,nu_plugin_query`

### Miscellaneous Tasks

- Remove older Nu versions from test workflow

### Deps

- Upgrade `@biomejs/biome`,`lefthook`, `typescript` and `@typescript-eslint/*`
- Upgrade to `actions/checkout@v4.1.7`

## [3.11] - 2024-05-29

### Bug Fixes

- Remove full feature for nightly tests

### Features

- Make sure major version tag always point to the latest semver tag that has the same major version
- Add warning tip for full builds

### Miscellaneous Tasks

- Remove nightly test of full features

### Deps

- Upgrade @octokit/rest,@biomejs/biome,lefthook,semver and @typescript-eslint/*
- Update to actions/checkout@v4.1.7

## [3.10] - 2024-04-27

### Features

- Add macOS arm64 support

### Deps

- Upgrade globby and @typescript-eslint/*
- Upgrade @types/node,@types/semver,@typescript-eslint/*,eslint and lefthook
- Upgrade lefthook,@biomejs/biome,@octokit/rest,typescript, etc.

## [3.9] - 2024-02-07

### Features

- Add default github-token input support, and `GITHUB_TOKEN` is no longer required anymore to avoid **API rate limit exceeded** error

### Miscellaneous Tasks

- Use `hustcer/setup-nu@v3.9` in workflows

### Deps

- Upgrade node modules @typescript-eslint/*, globby and @biomejs/biome, etc.

## [3.8] - 2023-11-04

### Features

- Add use Nu of full features support
- Add workflow to check full features of Nu nightly

### Miscellaneous Tasks

- Use `hustcer/setup-nu@v3.7` in workflows

### Deps

- Upgrade node modules biome and eslint, etc.

## [3.7] - 2023-10-27

### Features

- Add Nushell `nightly` version support, close #58 (#59)

### Miscellaneous Tasks

- Add use module from absolute path example (#44)
- Add .github/workflows/module-test2.yaml example workflow
- Upgrade some node modules, and use `biome` instead of `rome` for code formatting
- Update README.md and README.zh-CN.md
- Bump actions/checkout from 4.0.0 to 4.1.0 (#48)
- Try to Test Nu v0.86

### Deps

- Upgrade lefthook,eslint, and @typescript-eslint/*
- Upgrade some node deps
- Upgrade eslint, @vercel/ncc, @biomejs/biome and @typescript-eslint*
- Upgrade actions/checkout@v4.1.1 and actions/setup-node@v4.0.0
- Upgrade deps: eslint, lefthook, @octokit/rest, etc.

## [3.6] - 2023-09-12

### Bug Fixes

- Fix config reset for setup-nu action

### Deps

- Upgrade `@actions/core`, `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`

## [3.5] - 2023-09-11

### Features

- Add module test workflow
- Add Nu module usage example
- Use `config reset --without-backup` to Reset Nushell config to default

### Miscellaneous Tasks

- Use `lefthook` instead of `lint-stage` and `husky` for code formatting and linting
- Fix build workflow
- Add new workflow to test latest main
- Update `pnpm` version for build workflow
- Try to upgrade to `node` 20
- Add more nu versions to modules test
- Update module test workflow and README
- Add `just outdated` task to check outdated node modules

### Deps

- Upgrade `rome`, `typescript-eslint/eslint-plugin` and `typescript-eslint/parser`
- Upgrade `globby`, `eslint`, `semver`, and `lefthook`
- Upgrade `eslint`, `lefthook` and `typescript`
- Upgrade `eslint` and `@vercel/ncc`
- Upgrade `actions/checkout` to v4

## [3.3] - 2023-05-18

### Bug Fixes

- Fix release task

### Features

- Try to add dependabot
- Add version specific like `0.80` or `v0.80` support

### Miscellaneous Tasks

- Use `rome` instead of `prettier` to format ts codes
- Try to use `pnpm` instead of `npm`
- Optimize semver comparing algorithm
- Upgrade some node modules

## [3.2] - 2022-12-30

### Bug Fixes

- Fix plugin register for windows

### Miscellaneous Tasks

- Bump to v3.2 to fix plugin register for windows

## [3.1] - 2022-12-30

### Bug Fixes

- Fix some nu scripts

### Features

- Add nu plugin registering support, bump to v3.1

### Miscellaneous Tasks

- Update workflow
- Try nu v0.73
- Update deps: globby, @vercel/ncc and typescript etc.

### Refactor

- Simplify binary filter strategy

## [3] - 2022-11-09

### Features

- Bump version v3.0, add nu v0.71 support

### Miscellaneous Tasks

- Update setup-nu version for README and workflow
- Adapted to nu v0.68 for all tasks
- Update deps add more nu version to run-matrix workflow
- Update workflow

## [2.1] - 2022-09-01

### Bug Fixes

- Fix nushell scripts for nu v0.67+

### Miscellaneous Tasks

- Upgrade node deps: eslint, prettier, typescript, etc. add nu v0.67 to test matrix
- Bump @actions/core from 1.8.2 to 1.9.1 (#9)
- Upgrade some node deps
- Add tests for latest nushell release

## [2.0.0] - 2022-06-15

### Features

- Add README.zh-CN.md, close #3 (#7)
- Add nushell v0.63 to workflow matrix

### Miscellaneous Tasks

- Improve Justfile for some tasks
- Upgrade some node modules
- Update some node deps, try to add nu v0.64 to workflow
- Update README and bump v2

## [1.0.0] - 2022-04-30

### Bug Fixes

- Fix workflows, disable some branches' push event actions

### Features

- Bump version to v1.0
- Add basic workflow examples
- Add just file for all available tasks
- Add cliff.toml for updating CHANGELOG.md
- Add just tasks for setup-nu
- Add build action for pull request
- Add run-test and run-matrix examples
- Add get latest `nu` version support
- Initial commit for `setup-nu`

### Miscellaneous Tasks

- Update readme.md
- Set default version to latest
- Upgrade checkout and setup-node actions to v3

