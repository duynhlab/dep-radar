import { createIsomorphicFn } from "@tanstack/react-start";
import { PrRecordSchema, type PrRecord } from "../domain/types.ts";

// Per-PR records carry the Renovate release notes (tens of KB each). They are
// served as STATIC ASSETS and must never enter the worker bundle.
//
// No fs path here on purpose: the prerender pass runs in workerd, not Node,
// where `node:fs` throws. One HTTP mechanism covers every context —
//   prerender  -> fetch from the prerender server's own origin
//   client nav -> relative fetch, straight to the asset CDN
//   worker SSR -> resolves against Workers Assets
//
// Any @tanstack/react-start/server import must stay behind createIsomorphicFn's
// server branch, or Start's import-protection plugin fails the build.

const BASE = "/pr-data";

export type RecordResult = { status: "ok"; record: PrRecord } | { status: "unavailable" };

const UNAVAILABLE: RecordResult = { status: "unavailable" };

export async function parseRecordResponse(res: Response): Promise<RecordResult> {
  if (!res.ok) return UNAVAILABLE;
  return { status: "ok", record: PrRecordSchema.parse(await res.json()) };
}

const fetchRecord = createIsomorphicFn()
  .server(async (number: number): Promise<RecordResult> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const origin = new URL(getRequest().url).origin;
      return await parseRecordResponse(await fetch(`${origin}${BASE}/${number}.json`));
    } catch {
      return UNAVAILABLE;
    }
  })
  .client(async (number: number): Promise<RecordResult> => {
    try {
      return await parseRecordResponse(await fetch(`${BASE}/${number}.json`));
    } catch {
      return UNAVAILABLE;
    }
  });

export async function loadPrRecord(number: number): Promise<RecordResult> {
  if (!Number.isInteger(number) || number < 1) return UNAVAILABLE;
  return fetchRecord(number);
}
