import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { linkifyPodomaticPlaylists } from './linkifyPodomaticPlaylists.js'

describeForEachParser('linkifyPodomaticPlaylists', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [linkifyPodomaticPlaylists(baseContext)])
  }

  describe('happy paths', () => {
    it('should link the podcast a playlist player on the www host names', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="plugins=viral-1&amp;viral.link=http://mrgranito.podOmatic.com&amp;height=340&amp;file=http://mrgranito.podOmatic.com/mrss_stream.xml&amp;playlist=bottom&amp;playlistsize=80&amp;streamer=rtmp://streams.podomatic.com/vod"
          type="application/x-shockwave-flash"
        >
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/mrgranito"
        >https://www.podomatic.com/podcasts/mrgranito</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link the podcast a playlist player on its own mixed-case host names', async () => {
      const value = html`
        <embed
          src="http://electrolux.podOmatic.com/swf/jwplayer44.swf"
          flashvars="plugins=viral-1&amp;viral.link=http://electrolux.podomatic.com&amp;height=340&amp;file=http://electrolux.podomatic.com/mrss_stream.xml&amp;playlist=bottom&amp;playlistsize=80&amp;streamer=rtmp://streams.podomatic.com/vod"
          type="application/x-shockwave-flash"
        >
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/electrolux"
        >https://www.podomatic.com/podcasts/electrolux</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the podcast from viral.link when the playlist sits on the www host', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="viral.link=http://mrgranito.podOmatic.com&amp;file=http://www.podomatic.com/mrss_stream.xml"
        >
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/mrgranito"
        >https://www.podomatic.com/podcasts/mrgranito</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link the podcast an object names in its flashvars param', async () => {
      const value = html`
        <object data="http://www.podomatic.com/swf/jwplayer44.swf">
          <param
            name="flashvars"
            value="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
          >
        </object>
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/mrgranito"
        >https://www.podomatic.com/podcasts/mrgranito</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
    it('should link the podcast once for an object around an embed', async () => {
      const value = html`
        <object data="http://www.podomatic.com/swf/jwplayer44.swf">
          <param
            name="flashvars"
            value="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
          >
          <embed
            src="http://www.podomatic.com/swf/jwplayer44.swf"
            flashvars="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
          >
        </object>
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/mrgranito"
        >https://www.podomatic.com/podcasts/mrgranito</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the multiplayer and flashcatcher show players', () => {
    it('should link the podcast the multiplayer names', async () => {
      const value = html`
        <embed
          width="480"
          height="360"
          type="application/x-shockwave-flash"
          src="http://lisboalowcost.podomatic.com/swf/joe_multiplayer_v13.swf"
          wmode="transparent"
          menu="false"
          flashvars="jsonLocation=http%3A%2F%2Flisboalowcost.podomatic.com%2Fembed%2Fmulti%2F0%3Fcolor%3D43bee7%26autoPlay%3Dfalse%26facebook%3Dfalse%26height%3D360%26objembed%3D1%26width%3D480"
          allowfullscreen="true"
        >
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/lisboalowcost"
        >https://www.podomatic.com/podcasts/lisboalowcost</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link the podcast the flashcatcher names', async () => {
      const value = html`
        <embed
          src="http://www.podOmatic.com/flash/flashcatcher.swf"
          width="320"
          height="315"
          type="application/x-shockwave-flash"
          flashvars="playlist_url=http://aom.podOmatic.com/xspf.xspf"
        >
      `
      const expected = html`
        <a
          href="https://www.podomatic.com/podcasts/aom"
        >https://www.podomatic.com/podcasts/aom</a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a multiplayer naming another route', async () => {
      const value = html`
        <embed
          src="http://lisboalowcost.podomatic.com/swf/joe_multiplayer_v13.swf"
          flashvars="jsonLocation=http%3A%2F%2Flisboalowcost.podomatic.com%2Fentry%2Fembed_params%2F2012-10-30T05_25_47-07_00"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a flashcatcher naming another route', async () => {
      const value = html`
        <embed
          src="http://www.podOmatic.com/flash/flashcatcher.swf"
          flashvars="playlist_url=http://aom.podOmatic.com/zz.xspf"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a flashcatcher reading another flashvar', async () => {
      const value = html`
        <embed
          src="http://www.podOmatic.com/flash/flashcatcher.swf"
          flashvars="file=http://aom.podOmatic.com/xspf.xspf"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('sad paths', () => {
    it('should leave a player streaming one episode', async () => {
      const value = html`
        <embed
          src="http://mrgranito.podOmatic.com/swf/jwplayer44.swf"
          flashvars="height=20&amp;width=320&amp;file=UDS9/-4/31/0c/mrgranito/media/published/3055619_stnd.mp3&amp;streamer=rtmp://streams.podomatic.com/vod"
          type="application/x-shockwave-flash"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a playlist on another host', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="file=http://mrgranito.example.com/mrss_stream.xml"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a file on another route', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="file=http://mrgranito.podOmatic.com/zz_stream.xml"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a playlist on the www host with no viral.link', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="file=http://www.podomatic.com/mrss_stream.xml"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a foreign host carrying the player path', async () => {
      const value = html`
        <embed
          src="http://evil.test/swf/jwplayer44.swf?r=podomatic.com/swf/jwplayer"
          flashvars="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave another route on the podomatic host', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/x/jwplayer44.swf?r=podomatic.com/swf/jwplayer"
          flashvars="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
        >
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <embed
          src="http://www.podomatic.com/swf/jwplayer44.swf"
          flashvars="file=http://mrgranito.podOmatic.com/mrss_stream.xml"
        >
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('podomatic show players through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should link the podcast a playlist player names', async () => {
    const value = html`
      <embed
        src="http://www.podomatic.com/swf/jwplayer44.swf"
        flashvars="plugins=viral-1&amp;viral.link=http://mrgranito.podOmatic.com&amp;height=340&amp;file=http://mrgranito.podOmatic.com/mrss_stream.xml&amp;playlist=bottom&amp;playlistsize=80&amp;streamer=rtmp://streams.podomatic.com/vod"
        type="application/x-shockwave-flash"
      >
    `
    const expected = html`
      <p>
        <a href="https://www.podomatic.com/podcasts/mrgranito">https://www.podomatic.com/podcasts/mrgranito</a>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should link the podcast a flashcatcher names', async () => {
    const value = html`
      <embed
        type="application/x-shockwave-flash"
        src="http://www.podOmatic.com/flash/flashcatcher.swf"
        flashvars="playlist_url=http://tspanos.podOmatic.com/xspf.xspf"
        height="315"
        width="320"
      >
    `
    const expected = html`
      <p>
        <a href="https://www.podomatic.com/podcasts/tspanos">https://www.podomatic.com/podcasts/tspanos</a>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop a player streaming one episode', async () => {
    const value = html`
      <embed
        src="http://mrgranito.podOmatic.com/swf/jwplayer44.swf"
        flashvars="height=20&amp;width=320&amp;file=UDS9/-4/31/0c/mrgranito/media/published/3055619_stnd.mp3&amp;streamer=rtmp://streams.podomatic.com/vod"
        type="application/x-shockwave-flash"
      >
    `

    expect(await convert(value)).toEqualHtml('')
  })
})
