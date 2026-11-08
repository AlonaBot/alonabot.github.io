// 首页的聊天示意：同一个 /ping 插件分别在 Telegram 私聊与 QQ 群（OneBot 11）中的样子。
// 只模仿通用的聊天界面布局与配色，不使用平台的 logo 或图标素材。
import { useState, type ReactNode } from "react";
import clsx from "clsx";

import styles from "./styles.module.css";

type PlatformId = "telegram" | "qq";

const tabs: { id: PlatformId; label: string }[] = [
  { id: "telegram", label: "Telegram" },
  { id: "qq", label: "OneBot 11 · QQ" },
];

// BotAvatar 是机器人头像：圆形，两只眼睛，头顶一圈光环。
function BotAvatar({ size = "md" }: { size?: "sm" | "md" }): ReactNode {
  return (
    <span className={clsx(styles.botAvatar, size === "sm" && styles.botAvatarSm)} aria-hidden="true">
      <span className={styles.halo} />
    </span>
  );
}

// UserAvatar 是对话中的用户头像：取名字首字的纯色圆形。
function UserAvatar({ name, color }: { name: string; color: string }): ReactNode {
  return (
    <span className={styles.userAvatar} style={{ background: color }} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

function Telegram(): ReactNode {
  return (
    <div className={styles.tg}>
      <div className={styles.tgHeader}>
        <BotAvatar />
        <div>
          <div className={styles.tgTitle}>Alona Demo</div>
          <div className={styles.tgSubtitle}>机器人</div>
        </div>
      </div>
      <div className={styles.tgBody}>
        <div className={styles.tgDate}>今天</div>
        <div className={clsx(styles.tgMsg, styles.tgOut, styles.pop)}>
          <span className={styles.tgCommand}>/ping</span>
          <span className={styles.tgMeta}>
            21:09 <span className={styles.tgTicks}>✓✓</span>
          </span>
        </div>
        <div className={clsx(styles.tgMsg, styles.tgIn, styles.pop, styles.later)}>
          pong
          <span className={styles.tgMeta}>21:09</span>
        </div>
      </div>
      <div className={styles.tgInput}>
        <span>消息</span>
        <span className={styles.tgSend} aria-hidden="true" />
      </div>
    </div>
  );
}

function QQ(): ReactNode {
  return (
    <div className={styles.qq}>
      <div className={styles.qqHeader}>
        AlonaBot 测试群<span className={styles.qqCount}>（3）</span>
      </div>
      <div className={styles.qqBody}>
        <div className={styles.qqTime}>21:09</div>
        <div className={clsx(styles.qqRow, styles.pop)}>
          <UserAvatar name="小林" color="#f2b880" />
          <div>
            <div className={styles.qqName}>小林</div>
            <div className={styles.qqBubble}>大家好</div>
          </div>
        </div>
        <div className={clsx(styles.qqRow, styles.qqSelf, styles.pop)}>
          <div className={styles.qqSelfBubble}>/ping</div>
          <UserAvatar name="我" color="#7fbf9a" />
        </div>
        <div className={clsx(styles.qqRow, styles.pop, styles.later)}>
          <BotAvatar size="sm" />
          <div>
            <div className={styles.qqName}>
              Alona<span className={styles.qqTag}>机器人</span>
            </div>
            <div className={styles.qqBubble}>pong</div>
          </div>
        </div>
      </div>
      <div className={styles.qqInput} />
    </div>
  );
}

export default function ChatDemo(): ReactNode {
  const [active, setActive] = useState<PlatformId>("telegram");
  return (
    <div className={styles.frame}>
      <div className={styles.tabs} role="tablist" aria-label="选择平台">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={clsx(styles.tab, t.id === active && styles.tabActive)}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className={styles.note}>示意</span>
      </div>
      <div key={active}>{active === "telegram" ? <Telegram /> : <QQ />}</div>
    </div>
  );
}
