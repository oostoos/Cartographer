// @manualReviewRequested: 2026-07-07
import { blockColorStrongVar, blockColorVar } from "../blocks/blockColor";
import "./WorkspaceColorPicker.css";

const PALETTE_SIZE = 6;
const COLOR_KEYS = Array.from({ length: PALETTE_SIZE }, (_, index) => String(index + 1));

type WorkspaceColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

/** A row of color swatches picking one of the design system's fixed block-color palette slots
 * (see app/blocks/blockColor.ts) — the same 6-color palette a block template is indexed into,
 * just user-chosen here instead of assigned by list position. Not built on SetSelection since
 * that control has no way to paint each pill a different color; a swatch grid is a small enough,
 * one-off need that a dedicated control is simpler than extending SetSelection's API for it.
 */
export function WorkspaceColorPicker({ value, onChange }: WorkspaceColorPickerProps) {
  return (
    <div className="cg-workspace-color-picker" role="radiogroup" aria-label="Color">
      {COLOR_KEYS.map((key) => {
        const isSelected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Color ${key}`}
            className={`cg-workspace-color-picker__swatch${
              isSelected ? " cg-workspace-color-picker__swatch--selected" : ""
            }`}
            style={{
              background: blockColorVar(Number(key) - 1),
              borderColor: blockColorStrongVar(Number(key) - 1),
            }}
            onClick={() => onChange(key)}
          />
        );
      })}
    </div>
  );
}
