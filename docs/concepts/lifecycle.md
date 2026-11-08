---
sidebar_position: 2
title: 生命周期
description: 组件进程从启动到停止经过的状态，以及 SDK 提供的 Hook。
---

每个已安装的插件对应一个子进程。Core 启动它、完成握手与注册校验、原子提交代次后才让它接收业务；停用、更新或重载配置时先排空再停止。

## 状态

| 状态 | 进入条件 | 下一步 |
| --- | --- | --- |
| Stopped | 初始，或停止完成 | 启动进程，HELLO 握手后进入 Preparing |
| Preparing | Core 下发 Bootstrap | 配置准备、数据库迁移、`OnStart`、REGISTER 注册校验；提交前失败回到 Stopped |
| Prepared | 准备全部成功 | 原子提交 ActiveGeneration |
| Activating | 已提交 | `OnReady` 后发送 ACTIVATED；提交后失败进入 Degraded |
| Activated | 收到 ACTIVATED | 正常接收事件与调用 |
| Stopping | 停用、更新或配置重载 | 排空在途请求、`OnStop`、退出 |
| Degraded | 崩溃、失联或提交后失败 | 有限重启当前权威代次 |

普通异常退出采用有限重启：**5 分钟内退出 3 次**就自动禁用。正常停用不会自动重启。

## Hook

根插件嵌入 `sdk.Base`，它为全部 Hook 提供空的默认实现，你只覆盖需要的：

```go
func (p *MyPlugin) OnStart(ctx context.Context) error { return nil } // 打开资源
func (p *MyPlugin) OnReady(ctx context.Context) error { return nil } // 已激活前的最后一步
func (p *MyPlugin) OnStop(ctx context.Context) error  { return nil } // 关闭资源
```

- `OnStart` 与 `OnReady` 不得等待自己的公开路由，也不要发起业务 Send 或 Service 调用。
- 后台工作要等 SDK 的就绪门打开，并服从 lifetime context。SDK 写完 ACTIVATED 后才打开就绪门。
- 与 Core 的主连接断开时，SDK 取消 lifetime、关闭内部 HTTP 并限时退出。

覆盖 Hook 时签名写错，根插件就不再满足 `sdk.Root` 接口，在调用 `sdk.Run` 处编译失败，不会被静默跳过。

## 跨代次的独占

SDK 在插件目录持有跨代次的 `runtime.lock`。旧进程还没有释放受管资源时，新进程不能作为第二个写入者启动。

## 延伸阅读

- 规格：[CONTRACTS §4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md)、[DESIGN §A](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md)
