import { describe, it } from 'node:test'
import assert from 'node:assert'
import { gitAuthorNameIsValid } from '../../src/ui/lib/identifier-rules'

describe('Identifier rules', () => {
  describe('gitAuthorNameIsValid', () => {
    it('returns any value that is a disallowed character', () => {
      assert.equal(gitAuthorNameIsValid('.'), false)
      assert.equal(gitAuthorNameIsValid(','), false)
      assert.equal(gitAuthorNameIsValid(':'), false)
      assert.equal(gitAuthorNameIsValid(';'), false)
      assert.equal(gitAuthorNameIsValid('<'), false)
      assert.equal(gitAuthorNameIsValid('>'), false)
      assert.equal(gitAuthorNameIsValid('"'), false)
      assert.equal(gitAuthorNameIsValid('\\'), false)
      assert.equal(gitAuthorNameIsValid("'"), false)
      assert.equal(gitAuthorNameIsValid(' '), false)
    })

    it('returns true for empty strings', () => {
      assert.equal(gitAuthorNameIsValid(''), true)
    })

    it('returns false when name consists only of ascii character codes 0-32 inclusive', () => {
      for (let i = 0; i <= 32; i++) {
        const char = String.fromCharCode(i)
        assert.equal(gitAuthorNameIsValid(char), false)
      }
    })

    it('returns false when name consists solely of disallowed characters', () => {
      assert.equal(gitAuthorNameIsValid('.;:<>'), false)
    })

    it('returns true if the value consists of allowed characters', () => {
      assert.equal(gitAuthorNameIsValid('this is great'), true)
    })

    it('returns true if the value contains allowed characters with disallowed characters', () => {
      const allowed = `;hi. there;${String.fromCharCode(31)}`
      assert.equal(gitAuthorNameIsValid(allowed), true)
    })

    it('returns true if the value contains ASCII characters whose code point is greater than 32', () => {
      const allowed = String.fromCharCode(33)
      assert.equal(gitAuthorNameIsValid(allowed), true)
    })
  })
})
