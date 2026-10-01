import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { mrcvideoEmbedResolver, mrcvideoFlashEmbedResolver } from './mrcvideo.js'

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

    it('should ignore the file host', async () => {
      const value = '<iframe src="https://cdn.mrcvideo.org/embed/101728"></iframe>'

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

describeForEachParser('mrcvideoFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, mrcvideoFlashEmbedResolver)

  describe('happy paths', () => {
    it('should read the node id out of the sharing snippet', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '116586',
        src: 'https://mrcvideo.org/embed/116586',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the node id out of the view callback when there is no sharing snippet', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '116586',
        src: 'https://mrcvideo.org/embed/116586',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the node id out of the sharing snippet when there is no view callback', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '116586',
        src: 'https://mrcvideo.org/embed/116586',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a sharing snippet whose src keeps its closing quote', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;sharing.code=%3Ciframe+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586%22%3E%3C%2Fiframe%3E"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '116586',
        src: 'https://mrcvideo.org/embed/116586',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no node id', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a sharing snippet on a foreign host', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;sharing.code=%3Ciframe+src%3D%22http%3A%2F%2Fevil.test%2Fembed%2F116586%22%3E%3C%2Fiframe%3E"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a sharing snippet naming a video page', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;sharing.code=%3Ciframe+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fvideos%2Fbill-warner%22%3E%3C%2Fiframe%3E"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a view callback on a foreign host', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;yourlytics.callback=http://evil.test/postback/remoteview?nodeid=116586"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a view callback with no node id', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same player path', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="https://evil.test/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another file in the player directory', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/yt.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player under another directory', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/flash/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment after the player', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf/extra"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should prefer the sharing snippet over the view callback', async () => {
      const value = html`
        <embed
          wmode="opaque"
          id="player1"
          width="640"
          height="360"
          type="application/x-shockwave-flash"
          src="http://www.mrctv.org/jwplayer/player.swf"
          flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116000&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
          allowfullscreen="false"
          allowscriptaccess="never"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mrcvideo',
        id: '116586',
        src: 'https://mrcvideo.org/embed/116586',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// Only the pipeline sees the resolvers in the registry, and it offers them every enclosure,
// including the video files on `cdn.mrcvideo.org`.
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

  it('should claim the former MRCTV Flash player', async () => {
    const value = html`
      <embed
        wmode="opaque"
        id="player1"
        width="640"
        height="360"
        type="application/x-shockwave-flash"
        src="http://www.mrctv.org/jwplayer/player.swf"
        flashvars="file=http://mrc-tv.s3.amazonaws.com/sites/default/files/videos/converted/117304.mp4&amp;image=http://mrc-tv.s3.amazonaws.com/sites/default/files/video_thumbs/117304/117304_0001.jpg&amp;dock=false&amp;controlbar=over&amp;skin=http://www.mrctv.org/jwplayer/skins/modieus/modieus.zip&amp;logo.file=http://www.mrctv.org/sites/all/themes/mrctv/images/watermark.png&amp;logo.link=http://www.mrctv.org&amp;logo.hide=false&amp;logo.over=0.9&amp;logo.out=0.5&amp;logo.timeout=10&amp;logo.margin=5&amp;logo.position=top-left&amp;plugins=yourlytics-1,sharing-2&amp;yourlytics.callback=http://www.mrctv.org/postback/remoteview?nodeid=116586&amp;sharing.link=http://www.mrctv.org/videos/bill-warner-islam-1400-years-fear-english-titles&amp;sharing.code=%3Ciframe+title%3D%22MRC+TV+video+player%22+width%3D%22640%22+height%3D%22360%22+src%3D%22http%3A%2F%2Fwww.mrctv.org%2Fembed%2F116586+frameborder%3D%220%22+allowfullscreen%3E%3C%2Fiframe%3E&amp;autostart=false"
        allowfullscreen="false"
        allowscriptaccess="never"
      >
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-id="116586"
        data-embed-provider="mrcvideo"
        data-embed-src="https://mrcvideo.org/embed/116586"
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
