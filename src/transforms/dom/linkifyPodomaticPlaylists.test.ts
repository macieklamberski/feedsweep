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

describeForEachParser('podomatic jwplayer44 through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn a WordPress.com widget frame around a playlist player into a link', async () => {
    const value = html`
      <iframe
        src="https://wpcomwidgets.com/?src=http%3A%2F%2Fwww.podomatic.com%2Fswf%2Fjwplayer44.swf&#038;flashvars=plugins%3Dviral-1%26viral.link%3Dhttp%3A%2F%2Fmrgranito.podOmatic.com%26height%3D340%26file%3Dhttp%3A%2F%2Fmrgranito.podOmatic.com%2Fmrss_stream.xml%26playlist%3Dbottom%26playlistsize%3D80%26streamer%3Drtmp%3A%2F%2Fstreams.podomatic.com%2Fvod"
      ></iframe>
    `
    const expected = html`
      <p>
        <a href="https://www.podomatic.com/podcasts/mrgranito">https://www.podomatic.com/podcasts/mrgranito</a>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop a WordPress.com widget frame around a player streaming one episode', async () => {
    const value = html`
      <iframe
        src="https://wpcomwidgets.com/?src=http%3A%2F%2Fmrgranito.podOmatic.com%2Fswf%2Fjwplayer44.swf&#038;flashvars=height%3D20%26width%3D320%26file%3DUDS9%2F-4%2F31%2F0c%2Fmrgranito%2Fmedia%2Fpublished%2F3055619_stnd.mp3%26streamer%3Drtmp%3A%2F%2Fstreams.podomatic.com%2Fvod"
      ></iframe>
    `

    expect(await convert(value)).toEqualHtml('')
  })
})
