/** Application rejection mapped to HTTP only at the transport boundary. */
export class ApplicationError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: Record<string, string>) { super(message); }
}
