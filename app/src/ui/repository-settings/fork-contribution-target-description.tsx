import * as React from 'react'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { RepositoryWithForkedGitHubRepository } from '../../models/repository'
import { t } from 'i18next'

interface IForkSettingsDescription {
  readonly repository: RepositoryWithForkedGitHubRepository
  readonly forkContributionTarget: ForkContributionTarget
}

export function ForkSettingsDescription(props: IForkSettingsDescription) {
  // We can't use the getNonForkGitHubRepository() helper since we need to calculate
  // the value based on the temporary form state.
  const targetRepository =
    props.forkContributionTarget === ForkContributionTarget.Self
      ? props.repository.gitHubRepository
      : props.repository.gitHubRepository.parent

  return (
    <ul className="fork-settings-description">
      <li>
        {t(
          'fork-contribution-target-description.pull-requests-targeting-1',
          'Pull requests targeting '
        )}
        <strong>{targetRepository.fullName}</strong>
        {t(
          'fork-contribution-target-description.pull-requests-targeting-2',
          ' will be shown in the pull request list.'
        )}
      </li>
      <li>
        {t(
          'fork-contribution-target-description.issues-will-be-created-1',
          'Issues will be created in '
        )}
        <strong>{targetRepository.fullName}</strong>
        {t(
          'fork-contribution-target-description.issues-will-be-created-2',
          '.'
        )}
      </li>
      <li>
        {t(
          'fork-contribution-target-description.view-on-gitgub-1',
          '"View on Github" will open '
        )}
        <strong>{targetRepository.fullName}</strong>
        {t(
          'fork-contribution-target-description.view-on-gitgub-2',
          ' in the browser.'
        )}
      </li>
      <li>
        {t(
          'fork-contribution-target-description.new-branches-1',
          'New branches will be based on '
        )}
        <strong>{targetRepository.fullName}</strong>
        {t(
          'fork-contribution-target-description.new-branches-2',
          `'s default branch.`
        )}
      </li>
      <li>
        {t(
          'fork-contribution-target-description.autocompletion-of-user-1',
          'Autocompletion of user and issues will be based on '
        )}
        <strong>{targetRepository.fullName}</strong>
        {t(
          'fork-contribution-target-description.autocompletion-of-user-2',
          '.'
        )}
      </li>
    </ul>
  )
}
