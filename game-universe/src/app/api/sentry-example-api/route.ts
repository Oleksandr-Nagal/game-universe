export const dynamic = "force-dynamic";
class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}
export function GET() {
  throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
}