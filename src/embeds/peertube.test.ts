import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { peertubeEmbedResolver } from './peertube.js'

describeForEachParser('peertubeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, peertubeEmbedResolver)

  describe('happy paths', () => {
    it('should read the player url an instance writes into media:embed', async () => {
      const value =
        '<iframe src="https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '4RnoEXF5EfXb8iZCjnJsx9',
        src: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9',
        url: 'https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the video name out of the stated title', async () => {
      const value = html`
        <iframe
          src="https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9"
          title="Bringen wir Katharina Reiche so zum Rücktritt?"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '4RnoEXF5EfXb8iZCjnJsx9',
        src: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9',
        url: 'https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9',
        ratio: '16/9',
        title: 'Bringen wir Katharina Reiche so zum Rücktritt?',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a framed watch page into the player', async () => {
      const value = '<iframe src="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '4RnoEXF5EfXb8iZCjnJsx9',
        src: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9',
        url: 'https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a uuid on the watch route PeerTube served before 4.0', async () => {
      const value = html`
        <iframe
          src="https://tube.funfacts.de/videos/watch/1f300b16-b7bb-4d26-88c5-be7fc19ddd56"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '1f300b16-b7bb-4d26-88c5-be7fc19ddd56',
        src: 'https://tube.funfacts.de/videos/embed/1f300b16-b7bb-4d26-88c5-be7fc19ddd56',
        url: 'https://tube.funfacts.de/w/1f300b16-b7bb-4d26-88c5-be7fc19ddd56',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry over where playback starts and stops', async () => {
      const value = html`
        <iframe
          src="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9?start=1s&stop=18s&p2p=0&autoplay=1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '4RnoEXF5EfXb8iZCjnJsx9',
        src: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9?start=1s&stop=18s',
        url: 'https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a javascript url whose path reads as a watch page', async () => {
      const value = '<iframe src="javascript:/w/4RnoEXF5EfXb8iZCjnJsx9"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a short id holding a character the alphabet excludes', async () => {
      const value = '<iframe src="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx0"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a playlist watch page, which names no single video', async () => {
      const value = '<iframe src="https://tube.funfacts.de/w/p/rJqTfUEXmJVn8xWfyjGMLN"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // Every host the 2026-09-03 corpus sample found on one of the three paths without being
  // PeerTube, with the id it carries. None puts a video id straight after the route.
  describe('sites serving the same paths', () => {
    it.each([
      'https://marvel.com/videos/watch/5016',
      'https://www.europe1.fr/videos/embed/941392',
      'https://tv.libertaddigital.com/videos/embed/3-x9q1btk.html',
      'https://www.bing.com/videos/watch/video/a-clip-slug/8e0e7a18',
      'https://fortune.com/videos/watch/a-clip-slug/1f300b16-b7bb-4d26-88c5-be7fc19ddd56',
      'https://videoapi.my.mail.ru/videos/embed/mail/someone/_myvideo/10.html',
    ])('should return undefined for %s', async (source) => {
      const value = `<iframe src="${source}"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    // A portrait box is the case that matters: the player stays landscape whatever the video is,
    // so filling that box would letterbox the video inside a frame nothing measured.
    it('should keep the stated ratio over a box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9"
          width="315"
          height="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'peertube',
        id: '4RnoEXF5EfXb8iZCjnJsx9',
        src: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9',
        url: 'https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The resolver only reaches a feed through the registered default list, and an instance serves
// the video file on the same host as the player.
describeForEachParser('peertube through the pipeline', (parseHtml) => {
  const convert = (
    value: string,
    enclosures?: Array<{ url: string; type: string; height?: number; playerUrl?: string }>,
  ) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim a watch page framed in the content', async () => {
    const value = '<iframe src="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9"></iframe>'

    const expected = html`
      <div
        data-embed-src="https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-provider="peertube"
        data-embed-id="4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-url="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // Every rendition of a media:group inherits the item's media:embed url and states its own file
  // height, which is the file's and not the player's.
  it('should keep the ratio over a rendition height an enclosure states', async () => {
    const enclosures = [
      {
        url: 'https://tube.funfacts.de/download/videos/1f300b16-b7bb-4d26-88c5-be7fc19ddd56-480.mp4',
        type: 'video/mp4',
        height: 480,
        playerUrl: 'https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9',
      },
    ]

    const expected = html`
      <div
        data-enclosure=""
        data-embed-src="https://tube.funfacts.de/videos/embed/4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-provider="peertube"
        data-embed-id="4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-url="https://tube.funfacts.de/w/4RnoEXF5EfXb8iZCjnJsx9"
        data-embed-ratio="16/9"
      ></div>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })

  it('should leave a peertube video enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://tube.funfacts.de/download/videos/1f300b16-b7bb-4d26-88c5-be7fc19ddd56-720.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video
        data-enclosure=""
        controls
        src="https://tube.funfacts.de/download/videos/1f300b16-b7bb-4d26-88c5-be7fc19ddd56-720.mp4"
      ></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
