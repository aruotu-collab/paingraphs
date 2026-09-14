"use client";

import { useMemo, useRef, useState } from "react";
import type { DiagnosticOption, DiagnosticQuestion } from "@/lib/paingraph/types";

export function ConsultReply({
  question,
  onChoose,
}: {
  question: DiagnosticQuestion;
  onChoose: (question: DiagnosticQuestion, option: DiagnosticOption) => void;
}) {
  const control = question.control || "choice";
  if (control === "list") {
    return (
      <div className="space-y-2" role="listbox" aria-label={question.ask || question.prompt}>
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(question, option)}
            className="block w-full border border-line px-4 py-3 text-left text-sm text-muted hover:border-copper hover:text-copper"
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
  if (control === "slider") {
    return <SliderReply question={question} onChoose={onChoose} />;
  }
  if (control === "multi") {
    return <MultiReply question={question} onChoose={onChoose} />;
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={question.ask || question.prompt}>
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChoose(question, option)}
          className="border border-line px-4 py-2 text-sm text-muted hover:border-copper hover:text-copper"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SliderReply({
  question,
  onChoose,
}: {
  question: DiagnosticQuestion;
  onChoose: (question: DiagnosticQuestion, option: DiagnosticOption) => void;
}) {
  const last = Math.max(question.options.length - 1, 0);
  const [index, setIndex] = useState(Math.min(1, last));
  const trackRef = useRef<HTMLDivElement>(null);
  const option = question.options[index] ?? question.options[0];
  if (!option) return null;
  const percent = last === 0 ? 0 : (index / last) * 100;

  function moveTo(clientX: number) {
    const track = trackRef.current;
    if (!track || last === 0) return;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / Math.max(rect.width, 1);
    const next = Math.round(Math.min(1, Math.max(0, ratio)) * last);
    setIndex(next);
  }

  return (
    <div>
      <p className="text-copper">{option.label}</p>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={question.ask || question.prompt}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={option.label}
        className="relative mt-4 h-11 w-full cursor-pointer touch-none select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          moveTo(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          moveTo(event.clientX);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            setIndex((value) => Math.min(last, value + 1));
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            setIndex((value) => Math.max(0, value - 1));
          }
          if (event.key === "Home") {
            event.preventDefault();
            setIndex(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            setIndex(last);
          }
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-line" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 bg-copper"
          style={{ width: `${percent}%` }}
        />
        {question.options.map((_, stop) => (
          <span
            key={stop}
            className="pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted"
            style={{ left: `${last === 0 ? 0 : (stop / last) * 100}%` }}
          />
        ))}
        <span
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper"
          style={{ left: `${percent}%` }}
        />
      </div>
      <p className="mt-2 flex justify-between text-xs text-muted">
        <span>{question.sliderLow || question.options[0]?.label}</span>
        <span>{question.sliderHigh || question.options[last]?.label}</span>
      </p>
      <button
        type="button"
        onClick={() => onChoose(question, option)}
        className="mt-4 border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink"
      >
        That’s right
      </button>
    </div>
  );
}

function MultiReply({
  question,
  onChoose,
}: {
  question: DiagnosticQuestion;
  onChoose: (question: DiagnosticQuestion, option: DiagnosticOption) => void;
}) {
  const noneId =
    question.options.find((item) => /none|nothing/i.test(item.id + item.label))?.id ??
    null;
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(option: DiagnosticOption) {
    setSelected((current) => {
      if (noneId && option.id === noneId) return [noneId];
      const withoutNone = noneId
        ? current.filter((id) => id !== noneId)
        : current;
      if (withoutNone.includes(option.id)) {
        return withoutNone.filter((id) => id !== option.id);
      }
      return [...withoutNone, option.id];
    });
  }

  const picked = useMemo(
    () =>
      selected
        .map((id) => question.options.find((item) => item.id === id))
        .filter((item): item is DiagnosticOption => Boolean(item)),
    [question.options, selected],
  );

  function send() {
    if (picked.length === 0) return;
    const option =
      picked.length === 1
        ? picked[0]
        : {
            ...picked[0],
            id: picked.map((item) => item.id).join(","),
            label: picked.map((item) => item.label).join(", "),
          };
    onChoose(question, option);
  }

  return (
    <div>
      <div className="space-y-2" role="group" aria-label={question.ask || question.prompt}>
        {question.options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option)}
              className={
                on
                  ? "block w-full border border-copper px-4 py-3 text-left text-sm text-copper"
                  : "block w-full border border-line px-4 py-3 text-left text-sm text-muted hover:border-copper hover:text-copper"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={picked.length === 0}
        onClick={send}
        className="mt-4 border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
      >
        Done
      </button>
    </div>
  );
}
