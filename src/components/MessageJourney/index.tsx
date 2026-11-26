import React, {useEffect, useRef, useState} from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import {Player, type PlayerRef} from "@remotion/player";
import {MessageJourneyComposition} from "./Composition";
import {DURATION, FPS, HEIGHT, STEP_STARTS, STEPS, WIDTH, stepAt, type Lang} from "./scenes";
import styles from "./styles.module.css";

const LABEL: Record<Lang, string> = {zh: "一条消息经过 Core 的动画演示", en: "Animated walkthrough of a message passing through Core"};

const JourneyPlayer: React.FC<{lang: Lang; playerRef: React.RefObject<PlayerRef | null>}> = ({lang, playerRef}) => (
  <Player
    ref={playerRef}
    component={MessageJourneyComposition}
    inputProps={{lang}}
    durationInFrames={DURATION}
    fps={FPS}
    compositionWidth={WIDTH}
    compositionHeight={HEIGHT}
    controls
    showVolumeControls={false}
    clickToPlay
    moveToBeginningWhenEnded={false}
    acknowledgeRemotionLicense
    className={styles.player}
    style={{width: "100%", aspectRatio: `${WIDTH} / ${HEIGHT}`}}
  />
);

export default function MessageJourney(): React.JSX.Element {
  const {i18n} = useDocusaurusContext();
  const lang: Lang = i18n.currentLocale === "en" ? "en" : "zh";
  const playerRef = useRef<PlayerRef | null>(null);
  const [current, setCurrent] = useState(0);

  // Player 只在浏览器挂载，挂载后再订阅帧事件以同步右侧步骤高亮。
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const update = ({detail}: {detail: {frame: number}}) => setCurrent(stepAt(detail.frame));
    player.addEventListener("frameupdate", update);
    return () => player.removeEventListener("frameupdate", update);
  }, [mounted]);

  const jump = (i: number) => {
    setCurrent(i);
    playerRef.current?.seekTo(STEP_STARTS[i]);
    playerRef.current?.play();
  };

  return (
    <figure className={styles.journey} aria-label={LABEL[lang]}>
      <div className={styles.stage}>
        <BrowserOnly fallback={<div className={styles.placeholder} />}>
          {() => (
            <MountSignal onMount={() => setMounted(true)}>
              <JourneyPlayer lang={lang} playerRef={playerRef} />
            </MountSignal>
          )}
        </BrowserOnly>
      </div>
      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li key={step.id} className={i === current ? styles.active : undefined} aria-current={i === current ? "step" : undefined}>
            <button type="button" onClick={() => jump(i)}>
              <span className={styles.title}>{step.title[lang]}</span>
              <code className={styles.owner}>{step.owner}</code>
            </button>
            <p>{step.detail[lang]}</p>
          </li>
        ))}
      </ol>
    </figure>
  );
}

const MountSignal: React.FC<{onMount: () => void; children: React.ReactNode}> = ({onMount, children}) => {
  useEffect(onMount, [onMount]);
  return <>{children}</>;
};
