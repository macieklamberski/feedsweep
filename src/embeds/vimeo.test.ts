import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  extractVimeoId,
  readVimeoEmbedSrc,
  vimeoEmbedResolver,
  vimeoResolveEmbed,
} from './vimeo.js'

// Every url spelling that names a single video. All extract the same id, so a deleted row is a
// format that silently lost support.
const videoUrls = [
  'https://vimeo.com/76979871',
  'https://player.vimeo.com/video/76979871',
  'https://vimeo.com/channels/staffpicks/76979871',
  'https://vimeo.com/groups/motion/videos/76979871',
  // A page builder keeps the url inside a JSON payload that no url pass rewrites, so the
  // protocol-relative spelling arrives exactly as the publisher wrote it.
  '//vimeo.com/76979871',
  // The Flash player carried no id in the path at all, and shipped its options beside it.
  'http://vimeo.com/moogaloop.swf?clip_id=76979871',
  'http://vimeo.com/moogaloop.swf?clip_id=76979871&force_embed=1&server=vimeo.com&color=00adef',
]

describe('extractVimeoId', () => {
  it.each(videoUrls)('should extract the id from %s', (value) => {
    expect(extractVimeoId(value)).toBe('76979871')
  })

  // The other hosts that serve a player, each with the id a real carrier names.
  const pageHostUrls: Array<[string, string]> = [
    ['http://www.vimeo.com/moogaloop.swf?clip_id=8944133&server=www.vimeo.com', '8944133'],
    ['https://player2.vimeo.com/video/242463839', '242463839'],
    ['http://staging.vimeo.com/moogaloop.swf?clip_id=6419431&server=staging.vimeo.com', '6419431'],
  ]

  it.each(pageHostUrls)('should extract the id from a page host, %s', (value, expected) => {
    expect(extractVimeoId(value)).toBe(expected)
  })

  it('should return undefined for a moogaloop.swf url with no clip id', () => {
    const value = 'http://vimeo.com/moogaloop.swf?server=vimeo.com'

    expect(extractVimeoId(value)).toBeUndefined()
  })

  // A showcase and an album are playlists, a channel and a group are listings, an event is a
  // livestream and an on-demand page is a store front, each in its own id space, so their numeric
  // segment names no video. Channel 927 and group 195 are both live and 927 is also somebody's
  // video, so reading the id off the listing serves a video the feed never named.
  const collectionUrls = [
    'https://vimeo.com/showcase/7060635',
    'https://vimeo.com/album/2632481',
    'https://vimeo.com/channels/927',
    'https://vimeo.com/channels/staffpicks',
    'https://vimeo.com/groups/195',
    'https://vimeo.com/groups/motion',
    'https://vimeo.com/groups/motion/videos',
    'https://player.vimeo.com/event/1234567',
    'https://vimeo.com/ondemand/20704',
    'https://vimeo.com/ondemand/nazmaalik',
  ]

  it.each(collectionUrls)('should return undefined for %s', (value) => {
    expect(extractVimeoId(value)).toBeUndefined()
  })

  // The same collections still name a real video deeper in the path, and there the last numeric
  // segment is an ordinary video id.
  const collectionVideoUrls = [
    'https://vimeo.com/album/2632481/video/76979871',
    'https://vimeo.com/showcase/3253534/video/76979871',
    'https://vimeo.com/ondemand/36938/76979871',
    'https://vimeo.com/channels/927/76979871',
    'https://vimeo.com/groups/195/videos/76979871',
  ]

  it.each(collectionVideoUrls)('should extract the video the collection names in %s', (value) => {
    expect(extractVimeoId(value)).toBe('76979871')
  })

  // Vimeo's own pages sit where a video id does. `/users/{userId}` and `/manage/folders/{id}`
  // carry a number of their own, and user 152184 is also somebody's video 152184. The rest carry
  // no number and are pinned so the refusal does not rest on that.
  const sitePaths = [
    'https://vimeo.com/about',
    'https://vimeo.com/blog',
    'https://vimeo.com/categories/12345',
    'https://vimeo.com/create',
    'https://vimeo.com/features',
    'https://vimeo.com/help',
    'https://vimeo.com/join',
    'https://vimeo.com/jobs',
    'https://vimeo.com/log_in',
    'https://vimeo.com/manage/folders/12345',
    'https://vimeo.com/manage/videos/76979871',
    'https://vimeo.com/privacy',
    'https://vimeo.com/search/76979871',
    'https://vimeo.com/settings/12345',
    'https://vimeo.com/stock/clip-1234567-example',
    'https://vimeo.com/terms',
    'https://vimeo.com/upgrade',
    'https://vimeo.com/users/152184',
    'https://vimeo.com/watch/76979871',
  ]

  it.each(sitePaths)('should return undefined for the site path %s', (value) => {
    expect(extractVimeoId(value)).toBeUndefined()
  })

  it('should return undefined when there is no numeric id', () => {
    const value = 'https://vimeo.com/user/profile'

    expect(extractVimeoId(value)).toBeUndefined()
  })

  it('should return undefined for an unparseable url', () => {
    const value = 'not a url'

    expect(extractVimeoId(value)).toBeUndefined()
  })

  it('should return undefined for a url with no host', () => {
    const value = 'http://'

    expect(extractVimeoId(value)).toBeUndefined()
  })

  // A transform hands over a watch url without checking its host first.
  it('should return undefined for a video path on a foreign host', () => {
    const value = 'https://evil.test/76979871'

    expect(extractVimeoId(value)).toBeUndefined()
  })

  describe('file urls', () => {
    it('should not read a storage segment of the old file host as the video', () => {
      const value =
        'http://av.vimeo.com/50935/740/135924474.mp4?token2=1419120847_3a0308ba3fc5990ba6d094c79bf120db&aksessionid=836e901bee33a27f'

      expect(extractVimeoId(value)).toBeUndefined()
    })

    it('should leave a progressive_redirect file to the native player', () => {
      const value =
        'https://player.vimeo.com/progressive_redirect/playback/769954486/rendition/720p/file.mp4?loc=external&signature=49342bfcee8247a4f7477c5391a8a1f641f83ce23aa30538788bcfd09186abf7'

      expect(extractVimeoId(value)).toBeUndefined()
    })
  })
})

describe('readVimeoEmbedSrc', () => {
  it('should keep a decoded clip_id carrying a query in one path segment', () => {
    const value = 'http://vimeo.com/moogaloop.swf?clip_id=123%3Fautoplay%3D1%26muted%3D1'
    const expected = 'https://player.vimeo.com/video/123%3Fautoplay=1&muted=1'

    expect(readVimeoEmbedSrc(value)).toEqual(expected)
  })
})

describe('vimeoResolveEmbed', () => {
  it('should build the embed without a thumbnail', () => {
    const value = 'https://vimeo.com/76979871'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  // The player answers 401 for an unlisted video with no hash, so it has to survive whichever
  // spelling it arrives in. The id carries it because an oEmbed lookup for the bare id 404s.
  it('should preserve an unlisted hash stated in the query', () => {
    const value = 'https://player.vimeo.com/video/76979871?h=a52724358e'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871:a52724358e',
      src: 'https://player.vimeo.com/video/76979871?h=a52724358e',
      url: 'https://vimeo.com/76979871/a52724358e',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed query hash as written, even if the player answers an error', () => {
    const value = 'https://player.vimeo.com/video/76979871?h=../../showcase/1'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871:../../showcase/1',
      src: 'https://player.vimeo.com/video/76979871?h=..%2F..%2Fshowcase%2F1',
      url: 'https://vimeo.com/76979871/..%2F..%2Fshowcase%2F1',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should cut a query hash at the whitespace a feed left in it', () => {
    const value =
      'https://player.vimeo.com/video/664725670?h=04acf91ce2 portrait=0&amp;color=98895e'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '664725670:04acf91ce2',
      src: 'https://player.vimeo.com/video/664725670?h=04acf91ce2',
      url: 'https://vimeo.com/664725670/04acf91ce2',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should use a malformed clip_id as written, even if the player answers an error', () => {
    const value = 'http://vimeo.com/moogaloop.swf?clip_id=4775093/'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '4775093/',
      src: 'https://player.vimeo.com/video/4775093%2F',
      url: 'https://vimeo.com/4775093%2F',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  // The share link states it as a path segment, which the player refuses: it takes the hash
  // only as a query parameter.
  it('should move an unlisted hash stated in the path into the query', () => {
    const value = 'https://vimeo.com/76979871/a52724358e'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871:a52724358e',
      src: 'https://player.vimeo.com/video/76979871?h=a52724358e',
      url: 'https://vimeo.com/76979871/a52724358e',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  // A review link states the hash the same way, two segments further down.
  it('should read the video and hash out of a review link', () => {
    const value = 'https://vimeo.com/user170863801/review/76979871/a52724358e'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871:a52724358e',
      src: 'https://player.vimeo.com/video/76979871?h=a52724358e',
      url: 'https://vimeo.com/76979871/a52724358e',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should keep the hash ahead of the start offset', () => {
    const value = 'https://vimeo.com/76979871/a52724358e?t=30s'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871:a52724358e',
      src: 'https://player.vimeo.com/video/76979871?h=a52724358e&t=30s',
      url: 'https://vimeo.com/76979871/a52724358e',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should preserve the start offset', () => {
    const value = 'https://player.vimeo.com/video/76979871?t=30s'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871?t=30s',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should drop tracking parameters', () => {
    const value = 'https://player.vimeo.com/video/76979871?utm_source=feed'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
    }

    expect(vimeoResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a url naming no video', () => {
    const value = 'https://vimeo.com/user/profile'

    expect(vimeoResolveEmbed(value)).toBeUndefined()
  })

  // A showcase is a playlist in its own id space, so it resolves as itself rather than as the
  // video its number would otherwise be read as.
  describe('the showcase, and the album it used to be called', () => {
    it('should resolve a showcase embed to the showcase, posterless', () => {
      const value = 'https://vimeo.com/showcase/5371408/embed'
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: 'showcase/5371408',
        src: 'https://vimeo.com/showcase/5371408/embed',
        url: 'https://vimeo.com/showcase/5371408',
        ratio: '16/9',
      }

      expect(vimeoResolveEmbed(value)).toEqual(expected)
    })

    // The album player 301s onto the showcase one, so the id travels in the spelling Vimeo
    // itself redirects to.
    it('should normalise the album spelling onto the showcase', () => {
      const value = 'https://vimeo.com/album/5480258/embed'
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: 'showcase/5480258',
        src: 'https://vimeo.com/showcase/5480258/embed',
        url: 'https://vimeo.com/showcase/5480258',
        ratio: '16/9',
      }

      expect(vimeoResolveEmbed(value)).toEqual(expected)
    })

    it('should build the player from a bare showcase page url', () => {
      const value = 'https://vimeo.com/showcase/5371408'
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: 'showcase/5371408',
        src: 'https://vimeo.com/showcase/5371408/embed',
        url: 'https://vimeo.com/showcase/5371408',
        ratio: '16/9',
      }

      expect(vimeoResolveEmbed(value)).toEqual(expected)
    })

    // The deeper path still names a real video, and a video beats the collection around it.
    it('should resolve the video a showcase path names rather than the showcase', () => {
      const value = 'https://vimeo.com/showcase/3253534/video/76979871'
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '76979871',
        src: 'https://player.vimeo.com/video/76979871',
        url: 'https://vimeo.com/76979871',
        ratio: '16/9',
      }

      expect(vimeoResolveEmbed(value)).toEqual(expected)
    })

    it('should refuse a showcase path whose id is not numeric', () => {
      const value = 'https://vimeo.com/showcase/highlights/embed'

      expect(vimeoResolveEmbed(value)).toBeUndefined()
    })

    // An event is a livestream, not a playlist, and it stays with the generic placeholder: the
    // refusal is deliberate and is pinned here so removing it is a decision rather than a slip.
    it('should still leave an event embed unresolved', () => {
      const value = 'https://vimeo.com/event/5933775/embed'

      expect(vimeoResolveEmbed(value)).toBeUndefined()
    })

    it('should still leave an on-demand store front unresolved', () => {
      const value = 'https://vimeo.com/ondemand/20704'

      expect(vimeoResolveEmbed(value)).toBeUndefined()
    })
  })

  // The channel's id space is its own, and 927 is also a video somebody else made, so minting a
  // player here plays the wrong video rather than none.
  it('should not mint a player from a channel listing', () => {
    const value = 'https://vimeo.com/channels/927'

    expect(vimeoResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('vimeoEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vimeoEmbedResolver)

  it('should resolve a vimeo iframe', async () => {
    const value = '<iframe src="https://player.vimeo.com/video/76979871"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a foreign host carrying the player path', async () => {
    const value = '<iframe src="https://evil.test/video/76979871"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  it('should ignore a non-vimeo iframe', async () => {
    const value = '<iframe src="https://example.com/video"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })

  describe('the Flash player naming its clip in flashvars', () => {
    it('should read the clip from the flashvars of a moogaloop_local.swf embed', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://vimeo.com/moogaloop_local.swf?ver=24882"
          id="vimeo_clip_2610675"
          flashvars="clip_id=2610675&amp;server=vimeo.com&amp;autoplay=0&amp;fullscreen=1&amp;md5=0&amp;show_portrait=0&amp;show_title=0&amp;show_byline=0&amp;context=user:1070318&amp;context_id=&amp;force_embed=0&amp;multimoog=&amp;color=00ADEF&amp;force_info=undefined"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '2610675',
        src: 'https://player.vimeo.com/video/2610675',
        url: 'https://vimeo.com/2610675',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the clip from the flashvars of a moogaloop.swf embed', async () => {
      const value = html`
        <embed
          src="http://vimeo.com/moogaloop.swf"
          flashvars="clip_id=2610675&server=vimeo.com"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '2610675',
        src: 'https://player.vimeo.com/video/2610675',
        url: 'https://vimeo.com/2610675',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the clip from the flashvars param of the object around the embed', async () => {
      const value = html`
        <object>
          <param name="flashvars" value="clip_id=2610675&server=vimeo.com">
          <embed src="http://vimeo.com/moogaloop_local.swf?ver=24882">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '2610675',
        src: 'https://player.vimeo.com/video/2610675',
        url: 'https://vimeo.com/2610675',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the clip in the src query over the one in flashvars', async () => {
      const value = html`
        <embed
          src="http://vimeo.com/moogaloop.swf?clip_id=76979871"
          flashvars="clip_id=2610675"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '76979871',
        src: 'https://player.vimeo.com/video/76979871',
        url: 'https://vimeo.com/76979871',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the flashvars of a carrier that is not a Flash player', async () => {
      const value = html`
        <embed
          src="https://vimeo.com/showcase/5371408/embed"
          flashvars="clip_id=2610675"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: 'showcase/5371408',
        src: 'https://vimeo.com/showcase/5371408/embed',
        url: 'https://vimeo.com/showcase/5371408',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a moogaloop_local.swf embed with no clip in its flashvars', async () => {
      const value = html`
        <embed
          src="http://vimeo.com/moogaloop_local.swf?ver=24882"
          flashvars="server=vimeo.com&autoplay=0"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // Every corpus showcase carrier states a box, and none is read.
  it('should state the video ratio over the size a showcase iframe states', async () => {
    const value = html`
      <iframe
        src="https://vimeo.com/showcase/5371408/embed"
        width="525"
        height="295"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: 'showcase/5371408',
      src: 'https://vimeo.com/showcase/5371408/embed',
      url: 'https://vimeo.com/showcase/5371408',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  describe('the title the share snippet writes', () => {
    it('should carry the video title across', async () => {
      const value = html`
        <iframe
          src="https://player.vimeo.com/video/76979871"
          width="640"
          height="360"
          title="Scott M. Graffius - Speaker Reel"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '76979871',
        src: 'https://player.vimeo.com/video/76979871',
        url: 'https://vimeo.com/76979871',
        ratio: '16/9',
        title: 'Scott M. Graffius - Speaker Reel',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the label the share snippet writes in place of the name', async () => {
      const value = html`
        <iframe
          src="https://player.vimeo.com/video/76979871"
          title="Vimeo video player"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vimeo',
        id: '76979871',
        src: 'https://player.vimeo.com/video/76979871',
        url: 'https://vimeo.com/76979871',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('vimeoEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vimeoEmbedResolver)

  it('should drop the label a Joomla plugin writes in place of the name', async () => {
    const value = html`
      <iframe src="https://player.vimeo.com/video/76979871" title="JoomlaWorks AllVideos Player"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://player.vimeo.com/video/76979871" title="The Mountain"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'vimeo',
      id: '76979871',
      src: 'https://player.vimeo.com/video/76979871',
      url: 'https://vimeo.com/76979871',
      ratio: '16/9',
      title: 'The Mountain',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

// A WordPress video shortcode naming the video's page, which no browser plays, reaches the
// resolver only through the pipeline.
describeForEachParser('vimeo pages in a media element', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should frame a video shortcode naming a video page', async () => {
    const value = html`
      <p>
        <video
          class="wp-video-shortcode"
          id="video-174-1"
          width="640"
          height="360"
          preload="metadata"
          controls="controls"
        ><source type="video/vimeo" src="https://vimeo.com/89946577?loop=0&amp;_=1"><a href="https://vimeo.com/89946577?loop=0">https://vimeo.com/89946577?loop=0</a></video>
      </p>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://vimeo.com/89946577"
        data-embed-id="89946577"
        data-embed-provider="vimeo"
        data-embed-src="https://player.vimeo.com/video/89946577"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})

// Only an enclosure test reaches the path where claiming a file url would cost a reader the video.
describeForEachParser('vimeo through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a progressive_redirect enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://player.vimeo.com/progressive_redirect/playback/769954486/rendition/720p/file.mp4?loc=external&signature=49342bfcee8247a4f7477c5391a8a1f641f83ce23aa30538788bcfd09186abf7',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://player.vimeo.com/progressive_redirect/playback/769954486/rendition/720p/file.mp4?loc=external&signature=49342bfcee8247a4f7477c5391a8a1f641f83ce23aa30538788bcfd09186abf7"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
