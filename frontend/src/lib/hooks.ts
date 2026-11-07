"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** false during SSR + first hydration pass, true afterwards. Use to tell "loading" from "not found". */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
