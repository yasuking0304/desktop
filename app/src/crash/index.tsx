import '../locales/i18n'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { CrashApp } from './crash-app'
import { isLikeMacGnomeButtonLayout } from '../lib/gnome-button-layout'

if (!process.env.TEST_ENV) {
  /* This is the magic trigger for webpack to go compile
   * our sass into css and inject it into the DOM. */
  require('./styles/crash.scss')
}

document.body.classList.add(`platform-${process.platform}`)
if (await isLikeMacGnomeButtonLayout()) {
  document.body.classList.add('like-mac-button-layout')
}

const container = document.createElement('div')
container.id = 'desktop-crash-container'
document.body.appendChild(container)

ReactDOM.render(<CrashApp />, container)
