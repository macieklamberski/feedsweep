import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { thinglinkEmbedResolver, thinglinkResolveEmbed } from './thinglink.js'

// Every `data-embed-*` field the placeholder carries, for the shapes that only resolve once the
// pipeline has repaired them and so cannot be asserted on the resolver alone.
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

describe('thinglinkResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a card url', () => {
      const value = 'https://www.thinglink.com/card/853609259307368449'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '853609259307368449',
        src: 'https://www.thinglink.com/card/853609259307368449',
        url: 'https://www.thinglink.com/card/853609259307368449',
      }

      expect(thinglinkResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the viewer the publisher framed', () => {
      const value = 'https://www.thinglink.com/view/scene/1681632338456346625'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1681632338456346625',
        src: 'https://www.thinglink.com/view/scene/1681632338456346625',
        url: 'https://www.thinglink.com/card/1681632338456346625',
      }

      expect(thinglinkResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/thinglink.com/card/853609259307368449'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', () => {
      const value = 'https://thinglink.com.evil.test/card/853609259307368449'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a thinglink url naming no viewer', () => {
      const value = 'https://www.thinglink.com/pricing'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a url that cannot be parsed', () => {
      const value = 'https://['

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should refuse a card route with no id after it', () => {
      const value = 'https://www.thinglink.com/card'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a scene id that is not digits', () => {
      const value = 'https://www.thinglink.com/card/8536092593073684%2Fother'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a route naming an inherited method', () => {
      const value = 'https://www.thinglink.com/toString/853609259307368449'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse the view route without the scene word', () => {
      const value = 'https://www.thinglink.com/view/853609259307368449'

      expect(thinglinkResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('the four viewer routes, which share one scene id space', () => {
    it('should read a mediacard', () => {
      const value = 'https://www.thinglink.com/mediacard/1581411220152385538'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1581411220152385538',
        src: 'https://www.thinglink.com/mediacard/1581411220152385538',
        url: 'https://www.thinglink.com/card/1581411220152385538',
      }

      expect(thinglinkResolveEmbed(value)).toEqual(expected)
    })

    it('should read a videocard', () => {
      const value = 'https://www.thinglink.com/videocard/1349876451188408322'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1349876451188408322',
        src: 'https://www.thinglink.com/videocard/1349876451188408322',
        url: 'https://www.thinglink.com/card/1349876451188408322',
      }

      expect(thinglinkResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the poster the scene id alone would compose', () => {
    // `cdn.thinglink.me/api/image/{id}/1024/10/scaletowidth` serves the same placeholder png for
    // a newer scene as it does for an id that names nothing, so no thumbnail is minted.
    it('should state no thumbnail for a scene whose poster is real', () => {
      const value = 'https://www.thinglink.com/card/496982514175311874'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '496982514175311874',
        src: 'https://www.thinglink.com/card/496982514175311874',
        url: 'https://www.thinglink.com/card/496982514175311874',
      }

      expect(thinglinkResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('thinglinkEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, thinglinkEmbedResolver)

  describe('happy paths', () => {
    it('should let the carrier state the size', async () => {
      const value = html`
        <iframe
          width="549"
          height="480"
          src="https://www.thinglink.com/card/853609259307368449"
          type="text/html"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '853609259307368449',
        src: 'https://www.thinglink.com/card/853609259307368449',
        url: 'https://www.thinglink.com/card/853609259307368449',
        width: 549,
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the declared box over the original image size', async () => {
      const value = html`
        <iframe
          loading="lazy"
          width="960"
          height="540"
          data-original-width="1920"
          data-original-height="1080"
          src="https://www.thinglink.com/view/scene/1681632338456346625"
          type="text/html"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1681632338456346625',
        src: 'https://www.thinglink.com/view/scene/1681632338456346625',
        url: 'https://www.thinglink.com/card/1681632338456346625',
        width: 960,
        height: 540,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size when the carrier declares none', async () => {
      const value = html`
        <iframe src="https://www.thinglink.com/videocard/1581411220152385538"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1581411220152385538',
        src: 'https://www.thinglink.com/videocard/1581411220152385538',
        url: 'https://www.thinglink.com/card/1581411220152385538',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe src="https://evil.test/thinglink.com/card/853609259307368449"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('thinglink shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  const placeholder = async (value: string): Promise<Record<string, string>> => {
    return readPlaceholder(await convert(value), parseHtml)
  }

  it('should resolve a carrier whose url arrives protocol-relative', async () => {
    const value = html`
      <iframe
        width="549"
        height="480"
        src="//www.thinglink.com/card/853609259307368449"
        type="text/html"
        frameborder="0"
        scrolling="no"
      ></iframe>
    `
    const expected: Record<string, string> = {
      provider: 'thinglink',
      id: '853609259307368449',
      src: 'https://www.thinglink.com/card/853609259307368449',
      url: 'https://www.thinglink.com/card/853609259307368449',
      width: '549',
      height: '480',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  it('should leave the embed.js script form to its own static image', async () => {
    const value = html`
      <img
        class="alwaysThinglink"
        src="//cdn.thinglink.me/api/image/1023339413708472321/1024/10/scaletowidth#tl-1023339413708472321;"
      />
      <script
        async
        charset="utf-8"
        src="//cdn.thinglink.me/jse/embed.js"
      ></script>
    `
    const expected = html`
      <img
        class="alwaysThinglink"
        src="https://cdn.thinglink.me/api/image/1023339413708472321/1024/10/scaletowidth#tl-1023339413708472321;"
      />
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a scene named by a link in prose as a link', async () => {
    const value = html`
      <p><a href="https://www.thinglink.com/scene/853609259307368449">A scene</a></p>
    `

    expect(await convert(value)).toBe(value)
  })
})
