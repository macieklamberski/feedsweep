import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { steamEmbedResolver, steamResolveEmbed } from './steam.js'

describe('steamResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the widget url', () => {
      const value = 'https://store.steampowered.com/widget/355060'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '355060',
        src: 'https://store.steampowered.com/widget/355060/',
        url: 'https://store.steampowered.com/app/355060/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/355060/header.jpg',
        height: 190,
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the purchase option the widget names', () => {
      const value = 'https://store.steampowered.com/widget/355060/62345/?t=A%20game'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '355060',
        src: 'https://store.steampowered.com/widget/355060/62345/',
        url: 'https://store.steampowered.com/app/355060/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/355060/header.jpg',
        height: 190,
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the store page itself', () => {
      const value = 'https://store.steampowered.com/app/355060/Some_Game/'

      expect(steamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget whose app id is not a number', () => {
      const value = 'https://store.steampowered.com/widget/news'

      expect(steamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a purchase option that is not a number', () => {
      const value = 'https://store.steampowered.com/widget/355060/abc'

      expect(steamResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('steamEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, steamEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the widget declares', async () => {
      const value = html`
        <iframe
          src="https://store.steampowered.com/widget/355060"
          frameborder="0"
          width="646"
          height="190"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '355060',
        src: 'https://store.steampowered.com/widget/355060/',
        url: 'https://store.steampowered.com/app/355060/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/355060/header.jpg',
        width: 646,
        height: 190,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the widget route in its path', async () => {
      const value = html`
        <iframe src="https://evil.test/store.steampowered.com/widget/355060"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
