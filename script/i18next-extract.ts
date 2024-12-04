/* eslint-disable no-sync */

import * as cp from 'child_process'
import fs from 'fs'

function convertJsonFile(filepath: string, filename: string) {
  const data = fs.readFileSync(filepath + filename, 'utf8')
  const pattern = /\\n[ ]{2,}/g
  const data2 = data.replace(pattern, ' ')
  if (data2 !== data) {
    fs.writeFileSync(filepath + filename, data2)
    console.log(
      `  \x1b[32m[Convert]\x1b[0m ${process.cwd()}/${filepath}${filename}`
    )
  }
}

function checkJson() {
  const i18config = require('./i18next-parser.config.js')
  const i18_dir = i18config.output.replace(/lang_\$LOCALE.json/, '')
  const files = fs.readdirSync(i18_dir, { withFileTypes: true })
  for (const dirent of files) {
    if (
      dirent.isFile() &&
      dirent.name.match(/^lang_/) &&
      !dirent.name.match('_old') &&
      dirent.name.match(/.json$/)
    ) {
      convertJsonFile(dirent.parentPath, dirent.name)
    }
  }
}

const spawn = cp.spawn(`i18next -c script/i18next-parser.config.js`, {
  shell: true,
  stdio: 'inherit',
})
spawn.on('close', code => {
  if (code === 0) {
    checkJson()
    console.log('end')
  }
})
