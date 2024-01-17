import * as React from 'react'

import { ICompareBranch, HistoryTabMode } from '../../lib/app-state'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dispatcher } from '../dispatcher'
import { Button } from '../lib/button'
import { t } from 'i18next'

interface IMergeCallToActionProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly currentBranch: Branch
  readonly formState: ICompareBranch

  /**
   * Callback to execute after a merge has been performed
   */
  readonly onMerged: () => void
}

export class MergeCallToAction extends React.Component<
  IMergeCallToActionProps,
  {}
> {
  public render() {
    const count = this.props.formState.aheadBehind.behind

    return (
      <div className="merge-cta">
        {this.renderMergeDetails(
          this.props.formState,
          this.props.currentBranch
        )}

        <Button
          type="submit"
          disabled={count <= 0}
          onClick={this.onMergeClicked}
        >
          {t('merge-call-to-action.merge-into-1', 'Merge into ')}
          <strong>{this.props.currentBranch.name}</strong>
          {t('merge-call-to-action.merge-into-2', ' ')}
        </Button>
      </div>
    )
  }

  private renderMergeDetails(formState: ICompareBranch, currentBranch: Branch) {
    const branch = formState.comparisonBranch
    const count = formState.aheadBehind.behind

    if (count > 0) {
      const pluralized =
        count === 1
          ? t('common.one-commit', 'commit')
          : t('common.multiple-commits', 'commits')
      return (
        <div className="merge-message merge-message-legacy">
          {t('merge-call-to-action.this-will-merge-into-1', 'This will merge ')}
          <strong>{`${count} ${pluralized}`}</strong>
          {t('merge-call-to-action.this-will-merge-into-2', ' from ')}
          <strong>{branch.name}</strong>
          {t('merge-call-to-action.this-will-merge-into-3', ' into ')}
          <strong>{currentBranch.name}</strong>
          {t('merge-call-to-action.this-will-merge-into-4', ' ')}
        </div>
      )
    }

    return null
  }

  private onMergeClicked = async () => {
    const formState = this.props.formState

    this.props.dispatcher.incrementMetric('mergesInitiatedFromComparison')

    await this.props.dispatcher.mergeBranch(
      this.props.repository,
      formState.comparisonBranch,
      null
    )

    this.props.dispatcher.executeCompare(this.props.repository, {
      kind: HistoryTabMode.History,
    })

    this.props.dispatcher.updateCompareForm(this.props.repository, {
      showBranchList: false,
      filterText: '',
    })
    this.props.onMerged()
  }
}
