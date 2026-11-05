"use client";
import { createPersistentStore } from "@/lib/persistent-store";
import { seedKit } from "./data";
import type { ApprovedFact, BrandKit, BrandRule, BrandTerm } from "./types";

const EMPTY: BrandKit = { rules: [], facts: [], terms: [] };
const store = createPersistentStore<BrandKit>("greenlight-brand-kit-v3", () => seedKit, EMPTY);

export const useBrandKit = () => store.use();
/** Synchronous read for non-React code (the review engine reads the live kit at analysis time). */
export const getBrandKit = () => { const k = store.read(); return k === EMPTY ? seedKit : k; };
export const resetBrandKit = () => store.reset();

const stamp = () => Date.now().toString().slice(-5);

export const addRule = (r: Pick<BrandRule, "title" | "description" | "source" | "category">) =>
  store.update(k => ({ ...k, rules: [...k.rules, { ...r, id: `BR-${stamp()}`, status: "Active" }] }));
export const addFact = (f: Pick<ApprovedFact, "subject" | "approvedText" | "source">) =>
  store.update(k => ({ ...k, facts: [...k.facts, { ...f, id: `F-${stamp()}`, updatedAt: "Just now" }] }));
export const addTerm = (t: Pick<BrandTerm, "avoid" | "use" | "note">) =>
  store.update(k => ({ ...k, terms: [...k.terms, { ...t, id: `T-${stamp()}` }] }));
export const removeSource = (id: string) =>
  store.update(k => ({ rules: k.rules.filter(x => x.id !== id), facts: k.facts.filter(x => x.id !== id), terms: k.terms.filter(x => x.id !== id) }));
