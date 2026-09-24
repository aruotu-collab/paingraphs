"use server";

import { recordPainMiss } from "./store";

export async function savePainMiss(query: string) {
  return recordPainMiss(query);
}
