import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  jotformIframeEmbedResolver,
  jotformResolveEmbed,
  jotformScriptEmbedResolver,
} from './jotform.js'

describe('jotformResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the form from the bare id url', () => {
      const value = 'https://form.jotform.com/260493476454061'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })

    it('should build the form from the longer route the platform also serves', () => {
      const value = 'https://form.jotform.com/form/260493476454061'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })

    it('should carry the query over as published, campaign tags included', () => {
      const value = 'https://form.jotform.com/260493476454061?name=Jane&utm_source=post&fbclid=abc'
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061?name=Jane&utm_source=post&fbclid=abc',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(jotformResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a form addressed by its vanity slug', () => {
      const value = 'https://form.jotform.com/anaccount/a-form-slug'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route below the form', () => {
      const value = 'https://form.jotform.com/260493476454061/edit'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word in place of the form id', () => {
      const value = 'https://form.jotform.com/help'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word that ends in digits', () => {
      const value = 'https://form.jotform.com/help260493476454061'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form id followed by a route word', () => {
      const value = 'https://form.jotform.com/260493476454061help'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the site root', () => {
      const value = 'https://form.jotform.com/'

      expect(jotformResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('jotformScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jotformScriptEmbedResolver)

  describe('happy paths', () => {
    it('should read the form id off the inline loader', async () => {
      const value = html`
        <script
          type="text/javascript"
          src="https://form.jotform.com/jsform/260493476454061"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a loader on a regional host', async () => {
      const value = html`<script src="https://form.jotformeu.com/jsform/32625826600350"></script>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '32625826600350',
        src: 'https://form.jotform.com/32625826600350',
        url: 'https://form.jotform.com/32625826600350',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should carry the loader query over to the form', async () => {
      const value = html`
        <script src="https://www.jotform.com/jsform/260925903049157?redirect=1"></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260925903049157',
        src: 'https://form.jotform.com/260925903049157?redirect=1',
        url: 'https://form.jotform.com/260925903049157',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a loader on the PCI host', async () => {
      const value = html`<script src="https://pci.jotform.com/jsform/253238206727155"></script>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '253238206727155',
        src: 'https://form.jotform.com/253238206727155',
        url: 'https://form.jotform.com/253238206727155',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a loader served from another host', async () => {
      const value = html`
        <script src="https://evil.test/jsform/260493476454061?form.jotform.com/jsform/"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The launcher carries its form id in an inline config beside this loader, and neither is
    // read.
    it('should ignore the launcher button loader', async () => {
      const value = html`<script src="https://form.jotform.com/static/feedback2.js"></script>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed form id as written, even if the player answers an error', async () => {
      const value = html`<script src="https://form.jotform.com/jsform/my-form"></script>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: 'my-form',
        src: 'https://form.jotform.com/my-form',
        url: 'https://form.jotform.com/my-form',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a loader path below another route', async () => {
      const value = html`<script src="https://form.jotform.com/x/jsform/260493476454061"></script>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the loader', async () => {
      const value = html`
        <script src="https://form.jotform.com/jsform/260493476454061/extra"></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('jotformIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jotformIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve a form frame', async () => {
      const value = html`<iframe src="https://form.jotform.com/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on the main site', async () => {
      const value = html`<iframe src="https://www.jotform.com/form/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a form route on a foreign host', async () => {
      const value = html`<iframe src="https://evil.test/260493476454061"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a subdomain that serves uploads', async () => {
      const value = html`<iframe src="https://files.jotform.com/260493476454061"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the regional and legacy hosts that serve the same form', () => {
    it('should mint the form from a frame on the Italian host', async () => {
      const value = html`<iframe src="http://italian.jotform.com/form/91103559127"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '91103559127',
        src: 'https://form.jotform.com/91103559127',
        url: 'https://form.jotform.com/91103559127',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on the oEmbed host', async () => {
      const value = html`
        <iframe src="https://oembed.jotform.com/212921991643056#?secret=glKLMjyCzY"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '212921991643056',
        src: 'https://form.jotform.com/212921991643056',
        url: 'https://form.jotform.com/212921991643056',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on jotform.co', async () => {
      const value = html`<iframe src="https://form.jotform.co/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on jotform.me', async () => {
      const value = html`<iframe src="https://form.jotform.me/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on jotform.us', async () => {
      const value = html`<iframe src="https://form.jotform.us/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on jotformpro.com', async () => {
      const value = html`<iframe src="https://form.jotformpro.com/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the form from a frame on jotformz.com', async () => {
      const value = html`<iframe src="https://form.jotformz.com/260493476454061"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'jotform',
        id: '260493476454061',
        src: 'https://form.jotform.com/260493476454061',
        url: 'https://form.jotform.com/260493476454061',
        height: 539,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// Only an enclosure reaches the path where claiming an uploaded file would replace it with a form.
describeForEachParser('jotform through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a file uploaded to a form as a file', async () => {
    const enclosures = [
      {
        url: 'https://www.jotform.com/uploads/acme/260493476454061/6012345678901234567/report.pdf',
        type: 'application/pdf',
      },
    ]
    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/pdf"
        data-file-name="report.pdf"
        data-file-url="https://www.jotform.com/uploads/acme/260493476454061/6012345678901234567/report.pdf"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave an image on the file host as an image', async () => {
    const enclosures = [
      { url: 'https://files.jotform.com/jufs/acme/form_files/cover.jpg', type: 'image/jpeg' },
    ]
    const expected = html`
      <img data-enclosure="" src="https://files.jotform.com/jufs/acme/form_files/cover.jpg">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
