import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { slideserveEmbedResolver } from './slideserve.js'

describeForEachParser('slideserveEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, slideserveEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the snippet declares', async () => {
      const value = html`
        <iframe
          src="https://www.slideserve.com/embed/11734358"
          width="600"
          height="497"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
          scrolling="no"
          style="border:1px solid #CCC;border-width:1px 1px;margin-bottom:5px;max-width: 100%;"
          allowfullscreen
          webkitallowfullscreen
          mozallowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: '11734358',
        src: 'https://www.slideserve.com/embed/11734358',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the www host for a deck on the bare host', async () => {
      const value = '<iframe src="http://slideserve.com/embed/11734358"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: '11734358',
        src: 'https://www.slideserve.com/embed/11734358',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the Flash player onto the embed page of its movie', async () => {
      const value = html`
        <embed
          src="http://www.slideserve.com/player.swf?moviePath=http://www.slideserve.com/video/12675.swf"
          FlashVars="viewkey=presentation/12675/GRADUACIO"
          quality="high"
          bgcolor="#ffffff"
          width="540"
          height="446"
          name="slideserve"
          align="middle"
          allowFullScreen="true"
          allowScriptAccess="sameDomain"
          type="application/x-shockwave-flash"
          pluginspage="http://www.macromedia.com/go/getflashplayer"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: '12675',
        src: 'https://www.slideserve.com/embed/12675',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the embed route in uppercase', async () => {
      const value = '<iframe src="https://www.slideserve.com/EMBED/11734358"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route under a leading segment', async () => {
      const value = '<iframe src="https://www.slideserve.com/x/embed/11734358"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route with no deck', async () => {
      const value = '<iframe src="https://www.slideserve.com/embed"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route on a file subdomain', async () => {
      const value = '<iframe src="https://cdn6.slideserve.com/embed/11734358"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/11734358"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another Flash file naming a movie', async () => {
      const value =
        '<embed src="http://www.slideserve.com/x.swf?moviePath=http://www.slideserve.com/video/12675.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player with no movie', async () => {
      const value = '<embed src="http://www.slideserve.com/player.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a movie on a foreign host', async () => {
      const value =
        '<embed src="http://www.slideserve.com/player.swf?moviePath=http://evil.test/video/12675.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a movie under a leading segment', async () => {
      const value =
        '<embed src="http://www.slideserve.com/player.swf?moviePath=http://www.slideserve.com/x/video/12675.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a movie with a trailing segment', async () => {
      const value =
        '<embed src="http://www.slideserve.com/player.swf?moviePath=http://www.slideserve.com/video/12675.swf/extra">'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should drop a trailing segment the server ignores', async () => {
      const value = '<iframe src="https://www.slideserve.com/embed/11734358/extra"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: '11734358',
        src: 'https://www.slideserve.com/embed/11734358',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use an id as written, even if no deck has it', async () => {
      const value = '<iframe src="https://www.slideserve.com/embed/abc"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: 'abc',
        src: 'https://www.slideserve.com/embed/abc',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracking query', async () => {
      const value =
        '<iframe src="https://www.slideserve.com/embed/11734358?utm_source=feed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'slideserve',
        id: '11734358',
        src: 'https://www.slideserve.com/embed/11734358',
        ratio: '300/271',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('slideserve through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should keep the Flash player the swf pass would remove', async () => {
    const value = html`
      <embed
        src="http://www.slideserve.com/player.swf?moviePath=http://www.slideserve.com/video/12675.swf"
        FlashVars="viewkey=presentation/12675/GRADUACIO"
        width="540"
        height="446"
        type="application/x-shockwave-flash"
      />
    `
    const expected = html`
      <div
        data-embed-ratio="300/271"
        data-embed-id="12675"
        data-embed-provider="slideserve"
        data-embed-src="https://www.slideserve.com/embed/12675"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
