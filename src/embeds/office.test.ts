import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { officeEmbedResolver, officeResolveEmbed } from './office.js'

describe('officeResolveEmbed', () => {
  describe('happy paths', () => {
    it('should name the document and its file name from the src parameter', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Ffiles%2FNewsletter.docx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        id: 'https://example.com/files/Newsletter.docx',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Ffiles%2FNewsletter.docx',
        url: 'https://example.com/files/Newsletter.docx',
        title: 'Newsletter.docx',
      }

      expect(officeResolveEmbed(value)).toEqual(expected)
    })

    it('should read the share spelling of the same viewer', () => {
      const value =
        'https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        id: 'https://example.com/deck.pptx',
        src: 'https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fexample.com%2Fdeck.pptx',
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
  })
  describe('edge cases', () => {
    it('should decode a file name the document url escaped', () => {
      const value =
        'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FQ3%2520report.xlsx'
      const expected: EmbedResolverResult = {
        provider: 'office',
        id: 'https://example.com/Q3%20report.xlsx',
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
        id: 'https://example.com/100%.xlsx',
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
          src="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FNewsletter.docx"
          title="Embedded Document"
          class="ead-iframe"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'office',
        id: 'https://example.com/Newsletter.docx',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FNewsletter.docx',
        url: 'https://example.com/Newsletter.docx',
        title: 'Newsletter.docx',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the box a carrier declares', async () => {
      const value = html`
        <iframe
          src="https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FNewsletter.docx"
          width="640"
          height="480"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'office',
        id: 'https://example.com/Newsletter.docx',
        src: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2FNewsletter.docx',
        url: 'https://example.com/Newsletter.docx',
        title: 'Newsletter.docx',
        width: 640,
        height: 480,
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

    it('should ignore a foreign host naming the viewer in its path', async () => {
      const value =
        '<iframe src="https://evil.test/view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.docx"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
