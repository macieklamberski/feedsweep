import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  condenastIframeEmbedResolver,
  condenastResolveEmbed,
  condenastScriptEmbedResolver,
} from './condenast.js'

const readPlaceholder = (
  result: string,
  parseHtml: (value: string) => Document,
): Record<string, string> => {
  const element = parseHtml(result).querySelector('[data-embed-src]')
  const fields: Record<string, string> = {}

  for (const name of element?.getAttributeNames() ?? []) {
    const value = element?.getAttribute(name)

    if (name.startsWith('data-embed-') && value) {
      fields[name.replace('data-embed-', '')] = value
    }
  }

  return fields
}

describe('condenastResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the frame from the script embed the share dialog writes', () => {
      const value =
        '//player-backend.cnevids.com/script/video/5be1fd3d8c1abc6e6400000f.js?iu=/3379/newyorker.dart/share'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5be1fd3d8c1abc6e6400000f',
        src: 'https://player.cnevids.com/iframe/video/5be1fd3d8c1abc6e6400000f',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video after the player in the older script embed', () => {
      const value =
        '//player.cnevids.com/embedjs/5345874069702d66a4000000/video/55cb6a6c61646d6a30000011.js'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '55cb6a6c61646d6a30000011',
        src: 'https://player.cnevids.com/iframe/video/55cb6a6c61646d6a30000011',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video before the player in the oldest frame', () => {
      const value =
        'http://player.cnevids.com/embed/54627cfc61646d2fc1030000/52f2ad0169702d21a5080000'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '54627cfc61646d2fc1030000',
        src: 'https://player.cnevids.com/iframe/video/54627cfc61646d2fc1030000',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })

    it('should read the minted frame back to the same video', () => {
      const value = 'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5ce439aa34e7941264b4701c',
        src: 'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })

    it('should pass an id through as written', () => {
      const value = 'https://player.cnevids.com/iframe/video/5CE439AA34E7941264B4701C'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5CE439AA34E7941264B4701C',
        src: 'https://player.cnevids.com/iframe/video/5CE439AA34E7941264B4701C',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracker from the query', () => {
      const value =
        'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c?utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5ce439aa34e7941264b4701c',
        src: 'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c',
        ratio: '16/9',
      }

      expect(condenastResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://evil.test/script/video/5be1fd3d8c1abc6e6400000f.js'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player route below another segment', () => {
      const value = 'https://player.cnevids.com/x/iframe/video/5ce439aa34e7941264b4701c'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the video', () => {
      const value = 'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c/extra'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the oldest frame below another segment', () => {
      const value =
        'https://player.cnevids.com/x/embed/54627cfc61646d2fc1030000/52f2ad0169702d21a5080000'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a segment after the oldest frame', () => {
      const value =
        'https://player.cnevids.com/embed/54627cfc61646d2fc1030000/52f2ad0169702d21a5080000/extra'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the route in capitals, which the server answers 404', () => {
      const value = 'https://player.cnevids.com/IFRAME/VIDEO/5ce439aa34e7941264b4701c'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a playlist', () => {
      const value = 'https://player.cnevids.com/iframe/playlist/5ce439aa34e7941264b4701c'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a player bundle on the frontend host', () => {
      const value = 'https://player-frontend.cnevids.com/player/main-b8528c70fedb0a451c7d.js'

      expect(condenastResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('condenastIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, condenastIframeEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform ratio over the box the oldest frame declares', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="390"
          src="http://player.cnevids.com/embed/5432be7861646d01ff010000/52f2ad0169702d21a5080000"
          width="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5432be7861646d01ff010000',
        src: 'https://player.cnevids.com/iframe/video/5432be7861646d01ff010000',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/5432be7861646d01ff010000/52f2ad0169702d21a5080000"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('condenastScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, condenastScriptEmbedResolver)

  describe('happy paths', () => {
    it('should mint the frame from the script embed', async () => {
      const value = html`
        <script
          async=""
          src="//player-backend.cnevids.com/script/video/5ce439aa34e7941264b4701c.js?iu=/3379/vanityfair.dart/share"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'condenast',
        id: '5ce439aa34e7941264b4701c',
        src: 'https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the platform host in its query', async () => {
      const value =
        '<script src="https://evil.test/script/video/5ce439aa34e7941264b4701c.js?player.cnevids.com/"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('condenast through the pipeline', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  const placeholder = async (value: string): Promise<Record<string, string>> => {
    return readPlaceholder(await convert(value), parseHtml)
  }

  it('should turn the bare script embed into a placeholder', async () => {
    const value = html`
      <script
        async
        src="//player-backend.cnevids.com/script/video/5be1fd3d8c1abc6e6400000f.js?iu=/3379/newyorker.dart/share"
      ></script>
    `
    const expected: Record<string, string> = {
      provider: 'condenast',
      id: '5be1fd3d8c1abc6e6400000f',
      src: 'https://player.cnevids.com/iframe/video/5be1fd3d8c1abc6e6400000f',
      ratio: '16/9',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  it('should leave no empty paragraph around a script embed', async () => {
    const value = html`
      <p>
        <script
          async=""
          src="//player-backend.cnevids.com/script/video/5ce439aa34e7941264b4701c.js?iu=/3379/vanityfair.dart/share"
        ></script>
      </p>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="5ce439aa34e7941264b4701c"
        data-embed-provider="condenast"
        data-embed-src="https://player.cnevids.com/iframe/video/5ce439aa34e7941264b4701c"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn the oldest frame into a placeholder', async () => {
    const value = html`
      <iframe
        height="390"
        src="http://player.cnevids.com/embed/54627cfc61646d2fc1030000/52f2ad0169702d21a5080000"
        width="560"
      ></iframe>
    `
    const expected: Record<string, string> = {
      provider: 'condenast',
      id: '54627cfc61646d2fc1030000',
      src: 'https://player.cnevids.com/iframe/video/54627cfc61646d2fc1030000',
      ratio: '16/9',
    }

    expect(await placeholder(value)).toEqual(expected)
  })
})
