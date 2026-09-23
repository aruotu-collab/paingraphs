"use client";

export function PainSlider({
  label,
  value,
  min = 0,
  max = 10,
  color = "#2fbf6a",
  valueText,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  color?: string;
  valueText: string;
  onChange: (value: number) => void;
}) {
  const span = Math.max(max - min, 1);
  const percent = ((value - min) / span) * 100;

  function commit(raw: string) {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    onChange(Math.max(min, Math.min(max, Math.round(next))));
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      className="pain-range"
      style={{ color, ["--pain-fill" as string]: `${percent}%` }}
      onInput={(event) => commit(event.currentTarget.value)}
      onChange={(event) => commit(event.currentTarget.value)}
    />
  );
}
