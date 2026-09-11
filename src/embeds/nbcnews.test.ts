import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { nbcnewsEmbedResolver } from './nbcnews.js'

describeForEachParser('nbcnewsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, nbcnewsEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the embedded-video frame a block editor writes', async () => {
      const value = html`
        <iframe
          class="wp-block-embed is-type-video"
          src="https://www.nbcnews.com/news/embedded-video/mmvo265959493641"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo265959493641',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo265959493641',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the earlier widget frame and mint it over https', async () => {
      const value = html`
        <iframe src="http://www.nbcnews.com/widget/video-embed/713265731534"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: '713265731534',
        src: 'https://www.nbcnews.com/widget/video-embed/713265731534',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the embedded-video path', async () => {
      const value = html`
        <iframe src="https://evil.test/news/embedded-video/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host that only ends in the platform name', async () => {
      const value = html`
        <iframe
          src="https://www.nbcnews.com.evil.test/news/embedded-video/mmvo265959493641"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an article page that is not a player', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/politics/congress/rcna123456"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should take the box the carrier declares over stating none', async () => {
      const value = html`
        <iframe
          width="560"
          height="315"
          src="https://www.nbcnews.com/news/embedded-video/mmvo42758725640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: 'mmvo42758725640',
        src: 'https://www.nbcnews.com/news/embedded-video/mmvo42758725640',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should refuse a bare number on the embedded-video route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/news/embedded-video/265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse an mmvo id on the widget route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/widget/video-embed/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should refuse a player path nested under another route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/now/news/embedded-video/mmvo265959493641"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the retired Flash player on nbcnews.com/id', () => {
    it('should refuse the id route the Flash embed addresses', async () => {
      const value = html`
        <embed
          name="msnbc517611"
          src="http://www.nbcnews.com/id/32545640"
          width="420"
          height="245"
        ></embed>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should resolve the same digits on the widget route', async () => {
      const value = html`
        <iframe src="https://www.nbcnews.com/widget/video-embed/32545640"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'nbcnews',
        id: '32545640',
        src: 'https://www.nbcnews.com/widget/video-embed/32545640',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('nbcnews shapes the pipeline leaves alone', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should leave the Flash object a placeholder on the url it already pointed at', async () => {
    const value = html`
      <object
        width="420"
        height="245"
      >
        <param
          name="movie"
          value="http://www.nbcnews.com/id/32545640"
        />
        <embed
          name="msnbc517611"
          src="http://www.nbcnews.com/id/32545640"
          width="420"
          height="245"
        ></embed>
      </object>
    `
    const expected = html`
      <div
        data-embed-height="245"
        data-embed-width="420"
        data-embed-src="http://www.nbcnews.com/id/32545640"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a player url written as a link unresolved', async () => {
    const value = html`
      <p><a href="https://www.nbcnews.com/news/embedded-video/mmvo265959493641">NBC News</a></p>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
