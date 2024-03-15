/* eslint-disable no-sync */

import * as cp from 'child_process'
import * as path from 'path'
import * as electronInstaller from 'electron-winstaller'
import { getProductName, getCompanyName } from '../app/package-info'
import {
  getDistPath,
  getOSXZipPath,
  getWindowsIdentifierName,
  getWindowsStandaloneName,
  getWindowsInstallerName,
  shouldMakeDelta,
  getUpdatesURL,
  getIconFileName,
  isPublishable,
  getBundleSizes,
  getDistRoot,
  getDistArchitecture,
} from './dist-info'
import { isGitHubActions } from './build-platforms'
import { existsSync, rmSync, writeFileSync } from 'fs'
import { getVersion } from '../app/package-info'
import { rename } from 'fs/promises'
import { join } from 'path'
import { assertNonNullable } from '../app/src/lib/fatal-error'

const distPath = getDistPath()
const productName = getProductName()
const outputDir = getDistRoot()

const assertExistsSync = (path: string) => {
  if (!existsSync(path)) {
    throw new Error(`Expected ${path} to exist`)
  }
}

if (process.platform === 'darwin') {
  packageOSX()
} else if (process.platform === 'win32') {
  packageWindows()
} else if (process.platform === 'linux') {
  packageLinux()
} else {
  console.error(`I don't know how to package for ${process.platform} :(`)
  process.exit(1)
}

console.log('Writing bundle size info…')
writeFileSync(
  path.join(getDistRoot(), 'bundle-size.json'),
  JSON.stringify(getBundleSizes())
)

function packageOSX() {
  const dest = getOSXZipPath()
  rmSync(dest, { recursive: true, force: true })

  console.log('Packaging for macOS…')
  cp.execSync(
    `ditto -ck --keepParent "${distPath}/${productName}.app" "${dest}"`
  )
  // Adding Creatinon set.Env.plist
  console.log(`Adding shell…`)
  const shell_name = path.join(__dirname, 'setenv_lang_macos.sh')
  cp.execSync(`chmod 755 "${shell_name}"`)
  cp.execSync(`zip -j "${dest}" "${shell_name}"`)
}

function packageWindows() {
  const iconSource = path.join(
    __dirname,
    '..',
    'app',
    'static',
    'logos',
    `${getIconFileName()}.ico`
  )

  if (!existsSync(iconSource)) {
    console.error(`expected setup icon not found at location: ${iconSource}`)
    process.exit(1)
  }

  const splashScreenPath = path.resolve(
    __dirname,
    '../app/static/logos/win32-installer-splash.gif'
  )

  if (!existsSync(splashScreenPath)) {
    console.error(
      `expected setup splash screen gif not found at location: ${splashScreenPath}`
    )
    process.exit(1)
  }

  const iconUrl =
    'https://desktop.githubusercontent.com/github-desktop/app-icon.ico'

  const nugetPkgName = getWindowsIdentifierName()
  const options: electronInstaller.Options = {
    name: nugetPkgName,
    appDirectory: distPath,
    outputDirectory: outputDir,
    authors: getCompanyName(),
    iconUrl: iconUrl,
    setupIcon: iconSource,
    loadingGif: splashScreenPath,
    exe: `${nugetPkgName}.exe`,
    title: productName,
    setupExe: getWindowsStandaloneName(),
    setupMsi: getWindowsInstallerName(),
  }

  if (shouldMakeDelta()) {
    const url = new URL(getUpdatesURL())
    // Make sure Squirrel.Windows isn't affected by partially or completely
    // disabled releases.
    url.searchParams.set('bypassStaggeredRelease', '1')
    options.remoteReleases = url.toString()
  }

  if (isGitHubActions() && isPublishable()) {
    assertNonNullable(process.env.RUNNER_TEMP, 'Missing RUNNER_TEMP env var')

    const acsPath = join(process.env.RUNNER_TEMP, 'acs')
    const dlibPath = join(acsPath, 'bin', 'x64', 'Azure.CodeSigning.Dlib.dll')

    assertExistsSync(dlibPath)

    const metadataPath = join(acsPath, 'metadata.json')
    const acsMetadata = {
      Endpoint: 'https://eus.codesigning.azure.net/',
      CodeSigningAccountName: 'github-desktop',
      CertificateProfileName: 'desktop',
      CorrelationId: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    }
    writeFileSync(metadataPath, JSON.stringify(acsMetadata))

    options.signWithParams = `/v /fd SHA256 /tr "http://timestamp.acs.microsoft.com" /td SHA256 /dlib "${dlibPath}" /dmdf "${metadataPath}"`
  }

  console.log('Packaging for Windows…')
  electronInstaller
    .createWindowsInstaller(options)
    .then(() => console.log(`Installers created in ${outputDir}`))
    .then(async () => {
      // electron-winstaller (more specifically Squirrel.Windows) doesn't let
      // us control the name of the nuget packages but we want them to include
      // the architecture similar to how the setup exe and msi do so we'll just
      // have to rename them here after the fact.
      const arch = getDistArchitecture()
      const prefix = `${getWindowsIdentifierName()}-${getVersion()}`

      for (const kind of shouldMakeDelta() ? ['full', 'delta'] : ['full']) {
        const from = join(outputDir, `${prefix}-${kind}.nupkg`)
        const to = join(outputDir, `${prefix}-${arch}-${kind}.nupkg`)

        console.log(`Renaming ${from} to ${to}`)
        await rename(from, to)
      }
    })
    .catch(e => {
      console.error(`Error packaging: ${e}`)
      process.exit(1)
    })
}

async function packageLinux() {
  const yaml_name = 'GitHub-Desktop.yml'
  const out_name = `./out/GitHub_Desktop-${getVersion()}*.AppImage`
  const template = `app: github-desktop

ingredients:
  dist: trusty
  script:
    - rm -fr ./github-desktop
    - mkdir -p ./github-desktop/
    - cp -fr ${getDistRoot()}/desktop-linux-x64/* ./github-desktop/

script:
  - mkdir -p opt/github-desktop;
  - mkdir -p usr/bin;
  - cp -r ../github-desktop/* opt/github-desktop;
  - find . -name 32x32.png -exec cp {} usr/share/icons/hicolor/32x32/apps/github-desktop.png \\;
  - find . -name 64x64.png -exec cp {} usr/share/icons/hicolor/64x64/apps/github-desktop.png \\;
  - find . -name 128x128.png -exec cp {} usr/share/icons/hicolor/128x128/apps/github-desktop.png \\;
  - find . -name 256x256.png -exec cp {} usr/share/icons/hicolor/256x256/apps/github-desktop.png \\;
  - find . -name 512x512.png -exec cp {} usr/share/icons/hicolor/512x512/apps/github-desktop.png \\;
  - find . -name 1024x1024.png -exec cp {} usr/share/icons/hicolor/1024x1024/apps/github-desktop.png \\;
  - find . -name icon-logo.png -exec cp {} github-desktop.png \\;
  - cat > ./usr/bin/github <<\\EOF
  - #!/bin/bash
  - HERE="$(dirname "$(readlink -f "$\{0\}")")"
  - cd \${HERE}
  - cd ../..
  - CONTENTS="./opt/github-desktop"
  - cd \${CONTENTS}
  - # pwd
  - BINARY_NAME="desktop"
  - ELECTRON="./\${BINARY_NAME}"
  - CLI="./resources/app/cli.js"
  - # echo "\${ELECTRON}" "\${CLI}" "$@"
  - "\${ELECTRON}" "$\{CLI}" "$@"
  - exit $?
  - EOF
  - chmod a+x ./usr/bin/github
  - cat > github-desktop.desktop <<\\EOF
  - [Desktop Entry]
  - Name=GitHub Desktop
  - Comment=Simple collaboration from your desktop.
  - Comment[es]=Trabaja con GitHub desde tu escritorio.
  - Comment[eu]=GitHub-ekin lan egin zure ordenagailutik.
  - Comment[ja]=GitHub Desktop で GitHub を拡張
  - Exec=github %U
  - Terminal=false
  - Type=Application
  - Icon=github-desktop
  - Categories=Development;
  - MimeType=x-scheme-handler/x-github-client;x-scheme-handler/x-github-desktop-auth;x-scheme-handler/x-github-desktop-dev-auth;
  - EOF
  - echo "${getVersion()}" > ../VERSION
`
  const pkg2appimage_path = '../pkg2appimage/recipes'
  const pkg2appimage_file = '../pkg2appimage/pkg2appimage'
  console.log('Create yaml file…')
  writeFileSync(path.resolve(__dirname, yaml_name), template)
  const exit_code = await new Promise((resolve, _reject) => {
    if (existsSync(pkg2appimage_file) && existsSync(pkg2appimage_path)) {
      console.log('Create .AppImage file…')
      writeFileSync(path.resolve(pkg2appimage_path, yaml_name), template)
      console.log(`cd ../pkg2appimage`)
      process.chdir(path.dirname(pkg2appimage_file))
      const spawn = cp.spawn(`./pkg2appimage ./recipes/${yaml_name}`, {
        shell: true,
      })
      spawn.stdout.on('data', data => {
        process.stdout.write(data.toString())
      })
      spawn.stderr.on('data', data => {
        process.stdout.write(data.toString())
      })
      spawn.on('close', code => {
        if (code === 0) {
          console.log(`cp -f ${out_name} ${getDistRoot()}/GitHub_Desktopx86_64.AppImage`)
          cp.execSync(`cp -f ${out_name} ${getDistRoot()}/GitHub_Desktopx86_64.AppImage`)
          process.chdir(__dirname)
        }
        resolve(code)
      })
    } else {
      console.log(`usage:`)
      console.log(
        `0. git clone https://github.com/AppImageCommunity/pkg2appimage.git pkg2appimage`
      )
      console.log(``)
      console.log(`1. pkg2appimage files is here.`)
      console.log(
        `2. cp ${path.resolve(
          __dirname,
          'GitHub-Desktop.yml'
        )} <pkg2appimage/recipes>`
      )
      console.log(`3. cd <pkg2appimage>`)
      console.log(`4. ./pkg2appimage ./recipes/GitHub-Desktop.yml`)
      console.log(``)
      resolve(0)
    }
  })
  return exit_code
}
