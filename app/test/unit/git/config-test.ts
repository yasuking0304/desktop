import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { exec } from 'dugite'
import * as Path from 'path'

import { Repository } from '../../../src/models/repository'
import {
  getConfigValue,
  getGlobalConfigPath,
  getGlobalConfigValue,
  setGlobalConfigValue,
  getGlobalBooleanConfigValue,
  git,
} from '../../../src/lib/git'

import { mkdirSync } from '../../helpers/temp'
import { setupFixtureRepository } from '../../helpers/repositories'
import { realpath } from 'fs/promises'

describe('git/config', () => {
  let repository: Repository

  beforeEach(async () => {
    const testRepoPath = await setupFixtureRepository('test-repo')
    repository = new Repository(testRepoPath, -1, null, false)
  })

  describe('config', () => {
    it('looks up config values', async () => {
      const bare = await getConfigValue(repository, 'core.bare')
      assert.equal(bare, 'false')
    })

    it('returns null for undefined values', async () => {
      const value = await getConfigValue(repository, 'core.the-meaning-of-life')
      assert(value === null)
    })
  })

  describe('GIT_CONFIG_PARAMETERS', () => {
    it('picks them up', async () => {
      const withoutEnvOutput = await git(
        ['config', 'desktop.test'],
        repository.path,
        '',
        { successExitCodes: new Set([1]) }
      ).then(x => x.stdout)

      assert.equal(
        withoutEnvOutput.length,
        0,
        'Expected withoutEnvOutput to be empty'
      )
      const withEnvOutput = await git(
        ['config', 'desktop.test'],
        repository.path,
        '',
        { env: { GIT_CONFIG_PARAMETERS: "'desktop.test=1'" } }
      ).then(x => x.stdout)

      assert.equal(withEnvOutput, '1\n')
    })

    it('takes precedence over GIT_CONFIG_*', async () => {
      const output = await git(['config', 'user.name'], repository.path, '', {
        env: {
          GIT_CONFIG_PARAMETERS: "'user.name=foobar'",
          GIT_CONFIG_COUNT: '1',
          GIT_CONFIG_KEY_0: 'user.name',
          GIT_CONFIG_VALUE_0: 'baz',
        },
      }).then(x => x.stdout)

      assert.equal(output, 'foobar\n')
    })
  })

  describe('global config', () => {
    const HOME = mkdirSync('global-config-here')
    const env = { HOME }
    const expectedConfigPath = Path.normalize(Path.join(HOME, '.gitconfig'))

    const baseArgs = ['config', '-f', expectedConfigPath]

    describe('getGlobalConfigPath', () => {
      beforeEach(async () => {
        // getGlobalConfigPath requires at least one entry, so the
        // test needs to setup an existing config value
        await exec([...baseArgs, 'user.name', 'bar'], __dirname)
      })

      it('gets the config path', async () => {
        const path = await getGlobalConfigPath(env)
        assert.equal(path, await realpath(expectedConfigPath))
      })
    })

    describe('setGlobalConfigValue', () => {
      const key = 'foo.bar'

      beforeEach(async () => {
        await exec([...baseArgs, '--add', key, 'first'], __dirname)
        await exec([...baseArgs, '--add', key, 'second'], __dirname)
      })

      it('will replace all entries for a global value', async () => {
        await setGlobalConfigValue(key, 'the correct value', env)
        const value = await getGlobalConfigValue(key, env)
        assert.equal(value, 'the correct value')
      })
    })

    describe('getGlobalBooleanConfigValue', () => {
      const key = 'foo.bar'

      it('treats "false" as false', async () => {
        await setGlobalConfigValue(key, 'false', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, false)
      })

      it('treats "off" as false', async () => {
        await setGlobalConfigValue(key, 'off', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, false)
      })

      it('treats "no" as false', async () => {
        await setGlobalConfigValue(key, 'no', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, false)
      })

      it('treats "0" as false', async () => {
        await setGlobalConfigValue(key, '0', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, false)
      })

      it('treats "true" as true', async () => {
        await setGlobalConfigValue(key, 'true', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, true)
      })

      it('treats "yes" as true', async () => {
        await setGlobalConfigValue(key, 'yes', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, true)
      })

      it('treats "on" as true', async () => {
        await setGlobalConfigValue(key, 'on', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, true)
      })

      it('treats "1" as true', async () => {
        await setGlobalConfigValue(key, '1', env)
        const value = await getGlobalBooleanConfigValue(key, env)
        assert.equal(value, true)
      })
    })
  })
})
