import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { geogebraEmbedResolver, geogebraResolveEmbed } from './geogebra.js'

describe('geogebraResolveEmbed', () => {
  describe('happy paths', () => {
    it('should read the material iframe and drop its display options', () => {
      const value =
        'https://www.geogebra.org/material/iframe/id/yqZMrWXI/width/500/height/400/border/eeeeee/rc/false/ai/false/sdz/false/smb/false/stb/false/stbh/true/ld/false/sri/false/at/auto'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'yqZMrWXI',
        src: 'https://www.geogebra.org/material/iframe/id/yqZMrWXI',
        url: 'https://www.geogebra.org/m/yqZMrWXI',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should read the material iframe with no options', () => {
      const value = 'https://www.geogebra.org/material/iframe/id/yqZMrWXI'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'yqZMrWXI',
        src: 'https://www.geogebra.org/material/iframe/id/yqZMrWXI',
        url: 'https://www.geogebra.org/m/yqZMrWXI',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the material iframe for the material page', () => {
      const value = 'https://www.geogebra.org/m/NM8q9xuS'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'NM8q9xuS',
        src: 'https://www.geogebra.org/material/iframe/id/NM8q9xuS',
        url: 'https://www.geogebra.org/m/NM8q9xuS',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should read the material page route word in any case', () => {
      const value = 'https://www.geogebra.org/M/NM8q9xuS'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'NM8q9xuS',
        src: 'https://www.geogebra.org/material/iframe/id/NM8q9xuS',
        url: 'https://www.geogebra.org/m/NM8q9xuS',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the material iframe for the Classic app', () => {
      const value = 'https://www.geogebra.org/classic/gjencrn6?embed'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'gjencrn6',
        src: 'https://www.geogebra.org/material/iframe/id/gjencrn6',
        url: 'https://www.geogebra.org/m/gjencrn6',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should read the bare host', () => {
      const value = 'https://geogebra.org/material/iframe/id/yqZMrWXI/width/500/height/400'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'yqZMrWXI',
        src: 'https://www.geogebra.org/material/iframe/id/yqZMrWXI',
        url: 'https://www.geogebra.org/m/yqZMrWXI',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the material iframe with no id', () => {
      const value = 'https://www.geogebra.org/material/iframe/id'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another material route', () => {
      const value = 'https://www.geogebra.org/material/xyz/id/yqZMrWXI'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the material iframe with its options before the id', () => {
      const value = 'https://www.geogebra.org/material/iframe/width/500/id/yqZMrWXI'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the material iframe route words in another case', () => {
      const value = 'https://www.geogebra.org/material/IFRAME/id/yqZMrWXI'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Classic app route word in another case', () => {
      const value = 'https://www.geogebra.org/CLASSIC/gjencrn6?embed'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the material route under a leading segment', () => {
      const value = 'https://www.geogebra.org/x/material/iframe/id/yqZMrWXI'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the material page with no id', () => {
      const value = 'https://www.geogebra.org/m'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after the material page', () => {
      const value = 'https://www.geogebra.org/m/NM8q9xuS/extra'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Classic app with no material', () => {
      const value = 'https://www.geogebra.org/classic?embed'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a trailing segment after the Classic app material', () => {
      const value = 'https://www.geogebra.org/classic/gjencrn6/extra'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an app route that is not claimed', () => {
      const value = 'https://www.geogebra.org/calculator'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the retired tube host', () => {
      const value = 'https://tube.geogebra.org/material/iframe/id/381965/width/800/height/600'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/material/iframe/id/yqZMrWXI'

      expect(geogebraResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use an id as written, even if the iframe renders nothing', () => {
      const value = 'https://www.geogebra.org/material/iframe/id/yqzmrwxi'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'yqzmrwxi',
        src: 'https://www.geogebra.org/material/iframe/id/yqzmrwxi',
        url: 'https://www.geogebra.org/m/yqzmrwxi',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking query', () => {
      const value = 'https://www.geogebra.org/m/NM8q9xuS?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'NM8q9xuS',
        src: 'https://www.geogebra.org/material/iframe/id/NM8q9xuS',
        url: 'https://www.geogebra.org/m/NM8q9xuS',
        ratio: '4/3',
      }

      expect(geogebraResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('geogebraEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, geogebraEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the snippet declares', async () => {
      const value = html`
        <iframe
          scrolling="no"
          src="https://www.geogebra.org/material/iframe/id/yqZMrWXI/width/500/height/400/border/eeeeee/rc/false/ai/false/sdz/false/smb/false/stb/false/stbh/true/ld/false/sri/false/at/auto"
          width="500px"
          height="400px"
          style="border:0px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'yqZMrWXI',
        src: 'https://www.geogebra.org/material/iframe/id/yqZMrWXI',
        url: 'https://www.geogebra.org/m/yqZMrWXI',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the material iframe for a framed material page', async () => {
      const value = html`
        <iframe
          src="https://www.geogebra.org/m/NM8q9xuS"
          scrolling="no"
          width="624px"
          height="700px"
          style="border: 0px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'geogebra',
        id: 'NM8q9xuS',
        src: 'https://www.geogebra.org/material/iframe/id/NM8q9xuS',
        url: 'https://www.geogebra.org/m/NM8q9xuS',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://geogebra.org.evil.test/material/iframe/id/yqZMrWXI"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the retired tube host', async () => {
      const value =
        '<iframe src="https://tube.geogebra.org/material/iframe/id/381965/width/800/height/600"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('geogebra through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should build the placeholder from the share dialog snippet', async () => {
    const value = html`
      <iframe
        src="https://www.geogebra.org/material/iframe/id/VgXvS7qM/width/775/height/424/border/888888/rc/false/ai/false/sdz/true/smb/false/stb/false/stbh/true/ld/false/sri/true/at/auto"
        scrolling="no"
        width="775"
        height="424"
        style="border: 0px;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="geogebra"
        data-embed-id="VgXvS7qM"
        data-embed-src="https://www.geogebra.org/material/iframe/id/VgXvS7qM"
        data-embed-url="https://www.geogebra.org/m/VgXvS7qM"
        data-embed-ratio="4/3"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
