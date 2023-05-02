import * as React from 'react'
import {
  ApplicationTheme,
  supportsSystemThemeChanges,
  getCurrentlyAppliedTheme,
  ICustomTheme,
} from '../lib/application-theme'
import { Row } from '../lib/row'
import { DialogContent } from '../dialog'
import {
  VerticalSegmentedControl,
  ISegmentedItem,
} from '../lib/vertical-segmented-control'
import { CustomThemeSelector } from './custom-theme-selector'
import { enableHighContrastTheme } from '../../lib/feature-flag'
import { t } from 'i18next'

interface IAppearanceProps {
  readonly selectedTheme: ApplicationTheme
  readonly customTheme?: ICustomTheme
  readonly onSelectedThemeChanged: (theme: ApplicationTheme) => void
  readonly onCustomThemeChanged: (theme: ICustomTheme) => void
}

interface IAppearanceState {
  readonly selectedTheme: ApplicationTheme | null
}

const systemTheme: ISegmentedItem<ApplicationTheme> = {
  title: t('appearance.system', 'System'),
  description: t(
    'appearance.message-of-system',
    'Automatically switch theme to match system theme'
  ),
  key: ApplicationTheme.System,
}

const themes: ReadonlyArray<ISegmentedItem<ApplicationTheme>> = [
  {
    title: t('appearance.light', 'Light'),
    description: t(
      'appearance.message-of-light',
      'The default theme of GitHub Desktop'
    ),
    key: ApplicationTheme.Light,
  },
  {
    title: t('appearance.dark', 'Dark'),
    description: t(
      'appearance.message-of-dark',
      'GitHub Desktop is for you too, creatures of the night'
    ),
    key: ApplicationTheme.Dark,
  },
  ...(enableHighContrastTheme()
    ? [
        {
          title: t('appearance.high-contrast', 'High Contrast'),
          description: t(
            'appearance.message-of-high-contrast',
            'Customizable High Contrast Theme'
          ),
          key: ApplicationTheme.HighContrast,
        },
      ]
    : []),
  ...(supportsSystemThemeChanges() ? [systemTheme] : []),
]

export class Appearance extends React.Component<
  IAppearanceProps,
  IAppearanceState
> {
  public constructor(props: IAppearanceProps) {
    super(props)

    const usePropTheme =
      props.selectedTheme !== ApplicationTheme.System ||
      supportsSystemThemeChanges()

    this.state = { selectedTheme: usePropTheme ? props.selectedTheme : null }

    if (!usePropTheme) {
      this.initializeSelectedTheme()
    }
  }

  public async componentDidUpdate(prevProps: IAppearanceProps) {
    if (prevProps.selectedTheme === this.props.selectedTheme) {
      return
    }

    const usePropTheme =
      this.props.selectedTheme !== ApplicationTheme.System ||
      supportsSystemThemeChanges()

    const selectedTheme = usePropTheme
      ? this.props.selectedTheme
      : await getCurrentlyAppliedTheme()

    this.setState({ selectedTheme })
  }

  private initializeSelectedTheme = async () => {
    const selectedTheme = await getCurrentlyAppliedTheme()
    this.setState({ selectedTheme })
  }

  private onSelectedThemeChanged = (theme: ApplicationTheme) => {
    this.props.onSelectedThemeChanged(theme)
  }

  private onCustomThemeChanged = (theme: ICustomTheme) => {
    this.props.onCustomThemeChanged(theme)
  }

  public render() {
    const { selectedTheme } = this.state

    if (selectedTheme == null) {
      return (
        <DialogContent>
          <Row>
            {t('appearance.loading-system-theme', 'Loading system theme')}
          </Row>
        </DialogContent>
      )
    }

    return (
      <DialogContent>
        <Row>
          <VerticalSegmentedControl
            items={themes}
            selectedKey={selectedTheme}
            onSelectionChanged={this.onSelectedThemeChanged}
          />
        </Row>
        <Row>
          <CustomThemeSelector
            onCustomThemeChanged={this.onCustomThemeChanged}
            selectedTheme={selectedTheme}
            customTheme={this.props.customTheme}
          />
        </Row>
      </DialogContent>
    )
  }
}
