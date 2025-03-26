import { spawn } from 'child_process'
import { join, resolve } from 'path'
import { readdir, readFile } from 'fs/promises'
import { parseEnv } from 'util'

function reporter(r) {
  return ['--test-reporter', r, '--test-reporter-destination', 'stdout']
}

const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : await readdir('app/test/unit', { recursive: true }).then(x =>
        x
          .filter(f => f.endsWith('-test.ts'))
          .map(f => join('app', 'test', 'unit', f))
      )

// I would _looooove_ to use the `--env-file` option, but it doesn't override
// existing environment variables and we need to override some of them.
Object.entries(
  parseEnv(await readFile(join(import.meta.dirname, '..', '.test.env'), 'utf8'))
).forEach(([k, v]) => {
  process.env[k] = v
})

const args = [
  '--disable-warning=ExperimentalWarning',
  '--experimental-test-module-mocks',
  ...['--import', 'tsx'],
  ...['--import', './app/test/__mocks__/electron.mjs'],
  ...['--import', './app/test/globals.ts'],
  '--test',
  ...reporter('spec'),
  ...(process.env.GITHUB_ACTIONS ? reporter('node-test-github-reporter') : []),
  ...files,
]

spawn('node', args, {
  stdio: 'inherit',
  cwd: resolve(import.meta.dirname, '..'),
}).on('exit', process.exit)
