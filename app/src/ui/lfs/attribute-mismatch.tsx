import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void

  readonly onEditGlobalGitConfig: () => void
}

export class AttributeMismatch extends React.Component<IAttributeMismatchProps> {
  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title={
          __DARWIN__
            ? t(
                'attribute-mismatch.update-existing-git-lfs-darwin',
                'Update Existing Git LFS Filters?'
              )
            : t(
                'attribute-mismatch.update-existing-git-lfs',
                'Update existing Git LFS filters?'
              )
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            {t(
              'attribute-mismatch.git-lfs-filters-are-configured-1',
              'Git LFS filters are already configured in '
            )}
            <LinkButton onClick={this.props.onEditGlobalGitConfig}>
              {t(
                'attribute-mismatch.your-global-git-config',
                'your global git config'
              )}
            </LinkButton>
            {t(
              'attribute-mismatch.git-lfs-filters-are-configured-2',
              ` but are not the values it expects. Would you like to
               update them now?`
            )}
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t(
                    'attribute-mismatch.update-existing-filters-darwin',
                    'Update Existing Filters'
                  )
                : t(
                    'attribute-mismatch.update-existing-filters',
                    'Update existing filters'
                  )
            }
            cancelButtonText={
              __DARWIN__
                ? t('common.not-now-darwin', 'Not Now')
                : t('common.not-now', 'Not now')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    this.props.onUpdateExistingFilters()
    this.props.onDismissed()
  }
}
