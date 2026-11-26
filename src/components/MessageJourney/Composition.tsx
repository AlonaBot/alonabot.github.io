import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {
  COMMAND,
  CORE,
  HEIGHT,
  REPLY,
  STATIONS,
  STEP_STARTS,
  STEPS,
  WIDTH,
  stepAt,
  type Lang,
  type StationId,
} from "./scenes";

// 颜色全部取站点主题变量，Player 与文档同在一个页面，明暗主题自动跟随。
const C = {
  text: "var(--ifm-font-color-base)",
  muted: "var(--ifm-color-emphasis-600)",
  boxFill: "var(--ifm-color-emphasis-100)",
  boxStroke: "var(--ifm-color-emphasis-300)",
  primary: "var(--ifm-color-primary)",
  activeFill: "color-mix(in srgb, var(--ifm-color-primary) 16%, var(--ifm-background-color))",
  reply: "var(--ifm-color-success)",
  coreFill: "color-mix(in srgb, var(--ifm-color-primary) 5%, var(--ifm-background-color))",
};

const center = (id: StationId) => {
  const s = STATIONS[id];
  return {x: s.x + s.w / 2, y: s.y + s.h / 2};
};

// 沿站点序列插值，progress 取 0..1。
const along = (path: StationId[], progress: number) => {
  if (path.length === 1) return center(path[0]);
  const t = progress * (path.length - 1);
  const i = Math.min(Math.floor(t), path.length - 2);
  const a = center(path[i]);
  const b = center(path[i + 1]);
  const k = t - i;
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
};

const travel = (local: number, duration: number) =>
  interpolate(local, [0, duration * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

const Box: React.FC<{id: StationId; lang: Lang; active: boolean}> = ({id, lang, active}) => {
  const s = STATIONS[id];
  return (
    <g>
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={12}
        fill={active ? C.activeFill : C.boxFill}
        stroke={active ? C.primary : C.boxStroke}
        strokeWidth={active ? 3 : 1.5}
      />
      <text
        x={s.x + s.w / 2}
        y={id === "user" || id === "plugin" ? s.y + 26 : s.y + s.h / 2 + 7}
        textAnchor="middle"
        fontSize={19}
        fontWeight={active ? 700 : 500}
        fill={C.text}
      >
        {s.label[lang]}
      </text>
    </g>
  );
};

const Bubble: React.FC<{x: number; y: number; text: string; mine: boolean; opacity?: number}> = ({x, y, text, mine, opacity = 1}) => {
  // SVG 文本无法在渲染前测量，按全角/半角估算宽度。
  const w = Math.max(40, Array.from(text).reduce((sum, ch) => sum + (ch.charCodeAt(0) > 0x2e80 ? 16 : 9), 0) + 20);
  const left = mine ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y} width={w} height={34} rx={10} fill={mine ? C.primary : C.boxStroke} />
      <text x={left + 10} y={y + 23} fontSize={15} style={{fontFamily: "var(--ifm-font-family-monospace)"}} fill={mine ? "#fff" : C.text}>
        {text}
      </text>
    </g>
  );
};

export const MessageJourneyComposition: React.FC<{lang: Lang}> = ({lang}) => {
  const frame = useCurrentFrame();
  const index = stepAt(frame);
  const step = STEPS[index];
  const local = frame - STEP_STARTS[index];
  const p = travel(local, step.durationInFrames);
  const id = (name: string) => STEPS.findIndex((s) => s.id === name);
  const sendIndex = id("send");
  const wakeIndex = id("wake");

  // 1. 打字效果：首步按帧截取命令字符串。
  const typed = COMMAND.slice(
    0,
    Math.round(interpolate(frame, [8, 60], [0, COMMAND.length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})),
  );

  // 2. 请求包：发送阶段起已交给插件，不再显示。
  const request = index >= 1 && index < sendIndex ? along(step.path, p) : null;

  // 3. 回复包：发送阶段沿 reply 路径回到用户。
  const replyPath = STEPS[sendIndex].reply!;
  const replyProgress = index === sendIndex ? p : index > sendIndex ? 1 : 0;
  const replyPos = index === sendIndex && p < 1 ? along(replyPath, p) : null;
  const replied = replyProgress >= 1;

  // 4. 插件状态：唤醒阶段前半启动，到达后运行。
  const pluginState =
    index < wakeIndex ? {zh: "休眠", en: "asleep"} : index === wakeIndex && p < 1 ? {zh: "启动中…", en: "starting…"} : {zh: "运行中", en: "running"};

  const activeStation: StationId =
    index === sendIndex ? (replyPos ? replyPath[Math.min(Math.floor(p * (replyPath.length - 1)), replyPath.length - 1)] : "user") : index === id("after") ? "after" : step.path[step.path.length - 1];

  const user = STATIONS.user;
  const plugin = STATIONS.plugin;
  const titleOpacity = interpolate(local, [0, 10], [0, 1], {extrapolateRight: "clamp"});

  // 5. AfterSend：回执已回到用户后，独立的观察任务从消息服务流向 AfterSend。
  const afterLocal = index === id("after") ? local : -1;
  const afterDot =
    afterLocal >= 0
      ? along(["send", "after"], interpolate(afterLocal, [0, 40], [0, 1], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)}))
      : null;

  return (
    <AbsoluteFill style={{background: "var(--ifm-background-color)"}}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%" style={{fontFamily: "var(--ifm-font-family-base)"}}>
        <text x={40} y={60} fontSize={30} fontWeight={700} fill={C.text} opacity={titleOpacity}>
          {`${index + 1}. ${step.title[lang]}`}
        </text>
        <text x={40} y={92} fontSize={17} fill={C.muted} style={{fontFamily: "var(--ifm-font-family-monospace)"}} opacity={titleOpacity}>
          {step.owner}
        </text>

        <rect x={CORE.x} y={CORE.y} width={CORE.w} height={CORE.h} rx={20} fill={C.coreFill} stroke={C.primary} strokeDasharray="6 6" strokeWidth={1.5} />
        <text x={CORE.x + 18} y={CORE.y + 32} fontSize={20} fontWeight={700} fill={C.primary}>
          Core
        </text>

        {(Object.keys(STATIONS) as StationId[]).map((s) => (
          <Box key={s} id={s} lang={lang} active={s === activeStation} />
        ))}

        <Bubble x={user.x + user.w - 12} y={user.y + 50} text={typed} mine opacity={typed ? 1 : 0} />
        <Bubble x={user.x + 12} y={user.y + 100} text={REPLY[lang]} mine={false} opacity={replied ? 1 : 0} />

        <text x={plugin.x + plugin.w / 2} y={plugin.y + 110} textAnchor="middle" fontSize={17} fill={index < wakeIndex ? C.muted : C.primary} fontWeight={600}>
          {pluginState[lang]}
        </text>
        {index < wakeIndex ? (
          <text x={plugin.x + plugin.w / 2} y={plugin.y + 150} textAnchor="middle" fontSize={26} fill={C.muted}>
            z z
          </text>
        ) : null}

        {index === id("command") ? (
          <g opacity={interpolate(local, [10, 30], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} style={{fontFamily: "var(--ifm-font-family-monospace)"}} fontSize={17}>
            <text x={STATIONS.command.x} y={STATIONS.command.y + 95} fill={C.muted}>
              /
            </text>
            <text x={STATIONS.command.x + 14} y={STATIONS.command.y + 95} fill={C.primary} fontWeight={700}>
              todo add
            </text>
            <text x={STATIONS.command.x + 104} y={STATIONS.command.y + 95} fill={C.reply}>
              buy milk
            </text>
          </g>
        ) : null}

        {request ? <circle cx={request.x} cy={request.y} r={13} fill={C.primary} /> : null}
        {replyPos ? <circle cx={replyPos.x} cy={replyPos.y} r={13} fill={C.reply} /> : null}
        {afterDot ? <circle cx={afterDot.x} cy={afterDot.y} r={10} fill="none" stroke={C.reply} strokeWidth={3} strokeDasharray="4 3" /> : null}
      </svg>
    </AbsoluteFill>
  );
};
