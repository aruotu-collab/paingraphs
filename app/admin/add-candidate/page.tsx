import { CandidateForm } from "@/components/candidate-form";

export const dynamic = "force-dynamic";

export default function AdminAddCandidatePage() {
  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Add a candidate</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Curated or owner-found pains wait here. Ingest never publishes them.
      </p>
      <CandidateForm />
    </main>
  );
}
