import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildDocumentcloudEmbeds } from './rebuildDocumentcloudEmbeds.js'

describeForEachParser('rebuildDocumentcloudEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildDocumentcloudEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the viewer snippet onto the embed host', async () => {
      const value = html`
        <script>
          DV.load("http://www.documentcloud.org/documents/409020-udo-pc-review-august-14.js", {
            width: 600,
            height: 400,
            sidebar: false,
            text: false,
            pdf: false,
            container: "#DV-viewer-409020-udo-pc-review-august-14"
          });
        </script>
      `
      const expected =
        '<iframe src="https://embed.documentcloud.org/documents/409020-udo-pc-review-august-14/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read a url in single quotes', async () => {
      const value = html`
        <script>
          DV.load('http://www.documentcloud.org/documents/1262997-mark-tomas-regan-indictment.js', {
            width: 600,
            height: 500,
            container: '#DV-viewer-1262997-mark-tomas-regan-indictment'
          });
        </script>
      `
      const expected =
        '<iframe src="https://embed.documentcloud.org/documents/1262997-mark-tomas-regan-indictment/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the loader script alone, which names no document', async () => {
      const value = '<script src="http://s3.documentcloud.org/viewer/loader.js"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a script whose call names no DocumentCloud document', async () => {
      const value = `<script>DV.load('https://evil.test/documents/409020-udo-pc-review-august-14.js', {});</script>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a script that only mentions a document url', async () => {
      const value = `<script>track('http://www.documentcloud.org/documents/409020-udo-pc-review-august-14.js');</script>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a call whose url quotes do not match', async () => {
      const value = `<script>DV.load("http://www.documentcloud.org/documents/409020-udo-pc-review-august-14.js', {});</script>`

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = `<script>DV.load('http://www.documentcloud.org/documents/409020-udo-pc-review-august-14.js', {});</script>`
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildDocumentcloudEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the document as a placeholder in place of the snippet', async () => {
    const value = html`
      <p>The Commission decided.</p>
      <div id="DV-viewer-409020-udo-pc-review-august-14" class="DV-container"></div>
      <p><script src="http://s3.documentcloud.org/viewer/loader.js"></script><br />
      <script>
        DV.load("http://www.documentcloud.org/documents/409020-udo-pc-review-august-14.js", {
          width: 600,
          height: 400,
          sidebar: false,
          container: "#DV-viewer-409020-udo-pc-review-august-14"
        });
      </script></p>
    `
    const expected = html`
      <p>The Commission decided.</p>
      <div
        data-embed-ratio="17/22"
        data-embed-thumbnail="https://s3.documentcloud.org/documents/409020/pages/udo-pc-review-august-14-p1-normal.gif"
        data-embed-id="409020"
        data-embed-provider="documentcloud"
        data-embed-src="https://embed.documentcloud.org/documents/409020-udo-pc-review-august-14/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
