import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { corriereEmbedResolver, corriereResolveEmbed } from './corriere.js'

describe('corriereResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player and drop its query', () => {
      const value =
        'https://video.corriere.it/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c?fbclid=IwAR0x&playerType=embed&tipo_video=embed_norcs'
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '885087cc-33c7-11ea-bebf-10b7ce31a40c',
        src: 'https://video.corriere.it/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c',
        url: 'https://video.corriere.it/x/885087cc-33c7-11ea-bebf-10b7ce31a40c',
        ratio: '16/9',
      }

      expect(corriereResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the player over https from an http carrier', () => {
      const value = 'http://video.corriere.it/video-embed/0a11a540-b19f-11e3-a9ed-41701ef78e4b'
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '0a11a540-b19f-11e3-a9ed-41701ef78e4b',
        src: 'https://video.corriere.it/video-embed/0a11a540-b19f-11e3-a9ed-41701ef78e4b',
        url: 'https://video.corriere.it/x/0a11a540-b19f-11e3-a9ed-41701ef78e4b',
        ratio: '16/9',
      }

      expect(corriereResolveEmbed(value)).toEqual(expected)
    })

    it('should repair the widget player from the feed in its query', () => {
      const value =
        'https://video.corriere.it/widget/players/player_tv_video_iFrame.shtml?width=398&height=223&videoId=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss&channelName=ZELIG&advChannel=Zelig'
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '184654',
        src: 'https://video.corriere.it/video-embed/184654',
        url: 'https://video.corriere.it/x/184654',
        ratio: '16/9',
      }

      expect(corriereResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the id through as written', () => {
      const value = 'https://video.corriere.it/video-embed/885087CC_x'
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '885087CC_x',
        src: 'https://video.corriere.it/video-embed/885087CC_x',
        url: 'https://video.corriere.it/x/885087CC_x',
        ratio: '16/9',
      }

      expect(corriereResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the regional host alone', () => {
      const value =
        'https://video.corrieredelmezzogiorno.corriere.it/video-embed/68cff9f4-e814-11e4-a298-5bf537ea878f'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://video.corriere.it/x/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value =
        'https://video.corriere.it/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c/extra/x'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the watch page', () => {
      const value = 'https://video.corriere.it/x/885087cc-33c7-11ea-bebf-10b7ce31a40c'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget route under another section', () => {
      const value =
        'https://video.corriere.it/x/players/player_tv_video_iFrame.shtml?videoId=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget asset that is not a player', () => {
      const value =
        'https://video.corriere.it/widget/content/adv.xml?videoId=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget player whose feed is on a foreign host', () => {
      const value =
        'https://video.corriere.it/widget/players/player_tv_video_iFrame.shtml?videoId=http://evil.test/widget/content/video/rss/video_184654.rss'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a feed file with a prefix before its name', () => {
      const value =
        'https://video.corriere.it/widget/players/player_tv_video_iFrame.shtml?videoId=http://static2.video.corriereobjects.it/widget/content/video/rss/old_video_184654.rss'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a feed file with a suffix after its extension', () => {
      const value =
        'https://video.corriere.it/widget/players/player_tv_video_iFrame.shtml?videoId=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss.bak'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a widget player whose feed names no video', () => {
      const value =
        'https://video.corriere.it/widget/players/player_tv_video_iFrame.shtml?videoId=http://static2.video.corriereobjects.it/widget/content/conf/PolymediaCorriere_4.xml'

      expect(corriereResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('corriereEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, corriereEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the declared box', async () => {
      const value = html`
        <iframe
          src="https://video.corriere.it/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c"
          width="540"
          height="350"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '885087cc-33c7-11ea-bebf-10b7ce31a40c',
        src: 'https://video.corriere.it/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c',
        url: 'https://video.corriere.it/x/885087cc-33c7-11ea-bebf-10b7ce31a40c',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the Flash widget from the feed in its flashvars', async () => {
      const value = html`
        <embed
          width="640"
          height="380"
          type="application/x-shockwave-flash"
          name="polyshowEmbed"
          flashvars="configId=4&amp;configUrl=../content/conf/CorrierePolymediaShow_embedded_640.xml&amp;autostart=false&amp;videoId=05d9c16e-9e60-11e1-b8e5-2081876c6256&amp;videoUrl=http://static2.video.corriereobjects.it/widget/content/video/rss/video_05d9c16e-9e60-11e1-b8e5-2081876c6256.rss&amp;channelName=MILANO"
          src="http://static2.video.corriereobjects.it/widget/swf/CorrierePolymediaShow.swf"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'corriere',
        id: '05d9c16e-9e60-11e1-b8e5-2081876c6256',
        src: 'https://video.corriere.it/video-embed/05d9c16e-9e60-11e1-b8e5-2081876c6256',
        url: 'https://video.corriere.it/x/05d9c16e-9e60-11e1-b8e5-2081876c6256',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/video-embed/885087cc-33c7-11ea-bebf-10b7ce31a40c"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a Flash file outside the widget players', async () => {
      const value = html`
        <embed
          flashvars="videoUrl=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss"
          src="http://static2.video.corriereobjects.it/x/swf/CorrierePolymediaShow.swf"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a widget file that is not a Flash player', async () => {
      const value = html`
        <embed
          flashvars="videoUrl=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss"
          src="http://static2.video.corriereobjects.it/widget/x/CorrierePolymediaShow.swf"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a Flash path with a trailing segment', async () => {
      const value = html`
        <embed
          flashvars="videoUrl=http://static2.video.corriereobjects.it/widget/content/video/rss/video_184654.rss"
          src="http://static2.video.corriereobjects.it/widget/swf/CorrierePolymediaShow.swf/extra"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash widget with no feed', async () => {
      const value = html`
        <embed
          flashvars="configId=4&amp;autostart=false"
          src="http://static2.video.corriereobjects.it/widget/swf/CorrierePolymediaShow.swf"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('corriere players through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the Flash widget with the current player', async () => {
    const value = html`
      <embed
        width="640"
        height="380"
        type="application/x-shockwave-flash"
        flashvars="videoUrl=http://static2.video.corriereobjects.it/widget/content/video/rss/video_790590a2-7f4a-11e2-b0f8-b0cda815bb62.rss&amp;channelName=TRE-MINUTI-UNA-PAROLA"
        src="http://static2.video.corriereobjects.it/widget/swf/PolymediaCorriere.swf"
      />
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://video.corriere.it/x/790590a2-7f4a-11e2-b0f8-b0cda815bb62"
        data-embed-id="790590a2-7f4a-11e2-b0f8-b0cda815bb62"
        data-embed-provider="corriere"
        data-embed-src="https://video.corriere.it/video-embed/790590a2-7f4a-11e2-b0f8-b0cda815bb62"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
