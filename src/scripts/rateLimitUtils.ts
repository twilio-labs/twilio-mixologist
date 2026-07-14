export function isRateLimited(e: unknown): boolean {
  return typeof e === "object" && e !== null && "status" in e && (e as { status?: number }).status === 429;
}
