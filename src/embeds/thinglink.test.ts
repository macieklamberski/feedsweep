import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  thinglinkIframeEmbedResolver,
  thinglinkImageEmbedResolver,
  thinglinkResolveEmbed,
} from './thinglink.js'

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
        url: 'https://www.thinglink.com/scene/853609259307368449',
        thumbnail: 'https://cdn.thinglink.me/api/image/853609259307368449/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should mint the card viewer for a scene framed on the view route', () => {
      const value = 'https://www.thinglink.com/view/scene/1681632338456346625'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1681632338456346625',
        src: 'https://www.thinglink.com/card/1681632338456346625',
        url: 'https://www.thinglink.com/scene/1681632338456346625',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a thinglink url naming no viewer', () => {
      const value = 'https://www.thinglink.com/pricing'

      expect(thinglinkResolveEmbed(new URL(value))).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should refuse a card route with no id after it', () => {
      const value = 'https://www.thinglink.com/card'

      expect(thinglinkResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should use a malformed scene id as written, even if the player answers an error', () => {
      const value = 'https://www.thinglink.com/card/8536092593073684%2Fother'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '8536092593073684%2Fother',
        src: 'https://www.thinglink.com/card/8536092593073684%2Fother',
        url: 'https://www.thinglink.com/scene/8536092593073684%2Fother',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should refuse a route that is not a viewer', () => {
      const value = 'https://www.thinglink.com/scene/853609259307368449'

      expect(thinglinkResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should refuse the view route without the scene word', () => {
      const value = 'https://www.thinglink.com/view/other/853609259307368449'

      expect(thinglinkResolveEmbed(new URL(value))).toBeUndefined()
    })
  })

  describe('the four viewer routes, which share one scene id space', () => {
    it('should mint the card viewer for a mediacard', () => {
      const value = 'https://www.thinglink.com/mediacard/794327401873014786'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '794327401873014786',
        src: 'https://www.thinglink.com/card/794327401873014786',
        url: 'https://www.thinglink.com/scene/794327401873014786',
        thumbnail: 'https://cdn.thinglink.me/api/image/794327401873014786/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should mint the card viewer for a videocard', () => {
      const value = 'https://www.thinglink.com/videocard/1349876451188408322'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1349876451188408322',
        src: 'https://www.thinglink.com/card/1349876451188408322',
        url: 'https://www.thinglink.com/scene/1349876451188408322',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })
  })

  describe('the query and fragment the carrier arrives with', () => {
    it('should drop the autoplay the publisher set on the viewer', () => {
      const value = 'https://www.thinglink.com/mediacard/794327401873014786?autoplay=1'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '794327401873014786',
        src: 'https://www.thinglink.com/card/794327401873014786',
        url: 'https://www.thinglink.com/scene/794327401873014786',
        thumbnail: 'https://cdn.thinglink.me/api/image/794327401873014786/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should drop the secret fragment the WordPress embed appends', () => {
      const value = 'https://www.thinglink.com/card/853609259307368449#?secret=a1b2c3d4e5'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '853609259307368449',
        src: 'https://www.thinglink.com/card/853609259307368449',
        url: 'https://www.thinglink.com/scene/853609259307368449',
        thumbnail: 'https://cdn.thinglink.me/api/image/853609259307368449/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should mint the card viewer for the accessibility viewer', () => {
      const value = 'https://www.thinglink.com/view/scene/1681632338456346625/accessibility'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1681632338456346625',
        src: 'https://www.thinglink.com/card/1681632338456346625',
        url: 'https://www.thinglink.com/scene/1681632338456346625',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })
  })

  describe('the poster the scene id alone composes', () => {
    it('should mint the poster for a scene below the ceiling', () => {
      const value = 'https://www.thinglink.com/card/496982514175311874'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '496982514175311874',
        src: 'https://www.thinglink.com/card/496982514175311874',
        url: 'https://www.thinglink.com/scene/496982514175311874',
        thumbnail: 'https://cdn.thinglink.me/api/image/496982514175311874/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should mint the poster for the highest scene below the ceiling', () => {
      const value = 'https://www.thinglink.com/card/1199999999999999999'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1199999999999999999',
        src: 'https://www.thinglink.com/card/1199999999999999999',
        url: 'https://www.thinglink.com/scene/1199999999999999999',
        thumbnail: 'https://cdn.thinglink.me/api/image/1199999999999999999/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should state no thumbnail for a scene at the ceiling', () => {
      const value = 'https://www.thinglink.com/card/1200000000000000000'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1200000000000000000',
        src: 'https://www.thinglink.com/card/1200000000000000000',
        url: 'https://www.thinglink.com/scene/1200000000000000000',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should state no thumbnail for a scene above the ceiling', () => {
      const value = 'https://www.thinglink.com/card/1681632338456346625'
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1681632338456346625',
        src: 'https://www.thinglink.com/card/1681632338456346625',
        url: 'https://www.thinglink.com/scene/1681632338456346625',
        ratio: '3/2',
      }

      expect(thinglinkResolveEmbed(new URL(value))).toEqual(expected)
    })
  })
})

describeForEachParser('thinglinkIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, thinglinkIframeEmbedResolver)

  describe('happy paths', () => {
    it('should ignore the size the carrier states', async () => {
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
        url: 'https://www.thinglink.com/scene/853609259307368449',
        thumbnail: 'https://cdn.thinglink.me/api/image/853609259307368449/1024/10/scaletowidth',
        ratio: '3/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the declared box beside the original image size', async () => {
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
        src: 'https://www.thinglink.com/card/1681632338456346625',
        url: 'https://www.thinglink.com/scene/1681632338456346625',
        ratio: '3/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size when the carrier declares none', async () => {
      const value = html`
        <iframe src="https://www.thinglink.com/videocard/1318748169202302978"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '1318748169202302978',
        src: 'https://www.thinglink.com/card/1318748169202302978',
        url: 'https://www.thinglink.com/scene/1318748169202302978',
        ratio: '3/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe src="https://evil.test/card/853609259307368449"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('thinglinkImageEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, thinglinkImageEmbedResolver)

  describe('happy paths', () => {
    it('should read the scene off the image path', async () => {
      const value = html`
        <img
          style="max-width:100%"
          src="https://cdn.thinglink.me/api/image/586514552254889988/1024/10/scaletowidth#tl-586514552254889988;1043138249'"
          class="alwaysThinglink"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'thinglink',
        id: '586514552254889988',
        src: 'https://www.thinglink.com/card/586514552254889988',
        url: 'https://www.thinglink.com/scene/586514552254889988',
        thumbnail:
          "https://cdn.thinglink.me/api/image/586514552254889988/1024/10/scaletowidth#tl-586514552254889988;1043138249'",
        ratio: '3/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the legacy image off the ThingLink image host, which names no scene', async () => {
      const value = html`
        <img
          class="alwaysThinglink"
          src="http://s2.thingpic.com/images/V2/3qMvasebEyafJ6vuinCY.jpeg#tl-269211195280457729"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an image route that is not the scene render', async () => {
      const value = html`
        <img class="alwaysThinglink" src="https://cdn.thinglink.me/api/avatar/586514552254889988/1024" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a scene render below a leading segment', async () => {
      const value = html`
        <img class="alwaysThinglink" src="https://cdn.thinglink.me/x/image/586514552254889988/1024" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a scene id that is not a number', async () => {
      const value = html`
        <img class="alwaysThinglink" src="https://cdn.thinglink.me/api/image/a%2F..%2Fb/1024" />
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
      url: 'https://www.thinglink.com/scene/853609259307368449',
      thumbnail: 'https://cdn.thinglink.me/api/image/853609259307368449/1024/10/scaletowidth',
      ratio: '3/2',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  it('should claim the script embed and keep its image as the poster', async () => {
    const value = html`
      <img
        decoding="async"
        class="alwaysThinglink"
        style="max-width: 100%;"
        src="//cdn.thinglink.me/api/image/1138925775852929025/1024/10/scaletowidth#tl-1138925775852929025;'"
      />
      <script async charset="utf-8" src="//cdn.thinglink.me/jse/embed.js"></script>
    `
    const expected: Record<string, string> = {
      provider: 'thinglink',
      id: '1138925775852929025',
      src: 'https://www.thinglink.com/card/1138925775852929025',
      url: 'https://www.thinglink.com/scene/1138925775852929025',
      thumbnail:
        "https://cdn.thinglink.me/api/image/1138925775852929025/1024/10/scaletowidth#tl-1138925775852929025;'",
      ratio: '3/2',
    }

    expect(await placeholder(value)).toEqual(expected)
  })

  it('should leave a scene named by a link in prose as a link', async () => {
    const value = html`
      <p><a href="https://www.thinglink.com/scene/853609259307368449">A scene</a></p>
    `

    expect(await convert(value)).toBe(value)
  })
})
