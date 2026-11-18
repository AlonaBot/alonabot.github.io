---
sidebar_position: 2
title: 组件生命周期
description: 组件进程从启动到停止经过的状态，以及 SDK 提供的 Hook。
---

已安装插件通常运行在独立进程中；库模式与 plugintest 将组件装配到同一进程。Core 启动它、完成握手与注册校验、原子提交代次后才让它接收业务；停用、更新或重载配置时先排空再停止。

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
| Suspended | 进程已退出，保留已启用组件的快照 | 命令/事件、Service 或 HTTP 按需唤醒原代次 |

普通异常退出采用有限重启：**5 分钟内退出 3 次**就自动禁用。正常停用不会自动重启。

## 显式回调

在 `New()` 中调用 `registerLifecycle(p)`，导入 `sdk`、标准库 `context` 和 `log/slog`：

```go
func registerLifecycle(p *sdk.Plugin) {
    p.OnStart(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin preparing")
        return nil
    })
    p.OnReady(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin activating")
        return nil
    })
    p.OnStop(func(ctx context.Context) error {
        slog.InfoContext(ctx, "plugin stopping")
        return nil
    })
}
```

`OnStart` 在配置和数据库准备完成后、REGISTER 前执行。此时打开资源，在 `OnStop` 中关闭插件自己管理的资源；受管数据库连接由 SDK 关闭。`OnReady` 在 ACTIVATE 后、ACTIVATED 前执行。回调登记使用明确的函数签名，每种回调最多登记一次。

业务 Send、Service 和任务操作需要 Session 就绪，放在 Handler、延续或调度回调中；`OnStart`、`OnReady` 只完成准备。SDK 写完 ACTIVATED 后打开就绪门，断链或停止时取消 lifetime。插件自己的 goroutine 响应取消，并在停止阶段结束。

普通 Handler 的 Context 在返回后失效。[后台任务与交互](../plugins/background.md)介绍独立延续和定时工作。`sdk/conversation` 保存 JSON 历史，等待下一条消息使用延续调用中的 `c.Wait`。

## 同代次恢复

已安装 plugin/agent 从 `SUSPENDED` 唤醒时，复用原代次、配置和业务数据库。`RESUME` 跳过 SELF/VERSIONED 数据库迁移回调，继续执行配置加载、补值与校正、required 校验，完整配置须与原快照一致；随后执行 `OnStart`、`OnReady` 并核对注册摘要。冷启动使用请求原有期限，就绪后复核路由与权限再交付。

只有可按重启语义恢复、没有独立后台活动的组件才声明 `sleep_capable: true`。当前已接通按需唤醒；自动空闲退出与即时休眠策略由 S-02.2 接入，Scheduler 到期唤醒由 S-03.1 接入。开发组件、Adapter 与 WebUI 保持常驻。详情见[按需唤醒与验证](https://github.com/AlonaBot/AlonaBot/blob/main/docs/development.md#按需唤醒与验证)。

## 跨代次的独占

SDK 在插件目录持有跨代次的 `runtime.lock`。旧进程还没有释放受管资源时，新进程不能作为第二个写入者启动。

## 延伸阅读

- 规格：[CONTRACTS §4](https://github.com/AlonaBot/AlonaBot/blob/main/spec/CONTRACTS-v0.1.md)、[DESIGN §A](https://github.com/AlonaBot/AlonaBot/blob/main/spec/DESIGN.md)
