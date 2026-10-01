import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { reverbnationEmbedResolver, reverbnationResolveEmbed } from './reverbnation.js'

describe('reverbnationResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the widget id and drop the design and size', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=50&pwc[design]=default&pwc[size]=fit'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1018382',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=50',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the tracking parameters from the widget query', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55&pwc[size]=fit&utm_source=newsletter&utm_campaign=spring&fbclid=abc'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1018382',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the autoplay flag from the widget query', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55&pwc[auto_play]=1&pwc[size]=fit'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1018382',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the song a widget plays', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/artist_5181346?widget_id=55&pwc[song_ids]=25061544&context_type=song&pwc[size]=small'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_5181346',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_5181346?widget_id=55&pwc[song_ids]=25061544',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the whole list a widget includes', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/playlist_3560811?widget_id=55&pwc[included_songs]=1&context_type=playlist&pwc[size]=small'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'playlist_3560811',
        src: 'https://www.reverbnation.com/widget_code/html_widget/playlist_3560811?widget_id=55&pwc[included_songs]=1',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a single song on the older widget', () => {
      const value =
        'http://www.reverbnation.com/widget_code/html_widget/artist_175461?widget_id=50&posted_by=fan_1899577&pwc[design]=default&pwc[background_color]=%23333333&pwc[included_songs]=0&pwc[song_ids]=7025881&pwc[photo]=1%2C0&pwc[size]=fit'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_175461',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_175461?widget_id=50&pwc[included_songs]=0&pwc[song_ids]=7025881',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the colour, the branding and the promoter', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/artist_3930057?widget_id=55&pwc[song_ids]=34482761&context_type=song&spoid=promoter_2740&pwc[size]=small&pwc[branded]=1&pwc[color]=dark'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_3930057',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_3930057?widget_id=55&pwc[song_ids]=34482761',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should give an http frame the scheme it needs to load', () => {
      const value =
        'http://www.reverbnation.com/widget_code/html_widget/artist_1123149?widget_id=55'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1123149',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1123149?widget_id=55',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/widget_code/html_widget/artist_1018382'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a reverbnation url naming no widget', () => {
      const value = 'https://www.reverbnation.com/billyjonesbluez'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a url that cannot be parsed', () => {
      const value = 'https://['

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should refuse an id with no kind in front of the number', () => {
      const value = 'https://www.reverbnation.com/widget_code/html_widget/1018382'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a widget path naming nothing at all', () => {
      const value = 'https://www.reverbnation.com/widget_code/html_widget'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('the kinds a widget can name', () => {
    it('should take a capitalised playlist', () => {
      const value = 'https://www.reverbnation.com/widget_code/html_widget/Playlist_957851'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'Playlist_957851',
        src: 'https://www.reverbnation.com/widget_code/html_widget/Playlist_957851',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should take an album', () => {
      const value =
        'https://www.reverbnation.com/widget_code/html_widget/Album_170738?widget_id=55&context_type=album'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'Album_170738',
        src: 'https://www.reverbnation.com/widget_code/html_widget/Album_170738?widget_id=55',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the Flash players, moved onto the html widget', () => {
    it('should read the pro widget id parameter', () => {
      const value =
        'http://cache.reverbnation.com/widgets/swf/40/pro_widget.swf?id=artist_1354004&posted_by=&skin_id=PWAS1006&background_color=000000&auto_play=false'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1354004',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1354004',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should read the player playlist parameter', () => {
      const value =
        'http://cache.reverbnation.com/widgets/swf/15/widgetPlayer.swf?emailPlaylist=Playlist_957851&backgroundcolor=EEEEEE&autoPlay=false'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'Playlist_957851',
        src: 'https://www.reverbnation.com/widget_code/html_widget/Playlist_957851',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should read the tune widget parameter', () => {
      const value = 'http://cache.reverbnation.com/widgets/swf/29/tuneWidget.swf?twID=artist_164003'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_164003',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_164003',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the Flash colours, which the html widget does not take', () => {
      const value =
        'http://cache.reverbnation.com/widgets/swf/13/widgetPlayerMini.swf?emailPlaylist=artist_351836&backgroundcolor=5C2424&font_color=FFFFFF'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_351836',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_351836',
        height: 265,
      }

      expect(reverbnationResolveEmbed(value)).toEqual(expected)
    })

    it('should refuse an id parameter carrying a path after the number', () => {
      const value =
        'http://cache.reverbnation.com/widgets/swf/40/pro_widget.swf?id=artist_1354004%2F..%2F..%2Fadmin'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse an id parameter carrying a path before the kind', () => {
      const value =
        'http://cache.reverbnation.com/widgets/swf/40/pro_widget.swf?id=admin%2Fartist_1354004'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a swf outside the widgets directory', () => {
      const value =
        'http://cache.reverbnation.com/assets/widgets/swf/40/pro_widget.swf?id=artist_1354004'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a swf naming nothing', () => {
      const value = 'http://cache.reverbnation.com/widgets/swf/15/widgetPlayer.swf'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('shapes that are not a player', () => {
    // A one pixel counter, and the widget footer image the Flash players load beside themselves.
    it('should leave the tracking url alone', () => {
      const value = 'http://www.reverbnation.com/widgets/trk?id=artist_1018382'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the widget chrome image alone', () => {
      const value = 'http://cache.reverbnation.com/widgets/content/13/footer.png'

      expect(reverbnationResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('reverbnationEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, reverbnationEmbedResolver)

  describe('happy paths', () => {
    it('should take the widget out of an iframe', async () => {
      const value =
        '<iframe src="https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1018382',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55',
        height: 265,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the Flash player out of an embed and keep its box', async () => {
      const value = html`
        <embed
          src="http://cache.reverbnation.com/widgets/swf/40/pro_widget.swf?id=artist_1354004&amp;skin_id=PWAS1006"
          type="application/x-shockwave-flash"
          height="326"
          width="411"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1354004',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1354004',
        width: 411,
        height: 326,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/widget_code/html_widget/artist_1018382"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the size the widget does not have', () => {
    // The widget reflows instead of scaling, so the resolver states nothing and whatever the
    // publisher declared is what the placeholder reserves.
    it('should take the height from the carrier alone', async () => {
      const value = html`
        <iframe
          src="https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55"
          width="100%"
          height="520"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'reverbnation',
        id: 'artist_1018382',
        src: 'https://www.reverbnation.com/widget_code/html_widget/artist_1018382?widget_id=55',
        height: 520,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The resolver only reaches a feed through the registered default list, and only an enclosure
// test reaches the path where claiming a media url would cost a reader the audio.
describeForEachParser('reverbnation through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  // A frame that declares nothing is what the placeholder has to survive, since the resolver
  // states no size of its own.
  it('should claim a flash widget the default list reaches', async () => {
    const value = html`
      <embed
        src="https://cache.reverbnation.com/widgets/swf/54/pro_widget.swf?id=artist_1018382"
        type="application/x-shockwave-flash"
      />
    `
    const expected = html`
      <div
        data-embed-id="artist_1018382"
        data-embed-provider="reverbnation"
        data-embed-src="https://www.reverbnation.com/widget_code/html_widget/artist_1018382"
        data-embed-height="265"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // ReverbNation streams from a CloudFront host rather than from its own, but listing
  // `reverbnation.com` claims every subdomain, so the path check is what stands between an
  // enclosure and a placeholder pointing at an audio file.
  it('should leave an audio enclosure on a reverbnation host playable', async () => {
    const enclosures = [
      { url: 'https://cache.reverbnation.com/audio/1018382.mp3', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio
        data-enclosure=""
        controls
        src="https://cache.reverbnation.com/audio/1018382.mp3"
      ></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
