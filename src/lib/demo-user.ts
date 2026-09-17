/**
 * The demo account identity (round 9).
 *
 * The login gate checks these credentials client-side (see login-view.tsx —
 * documented demo check, NOT production auth). The GDPR export mirrors the
 * live app, which embeds the signed-in user (`user.email`, `full_name`, a
 * stable id) in the export envelope and the filename — the clone uses this
 * same identity there.
 */

export const DEMO_EMAIL = "sepnetflix2023@outlook.com";
export const DEMO_PASSWORD = "Abcd1234";

/** Live derives the display name from the email prefix (probed: "sepnetflix2023"). */
export const DEMO_FULL_NAME = DEMO_EMAIL.split("@")[0] ?? "Finara User";

/**
 * Stable synthetic id mirroring the live app's 24-hex Mongo-style user id
 * (the clone has no user table — this is a constant, not a credential).
 */
export const DEMO_USER_ID = "6aa7714bd045182458ec2149";
