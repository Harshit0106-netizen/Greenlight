/** Theme-aware colours for recharts. They resolve through the CSS tokens in globals.css. */
export const chart = {
  brand: "rgb(var(--brand))",
  muted: "rgb(var(--muted))",
  line: "rgb(var(--line))",
  danger: "rgb(var(--danger))",
  warning: "rgb(var(--warning))",
  success: "rgb(var(--success))",
  info: "rgb(var(--info))",
  tooltip: {
    contentStyle: { background: "rgb(var(--surface))", border: "1px solid rgb(var(--line))", borderRadius: 12, fontSize: 12, color: "rgb(var(--ink))", boxShadow: "0 12px 30px -12px rgb(0 0 0 / .25)" },
    labelStyle: { color: "rgb(var(--muted))", marginBottom: 4 },
    itemStyle: { color: "rgb(var(--ink))" }
  }
};
