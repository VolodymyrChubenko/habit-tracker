import { useSettingsStore } from "../../store/settingsStore";
import { useToast } from "../../components/Toast/useToast";
import { Toast } from "../../components/Toast/Toast";
import {
  isPushSupported,
  subscribePush,
  getPushSubscription,
  deleteSubscription,
  getOrCreateDeviceId,
} from "../../utils/pushUtils";
import type { Palette, Theme } from "../../types";
import styles from "./Settings.module.scss";
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  CheckIcon,
  BellIcon,
  InfoIcon,
} from "./icons";

const themeOptions: {
  value: Theme;
  label: string;
  sub?: string;
  iconBg: string;
  Icon: () => React.JSX.Element;
}[] = [
  { value: "light", label: "Світла", iconBg: "var(--color-theme-preview-light)", Icon: SunIcon },
  { value: "dark", label: "Темна", iconBg: "var(--color-theme-preview-dark)", Icon: MoonIcon },
  {
    value: "system",
    label: "Як у системі",
    sub: "Автоматично",
    iconBg:
      "linear-gradient(135deg, var(--color-theme-preview-light) 50%, var(--color-theme-preview-dark) 50%)",
    Icon: MonitorIcon,
  },
];

// Превʼю палітр. bg — з design/palettes.json (<name>.<light|dark>.bg): CSS-змінні знають лише
// активну палітру, тому фон кожної картки задаємо явно, а тему перемикає CSS (див. .palettePreview).
const paletteOptions: {
  value: Palette;
  label: string;
  bg: { light: string; dark: string };
  dots: [string, string, string];
}[] = [
  { value: "default", label: "М'ята", bg: { light: "#FAF7F0", dark: "#1C1A17" }, dots: ["#367565", "#7CB9A8", "#E8A87C"] },
  { value: "matcha", label: "Матча", bg: { light: "#F5F3EA", dark: "#261815" }, dots: ["#261815", "#B3CC10", "#774023"] },
  { value: "crimson", label: "Кармін", bg: { light: "#F2F5F0", dark: "#1A171D" }, dots: ["#A6B8A0", "#8B729C", "#E20942"] },
  { value: "gallery", label: "Галерея", bg: { light: "#F4F1EE", dark: "#121521" }, dots: ["#C34811", "#0B369A", "#D9D1CA"] },
  { value: "frost", label: "Іній", bg: { light: "#EEF2F2", dark: "#151B1F" }, dots: ["#D3DCDB", "#4D6474", "#A3B4BC"] },
  { value: "dune", label: "Дюна", bg: { light: "#FFF7EC", dark: "#240F22" }, dots: ["#240F22", "#AE1203", "#FFDFB6"] },
];

const pushStatus = (pushEnabled: boolean): string => {
  if (!isPushSupported()) return "Не підтримується у цьому браузері";
  if (Notification.permission === "denied") return "Заблоковано в браузері";
  if (pushEnabled && Notification.permission === "granted")
    return "Дозвіл надано";
  return "Вимкнено";
};

export default function SettingsPage() {
  const { theme, setTheme, palette, setPalette, pushEnabled, setPushEnabled } = useSettingsStore();
  const { toast, show } = useToast();

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      if (!isPushSupported()) {
        show({ message: "Сповіщення не підтримуються у цьому браузері" });
        return;
      }
      if (Notification.permission === "denied") {
        show({ message: "Дозвольте сповіщення у налаштуваннях браузера" });
        return;
      }
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          show({ message: "Дозвіл на сповіщення не надано" });
          return;
        }
      }
      try {
        await subscribePush();
      } catch {
        show({ message: "Не вдалося підписатися на сповіщення" });
        return;
      }
      setPushEnabled(true); // usePushSync одразу відправить розклад на сервер
    } else {
      const subscription = await getPushSubscription();
      if (subscription) await subscription.unsubscribe().catch(() => false);
      await deleteSubscription(getOrCreateDeviceId());
      setPushEnabled(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Налаштування</h1>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Нагадування</div>

        <div
          className={styles.row}
          role="switch"
          aria-checked={pushEnabled}
          aria-label="Push-сповіщення"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              void handlePushToggle();
            }
          }}
          onClick={() => void handlePushToggle()}
        >
          <div
            className={styles.icon}
            style={{ background: "var(--color-accent-purple-bg)", border: "1.5px solid var(--color-icon-border)" }}
          >
            <BellIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.rowTitle}>Push-сповіщення</div>
            <div className={styles.rowSub}>{pushStatus(pushEnabled)}</div>
          </div>
          <div
            className={`${styles.toggle} ${pushEnabled ? styles.toggleOn : ""}`}
          >
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </div>
        </div>

        <div className={styles.hintRow}>
          <InfoIcon />
          <span>
            Час і дні тижня налаштовуються окремо в кожному челенджі — при
            створенні або редагуванні.
          </span>
        </div>
      </div>

      <div className={styles.section} role="radiogroup" aria-label="Палітра">
        <div className={styles.sectionLabel}>Палітра</div>
        <div className={styles.paletteGrid}>
          {paletteOptions.map(({ value, label, bg, dots }) => {
            const selected = palette === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Палітра ${label}`}
                className={`${styles.paletteCard} ${selected ? styles.paletteCardSelected : ""}`}
                onClick={() => setPalette(value)}
              >
                <span
                  className={styles.palettePreview}
                  style={{ "--pv-light": bg.light, "--pv-dark": bg.dark } as React.CSSProperties}
                >
                  {dots.map(c => (
                    <span key={c} className={styles.paletteDot} style={{ background: c }} />
                  ))}
                </span>
                <span className={styles.paletteName}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Зовнішній вигляд</div>
        {themeOptions.map(({ value, label, sub, iconBg, Icon }) => (
          <div
            key={value}
            className={styles.row}
            onClick={() => setTheme(value)}
          >
            <div
              className={styles.icon}
              style={{ background: iconBg, border: "1.5px solid var(--color-icon-border)" }}
            >
              <Icon />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.rowTitle}>{label}</div>
              {sub && <div className={styles.rowSub}>{sub}</div>}
            </div>
            <div
              className={styles.check}
              style={{
                background: theme === value ? "var(--color-accent)" : "transparent",
                border: theme === value ? "none" : "2px solid var(--color-checkbox-border)",
              }}
            >
              {theme === value && <CheckIcon />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.row} style={{ cursor: "default" }}>
          <span style={{ flex: 1, fontSize: 15, color: "var(--color-text-secondary)" }}>Версія</span>
          <span className={styles.version}>2.5.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} />}
    </>
  );
}
