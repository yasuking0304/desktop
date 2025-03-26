import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  hasShownWelcomeFlow,
  markWelcomeFlowComplete,
} from '../../src/lib/welcome'

describe('Welcome', () => {
  const key = 'has-shown-welcome-flow'

  describe('hasShownWelcomeFlow', () => {
    beforeEach(() => {
      localStorage.removeItem(key)
    })

    it('defaults to false when no value found', () => {
      assert.equal(hasShownWelcomeFlow(), false)
    })

    it('returns false for some non-numeric value', () => {
      localStorage.setItem(key, 'a')
      assert.equal(hasShownWelcomeFlow(), false)
    })

    it('returns false when zero found', () => {
      localStorage.setItem(key, '0')
      assert.equal(hasShownWelcomeFlow(), false)
    })

    it('returns true when one found', () => {
      localStorage.setItem(key, '1')
      assert.equal(hasShownWelcomeFlow(), true)
    })
  })

  describe('markWelcomeFlowComplete', () => {
    it('sets localStorage to 1', () => {
      markWelcomeFlowComplete()
      const value = localStorage.getItem(key)
      assert.equal(value, '1')
    })
  })
})
