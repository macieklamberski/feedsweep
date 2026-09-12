import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ganjingworldEmbedResolver } from './ganjingworld.js'

describeForEachParser('ganjingworldEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ganjingworldEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the share snippet player', async () => {
      const value = html`
        <iframe
          loading="lazy"
          title="Thiển đàm về võ thuật truyền thống và võ thuật hiện đại | TTV"
          src="https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c"
          width="560"
          height="315"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fv8993v57oI3UiHioRJzFV1L1cq1c',
        src: 'https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c',
        url: 'https://www.ganjingworld.com/video/1fv8993v57oI3UiHioRJzFV1L1cq1c',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the ganjing.com mirror and its mixed-case locale onto the canonical embed', async () => {
      const value = html`
        <iframe
          loading="lazy"
          class="gjw-iframe"
          title="Khoảnh khắc cả dãy nhà bị sụp xuống sông ở An Giang"
          src="https://www.ganjing.com/vi-VN/embed/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c"
          width="640"
          height="360"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
        src: 'https://www.ganjingworld.com/embed/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
        url: 'https://www.ganjingworld.com/video/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a lowercase locale, which the platform itself 404s', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/zh-cn/embed/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
        src: 'https://www.ganjingworld.com/embed/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
        url: 'https://www.ganjingworld.com/video/1fsgbpm9oun2BkUb1UnIp8fuS1ll1c',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the mirror with no locale in front of the route', async () => {
      const value =
        '<iframe src="https://www.ganjing.com/embed/1fces8rds302s3r8592ibpeNH1lm1c"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fces8rds302s3r8592ibpeNH1lm1c',
        src: 'https://www.ganjingworld.com/embed/1fces8rds302s3r8592ibpeNH1lm1c',
        url: 'https://www.ganjingworld.com/video/1fces8rds302s3r8592ibpeNH1lm1c',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a channel page', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/channel/1f5unl3bhmi3zNhqUE0JLJDIt1gl0c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a shared post page', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/s/1fv8993v57oI3UiHioRJzFV1L1cq1c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player naming no video', async () => {
      const value = '<iframe src="https://www.ganjingworld.com/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an id of the wrong shape', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1.mp4"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment in front of the route that is not a locale', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/live/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://ganjingworld.com.evil.test/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should read an id shorter than the ones the specimens carry', async () => {
      const value = '<iframe src="https://www.ganjingworld.com/embed/abc123"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: 'abc123',
        src: 'https://www.ganjingworld.com/embed/abc123',
        url: 'https://www.ganjingworld.com/video/abc123',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the player query the publisher carried', async () => {
      const value =
        '<iframe src="https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c?autoplay=1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fv8993v57oI3UiHioRJzFV1L1cq1c',
        src: 'https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c',
        url: 'https://www.ganjingworld.com/video/1fv8993v57oI3UiHioRJzFV1L1cq1c',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the fields the resolver leaves to enrichment', () => {
    // Whether Gan Jing World writes the content's name or a player label here is unmeasured.
    it('should not take the name the carrier title states', async () => {
      const value = html`
        <iframe
          title="Thiển đàm về võ thuật truyền thống và võ thuật hiện đại | TTV"
          src="https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ganjingworld',
        id: '1fv8993v57oI3UiHioRJzFV1L1cq1c',
        src: 'https://www.ganjingworld.com/embed/1fv8993v57oI3UiHioRJzFV1L1cq1c',
        url: 'https://www.ganjingworld.com/video/1fv8993v57oI3UiHioRJzFV1L1cq1c',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('ganjingworld links the pipeline leaves as prose', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should leave a link to a shared post as a link', async () => {
    const value = html`
      <p>
        Watch it
        <a href="https://www.ganjingworld.com/s/1fv8993v57oI3UiHioRJzFV1L1cq1c">on Gan Jing World</a
        >.
      </p>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
