import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildGofundmeEmbeds } from './rebuildGofundmeEmbeds.js'

describeForEachParser('rebuildGofundmeEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildGofundmeEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the large widget from the campaign url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the query the share dialog writes', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large?sharesheet=campaign_page"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a medium widget as the large one', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a small button widget as the large one', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/small/donate"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a campaign page url onto its widget', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mint https for an http campaign url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="http://www.gofundme.com/f/save-the-hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/save-the-hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should insert the slug as written', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/Save-The-Hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://www.gofundme.com/f/Save-The-Hall/widget/large"
          height="560"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a data-url on a foreign host', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://evil.test/f/save-the-hall/widget/large"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a lookalike host', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://gofundme.com.evil.test/f/save-the-hall/widget/large"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a data-url that is not a url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="loaded"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a charity widget on another route', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/charity/save-the-hall/widget/donationsbtn"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a campaign route that is not the first segment', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/x/f/save-the-hall"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a campaign route naming no campaign', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should leave a widget div that already holds the player', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        >
          <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a widget div carrying a donation link', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        >
          <a href="https://www.gofundme.com/f/save-the-hall">Donate</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should be idempotent', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large?sharesheet=campaign_page"
        ></div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildGofundmeEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should surface the widget into a placeholder and drop the loader script', async () => {
    const value = html`
      <div
        class="gfm-embed"
        data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?sharesheet=campaign_page"
      ></div>
      <script
        defer
        src="https://www.gofundme.com/static/js/embed.js"
      ></script>
    `
    const expected = html`
      <div
        data-embed-src="https://www.gofundme.com/f/save-the-hall/widget/large"
        data-embed-height="560"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
