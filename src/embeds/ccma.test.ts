import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ccmaEmbedResolver } from './ccma.js'

describeForEachParser('ccmaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ccmaEmbedResolver)

  describe('the EVP player, which names its video in flashvars', () => {
    it('should read the video id off the object and state the player ratio over its box', async () => {
      const value = html`
        <object
          width="320"
          height="277"
          type="application/x-shockwave-flash"
          data="http://www.tv3.cat/ria/players/3ac/evp/Main.swf"
        >
          <param
            name="FlashVars"
            value="videoid=3839550&themepath=themes/evp_advanced.swf"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '3839550',
        src: 'https://www.3cat.cat/3cat/video/3839550/embed/',
        url: 'https://www.ccma.cat/video/3839550/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the same id off the embed spelling', async () => {
      const value = html`
        <embed
          width="640"
          height="398"
          type="application/x-shockwave-flash"
          src="http://www.tv3.cat/ria/players/3ac/evp/Main.swf"
          id="EVP4368870"
          scale="noscale"
          name="EVP4368870"
          allowfullscreen="true"
          allowscriptaccess="always"
          wmode="transparent"
          flashvars="themepath=themes/evp_advanced.swf&refreshlock=true&minimal=false&instancename=playerEVP_0_4368870&autostart=false&xtm=true&videoid=4368870&basepath=http://www.tv3.cat/ria/players/3ac/evp/"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '4368870',
        src: 'https://www.3cat.cat/3cat/video/4368870/embed/',
        url: 'https://www.ccma.cat/video/4368870/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a player naming no video', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="https://www.tv3.cat/ria/players/3ac/evp/Main.swf"
        >
          <param
            name="FlashVars"
            value="themepath=themes/evp_advanced.swf"
          />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed video id as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="https://www.tv3.cat/ria/players/3ac/evp/Main.swf"
          flashvars="videoid=..%2F..%2Fx"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '../../x',
        src: 'https://www.3cat.cat/3cat/video/../../x/embed/',
        url: 'https://www.ccma.cat/video/../../x/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the player path below another segment', async () => {
      const value = html`
        <embed
          src="https://www.tv3.cat/x/ria/players/3ac/evp/Main.swf"
          flashvars="videoid=1234567"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the SVP2 player, which names its video in flashvars and the object id', () => {
    it('should read the video id off the flashvars of a bare embed and state the player ratio', async () => {
      const value = html`
        <embed
          id="SVP_instance1"
          src="http://www.tv3.cat/svp2/svp2.swf"
          flashvars="VIDEO_ID=723529&amp;WIDTH=400"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '723529',
        src: 'https://www.3cat.cat/3cat/video/723529/embed/',
        url: 'https://www.ccma.cat/video/723529/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the video id off the flashvars of an object with no SVP id', async () => {
      const value = html`
        <object id="SVP723529">
          <param
            name="flashvars"
            value="VIDEO_ID=723529&amp;WIDTH=400"
          />
          <embed src="http://www.tv3.cat/svp2/svp2.swf" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '723529',
        src: 'https://www.3cat.cat/3cat/video/723529/embed/',
        url: 'https://www.ccma.cat/video/723529/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the video id off the wrapping object and state the player ratio over its box', async () => {
      const value = html`
        <object
          height="277"
          id="SVP885479IE"
          width="320"
        >
          <param
            name="movie"
            value="http://www.tv3.cat/svp2/svp2.swf"
          />
          <embed
            src="http://www.tv3.cat/svp2/svp2.swf"
            width="320"
            height="277"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '885479',
        src: 'https://www.3cat.cat/3cat/video/885479/embed/',
        url: 'https://www.ccma.cat/video/885479/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the flashvars video id over the object id when the two differ', async () => {
      const value = html`
        <object id="SVP885479IE">
          <param
            name="flashvars"
            value="VIDEO_ID=723529&amp;WIDTH=400"
          />
          <embed src="http://www.tv3.cat/svp2/svp2.swf" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '723529',
        src: 'https://www.3cat.cat/3cat/video/723529/embed/',
        url: 'https://www.ccma.cat/video/723529/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a player naming no video', async () => {
      const value = '<embed src="https://www.tv3.cat/svp2/svp2.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a file beside the player', async () => {
      const value = html`
        <embed
          src="https://www.tv3.cat/svp2/svp2.swf.xml"
          flashvars="VIDEO_ID=1234567"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the player path below another segment', async () => {
      const value = html`
        <embed
          src="https://www.tv3.cat/x/svp2/svp2.swf"
          flashvars="VIDEO_ID=1234567"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an object id that is not the SVP shape', async () => {
      const value = html`
        <object id="player-1">
          <embed src="https://www.tv3.cat/svp2/svp2.swf" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an object id with the SVP shape after a prefix', async () => {
      const value = html`
        <object id="playerSVP1234567IE">
          <embed src="https://www.tv3.cat/svp2/svp2.swf" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an object id with the SVP shape before a suffix', async () => {
      const value = html`
        <object id="SVP1234567IE2">
          <embed src="https://www.tv3.cat/svp2/svp2.swf" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the modern player frame', () => {
    it('should claim the frame the current snippet writes', async () => {
      const value = html`
        <iframe
          title="video 6364376"
          src="https://www.3cat.cat/3cat/video/6381486/embed/"
          allowfullscreen
          scrolling="no"
          frameborder="0"
          width="560px"
          height="315px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '6381486',
        src: 'https://www.3cat.cat/3cat/video/6381486/embed/',
        url: 'https://www.ccma.cat/video/6381486/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from the frame query', async () => {
      const value = html`
        <iframe src="https://www.3cat.cat/3cat/video/6381486/embed/?utm_source=twitter"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '6381486',
        src: 'https://www.3cat.cat/3cat/video/6381486/embed/',
        url: 'https://www.ccma.cat/video/6381486/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed frame video id as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://www.3cat.cat/3cat/video/abc/embed/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: 'abc',
        src: 'https://www.3cat.cat/3cat/video/abc/embed/',
        url: 'https://www.ccma.cat/video/abc/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the article page, which refuses to be framed', async () => {
      const value = '<iframe src="https://www.3cat.cat/3cat/video/1234567/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route below the embed route', async () => {
      const value = '<iframe src="https://www.3cat.cat/3cat/video/1234567/embed/amp/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route under another section', async () => {
      const value = '<iframe src="https://www.3cat.cat/x/3cat/video/1234567/embed/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the player frame from before the 3Cat rebrand', () => {
    it('should claim the frame on the CCMA host', async () => {
      const value = html`
        <iframe
          src="http://www.ccma.cat/video/embed/5712873"
          allowfullscreen
          scrolling="no"
          frameborder="0"
          width="560px"
          height="320px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '5712873',
        src: 'https://www.3cat.cat/3cat/video/5712873/embed/',
        url: 'https://www.ccma.cat/video/5712873/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the Super3 spelling of the frame onto its own skin', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="281px"
          scrolling="no"
          src="https://www.ccma.cat/video/embed/super3/5787362/"
          width="500px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '5787362',
        src: 'https://www.3cat.cat/video/embed/sx3/5787362/',
        url: 'https://www.ccma.cat/video/5787362/',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a route below the embed route', async () => {
      const value = '<iframe src="https://www.ccma.cat/video/embed/1234567/amp/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the embed route under another section', async () => {
      const value = '<iframe src="https://www.ccma.cat/programa/video/embed/1234567/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the CCMA audio frame', () => {
    it('should key the audio frame apart from video ids and keep its declared box', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="281px"
          scrolling="no"
          src="http://www.ccma.cat/audio/embed/859074"
          width="500px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: 'audio/859074',
        src: 'https://www.3cat.cat/3cat/audio/859074/embed/',
        width: 500,
        height: 281,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed audio id as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://www.ccma.cat/audio/embed/abc"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: 'audio/abc',
        src: 'https://www.3cat.cat/3cat/audio/abc/embed/',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a route below the audio embed route', async () => {
      const value = '<iframe src="https://www.ccma.cat/audio/embed/859074/amp/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the audio embed route under another section', async () => {
      const value = '<iframe src="https://www.ccma.cat/programa/audio/embed/859074/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should ignore the legacy videos route, which names no player', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="https://www.tv3.cat/videos/1234567"
        ></object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player in its path', async () => {
      const value = html`
        <embed
          src="https://evil.test/ria/players/3ac/evp/Main.swf"
          flashvars="videoid=1234567"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame on the broadcaster that is not one of the two players', async () => {
      const value = '<iframe src="https://www.tv3.cat/directes/tv3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ccma through the pipeline', (parseHtml) => {
  it('should leave a video enclosure on the 3cat host playable', async () => {
    const enclosures = [
      {
        url: 'https://mp4-high-dwn.3cat.cat/2024/01/15/1234567/1234567_1080.mp4',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://mp4-high-dwn.3cat.cat/2024/01/15/1234567/1234567_1080.mp4"></video>
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
