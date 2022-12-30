# Changelog
All notable changes to this project will be documented in this file.

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

