import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { kindleEmbedResolver, kindleResolveEmbed } from './kindle.js'

describe('kindleResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the card, the page and the cover from the ASIN', () => {
      const value =
        'https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_test&asin=1000000TST&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '1000000TST',
        src: 'https://read.amazon.com/kp/card?asin=1000000TST&preview=inline&linkCode=kpd',
        url: 'https://www.amazon.com/dp/1000000TST',
        thumbnail: 'https://m.media-amazon.com/images/P/1000000TST.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the storefront the card was written for', () => {
      const value = 'https://read.amazon.co.uk/kp/card?asin=1000000TST&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '1000000TST',
        src: 'https://read.amazon.co.uk/kp/card?asin=1000000TST&preview=inline&linkCode=kpd',
        url: 'https://www.amazon.co.uk/dp/1000000TST',
        thumbnail: 'https://m.media-amazon.com/images/P/1000000TST.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a card naming no ASIN', () => {
      const value = 'https://read.amazon.com/kp/card?preview=inline'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an ASIN outside its alphabet', () => {
      const value = 'https://read.amazon.com/kp/card?asin=../embed'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should read the card route with a trailing slash', () => {
      const value = 'https://read.amazon.com/kp/card/?asin=1000000TST'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '1000000TST',
        src: 'https://read.amazon.com/kp/card?asin=1000000TST&preview=inline&linkCode=kpd',
        url: 'https://www.amazon.com/dp/1000000TST',
        thumbnail: 'https://m.media-amazon.com/images/P/1000000TST.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore another route on the reader host', () => {
      const value = 'https://read.amazon.com/?asin=1000000TST'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('kindleEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kindleEmbedResolver)

  describe('happy paths', () => {
    it('should take the book title and the box the card declares', async () => {
      const value = html`
        <iframe
          title="A Book Title"
          type="text/html"
          width="720"
          height="550"
          frameborder="0"
          allowfullscreen
          style="max-width:100%"
          src="https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_test&asin=1000000TST&tag=kpembed-20"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '1000000TST',
        src: 'https://read.amazon.com/kp/card?asin=1000000TST&preview=inline&linkCode=kpd',
        url: 'https://www.amazon.com/dp/1000000TST',
        thumbnail: 'https://m.media-amazon.com/images/P/1000000TST.01._SCLZZZZZZZ_.jpg',
        width: 720,
        height: 550,
        title: 'A Book Title',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the card route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/read.amazon.com/kp/card?asin=1000000TST"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain of the reader host', async () => {
      const value = '<iframe src="https://x.read.amazon.com/kp/card?asin=1000000TST"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
