"use client";
import { currentUser, workspace } from "@/config/site";
import { createPersistentStore } from "@/lib/persistent-store";

export type Settings = { workspaceName: string; displayName: string; email: string; notifications: boolean; weeklyDigest: boolean };
const initial = (): Settings => ({ workspaceName: workspace.name, displayName: currentUser.name, email: currentUser.email, notifications: true, weeklyDigest: false });

export const settingsStore = createPersistentStore<Settings>("greenlight-settings-v1", initial, initial());
export const useSettings = () => settingsStore.use();
