import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { piktochartIframeEmbedResolver, piktochartWidgetEmbedResolver } from './piktochart.js'

describeForEachParser('piktochartWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, piktochartWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the uid of the current snippet', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="41b63792605e-speer-it-energie-enquete-2025-copy"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '41b63792605e-speer-it-energie-enquete-2025-copy',
        src: 'https://create.piktochart.com/embed/41b63792605e-speer-it-energie-enquete-2025-copy',
        url: 'https://create.piktochart.com/output/41b63792605e-speer-it-energie-enquete-2025-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the uid of the snippet with a loading overlay', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          style="height: 300px; position: relative;"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas">
              <div class="embed-loading-overlay">
                <img
                  width="60px"
                  alt="Loading..."
                  src="https://create.piktochart.com/loading.gif"
                />
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '25180247-creatividad_pensamiento-critico',
        src: 'https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico',
        url: 'https://create.piktochart.com/output/25180247-creatividad_pensamiento-critico',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the uid of the older snippet from pikto-uid', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          pikto-uid="15972881-bsc-blog-11"
          style="height: 300px; position: relative;"
        >
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas"></div>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '15972881-bsc-blog-11',
        src: 'https://create.piktochart.com/embed/15972881-bsc-blog-11',
        url: 'https://create.piktochart.com/output/15972881-bsc-blog-11',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a snippet with a blank uid', async () => {
      const value = '<div class="piktowrapper-embed" data-uid=""></div>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a div with a uid but not the snippet class', async () => {
      const value = '<div data-uid="25180247-creatividad_pensamiento-critico"></div>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should prefer data-uid when both attributes name a uid', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
          pikto-uid="15972881-bsc-blog-11"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '25180247-creatividad_pensamiento-critico',
        src: 'https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico',
        url: 'https://create.piktochart.com/output/25180247-creatividad_pensamiento-critico',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('piktochartIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, piktochartIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the embed frame', async () => {
      const value = html`
        <iframe
          width="824"
          height="1156"
          frameborder="0"
          scrolling="no"
          style="overflow-y:hidden;"
          src="https://create.piktochart.com/embed/30289406-new-piktochart-copy"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the retired host onto the current one', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="1302"
          scrolling="no"
          src="https://magic.piktochart.com/embed/22263200-media"
          style="overflow-y:hidden;"
          width="800"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '22263200-media',
        src: 'https://create.piktochart.com/embed/22263200-media',
        url: 'https://create.piktochart.com/output/22263200-media',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a uid with a hexadecimal id', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="3414"
          scrolling="no"
          src="https://create.piktochart.com/embed/9b2a880f31c9-quantitative-balancing"
          style="overflow-y: hidden;"
          width="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '9b2a880f31c9-quantitative-balancing',
        src: 'https://create.piktochart.com/embed/9b2a880f31c9-quantitative-balancing',
        url: 'https://create.piktochart.com/output/9b2a880f31c9-quantitative-balancing',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name from the stated title', async () => {
      const value = html`
        <iframe
          src="https://create.piktochart.com/embed/66210838-2024-december-fvr"
          title="2024 December FVR"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '66210838-2024-december-fvr',
        src: 'https://create.piktochart.com/embed/66210838-2024-december-fvr',
        url: 'https://create.piktochart.com/output/66210838-2024-december-fvr',
        ratio: '1/2',
        title: '2024 December FVR',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass the uid on as written', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-NEW-PIKTOCHART-COPY"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-NEW-PIKTOCHART-COPY',
        src: 'https://create.piktochart.com/embed/30289406-NEW-PIKTOCHART-COPY',
        url: 'https://create.piktochart.com/output/30289406-NEW-PIKTOCHART-COPY',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a trailing slash', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker on the query', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'piktochart',
        id: '30289406-new-piktochart-copy',
        src: 'https://create.piktochart.com/embed/30289406-new-piktochart-copy',
        url: 'https://create.piktochart.com/output/30289406-new-piktochart-copy',
        ratio: '1/2',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route below another segment', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/x/embed/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the uid', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embed/30289406-new-piktochart-copy/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', async () => {
      const value =
        '<iframe src="https://create.piktochart.com/embedz/30289406-new-piktochart-copy"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route with no uid', async () => {
      const value = '<iframe src="https://create.piktochart.com/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('piktochart through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should rebuild the frame on the retired host onto the current one', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="1023"
        scrolling="no"
        src="https://magic.piktochart.com/embed/22324966-santos-imperiet"
        style="overflow-y:hidden;"
        width="800"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/22324966-santos-imperiet"
        data-embed-id="22324966-santos-imperiet"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/22324966-santos-imperiet"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the loading overlay of the script snippet with a placeholder', async () => {
    const value = html`
      <div
        class="piktowrapper-embed"
        pikto-uid="15972881-bsc-blog-11"
        style="height: 300px; position: relative;"
      >
        <div class="embed-loading-overlay">
          <img
            width="60px"
            alt="Loading..."
            src="https://magic.piktochart.com/loading.gif"
          />
          <p>Loading...</p>
        </div>
        <div class="pikto-canvas-wrap">
          <div class="pikto-canvas"></div>
        </div>
      </div>
    `
    const expected = html`
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/15972881-bsc-blog-11"
        data-embed-id="15972881-bsc-blog-11"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/15972881-bsc-blog-11"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
