/* eslint-disable no-sync */

import * as path from 'path'
import * as cp from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

import glob = require('glob')
const globPromise = promisify(glob)

import { getDistPath, getDistRoot } from './dist-info'

function getArchitecture() {
  const arch = process.env.npm_config_arch || process.arch
  switch (arch) {
    case 'arm64':
      return '--arm64'
    case 'arm':
      return '--armv7l'
    default:
      return '--x64'
  }
}

function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1 = v1Parts[i] || 0; // 足りない部分は0とみなす
    const v2 = v2Parts[i] || 0;

    if (v1 > v2) return 1;  // version1が新しい
    if (v1 < v2) return -1; // version2が新しい
  }

  return 0; // 同じバージョン
}

function patchCliui() {
  /**
   * The following version cinbinations cause problems,
   * so wrap-ansi is prohibited.
   *
   * electron-builder >= 25.x.x
   * cliui <= 8.0.0
   * wrap-ansi >= 8.0.0
   */
  const cliuiPath = path.resolve(
    __dirname,
    '..',
    'node_modules',
    'electron-builder',
    'node_modules',
    'cliui'
  )
  const wrapAnsiPath = path.resolve(
    cliuiPath,
    '..',
    'wrap-ansi'
  )
  const wrapAnsiVersion = require(path.resolve(wrapAnsiPath, 'package.json'))[
    'version'
  ]
  if (compareVersions(wrapAnsiVersion, '8.0.0') < 0) {
    return
  }
  const cliuiVersion = require(path.resolve(cliuiPath, 'package.json'))[
    'version'
  ]
  if (compareVersions(cliuiVersion, '8.0.0') > 0) {
    return
  }
  const cliuiIndexCjsPath = path.resolve(cliuiPath, 'build', 'index.cjs')

  const orginalCjs = fs.readFileSync(cliuiIndexCjsPath, 'utf8')
  const convertedCjs = orginalCjs.replace(
    'this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;',
    'this.wrap = false;'
  )
  if (convertedCjs !== orginalCjs) {
    fs.writeFileSync(cliuiIndexCjsPath, convertedCjs)
    console.log(
      `\x1b[32m[Patched. Target Version: ` +
      `${cliuiVersion}] ${cliuiIndexCjsPath}\x1b[0m`
    )
  }
}

export async function packageElectronBuilder(): Promise<Array<string>> {
  const distPath = getDistPath()
  const distRoot = getDistRoot()

  const electronBuilder = path.resolve(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    'electron-builder'
  )

  patchCliui()

  const configPath = path.resolve(__dirname, 'electron-builder.yml')

  const args = [
    'build',
    '--prepackaged',
    distPath,
    getArchitecture(),
    '--config',
    configPath,
  ]

  const { error } = cp.spawnSync(electronBuilder, args, { stdio: 'inherit' })

  if (error != null) {
    return Promise.reject(error)
  }

  const appImageInstaller = `${distRoot}/GitHubDesktop-linux-*.AppImage`

  const files = await globPromise(appImageInstaller)
  if (files.length !== 1) {
    return Promise.reject(
      `Expected one AppImage installer but instead found '${files.join(
        ', '
      )}' - exiting...`
    )
  }

  const appImageInstallerPath = files[0]

  return Promise.resolve([appImageInstallerPath])
}
