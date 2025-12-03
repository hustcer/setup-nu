# setup-nu

[![`main`分支测试](https://github.com/hustcer/setup-nu/actions/workflows/main-matrix.yaml/badge.svg)](https://github.com/hustcer/setup-nu/actions/workflows/main-matrix.yaml)

此 GitHub Action 将为您配置 [Nushell](https://github.com/nushell/nushell) 运行环境。

## 使用说明

### 例子

#### 基础使用

在大多数情况下，你只需要在工作流程中通过 `version` 字段指定要使用的 Nushell 的版本即可。比如下面的例子将会安装 [Nushell](https://github.com/nushell/nushell) 的`v0.90`版本。然后你可以在后续步骤中配置你想运行的命令，最后别忘了设置`shell: nu {0}`以使命令被`nu`执行：

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: "0.90" # 不要使用 0.90, 它会被认为是一个浮点数并转换为 0.9, 你可以使用 v0.90/0.90.0 或者 '0.90'(加了引号变成字符串)
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

#### 设为默认 Shell

当然，更简洁的办法是通过设置 `defaults.run.shell` 来让您的脚本或者命令默认由 `nu` 来执行，如下：

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
      - uses: actions/checkout@v6
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

#### 使用模块

若想在 `Nu` 中使用模块, 可以参考如下示例：

1. 通过设置 `NU_LIB_DIRS` 常量使用 Nu 模块:

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.109.1
- name: Use Your Nu Modules by NU_LIB_DIRS Constant
  shell: nu {0}
  run: |
    const NU_LIB_DIRS = [ ${{ github.workspace }}/nu ]
    use module.nu *
    print 'Use module by NU_LIB_DIRS Constant'
    print (get-env-abc 'DEFAULT-FROM-NU-LIB-DIRS-CONSTANT')
```

2. 通过 `nu -c` 使用模块

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.109.1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Use Your Nu Modules
  shell: nu {0}
  run: |
    nu -c "use nu/module.nu *; print (get-env-abc 'DEFAULT-ABC')"
```

你需要将 `nu` 代码包裹在 `nu -c ""` 中并执行, 而且要求你使用的 Nu 版本在 `0.69` 及以上。

3. 通过绝对路径使用模块

```yaml
- name: Setup nu
  uses: hustcer/setup-nu@v3
  with:
    version: 0.109.1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- name: Use Your Nu Modules by Absolute Path
  shell: nu {0}
  run: |
    use ${{ github.workspace }}/nu/module.nu *
    print 'Use module from: ${{ github.workspace }}/nu/module.nu'
    print (get-env-abc 'DEFAULT-ABC-ABSOLUTE-PATH')
```

同样，要求你使用的 Nu 版本在 `0.69` 及以上。

这些方式并不完美, 不过确实可用，如果你有更好的办法（我相信一定有的）请告诉我，或者如果能提个 PR 就更好啦！

#### 使用 Nu 最新的 `nightly` 版本

`Nushell` 目前正处于活跃开发期，如果你想使用最新的特性也可以通过将版本设置为 `nightly` 获得，比如下面的例子：

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
> 请谨慎使用 `Nushell` `nightly` 版本: nu 的二进制文件每天都可能发生变化，可能会导致你的工作流无法正常工作。
> 而且只有最新的 `nightly` 版本会被下载并配置好, 同时它的版本只能被指定为 `nightly` 而不能是其它值。

#### 其它

或者你也可以查看下面几个例子：

1. [run-matrix.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/release-matrix.yaml)
2. 进阶使用: 看看 Nushell 是如何发版的吧 [工作流](https://github.com/nushell/nushell/blob/main/.github/workflows/release.yml), [脚本](https://github.com/nushell/nushell/blob/main/.github/workflows/release-pkg.nu)

如果你想使用最新版本的 Nushell，你可以通过设置 `check-latest` 为 `true` 来做到（它与`version: '*'`配置的效果相同，但更易读）。例如，以下将会安装最新版本的 Nushell：

```yaml
- uses: hustcer/setup-nu@v3
  with:
    check-latest: true
- run: print $'Nu version info:(char nl)'; version
```

**备注**: **_在 Nushell 1.0 发布之前，每个版本可能会有较大的变化，所以建议您使用指定的 Nushell 版本_**。

### 输入

| 名称              | 类型     |                    描述                   |
| ---------------- | -------- | -------------------------------------------------------------- |
| `version`        | `string` | 可选, 合法的 NPM 风格的 Semver 版本，比如 `0.86.0` 也可以为`nightly`. 默认 `*` |
| `check-latest`   | `bool`   | 可选, 可以设置为 `true` 如果你想使用最新的 Nushell 版本, 默认 `false` |
| `enable-plugins` | `bool\|string`   | 可选, 可以设置为 `true` 如果你需要注册二进制包内的插件或者逗号分隔的插件名称字符串：`nu_plugin_polars,nu_plugin_query`, 需要 Nu 版本 >= v0.86, 默认 `false` |
| `features`       | `string` | 可选, 可选项: `default`/`full`, 设置为 `full` 将包含 `extra` 和 `dataframe` 中的命令, `full` 仅支持 Nu `v0.86` ~ `v0.93`, 之后版本中默认版本将包含所有特性, 默认 `default` |
| `github-token`   | `string` | 可选, 你的 GitHub Token 或者 PAT Token, 默认为 `${{ github.token }}`  |

您在 `version` 字段指定的 **semver 版本** 会直接传递给 NPM 的 [semver 包](https://www.npmjs.com/package/semver)。此 GitHub Action 将安装最新的匹配版本。

## 许可

Licensed under:

- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
