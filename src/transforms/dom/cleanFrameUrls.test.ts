import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, createProxyUnwrapFn, describeForEachParser, html } from '../../tests.js'
import type { CleanUrlFn, TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { cleanFrameUrls } from './cleanFrameUrls.js'

const unwrapEmbedlyFn = createProxyUnwrapFn('cdn.embedly.com', 'src')
const unwrapDrupalFn = createProxyUnwrapFn('example.com', 'url')

const utmSourceRegex = /[?&]utm_source=[^&]*/

const stripUtmSourceFn: CleanUrlFn = (url) => {
  return url.replace(utmSourceRegex, '')
}

describeForEachParser('cleanFrameUrls', (parseHtml) => {
  const transform = (value: string, cleanUrlFn?: CleanUrlFn) => {
    const context: TransformContext = {
      ...baseContext,
      baseUrl: 'https://example.com/post',
      cleanUrlFn,
    }

    return applyDomTransforms(parseHtml(value), [cleanFrameUrls(context)])
  }

  describe('happy paths', () => {
    it('should write the url the cleaner unwraps a frame to', async () => {
      const value = html`
        <iframe
          src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ"
        ></iframe>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

      expect(await transform(value, unwrapEmbedlyFn)).toEqualHtml(expected)
    })

    it('should clean the data of an object', async () => {
      const value = html`
        <object
          data="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fv%2FdQw4w9WgXcQ"
        ></object>
      `
      const expected = '<object data="https://www.youtube.com/v/dQw4w9WgXcQ"></object>'

      expect(await transform(value, unwrapEmbedlyFn)).toEqualHtml(expected)
    })

    it('should resolve a protocol-relative src before the cleaner reads its host', async () => {
      const value = html`
        <iframe
          src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ"
        ></iframe>
      `
      const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

      expect(await transform(value, unwrapEmbedlyFn)).toEqualHtml(expected)
    })

    it('should resolve a site-relative src before the cleaner reads its host', async () => {
      const value = html`
        <iframe
          src="/media/oembed?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&amp;max_width=0"
        ></iframe>
      `
      const expected = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>'

      expect(await transform(value, unwrapDrupalFn)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should do nothing when cleanUrlFn is not provided', async () => {
      const value = html`
        <iframe
          src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a src the cleaner keeps as written, its repairs included', async () => {
      const value = '<iframe src="https://example.org/embed/123&amp;autoplay=1"></iframe>'

      expect(await transform(value, stripUtmSourceFn)).toEqualHtml(value)
    })

    it('should leave a src whose run of slashes only shows once resolved', async () => {
      const value = '<iframe src="&#34;//example.org/player?id=1&#34;"></iframe>'

      expect(await transform(value, stripUtmSourceFn)).toEqualHtml(value)
    })

    it('should leave an object naming its player only in a param', async () => {
      const value = html`
        <object>
          <param
            name="movie"
            value="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fv%2FdQw4w9WgXcQ"
          >
        </object>
      `

      expect(await transform(value, unwrapEmbedlyFn)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <iframe
        src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ"
      ></iframe>
    `
    const once = await transform(value, unwrapEmbedlyFn)
    const twice = await transform(once, unwrapEmbedlyFn)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('cleanFrameUrls through the pipeline', (parseHtml) => {
  const convert = (value: string, cleanUrlFn: CleanUrlFn): Promise<string> => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      cleanUrlFn,
    })
  }

  it('should hand the resolvers the player the cleaner unwraps, with the wrapper poster', async () => {
    const value = html`
      <iframe
        src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ&image=https%3A%2F%2Fi.ytimg.com%2Fvi%2FdQw4w9WgXcQ%2Fhqdefault.jpg"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="youtube"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value, unwrapEmbedlyFn)).toEqualHtml(expected)
  })

  it('should give a frame no resolver claims the src its publisher wrote', async () => {
    const value =
      '<iframe src="https://example.org/embed/123&amp;autoplay=1&amp;utm_source=feed"></iframe>'
    const expected = '<div data-embed-src="https://example.org/embed/123&amp;autoplay=1"></div>'

    expect(await convert(value, stripUtmSourceFn)).toEqualHtml(expected)
  })

  it('should keep the url a later pass wrote over the cleaned src', async () => {
    const value = html`
      <iframe
        src="https://example.com/res/scraper/embed/?video_url=https%3A%2F%2Fexample.org%2Fplayer%2F1&utm_source=feed"
      ></iframe>
    `
    const expected = '<div data-embed-src="https://example.org/player/1"></div>'

    expect(await convert(value, stripUtmSourceFn)).toEqualHtml(expected)
  })
})
