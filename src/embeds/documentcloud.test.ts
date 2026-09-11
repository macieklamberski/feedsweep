import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { documentcloudEmbedResolver } from './documentcloud.js'

describeForEachParser('documentcloudEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, documentcloudEmbedResolver)

  describe('happy paths', () => {
    it('should compose the page thumbnail from the document id and slug', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/?embed=1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '3694123',
        src: 'https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/?embed=1',
        thumbnail:
          'https://s3.documentcloud.org/documents/3694123/pages/Feedback-on-the-Nakshe-Portal-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the slug in the case the carrier spells it', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/20705673-open-letter-acj-moud-051021/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '20705673',
        src: 'https://embed.documentcloud.org/documents/20705673-open-letter-acj-moud-051021/',
        thumbnail:
          'https://s3.documentcloud.org/documents/20705673/pages/open-letter-acj-moud-051021-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the documentcloud path', async () => {
      const value =
        '<iframe src="https://evil.test/embed.documentcloud.org/documents/3694123-Feedback/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a project, which is a second id space', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/projects/2345-jail-records/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a document segment carrying no slug', async () => {
      const value = '<iframe src="https://embed.documentcloud.org/documents/3694123/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should split the segment at the first hyphen when the slug opens with digits', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/20705673-051021-memo-to-council/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '20705673',
        src: 'https://embed.documentcloud.org/documents/20705673-051021-memo-to-council/',
        thumbnail:
          'https://s3.documentcloud.org/documents/20705673/pages/051021-memo-to-council-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the box the carrier declares, stating none of its own', async () => {
      const value = html`
        <iframe
          src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/"
          width="474"
          height="711"
          style="aspect-ratio: 612.0 / 792.0; max-width: 474px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '3694123',
        src: 'https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/',
        thumbnail:
          'https://s3.documentcloud.org/documents/3694123/pages/Feedback-on-the-Nakshe-Portal-p1-normal.gif',
        width: 474,
        height: 711,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the title the carrier states', () => {
    it('should leave the hosted-by title to enrichment', async () => {
      const value = html`
        <iframe
          src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/"
          title="Feedback on the Nakshe Portal (Hosted by DocumentCloud)"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '3694123',
        src: 'https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/',
        thumbnail:
          'https://s3.documentcloud.org/documents/3694123/pages/Feedback-on-the-Nakshe-Portal-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('documentcloud shapes the pipeline strips first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should resolve the viewer and drop the resize helper beside it', async () => {
    const value = html`
      <iframe
        src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/"
        width="474"
        height="711"
      ></iframe>
      <script src="https://embed.documentcloud.org/embed/dc-resize.js"></script>
    `
    const expected = html`
      <div
        data-embed-height="711"
        data-embed-width="474"
        data-embed-thumbnail="https://s3.documentcloud.org/documents/3694123/pages/Feedback-on-the-Nakshe-Portal-p1-normal.gif"
        data-embed-id="3694123"
        data-embed-provider="documentcloud"
        data-embed-src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
