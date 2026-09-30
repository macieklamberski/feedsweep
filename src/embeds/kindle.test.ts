import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { kindleEmbedResolver, kindleResolveEmbed } from './kindle.js'

describe('kindleResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the card, the page and the cover from the ASIN', () => {
      const value =
        'https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_dQVcnKwFnAcXcz&asin=B08DGQCKF3&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_dQVcnKwFnAcXcz&asin=B08DGQCKF3&tag=kpembed-20',
        url: 'https://www.amazon.com/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the storefront the card was written for', () => {
      const value = 'https://read.amazon.co.uk/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.co.uk/kp/card?asin=B08DGQCKF3&preview=inline',
        url: 'https://www.amazon.co.uk/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the Canadian storefront', () => {
      const value = 'https://read.amazon.ca/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.ca/kp/card?asin=B08DGQCKF3&preview=inline',
        url: 'https://www.amazon.ca/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the Indian storefront', () => {
      const value = 'https://read.amazon.in/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.in/kp/card?asin=B08DGQCKF3&preview=inline',
        url: 'https://www.amazon.in/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it("should carry the publisher's associate tag and link code", () => {
      const value =
        'https://read.amazon.com.au/kp/card?preview=inline&linkCode=ll1&ref_=k4w_oembed_y0sSritwWwbv0o&asin=B09SLB7V48&tag=yusukeblog00-22'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B09SLB7V48',
        src: 'https://read.amazon.com.au/kp/card?preview=inline&linkCode=ll1&ref_=k4w_oembed_y0sSritwWwbv0o&asin=B09SLB7V48&tag=yusukeblog00-22',
        thumbnail: 'https://m.media-amazon.com/images/P/B09SLB7V48.01._SCLZZZZZZZ_.jpg',
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

    it('should ignore an ASIN led by a dot segment', () => {
      const value = 'https://read.amazon.com/kp/card?asin=../B08DGQCKF3'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an ASIN trailed by a dot segment', () => {
      const value = 'https://read.amazon.com/kp/card?asin=B08DGQCKF3/..'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    // Each ASIN holds one separator and no dot, so only the separator refuses it.
    const separatorAsinUrls: Array<string> = [
      'https://read.amazon.com/kp/card?asin=B08DGQCKF3/EMBED',
      'https://read.amazon.com/kp/card?asin=B08DGQCKF3%3FEMBED',
      'https://read.amazon.com/kp/card?asin=B08DGQCKF3%26EMBED',
      'https://read.amazon.com/kp/card?asin=B08DGQCKF3%3DEMBED',
      'https://read.amazon.com/kp/card?asin=B08DGQCKF3%23EMBED',
    ]

    it.each(separatorAsinUrls)('should ignore %s, an ASIN carrying a separator', (value) => {
      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the card route under another path', () => {
      const value = 'https://read.amazon.com/x/kp/card?asin=B08DGQCKF3'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route extending the card route', () => {
      const value = 'https://read.amazon.com/kp/cards?asin=B08DGQCKF3'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the card route with a trailing slash', () => {
      const value = 'https://read.amazon.com/kp/card/?asin=B08DGQCKF3'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.com/kp/card/?asin=B08DGQCKF3',
        url: 'https://www.amazon.com/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should leave the product page unset on the reader host that serves two stores', () => {
      const value = 'https://read.amazon.com.au/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.com.au/kp/card?asin=B08DGQCKF3&preview=inline',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('kindleEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kindleEmbedResolver)

  describe('happy paths', () => {
    it('should take the book title and keep the box WordPress declares', async () => {
      const value = html`
        <iframe
          title="His Fake Wife: An Enemies to Lovers Billionaire Romance (Thorne Legacy Book 1)"
          type="text/html"
          width="1080"
          height="550"
          frameborder="0"
          allowfullscreen
          style="max-width:100%"
          src="https://read.amazon.com/kp/card?preview=inline&#038;linkCode=kpd&#038;ref_=k4w_oembed_dQVcnKwFnAcXcz&#038;asin=B08DGQCKF3&#038;tag=kpembed-20"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_dQVcnKwFnAcXcz&asin=B08DGQCKF3&tag=kpembed-20',
        url: 'https://www.amazon.com/dp/B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        width: 1080,
        height: 550,
        title: 'His Fake Wife: An Enemies to Lovers Billionaire Romance (Thorne Legacy Book 1)',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it("should keep the share snippet's box and its new-tab preview", async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="362"
          src="https://read.amazon.com/kp/card?asin=B09KT8838X&amp;preview=newtab&amp;linkCode=kpe&amp;ref_=cm_sw_r_kb_dp_WANT1RK5JJX35VAMQE8X&amp;hideBuy=true&amp;hideShare=true"
          style="max-width: 100%;"
          type="text/html"
          width="212"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B09KT8838X',
        src: 'https://read.amazon.com/kp/card?asin=B09KT8838X&preview=newtab&linkCode=kpe&ref_=cm_sw_r_kb_dp_WANT1RK5JJX35VAMQE8X&hideBuy=true&hideShare=true',
        url: 'https://www.amazon.com/dp/B09KT8838X',
        thumbnail: 'https://m.media-amazon.com/images/P/B09KT8838X.01._SCLZZZZZZZ_.jpg',
        width: 212,
        height: 362,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the card route on a foreign host', async () => {
      const value = '<iframe src="https://evil.test/kp/card?asin=B08DGQCKF3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain of the reader host', async () => {
      const value = '<iframe src="https://x.read.amazon.com/kp/card?asin=B08DGQCKF3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
