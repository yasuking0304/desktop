/* eslint-disable no-sync */

import * as cp from 'child_process'
import fs from 'fs'

const I18NEXT_CONFIG = 'i18next-parser.config.js'

function convertLangJsonFile(filepath: string, filename: string) {
  // if includes '\n' and more than 2 spaces, replace with ' '.
  // if includes '<wbr>', replace with '\n'.
  // Note: If your content contains line breaks '\n', set the
  // white-space property in CSS to pre-line or a similar value.
  const orginal_data = fs.readFileSync(filepath + filename, 'utf8')
  const converted_data = orginal_data
    .replace(/\\n[ ]{2,}/g, ' ')
    .replace('<wbr>', '\\n')
  if (converted_data !== orginal_data) {
    fs.writeFileSync(filepath + filename, converted_data)
    console.log(
      `  \x1b[32m[Convert]\x1b[0m ${process.cwd()}/${filepath}${filename}`
    )
  }
}

function checkLangJsonFile() {
  const i18config = require(`./${I18NEXT_CONFIG}`)
  const i18_dir = i18config.output.replace(/lang_\$LOCALE.json/, '')
  const files = fs.readdirSync(i18_dir, { withFileTypes: true })
  for (const dirent of files) {
    if (
      dirent.isFile() &&
      dirent.name.match(/^lang_/) &&
      !dirent.name.match('_old') &&
      dirent.name.match(/.json$/)
    ) {
      convertLangJsonFile(dirent.parentPath, dirent.name)
    }
  }
}

function i18nextCreate() {
  const spawn = cp.spawn(`i18next -c script/${I18NEXT_CONFIG}`, {
    shell: true,
    stdio: 'inherit',
  })
  spawn.on('close', code => {
    if (code === 0) {
      checkLangJsonFile()
    }
  })
}

i18nextCreate()
