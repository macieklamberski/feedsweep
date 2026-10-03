import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  pbsFlashEmbedResolver,
  pbsIframeEmbedResolver,
  pbsLegacyIframeEmbedResolver,
  pbsResolveEmbed,
  pbsStationIframeEmbedResolver,
} from './pbs.js'

describe('pbsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should key the numeric id to the viral route it arrived on', () => {
      const value = 'https://player.pbs.org/viralplayer/3005825044/'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should give the widget route the same key and keep only its clip bounds', () => {
      const value =
        'https://player.pbs.org/widget/partnerplayer/2365866769/?start=0&end=0&chapterbar=false&endscreen=false'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365866769',
        src: 'https://player.pbs.org/widget/partnerplayer/2365866769/?start=0&end=0',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should read the base64 slug the partner route takes', () => {
      const value = 'https://player.pbs.org/partnerplayer/Nt5uxMIZd-YQIx5g14yatg==/'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'partnerplayer/Nt5uxMIZd-YQIx5g14yatg==',
        src: 'https://player.pbs.org/partnerplayer/Nt5uxMIZd-YQIx5g14yatg==/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop trackers, the reader settings and the layout from the query', () => {
      const value =
        'https://player.pbs.org/viralplayer/3005825044/?utm_source=feed&autoplay=true&muted=true&topbar=false'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    // The clip bounds and the chapter, which decide what plays.
    const playbackParams: Array<string> = ['start=30', 'end=60', 'chapter=2']

    it.each(playbackParams)('should keep %s', (param) => {
      const value = `https://player.pbs.org/viralplayer/3005825044/?${param}`
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: `https://player.pbs.org/viralplayer/3005825044/?${param}`,
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    // The layout and the settings the publisher chose for this one embed.
    const displayParams: Array<string> = [
      'h=360',
      'topbar=false',
      'endscreen=false',
      'previewLayout=fullbleed',
      'unsafeDisableUpsellHref=true',
      'unsafeDisableSponsorship=true',
      'unsafeDisableContinuousPlay=true',
    ]

    it.each(displayParams)('should drop %s', (param) => {
      const value = `https://player.pbs.org/viralplayer/3005825044/?${param}`
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the https player for an http carrier', () => {
      const value = 'http://player.pbs.org/viralplayer/3005825044/'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should move the retired host onto the player host', () => {
      const value = 'http://video.pbs.org/viralplayer/1506734069'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/1506734069',
        src: 'https://player.pbs.org/viralplayer/1506734069/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a host that is not the player', () => {
      const value = 'https://evil.test/viralplayer/3005825044/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route naming a member of the object prototype', () => {
      const value = 'https://player.pbs.org/toString/3005825044/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route that is not a known player', () => {
      const value = 'https://player.pbs.org/bananaplayer/3005825044/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player route naming no video', () => {
      const value = 'https://player.pbs.org/viralplayer/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deeper path under a player route', () => {
      const value = 'https://player.pbs.org/viralplayer/3005825044/captions/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed video id as written, even if the player answers an error', () => {
      const value = 'https://player.pbs.org/viralplayer/3005%2F825044/'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005%2F825044',
        src: 'https://player.pbs.org/viralplayer/3005%2F825044/',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a route the retired host did not serve', () => {
      const value = 'http://video.pbs.org/partnerplayer/Nt5uxMIZd-YQIx5g14yatg==/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pbsIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsIframeEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://player.pbs.org/viralplayer/3005825044/"
          width="512"
          height="332"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://player.pbs.org.evil.test/viralplayer/3005825044/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the player route', async () => {
      const value = '<iframe src="https://evil.test/viralplayer/3005825044/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the retired host to its own resolver', async () => {
      const value = '<iframe src="http://video.pbs.org/viralplayer/1506734069"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave the Flash player to its own resolver', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/video/media/swf/PBSPlayer.swf"
          flashvars="video=2155877110&amp;player=viral"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pbsLegacyIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsLegacyIframeEmbedResolver)

  describe('happy paths', () => {
    it('should repair the retired host onto the viral player', async () => {
      const value = html`
        <iframe
          width="581"
          height="415"
          src="http://video.pbs.org/viralplayer/1506734069"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
          scrolling="no"
          seamless
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/1506734069',
        src: 'https://player.pbs.org/viralplayer/1506734069/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the current player', async () => {
      const value = '<iframe src="https://player.pbs.org/viralplayer/3005825044/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pbsStationIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsStationIframeEmbedResolver)

  describe('happy paths', () => {
    it('should move a WTTW widget frame onto the player host', async () => {
      const value = html`
        <iframe
          src="https://video.wttw.com/widget/partnerplayer/2365620920/?player=WTTW&autoplay=false&endscreen=false&topbar=false"
          width="100%"
          height="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365620920',
        src: 'https://player.pbs.org/widget/partnerplayer/2365620920/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a WTTW partner slug onto the player host with its clip bounds', async () => {
      const value = html`
        <iframe
          style="left:0;position:absolute;top:0;"
          allow="encrypted-media"
          allowfullscreen
          frameborder="0"
          height="100%"
          id="partnerPlayer"
          src="https://video.wttw.com/partnerplayer/P1LNliE4bb0nHUYPQmo1Ig==/?start=0&end=0&topbar=false&autoplay=false&muted=false&endscreen=false&callsign=WTTW"
          width="100%"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'partnerplayer/P1LNliE4bb0nHUYPQmo1Ig==',
        src: 'https://player.pbs.org/partnerplayer/P1LNliE4bb0nHUYPQmo1Ig==/?start=0&end=0',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a WETA frame onto the player host', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="376"
          src="http://watch.weta.org/viralplayer/2365460485"
          width="512"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365460485',
        src: 'https://player.pbs.org/viralplayer/2365460485/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a WHYY frame onto the player host', async () => {
      const value = html`
        <iframe
          width="410"
          height="309"
          src="http://video.whyy.org/viralplayer/2365401320"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365401320',
        src: 'https://player.pbs.org/viralplayer/2365401320/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move an UNC-TV frame onto the player host', async () => {
      const value = html`
        <iframe
          width="512"
          height="376"
          src="http://video.unctv.org/viralplayer/2365375017"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365375017',
        src: 'https://player.pbs.org/viralplayer/2365375017/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a Rocky Mountain PBS frame onto the player host', async () => {
      const value = html`
        <iframe
          src="http://video.rmpbs.org/viralplayer/2365377991"
          width="512"
          height="376"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365377991',
        src: 'https://player.pbs.org/viralplayer/2365377991/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair a frame on the dead NHPTV host onto the player host', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="448"
          src="http://video.nhptv.org/viralplayer/2365080744"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365080744',
        src: 'https://player.pbs.org/viralplayer/2365080744/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the station route', async () => {
      const value = '<iframe src="https://evil.test/viralplayer/2365460485"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a station route that is not a known player', async () => {
      const value = '<iframe src="https://video.wttw.com/videoclip/3011411426/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the current player', async () => {
      const value = '<iframe src="https://player.pbs.org/viralplayer/3005825044/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('pbsFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsFlashEmbedResolver)

  describe('happy paths', () => {
    it('should repair the Flash player onto the viral player', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/video/media/swf/PBSPlayer.swf"
          flashvars="width=578&#038;height=329&#038;video=2155877110&#038;player=viral&#038;end=0&#038;lr_admap=in:pbs:0"
          type="application/x-shockwave-flash"
          width="578"
          height="329"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2155877110',
        src: 'https://player.pbs.org/viralplayer/2155877110/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the Flash player on the s3 path onto the viral player', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/s3/pbs.videoportal-prod.cdn/media/swf/PBSPlayer.swf"
          flashvars="width=424&height=232&video=2245886699&player=viral&end=0&lr_admap=in:warnings:0;in:pbs:0"
          type="application/x-shockwave-flash"
          width="424"
          height="232"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2245886699',
        src: 'https://player.pbs.org/viralplayer/2245886699/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the Flash player on the CDN host onto the viral player', async () => {
      const value = html`
        <object
          data="http://dgjigvacl6ipj.cloudfront.net/media/swf/PBSPlayer.swf"
          type="application/x-shockwave-flash"
          width="350"
          height="250"
        >
          <param name="flashvars" value="video=2104663380&player=viral&end=0">
          <param name="movie" value="http://dgjigvacl6ipj.cloudfront.net/media/swf/PBSPlayer.swf">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2104663380',
        src: 'https://player.pbs.org/viralplayer/2104663380/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the numeric id from a station portal url', async () => {
      const value = html`
        <embed
          src="http://dgjigvacl6ipj.cloudfront.net/media/swf/PBSPlayer.swf"
          flashvars="width=645&height=360&video=http://video.pbs.org/videoPlayerInfo/2296255481&player=viral"
          type="application/x-shockwave-flash"
          width="645"
          height="360"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2296255481',
        src: 'https://player.pbs.org/viralplayer/2296255481/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the partner slug from a station portal url', async () => {
      const value = html`
        <embed
          src="http://dgjigvacl6ipj.cloudfront.net/media/swf/PBSPlayer.swf"
          flashvars="width=450&amp;height=295&amp;video=http://video.pbs.org/videoinfo/4NNV3qAO5mfQ_x-7ruXhEw==/?player=PBS_Partner_Player_v2&amp;start=0&amp;end=0&amp;balance=true&amp;player=viral&amp;end=0"
          type="application/x-shockwave-flash"
          width="450"
          height="295"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'partnerplayer/4NNV3qAO5mfQ_x-7ruXhEw==',
        src: 'https://player.pbs.org/partnerplayer/4NNV3qAO5mfQ_x-7ruXhEw==/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep a decoded video id carrying a separator in one path segment', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/video/media/swf/PBSPlayer.swf"
          flashvars="video=2155877110%2F..%2Fx&amp;player=viral"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2155877110%2F..%2Fx',
        src: 'https://player.pbs.org/viralplayer/2155877110%2F..%2Fx/',
        ratio: '13/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the current player', async () => {
      const value = '<iframe src="https://player.pbs.org/viralplayer/3005825044/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a station portal url on another route', async () => {
      const value = html`
        <embed
          src="http://dgjigvacl6ipj.cloudfront.net/media/swf/PBSPlayer.swf"
          flashvars="video=http://video.pbs.org/videoclip/2296255481&amp;player=viral"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player path on a foreign host', async () => {
      const value = html`
        <embed
          src="http://evil.test/video/media/swf/PBSPlayer.swf"
          flashvars="video=2155877110&amp;player=viral"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a Flash player other than the viral one', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/video/media/swf/PBSPlayer.swf"
          flashvars="video=2155877110&amp;player=cove"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another file on the Flash host', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/x/video/media/swf/PBSPlayer.swf"
          flashvars="video=2155877110&amp;player=viral"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player naming no video', async () => {
      const value = html`
        <embed
          src="http://www-tc.pbs.org/video/media/swf/PBSPlayer.swf"
          flashvars="player=viral"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// A protocol-relative station frame reaches the resolver only once the pipeline absolutises it.
// The Flash host also serves files, and only an enclosure reaches the path where claiming one
// would cost a reader the video.
describeForEachParser('pbs through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should move a protocol-relative WTTW frame onto the player host', async () => {
    const value = html`
      <iframe
        frameborder="0"
        width="100%"
        height="100%"
        src="//video.wttw.com/widget/partnerplayer/3011411426/?player=WTTW&autoplay=false&endscreen=false&topbar=false&callsign=WTTW"
        allowfullscreen
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="13/9"
        data-embed-id="viralplayer/3011411426"
        data-embed-provider="pbs"
        data-embed-src="https://player.pbs.org/widget/partnerplayer/3011411426/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a video enclosure on the Flash host playable', async () => {
    const enclosures = [
      { url: 'https://www-tc.pbs.org/video/media/2155877110.mp4', type: 'video/mp4' },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://www-tc.pbs.org/video/media/2155877110.mp4"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
