import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ultimediaEmbedResolver } from './ultimedia.js'

describeForEachParser('ultimediaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ultimediaEmbedResolver)

  describe('happy paths', () => {
    it('should mint the player from the account key and the video id', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01357940/ml3ffr',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player from a protocol-relative src', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="//www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"
          width="600"
          height="336"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01357940/ml3ffr',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/',
        width: 600,
        height: 336,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a player url that ends at the video id', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01357940/ml3ffr',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/?ultimedia.com/deliver"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player url naming no video', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player url naming no account key', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/src/ml3ffr/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed video id as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ML3FFR/zone/1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01357940/ML3FFR',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ML3FFR/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore another route word carrying the player segments', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/musique/iframe/mdtk/01999636/src/83vrlm/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player segments under a prefixed path', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/x/deliver/generic/iframe/mdtk/01999636/src/83vrlm/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word that only ends in mdtk', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/xmdtk/01357940/src/ml3ffr/zone/1/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('what the rebuild drops', () => {
    it('should drop the zone that selects a publisher placement', async () => {
      const value = html`
        <iframe
          src="http://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/zone/6/showtitle/1/"
          width="430"
          height="300"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01999636/83vrlm',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/',
        width: 430,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop an autoplay segment', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/autoplay/no/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01999636/83vrlm',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a muteForced segment', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/muteForced/1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01999636/83vrlm',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the query', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01999636/83vrlm',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01999636/src/83vrlm/',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the legacy Flash player route', () => {
    it('should leave the iframe_pub.php player unresolved', async () => {
      const value = html`
        <iframe
          src="http://www.ultimedia.com/swf/iframe_pub.php?width=480&height=385&id=x5ll53&url_artist=http://example.com/clip.html"
          width="480"
          height="385"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ultimedia urls the pipeline absolutises first', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should hand the resolver an absolute src when the carrier was protocol-relative', async () => {
    const value = html`
      <iframe
        src="//www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"
        width="600"
        height="336"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="336"
        data-embed-width="600"
        data-embed-id="01357940/ml3ffr"
        data-embed-provider="ultimedia"
        data-embed-src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
