import * as cp from 'child_process'
import * as path from 'path'
import { existsSync, writeFileSync } from 'fs'
import { getVersion } from '../app/package-info'
import { getDistRoot } from './dist-info'

export async function packageAppImage() {
  const yaml_name = 'GitHub-Desktop.yml'
  const out_name = `./out/GitHub_Desktop-${getVersion()}.*.AppImage`
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
  - Comment[fr]=GitHub Desktop facilite la collaboration
  - Comment[ja]=GitHub Desktop で 簡単にコラボレーションできる環境に
  - Comment[ko]=GitHub Desktop으로 손쉽게 협업할 수 있는 환경
  - Comment[pt]=O GitHub Desktop facilita a colaboração
  - Comment[pt-br]=O GitHub Desktop facilita a colaboração
  - Comment[zh]=GitHub Desktop 让协作变得简单
  - Comment[zh-cn]=GitHub Desktop 让协作变得简单
  - Comment[zh-hk]=GitHub Desktop 讓協作變得簡單
  - Comment[zh-mo]=GitHub Desktop 讓協作變得簡單
  - Comment[zh-sg]=GitHub Desktop 讓協作變得簡單
  - Comment[zh-tw]=GitHub Desktop 讓協作變得簡單
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
        stdio: 'inherit',
      })
      spawn.on('close', code => {
        if (code === 0) {
          console.log(
            `cp -f ${out_name} ${getDistRoot()}/GitHub_Desktopx86_64.AppImage`
          )
          cp.execSync(
            `cp -f ${out_name} ${getDistRoot()}/GitHub_Desktopx86_64.AppImage`
          )
          process.chdir(__dirname)
        }
        resolve(code)
      })
    } else {
      console.log(`usage:`)
      console.log(
        `0. git clone https://github.com/AppImageCommunity/pkg2appimage.git ../pkg2appimage`
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
