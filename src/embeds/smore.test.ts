import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { smoreEmbedResolver } from './smore.js'

describeForEachParser('smoreEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, smoreEmbedResolver)

  describe('happy paths', () => {
    it('should mint the newsletter from the legacy host the embed dialog wrote', async () => {
      const value = html`
        <iframe
          width="100%"
          height="600"
          src="https://www.smore.com/2gc5u-mediawijsheid?embed=1"
          scrolling="auto"
          frameborder="0"
          allowtransparency="true"
          style="min-width: 320px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: '2gc5u',
        src: 'https://app.smore.com/n/2gc5u?embedded',
        url: 'https://app.smore.com/n/2gc5u',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the newsletter name from the frame the current dialog writes', async () => {
      const value = html`
        <iframe
          width="100%"
          height="600"
          src="https://app.smore.com/n/5h2uw?embedded"
          title="Beardie Beat"
          scrolling="auto"
          frameborder="0"
          allowtransparency="true"
          style="min-width: 320px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: '5h2uw',
        src: 'https://app.smore.com/n/5h2uw?embedded',
        url: 'https://app.smore.com/n/5h2uw',
        height: 600,
        title: 'Beardie Beat',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the newsletter from the secure host', async () => {
      const value = html`
        <iframe
          loading="lazy"
          width="100%"
          height="600"
          src="https://secure.smore.com/n/mbv7u?embed=1"
          title="NCBCC Herding Instinct Test"
          scrolling="auto"
          frameborder="0"
          allowtransparency="true"
          style="min-width: 320px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: 'mbv7u',
        src: 'https://app.smore.com/n/mbv7u?embedded',
        url: 'https://app.smore.com/n/mbv7u',
        height: 600,
        title: 'NCBCC Herding Instinct Test',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the slug after the key on the current host', async () => {
      const value = '<iframe src="https://app.smore.com/n/2gc5u-mediawijsheid?embedded"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: '2gc5u',
        src: 'https://app.smore.com/n/2gc5u?embedded',
        url: 'https://app.smore.com/n/2gc5u',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the newsletter height over the declared box', async () => {
      const value = html`
        <iframe
          width="100%"
          height="2200"
          src="http://www.smore.com/eddk-weebly-com-for-eportfolios?embed=1"
          scrolling="auto"
          frameborder="0"
          allowtransparency="true"
          style="min-width: 320px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: 'eddk',
        src: 'https://app.smore.com/n/eddk?embedded',
        url: 'https://app.smore.com/n/eddk',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should make a newsletter page framed with no query an embed', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="500"
          src="https://www.smore.com/dwh1e"
          width="650"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: 'dwh1e',
        src: 'https://app.smore.com/n/dwh1e?embedded',
        url: 'https://app.smore.com/n/dwh1e',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from the query', async () => {
      const value =
        '<iframe src="https://www.smore.com/2gc5u-mediawijsheid?embed=1&utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: '2gc5u',
        src: 'https://app.smore.com/n/2gc5u?embedded',
        url: 'https://app.smore.com/n/2gc5u',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/n/5h2uw?embedded"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word other than the newsletter one', async () => {
      const value = '<iframe src="https://app.smore.com/x/5h2uw?embedded"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the uppercase route word the server sends to sign-in', async () => {
      const value = '<iframe src="https://app.smore.com/N/5h2uw?embedded"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the newsletter', async () => {
      const value = '<iframe src="https://app.smore.com/n/5h2uw/extra?embedded"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a newsletter path below another segment on the legacy host', async () => {
      const value = '<iframe src="https://www.smore.com/x/2gc5u-mediawijsheid?embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slug with no key in front of it', async () => {
      const value = '<iframe src="https://www.smore.com/-mediawijsheid?embed=1"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should pass the key through in the case the feed wrote', async () => {
      const value = '<iframe src="https://www.smore.com/2GC5U-mediawijsheid?embed=1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: '2GC5U',
        src: 'https://app.smore.com/n/2GC5U?embedded',
        url: 'https://app.smore.com/n/2GC5U',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the label the embed dialog writes as the title', () => {
    it('should drop the fallback the dialog writes for a page with no name', async () => {
      const value = html`
        <iframe
          width="100%"
          height="600"
          src="https://app.smore.com/n/mnx5d?embedded"
          title="Smore newsletter"
          scrolling="auto"
          frameborder="0"
          allowtransparency="true"
          style="min-width: 320px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'smore',
        id: 'mnx5d',
        src: 'https://app.smore.com/n/mnx5d?embedded',
        url: 'https://app.smore.com/n/mnx5d',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('smore through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the embed dialog snippet into a newsletter placeholder', async () => {
    const value = html`
      <iframe
        width="100%"
        height="600"
        src="https://secure.smore.com/n/mbv7u?embed=1"
        title="NCBCC Herding Instinct Test"
        scrolling="auto"
        frameborder="0"
        allowtransparency="true"
        style="min-width: 320px;border: none;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-title="NCBCC Herding Instinct Test"
        data-embed-height="600"
        data-embed-url="https://app.smore.com/n/mbv7u"
        data-embed-id="mbv7u"
        data-embed-provider="smore"
        data-embed-src="https://app.smore.com/n/mbv7u?embedded"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep an image enclosure on the newsletter image host as an image', async () => {
    const enclosures = [
      {
        url: 'https://cdn.smore.com/u/030c/c54a67c538ca01a02343759c9d34e594.jpeg',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img src="https://cdn.smore.com/u/030c/c54a67c538ca01a02343759c9d34e594.jpeg" data-enclosure="">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
