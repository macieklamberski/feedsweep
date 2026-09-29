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
    it('should rebuild a loader naming an author, a slug and a version', async () => {
      const value = html`
        <script
          async=""
          src="https://jsfiddle.net/josedvq/kjfgpm8u/2/embed/html,css,result/dark/"
        ></script>
      `
      const expected =
        '<iframe src="https://jsfiddle.net/josedvq/kjfgpm8u/2/" height="400"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a loader naming an author and a slug', async () => {
      const value =
        '<script async src="//jsfiddle.net/learnwithnakamura/qg0dvu2o/embed/html/dark/"></script>'
      const expected =
        '<iframe src="https://jsfiddle.net/learnwithnakamura/qg0dvu2o/" height="400"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a loader naming a slug and a version', async () => {
      const value = '<script async src="//jsfiddle.net/y0gh6cad/2/embed/result/"></script>'
      const expected = '<iframe src="https://jsfiddle.net/y0gh6cad/2/" height="400"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a loader naming only a slug', async () => {
      const value = '<script async src="//jsfiddle.net/uyd59Lbx/embed/result,html/"></script>'
      const expected = '<iframe src="https://jsfiddle.net/uyd59Lbx/" height="400"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a script on the host that names no fiddle alone', async () => {
      const value = '<script src="https://jsfiddle.net/js/embed.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a loader on a foreign host that names jsfiddle.net in its query alone', async () => {
      const value = '<script src="https://evil.test/a/b/embed/?x=jsfiddle.net/"></script>'

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
        '<script async src="//jsfiddle.net/learnwithnakamura/qg0dvu2o/embed/html/dark/"></script>'
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
        async=""
        src="https://jsfiddle.net/josedvq/kjfgpm8u/2/embed/html,css,result/dark/"
      ></script>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-src="https://jsfiddle.net/josedvq/kjfgpm8u/2/"
        data-embed-height="400"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
