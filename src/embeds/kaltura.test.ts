import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  kalturaIframeEmbedResolver,
  kalturaResolveEmbed,
  kalturaScriptEmbedResolver,
} from './kaltura.js'

describe('kalturaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the player url and mint the poster from its two ids', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/520801/sp/52080100/embedIframeJs/uiconf_id/31230141/partner_id/520801?iframeembed=true&entry_id=1_w0bwzism'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '520801/1_w0bwzism',
        src: 'https://cdnapisec.kaltura.com/p/520801/sp/52080100/embedIframeJs/uiconf_id/31230141/partner_id/520801?iframeembed=true&entry_id=1_w0bwzism',
        thumbnail: 'https://cdnapisec.kaltura.com/p/520801/thumbnail/entry_id/1_w0bwzism/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the session token of an access-controlled entry and mint no poster', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&entry_id=1_txx4an1j&flashvars[ks]=djJ8MTY2MDkwMnx'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '1660902/1_txx4an1j',
        src: 'https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&entry_id=1_txx4an1j&flashvars[ks]=djJ8MTY2MDkwMnx',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should read the newer playkit player', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2296822/1_bs3s0fie',
        src: 'https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2296822/thumbnail/entry_id/1_bs3s0fie/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the player and the poster on the secure host for the plain api host', () => {
      const value =
        'http://cdnapi.kaltura.com/p/483511/sp/48351100/embedIframeJs/uiconf_id/5590821/partner_id/483511?iframeembed=true&entry_id=0_hjiuf078'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '483511/0_hjiuf078',
        src: 'https://cdnapisec.kaltura.com/p/483511/sp/48351100/embedIframeJs/uiconf_id/5590821/partner_id/483511?iframeembed=true&entry_id=0_hjiuf078',
        thumbnail: 'https://cdnapisec.kaltura.com/p/483511/thumbnail/entry_id/0_hjiuf078/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a regional api host for the player and the poster', () => {
      const value =
        'https://api.ca.kaltura.com/p/148/sp/14800/embedIframeJs/uiconf_id/23449759/partner_id/148?iframeembed=true&entry_id=0_gs5r8b3x'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '148/0_gs5r8b3x',
        src: 'https://api.ca.kaltura.com/p/148/sp/14800/embedIframeJs/uiconf_id/23449759/partner_id/148?iframeembed=true&entry_id=0_gs5r8b3x',
        thumbnail: 'https://api.ca.kaltura.com/p/148/thumbnail/entry_id/0_gs5r8b3x/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should read an entry whose tail runs past eight characters', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie9'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2296822/1_bs3s0fie9',
        src: 'https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie9',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2296822/thumbnail/entry_id/1_bs3s0fie9/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should read an entry on a namespace past the first two', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/2851211/embedPlaykitJs/uiconf_id/53021102?iframeembed=true&entry_id=2_rq4nfd7g'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2851211/2_rq4nfd7g',
        src: 'https://cdnapisec.kaltura.com/p/2851211/embedPlaykitJs/uiconf_id/53021102?iframeembed=true&entry_id=2_rq4nfd7g',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2851211/thumbnail/entry_id/2_rq4nfd7g/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    // Whether Kaltura issues a counter past one digit was not settled, so nothing here bets on it.
    it('should read an entry whose namespace counter is two digits', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/2851211/embedPlaykitJs/uiconf_id/53021102?iframeembed=true&entry_id=12_rq4nfd7g'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2851211/12_rq4nfd7g',
        src: 'https://cdnapisec.kaltura.com/p/2851211/embedPlaykitJs/uiconf_id/53021102?iframeembed=true&entry_id=12_rq4nfd7g',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2851211/thumbnail/entry_id/12_rq4nfd7g/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value =
        'https://evil.test/p/520801/embedPlaykitJs/uiconf_id/1?iframeembed=true&entry_id=1_w0bwzism'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a partner path behind another segment', () => {
      const value =
        'https://cdnapisec.kaltura.com/x/p/520801/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_w0bwzism'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player that names no entry', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/520801/sp/52080100/embedIframeJs/uiconf_id/31230141/partner_id/520801?iframeembed=true'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed entry id as written, even if the thumbnail answers an error', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/520801/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=latest'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '520801/latest',
        src: 'https://cdnapisec.kaltura.com/p/520801/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=latest',
        thumbnail: 'https://cdnapisec.kaltura.com/p/520801/thumbnail/entry_id/latest/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a decoded entry id carrying a separator in one thumbnail path segment', () => {
      const value =
        'https://cdnapisec.kaltura.com/p/520801/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_w0bwzism%2F..%2F..%2Fx'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '520801/1_w0bwzism/../../x',
        src: 'https://cdnapisec.kaltura.com/p/520801/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_w0bwzism%2F..%2F..%2Fx',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/520801/thumbnail/entry_id/1_w0bwzism%2F..%2F..%2Fx/width/640',
      }

      expect(kalturaResolveEmbed(value)).toEqual(expected)
    })

    it('should leave the Flash widget alone', () => {
      const value =
        'http://www.kaltura.com/index.php/kwidget/wid/_203822/uiconf_id/1898102/entry_id/1_s2i7y09d/'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the legacy extwidget iframe alone', () => {
      const value =
        'http://cdnapi.kaltura.com/index.php/extwidget/embedIframe/entry_id/0_hjiuf078/widget_id/_483511/uiconf_id/5590821'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the MediaSpace secure embed alone', () => {
      const value =
        'https://2401761.mediaspace.kaltura.com/embed/secure/iframe/entryId/0_kfreggwh/uiConfId/42593641'

      expect(kalturaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('kalturaIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kalturaIframeEmbedResolver)

  describe('happy paths', () => {
    it('should take the title and the box the publisher states and drop the player id', async () => {
      const value = html`
        <iframe
          title="Calendar Appointments (Exam Makeups)"
          id="kaltura_player"
          src="https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&playerId=kaltura_player&entry_id=1_1pavfxkg"
          width="560"
          height="395"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '1660902/1_1pavfxkg',
        src: 'https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&entry_id=1_1pavfxkg',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/1660902/thumbnail/entry_id/1_1pavfxkg/width/640',
        width: 560,
        height: 395,
        title: 'Calendar Appointments (Exam Makeups)',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the player options, the language and the widget id', async () => {
      const value = html`
        <iframe
          id="kaltura_player"
          title="Kaltura Player"
          src="https://cdnapisec.kaltura.com/p/2346171/sp/234617100/embedIframeJs/uiconf_id/42601131/partner_id/2346171?iframeembed=true&amp;playerId=kaltura_player&amp;entry_id=0_bg4o7fhu&amp;flashvars%5BstreamerType%5D=auto&amp;flashvars%5BlocalizationCode%5D=ca-es&amp;flashvars%5BleadWithHTML5%5D=true&amp;flashvars%5BsideBarContainer.plugin%5D=true&amp;flashvars%5BsideBarContainer.position%5D=left&amp;flashvars%5BsideBarContainer.clickToClose%5D=true&amp;flashvars%5Bchapters.plugin%5D=true&amp;flashvars%5Bchapters.layout%5D=vertical&amp;flashvars%5Bchapters.thumbnailRotator%5D=false&amp;flashvars%5BstreamSelector.plugin%5D=true&amp;flashvars%5BEmbedPlayer.SpinnerTarget%5D=videoHolder&amp;flashvars%5BdualScreen.plugin%5D=true&amp;&amp;wid=1_z2u0xe5j"
          width="1024"
          height="170"
          frameborder="0"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2346171/0_bg4o7fhu',
        src: 'https://cdnapisec.kaltura.com/p/2346171/sp/234617100/embedIframeJs/uiconf_id/42601131/partner_id/2346171?iframeembed=true&entry_id=0_bg4o7fhu',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2346171/thumbnail/entry_id/0_bg4o7fhu/width/640',
        width: 1024,
        height: 170,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the start position of the embedIframeJs player as written', async () => {
      const value = html`
        <iframe
          src="https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&amp;playerId=kaltura_player&amp;entry_id=1_txx4an1j&amp;flashvars%5BmediaProxy.mediaPlayFrom%5D=0&amp;flashvars%5BstreamerType%5D=auto&amp;wid=1_cpekzs9a"
          width="560"
          height="395"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '1660902/1_txx4an1j',
        src: 'https://cdnapisec.kaltura.com/p/1660902/sp/166090200/embedIframeJs/uiconf_id/25717641/partner_id/1660902?iframeembed=true&entry_id=1_txx4an1j&flashvars%5BmediaProxy.mediaPlayFrom%5D=0',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/1660902/thumbnail/entry_id/1_txx4an1j/width/640',
        width: 560,
        height: 395,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the start position of the playkit player as written', async () => {
      const value = html`
        <iframe
          src="https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&amp;entry_id=1_wyxnidl5&amp;kalturaSeekFrom=95"
          width="560"
          height="315"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2503451/1_wyxnidl5',
        src: 'https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&entry_id=1_wyxnidl5&kalturaSeekFrom=95',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2503451/thumbnail/entry_id/1_wyxnidl5/width/640',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the clip end of the embedIframeJs player as written', async () => {
      const value = html`
        <iframe
          src="https://cdnapisec.kaltura.com/p/2375811/sp/237581100/embedIframeJs/uiconf_id/41951101/partner_id/2375811?iframeembed=true&playerId=kplayer&entry_id=1_vni6k5wu&flashvars[streamerType]=auto&flashvars[mediaProxy.mediaPlayTo]=120"
          width="100%"
          height="790"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2375811/1_vni6k5wu',
        src: 'https://cdnapisec.kaltura.com/p/2375811/sp/237581100/embedIframeJs/uiconf_id/41951101/partner_id/2375811?iframeembed=true&entry_id=1_vni6k5wu&flashvars[mediaProxy.mediaPlayTo]=120',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2375811/thumbnail/entry_id/1_vni6k5wu/width/640',
        height: 790,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the clip end of the playkit player as written', async () => {
      const value = html`
        <iframe
          src="https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&amp;entry_id=1_wyxnidl5&amp;kalturaClipTo=120"
          width="560"
          height="315"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2503451/1_wyxnidl5',
        src: 'https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&entry_id=1_wyxnidl5&kalturaClipTo=120',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2503451/thumbnail/entry_id/1_wyxnidl5/width/640',
        width: 560,
        height: 315,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the config languages from the playkit player', async () => {
      const value = html`
        <iframe
          src='https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&entry_id=1_csldgzsc&config[playback]={"audioLanguage":"en"}&config[ui]={"locale":"en"}'
          style="width: 528px; height: 297px;"
          allowfullscreen=""
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2503451/1_csldgzsc',
        src: 'https://cdnapisec.kaltura.com/p/2503451/embedPlaykitJs/uiconf_id/49754663?iframeembed=true&entry_id=1_csldgzsc',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2503451/thumbnail/entry_id/1_csldgzsc/width/640',
        width: 528,
        height: 297,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the label a generated iframe carries in place of the name', async () => {
      const value = html`
        <iframe
          title="Kaltura Player"
          src="https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '2296822/1_bs3s0fie',
        src: 'https://cdnapisec.kaltura.com/p/2296822/embedPlaykitJs/uiconf_id/52714152?iframeembed=true&entry_id=1_bs3s0fie',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/2296822/thumbnail/entry_id/1_bs3s0fie/width/640',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/p/520801/embedPlaykitJs/uiconf_id/1?iframeembed=true&entry_id=1_w0bwzism"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the Flash object alone', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://www.kaltura.com/index.php/kwidget/wid/_203822/uiconf_id/1898102/entry_id/1_s2i7y09d/"
          width="560"
          height="345"
        ></object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('kalturaScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, kalturaScriptEmbedResolver)

  describe('happy paths', () => {
    it('should rebuild the iframe the auto-embed script would have written', async () => {
      const value = html`
        <div
          id="kaltura_player_1484668390"
          style="height: 395px; width: 560px;"
        >
          <script src="https://cdnapisec.kaltura.com/p/1758271/sp/175827100/embedIframeJs/uiconf_id/29300931/partner_id/1758271?autoembed=true&entry_id=1_jhjo10ru&playerId=kaltura_player_1484668390&cache_st=1484668390&width=560&height=395&flashvars[streamerType]=auto"></script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '1758271/1_jhjo10ru',
        src: 'https://cdnapisec.kaltura.com/p/1758271/sp/175827100/embedIframeJs/uiconf_id/29300931/partner_id/1758271?iframeembed=true&entry_id=1_jhjo10ru',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/1758271/thumbnail/entry_id/1_jhjo10ru/width/640',
        width: 560,
        height: 395,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no box where the script names none', async () => {
      const value =
        '<script src="https://cdnapisec.kaltura.com/p/1770401/sp/177040100/embedIframeJs/uiconf_id/31308902/partner_id/1770401?autoembed=true&entry_id=0_y5wm5dnt&playerId=kaltura_player_1525192233"></script>'
      const expected: EmbedResolverResult = {
        provider: 'kaltura',
        id: '1770401/0_y5wm5dnt',
        src: 'https://cdnapisec.kaltura.com/p/1770401/sp/177040100/embedIframeJs/uiconf_id/31308902/partner_id/1770401?iframeembed=true&entry_id=0_y5wm5dnt',
        thumbnail:
          'https://cdnapisec.kaltura.com/p/1770401/thumbnail/entry_id/0_y5wm5dnt/width/640',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the player library script, which embeds nothing by itself', async () => {
      const value =
        '<script src="https://cdnapisec.kaltura.com/p/1758271/sp/175827100/embedIframeJs/uiconf_id/29300931/partner_id/1758271"></script>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script on a foreign host carrying the same path', async () => {
      const value =
        '<script src="https://evil.test/p/1758271/embedIframeJs/uiconf_id/1?autoembed=true&entry_id=1_jhjo10ru&kaltura.com/p/"></script>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The player hosts also serve every customer's own media: `playManifest` and `serveFlavor`
// hand out the mp4 and mp3 a podcast feed links as its enclosure. Only the resolver reading
// the entry out of the query keeps those off the resolver, and only this path reaches the
// point where claiming one would cost a reader the file.
describeForEachParser('kaltura through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a kaltura media enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://cdnapisec.kaltura.com/p/1758271/sp/175827100/playManifest/entryId/1_jhjo10ru/format/url/protocol/https/a.mp4',
        type: 'video/mp4',
      },
      {
        url: 'https://api.ca.kaltura.com/p/148/sp/14800/serveFlavor/entryId/0_gs5r8b3x/name/a.mp3',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://cdnapisec.kaltura.com/p/1758271/sp/175827100/playManifest/entryId/1_jhjo10ru/format/url/protocol/https/a.mp4"></video>
      <audio data-enclosure="" controls src="https://api.ca.kaltura.com/p/148/sp/14800/serveFlavor/entryId/0_gs5r8b3x/name/a.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
