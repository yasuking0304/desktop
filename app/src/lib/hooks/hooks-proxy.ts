import { spawn } from 'child_process'
import { basename, resolve } from 'path'
import { ProcessProxyConnection as Connection } from 'process-proxy'
import type { HookProgress, TerminalOutput } from '../git'
import { resolveGitBinary } from 'dugite'
import { ShellEnvResult } from './get-shell-env'
import { shellFriendlyNames } from './config'

const ignoredOnFailureHooks = [
  'post-applypatch',
  'post-commit',
  // The exit code from post-checkout doesn't stop the checkout but it does set
  // the overall command's exit code. I don't believe we want to show an error
  // to the user if this hook fails though.
  'post-checkout',
  'post-merge',
  // Again, the exit code here does affect Git in so far that it won't run
  // git-gc but it's not something we should alert the user about.
  'pre-auto-gc',
  'post-rewrite',
]

const excludedEnvVars: ReadonlySet<string> = new Set([
  // Dugite sets these, we don't want to leak them into the hook environment
  'GIT_SYSTEM_CONFIG',
  'GIT_EXEC_PATH',
  'GIT_TEMPLATE_DIR',
  // We set this to point to a custom hooks path which we don't want
  // leaking into the hook's environment. Initially I thought we would have
  // to sanitize this to strip out the custom config we set and leave any
  // user-configured but since we're executing the hook in a separate
  // shell with login it would just get re-initialized there anyway.
  'GIT_CONFIG_PARAMETERS',

  'GIT_ASKPASS',
  'GIT_SSH_COMMAND',
  'GIT_USER_AGENT',
])

const debug = (message: string, error?: Error) => {
  log.debug(`hooks: ${message}`, error)
}

const exitWithMessage = (conn: Connection, msg: string, exitCode = 0) => {
  return new Promise<void>(async resolve => {
    conn.stderr.write(`${msg}\n`, () => {
      conn.exit(exitCode).then(resolve, err => {
        debug(
          `failed to exit proxy: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
        resolve()
      })
    })
  })
}

const exitWithError = (conn: Connection, msg: string, exitCode = 1) =>
  exitWithMessage(conn, msg, exitCode)

export const createHooksProxy = (
  getShellEnv: (cwd: string) => Promise<ShellEnvResult>,
  onHookProgress?: (progress: HookProgress) => void,
  onHookFailure?: (
    hookName: string,
    terminalOutput: TerminalOutput
  ) => Promise<'abort' | 'ignore'>
) => {
  return async (conn: Connection) => {
    const startTime = Date.now()
    const proxyArgs = await conn.getArgs()
    const proxyEnv = await conn.getEnv()
    const proxyCwd = await conn.getCwd()
    const hasStdin = await conn.isStdinConnected()

    const hookName = basename(proxyArgs[0], __WIN32__ ? '.exe' : undefined)

    const abortController = new AbortController()
    const abort = () => abortController.abort()

    conn.stderr.write(`Running ${hookName} hook...\n`)
    onHookProgress?.({ hookName, status: 'started', abort })

    const safeEnv = Object.fromEntries(
      Object.entries(proxyEnv).filter(
        ([k]) => k.startsWith('GIT_') && !excludedEnvVars.has(k)
      )
    )

    if (abortController.signal.aborted) {
      debug(`${hookName}: aborted before execution`)
      await exitWithError(conn, `hook ${hookName} aborted`)
      return
    }

    const args = [
      ...['hook', 'run', hookName],
      // We always copy our pre-auto-gc hook in order to be able to tell the
      // user that the reason their commit is taking so long is because Git is
      // performing garbage collection, but it's unlikely that the user has a
      // pre-auto-gc hook configured themselves, so we tell Git to ignore
      // missing hooks here.
      ...(hookName === 'pre-auto-gc' ? ['--ignore-missing'] : []),
      ...(hasStdin ? ['--to-stdin=/dev/stdin'] : []),
      '--',
      ...proxyArgs.slice(1),
    ]

    const terminalOutput: Buffer[] = []
    const gitPath = resolveGitBinary(resolve(__dirname, 'git'))
    const shellEnv = await getShellEnv(proxyCwd)

    if (shellEnv.kind === 'failure') {
      let errMsg = `Failed to load shell environment for hook ${hookName}.`
      debug(errMsg)

      if (shellEnv.shellKind) {
        const friendlyName = shellFriendlyNames[shellEnv.shellKind]
        if (shellEnv.shellKind === 'git-bash') {
          errMsg += `\n${friendlyName} not found. Please ensure Git for Windows is installed and added to your PATH.`
        } else {
          errMsg += `\n${friendlyName} not found. Please ensure it's installed and added to your PATH.`
        }
      }

      errMsg += '\n\nConfigure the shell to use in Preferences > Git > Hooks.'

      return exitWithError(conn, errMsg)
    }

    const { code, signal } = await new Promise<{
      code: number | null
      signal: NodeJS.Signals | null
    }>((resolve, reject) => {
      conn.on('close', abort)

      const child = spawn(gitPath, args, {
        cwd: proxyCwd,
        // GITHUB_DESKTOP lets hooks know they're run from GitHub Desktop.
        // See https://github.com/desktop/desktop/issues/19001
        env: { ...shellEnv.env, ...safeEnv, GITHUB_DESKTOP: '1' },
        signal: abortController.signal,
      })
        .on('close', (code, signal) => resolve({ code, signal }))
        .on('error', err => reject(err))

      // git-hook run takes care of ensuring we only get hook output on stderr
      // https://github.com/git/git/blob/4cf919bd7b946477798af5414a371b23fd68bf93/hook.c#L73C6-L73C22
      child.stderr.pipe(conn.stderr, { end: false }).on('error', reject)
      child.stderr.on('data', data => terminalOutput.push(data))
      conn.stdin.pipe(child.stdin).on('error', reject)
    })

    const elapsedSeconds = (Date.now() - startTime) / 1000

    if (signal !== null) {
      debug(`${hookName}: killed by signal ${signal} after ${elapsedSeconds}s`)
    } else {
      debug(`${hookName}: exited with code ${code} after ${elapsedSeconds}s`)
    }

    const ignoreError =
      code !== null &&
      code !== 0 &&
      !ignoredOnFailureHooks.includes(hookName) &&
      onHookFailure
        ? (await onHookFailure(hookName, terminalOutput)) === 'ignore'
        : false

    if (ignoreError) {
      debug(`ignoring error from hook ${hookName} as per onHookFailure result`)
    }

    const exitCode = ignoreError ? 0 : code ?? 1
    const terminationReason = signal
      ? `${hookName} hook killed by signal ${signal}`
      : `${hookName} hook exited with code ${exitCode}${
          ignoreError ? ' (ignored by user)' : ''
        }`

    await exitWithMessage(conn, terminationReason, exitCode)

    onHookProgress?.({
      hookName,
      status: exitCode === 0 ? 'finished' : 'failed',
    })
  }
}
