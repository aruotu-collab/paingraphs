import { PainBoard } from "@/components/pain-board";
import type {
  PainCriterion,
  PainNarrative,
  RecommendedProduct,
} from "@/lib/paingraph/types";

export function PainStory({
  narrative,
  evidenceCount,
  criteria,
  products,
}: {
  narrative: PainNarrative;
  evidenceCount: number;
  criteria: PainCriterion[];
  products: RecommendedProduct[];
}) {
  return (
    <section className="max-w-3xl">
      <h2 className="font-display text-3xl">What I think is happening</h2>
      {narrative.mechanism ? (
        <p className="mt-4 text-lg leading-8 text-paper">{narrative.mechanism}</p>
      ) : (
        <p className="mt-4 text-lg leading-8 text-paper">{narrative.trap}</p>
      )}
      <PainBoard
        evidenceCount={evidenceCount}
        criteria={criteria}
        products={products}
        proof={narrative.trap}
      />
    </section>
  );
}
