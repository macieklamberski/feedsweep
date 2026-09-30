import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { sketchfabEmbedResolver } from './sketchfab.js'

describeForEachParser('sketchfabEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, sketchfabEmbedResolver)

  describe('happy paths', () => {
    it('should read the name the share snippet states', async () => {
      const value = html`
        <iframe
          title="Borodyanka. Ukraine. War. Banksy."
          frameborder="0"
          allowfullscreen
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          xr-spatial-tracking
          execution-while-out-of-viewport
          execution-while-not-rendered
          web-share
          width="800"
          height="600"
          src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed?ui_theme=dark&dnt=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: { ui_theme: 'dark' },
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
        width: 800,
        height: 600,
        title: 'Borodyanka. Ukraine. War. Banksy.',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the oEmbed iframe that writes an empty title', async () => {
      const value = html`
        <iframe
          id=""
          title=""
          class=""
          width="640"
          height="360"
          src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed"
          frameborder="0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: {},
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should carry the viewer flags as params and drop the autostart', async () => {
      const value = html`
        <iframe
          width="640"
          height="480"
          src="https://sketchfab.com/models/3b26bab70c1c4d64add90939878194c4/embed?autostart=1&amp;ui_controls=1&amp;ui_infos=1&amp;ui_inspector=1&amp;ui_stop=1&amp;ui_watermark=1&amp;ui_watermark_link=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '3b26bab70c1c4d64add90939878194c4',
        src: 'https://sketchfab.com/models/3b26bab70c1c4d64add90939878194c4/embed',
        params: {
          ui_controls: '1',
          ui_infos: '1',
          ui_inspector: '1',
          ui_stop: '1',
          ui_watermark: '1',
          ui_watermark_link: '1',
        },
        url: 'https://sketchfab.com/models/3b26bab70c1c4d64add90939878194c4',
        width: 640,
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should carry the preload as a param and drop the annotation cycle', async () => {
      const value = html`
        <iframe
          src="https://sketchfab.com/models/20f091e6e62648e2b120ff6875aa4ba6/embed?annotation_cycle=5&amp;preload=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '20f091e6e62648e2b120ff6875aa4ba6',
        src: 'https://sketchfab.com/models/20f091e6e62648e2b120ff6875aa4ba6/embed',
        params: { preload: '1' },
        url: 'https://sketchfab.com/models/20f091e6e62648e2b120ff6875aa4ba6',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the spin as a param', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/c13121255cf04d658885ebe177f130b4/embed?autospin=0.2"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: 'c13121255cf04d658885ebe177f130b4',
        src: 'https://sketchfab.com/models/c13121255cf04d658885ebe177f130b4/embed',
        params: { autospin: '0.2' },
        url: 'https://sketchfab.com/models/c13121255cf04d658885ebe177f130b4',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a uid that is not thirty-two hex characters', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e83/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a models path with a segment that is not the viewer', async () => {
      const value = html`
        <iframe
          src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/comments"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a uid carrying a path after it', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838%2F..%2Fcomments/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a uid carrying a path before it', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/..%2F00b8203bcdc2464bbac4b159be66e838/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a uid-length segment carrying an encoded separator', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e%2F/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe
          src="https://evil.test/models/00b8203bcdc2464bbac4b159be66e838/embed"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the retired spellings and the page url', () => {
    it('should resolve the retired viewer path', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/embed/00b8203bcdc2464bbac4b159be66e838"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: {},
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the retired page path', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/show/00b8203bcdc2464bbac4b159be66e838"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: {},
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the unslugged page url', async () => {
      const value = html`
        <iframe src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: {},
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the uid off the end of the slugged page url', async () => {
      const value = html`
        <iframe
          src="https://sketchfab.com/3d-models/borodyanka-ukraine-war-banksy-00b8203bcdc2464bbac4b159be66e838"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'sketchfab',
        id: '00b8203bcdc2464bbac4b159be66e838',
        src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
        params: {},
        url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a slugged page url that runs on past the uid', async () => {
      const value = html`
        <iframe
          src="https://sketchfab.com/3d-models/borodyanka-ukraine-war-banksy-00b8203bcdc2464bbac4b159be66e838%2Fcomments"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slugged page url ending in an encoded separator', async () => {
      const value = html`
        <iframe
          src="https://sketchfab.com/3d-models/borodyanka-ukraine-war-banksy-00b8203bcdc2464bbac4b159be66e%2F"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slugged page url that ends in no uid', async () => {
      const value = '<iframe src="https://sketchfab.com/3d-models/popular"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The commonest single title in the corpus, and the reason the attribute is not read.
  it('should resolve a carrier titled with the snippet label', async () => {
    const value = html`
      <iframe
        title="A 3D model"
        width="640"
        height="480"
        src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'sketchfab',
      id: '00b8203bcdc2464bbac4b159be66e838',
      src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
      params: {},
      url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
      width: 640,
      height: 480,
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('sketchfabEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, sketchfabEmbedResolver)

  it('should drop the label the share dialog writes in place of the name', async () => {
    const value = html`
      <iframe src="https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed" title="A 3D model"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'sketchfab',
      id: '00b8203bcdc2464bbac4b159be66e838',
      src: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838/embed',
      params: {},
      url: 'https://sketchfab.com/models/00b8203bcdc2464bbac4b159be66e838',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

// sketchfab.com is listed for the viewer, and its media. subdomain serves each model's thumbnails
// under the same models path.
describeForEachParser('sketchfab through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a model thumbnail enclosure an image', async () => {
    const enclosures = [
      {
        url: 'https://media.sketchfab.com/models/4dfa4e9b9d3842feaa1b7970f7247932/thumbnails/451d23fda90542c4ab65b6fd39e2e12b/3713a715651240d6b432ff608d182ade.jpeg',
        type: 'image/jpeg',
      },
    ]
    const expected = html`
      <img
        data-enclosure=""
        src="https://media.sketchfab.com/models/4dfa4e9b9d3842feaa1b7970f7247932/thumbnails/451d23fda90542c4ab65b6fd39e2e12b/3713a715651240d6b432ff608d182ade.jpeg"
      >
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
