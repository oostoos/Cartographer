import "./color-swatch-picker.css";

export interface IColorSwatchPickerProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  "aria-label": string;
}

/** A row of clickable color swatches; the one matching value is marked selected. The colors
 * themselves are caller-supplied data, not design tokens. */
export function ColorSwatchPicker({ colors, value, onChange, "aria-label": ariaLabel }: IColorSwatchPickerProps) {
  return (
    <div className="color-swatch-picker" role="group" aria-label={ariaLabel}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className="color-swatch-picker__swatch"
          style={{ backgroundColor: color }}
          data-selected={color === value}
          aria-label={`${ariaLabel}: ${color}`}
          aria-pressed={color === value}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
