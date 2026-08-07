export const LEGACY_DATA_OWNER = "joseph";

export function getDataOwner(): string {
  const configured = process.env.JOBCHECKER_USER ?? process.env.user ?? LEGACY_DATA_OWNER;
  const owner = configured.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._@-]{0,63}$/.test(owner)) {
    throw new Error(
      "JOBCHECKER_USER (or user) must contain 1-64 letters, numbers, dots, underscores, @ signs, or hyphens",
    );
  }
  return owner;
}
