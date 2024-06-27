# Changelog
All notable changes to this project will be documented in this file.

## [3.12] - 2024-06-27

### Bug Fixes

- Fix release script of pushing release Tags
- Fix plugin add for Nu after v0.93.0

### Miscellaneous Tasks

- Remove older Nu versions from test workflow
- Update README

### Deps

- Upgrade @biomejs/biome,lefthook and @typescript-eslint/*
- Upgrade @biomejs/biome, lefthook, typescript, etc.
- Upgrade actions/checkout@v4.1.7

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

