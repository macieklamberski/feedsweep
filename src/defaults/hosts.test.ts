import { describe, expect, it } from 'bun:test'
import { defaultTrackingUrls } from './hosts.js'

const bareHostRegex = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/

describe('defaultTrackingUrls', () => {
  it.each(defaultTrackingUrls)('should name $host as a bare lowercase host', ({ host }) => {
    expect(host).toMatch(bareHostRegex)
  })

  it.each(defaultTrackingUrls)('should anchor the path of $host at the start', ({ path }) => {
    expect(path === undefined || path.source.startsWith('^')).toBe(true)
  })
})
