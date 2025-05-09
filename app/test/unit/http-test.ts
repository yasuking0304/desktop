import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getAbsoluteUrl } from '../../src/lib/http'
import { getDotComAPIEndpoint } from '../../src/lib/api'

describe('getAbsoluteUrl', () => {
  describe('dotcom endpoint', () => {
    const dotcomEndpoint = getDotComAPIEndpoint()

    it('handles leading slashes', () => {
      const result = getAbsoluteUrl(dotcomEndpoint, '/user/repos')
      assert.equal(result, 'https://api.github.com/user/repos')
    })

    it('handles missing leading slash', () => {
      const result = getAbsoluteUrl(dotcomEndpoint, 'user/repos')
      assert.equal(result, 'https://api.github.com/user/repos')
    })

    it("doesn't mangle encoded query parameters", () => {
      const result = getAbsoluteUrl(
        getDotComAPIEndpoint(),
        '/issues?since=2019-05-10T16%3A00%3A00Z'
      )
      assert.equal(
        result,
        'https://api.github.com/issues?since=2019-05-10T16%3A00%3A00Z'
      )
    })
  })

  describe('enterprise endpoint', () => {
    const enterpriseEndpoint = 'https://my-cool-company.com/api/v3'

    it('handles leading slash', () => {
      const result = getAbsoluteUrl(enterpriseEndpoint, '/user/repos')
      assert.equal(result, `${enterpriseEndpoint}/user/repos`)
    })

    it('handles missing leading slash', () => {
      const result = getAbsoluteUrl(enterpriseEndpoint, 'user/repos')
      assert.equal(result, `${enterpriseEndpoint}/user/repos`)
    })

    it('handles next page resource which already contains prefix', () => {
      const result = getAbsoluteUrl(
        enterpriseEndpoint,
        '/api/v3/user/repos?page=2'
      )
      assert.equal(result, `${enterpriseEndpoint}/user/repos?page=2`)
    })

    it("doesn't mangle encoded query parameters", () => {
      const result = getAbsoluteUrl(
        enterpriseEndpoint,
        '/issues?since=2019-05-10T16%3A00%3A00Z'
      )
      assert.equal(
        result,
        `${enterpriseEndpoint}/issues?since=2019-05-10T16%3A00%3A00Z`
      )
    })
  })
})
