"use client";
import { workspace } from "@/config/site";
import { getSessionUser } from "@/lib/session";
import { createPersistentStore } from "@/lib/persistent-store";

export type Settings = { workspaceName: string; displayName: string; email: string; notifications: boolean; weeklyDigest: boolean };
const initial = (): Settings => ({ workspaceName: workspace.name, displayName: getSessionUser()?.name ?? "", email: "", notifications: true, weeklyDigest: false });

export const settingsStore = createPersistentStore<Settings>("greenlight-settings-v1", initial, initial());
export const useSettings = () => settingsStore.use();
