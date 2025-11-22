# setup-nu

[中文说明](README.zh-CN.md)

[![Latest Main Check](https://github.com/hustcer/setup-nu/actions/workflows/main-matrix.yaml/badge.svg)](https://github.com/hustcer/setup-nu/actions/workflows/main-matrix.yaml)

This GitHub Action will set up a [Nushell](https://github.com/nushell/nushell) environment for you.

## Usage

### Examples

#### Basic

In most cases, you only need to specify the `version` of Nushell to be used in your workflow.
For instance, the example below installs version `v0.90` of [Nushell](https://github.com/nushell/nushell).
After that, you can define the commands to be executed in subsequent steps. Remember to set `shell: nu {0}` to ensure the commands are run using `nu`:

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: "0.90" # Don't use 0.90 here, as it would be a float number and would be converted to 0.9, you can use v0.90/0.90.0 or '0.90'
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

#### Used as Default Shell

Of course, you can also set the default shell to `nu` by setting the `defaults.run.shell` config:

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
      - uses: actions/checkout@v4
      - uses: hustcer/setup-nu@main
        with:
          version: "*"
      - run: version; print $"(char nl)Dir contents:(char nl)"; ls ($nu.current-exe | path dirname)
      - run: |
          print $'Current env:(char nl)'
          print $env
      - name: You can run bash commands, too
        run: pwd && ls -la
        shell: bash
```

#### Use Nu Modules

To use modules in `Nu`, please refer to the following examples:

1. Use Nu modules by setting `NU_LIB_DIRS` constant:

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.108.0
- name: Use Your Nu Modules by NU_LIB_DIRS Constant
  shell: nu {0}
  run: |
    const NU_LIB_DIRS = [ ${{ github.workspace }}/nu ]
    use module.nu *
    print 'Use module by NU_LIB_DIRS Constant'
    print (get-env-abc 'DEFAULT-FROM-NU-LIB-DIRS-CONSTANT')
```

2. Use Nu modules in `nu -c`

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.108.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Use Your Nu Modules
  shell: nu {0}
  run: |
    nu -c "use nu/module.nu *; print (get-env-abc 'DEFAULT-ABC')"
```

You have to wrap the `nu` code in `nu -c ""`, and the nu version should be equal to or above `0.69`.

3. Use modules from absolute path

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.108.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Use Your Nu Modules by Absolute Path
  shell: nu {0}
  run: |
    use ${{ github.workspace }}/nu/module.nu *
    print 'Use module from: ${{ github.workspace }}/nu/module.nu'
    print (get-env-abc 'DEFAULT-ABC-ABSOLUTE-PATH')
```

Again, the nu version should be equal to or above `0.69`.

They aren't perfect yet, but they do work. By the way, if you discover a better approach, feel free to let me know — PRs are always welcome!

#### Use Nu Nightly Version

`Nushell` is actively being developed. If you'd like to try out the latest features, you can set the version to `nightly`, as shown below:

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: nightly # Will download and setup the latest nightly version of Nushell
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

> **Warning**
> Use the `Nushell` nightly version with caution: The `nu` binary is subject to frequent changes,
> which may disrupt your workflow. Only the latest nightly version will be downloaded and set up,
> and the version requirement is `nightly`.

#### Others

Or, check the following examples:

1. [run-matrix.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/release-matrix.yaml)
2. Advanced example: How Does Nushell Make a Release? [Workflow](https://github.com/nushell/nushell/blob/main/.github/workflows/release.yml), [Script](https://github.com/nushell/nushell/blob/main/.github/workflows/release-pkg.nu)

If you'd like to use the latest version of nushell, you can do so by setting `check-latest` to `true`
(this is functionally identical to using `version: '*'`, but it's more readable). For example, the
following command installs the latest version:

```yaml
- uses: hustcer/setup-nu@v3
  with:
    check-latest: true
- run: print $'Nu version info:(char nl)'; version
```

**Note**: **As Nushell is still evolving toward version `1.0`, significant changes may occur with each release. It is recommended to use a specific version instead.**

### Inputs

| Name             | Type   | Description    |
| ---------------- | ------ | -------------- |
| `version`        | `string` | Optional. A valid NPM-style semver specification, such as `0.86.0`, etc. and `nightly`. Default: `*`        |
| `check-latest`   | `bool`   | Optional. Set to `true` if you want to use the latest version. Default: `false`   |
| `enable-plugins` | `bool | string`  | Optional. Set to `true` if you want to register the bundled plugins or a comma-separated string of plugin names like `nu_plugin_polars,nu_plugin_query`. Nu v0.86 and above is required. Default: `false` |
| `features`       | `string` | Optional. Available choices: `default` or `full`. The `full` features will include the commands from `extra` and `dataframe`. `full` can be used for `Nu` from `v0.86` to `v0.93` and was removed after `v0.93.1`. Default: `default` |
| `github-token`   | `string` | Optional. Your GitHub token or PAT token. Default: `${{ github.token }}`   |

The semver specification is passed directly to NPM's [semver package](https://www.npmjs.com/package/semver).
This GitHub Action will install the latest matching release.

## License

Licensed under:

- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
