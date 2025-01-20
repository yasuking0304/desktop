import * as React from 'react'

import { assertNever } from '../../lib/fatal-error'

import { Banner, BannerType } from '../../models/banner'

import { Dispatcher } from '../dispatcher'
import { MergeConflictsBanner } from './merge-conflicts-banner'

import { SuccessfulMerge } from './successful-merge'
import { RebaseConflictsBanner } from './rebase-conflicts-banner'
import { SuccessfulRebase } from './successful-rebase'
import { BranchAlreadyUpToDate } from './branch-already-up-to-date-banner'
import { SuccessfulCherryPick } from './successful-cherry-pick'
import { CherryPickConflictsBanner } from './cherry-pick-conflicts-banner'
import { CherryPickUndone } from './cherry-pick-undone'
import { OpenThankYouCard } from './open-thank-you-card'
import { SuccessfulSquash } from './successful-squash'
import { SuccessBanner } from './success-banner'
import { ConflictsFoundBanner } from './conflicts-found-banner'
import { t } from 'i18next'
import { OSVersionNoLongerSupportedBanner } from './os-version-no-longer-supported-banner'

export function renderBanner(
  banner: Banner,
  dispatcher: Dispatcher,
  onDismissed: () => void
): JSX.Element {
  switch (banner.type) {
    case BannerType.SuccessfulMerge:
      return (
        <SuccessfulMerge
          ourBranch={banner.ourBranch}
          theirBranch={banner.theirBranch}
          onDismissed={onDismissed}
          key={'successful-merge'}
        />
      )
    case BannerType.MergeConflictsFound:
      return (
        <MergeConflictsBanner
          dispatcher={dispatcher}
          ourBranch={banner.ourBranch}
          popup={banner.popup}
          onDismissed={onDismissed}
          key={'merge-conflicts'}
        />
      )
    case BannerType.SuccessfulRebase:
      return (
        <SuccessfulRebase
          targetBranch={banner.targetBranch}
          baseBranch={banner.baseBranch}
          onDismissed={onDismissed}
          key={'successful-rebase'}
        />
      )
    case BannerType.RebaseConflictsFound:
      return (
        <RebaseConflictsBanner
          dispatcher={dispatcher}
          targetBranch={banner.targetBranch}
          onOpenDialog={banner.onOpenDialog}
          onDismissed={onDismissed}
          key={'merge-conflicts'}
        />
      )
    case BannerType.BranchAlreadyUpToDate:
      return (
        <BranchAlreadyUpToDate
          ourBranch={banner.ourBranch}
          theirBranch={banner.theirBranch}
          onDismissed={onDismissed}
          key={'branch-already-up-to-date'}
        />
      )
    case BannerType.SuccessfulCherryPick:
      return (
        <SuccessfulCherryPick
          key="successful-cherry-pick"
          targetBranchName={banner.targetBranchName}
          countCherryPicked={banner.count}
          onDismissed={onDismissed}
          onUndo={banner.onUndo}
        />
      )
    case BannerType.CherryPickConflictsFound:
      return (
        <CherryPickConflictsBanner
          targetBranchName={banner.targetBranchName}
          onOpenConflictsDialog={banner.onOpenConflictsDialog}
          onDismissed={onDismissed}
          key={'cherry-pick-conflicts'}
        />
      )
    case BannerType.CherryPickUndone:
      return (
        <CherryPickUndone
          key="cherry-pick-undone"
          targetBranchName={banner.targetBranchName}
          countCherryPicked={banner.countCherryPicked}
          onDismissed={onDismissed}
        />
      )
    case BannerType.OpenThankYouCard:
      return (
        <OpenThankYouCard
          key="open-thank-you-card"
          emoji={banner.emoji}
          onDismissed={onDismissed}
          onOpenCard={banner.onOpenCard}
          onThrowCardAway={banner.onThrowCardAway}
        />
      )
    case BannerType.SuccessfulSquash:
      return (
        <SuccessfulSquash
          key="successful-squash"
          count={banner.count}
          onDismissed={onDismissed}
          onUndo={banner.onUndo}
        />
      )
    case BannerType.SquashUndone: {
      const pluralized =
        banner.commitsCount === 1
          ? t('common.one-commit', 'commit')
          : t('common.multiple-commits', 'commits')
      return (
        <SuccessBanner
          key="squash-undone"
          timeout={5000}
          onDismissed={onDismissed}
        >
          {t(
            'render-banner.squash-of-commit-undone',
            'Squash of {{0}} {{1}} undone.',
            { 0: banner.commitsCount, 1: pluralized }
          )}
        </SuccessBanner>
      )
    }
    case BannerType.SuccessfulReorder: {
      const pluralized =
        banner.count === 1
          ? t('common.one-commit', 'commit')
          : t('common.multiple-commits', 'commits')

      return (
        <SuccessBanner
          key="successful-reorder"
          timeout={15000}
          onDismissed={onDismissed}
          onUndo={banner.onUndo}
        >
          <span>
            {t(
              'render-banner.successfully-reordered-commit',
              'Successfully reordered {{0}} {{1}}.',
              { 0: banner.count, 1: pluralized }
            )}
          </span>
        </SuccessBanner>
      )
    }
    case BannerType.ReorderUndone: {
      const pluralized =
        banner.commitsCount === 1
          ? t('common.one-commit', 'commit')
          : t('common.multiple-commits', 'commits')
      return (
        <SuccessBanner
          key="reorder-undone"
          timeout={5000}
          onDismissed={onDismissed}
        >
          {t(
            'render-banner.reorder-of-commit-undone',
            'Reorder of {{0}} {{1}} undone.',
            { 0: banner.commitsCount, 1: pluralized }
          )}
        </SuccessBanner>
      )
    }
    case BannerType.ConflictsFound:
      return (
        <ConflictsFoundBanner
          operationDescription={banner.operationDescription}
          onOpenConflictsDialog={banner.onOpenConflictsDialog}
          onDismissed={onDismissed}
          key={'conflicts-found'}
        ></ConflictsFoundBanner>
      )
    case BannerType.OSVersionNoLongerSupported:
      return <OSVersionNoLongerSupportedBanner onDismissed={onDismissed} />
    default:
      return assertNever(banner, `Unknown popup type: ${banner}`)
  }
}
