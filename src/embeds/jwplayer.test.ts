import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  extractJwplayerId,
  jwplayerAmpEmbedResolver,
  jwplayerIframeEmbedResolver,
  jwplayerLibraryEmbedResolver,
  jwplayerResolveEmbed,
  jwplayerScriptEmbedResolver,
  jwplayerSetupEmbedResolver,
} from './jwplayer.js'

describe('extractJwplayerId', () => {
  it('should extract the media id from a player url', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873-abc12345.html'
    const expected = 'H4GXr873'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  it('should extract the media id when no player id is present', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873.html'
    const expected = 'H4GXr873'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  // Business Insider's feed ships JW Player embeds with an empty player id, leaving a
  // `{mediaId}-.html` tail whose URL 404s ("File not Found"). This is a quirk of that feed,
  // not something other providers hit. Most embeds carry a well-formed url, and extracting the
  // media id from the segment recovers it regardless of the missing player id.
  it('should extract the media id from a Business Insider empty-player-id url', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873-.html'
    const expected = 'H4GXr873'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  it('should extract the media id from a jwplatform.com host', () => {
    const value = 'https://content.jwplatform.com/players/H4GXr873-abc12345.html'
    const expected = 'H4GXr873'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  it('should return undefined for the player route naming no media', () => {
    const value = 'https://cdn.jwplayer.com/players'

    expect(extractJwplayerId(value)).toBeUndefined()
  })

  it('should return undefined for an invalid url', () => {
    const value = 'not a url'

    expect(extractJwplayerId(value)).toBeUndefined()
  })

  it('should read an id off the previews route', () => {
    const value = 'https://cdn.jwplayer.com/previews/H4GXr873'
    const expected = 'H4GXr873'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  // `products` is eight characters, so the bound this replaces read it as a media id.
  it('should return undefined for a marketing page whose slug fits the id shape', () => {
    const value = 'https://www.jwplayer.com/products'

    expect(extractJwplayerId(value)).toBeUndefined()
  })

  it('should read an id longer than the eight characters JW mints today', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873xyz-abc12345.html'
    const expected = 'H4GXr873xyz'

    expect(extractJwplayerId(value)).toBe(expected)
  })

  // An underscore is outside the alphabet a media id is written in, and it is what tells a
  // malformed id from a short one, since a short id fails the same whether minted or passed through.
  it('should use a malformed media id as written, even if the player answers an error', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GX_r873-abc12345.html'
    const expected = 'H4GX_r873'

    expect(extractJwplayerId(value)).toEqual(expected)
  })
})

describe('jwplayerResolveEmbed', () => {
  it('should build the embed with a thumbnail', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873-abc12345.html'
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(jwplayerResolveEmbed(value)).toEqual(expected)
  })

  // The rebuilt src drops the empty player-id segment that 404s in the Business Insider feed.
  it('should rebuild a working src from an empty-player-id url', () => {
    const value = 'https://cdn.jwplayer.com/players/H4GXr873-.html'
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(jwplayerResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined when no media id can be extracted', () => {
    const value = 'not a url'

    expect(jwplayerResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('jwplayerIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jwplayerIframeEmbedResolver)

  it('should resolve a jwplayer iframe', async () => {
    const value = '<iframe src="https://cdn.jwplayer.com/players/H4GXr873-.html"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should resolve a jwplatform iframe', async () => {
    const value =
      '<iframe src="https://content.jwplatform.com/players/H4GXr873-abc12345.html"></iframe>'
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a non-jwplayer iframe', async () => {
    const value = '<iframe src="https://example.com/video"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })
})

describeForEachParser('jwplayerScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jwplayerScriptEmbedResolver)

  it('should resolve the script embed to the default-player placeholder', async () => {
    const value = html`
      <script
        type="application/javascript"
        src="https://cdn.jwplayer.com/players/H4GXr873-abc12345.js"
      ></script>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should return undefined for a foreign host carrying the player path', async () => {
    const value = html`
      <script src="https://evil.test/players/H4GXr873-abc12345.js?jwplayer.com/players/"></script>
    `

    expect(await extract(value)).toBeUndefined()
  })
})

describeForEachParser('jwplayerAmpEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jwplayerAmpEmbedResolver)

  // AMP's documented snippet states the player's shape in `width` and `height`, so the pair is
  // the 16/9 it spells and not a sixteen-pixel box for a reader to reserve.
  it('should resolve the AMP element to the default-player placeholder', async () => {
    const value = html`
      <amp-jwplayer
        data-media-id="H4GXr873"
        data-player-id="abc12345"
        layout="responsive"
        width="16"
        height="9"
      ></amp-jwplayer>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the video ratio over a pixel box on the AMP element', async () => {
    const value = html`
      <amp-jwplayer
        data-media-id="H4GXr873"
        data-player-id="abc12345"
        width="640"
        height="360"
      ></amp-jwplayer>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should use a malformed media id as written, even if the player answers an error', async () => {
    const value = html`
      <amp-jwplayer data-media-id="../../evil" data-player-id="abc12345"></amp-jwplayer>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: '../../evil',
      src: 'https://cdn.jwplayer.com/players/../../evil.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/../../evil/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should return undefined for an empty media id', async () => {
    const value = html`
      <amp-jwplayer data-media-id="" data-player-id="abc12345"></amp-jwplayer>
    `

    expect(await extract(value)).toBeUndefined()
  })

  // A playlist names no single media, so it gets no poster: the poster endpoint answers about a
  // media and 404s for anything else. It does have a player page, which discriminates, so the
  // src is real even though the thumbnail would not be.
  it('should claim the playlist variant without inventing a poster', async () => {
    const value = html`
      <amp-jwplayer data-playlist-id="482jsTAr" data-player-id="abc12345"></amp-jwplayer>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'playlist/482jsTAr',
      src: 'https://cdn.jwplayer.com/players/482jsTAr.html',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  // AMP's own builder gives the playlist id precedence when both are present.
  it('should prefer the playlist id over the media id', async () => {
    const value = html`
      <amp-jwplayer
        data-playlist-id="482jsTAr"
        data-media-id="nPripu9l"
        data-player-id="abc12345"
      ></amp-jwplayer>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'playlist/482jsTAr',
      src: 'https://cdn.jwplayer.com/players/482jsTAr.html',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('jwplayerSetupEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jwplayerSetupEmbedResolver)

  it('should read the media id out of an inline setup call', async () => {
    const value = html`
      <div class="jwplayer" id="botr_hwhuyhFf_h5bP9bKQ_div"></div>
      <script>
        jwplayer("botr_hwhuyhFf_h5bP9bKQ_div").setup({"playlist":"https://cdn.jwplayer.com/v2/media/hwhuyhFf"});
      </script>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'hwhuyhFf',
      src: 'https://cdn.jwplayer.com/players/hwhuyhFf.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/hwhuyhFf/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  // Several players in one item each name their own container, so the id pairs them up.
  it('should read a script that names the div rather than following it', async () => {
    const value = html`
      <div class="jwplayer" id="botr_hwhuyhFf_h5bP9bKQ_div"></div>
      <p>Between the two.</p>
      <script>
        jwplayer("botr_hwhuyhFf_h5bP9bKQ_div").setup({"playlist":"https://cdn.jwplayer.com/v2/media/hwhuyhFf"});
      </script>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'hwhuyhFf',
      src: 'https://cdn.jwplayer.com/players/hwhuyhFf.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/hwhuyhFf/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read a media id carrying digits', async () => {
    const value = html`
      <div class="jwplayer" id="botr_H4GXr873_abc12345_div"></div>
      <script>
        jwplayer("botr_H4GXr873_abc12345_div").setup({"playlist":"https://cdn.jwplayer.com/v2/media/H4GXr873"});
      </script>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'H4GXr873',
      src: 'https://cdn.jwplayer.com/players/H4GXr873.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/H4GXr873/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should stop the media id at the query of the playlist url', async () => {
    const value = html`
      <div class="jwplayer" id="botr_hwhuyhFf_h5bP9bKQ_div"></div>
      <script>
        jwplayer("botr_hwhuyhFf_h5bP9bKQ_div").setup({"playlist":"https://cdn.jwplayer.com/v2/media/hwhuyhFf?poster_width=640"});
      </script>
    `
    const expected: EmbedResolverResult = {
      provider: 'jwplayer',
      id: 'hwhuyhFf',
      src: 'https://cdn.jwplayer.com/players/hwhuyhFf.html',
      thumbnail: 'https://cdn.jwplayer.com/v2/media/hwhuyhFf/poster.jpg',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should return undefined when the setup call names no media', async () => {
    const value = html`
      <div class="jwplayer" id="botr_hwhuyhFf_h5bP9bKQ_div"></div>
      <script>
        jwplayer("botr_hwhuyhFf_h5bP9bKQ_div").setup({"file":"https://example.com/video.mp4"});
      </script>
    `

    expect(await extract(value)).toBeUndefined()
  })

  it('should return undefined for a player div carrying no script', async () => {
    const value = '<div class="jwplayer"></div>'

    expect(await extract(value)).toBeUndefined()
  })
})

describeForEachParser('jwplayerLibraryEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, jwplayerLibraryEmbedResolver)

  describe('happy paths', () => {
    it('should read the media id from the setup call after the library', async () => {
      const value = html`
        <div id="jwppp-video-169721" class="jwplayer">Loading the player...</div>
        <script type="text/javascript" src="https://content.jwplatform.com/libraries/Aq9gyX5k.js"></script>
        <script type="text/javascript">
          var playerInstance_169721 = jwplayer( "jwppp-video-169721" );
          playerInstance_169721.setup({
            playlist: "https://cdn.jwplayer.com/v2/media/NEnylXdA",
          })
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'NEnylXdA',
        src: 'https://cdn.jwplayer.com/players/NEnylXdA.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/NEnylXdA/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title, description and date from the jwppp box naming the same media', async () => {
      const value = html`
        <div id="jwppp-video-box-8472f0eac1a376c597733a7f893e9c5a" class="jwppp-video-box" itemscope itemtype="http://schema.org/VideoObject" data-video="H4mbSOk5">
          <meta itemprop="name" content="Exercise 1">
          <meta itemprop="description" content="Michelle shares her plan for staying fit now and for decades to come!">
          <meta itemprop="thumbnailUrl" content="https://cdn.jwplayer.com/thumbs/H4mbSOk5-720.jpg">
          <meta itemprop="uploadDate" content="2026-06-30T12:02:04+10:00">
          <meta itemprop="contentUrl" content="https://cdn.jwplayer.com/v2/media/H4mbSOk5">
          <div id="jwppp-video-8472f0eac1a376c597733a7f893e9c5a" class="jwplayer">Loading the player…</div>
          <script type="text/javascript" src="https://content.jwplatform.com/libraries/My3UNrjH.js"></script>
          <script type="text/javascript">
            var playerInstance_8472f0eac1a376c597733a7f893e9c5a = jwplayer( "jwppp-video-8472f0eac1a376c597733a7f893e9c5a" );
            playerInstance_8472f0eac1a376c597733a7f893e9c5a.setup({
              playlist: "https://cdn.jwplayer.com/v2/media/H4mbSOk5",
            })
          </script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'H4mbSOk5',
        src: 'https://cdn.jwplayer.com/players/H4mbSOk5.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/H4mbSOk5/poster.jpg',
        ratio: '16/9',
        title: 'Exercise 1',
        description: 'Michelle shares her plan for staying fit now and for decades to come!',
        date: '2026-06-30T12:02:04+10:00',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the media id across a mount between the library and the setup call', async () => {
      const value = html`
        <script type="text/javascript" src="https://content.jwplatform.com/libraries/An9NPLfb.js"></script>
        <div id="jwplayer_m6LgPTlO_An9NPLfb_div"></div>
        <script type="text/javascript">
          jwplayer('jwplayer_m6LgPTlO_An9NPLfb_div').setup(
            {"playlist":"https:\\/\\/content.jwplatform.com\\/feeds\\/m6LgPTlO.json","ph":2}
          );
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'm6LgPTlO',
        src: 'https://cdn.jwplayer.com/players/m6LgPTlO.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/m6LgPTlO/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the media id out of a legacy jw6 playlist', async () => {
      const value = html`
        <script type="text/javascript" src="http://content.jwplatform.com/libraries/SNLXQlVh.js"></script>
        <div id="jwplayer_QJmMZD9a_SNLXQlVh_div"></div>
        <script type="text/javascript">
          jwplayer('jwplayer_QJmMZD9a_SNLXQlVh_div').setup(
            {"image":"-1","playlist":"http:\\/\\/content.jwplatform.com\\/jw6\\/QJmMZD9a.xml"}
          );
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'QJmMZD9a',
        src: 'https://cdn.jwplayer.com/players/QJmMZD9a.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/QJmMZD9a/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a setup call made through a publisher wrapper of jwplayer()', async () => {
      const value = html`
        <script type="text/javascript" src="https://content.jwplatform.com/libraries/yTTJs9q5.js"></script>
        <div id="jwplayer_vZeeVFhU_yTTJs9q5_div"></div>
        <script type="text/javascript">
          pmc_jwplayer('jwplayer_vZeeVFhU_yTTJs9q5_div').setup(
            {"vloc":"auto","floating":true,"playlist":"https://content.jwplatform.com/feeds/vZeeVFhU.json","ph":2}
          );
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'vZeeVFhU',
        src: 'https://cdn.jwplayer.com/players/vZeeVFhU.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/vZeeVFhU/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the library path', async () => {
      const value = html`
        <div id="jwppp-video-169721" class="jwplayer"></div>
        <script src="https://evil.test/libraries/Aq9gyX5k.js?content.jwplatform.com/libraries/"></script>
        <script>jwplayer("jwppp-video-169721").setup({playlist: "https://cdn.jwplayer.com/v2/media/NEnylXdA"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a library with no setup call beside it', async () => {
      const value = html`
        <p>
          <script src="http://content.jwplatform.com/libraries/TzPJRoGH.js"></script>
          Por el placer de leer en voz alta
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a setup call that plays a file of its own', async () => {
      const value = html`
        <script src="https://content.jwplatform.com/libraries/TzPJRoGH.js"></script>
        <div id="myElement"></div>
        <script>jwplayer("myElement").setup({file: "https://example.com/episode.mp3"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave out the fields of a jwppp box naming another media', async () => {
      const value = html`
        <div class="jwppp-video-box" data-video="1">
          <meta itemprop="name" content="Exercise 3">
          <meta itemprop="contentUrl" content="https://cdn.jwplayer.com/v2/media/a0pUZLdB">
          <div id="jwppp-video-1" class="jwplayer"></div>
          <script src="https://content.jwplatform.com/libraries/My3UNrjH.js"></script>
          <script>jwplayer("jwppp-video-1").setup({playlist: "https://cdn.jwplayer.com/v2/media/H4mbSOk5"})</script>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'H4mbSOk5',
        src: 'https://cdn.jwplayer.com/players/H4mbSOk5.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/H4mbSOk5/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave out the fields of a jwppp box that does not wrap the player itself', async () => {
      const value = html`
        <div class="jwppp-video-box" data-video="1">
          <meta itemprop="name" content="Exercise 1">
          <meta itemprop="contentUrl" content="https://cdn.jwplayer.com/v2/media/H4mbSOk5">
          <div>
            <div id="jwppp-video-1" class="jwplayer"></div>
            <script src="https://content.jwplatform.com/libraries/My3UNrjH.js"></script>
            <script>jwplayer("jwppp-video-1").setup({playlist: "https://cdn.jwplayer.com/v2/media/H4mbSOk5"})</script>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'jwplayer',
        id: 'H4mbSOk5',
        src: 'https://cdn.jwplayer.com/players/H4mbSOk5.html',
        thumbnail: 'https://cdn.jwplayer.com/v2/media/H4mbSOk5/poster.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a feeds playlist on another host', async () => {
      const value = html`
        <script src="https://content.jwplatform.com/libraries/An9NPLfb.js"></script>
        <div id="jwplayer_m6LgPTlO_An9NPLfb_div"></div>
        <script>jwplayer('jwplayer_m6LgPTlO_An9NPLfb_div').setup({"playlist":"https://example.com/feeds/m6LgPTlO.json"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a setup call filling a mount away from the library', async () => {
      const value = html`
        <div id="jwppp-video-1"></div>
        <script src="https://content.jwplatform.com/libraries/Aq9gyX5k.js"></script>
        <script>jwplayer("jwppp-video-2").setup({playlist: "https://cdn.jwplayer.com/v2/media/NEnylXdA"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a setup call that names no mount', async () => {
      const value = html`
        <script src="https://content.jwplatform.com/libraries/Aq9gyX5k.js"></script>
        <script>window.jwplayerInstance.setup({playlist: "https://cdn.jwplayer.com/v2/media/NEnylXdA"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a mount and setup call outside the block holding the library', async () => {
      const value = html`
        <div>
          <script src="https://content.jwplatform.com/libraries/An9NPLfb.js"></script>
        </div>
        <div id="jwplayer_m6LgPTlO_An9NPLfb_div"></div>
        <script>jwplayer('jwplayer_m6LgPTlO_An9NPLfb_div').setup({"playlist":"https://content.jwplatform.com/feeds/m6LgPTlO.json"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a setup call past the mount and another block', async () => {
      const value = html`
        <script src="https://content.jwplatform.com/libraries/An9NPLfb.js"></script>
        <div id="jwplayer_m6LgPTlO_An9NPLfb_div"></div>
        <p>Watch the clip.</p>
        <script>jwplayer('jwplayer_m6LgPTlO_An9NPLfb_div').setup({"playlist":"https://content.jwplatform.com/feeds/m6LgPTlO.json"})</script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The resolver alone cannot see this: `wrapBareInlineInParagraphs` runs before the widget pass
// and puts the bare script in a `<p>`, so the div's sibling is that paragraph.
describeForEachParser('jwplayerSetupEmbedResolver through the pipeline', (parseHtml) => {
  it('should recover a player whose script the paragraph pass has wrapped', async () => {
    const value = html`
      <div class="jwplayer"></div>
      <script>
        jwplayer("x").setup({"playlist":"https://cdn.jwplayer.com/v2/media/hwhuyhFf"});
      </script>
    `
    const result = await transformContent(value, { parseHtmlFn: parseHtml })

    expect(result).toContainHtml('data-embed-id="hwhuyhFf"')
  })
})

// The url resolver reaches every enclosure a feed carries, and JW's media CDN sits on the same
// domain as its player: only the route check keeps a rendition file a video.
describeForEachParser('jwplayerIframeEmbedResolver through the pipeline', (parseHtml) => {
  it('should leave a JW rendition enclosure playable', async () => {
    const enclosures = [
      { url: 'https://cdn.jwplayer.com/videos/H4GXr873-1280.mp4', type: 'video/mp4' },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://cdn.jwplayer.com/videos/H4GXr873-1280.mp4"></video>
      <p>Body</p>
    `

    expect(
      await transformContent('<p>Body</p>', {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
        enclosures,
      }),
    ).toEqualHtml(expected)
  })
})

// The paragraph pass puts the library and the setup call in a `<p>`, apart from the mount beside
// them, and only the pipeline shows the setup call leaving with the library.
describeForEachParser('jwplayerLibraryEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the library and its setup call and keep the mount text', async () => {
    const value = html`
      <div
        id="jwppp-video-box-169721"
        class="jwppp-video-box"
        data-video="1"
      >
        <div id="jwppp-video-169721" class="jwplayer">Loading the player...</div>
        <script type="text/javascript" src="https://content.jwplatform.com/libraries/Aq9gyX5k.js"></script><script type="text/javascript">
          var playerInstance_169721 = jwplayer( "jwppp-video-169721" );
          playerInstance_169721.setup({
            playlist: "https://cdn.jwplayer.com/v2/media/NEnylXdA",
          })
        </script>
      </div>
    `
    const expected = html`
      <p>Loading the player...</p>
      <div
        data-embed-thumbnail="https://cdn.jwplayer.com/v2/media/NEnylXdA/poster.jpg"
        data-embed-src="https://cdn.jwplayer.com/players/NEnylXdA.html"
        data-embed-ratio="16/9"
        data-embed-provider="jwplayer"
        data-embed-id="NEnylXdA"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should read the jwppp box around the paragraph the library was wrapped in', async () => {
    const value = html`
      <div id="jwppp-video-box-8472f0eac1a376c597733a7f893e9c5a" class="jwppp-video-box" itemscope itemtype="http://schema.org/VideoObject" data-video="H4mbSOk5">
        <meta itemprop="name" content="Exercise 1">
        <meta itemprop="contentUrl" content="https://cdn.jwplayer.com/v2/media/H4mbSOk5">
        <div id="jwppp-video-8472f0eac1a376c597733a7f893e9c5a" class="jwplayer">Loading the player…</div>
        <script type="text/javascript" src="https://content.jwplatform.com/libraries/My3UNrjH.js"></script><script type="text/javascript">
          var playerInstance_8472f0eac1a376c597733a7f893e9c5a = jwplayer( "jwppp-video-8472f0eac1a376c597733a7f893e9c5a" );
          playerInstance_8472f0eac1a376c597733a7f893e9c5a.setup({
            playlist: "https://cdn.jwplayer.com/v2/media/H4mbSOk5",
          })
        </script>
      </div>
    `
    const expected = html`
      <meta itemprop="name" content="Exercise 1">
      <meta itemprop="contentUrl" content="https://cdn.jwplayer.com/v2/media/H4mbSOk5">
      <p>Loading the player…</p>
      <div
        data-embed-title="Exercise 1"
        data-embed-thumbnail="https://cdn.jwplayer.com/v2/media/H4mbSOk5/poster.jpg"
        data-embed-src="https://cdn.jwplayer.com/players/H4mbSOk5.html"
        data-embed-ratio="16/9"
        data-embed-provider="jwplayer"
        data-embed-id="H4mbSOk5"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should find the mount and setup call after a library the paragraph pass wrapped', async () => {
    const value = html`
      <p>In einem fremden Land.
        <script type="text/javascript" src="http://content.jwplatform.com/libraries/SNLXQlVh.js"></script>
      </p>
      <div id="jwplayer_QJmMZD9a_SNLXQlVh_div"></div>
      <script type="text/javascript">
        jwplayer('jwplayer_QJmMZD9a_SNLXQlVh_div').setup(
          {"image":"-1","playlist":"http:\\/\\/content.jwplatform.com\\/jw6\\/QJmMZD9a.xml"}
        );
      </script>
    `
    const expected = html`
      <p>In einem fremden Land. </p>
      <div
        data-embed-thumbnail="https://cdn.jwplayer.com/v2/media/QJmMZD9a/poster.jpg"
        data-embed-src="https://cdn.jwplayer.com/players/QJmMZD9a.html"
        data-embed-ratio="16/9"
        data-embed-provider="jwplayer"
        data-embed-id="QJmMZD9a"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
