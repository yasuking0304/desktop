import { join } from 'path'
import { getShell } from './get-shell'
import { spawn } from 'child_process'
import { SupportedHooksEnvShell } from './config'

export type ShellEnvResult =
  | {
      kind: 'success'
      env: Record<string, string | undefined>
    }
  | {
      kind: 'failure'
      shellKind?: SupportedHooksEnvShell
    }

export const getShellEnv = async (
  cwd?: string,
  shellKind?: SupportedHooksEnvShell
): Promise<ShellEnvResult> => {
  const ext = __WIN32__ ? '.exe' : ''
  const printenvzPath = join(__dirname, `printenvz${ext}`)

  const shellInfo = await getShell(shellKind)

  if (!shellInfo) {
    return { kind: 'failure', shellKind }
  }

  const { shell, args, quoteCommand, windowsVerbatimArguments, argv0 } =
    shellInfo

  return await new Promise((resolve, reject) => {
    const child = spawn(shell, [...args, quoteCommand(printenvzPath)], {
      env: {},
      windowsVerbatimArguments,
      argv0,
      stdio: 'pipe',
      cwd,
    })

    const chunks: Buffer[] = []

    child.stdout
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => {
        const stdout = Buffer.concat(chunks).toString('utf8')
        // It's possible that the user writes to stdout in their shell init
        // script which would get picked up here so we've added a marker to the
        // output of printenvz so we can be sure we're only parsing its output
        const startMarker = '--printenvz--begin\n'
        const endMarker = '\n--printenvz--end\n'

        const start = stdout.indexOf(startMarker)
        const end = stdout.indexOf(endMarker)

        if (start === -1 || end === -1 || start >= end) {
          return reject(
            new Error('could not find environment variables in shell output')
          )
        }

        const matches = stdout
          .substring(start + startMarker.length, end)
          .matchAll(/([^=]+)=([^\0]*)\0/g)

        resolve({
          kind: 'success',
          env: Object.fromEntries(Array.from(matches, m => [m[1], m[2]])),
        })
      })

    child.on('error', err => reject(err))

    child.on('close', (code, signal) => {
      if (code !== 0) {
        return reject(
          new Error(`child exited with code ${code} and signal ${signal}`)
        )
      }
    })
  })
}
