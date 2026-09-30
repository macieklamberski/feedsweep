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
        src: 'https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/',
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

    it('should move the legacy viewer onto the embed host', async () => {
      const value =
        '<iframe src="https://www.documentcloud.org/documents/2702333-Appropriate-and-Responsible-Practices-for.html"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '2702333',
        src: 'https://embed.documentcloud.org/documents/2702333-Appropriate-and-Responsible-Practices-for/',
        thumbnail:
          'https://s3.documentcloud.org/documents/2702333/pages/Appropriate-and-Responsible-Practices-for-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the legacy viewer path', async () => {
      const value =
        '<iframe src="https://evil.test/documents/2702333-Appropriate-and-Responsible-Practices-for.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a project, which is a second id space', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/projects/2345-jail-records/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment that does not open with the document id', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/abc-3694123-Feedback-on-the-Nakshe-Portal/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a document segment carrying no slug', async () => {
      const value = '<iframe src="https://embed.documentcloud.org/documents/3694123/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a slugged page embed, which no carrier writes', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/28200073-council-responses/pages/3/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the document page on the legacy host, which is not the viewer', async () => {
      const value =
        '<iframe src="https://www.documentcloud.org/documents/2702333-Appropriate-and-Responsible-Practices-for"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the pdf on the legacy host', async () => {
      const value = html`
        <embed
          src="https://www.documentcloud.org/documents/2702333-Appropriate-and-Responsible-Practices-for.pdf"
          type="application/pdf"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should split the segment at the first hyphen when the slug opens with digits', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/20470115-208-emergency-restraint-chair/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '20470115',
        src: 'https://embed.documentcloud.org/documents/20470115-208-emergency-restraint-chair/',
        thumbnail:
          'https://s3.documentcloud.org/documents/20470115/pages/208-emergency-restraint-chair-p1-normal.gif',
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

  describe('the page and note embeds', () => {
    it('should key a page embed by the document id and the page number', async () => {
      const value = html`
        <iframe
          src="https://embed.documentcloud.org/documents/28200073/pages/1/?embed=1"
          width="596"
          height="842"
          style="border: none; width: 100%; height: 100%; aspect-ratio: 596 / 842"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '28200073/pages/1',
        src: 'https://embed.documentcloud.org/documents/28200073/pages/1/',
        width: 596,
        height: 842,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key a note embed by the document id and the note id', async () => {
      const value = html`
        <iframe
          loading="lazy"
          title="Atlantic City&#x27;s Tax-Exempt Property (Hosted by DocumentCloud)"
          src="https://embed.documentcloud.org/documents/4104638/annotations/380631/?embed=1&amp;pdf=0&amp;onlyshoworg=0&amp;fullscreen=1&amp;embed=1"
          width="420.48"
          height="148.32"
          style="border: 1px solid #d8dee2; border-radius: 0.5rem; width: 100%; height: 300px; max-width: 771px; max-height: 1000px;"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '4104638/annotations/380631',
        src: 'https://embed.documentcloud.org/documents/4104638/annotations/380631/',
        width: 420.48,
        height: 148.32,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the legacy note on its host with the embed flag its redirect needs', async () => {
      const value = html`
        <iframe
          class="DC-note-image-space-filler"
          src="https://www.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/287733.html?embed=true&amp;maxheight=1000&amp;maxwidth=771"
          title="Note “Fastest Growing Occupations, 2014-24” on document “BLS-Jobs-Release”"
          sandbox="allow-scripts allow-same-origin allow-popups"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '2793355/annotations/287733',
        src: 'https://www.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/287733.html?embed=1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed page number as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/28200073/pages/p1/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '28200073/pages/p1',
        src: 'https://embed.documentcloud.org/documents/28200073/pages/p1/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed legacy note id as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/a287733.html"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '2793355/annotations/a287733',
        src: 'https://www.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/a287733.html?embed=1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the legacy note path on the embed host, which answers it with a 404', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/287733.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a page path that does not open the pathname', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/x/documents/28200073/pages/1/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a legacy note path that does not open the pathname', async () => {
      const value =
        '<iframe src="https://www.documentcloud.org/documents/x/documents/2793355-BLS-Jobs-Release/annotations/287733.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment after the page number', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/28200073/pages/1/extra/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment after the legacy note', async () => {
      const value =
        '<iframe src="https://www.documentcloud.org/documents/2793355-BLS-Jobs-Release/annotations/287733.html/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the query the embed dialog writes', () => {
    it('should drop every viewer setting the publisher chose', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://embed.documentcloud.org/documents/28266454-june-2026-botm/?embed=1&amp;embed=1&amp;title=1&amp;fullscreen=1&amp;onlyshoworg=0&amp;pdf=0&amp;mode=document"
          width="2676.0"
          height="3336.0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '28266454',
        src: 'https://embed.documentcloud.org/documents/28266454-june-2026-botm/',
        thumbnail:
          'https://s3.documentcloud.org/documents/28266454/pages/june-2026-botm-p1-normal.gif',
        width: 2676,
        height: 3336,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the sidebar setting', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/1015756-restraint-seclusions-report-ct-2012-13/?embed=1&amp;sidebar=false&amp;pdf=0&amp;onlyshoworg=0&amp;fullscreen=1&amp;embed=1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'documentcloud',
        id: '1015756',
        src: 'https://embed.documentcloud.org/documents/1015756-restraint-seclusions-report-ct-2012-13/',
        thumbnail:
          'https://s3.documentcloud.org/documents/1015756/pages/restraint-seclusions-report-ct-2012-13-p1-normal.gif',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker', async () => {
      const value =
        '<iframe src="https://embed.documentcloud.org/documents/3694123-Feedback-on-the-Nakshe-Portal/?embed=1&amp;utm_source=newsletter"></iframe>'
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
