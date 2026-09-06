import { setProgrammeConfirmation } from "@/lib/programmes/actions";

export function ProgrammeConfirmForm({
  programmeId,
  painId,
  confirmed,
}: {
  programmeId: string;
  painId: string;
  confirmed: boolean;
}) {
  return (
    <form action={setProgrammeConfirmation} className="mt-2">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="painId" value={painId} />
      <input type="hidden" name="next" value={confirmed ? "" : "confirmed"} />
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
      >
        {confirmed ? "Clear confirmation" : "Mark confirmed"}
      </button>
    </form>
  );
}
