import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildIframelyEmbeds } from './rebuildIframelyEmbeds.js'

describeForEachParser('rebuildIframelyEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildIframelyEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should turn a facade onto an article into a link', async () => {
      const value = html`
        <div class="iframely-embed">
          <div
            class="iframely-responsive"
            style="padding-bottom: 56.2651%;"
          >
            <a
              href="https://example.com/article"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle&amp;key=abc"
            ></a>
          </div>
        </div>
      `
      const expected = '<a href="https://example.com/article">https://example.com/article</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should turn a facade onto a platform a resolver knows into its frame', async () => {
      const value = html`
        <div class="iframely-embed">
          <div
            class="iframely-responsive"
            style="padding-bottom: 177.5%;"
          >
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&amp;key=abc"
            ></a>
          </div>
        </div>
      `
      const expected = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a facade standing without its wrapper', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        ></a>
      `
      const expected = '<a href="https://example.com/article">https://example.com/article</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave an anchor that already carries its own text alone', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        >Read the article</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an anchor that already holds an image alone', async () => {
      const value = html`
        <a
          href="https://example.com/article"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
        ><img src="https://example.com/cover.jpg" /></a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a facade whose href is not a url alone', async () => {
      const value = html`
        <a
          href="#top"
          data-iframely-url="https://cdn.iframe.ly/api/iframe?url=x"
        ></a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <div class="iframely-embed">
          <div class="iframely-responsive">
            <a
              href="https://example.com/article"
              data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle"
            ></a>
          </div>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

// The whole run drops an empty anchor and every loader script, so only the pipeline shows the
// destination surviving.
describeForEachParser('rebuildIframelyEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the destination of an article facade as a link', async () => {
    const value = html`
      <div class="iframely-embed">
        <div
          class="iframely-responsive"
          style="padding-bottom: 56.2651%;"
        >
          <a
            href="https://example.com/article"
            data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fexample.com%2Farticle&amp;key=abc"
          ></a>
        </div>
      </div>
      <script
        async
        src="https://cdn.iframe.ly/embed.js"
        charset="utf-8"
      ></script>
    `
    const expected = '<p><a href="https://example.com/article">https://example.com/article</a></p>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should bring a platform facade back as that platform placeholder', async () => {
    const value = html`
      <div class="iframely-embed">
        <div class="iframely-responsive">
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            data-iframely-url="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
          ></a>
        </div>
      </div>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
