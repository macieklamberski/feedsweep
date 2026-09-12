import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildGofundmeEmbeds } from './rebuildGofundmeEmbeds.js'

describeForEachParser('rebuildGofundmeEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildGofundmeEmbeds(baseContext)])
  }
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  describe('happy paths', () => {
    it('should rebuild an iframe from the campaign url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium"
        ></div>
      `
      const expected =
        '<iframe src="https://www.gofundme.com/f/save-the-hall/widget/medium"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the widget size segment the publisher chose', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large/"
        ></div>
      `
      const expected =
        '<iframe src="https://www.gofundme.com/f/save-the-hall/widget/large/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a data-url pointing off gofundme.com', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://example.org/readme.html"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a lookalike host', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://gofundme.com.evil.test/f/save-the-hall/widget/medium"
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
  })

  describe('edge cases', () => {
    it('should leave a widget div that already holds the player', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium"
        >
          <iframe src="https://www.gofundme.com/f/save-the-hall/widget/medium"></iframe>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a widget div carrying a donation link', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium"
        >
          <a href="https://www.gofundme.com/f/save-the-hall">Donate</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('the share attribution the sharesheet stamps on the snippet', () => {
    it('should drop sharesheet and attribution_id', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?sharesheet=campaign_nav&attribution_id=sl:8a55921a-79b1-4433-be49-b913310530ad"
        ></div>
      `
      const expected =
        '<iframe src="https://www.gofundme.com/f/save-the-hall/widget/medium"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a parameter the sharesheet did not stamp', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?lang=en&sharesheet=campaign_nav"
        ></div>
      `
      const expected =
        '<iframe src="https://www.gofundme.com/f/save-the-hall/widget/medium?lang=en"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('gofundme.com markup this transform leaves alone', () => {
    it('should leave the retired Flash widget on funds.gofundme.com', async () => {
      const value = html`<embed src="https://funds.gofundme.com/widgetflex.swf?id=1234567"></embed>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a campaign link written in prose', async () => {
      const value = html`
        <p>We are <a href="https://www.gofundme.com/f/save-the-hall">raising funds</a>.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('the pipeline the widget reaches a reader through', () => {
    it('should surface the widget into a placeholder and drop the loader script', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?sharesheet=campaign_nav"
        ></div>
        <script
          defer
          src="https://www.gofundme.com/static/js/embed.js"
        ></script>
      `
      const expected =
        '<div data-embed-src="https://www.gofundme.com/f/save-the-hall/widget/medium"></div>'

      expect(await convert(value)).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <div
        class="gfm-embed"
        data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?sharesheet=campaign_nav"
      ></div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
