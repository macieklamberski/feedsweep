import { describe, expect, it } from 'bun:test'
import { isHostOf } from 'trousse'
import { baseContext } from '../tests.js'
import {
  cleanUrl,
  filterUrlQuery,
  parseUrlOnHosts,
  pickQueryParams,
  pickUrlParams,
  prepareUrl,
  readOrigin,
  repairCarrierUrl,
  repairUrl,
  resolveOrDropUrl,
  resolveOrKeepUrl,
} from './urls.js'

describe('parseUrlOnHosts', () => {
  const hosts = ['platform.example', 'other.example']

  it('should return the parsed url when it is on one of the hosts', () => {
    const value = 'https://platform.example/watch/123?v=1'

    expect(parseUrlOnHosts(value, hosts)?.pathname).toBe('/watch/123')
  })

  it('should accept a subdomain of a host', () => {
    const value = 'https://open.platform.example/track/123'

    expect(parseUrlOnHosts(value, hosts)?.hostname).toBe('open.platform.example')
  })

  it('should accept a listed host with an exact host check', () => {
    const value = 'https://platform.example/watch/123'

    expect(parseUrlOnHosts(value, hosts, isHostOf)?.hostname).toBe('platform.example')
  })

  it('should return undefined for a subdomain with an exact host check', () => {
    const value = 'https://cdn.platform.example/watch/123'

    expect(parseUrlOnHosts(value, hosts, isHostOf)).toBeUndefined()
  })

  it('should read a scheme followed by one slash as the host, not a path on the base', () => {
    const value = 'https:/platform.example/watch/123'

    expect(parseUrlOnHosts(value, hosts)?.hostname).toBe('platform.example')
  })

  it('should accept a protocol-relative url on a host', () => {
    const value = '//platform.example/watch/123'

    expect(parseUrlOnHosts(value, hosts)?.hostname).toBe('platform.example')
  })

  it('should trim whitespace around a query value', () => {
    const value = 'https://platform.example/watch?v=123 &t=10'

    expect(parseUrlOnHosts(value, hosts)?.searchParams.get('v')).toBe('123')
  })

  it('should trim whitespace around a path segment', () => {
    const value = 'https://platform.example/watch/123%20'

    expect(parseUrlOnHosts(value, hosts)?.pathname).toBe('/watch/123')
  })

  it('should repair a query glued onto the path after the host check', () => {
    const value = 'https://platform.example/v/123&t=6s'

    expect(parseUrlOnHosts(value, hosts)?.pathname).toBe('/v/123')
    expect(parseUrlOnHosts(value, hosts)?.searchParams.get('t')).toBe('6s')
  })

  it('should collapse a run of slashes in the path', () => {
    const value = 'https://platform.example//watch//123'

    expect(parseUrlOnHosts(value, hosts)?.pathname).toBe('/watch/123')
  })

  it('should hand a parsed url back once its host is checked', () => {
    const value = new URL('https://platform.example/v/123&t=6s')

    expect(parseUrlOnHosts(value, hosts)).toBe(value)
    expect(parseUrlOnHosts(new URL('https://elsewhere.example/v/1'), hosts)).toBeUndefined()
  })

  it('should fold a twice-escaped ampersand before the next parameter', () => {
    const value = 'https://platform.example/watch?v=123&amp;amp;key=abc'

    expect(parseUrlOnHosts(value, hosts)?.searchParams.get('key')).toBe('abc')
  })

  it('should fold an ampersand WordPress wrote as a percent-encoded entity', () => {
    const value = 'https://platform.example/watch?v=123&%23038;key=abc'

    expect(parseUrlOnHosts(value, hosts)?.searchParams.get('key')).toBe('abc')
  })

  it('should fold a percent-encoded WordPress ampersand a twice-escaped feed wrote', () => {
    const value = 'https://platform.example/watch?v=123&amp;%23038;key=abc'

    expect(parseUrlOnHosts(value, hosts)?.searchParams.get('key')).toBe('abc')
  })

  it('should return undefined for a url on another host', () => {
    expect(parseUrlOnHosts('https://elsewhere.example/watch/123', hosts)).toBeUndefined()
  })

  it('should return undefined for a host that only ends with the name', () => {
    expect(parseUrlOnHosts('https://notplatform.example/watch/123', hosts)).toBeUndefined()
  })

  it('should return undefined for a relative path', () => {
    expect(parseUrlOnHosts('/watch/123', hosts)).toBeUndefined()
  })

  it('should return undefined for an unparseable url', () => {
    expect(parseUrlOnHosts('http://[', hosts)).toBeUndefined()
  })

  it('should return undefined for an empty or undefined url', () => {
    expect(parseUrlOnHosts('', hosts)).toBeUndefined()
    expect(parseUrlOnHosts(undefined, hosts)).toBeUndefined()
  })
})

describe('readOrigin', () => {
  it('should return the origin of an http url', () => {
    const value = new URL('https://social.example:8443/@alice/109876543210987654')

    expect(readOrigin(value)).toBe('https://social.example:8443')
  })

  it('should return undefined for a javascript: url', () => {
    const value = new URL('javascript:/@alice/109876543210987654')

    expect(readOrigin(value)).toBeUndefined()
  })

  it('should return undefined for a data: url', () => {
    const value = new URL('data:text/html,/w/9c9de5e8-0a1b-4f6a-8a6a-2b1f1c0e7d3a')

    expect(readOrigin(value)).toBeUndefined()
  })

  it('should return undefined for a missing url', () => {
    expect(readOrigin(undefined)).toBeUndefined()
  })
})

describe('resolveOrKeepUrl', () => {
  it('should resolve a relative url against the base', () => {
    const valueUrl = '/img.jpg'
    const baseUrl = 'https://example.com/post/'
    const expectedUrl = 'https://example.com/img.jpg'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl })).toBe(expectedUrl)
  })

  it('should resolve a protocol-relative url to the base scheme', () => {
    const valueUrl = '//cdn.example/a.jpg'
    const baseUrl = 'https://example.com'
    const expectedUrl = 'https://cdn.example/a.jpg'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl })).toBe(expectedUrl)
  })

  it('should keep an absolute url unchanged', () => {
    const valueUrl = 'https://cdn.example/a.jpg'
    const baseUrl = 'https://example.com'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl })).toBe(valueUrl)
  })

  it('should keep a data: url unchanged', () => {
    const valueUrl = 'data:image/png;base64,AAA'
    const baseUrl = 'https://example.com'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl })).toBe(valueUrl)
  })

  it('should keep a non-http scheme url unchanged', () => {
    const valueUrl = 'ftp://files.example/a.zip'
    const baseUrl = 'https://example.com'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl })).toBe(valueUrl)
  })

  it('should keep a relative url when there is no base', () => {
    const valueUrl = '/img.jpg'

    expect(resolveOrKeepUrl(valueUrl, { ...baseContext, baseUrl: undefined })).toBe(valueUrl)
  })

  it('should return undefined for an undefined url', () => {
    const baseUrl = 'https://example.com'

    expect(resolveOrKeepUrl(undefined, { ...baseContext, baseUrl })).toBeUndefined()
  })
})

describe('resolveOrDropUrl', () => {
  it('should resolve a relative url against the base', () => {
    const valueUrl = '/img.jpg'
    const baseUrl = 'https://example.com/post/'
    const expectedUrl = 'https://example.com/img.jpg'

    expect(resolveOrDropUrl(valueUrl, { ...baseContext, baseUrl })).toBe(expectedUrl)
  })

  it('should drop a relative url when there is no base', () => {
    const valueUrl = '/img.jpg'

    expect(resolveOrDropUrl(valueUrl, { ...baseContext, baseUrl: undefined })).toBeUndefined()
  })

  it('should drop a url whose scheme the resolver refuses', () => {
    const valueUrl = 'javascript:alert(1)'
    const baseUrl = 'https://example.com'

    expect(resolveOrDropUrl(valueUrl, { ...baseContext, baseUrl })).toBeUndefined()
  })

  // A whitespace-only attribute would otherwise resolve to the base url itself, so the element
  // ends up pointing at the article it sits in.
  it('should return undefined for a whitespace-only url', () => {
    const valueUrl = '   '
    const baseUrl = 'https://example.com/post/'

    expect(resolveOrDropUrl(valueUrl, { ...baseContext, baseUrl })).toBeUndefined()
  })

  it('should return undefined for an undefined url', () => {
    const baseUrl = 'https://example.com'

    expect(resolveOrDropUrl(undefined, { ...baseContext, baseUrl })).toBeUndefined()
  })
})

describe('repairUrl', () => {
  it('should fold, collapse, fix the glued query and trim values in one chain', () => {
    const valueUrl = 'https://example.com//album/title&amp;source=gmail&ust= 1 '
    const expectedUrl = 'https://example.com/album/title?source=gmail&ust=1'

    expect(repairUrl(valueUrl)).toBe(expectedUrl)
  })

  it('should keep a url on another scheme as written, an escaped ampersand included', () => {
    const valueUrl = 'mailto:x@example.com?subject=hi&amp;body=there'

    expect(repairUrl(valueUrl)).toBe(valueUrl)
  })

  it('should keep an ampersand inside a slug as written', () => {
    const valueUrl = 'https://example.com/company/pack-&-cool-ltd'

    expect(repairUrl(valueUrl)).toBe(valueUrl)
  })

  it('should open the query at a bare word after a path ampersand', () => {
    const valueUrl = 'https://example.com/v/abc123&feature'
    const expectedUrl = 'https://example.com/v/abc123?feature'

    expect(repairUrl(valueUrl)).toBe(expectedUrl)
  })

  it('should keep an ampersand in a folder name before a file as written', () => {
    const valueUrl = 'https://example.com/x/a&b/img.jpg'

    expect(repairUrl(valueUrl)).toBe(valueUrl)
  })
})

describe('cleanUrl', () => {
  it('should return what the cleaner answers', () => {
    const valueUrl = 'https://example.com/post?utm_source=feed'
    const cleanUrlFn = (url: string) => url.split('?')[0] ?? url
    const expectedUrl = 'https://example.com/post'

    expect(cleanUrl(valueUrl, { ...baseContext, cleanUrlFn })).toBe(expectedUrl)
  })

  it('should hand the cleaner the repaired url', () => {
    const valueUrl = 'https://player.example.com/video/123?h=abc portrait=0&color=fff'
    const cleanUrlFn = (url: string) => url
    const expectedUrl = 'https://player.example.com/video/123?h=abc&portrait=0&color=fff'

    expect(cleanUrl(valueUrl, { ...baseContext, cleanUrlFn })).toBe(expectedUrl)
  })

  it('should keep the url when there is no cleaner', () => {
    const valueUrl = 'https://example.com/post?utm_source=feed'

    expect(cleanUrl(valueUrl, { ...baseContext, cleanUrlFn: undefined })).toBe(valueUrl)
  })

  // A cleaner that answers with an empty string has not answered. Taking it literally would put
  // an empty href on the element, which is a link back to the reader's own page.
  it('should keep the url when the cleaner answers with nothing', () => {
    const valueUrl = 'https://example.com/post'
    const cleanUrlFn = () => ''

    expect(cleanUrl(valueUrl, { ...baseContext, cleanUrlFn })).toBe(valueUrl)
  })

  it('should return undefined for an undefined url without calling the cleaner', () => {
    let called = false
    const cleanUrlFn = (url: string) => {
      called = true
      return url
    }

    expect(cleanUrl(undefined, { ...baseContext, cleanUrlFn })).toBeUndefined()
    expect(called).toBe(false)
  })
})

describe('prepareUrl', () => {
  it('should resolve the url before cleaning it', () => {
    const valueUrl = '/media/poster.jpg?utm_source=feed'
    const baseUrl = 'https://example.com/post'
    const cleanUrlFn = (url: string) => url.split('?')[0] ?? url
    const expectedUrl = 'https://example.com/media/poster.jpg'

    expect(prepareUrl(valueUrl, { ...baseContext, baseUrl, cleanUrlFn })).toBe(expectedUrl)
  })

  it('should return undefined for an undefined url', () => {
    expect(prepareUrl(undefined, baseContext)).toBeUndefined()
  })
})

describe('pickQueryParams', () => {
  it('should keep only the named parameters', () => {
    const value = 'start=90&autoplay=1&list=PLabc'
    const expected = { start: '90', list: 'PLabc' }

    expect(pickQueryParams(value, ['start', 'list'])).toEqual(expected)
  })

  it('should state nothing when none are present', () => {
    const value = 'autoplay=1&rel=0'

    expect(pickQueryParams(value, ['start'])).toEqual({})
  })

  it('should state nothing for an empty query', () => {
    expect(pickQueryParams('', ['start'])).toEqual({})
  })

  it('should skip a parameter present but empty', () => {
    expect(pickQueryParams('start=', ['start'])).toEqual({})
  })

  // The query arrives from an attribute, so it may carry the punctuation a url would have
  // percent-encoded; `URLSearchParams` decodes it the same way either way.
  it('should decode a value that arrived encoded', () => {
    const value = 'clipt=a%2Bb%2Fc'
    const expected = { clipt: 'a+b/c' }

    expect(pickQueryParams(value, ['clipt'])).toEqual(expected)
  })

  it('should take the first of a repeated parameter', () => {
    const value = 'start=10&start=90'
    const expected = { start: '10' }

    expect(pickQueryParams(value, ['start'])).toEqual(expected)
  })

  it('should trim whitespace around a value', () => {
    const value = 'start=90%20&list=PLabc'
    const expected = { start: '90' }

    expect(pickQueryParams(value, ['start'])).toEqual(expected)
  })
})

describe('repairCarrierUrl', () => {
  it('should open a query glued onto the path', () => {
    const value = 'https://platform.example/v/abc123&hl=en'
    const expected = 'https://platform.example/v/abc123?hl=en'

    expect(repairCarrierUrl(value)).toBe(expected)
  })

  it('should trim whitespace around a query value', () => {
    const value = 'https://platform.example/show?user=123@N03 &tags='
    const expected = 'https://platform.example/show?user=123@N03&tags='

    expect(repairCarrierUrl(value)).toBe(expected)
  })

  it('should trim whitespace around a value the glued query opened', () => {
    const value = 'https://platform.example/v/abc123%20&hl=en'
    const expected = 'https://platform.example/v/abc123?hl=en'

    expect(repairCarrierUrl(value)).toBe(expected)
  })
})

describe('filterUrlQuery', () => {
  const isKept = (name: string) => {
    return name === 'file' || name.startsWith('pwc[')
  }

  it('should keep only the pairs the predicate accepts, in the order written', () => {
    const value = new URL('https://example.com/e?utm_source=feed&file=a.ts&fbclid=abc')

    expect(filterUrlQuery(value, isKept)).toBe('?file=a.ts')
  })

  it('should keep a repeated parameter once per pair', () => {
    const value = new URL('https://example.com/e?file=a.ts&file=b.ts')

    expect(filterUrlQuery(value, isKept)).toBe('?file=a.ts&file=b.ts')
  })

  it('should keep a bracketed name as written', () => {
    const value = new URL('https://example.com/e?pwc[size]=fit')

    expect(filterUrlQuery(value, isKept)).toBe('?pwc[size]=fit')
  })

  it('should return an empty string when nothing is kept', () => {
    const value = new URL('https://example.com/e?utm_source=feed')

    expect(filterUrlQuery(value, isKept)).toBe('')
  })

  it('should return an empty string for a url with no query', () => {
    const value = new URL('https://example.com/e')

    expect(filterUrlQuery(value, isKept)).toBe('')
  })
})

describe('pickUrlParams', () => {
  it('should keep only the named parameters, in the order given', () => {
    const value = 'https://example.com/e/x?utm_source=feed&index=4&list=PLabc&start=90'
    const expected = '?start=90&list=PLabc&index=4'

    expect(pickUrlParams(new URL(value), ['start', 'list', 'index'])).toBe(expected)
  })

  it('should return an empty string when none are present', () => {
    const value = 'https://example.com/e/x?utm_source=feed'
    const expected = ''

    expect(pickUrlParams(new URL(value), ['start'])).toBe(expected)
  })

  it('should return an empty string when there is no query', () => {
    expect(pickUrlParams(new URL('https://example.com/e/x'), ['start'])).toBe('')
  })

  it('should skip a parameter present but empty', () => {
    expect(pickUrlParams(new URL('https://example.com/e/x?start='), ['start'])).toBe('')
  })

  it('should escape a decoded plus sign and write a decoded slash back bare', () => {
    const value = 'https://example.com/e/x?clipt=a%2Bb%2Fc'
    const expected = '?clipt=a%2Bb/c'

    expect(pickUrlParams(new URL(value), ['clipt'])).toBe(expected)
  })
})
