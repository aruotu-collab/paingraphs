import { extractOpenAICandidates } from "@/lib/discovery/actions";

export function OpenAIExtractButton({ configured }: { configured: boolean }) {
  return (
    <form action={extractOpenAICandidates}>
      <button
        type="submit"
        disabled={!configured}
        className="border border-copper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
      >
        Extract with OpenAI
      </button>
    </form>
  );
}
