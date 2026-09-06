import { ProgrammeConfirmForm } from "@/components/programme-confirm-form";
import {
  programmeKindLabel,
  programmeStatusLabel,
} from "@/lib/programmes/labels";
import { effectiveProgrammeStatus } from "@/lib/programmes/store";

export type ProgrammeRow = {
  id: string;
  name: string;
  kind: string;
  status: string;
  ownerStatus?: string | null;
  country: string | null;
  joinUrl: string | null;
  note: string;
};

export function ProgrammeList({
  programmes,
  painId,
  confirmable = false,
}: {
  programmes: ProgrammeRow[];
  painId?: string;
  confirmable?: boolean;
}) {
  if (programmes.length === 0) {
    return (
      <p className="mt-4 text-xs text-muted">
        Manual research needed. No programme has been confirmed for this
        product type yet.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {programmes.map((programme) => {
        const status = effectiveProgrammeStatus(programme);
        return (
          <li key={programme.id} className="border border-line p-3">
            <p className="text-sm text-paper">{programme.name}</p>
            <p className="mt-1 font-mono text-xs text-copper">
              {programmeKindLabel(programme.kind)}
              {programme.country ? ` · ${programme.country}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">
              {programmeStatusLabel(status)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">{programme.note}</p>
            {programme.joinUrl ? (
              <a
                href={programme.joinUrl}
                rel="nofollow"
                className="mt-2 inline-block text-xs uppercase tracking-[0.14em] text-copper hover:text-copper-2"
              >
                Open programme
              </a>
            ) : (
              <p className="mt-2 text-xs text-muted">
                No official join page stored. Do not invent one.
              </p>
            )}
            {confirmable && painId ? (
              <ProgrammeConfirmForm
                programmeId={programme.id}
                painId={painId}
                confirmed={status === "confirmed"}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
