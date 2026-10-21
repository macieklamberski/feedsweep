import { describe, expect, it } from 'bun:test'
import { checkDuplicatePatterns, checkLengths, checkLines, checkSharedCopies } from './checks.js'

describe('checkLines', () => {
  it('should flag a local alias of a shared regex', () => {
    const value = 'const videoIdRegex = hexRegex'
    const expected = ['regex-alias']

    expect(checkLines('src/embeds/acme.ts', value).map((finding) => finding.check)).toEqual(
      expected,
    )
  })

  it('should flag a hand-written keepIfMatches', () => {
    const value = '  const id = slug && digitsRegex.test(slug) ? slug : undefined'
    const expected = ['hand-kept-value']

    expect(checkLines('src/embeds/acme.ts', value).map((finding) => finding.check)).toEqual(
      expected,
    )
  })

  it('should flag a hand-written list of format extensions', () => {
    const value = [
      'const suffixRegex = /\\.(?:rss|atom|json)$/i',
      "const suffixes = ['.rss', '.xml']",
    ].join('\n')
    const expected = ['extension-list', 'extension-list']

    expect(checkLines('src/embeds/acme.ts', value).map((finding) => finding.check)).toEqual(
      expected,
    )
  })

  it('should pass an alternation of top-level domains after a host label', () => {
    const value = 'const hostRegex = /^books\\.google\\.(?:com|de)$/'

    expect(checkLines('src/embeds/acme.ts', value)).toEqual([])
  })

  it('should pass a list of media file kinds', () => {
    const value = 'const renderPathRegex = /\\/a\\/([^/]+)\\.(?:svg|png)/'

    expect(checkLines('src/embeds/acme.ts', value)).toEqual([])
  })

  it('should pass a media file regex', () => {
    const value = 'const fileRegex = /\\.(mp3|m4a|aac)$/i'

    expect(checkLines('src/media/acme.ts', value)).toEqual([])
  })

  it('should skip prose in comments', () => {
    const value = "// A suffix such as '.rss', '.xml' marks a feed."

    expect(checkLines('src/embeds/acme.ts', value)).toEqual([])
  })

  it('should skip tests and the shared utils', () => {
    const value = 'const videoIdRegex = hexRegex'

    expect(checkLines('src/embeds/acme.test.ts', value)).toEqual([])
    expect(checkLines('src/utils/urls.ts', value)).toEqual([])
  })
})

describe('checkLengths', () => {
  it('should flag a length in a regex and on a value', () => {
    const value = [
      'const idRegex = /^\\d{5,}$/',
      '  if (id.length !== 22) {',
      '  if (segments.length !== 3) {',
      '  if (id.length === shareTokenLength) {',
    ].join('\n')
    const expected = [1, 2, 4]

    expect(checkLengths('src/embeds/acme.ts', value).map((finding) => finding.line)).toEqual(
      expected,
    )
  })

  it('should pass a count of sibling elements in a run', () => {
    const value = '      if (run.length < 2) {'

    expect(checkLengths('src/transforms/dom/acme.ts', value)).toEqual([])
  })

  it('should pass a date route', () => {
    const value = 'const pathDateRegex = /\\/(\\d{4})\\/(0[1-9]|1[0-2])\\/(\\d{2})\\//'

    expect(checkLengths('src/embeds/acme.ts', value)).toEqual([])
  })

  it('should pass a length under its marker', () => {
    const value = [
      '// length: keeps example.com/w/embed/ ids out',
      '// Short ids are base58.',
      'const shortIdRegex = /^[1-9A-HJ-NP-Za-km-z]{22}$/',
    ].join('\n')

    expect(checkLengths('src/embeds/acme.ts', value)).toEqual([])
  })

  it('should read the marker only for the line below its block', () => {
    const value = [
      '// length: keeps example.com/w/embed/ ids out',
      'const shortIdRegex = /^[0-9a-z]{22}$/',
      'const longIdRegex = /^[0-9a-z]{36}$/',
    ].join('\n')
    const expected = [3]

    expect(checkLengths('src/embeds/acme.ts', value).map((finding) => finding.line)).toEqual(
      expected,
    )
  })
})

describe('checkSharedCopies', () => {
  it('should flag a literal that spells a shared regex', () => {
    const value = '  if (!/^\\d+$/.test(id)) {'
    const shared = [{ name: 'digitsRegex', source: '^\\d+$' }]
    const expected = ['shared-copy']
    const findings = checkSharedCopies('src/embeds/acme.ts', value, shared)

    expect(findings.map((finding) => finding.check)).toEqual(expected)
  })

  it('should pass the shared regex in its own module', () => {
    const value = 'export const digitsRegex = /^\\d+$/'
    const shared = [{ name: 'digitsRegex', source: '^\\d+$' }]

    expect(checkSharedCopies('src/utils/urls.ts', value, shared)).toEqual([])
  })
})

describe('checkDuplicatePatterns', () => {
  it('should flag an anchored value pattern written in two modules', () => {
    const value = {
      'src/embeds/acme.ts': 'const idRegex = /^[a-z0-9_]+$/i',
      'src/embeds/beta.ts': 'const slugRegex = /^[a-z0-9_]+$/i',
      'src/embeds/gamma.ts': 'const pathRegex = /^\\/v\\/(\\d+)$/',
    }
    const expected = ['src/embeds/acme.ts', 'src/embeds/beta.ts']

    expect(checkDuplicatePatterns(value, []).map((finding) => finding.file)).toEqual(expected)
  })

  it('should pass a pattern under a length marker', () => {
    const value = {
      'src/embeds/acme.ts': '// length: keeps a route word out\nconst localeRegex = /^[a-z]{2}$/',
      'src/embeds/beta.ts': '// length: keeps a handle out\nconst localeRegex = /^[a-z]{2}$/',
    }

    expect(checkDuplicatePatterns(value, [])).toEqual([])
  })

  it('should pass a global replace pattern', () => {
    const value = {
      'src/transforms/dom/acme.ts': "const slug = text.replace(/^-+|-+$/g, '')",
      'src/transforms/dom/beta.ts': "const id = text.replace(/^-+|-+$/g, '')",
    }

    expect(checkDuplicatePatterns(value, [])).toEqual([])
  })

  it('should leave a copy of a shared regex to the shared-copy check', () => {
    const value = {
      'src/embeds/acme.ts': 'const idRegex = /^\\d+$/',
      'src/embeds/beta.ts': 'const slugRegex = /^\\d+$/',
    }
    const shared = [{ name: 'digitsRegex', source: '^\\d+$' }]

    expect(checkDuplicatePatterns(value, shared)).toEqual([])
  })
})
