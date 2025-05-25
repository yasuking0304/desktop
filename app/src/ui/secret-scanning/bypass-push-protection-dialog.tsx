import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ISecretScanResult } from './push-protection-error-dialog'
import { VerticalSegmentedControl } from '../lib/vertical-segmented-control'
import { t } from 'i18next'

export enum BypassReason {
  FalsePositive = 'false_positive',
  UsedInTests = 'used_in_tests',
  WillFixLater = 'will_fix_later',
}

export type BypassReasonType =
  | BypassReason.FalsePositive
  | BypassReason.UsedInTests
  | BypassReason.WillFixLater

interface IBypassPushProtectionDialogProps {
  /** The secret to be bypassed */
  readonly secret: ISecretScanResult

  /** The function to call when the user clicks the bypass button */
  readonly bypassPushProtection: (
    secret: ISecretScanResult,
    reason: BypassReasonType
  ) => void

  readonly onDismissed: () => void
}

interface IBypassPushProtectionDialogState {
  readonly reason: BypassReasonType
}
/**
 * The dialog shown when a user wants to bypass the push protection feature of secret scanning.
 */
export class BypassPushProtectionDialog extends React.Component<
  IBypassPushProtectionDialogProps,
  IBypassPushProtectionDialogState
> {
  public constructor(props: IBypassPushProtectionDialogProps) {
    super(props)
    this.state = {
      reason: BypassReason.FalsePositive,
    }
  }

  public render() {
    const items = [
      {
        title: t(
          'bypass-push-protection-dialog.its-used-in-tests',
          "It's used in tests"
        ),
        description:
          'The secret poses no risk. If anyone finds it, they cannot do any damage or gain access to sensitive information.',
        key: BypassReason.UsedInTests,
      },
      {
        title: t(
          'bypass-push-protection-dialog.its-a-false-positive',
          "It's a false positive"
        ),
        description: t(
          'bypass-push-protection-dialog.the-detected-string',
          'The detected string is not a secret'
        ),
        key: BypassReason.FalsePositive,
      },
      {
        title: t(
          'bypass-push-protection-dialog.i-will-fix-it-later',
          "I'll fix it later"
        ),
        description: t(
          'bypass-push-protection-dialog.the-secret-is-real',
          'The secret is real, I understand the risk, and I will need to revoke it. This will open a security alert and notify admins of this repository.'
        ),
        key: BypassReason.WillFixLater,
      },
    ]

    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'bypass-push-protection-dialog.bypass-push-detection-darwin',
                'Bypass Push Detection'
              )
            : t(
                'bypass-push-protection-dialog.bypass-push-detection',
                'Bypass push detection'
              )
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.bypassPushProtection}
        className="bypass-push-protection-dialog"
      >
        <DialogContent>
          <VerticalSegmentedControl
            label={t(
              'bypass-push-protection-dialog.why-are-you-bypassing',
              `Why are you bypassing this {{0}}?`,
              { 0: this.props.secret.description }
            )}
            items={items}
            selectedKey={this.state.reason}
            onSelectionChanged={this.onSelectionChanged}
          />
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t(
              'bypass-push-protection-dialog.allow-me-to-expose',
              'Allow me to expose this secret'
            )}
            destructive={true}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSelectionChanged = (reason: BypassReasonType) => {
    this.setState({ reason })
  }

  private bypassPushProtection = () => {
    this.props.bypassPushProtection(this.props.secret, this.state.reason)
  }
}
