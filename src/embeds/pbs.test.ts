import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  pbsFlashEmbedResolver,
  pbsIframeEmbedResolver,
  pbsLegacyIframeEmbedResolver,
  pbsResolveEmbed,
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

    it('should give the widget route the same key and keep the clip bounds it reads', () => {
      const value =
        'https://player.pbs.org/widget/partnerplayer/2365866769/?start=0&end=0&chapterbar=false&endscreen=false'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/2365866769',
        src: 'https://player.pbs.org/widget/partnerplayer/2365866769/?start=0&end=0&endscreen=false',
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

    it('should drop trackers and the reader settings from the query', () => {
      const value =
        'https://player.pbs.org/viralplayer/3005825044/?utm_source=feed&autoplay=true&muted=true&topbar=false'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/?topbar=false',
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    // Each layout parameter the player bundle reads besides the clip bounds.
    const playerParams: Array<string> = ['chapter=2', 'h=360', 'previewLayout=fullbleed']

    it.each(playerParams)('should keep %s', (param) => {
      const value = `https://player.pbs.org/viralplayer/3005825044/?${param}`
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: `https://player.pbs.org/viralplayer/3005825044/?${param}`,
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    // Each setting the publisher chose for this one embed.
    const publisherParams: Array<[string, string]> = [
      ['unsafeDisableUpsellHref', 'true'],
      ['unsafeDisableSponsorship', 'true'],
      ['unsafeDisableContinuousPlay', 'true'],
    ]

    it.each(publisherParams)('should move %s off the src into params', (name, param) => {
      const value = `https://player.pbs.org/viralplayer/3005825044/?${name}=${param}`
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/',
        params: { [name]: param },
        ratio: '13/9',
      }

      expect(pbsResolveEmbed(value)).toEqual(expected)
    })

    it('should split the layout into the src and the publisher settings into params', () => {
      const value =
        'https://player.pbs.org/viralplayer/3005825044/?topbar=false&unsafeDisableSponsorship=true&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'pbs',
        id: 'viralplayer/3005825044',
        src: 'https://player.pbs.org/viralplayer/3005825044/?topbar=false',
        params: { unsafeDisableSponsorship: 'true' },
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

    it('should ignore an id carrying a separator', () => {
      const value = 'https://player.pbs.org/viralplayer/3005%2F825044/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an id carrying a query separator', () => {
      const value = 'https://player.pbs.org/viralplayer/3005&start=1/'

      expect(pbsResolveEmbed(value)).toBeUndefined()
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
    it('should keep the box the carrier declares', async () => {
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
        width: 512,
        height: 332,
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

    it('should ignore a foreign host naming the player route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/player.pbs.org/viralplayer/3005825044/"></iframe>'

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
    it('should repair the retired host onto the viral player at its own size', async () => {
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

describeForEachParser('pbsFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, pbsFlashEmbedResolver)

  describe('happy paths', () => {
    it('should repair the Flash player onto the viral player at its own size', async () => {
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
  })

  describe('sad paths', () => {
    it('should ignore the current player', async () => {
      const value = '<iframe src="https://player.pbs.org/viralplayer/3005825044/"></iframe>'

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
