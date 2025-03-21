import { HttpStatusCode } from './http-status-code'

/** An error which contains additional metadata. */
export class CopilotError extends Error {
  /** The error's metadata. */
  private readonly statusCode: number

  public constructor(message: string, statusCode: number) {
    super(message)

    this.name = 'CopilotError'
    this.statusCode = statusCode
  }

  public get isQuotaExceededError(): boolean {
    return this.statusCode === HttpStatusCode.PaymentRequired
  }
}
