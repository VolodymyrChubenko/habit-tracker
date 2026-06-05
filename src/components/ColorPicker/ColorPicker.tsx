import styles from './ColorPicker.module.scss';

const PRESETS = ['#7CB9A8', '#E8A87C', '#9B89D4', '#F06B7E', '#5BA4CF'];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: Props) => (
  <div className={styles.wrap}>
    {PRESETS.map(color => (
      <button
        key={color}
        type="button"
        className={[styles.swatch, value === color ? styles.selected : ''].join(' ')}
        style={{ background: color }}
        onClick={() => onChange(color)}
      />
    ))}
    <div className={styles.custom} style={{ background: PRESETS.includes(value) ? 'transparent' : value }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);
