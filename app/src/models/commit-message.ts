/** A commit message summary and description. */
export interface ICommitMessage {
  readonly summary: string
  readonly description: string | null
  /**
   * Timestamp when the message was created. Used to compare and update the UI
   * with the newest commit message.
   */
  readonly timestamp: number
}

export const DefaultCommitMessage: ICommitMessage = {
  summary: '',
  description: '',
  timestamp: 0,
}
