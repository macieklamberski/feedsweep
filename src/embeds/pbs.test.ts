import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { pbsEmbedResolver, pbsResolveEmbed } from './pbs.js'

describe('pbsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should key the numeric id to the viral route it arrived on', () => {
      const value = 'https://player.pbs.org/viralplayer/1234567890/'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/1234567890',
        src: 'https://player.pbs.org/viralplayer/1234567890/',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should give the widget route the same key, since the two serve each other', () => {
      const value = 'https://player.pbs.org/widget/partnerplayer/1234567890/?start=0&end=0'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/1234567890',
        src: 'https://player.pbs.org/widget/partnerplayer/1234567890/?start=0&end=0',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should read the base64 slug the partner route takes', () => {
      const value = 'https://player.pbs.org/partnerplayer/EsX-i4czzHyIj7zUjByxIg==/?endscreen=true'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'partnerplayer/EsX-i4czzHyIj7zUjByxIg==',
        src: 'https://player.pbs.org/partnerplayer/EsX-i4czzHyIj7zUjByxIg==/?endscreen=true',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a host that is not the player', () => {
      const value = 'https://evil.test/viralplayer/1234567890/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route naming a member of the object prototype', () => {
      const value = 'https://player.pbs.org/toString/1234567890/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route that is not one of the three players', () => {
      const value = 'https://player.pbs.org/portalplayer/1234567890/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player route naming no video', () => {
      const value = 'https://player.pbs.org/viralplayer/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under a player route', () => {
      const value = 'https://player.pbs.org/viralplayer/1234567890/captions/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id carrying a separator', () => {
      const value = 'https://player.pbs.org/viralplayer/1234%2F567890/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pbsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://player.pbs.org/viralplayer/1234567890/"
          width="512"
          height="332"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/1234567890',
        src: 'https://player.pbs.org/viralplayer/1234567890/',
        width: 512,
        height: 332,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://player.pbs.org.evil.test/viralplayer/1234567890/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/player.pbs.org/viralplayer/1234567890/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
