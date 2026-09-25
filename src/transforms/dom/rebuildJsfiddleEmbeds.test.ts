import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildJsfiddleEmbeds } from './rebuildJsfiddleEmbeds.js'

describeForEachParser('rebuildJsfiddleEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildJsfiddleEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the loader onto the fiddle page', async () => {
      const value = html`
        <script
          async
          src="//jsfiddle.net/exampleauthor/abcd1234/7/embed/html,css,result/"
        ></script>
      `
      const expected = '<iframe src="https://jsfiddle.net/exampleauthor/abcd1234/7/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the loader spelling that names the author in its query', async () => {
      const value = html`
        <script src="https://jsfiddle.net/abcd1234/7/embedded/html,css,result/?username=exampleauthor"></script>
      `
      const expected = '<iframe src="https://jsfiddle.net/abcd1234/7/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a script on the host that names no fiddle alone', async () => {
      const value = '<script src="https://jsfiddle.net/js/embed.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a loader whose slug carries a dot alone', async () => {
      const value = '<script src="https://jsfiddle.net/user/slug.js/1/embed/"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value =
        '<script src="//jsfiddle.net/exampleauthor/abcd1234/7/embed/html,css,result/"></script>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildJsfiddleEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the fiddle as a placeholder pointing at its page', async () => {
    const value = html`
      <p>Before</p>
      <script
        async
        src="//jsfiddle.net/exampleauthor/abcd1234/7/embed/html,css,result/"
      ></script>
    `
    const expected = html`
      <p>Before</p>
      <div data-embed-src="https://jsfiddle.net/exampleauthor/abcd1234/7/"></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
