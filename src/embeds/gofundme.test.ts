import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { gofundmeEmbedResolver, gofundmeResolveEmbed, readGofundmeHeight } from './gofundme.js'

describe('gofundmeResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the large widget url', () => {
      const value = 'https://www.gofundme.com/f/save-the-hall/widget/large'
      const expected: EmbedResolverResult = {
        provider: 'gofundme',
        id: 'save-the-hall',
        src: 'https://www.gofundme.com/f/save-the-hall/widget/large',
        url: 'https://www.gofundme.com/f/save-the-hall',
      }

      expect(gofundmeResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the large widget for a medium one', () => {
      const value = 'https://www.gofundme.com/f/save-the-hall/widget/medium'
      const expected: EmbedResolverResult = {
        provider: 'gofundme',
        id: 'save-the-hall',
        src: 'https://www.gofundme.com/f/save-the-hall/widget/large',
        url: 'https://www.gofundme.com/f/save-the-hall',
      }

      expect(gofundmeResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the tracking query the loader writes', () => {
      const value =
        'https://www.gofundme.com/f/save-the-hall/widget/large?utm_content=example.com&utm_medium=referral&utm_source=widget#:~:tcm-regime=GDPR&tcm-prompt=Hidden'
      const expected: EmbedResolverResult = {
        provider: 'gofundme',
        id: 'save-the-hall',
        src: 'https://www.gofundme.com/f/save-the-hall/widget/large',
        url: 'https://www.gofundme.com/f/save-the-hall',
      }

      expect(gofundmeResolveEmbed(value)).toEqual(expected)
    })

    it('should use the slug as written', () => {
      const value = 'https://www.gofundme.com/f/Save-The-Hall/widget/large'
      const expected: EmbedResolverResult = {
        provider: 'gofundme',
        id: 'Save-The-Hall',
        src: 'https://www.gofundme.com/f/Save-The-Hall/widget/large',
        url: 'https://www.gofundme.com/f/Save-The-Hall',
      }

      expect(gofundmeResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the campaign page, which is not a widget', () => {
      expect(gofundmeResolveEmbed('https://www.gofundme.com/f/save-the-hall')).toBeUndefined()
    })

    it('should ignore a campaign route other than the widget', () => {
      const value = 'https://www.gofundme.com/f/save-the-hall/donate'

      expect(gofundmeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a charity widget on another route', () => {
      const value = 'https://www.gofundme.com/charity/save-the-hall/widget/donationsbtn'

      expect(gofundmeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget route that is not the first segment', () => {
      const value = 'https://www.gofundme.com/x/f/save-the-hall/widget/large'

      expect(gofundmeResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget route naming no campaign', () => {
      expect(gofundmeResolveEmbed('https://www.gofundme.com/f/')).toBeUndefined()
    })

    it('should ignore the widget path on a foreign host', () => {
      const value = 'https://evil.test/f/save-the-hall/widget/large'

      expect(gofundmeResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('gofundmeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, gofundmeEmbedResolver)

  describe('happy paths', () => {
    it('should read the frame the loader writes, without its starting height', async () => {
      const value = html`
        <iframe
          height="500"
          class="gfm-embed-iframe"
          width="100%"
          frameborder="0"
          scrolling="no"
          src="https://www.gofundme.com/f/save-the-hall/widget/large?utm_content=example.com&utm_medium=referral&utm_source=widget"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'gofundme',
        id: 'save-the-hall',
        src: 'https://www.gofundme.com/f/save-the-hall/widget/large',
        url: 'https://www.gofundme.com/f/save-the-hall',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a frame of the campaign page', async () => {
      const value = '<iframe src="https://www.gofundme.com/f/save-the-hall"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readGofundmeHeight', () => {
  // What a live widget posts once rendered, framed 600 wide.
  it('should read the height out of a resize message', () => {
    const value = { type: 'gfm-embed-widget-resize', offsetHeight: 559, offsetWidth: 480 }

    expect(readGofundmeHeight(value)).toBe(559)
  })

  it('should read nothing from a widget that has not rendered', () => {
    const value = { type: 'gfm-embed-widget-resize', offsetHeight: 0, offsetWidth: 480 }

    expect(readGofundmeHeight(value)).toBeUndefined()
  })

  it('should read nothing from another message type', () => {
    const value = { type: 'resize', offsetHeight: 559, offsetWidth: 480 }

    expect(readGofundmeHeight(value)).toBeUndefined()
  })

  it('should read nothing from a string message', () => {
    expect(readGofundmeHeight('gfm-embed-widget-resize')).toBeUndefined()
  })

  it('should read nothing from an empty message', () => {
    expect(readGofundmeHeight(null)).toBeUndefined()
  })
})
