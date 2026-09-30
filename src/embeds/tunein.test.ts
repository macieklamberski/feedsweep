import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { tuneinEmbedResolver, tuneinResolveEmbed } from './tunein.js'

describe('tuneinResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build a station with its logo', () => {
      const value = 'http://tunein.com/embed/player/s285269/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 's285269',
        src: 'https://tunein.com/embed/player/s285269/',
        url: 'https://tunein.com/radio/s285269/',
        thumbnail: 'https://cdn-radiotime-logos.tunein.com/s285269d.png',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })

    it('should build a program with its logo', () => {
      const value = 'https://tunein.com/embed/player/p894940/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 'p894940',
        src: 'https://tunein.com/embed/player/p894940/',
        url: 'https://tunein.com/radio/p894940/',
        thumbnail: 'https://cdn-radiotime-logos.tunein.com/p894940d.png',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })

    it('should build a topic without a page or a logo', () => {
      const value = 'http://tunein.com/embed/player/t102877112/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 't102877112',
        src: 'https://tunein.com/embed/player/t102877112/',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the station page itself', () => {
      const value = 'https://tunein.com/radio/s285269/'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })

    it('should use a guide id of an unknown kind as written, with no page and no logo', () => {
      const value = 'https://tunein.com/embed/player/x285269/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 'x285269',
        src: 'https://tunein.com/embed/player/x285269/',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the follow button', () => {
      const value = 'https://tunein.com/embed/follow/p950157/?wmode=opaque'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player route outside embed', () => {
      const value = 'https://tunein.com/foo/player/s285269/'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a segment after the guide id', () => {
      const value = 'https://tunein.com/embed/player/s285269/extra/'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed guide id as written, even if the player answers an error', () => {
      const value = 'https://tunein.com/embed/player/s285269abc/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 's285269abc',
        src: 'https://tunein.com/embed/player/s285269abc/',
        url: 'https://tunein.com/radio/s285269abc/',
        thumbnail: 'https://cdn-radiotime-logos.tunein.com/s285269abcd.png',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a guide id whose kind letter is a separator', () => {
      const value = 'https://tunein.com/embed/player/&285269/'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tuneinEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tuneinEmbedResolver)

  describe('happy paths', () => {
    it('should keep the height the player declares', async () => {
      const value = html`
        <iframe
          src="http://tunein.com/embed/player/s285269/"
          style="width:100%;height:100px;"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 's285269',
        src: 'https://tunein.com/embed/player/s285269/',
        url: 'https://tunein.com/radio/s285269/',
        thumbnail: 'https://cdn-radiotime-logos.tunein.com/s285269d.png',
        height: 100,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player in its path', async () => {
      const value = '<iframe src="https://evil.test/embed/player/s285269/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
