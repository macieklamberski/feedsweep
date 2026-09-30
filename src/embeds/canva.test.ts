import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { canvaIframeEmbedResolver, canvaResolveEmbed, canvaWidgetEmbedResolver } from './canva.js'

describe('canvaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the design id and its share token as one id', () => {
      const value = 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw',
        src: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed',
        url: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should read a design id carrying a dash', () => {
      const value = 'https://www.canva.com/design/DAG7JStv-4E/vdoj4TCbUUSC2j5QjhLCKw/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG7JStv-4E/vdoj4TCbUUSC2j5QjhLCKw',
        src: 'https://www.canva.com/design/DAG7JStv-4E/vdoj4TCbUUSC2j5QjhLCKw/view?embed',
        url: 'https://www.canva.com/design/DAG7JStv-4E/vdoj4TCbUUSC2j5QjhLCKw/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should read a share token carrying a dash', () => {
      const value = 'https://www.canva.com/design/DAGKSUHAmr0/-mfI7II2OqwQHyy_Gfx62w/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAGKSUHAmr0/-mfI7II2OqwQHyy_Gfx62w',
        src: 'https://www.canva.com/design/DAGKSUHAmr0/-mfI7II2OqwQHyy_Gfx62w/view?embed',
        url: 'https://www.canva.com/design/DAGKSUHAmr0/-mfI7II2OqwQHyy_Gfx62w/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the watch route of a video design', () => {
      const value = 'https://www.canva.com/design/DAG62mbEN8w/Qvs_ZzTGrVyXRpFtzi5plQ/watch?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAG62mbEN8w/Qvs_ZzTGrVyXRpFtzi5plQ',
        src: 'https://www.canva.com/design/DAG62mbEN8w/Qvs_ZzTGrVyXRpFtzi5plQ/watch?embed',
        url: 'https://www.canva.com/design/DAG62mbEN8w/Qvs_ZzTGrVyXRpFtzi5plQ/watch',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the older snippet that names no share token', () => {
      const value = 'https://www.canva.com/design/DAFTQwmk-7U/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAFTQwmk-7U',
        src: 'https://www.canva.com/design/DAFTQwmk-7U/view?embed',
        url: 'https://www.canva.com/design/DAFTQwmk-7U/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the meta flag the oEmbed snippet writes', () => {
      const value =
        'https://www.canva.com/design/DAF_VGS3W3Y/EoSxKp1t6a1Sfsq9j-4_8A/view?embed&meta'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAF_VGS3W3Y/EoSxKp1t6a1Sfsq9j-4_8A',
        src: 'https://www.canva.com/design/DAF_VGS3W3Y/EoSxKp1t6a1Sfsq9j-4_8A/view?embed',
        url: 'https://www.canva.com/design/DAF_VGS3W3Y/EoSxKp1t6a1Sfsq9j-4_8A/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should frame the design page and drop its tracking query', () => {
      const value =
        'https://www.canva.com/design/DAC3_5NqG20/view?utm_content=DAC3_5NqG20&utm_campaign=designshare&utm_medium=embeds&utm_source=link'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAC3_5NqG20',
        src: 'https://www.canva.com/design/DAC3_5NqG20/view?embed',
        url: 'https://www.canva.com/design/DAC3_5NqG20/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the bare canva.com host', () => {
      const value = 'https://canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw',
        src: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed',
        url: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the design route on a canva.com subdomain', () => {
      const value =
        'https://document-export.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a design url with no view route', () => {
      const value = 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/edit'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with more segments than a design and its token', () => {
      const value =
        'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/extra/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed share token as written, even if the player answers an error', () => {
      const value = 'https://www.canva.com/design/DAHLowacSd4/token.with.dots/view?embed'
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAHLowacSd4/token.with.dots',
        src: 'https://www.canva.com/design/DAHLowacSd4/token.with.dots/view?embed',
        url: 'https://www.canva.com/design/DAHLowacSd4/token.with.dots/view',
      }

      expect(canvaResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a design route below another path', () => {
      const value = 'https://www.canva.com/templates/design/DAHLowacSd4/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a page below the view route', () => {
      const value = 'https://www.canva.com/design/DAHLowacSd4/view/comments'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an uppercase view route', () => {
      const value = 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/VIEW?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an uppercase design route', () => {
      const value = 'https://www.canva.com/DESIGN/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a marketing page', () => {
      const value = 'https://www.canva.com/templates/EAFabc/view'

      expect(canvaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('canvaIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, canvaIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the viewer iframe', async () => {
      const value = html`
        <iframe
          loading="lazy"
          style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0; margin: 0;"
          src="https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed"
          allowfullscreen="allowfullscreen"
          allow="fullscreen"
          width="100%"
          height="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw',
        src: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed',
        url: 'https://www.canva.com/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the design route', async () => {
      const value = html`
        <iframe src="https://evil.test/design/DAHLowacSd4/Iib_p9ZXNzXpiYJosyMbIw/view?embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('canvaWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, canvaWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the legacy loader mount with room for its byline bar', async () => {
      const value = html`
        <div
          class="canva-embed"
          data-height-ratio="1"
          data-design-id="DAC3_5NqG20"
          style="padding:100% 5px 5px 5px;background:rgba(0,0,0,0.03);border-radius:8px;"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAC3_5NqG20',
        src: 'https://www.canva.com/design/DAC3_5NqG20/view?embed',
        url: 'https://www.canva.com/design/DAC3_5NqG20/view',
        ratio: '250/298',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size for a mount with no height ratio', async () => {
      const value = html`
        <div class="canva-embed" data-design-id="DAC3_5NqG20"></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAC3_5NqG20',
        src: 'https://www.canva.com/design/DAC3_5NqG20/view?embed',
        url: 'https://www.canva.com/design/DAC3_5NqG20/view',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should use a malformed design id as written, even if the player answers an error', async () => {
      const value = html`
        <div class="canva-embed" data-height-ratio="1" data-design-id="DAC3_5NqG20%2F..%2Fedit"></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'canva',
        id: 'DAC3_5NqG20%2F..%2Fedit',
        src: 'https://www.canva.com/design/DAC3_5NqG20%2F..%2Fedit/view?embed',
        url: 'https://www.canva.com/design/DAC3_5NqG20%2F..%2Fedit/view',
        ratio: '250/298',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// A file on the export host reaches the resolver as an enclosure, and must stay the file.
describeForEachParser('canva through the pipeline', (parseHtml) => {
  it('should leave a design export enclosure as an image', async () => {
    const enclosures = [
      {
        url: 'https://document-export.canva.com/DAG7JStv-4E/1/thumbnail/0001.png',
        type: 'image/png',
      },
    ]
    const value = await transformContent('<p>Body</p>', {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })

    const expected = html`
      <img data-enclosure="" src="https://document-export.canva.com/DAG7JStv-4E/1/thumbnail/0001.png">
      <p>Body</p>
    `

    expect(value).toEqualHtml(expected)
  })
})
