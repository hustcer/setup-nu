# setup-nu

[![使用测试](https://github.com/hustcer/setup-nu/actions/workflows/run-matrix.yaml/badge.svg)](https://github.com/hustcer/setup-nu/actions/workflows/run-matrix.yaml)

此 GitHub Action 将为您配置 [Nushell](https://github.com/nushell/nushell) 运行环境。

## 使用说明

### 版本选择

1. `setup-nu@v3` 支持 `Nu` **v0.60.0 ~ latest**;
2. `setup-nu@v2` 支持 `Nu` **v0.60.0 ~ 0.70.0**;
3. `setup-nu@v1` 支持 `Nu` **v0.60.0 ~ 0.63.0**;

### 例子

在大多数情况下，你只需要在工作流程中通过 `version` 字段指定要使用的 Nushell 的版本即可。比如下面的例子将会安装 [Nushell](https://github.com/nushell/nushell) 的`v0.78`版本。然后你可以在后续步骤中配置你想运行的命令，最后别忘了设置`shell: nu {0}`以使命令被`nu`执行：

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: 0.78
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

或者你也可以查看下面几个例子：

1. [run-test.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/run-test.yaml)
2. [run-matrix.yaml](https://github.com/hustcer/setup-nu/blob/main/.github/workflows/run-matrix.yaml)
3. 进阶使用: 看看 Nushell 是如何发版的吧 [工作流](https://github.com/nushell/nushell/blob/main/.github/workflows/release.yml), [脚本](https://github.com/nushell/nushell/blob/main/.github/workflows/release-pkg.nu)

如果你想使用最新版本的 Nushell，你可以通过设置 `check-latest` 为 `true` 来做到（它与`version: '*'`配置的效果相同，但更易读）。例如，以下将会安装最新版本的 Nushell：

```yaml
- uses: hustcer/setup-nu@v3
  with:
    check-latest: true
- run: print $'Nu version info:(char nl)'; version
```

**备注**: 在 Nushell 1.0 发布之前，每个版本可能会有较大的变化，所以建议您使用指定的 Nushell 版本。

在极少数情况下，你可能会看到速率限制之类的错误，这是因为这个工作流程必须向 GitHub API 发出请求，以便查询可用的 Nushell 版本。如果发生这种情况，你可以通过设置 `GITHUB_TOKEN` 环境变量来避免该问题：

```yaml
- uses: hustcer/setup-nu@v3
  with:
    version: 0.78
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 输入

| 名称             | 必填     | 描述                                                 | 类型   | 默认值  |
| ---------------- | -------- | ---------------------------------------------------- | ------ | ------- |
| `version`        | 否       | 合法的 NPM 风格的 semver 版本                        | string |   *     |
| `check-latest`   | 否       | 可以设置为 `true` 如果你想使用最新的 Nushell 版本    | bool   | false   |
| `enable-plugins` | 否       | 可以设置为 `true` 如果你需要注册二进制包内的插件     | bool   | false   |

您在 `version` 字段指定的 **semver 版本** 会直接传递给 NPM 的 [semver包](https://www.npmjs.com/package/semver)。此 GitHub Action 将安装最新的匹配版本。

## 许可

Licensed under:

- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
