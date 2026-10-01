import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { mrcvideoEmbedResolver } from './mrcvideo.js'

describeForEachParser('mrcvideoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, mrcvideoEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the former MRCTV player onto the current host', async () => {
      const value = html`
        <iframe
          src="http://www.mrctv.org/embed/109422"
          width="267"
          height="150"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '109422',
        src: 'https://mrcvideo.org/embed/109422',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the embed dialog snippet', async () => {
      const value = html`
        <iframe
          title="MRC TV video player"
          width="640"
          height="360"
          src="https://mrcvideo.org/embed/101728"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the former host without www', async () => {
      const value = '<iframe src="https://mrctv.org/embed/101728"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a video page', async () => {
      const value =
        '<iframe src="https://mrcvideo.org/videos/chris-matthews-shameless-nasty-newt-gingrich"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player naming no video', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment in front of the route', async () => {
      const value = '<iframe src="https://mrcvideo.org/x/embed/101728"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment after the id', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/101728/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/embed/101728"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value = '<iframe src="https://mrcvideo.org.evil.test/embed/101728"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should accept the route word in any case', async () => {
      const value = '<iframe src="https://www.mrctv.org/EMBED/101728"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should accept a trailing slash', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/101728/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed id as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/1017.mp4"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '1017.mp4',
        src: 'https://mrcvideo.org/embed/1017.mp4',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the autoplay the publisher carried', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/101728?autoplay=1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the tracker the publisher carried', async () => {
      const value = '<iframe src="https://mrcvideo.org/embed/101728?utm_source=example"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '101728',
        src: 'https://mrcvideo.org/embed/101728',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// Only the pipeline sees the resolver in the registry, and the cdn subdomain serves the video
// files, so an enclosure there reaches the resolver too.
describeForEachParser('mrcvideo through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim the former MRCTV player', async () => {
    const value = html`
      <iframe
        src="http://www.mrctv.org/embed/109422"
        width="267"
        height="150"
        frameborder="0"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="109422"
        data-embed-provider="mrcvideo"
        data-embed-src="https://mrcvideo.org/embed/109422"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an MRC Video file enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://cdn.mrcvideo.org/sites/default/files/videos/converted/101189.mp4',
        type: 'video/mp4',
      },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://cdn.mrcvideo.org/sites/default/files/videos/converted/101189.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
