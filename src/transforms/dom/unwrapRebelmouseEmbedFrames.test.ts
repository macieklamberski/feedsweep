import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { unwrapRebelmouseEmbedFrames } from './unwrapRebelmouseEmbedFrames.js'

describeForEachParser('unwrapRebelmouseEmbedFrames', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [unwrapRebelmouseEmbedFrames(baseContext)])
  }

  describe('happy paths', () => {
    it('should point the frame at the JW script in jwplayer_video_url', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://www.out.com/res/scraper/embed/?jwplayer_video_url=https%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"
          width="100%"
        ></iframe>
      `
      const expected = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://content.jwplatform.com/players/VJuVAhyj-4mfZ1NcF.js"
          width="100%"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point the frame at the primis stream in video_url', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://www.gbnews.com/res/scraper/embed/?video_url=https%3A%2F%2Fvideo.primis.tech%2Fuploads%2Fcn1%2Fvideo%2Fusers%2Fhls%2F31875%2Fvideo_686e587d88e4d518439969%2Fvid6936cb5ddb11b656458507.mp4%2Fchunklist_440.m3u8"
          width="100%"
        ></iframe>
      `
      const expected = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://video.primis.tech/uploads/cn1/video/users/hls/31875/video_686e587d88e4d518439969/vid6936cb5ddb11b656458507.mp4/chunklist_440.m3u8"
          width="100%"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point the frame at the simplestream player in video_url', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://www.gbnews.com/res/scraper/embed/?video_url=https%3A%2F%2Fmm-v2.simplestream.com%2Fiframe%2Fplayer.php%3Fkey%3D3Li3Nt2Qs8Ct3Xq9Fi5Uy0Mb2Bj0Qs%26player%3DGB003%26uvid%3D52652403%26type%3Dvod%26viously_id%3DaHfDXpruMhg"
          width="100%"
        ></iframe>
      `
      const expected = html`
        <iframe
          frameborder="0"
          height="100%"
          scrolling="no"
          src="https://mm-v2.simplestream.com/iframe/player.php?key=3Li3Nt2Qs8Ct3Xq9Fi5Uy0Mb2Bj0Qs&amp;player=GB003&amp;uvid=52652403&amp;type=vod&amp;viously_id=aHfDXpruMhg"
          width="100%"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point the frame at a player on any host in video_url', async () => {
      const value =
        '<iframe src="https://www.gbnews.com/res/scraper/embed/?video_url=https%3A%2F%2Fplayer.example.com%2Fembed%2F123"></iframe>'
      const expected = '<iframe src="https://player.example.com/embed/123"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should point the tweet frame at the status its id and screen_name name', async () => {
      const value = html`
        <iframe
          id="twitter-embed-723349244531204096"
          class="rm-shortcode"
          src="http://www.ecowatch.com/res/community/twitter_embed/?iframe_id=twitter-embed-723349244531204096&amp;created_ts=1461294873.0&amp;screen_name=yeswecode&amp;text=The+man+behind+the+music%3A+%40VanJones68+talks+%23Prince+%2B+his+inspired+vision+for+%23YesWeCode+https%3A%2F%2Ft.co%2FgnT9ntihNr+https%3A%2F%2Ft.co%2FSF1T7NajjU&amp;id=723349244531204096&amp;name=yeswecode"
          width="100%"
          height="370"
          frameborder="0"
          scrolling="no"
          data-rm-shortcode-id="71VFSL1467216026"
          data-mce-fragment="1"
        ></iframe>
      `
      const expected = html`
        <iframe
          id="twitter-embed-723349244531204096"
          class="rm-shortcode"
          src="https://x.com/yeswecode/status/723349244531204096"
          width="100%"
          height="370"
          frameborder="0"
          scrolling="no"
          data-rm-shortcode-id="71VFSL1467216026"
          data-mce-fragment="1"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep a frame naming a script on a foreign host', async () => {
      const value =
        '<iframe src="https://www.out.com/res/scraper/embed/?jwplayer_video_url=https%3A%2F%2Fevil.test%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a frame naming a player host under another scheme', async () => {
      const value =
        '<iframe src="https://www.out.com/res/scraper/embed/?jwplayer_video_url=ftp%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a frame naming a non-http url in video_url', async () => {
      const value =
        '<iframe src="https://www.gbnews.com/res/scraper/embed/?video_url=javascript%3Aalert(1)"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a frame naming no url', async () => {
      const value = '<iframe src="https://www.out.com/res/scraper/embed/"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep the embed path under a prefix', async () => {
      const value =
        '<iframe src="https://www.out.com/x/res/scraper/embed/?jwplayer_video_url=https%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep the embed path with a trailing segment', async () => {
      const value =
        '<iframe src="https://www.out.com/res/scraper/embed/extra?jwplayer_video_url=https%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tweet frame whose id is not a number', async () => {
      const value =
        '<iframe src="http://www.ecowatch.com/res/community/twitter_embed/?screen_name=yeswecode&amp;id=72334924453120409x"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tweet frame naming no screen_name', async () => {
      const value =
        '<iframe src="http://www.ecowatch.com/res/community/twitter_embed/?id=723349244531204096"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a tweet frame naming no id', async () => {
      const value =
        '<iframe src="http://www.ecowatch.com/res/community/twitter_embed/?screen_name=yeswecode"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value =
      '<iframe src="https://www.out.com/res/scraper/embed/?jwplayer_video_url=https%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FVJuVAhyj-4mfZ1NcF.js"></iframe>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

// The unwrapped url is a JW script or a status page, which only the provider resolver turns into
// a player, so the pipeline is what shows the frame ending up as that provider's placeholder.
describeForEachParser('unwrapRebelmouseEmbedFrames through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should let the JW resolver claim a frame on any publisher domain', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="100%"
        scrolling="no"
        src="https://bigthink.com/res/scraper/embed/?jwplayer_video_url=https%3A%2F%2Fcontent.jwplatform.com%2Fplayers%2FhVoHh4GA-FvQKszTI.js"
        width="100%"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://cdn.jwplayer.com/players/hVoHh4GA.html"
        data-embed-provider="jwplayer"
        data-embed-id="hVoHh4GA"
        data-embed-thumbnail="https://cdn.jwplayer.com/v2/media/hVoHh4GA/poster.jpg"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should let the tweet resolver claim the tweet frame', async () => {
    const value = html`
      <iframe
        id="twitter-embed-723349244531204096"
        class="rm-shortcode"
        src="http://www.ecowatch.com/res/community/twitter_embed/?iframe_id=twitter-embed-723349244531204096&amp;created_ts=1461294873.0&amp;screen_name=yeswecode&amp;text=The+man+behind+the+music%3A+%40VanJones68+talks+%23Prince+%2B+his+inspired+vision+for+%23YesWeCode+https%3A%2F%2Ft.co%2FgnT9ntihNr+https%3A%2F%2Ft.co%2FSF1T7NajjU&amp;id=723349244531204096&amp;name=yeswecode"
        width="100%"
        height="370"
        frameborder="0"
        scrolling="no"
        data-rm-shortcode-id="71VFSL1467216026"
        data-mce-fragment="1"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://platform.twitter.com/embed/Tweet.html?id=723349244531204096"
        data-embed-provider="twitter"
        data-embed-id="723349244531204096"
        data-embed-url="https://x.com/yeswecode/status/723349244531204096"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
