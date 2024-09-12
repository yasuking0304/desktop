import React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { ITextDiff, LineEndingsChange } from '../../models/diff'
import { t } from 'i18next'

enum DiffContentsWarningType {
  UnicodeBidiCharacters,
  LineEndingsChange,
}

type DiffContentsWarningItem =
  | {
      readonly type: DiffContentsWarningType.UnicodeBidiCharacters
    }
  | {
      readonly type: DiffContentsWarningType.LineEndingsChange
      readonly lineEndingsChange: LineEndingsChange
    }

interface IDiffContentsWarningProps {
  readonly diff: ITextDiff
}

export class DiffContentsWarning extends React.Component<IDiffContentsWarningProps> {
  public render() {
    const items = this.getTextDiffWarningItems()

    if (items.length === 0) {
      return null
    }

    return (
      <div className="diff-contents-warning-container">
        {items.map((item, i) => (
          <div className="diff-contents-warning" key={i}>
            <Octicon symbol={octicons.alert} />
            {this.getWarningMessageForItem(item)}
          </div>
        ))}
      </div>
    )
  }

  private getTextDiffWarningItems(): ReadonlyArray<DiffContentsWarningItem> {
    const items = new Array<DiffContentsWarningItem>()
    const { diff } = this.props

    if (diff.hasHiddenBidiChars) {
      items.push({
        type: DiffContentsWarningType.UnicodeBidiCharacters,
      })
    }

    if (diff.lineEndingsChange) {
      items.push({
        type: DiffContentsWarningType.LineEndingsChange,
        lineEndingsChange: diff.lineEndingsChange,
      })
    }

    return items
  }

  private getWarningMessageForItem(item: DiffContentsWarningItem) {
    switch (item.type) {
      case DiffContentsWarningType.UnicodeBidiCharacters:
        return (
          <>
            {t(
              'diff-contents-warning.this-diff-contains-bidirectional-unicode',
              `This diff contains bidirectional Unicode text that may be
              interpreted or compiled differently than what appears below. To
              review, open the file in an editor that reveals hidden Unicode
              characters. `
            )}
            <LinkButton uri="https://github.co/hiddenchars">
              {t(
                'diff-contents-warning.learn-more-about-bidirectional-unicode',
                'Learn more about bidirectional Unicode characters'
              )}
            </LinkButton>
          </>
        )

      case DiffContentsWarningType.LineEndingsChange:
        const { lineEndingsChange } = item
        return (
          <>
            {t(
              'diff-contents-warning.this-diff-contains-a-change',
              `This diff contains a change in line endings from 
              '{{0}}' to '{{1}}.`,
              { 0: lineEndingsChange.from, 1: lineEndingsChange.to }
            )}
          </>
        )
    }
  }
}
