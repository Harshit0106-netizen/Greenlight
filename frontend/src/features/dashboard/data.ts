/** Illustrative analytics for the demo workspace. Replace with API data when the backend ships. */
const BASE = Date.UTC(2026, 9, 6); // Oct 6, 2026 → 30-day window ending Nov 4
const label = (i: number) => new Date(BASE + i * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const current = [34, 48, 42, 61, 54, 72, 65, 82, 59, 76, 88, 69, 94, 72, 84, 63, 78, 96, 74, 87, 68, 92, 80, 100, 76, 88, 69, 84, 90, 97];
export const activitySeries = current.map((v, i) => ({ day: label(i), current: v, previous: Math.round(v * 0.78 + (i % 5) * 3) }));

export const sampleKpis = { completed: 128, approved: 94, approvalRate: 73, brandScore: 86, totalChecks: 1284 };
