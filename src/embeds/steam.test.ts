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

    it('should keep the purchase option and the text the widget prints', () => {
      const value =
        'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C%202.5D%20action%20that%20combines%20elements%20of%20old-school%20shooters%20like%20Star-Control%20and%20action-RPGs%20like%20Diablo%20with%20an%20evolving%20weapons%20system,%2032-player%20dedicated%20servers,%20coop,%20and%20PVP.'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '249610',
        src: 'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C+2.5D+action+that+combines+elements+of+old-school+shooters+like+Star-Control+and+action-RPGs+like+Diablo+with+an+evolving+weapons+system%2C+32-player+dedicated+servers%2C+coop%2C+and+PVP.',
        url: 'https://store.steampowered.com/app/249610/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/249610/header.jpg',
        height: 190,
        description:
          'Top-down, 2.5D action that combines elements of old-school shooters like Star-Control and action-RPGs like Diablo with an evolving weapons system, 32-player dedicated servers, coop, and PVP.',
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking parameter beside the text', () => {
      const value =
        'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C%202.5D%20action%20that%20combines%20elements%20of%20old-school%20shooters%20like%20Star-Control%20and%20action-RPGs%20like%20Diablo%20with%20an%20evolving%20weapons%20system,%2032-player%20dedicated%20servers,%20coop,%20and%20PVP.&utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '249610',
        src: 'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C+2.5D+action+that+combines+elements+of+old-school+shooters+like+Star-Control+and+action-RPGs+like+Diablo+with+an+evolving+weapons+system%2C+32-player+dedicated+servers%2C+coop%2C+and+PVP.',
        url: 'https://store.steampowered.com/app/249610/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/249610/header.jpg',
        height: 190,
        description:
          'Top-down, 2.5D action that combines elements of old-school shooters like Star-Control and action-RPGs like Diablo with an evolving weapons system, 32-player dedicated servers, coop, and PVP.',
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the label language', () => {
      const value =
        'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C%202.5D%20action%20that%20combines%20elements%20of%20old-school%20shooters%20like%20Star-Control%20and%20action-RPGs%20like%20Diablo%20with%20an%20evolving%20weapons%20system,%2032-player%20dedicated%20servers,%20coop,%20and%20PVP.&l=german'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '249610',
        src: 'https://store.steampowered.com/widget/249610/30245/?t=Top-down%2C+2.5D+action+that+combines+elements+of+old-school+shooters+like+Star-Control+and+action-RPGs+like+Diablo+with+an+evolving+weapons+system%2C+32-player+dedicated+servers%2C+coop%2C+and+PVP.',
        url: 'https://store.steampowered.com/app/249610/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/249610/header.jpg',
        height: 190,
        description:
          'Top-down, 2.5D action that combines elements of old-school shooters like Star-Control and action-RPGs like Diablo with an evolving weapons system, 32-player dedicated servers, coop, and PVP.',
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the store page itself', () => {
      const value = 'https://store.steampowered.com/app/355060/'

      expect(steamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a package page, whose id is not an app id', () => {
      const value = 'https://store.steampowered.com/sub/62345/'

      expect(steamResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed app id as written, even if the widget answers an error', () => {
      const value = 'https://store.steampowered.com/widget/news'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: 'news',
        src: 'https://store.steampowered.com/widget/news/',
        url: 'https://store.steampowered.com/app/news/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/news/header.jpg',
        height: 190,
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed purchase option as written, even if the widget answers an error', () => {
      const value = 'https://store.steampowered.com/widget/355060/abc'
      const expected: EmbedResolverResult = {
        provider: 'steam',
        id: '355060',
        src: 'https://store.steampowered.com/widget/355060/abc/',
        url: 'https://store.steampowered.com/app/355060/',
        thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/355060/header.jpg',
        height: 190,
      }

      expect(steamResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('steamEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, steamEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the widget declares', async () => {
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
        height: 190,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the widget route', async () => {
      const value = '<iframe src="https://evil.test/widget/355060"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
