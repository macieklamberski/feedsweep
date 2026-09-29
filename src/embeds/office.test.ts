import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { officeEmbedResolver, officeResolveEmbed } from './office.js'

describe('officeResolveEmbed', () => {
  describe('happy paths', () => {
    it('should name the document and its file name from the src parameter', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fsites.gatech.edu%2Fsga%2Ffiles%2F2021%2F12%2FOffering-Students-Flexibility-When-They-Are-Ill.docx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fsites.gatech.edu%2Fsga%2Ffiles%2F2021%2F12%2FOffering-Students-Flexibility-When-They-Are-Ill.docx',
        url: 'https://sites.gatech.edu/sga/files/2021/12/Offering-Students-Flexibility-When-They-Are-Ill.docx',
        title: 'Offering-Students-Flexibility-When-They-Are-Ill.docx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should read the share spelling of the same viewer', () => {
      const value =
        'https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx',
        url: 'https://example.com/deck.pptx',
        title: 'deck.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should mint https for an http carrier, which the viewer redirects there', () => {
      const value =
        'http://view.officeapps.live.com/op/embed.aspx?src=http%3A%2F%2Fcutsarah.blog.uma.ac.id%2Fwp-content%2Fuploads%2Fsites%2F405%2F2023%2F01%2FKuliah-APIO-1_PENGANTAR-1.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=http%3A%2F%2Fcutsarah.blog.uma.ac.id%2Fwp-content%2Fuploads%2Fsites%2F405%2F2023%2F01%2FKuliah-APIO-1_PENGANTAR-1.pptx',
        url: 'http://cutsarah.blog.uma.ac.id/wp-content/uploads/sites/405/2023/01/Kuliah-APIO-1_PENGANTAR-1.pptx',
        title: 'Kuliah-APIO-1_PENGANTAR-1.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the aspect ratio and first slide and drop the share link tracking', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx&wdAr=1.7777777777777777&wdStartOn=3&wdOrigin=BROWSELINK&utm_source=hs_email'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx&wdAr=1.7777777777777777&wdStartOn=3',
        url: 'https://example.com/deck.pptx',
        title: 'deck.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a viewer naming no document', () => {
      const value = 'https://view.officeapps.live.com/op/embed.aspx'

      expect(officeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route on the host that is not the viewer', () => {
      const value =
        'https://view.officeapps.live.com/op/generate.aspx?src=https%3A%2F%2Fexample.com%2Fa.docx'

      expect(officeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a viewer path with a segment before it', () => {
      const value =
        'https://view.officeapps.live.com/x/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.docx'

      expect(officeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a viewer path with a segment after it', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx/extra?src=https%3A%2F%2Fexample.com%2Fa.docx'

      expect(officeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a document url with no host', () => {
      const value = 'https://view.officeapps.live.com/op/embed.aspx?src=%2Ffiles%2Fa.docx'

      expect(officeResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read the capitalised spelling of the viewer path', () => {
      const value =
        'https://view.officeapps.live.com/op/View.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/View.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx',
        url: 'https://example.com/deck.pptx',
        title: 'deck.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should read a viewer path with a doubled leading slash', () => {
      const value =
        'https://view.officeapps.live.com//op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com//op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx',
        url: 'https://example.com/deck.pptx',
        title: 'deck.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should read a protocol-relative document url', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=%2F%2Fexample.com%2Fdeck.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=%2F%2Fexample.com%2Fdeck.pptx',
        url: '//example.com/deck.pptx',
        title: 'deck.pptx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should leave a download url untitled', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fuc%3Fexport%3Ddownload%26id%3Dabc'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fuc%3Fexport%3Ddownload%26id%3Dabc',
        url: 'https://example.com/uc?export=download&id=abc',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should decode a file name the document url escaped', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FQ3%2520report.xlsx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FQ3%2520report.xlsx',
        url: 'https://example.com/Q3%20report.xlsx',
        title: 'Q3 report.xlsx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a file name that is not valid escaping', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2F100%25.xlsx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2F100%25.xlsx',
        url: 'https://example.com/100%.xlsx',
        title: '100%.xlsx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('officeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, officeEmbedResolver)

  describe('happy paths', () => {
    it('should name the document and leave the plugin label alone', async () => {
      const value = html`
        <iframe
          src="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Falarm.engr.uconn.edu%2Fwp-content%2Fuploads%2Fsites%2F2733%2F2019%2F10%2FAnnounce-Marrakesh-CSCS-2019-PLENARY-LECTURE.docx"
          title="Embedded Document"
          class="ead-iframe"
          style="width: 100%;height: 500px;border: none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'office',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Falarm.engr.uconn.edu%2Fwp-content%2Fuploads%2Fsites%2F2733%2F2019%2F10%2FAnnounce-Marrakesh-CSCS-2019-PLENARY-LECTURE.docx',
        url: 'https://alarm.engr.uconn.edu/wp-content/uploads/sites/2733/2019/10/Announce-Marrakesh-CSCS-2019-PLENARY-LECTURE.docx',
        height: 500,
        title: 'Announce-Marrakesh-CSCS-2019-PLENARY-LECTURE.docx',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://view.officeapps.live.com.evil.test/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.docx"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the viewer path on a foreign host', async () => {
      const value =
        '<iframe src="https://evil.test/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.docx"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The plugin writes a protocol-relative src, which the pipeline resolves against the feed first.
describeForEachParser('the office viewer on an http feed', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'http://cutsarah.blog.uma.ac.id/post',
    })
  }

  it('should mint the https viewer for the protocol-relative carrier', async () => {
    const value = html`
      <iframe
        src="//view.officeapps.live.com/op/embed.aspx?src=http%3A%2F%2Fcutsarah.blog.uma.ac.id%2Fwp-content%2Fuploads%2Fsites%2F405%2F2023%2F01%2FKuliah-APIO-1_PENGANTAR-1.pptx"
        title="Embedded Document"
        class="ead-iframe"
        style="width: 100%;height: 100%;border: none;position: absolute;left: 0;top: 0;"
      ></iframe>
    `
    const result = await convert(value)

    expect(result).toContain(
      'data-embed-src="https://view.officeapps.live.com/op/embed.aspx?src=http%3A%2F%2Fcutsarah.blog.uma.ac.id%2Fwp-content%2Fuploads%2Fsites%2F405%2F2023%2F01%2FKuliah-APIO-1_PENGANTAR-1.pptx"',
    )
  })
})
