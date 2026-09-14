"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ConsultReply } from "@/components/consult-reply";
import {
  consultClose,
  consultTurns,
  spokenAsk,
  versionLabels,
  type ConsultTurn,
} from "@/lib/paingraph/consult";
import type { DiagnosticOption, DiagnosticQuestion } from "@/lib/paingraph/types";

export function PainConsult({
  opening,
  questions,
  answers,
  trap,
  skipped,
  onChoose,
  onUndo,
  onRevisit,
  onSkip,
  onResume,
}: {
  opening: string;
  questions: DiagnosticQuestion[];
  answers: Record<string, string>;
  trap: string | null;
  skipped: boolean;
  onChoose: (question: DiagnosticQuestion, option: DiagnosticOption) => void;
  onUndo: () => void;
  onRevisit: (question: DiagnosticQuestion) => void;
  onSkip: () => void;
  onResume: () => void;
}) {
  const turns = consultTurns(questions, answers);
  const current = skipped ? null : questions[turns.length] ?? null;
  const previous = turns[turns.length - 1] ?? null;
  const done = !skipped && questions.length > 0 && turns.length === questions.length;
  const ask = current ? spokenAsk(current, previous) : null;
  const closeLine = done ? consultClose(turns, trap) : null;
  const liveRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLLIElement>(null);
  const lastHear = previous?.option.hear?.trim() || null;
  const stopScroll = useRef<(() => void) | null>(null);
  const turnCount = useRef(0);
  const step = current ? turns.length + 1 : questions.length;

  useLayoutEffect(() => {
    if (turns.length === 0 && !done && !skipped) {
      turnCount.current = 0;
      return;
    }
    const live = liveRef.current;
    const reel = reelRef.current;
    if (!live || !reel) return;
    const back = turns.length < turnCount.current;
    turnCount.current = turns.length;
    stopScroll.current?.();
    stopScroll.current = glideThread(reel, live, back ? "down" : "up");
    return () => stopScroll.current?.();
  }, [turns.length, done, skipped]);

  if (questions.length === 0) return null;

  return (
    <section id="consult" className="consult-stage max-w-2xl">
      <div ref={reelRef} className="space-y-8 will-change-transform">
        <Line speaker="PainGraph">{opening}</Line>

        {turns.length > 0 ? (
          <ol className="border-y border-line">
            {turns.map((turn, index) => (
              <li
                key={turn.question.id}
                ref={index === turns.length - 1 ? recapRef : undefined}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-3 last:border-b-0"
              >
                <p className="text-sm text-muted">
                  {spokenAsk(turn.question, turns[index - 1] ?? null)}
                </p>
                <button
                  type="button"
                  onClick={() => onRevisit(turn.question)}
                  className="text-sm text-paper hover:text-copper"
                  aria-label={`Change answer: ${turn.option.label}`}
                >
                  {turn.option.label}
                  <span className="ml-2 text-xs text-muted">Change</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}

        {skipped ? (
          <Line speaker="PainGraph">
            You skipped the rest. I can still show what usually helps,
            but it will not be tuned to you.{" "}
            <button
              type="button"
              onClick={onResume}
              className="text-copper hover:text-copper-2"
            >
              Keep going
            </button>
          </Line>
        ) : null}

        <div id="consult-now" ref={liveRef} className="scroll-mt-32">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-copper">
            {done ? "Your spec" : `Question ${step} of ${questions.length}`}
          </p>
          <div
            key={current?.id ?? (done ? "done" : "idle")}
            className="consult-now space-y-7 border-l-2 border-copper pl-4 sm:pl-5"
          >
          {lastHear && (current || done) ? (
            <Line speaker="PainGraph">{lastHear}</Line>
          ) : null}

          {current && ask ? (
            <>
              <Line speaker="PainGraph">{ask}</Line>
              <Line speaker="You">
                <ConsultReply key={current.id} question={current} onChoose={onChoose} />
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  {turns.length > 0 ? (
                    <button
                      type="button"
                      onClick={onUndo}
                      className="text-muted hover:text-copper"
                    >
                      Go back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onSkip}
                    className="text-muted hover:text-copper"
                  >
                    Skip — just show what usually helps
                  </button>
                </p>
              </Line>
            </>
          ) : null}

          {closeLine ? (
            <>
              <Line speaker="PainGraph">{closeLine}</Line>
              <Line speaker="PainGraph">
                Change any answer if I got it wrong. Then the spec below is
                yours, not a generic list.
              </Line>
            </>
          ) : null}
          </div>
        </div>
      </div>

      {questions.length > 2 ? (
        <CaseFile
          questions={questions}
          turns={turns}
          current={current}
          onRevisit={onRevisit}
        />
      ) : null}
    </section>
  );
}

function CaseFile({
  questions,
  turns,
  current,
  onRevisit,
}: {
  questions: DiagnosticQuestion[];
  turns: ConsultTurn[];
  current: DiagnosticQuestion | null;
  onRevisit: (question: DiagnosticQuestion) => void;
}) {
  const filled = new Map(turns.map((turn) => [turn.question.id, turn]));
  return (
    <aside className="mt-12 border border-line">
      <p className="border-b border-line px-4 py-3 text-xs uppercase tracking-[0.16em] text-copper">
        Your answers
      </p>
      <ol>
        {questions.map((question, index) => {
          const turn = filled.get(question.id);
          const live = current?.id === question.id;
          const ask = spokenAsk(question, turns[index - 1] ?? null);
          return (
            <li
              key={question.id}
              className={
                live
                  ? "border-b border-line bg-ink-2 px-4 py-4 last:border-b-0"
                  : "border-b border-line px-4 py-4 last:border-b-0"
              }
            >
              <p className="text-sm leading-6 text-paper">{ask}</p>
              {turn ? (
                <button
                  type="button"
                  onClick={() => onRevisit(question)}
                  className="mt-2 text-left text-sm text-copper hover:text-copper-2"
                >
                  {turn.option.label}
                  <span className="ml-2 text-xs text-muted">Change</span>
                </button>
              ) : live ? (
                <button
                  type="button"
                  onClick={() => glideTo(document.getElementById("consult-now"))}
                  className="mt-2 text-sm text-copper hover:text-copper-2"
                >
                  Answer this above
                </button>
              ) : (
                <p className="mt-2 text-xs text-muted">Not asked yet</p>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function Line({
  speaker,
  children,
}: {
  speaker: "PainGraph" | "You";
  children: ReactNode;
}) {
  const you = speaker === "You";
  return (
    <div className="consult-line flex flex-col gap-1 sm:flex-row sm:gap-4">
      <p
        className={
          you
            ? "shrink-0 text-sm text-copper sm:w-[6.75rem] sm:pt-0.5"
            : "shrink-0 text-sm text-muted sm:w-[6.75rem] sm:pt-0.5"
        }
      >
        {speaker}:
      </p>
      <div className="min-w-0 flex-1 text-base leading-7 text-paper">{children}</div>
    </div>
  );
}

export function versionLine(turns: ConsultTurn[]) {
  return versionLabels(turns);
}

function glideThread(
  reel: HTMLElement,
  live: HTMLElement,
  direction: "up" | "down",
) {
  if (typeof window === "undefined") return () => {};
  const header =
    document.querySelector("header")?.getBoundingClientRect().height ?? 56;
  const slot = header + 88;
  const top = live.getBoundingClientRect().top;
  const from = window.scrollY;
  let to = Math.max(
    0,
    Math.min(
      from + top - slot,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  );
  const extra = direction === "down" ? -160 : 160;
  if (direction === "down" && to > from) to = from;
  if (direction === "up" && to < from) to = from;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    reel.style.transform = "";
    window.scrollTo(0, to);
    return () => {};
  }

  reel.style.transition = "none";
  reel.style.transform = `translateY(${extra}px)`;

  const duration = 740;
  const start = performance.now();
  let frame = 0;
  let stopped = false;
  const ease = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t);

  const tick = (now: number) => {
    if (stopped) return;
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    reel.style.transform = `translateY(${extra * (1 - e)}px)`;
    window.scrollTo(0, from + (to - from) * e);
    if (t < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      reel.style.transform = "";
    }
  };
  frame = window.requestAnimationFrame(tick);
  return () => {
    stopped = true;
    window.cancelAnimationFrame(frame);
    reel.style.transform = "";
  };
}

function glideTo(node: HTMLElement | null) {
  if (!node || typeof window === "undefined") return () => {};
  const header =
    document.querySelector("header")?.getBoundingClientRect().height ?? 56;
  const from = window.scrollY;
  const to = Math.max(
    0,
    Math.min(
      from + node.getBoundingClientRect().top - header - 20,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  );
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || Math.abs(to - from) < 2) {
    window.scrollTo(0, to);
    return () => {};
  }

  const duration = 640;
  const start = performance.now();
  let frame = 0;
  let stopped = false;
  const ease = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

  const tick = (now: number) => {
    if (stopped) return;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + (to - from) * ease(t));
    if (t < 1) frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
  return () => {
    stopped = true;
    window.cancelAnimationFrame(frame);
  };
}
