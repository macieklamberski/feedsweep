import { describe, expect, it } from 'bun:test'
import { describeForEachParser, queryElement } from '../tests.js'
import type { CiteResolverResult } from '../types.js'
import { buildCite, readLinkHandle } from './cites.js'

describe('buildCite', () => {
  describe('happy paths', () => {
    it('should trim every text field', () => {
      const value = {
        provider: 'stub',
        url: ' https://example.com/post ',
        title: '  Page title\n',
        description: ' Preview text ',
        author: ' Author name ',
        publisher: ' example.com ',
        icon: ' https://example.com/i.ico ',
        thumbnail: ' https://example.com/t.jpg ',
      }
      const expected: CiteResolverResult = {
        provider: 'stub',
        url: 'https://example.com/post',
        title: 'Page title',
        description: 'Preview text',
        author: 'Author name',
        publisher: 'example.com',
        icon: 'https://example.com/i.ico',
        thumbnail: 'https://example.com/t.jpg',
      }

      expect(buildCite(value)).toEqual(expected)
    })

    it('should keep non-text fields as they are', () => {
      const value = {
        provider: 'stub',
        url: 'https://example.com/post',
        title: 'Page title',
        kind: 'reply',
      } as const
      const expected = 'reply'

      expect(buildCite(value)?.kind).toBe(expected)
    })
  })

  describe('edge cases', () => {
    it('should drop fields that are blank or nullish', () => {
      const value = {
        provider: 'stub',
        url: 'https://example.com/post',
        title: 'Page title',
        description: '   ',
        author: null,
        publisher: undefined,
      }
      const result = buildCite(value)

      expect(result?.description).toBeUndefined()
      expect(result?.author).toBeUndefined()
      expect(result?.publisher).toBeUndefined()
    })

    it('should drop a non-string optional field from a JSON payload', () => {
      const value = JSON.parse(
        '{"provider":"stub","url":"https://example.com/post","title":"Page title","author":42,"thumbnail":["https://example.com/t.jpg"]}',
      )
      const expected: CiteResolverResult = {
        provider: 'stub',
        url: 'https://example.com/post',
        title: 'Page title',
      }

      expect(buildCite(value)).toEqual(expected)
    })

    it('should accept a null url or title from a raw DOM read', () => {
      const value = { provider: 'stub', url: null, title: null }

      expect(buildCite(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should return undefined when the url is missing', () => {
      const value = { provider: 'stub', title: 'Page title' }

      expect(buildCite(value)).toBeUndefined()
    })

    it('should return undefined when the title is missing', () => {
      const value = { provider: 'stub', url: 'https://example.com/post' }

      expect(buildCite(value)).toBeUndefined()
    })

    it('should return undefined when the url or the title is not a string', () => {
      const url = JSON.parse('{"provider":"stub","url":42,"title":"Page title"}')
      const title = JSON.parse('{"provider":"stub","url":"https://example.com","title":{}}')

      expect(buildCite(url)).toBeUndefined()
      expect(buildCite(title)).toBeUndefined()
    })

    it('should return undefined when the url or the title is blank', () => {
      expect(buildCite({ provider: 'stub', url: '  ', title: 'Page title' })).toBeUndefined()
      expect(
        buildCite({ provider: 'stub', url: 'https://example.com', title: ' ' }),
      ).toBeUndefined()
    })
  })
})

describeForEachParser('readLinkHandle', (parseHtml) => {
  it('should read the handle off a relative byline link', () => {
    const document = parseHtml('<a href="/author">Author name</a>')

    expect(readLinkHandle(queryElement(document, 'a'))).toBe('author')
  })

  it('should read the handle off an absolute byline link', () => {
    const document = parseHtml('<a href="https://example.com/author?tab=posts">Author name</a>')

    expect(readLinkHandle(queryElement(document, 'a'))).toBe('author')
  })

  it('should return undefined for a link with no href', () => {
    const document = parseHtml('<a>Author name</a>')

    expect(readLinkHandle(queryElement(document, 'a'))).toBeUndefined()
  })

  it('should return undefined for a nullish element', () => {
    expect(readLinkHandle(undefined)).toBeUndefined()
  })
})
