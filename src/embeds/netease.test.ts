import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { neteaseEmbedResolver, neteaseResolveEmbed } from './netease.js'

// Every `data-embed-*` field the placeholder carries, for the shape that only resolves once the
// pipeline has given its url a scheme.
const readPlaceholder = (
  result: string,
  parseHtml: (value: string) => Document,
): Record<string, string> => {
  const element = parseHtml(result).querySelector('[data-embed-src]')
  const fields: Record<string, string> = {}

  for (const name of element?.getAttributeNames() ?? []) {
    const value = element?.getAttribute(name)

    if (name.startsWith('data-embed-') && value) {
      fields[name.replace('data-embed-', '')] = value
    }
  }

  return fields
}

describe('neteaseResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the player and the song page from a song carrier', () => {
      const value = 'https://music.163.com/outchain/player?type=2&id=1392990601&auto=1&height=66'
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'song/1392990601',
        src: 'https://music.163.com/outchain/player?type=2&id=1392990601&height=66',
        url: 'https://music.163.com/song?id=1392990601',
      }

      expect(neteaseResolveEmbed(value)).toEqual(expected)
    })

    it('should name the playlist page for the playlist type', () => {
      const value = 'https://music.163.com/outchain/player?type=0&id=2105474477&auto=0&height=430'
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'playlist/2105474477',
        src: 'https://music.163.com/outchain/player?type=0&id=2105474477&height=430',
        url: 'https://music.163.com/playlist?id=2105474477',
      }

      expect(neteaseResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a type the player names no endpoint for', () => {
      const value = 'https://music.163.com/outchain/player?type=9&id=1392990601&height=66'

      expect(neteaseResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a type naming a member of the object prototype', () => {
      const value = 'https://music.163.com/outchain/player?type=toString&id=1392990601'

      expect(neteaseResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id that is not a number', () => {
      const value = 'https://music.163.com/outchain/player?type=2&id=../../evil&height=66'

      expect(neteaseResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the song page, which is not a player', () => {
      const value = 'https://music.163.com/song?id=1392990601'

      expect(neteaseResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should mint without a height when the carrier states none', () => {
      const value = 'https://music.163.com/outchain/player?type=1&id=34751981'
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'album/34751981',
        src: 'https://music.163.com/outchain/player?type=1&id=34751981',
        url: 'https://music.163.com/album?id=34751981',
      }

      expect(neteaseResolveEmbed(value)).toEqual(expected)
    })

    it('should read the player route with a trailing slash', () => {
      const value = 'https://music.163.com/outchain/player/?type=3&id=2497558110&height=66'
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'program/2497558110',
        src: 'https://music.163.com/outchain/player?type=3&id=2497558110&height=66',
        url: 'https://music.163.com/program?id=2497558110',
      }

      expect(neteaseResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the retired Flash widget', () => {
    it('should rebuild the player from the sid the swf names', () => {
      const value =
        'https://music.163.com/style/swf/widget.swf?sid=409872507&type=2&auto=0&width=320&height=66'
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'song/409872507',
        src: 'https://music.163.com/outchain/player?type=2&id=409872507&height=66',
        url: 'https://music.163.com/song?id=409872507',
      }

      expect(neteaseResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the swf without a sid', () => {
      const value = 'https://music.163.com/style/swf/widget.swf?type=2&auto=0'

      expect(neteaseResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('neteaseEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, neteaseEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://music.163.com/outchain/player?type=2&amp;id=1392990601&amp;auto=1&amp;height=66"
          width="330"
          height="86"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'netease',
        id: 'song/1392990601',
        src: 'https://music.163.com/outchain/player?type=2&id=1392990601&height=66',
        url: 'https://music.163.com/song?id=1392990601',
        width: 330,
        height: 86,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/music.163.com/outchain/player?type=2&id=1392990601"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('netease shapes the pipeline settles first', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  const placeholder = async (value: string): Promise<Record<string, string>> => {
    return readPlaceholder(await convert(value), parseHtml)
  }

  describe('the protocol-relative src the snippet generator writes', () => {
    it('should resolve once the url has a scheme', async () => {
      const value = html`
        <iframe
          src="//music.163.com/outchain/player?type=2&amp;id=1392990601&amp;auto=1&amp;height=66"
          width="330"
          height="86"
        ></iframe>
      `
      const expected: Record<string, string> = {
        provider: 'netease',
        id: 'song/1392990601',
        src: 'https://music.163.com/outchain/player?type=2&id=1392990601&height=66',
        url: 'https://music.163.com/song?id=1392990601',
        width: '330',
        height: '86',
      }

      expect(await placeholder(value)).toEqual(expected)
    })
  })
})
