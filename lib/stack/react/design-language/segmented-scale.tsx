import "./segmented-scale.css";

export interface ISegmentedScaleProps {
  /** Number of clickable segments to render, e.g. 5 for a 1-5 scale. */
  segmentCount: number;
  /** The currently selected level (1-based), or null if unset. */
  value: number | null;
  onChange: (value: number) => void;
  "aria-label": string;
}

/** A volume-style scale of N clickable segments, filled up to the current value. */
export function SegmentedScale({
  segmentCount,
  value,
  onChange,
  "aria-label": ariaLabel,
}: ISegmentedScaleProps) {
  const levels = Array.from({ length: segmentCount }, (_, index) => index + 1);

  return (
    <div className="segmented-scale" role="group" aria-label={ariaLabel}>
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          className="segmented-scale__segment"
          data-filled={value !== null && level <= value}
          aria-label={`${ariaLabel}: level ${level}`}
          aria-pressed={value === level}
          onClick={() => onChange(level)}
        />
      ))}
    </div>
  );
}
