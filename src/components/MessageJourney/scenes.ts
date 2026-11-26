export type Lang = "zh" | "en";

export type StationId =
  | "user"
  | "adapter"
  | "remote"
  | "queue"
  | "access"
  | "prehook"
  | "command"
  | "wake"
  | "plugin"
  | "send"
  | "after";

type Text = Record<Lang, string>;

export interface Station {
  x: number;
  y: number;
  w: number;
  h: number;
  label: Text;
}

export interface Step {
  id: string;
  durationInFrames: number;
  // 消息包在本步依次经过的站点；首个站点是上一步的终点。
  path: StationId[];
  // 本步回复包走过的路径（只有发送阶段有）。
  reply?: StationId[];
  title: Text;
  detail: Text;
  owner: string;
}

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

const box = (x: number, y: number, label: Text, w = 150, h = 64): Station => ({x, y, w, h, label});

export const STATIONS: Record<StationId, Station> = {
  user: box(16, 250, {zh: "Telegram 用户", en: "Telegram user"}, 224, 220),
  adapter: box(262, 328, {zh: "Adapter 进程", en: "Adapter process"}, 150, 64),
  remote: box(455, 170, {zh: "入站核对", en: "Inbound check"}),
  queue: box(625, 170, {zh: "派发队列", en: "Dispatch queue"}),
  access: box(795, 170, {zh: "会话与权限", en: "Access & roles"}),
  prehook: box(965, 170, {zh: "PreEvent · 多轮", en: "PreEvent · waits"}),
  command: box(965, 330, {zh: "命令匹配", en: "Command match"}),
  wake: box(795, 330, {zh: "唤醒 · 媒体", en: "Wake · media"}),
  send: box(625, 490, {zh: "消息服务", en: "Message service"}),
  after: box(795, 490, {zh: "AfterSend", en: "AfterSend"}),
  plugin: box(1150, 300, {zh: "todo 插件", en: "todo plugin"}, 110, 200),
};

// Core 外框，包住入站核对到 AfterSend 的全部站点。
export const CORE = {x: 435, y: 110, w: 700, h: 470};

export const COMMAND = "/todo add buy milk";
export const REPLY: Text = {zh: "已添加：buy milk", en: "Added: buy milk"};

export const STEPS: Step[] = [
  {
    id: "type",
    durationInFrames: 75,
    path: ["user"],
    title: {zh: "用户发送命令", en: "The user sends a command"},
    detail: {
      zh: "用户在 Telegram 里输入 /todo add buy milk。平台把这条消息推给机器人账号。",
      en: "The user types /todo add buy milk in Telegram. The platform pushes the message to the bot account.",
    },
    owner: "Telegram",
  },
  {
    id: "inbound",
    durationInFrames: 90,
    path: ["user", "adapter", "remote"],
    title: {zh: "Adapter 提交，Core 重建可信字段", en: "Adapter submits, Core rebuilds trusted fields"},
    detail: {
      zh: "Adapter 进程把平台 update 转成 Event，经 wire Session 提交。Core 先核对实例归属并持久化接收游标，再重写事件 ID、来源和平台权限——Adapter 声称的身份不会被直接采信。",
      en: "The Adapter process converts the platform update into an Event and submits it over its wire Session. Core checks instance ownership and persists the receive cursor, then rewrites the event ID, source and platform permissions; nothing the Adapter claims is trusted as-is.",
    },
    owner: "internal/core/adapter/remote",
  },
  {
    id: "queue",
    durationInFrames: 60,
    path: ["remote", "queue"],
    title: {zh: "按预算接纳事件", en: "Admission within budget"},
    detail: {
      zh: "Router 立即按条数、字节和全局预算接纳；不足时返回 queue full，由 Adapter 记一次丢弃。接纳后按 FIFO 交给派发协程，Session 读循环本身从不执行 Handler。",
      en: "The Router admits the event immediately against count, byte and global budgets; when they are exhausted it returns queue full and the Adapter records a drop. Admitted events are handed to dispatch goroutines in FIFO order; the Session read loop never runs Handlers.",
    },
    owner: "internal/core/router",
  },
  {
    id: "access",
    durationInFrames: 60,
    path: ["queue", "access"],
    title: {zh: "会话访问与 Core 权限", en: "Session access and Core roles"},
    detail: {
      zh: "按配置文件的会话访问规则决定这个会话能否触发机器人；再由 Core 计算 user / admin 权限——是否管理员只看 Core 设置，不看平台自报。",
      en: "The profile's session-access rules decide whether this conversation may trigger the bot. Core then computes user/admin roles; admin status comes from Core settings, never from the platform payload.",
    },
    owner: "internal/core/policy · internal/core/profile",
  },
  {
    id: "prehook",
    durationInFrames: 60,
    path: ["access", "prehook"],
    title: {zh: "PreEvent Hook 与多轮等待", en: "PreEvent hooks and pending waits"},
    detail: {
      zh: "PreEvent Hook 可以改写业务载荷或终止分发。插件正在等待用户下一句话（多轮对话）时，匹配的消息在这里被取走，不再进入命令匹配。",
      en: "PreEvent hooks may rewrite the business payload or stop dispatch. If a plugin is waiting for the user's next message (multi-turn), a matching message is taken here and skips command matching.",
    },
    owner: "internal/core/hook · internal/core/continuation",
  },
  {
    id: "command",
    durationInFrames: 70,
    path: ["prehook", "command"],
    title: {zh: "按前缀匹配命令", en: "Prefix and command matching"},
    detail: {
      zh: "用当前会话生效的命令前缀切出 todo add，找到 todo 插件声明的路由，并把 buy milk 绑定为命令参数。",
      en: "Using the prefixes effective for this conversation, Core splits out todo add, finds the route the todo plugin declared and binds buy milk as the command argument.",
    },
    owner: "internal/core/router",
  },
  {
    id: "wake",
    durationInFrames: 95,
    path: ["command", "wake", "plugin"],
    title: {zh: "唤醒插件并签发媒体", en: "Wake the plugin and issue media"},
    detail: {
      zh: "插件在休眠时，Waker 启动进程并等它 ACTIVATED；醒来后复核代次、路由和命令权限，确认没有在等待中被替换。随后为接收方 Session 签发媒体令牌，再调用 Handler。",
      en: "If the plugin is hibernating, the Waker starts its process and waits for ACTIVATED. After waking, Core re-checks the generation, route and command permission so nothing changed during the wait, issues media tokens for the receiving Session and then calls the Handler.",
    },
    owner: "internal/app (ensureActive) · internal/core/idle · internal/core/media",
  },
  {
    id: "send",
    durationInFrames: 95,
    path: ["plugin"],
    reply: ["plugin", "send", "adapter", "user"],
    title: {zh: "c.Reply 经消息服务发出", en: "c.Reply goes through the message service"},
    detail: {
      zh: "插件调用 c.Reply。消息服务先做发送策略检查，再跑 BeforeSend Hook，并在调用平台前为 AfterSend 预留容量；预留失败时不产生任何平台副作用。最后只调用一次 Adapter 发送。",
      en: "The plugin calls c.Reply. The message service checks send policy, runs BeforeSend hooks and reserves AfterSend capacity before touching the platform, so a failed reservation has no platform side effects. The Adapter send then runs exactly once.",
    },
    owner: "internal/core/message",
  },
  {
    id: "after",
    durationInFrames: 85,
    path: ["plugin"],
    title: {zh: "AfterSend 异步观察", en: "AfterSend runs asynchronously"},
    detail: {
      zh: "发送回执立即返回给插件；AfterSend Hook 作为独立任务观察这次发送，慢的观察者不会拖慢回复。",
      en: "The send receipt returns to the plugin immediately. AfterSend hooks observe the send as a separate task, so a slow observer never delays the reply.",
    },
    owner: "internal/core/hook",
  },
];

export const STEP_STARTS = STEPS.reduce<number[]>((starts, step, i) => {
  starts.push(i === 0 ? 0 : starts[i - 1] + STEPS[i - 1].durationInFrames);
  return starts;
}, []);

export const DURATION = STEP_STARTS[STEPS.length - 1] + STEPS[STEPS.length - 1].durationInFrames;

export const stepAt = (frame: number): number => {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (frame >= STEP_STARTS[i]) return i;
  }
  return 0;
};
