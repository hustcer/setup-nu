# setup-nu

[中文说明](README.zh-CN.md)

[![Test Check](https://github.com/hustcer/setup-nu/actions/workflows/run-matrix.yaml/badge.svg)](https://github.com/hustcer/setup-nu/actions/workflows/run-matrix.yaml)

This GitHub Action will setup a [Nushell](https://github.com/nushell/nushell) environment for you.

## Usage

### Which Version Should I Choose?

1. `setup-nu@v3` supports `Nu` **v0.60.0 ~ latest**;
2. `setup-nu@v2` supports `Nu` **v0.60.0 ~ 0.70.0**;
3. `setup-nu@v1` supports `Nu` **v0.60.0 ~ 0.63.0**;

### Examples

In most cases you just need to specify the `version` of Nushell to be used in your workflow.
For example the following installs the `v0.80` version of [Nushell](https://github.com/nushell/nushell).
Then you can set the command you want to run in the following steps, and don't forget to set `shell: nu {0}`
to make the commands be executed by `nu`:

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: 0.80
- run: print $'Nu version info:(char nl)'; version
  shell: nu {0}
- name: Default shell will be `nu`
  shell: nu {0}
  run: |
    print $'Nu path:(which nu)(char nl)'
    def greeting [name: string] {
        print $'Hello ($name)'
    }
    greeting hustcer
```

Of cause, You can also set the default shell to `nu` by setting the `defaults.run.shell` config:

```yaml
name: basic

on: push
defaults:
  run:
    shell: nu {0}

jobs:
  basic-usage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: hustcer/setup-nu@main
      with:
        version: '*'
    - run: version; $"(char nl)Dir contents:(char nl)"; ls ((which nu).path.0 | path dirname)
    - run: |
        print $'Current env:(char nl)'
        print $env
    - name: You can run bash commands, too
      run: pwd && ls -la
      shell: bash
```

Or, check the following examples:

1. [run-test.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/run-test.yaml)
2. [run-matrix.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/run-matrix.yaml)
3. Advanced example: How Nushell Make a Release? [Workflow](https://github.com/nushell/nushell/blob/main/.github/workflows/release.yml), [Script](https://github.com/nushell/nushell/blob/main/.github/workflows/release-pkg.nu)

If you want to use the latest version of nushell you can specify this by set `check-latest` to
`true`(it's the same as `version: '*'`, but more readable). For example the following installs
the latest version:

```yaml
- uses: hustcer/setup-nu@v3
  with:
    check-latest: true
- run: print $'Nu version info:(char nl)'; version
```

**Note**: Before Nushell reaches 1.0, each version may change a lot, it is recommend
that you use a specified version instead.

In rare circumstances you might get rate limiting errors, this is because this
workflow has to make requests to GitHub API in order to list available releases.
If this happens you can set the `GITHUB_TOKEN` environment variable.

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: 0.80
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Name             | Required | Description                                                 | Type   | Default |
| ---------------- | -------- | ----------------------------------------------------------- | ------ | ------- |
| `version`        | no       | A valid NPM-style semver specification.                     | string |   *     |
| `check-latest`   | no       | Set to `true` if you want to use the latest version         | bool   | false   |
| `enable-plugins` | no       | Set to `true` if you want to register the bundled plugins   | bool   | false   |

The semver specification is passed directly to NPM's [semver package](https://www.npmjs.com/package/semver).
This GitHub Action will install the latest matching release.

## License

Licensed under:

- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
