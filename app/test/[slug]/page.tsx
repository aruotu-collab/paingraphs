import { notFound } from "next/navigation";
import { HypothesisQuiz } from "@/components/hypothesis-quiz";
import { getPublicHypothesis } from "@/lib/journeys/actions";
import { parseQuestions } from "@/lib/journeys/parse";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicHypothesis(slug);
  if (!data) return { title: "Test not found" };
  return {
    title: data.row.h1,
    description: data.row.problem,
    robots: data.draft
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function TestPainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicHypothesis(slug);
  if (!data) notFound();
  const { row, answers } = data;
  const questions = parseQuestions(row.questions);
  const confirmed = answers.filter((item) => item.hasProblem).length;
  const rate =
    answers.length > 0 ? Math.round((confirmed / answers.length) * 100) : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Unvalidated pain hypothesis · {row.status.replaceAll("_", " ")}
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{row.h1}</h1>
      <p className="mt-5 leading-8 text-muted">{row.problem}</p>
      <p className="mt-4 text-sm leading-6 text-muted">{row.analysis}</p>
      <p className="mt-4 text-sm text-paper">Who this may affect: {row.audience}</p>
      <p className="mt-2 text-sm text-muted">What current products miss: {row.unmetNeed}</p>
      {rate !== null ? (
        <p className="mt-6 text-sm text-copper">
          {answers.length} completed PainGraphs so far. {rate}% said they have
          this problem.
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted">
          PainGraphs is investigating this with a short questionnaire. Your
          answers are the evidence — not an ad claim.
        </p>
      )}
      {data.draft ? (
        <p className="mt-4 border border-dashed border-line px-4 py-3 text-sm text-muted">
          Draft — only you can see this. Publish it from the lab when the
          evidence and recommendation are honest.
        </p>
      ) : null}
      <HypothesisQuiz slug={slug} questions={questions} title={row.title} />
    </main>
  );
}
