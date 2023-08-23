# Author: hustcer
# Create: 2022/04/29 18:05:20
# Description:
#   Some helper task for setup-nu
# Ref:
#   1. https://github.com/casey/just
#   2. https://www.nushell.sh/book/

set shell := ['nu', '-c']

# The export setting causes all just variables
# to be exported as environment variables.

set export := true
set dotenv-load := true

# If positional-arguments is true, recipe arguments will be
# passed as positional arguments to commands. For linewise
# recipes, argument $0 will be the name of the recipe.

set positional-arguments := true

# Just commands aliases
alias r := run
alias b := build

# Use `just --evaluate` to show env vars

# Used to handle the path separator issue
SETUP_NU_PATH := parent_directory(justfile())
NU_DIR := parent_directory(`(which nu).path.0`)
_query_plugin := if os_family() == 'windows' { 'nu_plugin_query.exe' } else { 'nu_plugin_query' }

# To pass arguments to a dependency, put the dependency
# in parentheses along with the arguments, just like:
# default: (sh-cmd "main")

# List available commands by default
default:
  @just --list --list-prefix "··· "

# 安装 Node 依赖, 包管理器 pnpm
i:
  pnpm install

# Run lint, fmt and build task all in one time
all: lint fmt build
  @$'(ansi pb)All done!(ansi reset)'

# Format code
fmt:
  @$'(ansi g)Start `fmt` task...(ansi reset)'; \
  $'(ansi p)───────────────────────────────────────(ansi reset)'; \
  pnpx rome format . --write; \
  $'(ansi g)The `fmt` task finished!(ansi reset)(char nl)';

# Code linting
lint:
  @$'(ansi g)Start `lint` task...(ansi reset)'; \
  $'(ansi p)───────────────────────────────────────(ansi reset)'; \
  pnpx eslint src/**/*.ts; \
  $'(ansi g)The `lint` task finished!(ansi reset)(char nl)';

# Build dist/index.js
build:
  @$'(ansi g)Start `build` task...(ansi reset)'; \
  $'(ansi p)───────────────────────────────────────(ansi reset)'; \
  cd {{SETUP_NU_PATH}}; \
  rm -rf dist/*; \
  npx ncc build src/index.ts --minify --no-cache; \
  $'(ansi g)The `build` task finished!(ansi reset)(char nl)';

# Test action locally
run: build
  @$'(ansi g)Start `run` task...(ansi reset)'; \
  cd {{SETUP_NU_PATH}}; \
  let-env RUNNER_TEMP = './runner/temp'; \
  let-env RUNNER_TOOL_CACHE = './runner/cache'; \
  node dist/index.js

# 检查过期依赖, 需全局安装 `npm-check-updates`
outdated:
  ncu

# Release a new version for `setup-nu`
release updateLog=('false'):
  @overlay use {{ join(SETUP_NU_PATH, 'nu', 'common.nu') }}; \
    overlay use {{ join(SETUP_NU_PATH, 'nu', 'release.nu') }}; \
    git-check --check-repo=1 {{SETUP_NU_PATH}}; \
    make-release --update-log={{updateLog}}

# Plugins need to be registered only once after nu v0.61
_setup:
  @register -e json {{ join(NU_DIR, _query_plugin) }}
