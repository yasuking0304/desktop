import * as React from 'react'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'
import { t } from 'i18next'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  // localization, it burns :vampire:
  const message =
    conflictedFilesCount === 1
      ? t('render-functions.one-conflicted-file', `1 conflicted file`)
      : t('render-functions.many-conflicted-files', `{{0}} conflicted files`, {
          0: conflictedFilesCount,
        })
  return <h2 className="summary">{message}</h2>
}

export function renderAllResolved() {
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={octicons.check} />
      </div>
      <div className="message">
        {t('render-functions.all-conflicts-resolved', 'All conflicts resolved')}
      </div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  return (
    <div>
      {t('render-functions.open-in-command-line-1', ' ')}
      <LinkButton onClick={openThisRepositoryInShell}>
        {t('render-functions.open-in-command-line-2', 'Open in command line,')}
      </LinkButton>
      {t(
        'render-functions.open-in-command-line-3',
        ' your tool of choice, or close to resolve manually.'
      )}
    </div>
  )
}
