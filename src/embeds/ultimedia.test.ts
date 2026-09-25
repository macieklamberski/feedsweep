import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ultimediaEmbedResolver } from './ultimedia.js'

describeForEachParser('ultimediaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ultimediaEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the generic player iframe', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01357940/ml3ffr',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should hand on a protocol-relative src as the markup wrote it', async () => {
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
        src: '//www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/',
        width: 600,
        height: 336,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player url naming no video', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read both ids when the options after them differ', async () => {
      const value =
        '<iframe src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01637594/src/ufz33q/zone/1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ultimedia',
        id: '01637594/ufz33q',
        src: 'https://www.ultimedia.com/deliver/generic/iframe/mdtk/01637594/src/ufz33q/zone/1/',
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
        data-embed-src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/showtitle/1/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the player url written on a video source playing', async () => {
    const value = html`
      <video controls>
        <source
          src="//www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/"
          type="video/mp4"
        />
      </video>
    `
    const expected = html`
      <video controls>
        <source
          src="https://www.ultimedia.com/deliver/generic/iframe/mdtk/01357940/src/ml3ffr/zone/1/"
          type="video/mp4"
        />
      </video>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
