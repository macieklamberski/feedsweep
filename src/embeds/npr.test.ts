import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { nprEmbedResolver, nprResolveEmbed } from './npr.js'

describe('nprResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the story and the media as one id', () => {
      const value = 'https://www.npr.org/player/embed/550179668/551339989'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '550179668/551339989',
        src: 'https://www.npr.org/player/embed/550179668/551339989',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should read the same pair off the retired Flash player', () => {
      const value = 'http://www.npr.org/v2/?i=340005056&m=340005057&t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })

    it('should read a Flash player spelled without its trailing slash', () => {
      const value = 'http://www.npr.org/v2?i=340005056&m=340005057&t=audio'
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
      }

      expect(nprResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a story page', () => {
      const value = 'https://www.npr.org/sections/thetwo-way/2017/01/01/500000000/a-story'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player naming one id only', () => {
      const value = 'https://www.npr.org/player/embed/550179668'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a Flash player naming no media', () => {
      const value = 'http://www.npr.org/v2/?i=340005056&t=audio'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id that is not a number', () => {
      const value = 'https://www.npr.org/player/embed/latest/current'

      expect(nprResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('nprEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nprEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the Flash carrier declared', async () => {
      const value = html`
        <embed
          allowfullscreen="true"
          base="http://www.npr.org"
          height="386"
          src="http://www.npr.org/v2/?i=340005056&m=340005057&t=audio"
          type="application/x-shockwave-flash"
          width="400"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'npr',
        id: '340005056/340005057',
        src: 'https://www.npr.org/player/embed/340005056/340005057',
        width: 400,
        height: 386,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player in its path', async () => {
      const value = '<iframe src="https://evil.test/npr.org/player/embed/1/2"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
