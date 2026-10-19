import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { fixEadDocumentLinks } from './fixEadDocumentLinks.js'

describeForEachParser('fixEadDocumentLinks', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [fixEadDocumentLinks(baseContext)])
  }

  describe('happy paths', () => {
    it('should point the link at the file in data-pdf-src', async () => {
      const value = html`
        <div
          class="ead-document"
          data-pdf-src="https://example.com/wp-content/uploads/2025/10/CC-Worksheet.pdf"
          data-viewer="browser"
        >
          <a
            href="#"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `
      const expected = html`
        <div
          class="ead-document"
          data-pdf-src="https://example.com/wp-content/uploads/2025/10/CC-Worksheet.pdf"
          data-viewer="browser"
        >
          <a
            href="https://example.com/wp-content/uploads/2025/10/CC-Worksheet.pdf"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should insert an http file url as written', async () => {
      const value = html`
        <div
          class="ead-document"
          data-pdf-src="http://example.com/wp-content/uploads/2021/08/Attachment_1628033922.pdf"
          data-viewer="browser"
        >
          <a
            href="#"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `
      const expected = html`
        <div
          class="ead-document"
          data-pdf-src="http://example.com/wp-content/uploads/2021/08/Attachment_1628033922.pdf"
          data-viewer="browser"
        >
          <a
            href="http://example.com/wp-content/uploads/2021/08/Attachment_1628033922.pdf"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep the link when data-pdf-src is blank', async () => {
      const value = html`
        <div
          class="ead-document"
          data-pdf-src=""
          data-viewer="browser"
        >
          <a
            href="#"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <div
          class="ead-document"
          data-pdf-src="https://example.com/wp-content/uploads/2025/10/CC-Worksheet.pdf"
          data-viewer="browser"
        >
          <a
            href="#"
            class="ead-document-btn"
            target="_blank"
          >Open in new tab</a>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
