import * as React from 'react'

import { Image } from '../../../models/diff'
import { ImageContainer } from './image-container'
import { t } from 'i18next'

interface INewImageDiffProps {
  readonly current: Image
}

/** A component to render when a new image has been added to the repository */
export class NewImageDiff extends React.Component<INewImageDiffProps, {}> {
  public render() {
    return (
      <div className="panel image" id="diff">
        <div className="image-diff-current">
          <div className="image-diff-header">{t('common.added', 'Added')}</div>
          <ImageContainer image={this.props.current} />
        </div>
      </div>
    )
  }
}
