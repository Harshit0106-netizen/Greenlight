/** Error thrown by the API layer (live or mock). `code` is the contract error code, e.g. "forbidden". */
export class ApiError extends Error {
  /** Contract error code, e.g. "forbidden". */
  get code(): string | undefined { return (this.body as { error?: { code?: string } } | undefined)?.error?.code; }
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}
