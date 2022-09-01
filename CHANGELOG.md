# Changelog
All notable changes to this project will be documented in this file.

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

