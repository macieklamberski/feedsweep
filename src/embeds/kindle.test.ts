import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { kindleEmbedResolver, kindleResolveEmbed } from './kindle.js'

describe('kindleResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the card and the cover from the ASIN', () => {
      const value =
        'https://read.amazon.com/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_dQVcnKwFnAcXcz&asin=B08DGQCKF3&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.com/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a British storefront card on its reader host', () => {
      const value = 'https://read.amazon.co.uk/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.co.uk/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a Canadian storefront card on its reader host', () => {
      const value = 'https://read.amazon.ca/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.ca/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep an Indian storefront card on its reader host', () => {
      const value = 'https://read.amazon.in/kp/card?asin=B08DGQCKF3&preview=inline'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B08DGQCKF3',
        src: 'https://read.amazon.in/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a German storefront card on its reader host', () => {
      const value =
        'https://lesen.amazon.de/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_IWygh7LxwTfj6U&asin=B019C57GLO&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B019C57GLO',
        src: 'https://lesen.amazon.de/kp/card?asin=B019C57GLO',
        thumbnail: 'https://m.media-amazon.com/images/P/B019C57GLO.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a Spanish storefront card on its reader host', () => {
      const value =
        'https://leer.amazon.es/kp/card?preview=inline&linkCode=ll1&ref_=k4w_oembed_CkjSxBKKfyfasn&asin=B09GKYBZTJ&tag=juandedev-21'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B09GKYBZTJ',
        src: 'https://leer.amazon.es/kp/card?asin=B09GKYBZTJ',
        thumbnail: 'https://m.media-amazon.com/images/P/B09GKYBZTJ.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep an Italian storefront card on its reader host', () => {
      const value =
        'https://leggi.amazon.it/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_T6RnpneE6MeNc7&asin=B0FP373343&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B0FP373343',
        src: 'https://leggi.amazon.it/kp/card?asin=B0FP373343',
        thumbnail: 'https://m.media-amazon.com/images/P/B0FP373343.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a French storefront card on its reader host', () => {
      const value =
        'https://lire.amazon.fr/kp/card?preview=inline&linkCode=kpd&ref_=k4w_oembed_auKhYtfwzPejGc&asin=1549720864&tag=kpembed-20'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '1549720864',
        src: 'https://lire.amazon.fr/kp/card?asin=1549720864',
        thumbnail: 'https://m.media-amazon.com/images/P/1549720864.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })

    it("should drop the publisher's associate tag and link code", () => {
      const value =
        'https://read.amazon.com.au/kp/card?preview=inline&linkCode=ll1&ref_=k4w_oembed_y0sSritwWwbv0o&asin=B09SLB7V48&tag=yusukeblog00-22'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B09SLB7V48',
        src: 'https://read.amazon.com.au/kp/card?asin=B09SLB7V48',
        thumbnail: 'https://m.media-amazon.com/images/P/B09SLB7V48.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a card naming no ASIN', () => {
      const value = 'https://read.amazon.com/kp/card?preview=inline'

      expect(kindleResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed ASIN as written, even if the card answers an error', () => {
      const value = 'https://read.amazon.com/kp/card?asin=../embed'
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: '../embed',
        src: 'https://read.amazon.com/kp/card?asin=..%2Fembed',
        thumbnail: 'https://m.media-amazon.com/images/P/..%2Fembed.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
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
        src: 'https://read.amazon.com/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
      }

      expect(kindleResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('kindleEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kindleEmbedResolver)

  describe('happy paths', () => {
    it('should take the book title and ignore the box WordPress declares', async () => {
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
        src: 'https://read.amazon.com/kp/card?asin=B08DGQCKF3',
        thumbnail: 'https://m.media-amazon.com/images/P/B08DGQCKF3.01._SCLZZZZZZZ_.jpg',
        height: 550,
        title: 'His Fake Wife: An Enemies to Lovers Billionaire Romance (Thorne Legacy Book 1)',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the book title from a German storefront card', async () => {
      const value = html`
        <iframe
          loading="lazy"
          title="Die gräulichen Drei und das X-Bollock: Bollock und die gräulichen Drei Teil 2"
          type="text/html"
          width="625"
          height="550"
          frameborder="0"
          allowfullscreen
          style="max-width:100%"
          src="https://lesen.amazon.de/kp/card?preview=inline&#038;linkCode=kpd&#038;ref_=k4w_oembed_IWygh7LxwTfj6U&#038;asin=B019C57GLO&#038;tag=kpembed-20"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kindle',
        id: 'B019C57GLO',
        src: 'https://lesen.amazon.de/kp/card?asin=B019C57GLO',
        thumbnail: 'https://m.media-amazon.com/images/P/B019C57GLO.01._SCLZZZZZZZ_.jpg',
        height: 550,
        title: 'Die gräulichen Drei und das X-Bollock: Bollock und die gräulichen Drei Teil 2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it("should ignore the share snippet's box and drop its new-tab preview", async () => {
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
        src: 'https://read.amazon.com/kp/card?asin=B09KT8838X',
        thumbnail: 'https://m.media-amazon.com/images/P/B09KT8838X.01._SCLZZZZZZZ_.jpg',
        height: 550,
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
