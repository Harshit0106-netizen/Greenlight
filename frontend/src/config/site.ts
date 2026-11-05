export const site = {
  name: "Greenlight",
  tagline: "Brand governance, made accountable",
  description: "Pre-publication brand governance that makes every content decision explainable."
} as const;

/** Replace with the authenticated session user once the backend is connected. */
export const currentUser = {
  name: "Harshit Verma",
  firstName: "Harshit",
  email: "harshit@acme.example",
  role: "Brand Admin"
} as const;

export const workspace = {
  name: "Acme Corporation",
  slug: "acme",
  brandKit: "Acme Corporation · Brand Kit v3.2",
  kitVersion: "3.2"
} as const;

export const THEME_KEY = "greenlight-theme-v2";
