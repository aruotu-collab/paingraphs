import { uniqueCountries } from "./codes";

export type GeographyLens = {
  visitors: string[];
  destinations: string[];
  programmes: string[];
  hasDefaultDestination: boolean;
  missingDestinations: string[];
};

export function geographyLens(input: {
  visitCountries?: Array<string | null | undefined>;
  clickCountries?: Array<string | null | undefined>;
  destinationCountries?: Array<string | null | undefined>;
  programmeCountries?: Array<string | null | undefined>;
}): GeographyLens {
  const visitors = uniqueCountries([
    ...(input.visitCountries ?? []),
    ...(input.clickCountries ?? []),
  ]);
  const destinations = uniqueCountries(input.destinationCountries ?? []);
  const programmes = uniqueCountries(input.programmeCountries ?? []);
  const hasDefaultDestination = (input.destinationCountries ?? []).some(
    (value) => (value || "*") === "*",
  );
  const destSet = new Set(destinations);
  return {
    visitors,
    destinations,
    programmes,
    hasDefaultDestination,
    missingDestinations: visitors.filter((code) => !destSet.has(code)),
  };
}
