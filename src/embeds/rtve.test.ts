import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { rtveFlashEmbedResolver, rtveIframeEmbedResolver, rtveResolveEmbed } from './rtve.js'

describe('rtveResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a video player url', () => {
      const value = 'https://www.rtve.es/drmn/embed/video/2474214'
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/2474214',
        src: 'https://www.rtve.es/drmn/embed/video/2474214/',
        url: 'https://www.rtve.es/v/2474214/',
        thumbnail: 'https://img.rtve.es/v/2474214/',
        ratio: '16/9',
      }

      expect(rtveResolveEmbed(value)).toEqual(expected)
    })

    it('should build the placeholder from an audio player url without a poster', () => {
      const value = 'https://secure-embed.rtve.es/drmn/embed/audio/1925451/'
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/1925451',
        src: 'https://www.rtve.es/drmn/embed/audio/1925451/',
        url: 'https://www.rtve.es/a/1925451/',
        ratio: '16/9',
      }

      expect(rtveResolveEmbed(value)).toEqual(expected)
    })

    // RTVE's asset ids have been growing since 2008, and the length is not what names one.
    it('should build the placeholder from an id longer than the ones minted so far', () => {
      const value = 'https://www.rtve.es/drmn/embed/video/1628101512345'
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/1628101512345',
        src: 'https://www.rtve.es/drmn/embed/video/1628101512345/',
        url: 'https://www.rtve.es/v/1628101512345/',
        thumbnail: 'https://img.rtve.es/v/1628101512345/',
        ratio: '16/9',
      }

      expect(rtveResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a foreign host carrying the same path', () => {
      const value = 'https://rtve.es.evil.test/drmn/embed/video/2474214'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a kind the player does not serve', () => {
      const value = 'https://www.rtve.es/drmn/embed/photo/2474214'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed asset id as written, even if the player answers an error', () => {
      const value = 'https://www.rtve.es/drmn/embed/video/evil'
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/evil',
        src: 'https://www.rtve.es/drmn/embed/video/evil/',
        url: 'https://www.rtve.es/v/evil/',
        thumbnail: 'https://img.rtve.es/v/evil/',
        ratio: '16/9',
      }

      expect(rtveResolveEmbed(value)).toEqual(expected)
    })

    it('should return undefined for a player url naming no asset', () => {
      const value = 'https://www.rtve.es/drmn/embed/video/'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the embed path outside the drmn directory', () => {
      const value = 'https://www.rtve.es/player/embed/video/2474214'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a drmn path that is not the embed', () => {
      const value = 'https://www.rtve.es/drmn/share/video/2474214'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an rtve url that is not the player', () => {
      const value = 'https://www.rtve.es/play/videos/la-aventura-del-saber/copyleft/2474214/'

      expect(rtveResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('rtveIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, rtveIframeEmbedResolver)

  describe('happy paths', () => {
    // The snippet names the asset in `name`, and the frame is sized by its wrapper rather than
    // by attributes of its own, so the ratio is what the placeholder carries.
    it('should read the title off the name the snippet writes', async () => {
      const value = html`
        <iframe
          frameborder="0"
          src="http://www.rtve.es/drmn/embed/video/2474214"
          name="La Aventura del Saber. Copyleft"
          scrolling="no"
          style="width:100%;height:90%;position:absolute;left:0;top:0;overflow:hidden;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/2474214',
        src: 'https://www.rtve.es/drmn/embed/video/2474214/',
        url: 'https://www.rtve.es/v/2474214/',
        thumbnail: 'https://img.rtve.es/v/2474214/',
        ratio: '16/9',
        title: 'La Aventura del Saber. Copyleft',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the default ratio over a declared size', async () => {
      const value = html`
        <iframe
          src="https://secure-embed.rtve.es/drmn/embed/video/5544716"
          width="300"
          height="150"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/5544716',
        src: 'https://www.rtve.es/drmn/embed/video/5544716/',
        url: 'https://www.rtve.es/v/5544716/',
        thumbnail: 'https://img.rtve.es/v/5544716/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the declared height of an audio frame', async () => {
      const value = html`
        <iframe
          src="http://www.rtve.es/drmn/embed/audio/2518208"
          width="425"
          height="37"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/2518208',
        src: 'https://www.rtve.es/drmn/embed/audio/2518208/',
        url: 'https://www.rtve.es/a/2518208/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/drmn/embed/video/2474214"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('rtveFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, rtveFlashEmbedResolver)

  // The v2 player names the asset in the swf query. The modern player fills whatever it is
  // given, so it states 16:9 and the declared box is not read.
  describe('the v2 player', () => {
    it('should repair the dead player to the modern video embed', async () => {
      const value = html`
        <object
          id="RTVEPlayer"
          data="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=309749_es_videos&amp;location=embed"
          width="425"
          height="300"
        >
          <param
            name="movie"
            value="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=309749_es_videos&amp;location=embed"
          />
          <param name="wmode" value="opaque" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/309749',
        src: 'https://www.rtve.es/drmn/embed/video/309749/',
        url: 'https://www.rtve.es/v/309749/',
        thumbnail: 'https://img.rtve.es/v/309749/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the declared bar of an audio player', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=1025053_es_audios&amp;location=embed"
          width="650"
          height="45"
          type="application/x-shockwave-flash"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/1025053',
        src: 'https://www.rtve.es/drmn/embed/audio/1025053/',
        url: 'https://www.rtve.es/a/1025053/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The v2 embed snippet names the asset as the directory of the swf, with no query.
  describe('the v2 embed player', () => {
    it('should repair the dead player to the modern video embed', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/v2/embed/913019_es_videos/RTVEPlayer.swf"
          width="425"
          height="300"
          name="RTVEPlayer9268"
          allowfullscreen="true"
          allowscriptaccess="always"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/913019',
        src: 'https://www.rtve.es/drmn/embed/video/913019/',
        url: 'https://www.rtve.es/v/913019/',
        thumbnail: 'https://img.rtve.es/v/913019/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Constructed: no feed writes both, so this pins the order the module documents.
    it('should prefer the asset in the swf query over the swf path', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/embed/913019_es_videos/RTVEPlayer.swf?assetID=824677_es_videos" />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/824677',
        src: 'https://www.rtve.es/drmn/embed/video/824677/',
        url: 'https://www.rtve.es/v/824677/',
        thumbnail: 'https://img.rtve.es/v/824677/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Constructed: no feed writes both, so this pins the order the module documents.
    it('should prefer the asset in the flashvars over the swf path', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/v2/embed/913019_es_videos/RTVEPlayer.swf"
          flashvars="assetID=824677_es_videos"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/824677',
        src: 'https://www.rtve.es/drmn/embed/video/824677/',
        url: 'https://www.rtve.es/v/824677/',
        thumbnail: 'https://img.rtve.es/v/824677/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for the embed path below another directory', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/x/swf/v2/embed/913019_es_videos/RTVEPlayer.swf" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a swf below the player', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/embed/913019_es_videos/RTVEPlayer.swf/x.swf" />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The FLVPlayer names the asset only in its nielsen beacon, and an audio one by its config.
  describe('the FLVPlayer', () => {
    it('should repair the dead audio player to the modern audio embed', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo: 18 enero 2009&amp;file=http://www.rtve.es/resources/mp3/1/1/1232110176211.mp3&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml&amp;controlbar=title::Mediterráneo: 18 enero 2009"
          wmode="transparent"
          width="550"
          height="45"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/383526',
        src: 'https://www.rtve.es/drmn/embed/audio/383526/',
        url: 'https://www.rtve.es/a/383526/',
        ratio: '16/9',
        title: 'Mediterráneo: 18 enero 2009',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Constructed: the census carriers write the beacon in the swf query only.
    it('should read the beacon and the config off the flashvars', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf"
          flashvars="nielsen=assetID::420589,title::Videodrome: Encrucijada (22 febrero 2009)&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/420589',
        src: 'https://www.rtve.es/drmn/embed/audio/420589/',
        url: 'https://www.rtve.es/a/420589/',
        ratio: '16/9',
        title: 'Videodrome: Encrucijada (22 febrero 2009)',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for the video config the muchachadanui carriers write', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo&amp;config=http://www.rtve.es/swf/data/rtve_config_embed.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a config named after the audio one', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml.bak"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined when the beacon names no asset', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf?file=http://www.rtve.es/resources/mp3/1/1/1232110176211.mp3&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the FLVPlayer below another directory', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/x/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a swf below the FLVPlayer', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf/x.swf?nielsen=assetID::383526,title::Mediterráneo&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The 4.x player leaves the swf url bare and passes the asset in the flashvars.
  describe('the 4.x player', () => {
    it('should read the asset off the flashvars param', async () => {
      const value = html`
        <object
          data="http://swf.rtve.es/swf/4.2.26/RTVEPlayerVideo.swf"
          type="application/x-shockwave-flash"
          width="425"
          height="239"
        >
          <param name="movie" value="http://swf.rtve.es/swf/4.2.26/RTVEPlayerVideo.swf" />
          <param name="flashvars" value="assetID=1081934_es_videos&amp;location=embed_videos" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/1081934',
        src: 'https://www.rtve.es/drmn/embed/video/1081934/',
        url: 'https://www.rtve.es/v/1081934/',
        thumbnail: 'https://img.rtve.es/v/1081934/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title off the fallback link the snippet writes', async () => {
      const value = html`
        <object
          data="http://www.rtve.es/swf/4.1.14/RTVEPlayerVideo.swf"
          type="application/x-shockwave-flash"
        >
          <param name="flashvars" value="assetID=1551723_es_videos&amp;location=embed_videos" />
          <a href="https://example.com/alacarta/videos/mitos-y-leyendas/aquiles/1551723/">
            Mitos y leyendas - Aquiles
          </a>
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/1551723',
        src: 'https://www.rtve.es/drmn/embed/video/1551723/',
        url: 'https://www.rtve.es/v/1551723/',
        thumbnail: 'https://img.rtve.es/v/1551723/',
        ratio: '16/9',
        title: 'Mitos y leyendas - Aquiles',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player off the older irtve.es domain', async () => {
      const value = html`
        <embed
          id=""
          type="application/x-shockwave-flash"
          src="http://www.irtve.es/swf/4.2.15/RTVEPlayerVideo.swf"
          allowscriptaccess="always"
          allowfullscreen="allowfullscreen"
          flashvars="assetID=1429661_es_videos&amp;location=embed_videos"
          wmode="opaque"
          quality="high"
          width="425"
          height="239"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/1429661',
        src: 'https://www.rtve.es/drmn/embed/video/1429661/',
        url: 'https://www.rtve.es/v/1429661/',
        thumbnail: 'https://img.rtve.es/v/1429661/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an audio asset off the flashvars attribute', async () => {
      const value = html`
        <embed
          src="http://www.rtve.es/swf/4.0.31/RTVEPlayerAudio.swf"
          flashvars="assetID=1251286_es_audios&amp;location=embed_audios"
          width="425"
          height="37"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'audio/1251286',
        src: 'https://www.rtve.es/drmn/embed/audio/1251286/',
        url: 'https://www.rtve.es/a/1251286/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined when neither the swf query nor the flashvars name an asset', async () => {
      const value = html`
        <object data="http://swf.rtve.es/swf/4.2.26/RTVEPlayerVideo.swf">
          <param name="flashvars" value="location=embed_videos" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed asset id as written, even if the player answers an error', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=../evil_es_videos" />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/../evil',
        src: 'https://www.rtve.es/drmn/embed/video/../evil/',
        url: 'https://www.rtve.es/v/../evil/',
        thumbnail: 'https://img.rtve.es/v/../evil/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed asset id longer than any minted as written, even if the player answers an error', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=1234567890123_es_videos" />
      `
      const expected: EmbedResolverResult = {
        provider: 'rtve',
        id: 'video/1234567890123',
        src: 'https://www.rtve.es/drmn/embed/video/1234567890123/',
        url: 'https://www.rtve.es/v/1234567890123/',
        thumbnail: 'https://img.rtve.es/v/1234567890123/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for an asset with a segment after the kind', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/RTVEPlayer.swf?assetID=309749_es_videos_hd" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an rtve url that is not the flash player', async () => {
      const value = html`
        <object data="http://www.rtve.es/drmn/embed/video/2474214?assetID=309749_es_videos"></object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a swf outside the swf directory', async () => {
      const value = html`
        <embed src="http://www.rtve.es/static/swf/v2/RTVEPlayer.swf?assetID=309749_es_videos" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a page under the swf directory', async () => {
      const value = html`
        <embed src="http://www.rtve.es/swf/v2/RTVEPlayer.swf/about?assetID=309749_es_videos" />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a foreign host carrying the player path', async () => {
      const value = html`
        <embed src="https://evil.test/swf/v2/RTVEPlayer.swf?assetID=309749_es_videos" />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The enclosure probe offers every attachment a feed carries to this resolver, and RTVE serves
// its podcast and video files under its own domain, so the id shape is what keeps one playable.
describeForEachParser('rtve through the pipeline', (parseHtml) => {
  it('should turn a v2 embed player nested in its object into one placeholder', async () => {
    const value = html`
      <object
        height="300"
        width="425"
        classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        id="RTVEPlayer5110"
      >
        <param name="allowScriptAccess" value="never"></param>
        <param name="src" value="http://www.rtve.es/swf/v2/embed/824677_es_videos/RTVEPlayer.swf"></param>
        <param name="wmode" value="opaque"></param>
        <embed
          wmode="opaque"
          height="300"
          width="425"
          name="RTVEPlayer5110"
          src="http://www.rtve.es/swf/v2/embed/824677_es_videos/RTVEPlayer.swf"
          type="application/x-shockwave-flash"
        ></embed>
      </object>
    `
    const expected = html`
      <div
        data-embed-provider="rtve"
        data-embed-id="video/824677"
        data-embed-src="https://www.rtve.es/drmn/embed/video/824677/"
        data-embed-url="https://www.rtve.es/v/824677/"
        data-embed-thumbnail="https://img.rtve.es/v/824677/"
        data-embed-ratio="16/9"
      ></div>
    `

    expect(
      await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
      }),
    ).toEqualHtml(expected)
  })

  it('should turn an audio FLVPlayer nested in its object into one placeholder', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        width="550"
        height="45"
      >
        <param
          name="movie"
          value="http://www.rtve.es/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo: 18 enero 2009&amp;file=http://www.rtve.es/resources/mp3/1/1/1232110176211.mp3&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml&amp;controlbar=title::Mediterráneo: 18 enero 2009"
        >
        <param name="wmode" value="transparent">
        <embed
          src="http://www.rtve.es/swf/FLVPlayer.swf?nielsen=assetID::383526,title::Mediterráneo: 18 enero 2009&amp;file=http://www.rtve.es/resources/mp3/1/1/1232110176211.mp3&amp;config=http://www.rtve.es/swf/data/rtve_config_audio_embed.xml&amp;controlbar=title::Mediterráneo: 18 enero 2009"
          wmode="transparent"
          width="550"
          height="45"
        ></embed>
      </object>
    `
    const expected = html`
      <div
        data-embed-provider="rtve"
        data-embed-id="audio/383526"
        data-embed-src="https://www.rtve.es/drmn/embed/audio/383526/"
        data-embed-url="https://www.rtve.es/a/383526/"
        data-embed-ratio="16/9"
        data-embed-title="Mediterráneo: 18 enero 2009"
      ></div>
    `

    expect(
      await transformContent(value, {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
      }),
    ).toEqualHtml(expected)
  })

  it('should leave an audio enclosure on the rtve host playable', async () => {
    const enclosures = [
      {
        url: 'https://mvod.rtve.es/resources/TE_SBUENOS/mp3/1/2/1234567890121.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://mvod.rtve.es/resources/TE_SBUENOS/mp3/1/2/1234567890121.mp3"></audio>
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
