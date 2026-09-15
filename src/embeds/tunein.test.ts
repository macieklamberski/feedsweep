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

    it('should build a topic without a logo', () => {
      const value = 'http://tunein.com/embed/player/t102877112/'
      const expected: EmbedResolverResult = {
        provider: 'tunein',
        id: 't102877112',
        src: 'https://tunein.com/embed/player/t102877112/',
        url: 'https://tunein.com/radio/t102877112/',
      }

      expect(tuneinResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the station page itself', () => {
      const value = 'https://tunein.com/radio/s285269/'

      expect(tuneinResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a guide id of an unknown kind', () => {
      const value = 'https://tunein.com/embed/player/x285269/'

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
      const value = '<iframe src="https://evil.test/tunein.com/embed/player/s285269/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
