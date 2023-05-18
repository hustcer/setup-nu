# Changelog
All notable changes to this project will be documented in this file.

## [3.3] - 2023-05-18

### Bug Fixes

- Fix dependabot.yaml conf, move it to .github/ (#15)
- Use npm instead of pnpm in build workflow
- Fix release task

### Features

- Try to add dependabot
- Add nu v0.75 for test (#14)
- Add an example to use nu modules
- Add version specific like `0.80` or `v0.80` support

### Miscellaneous Tasks

- Improve plugin register script
- Use rome instead of prettier to format ts codes
- Update some node deps
- Bump @typescript-eslint/eslint-plugin (#16)
- Bump eslint from 8.31.0 to 8.33.0 (#17)
- Bump @typescript-eslint/parser from 5.48.0 to 5.50.0 (#18)
- Upgrade typescript,@vercel/ncc,@octokit/rest (#19)
- Bump @typescript-eslint/parser from 5.50.0 to 5.51.0 (#20)
- Bump @typescript-eslint/eslint-plugin (#21)
- Bump eslint from 8.33.0 to 8.34.0 (#23)
- Bump @typescript-eslint/eslint-plugin (#22)
- Bump @types/node from 18.11.18 to 18.13.0 (#25)
- Bump @typescript-eslint/parser from 5.51.0 to 5.52.0 (#24)
- Bump @typescript-eslint/parser from 5.52.0 to 5.53.0 (#27)
- Bump @typescript-eslint/eslint-plugin (#28)
- Bump @types/node from 18.13.0 to 18.14.0 (#26)
- Update node modules: eslint and related
- Update node deps
- Add v0.77.1 to test matrix and prepare for nushell v0.78
- Try to use pnpm instead of npm
- Update node modeuls: rome, typescript and eslint etc.
- Fomat json by rome
- Try to add nushell v0.78
- Optimize semver comparing algorithm
- Upgrade some node modules
- Fix workflows
- Upgrade some node modules
- Add nu v0.80 to test workflows

### Deps

- Update node modules: typescript and eslint etc.
- Upgrade some node dependencies

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

