import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ccmaEmbedResolver } from './ccma.js'

describeForEachParser('ccmaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ccmaEmbedResolver)

  describe('the EVP player, which names its video in flashvars', () => {
    it('should read the video id off the object and keep its box', async () => {
      const value = html`
        <object
          width="320"
          height="277"
          type="application/x-shockwave-flash"
          data="https://www.tv3.cat/ria/players/3ac/evp/Main.swf"
        >
          <param
            name="FlashVars"
            value="videoid=1234567&themepath=themes/evp_advanced.swf"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '1234567',
        src: 'https://www.3cat.cat/3cat/video/1234567/embed/',
        url: 'https://www.ccma.cat/video/1234567/',
        width: 320,
        height: 277,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the same id off the embed spelling', async () => {
      const value = html`
        <embed
          src="https://www.tv3.cat/ria/players/3ac/evp/Main.swf"
          flashvars="videoid=1234567&autoplay=false"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '1234567',
        src: 'https://www.3cat.cat/3cat/video/1234567/embed/',
        url: 'https://www.ccma.cat/video/1234567/',
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
  })

  describe('the SVP2 player, which names its video in the object id', () => {
    it('should read the video id off the wrapping object', async () => {
      const value = html`
        <object
          height="277"
          id="SVP1234567IE"
          width="320"
        >
          <param
            name="movie"
            value="https://www.tv3.cat/svp2/svp2.swf"
          />
          <embed
            src="https://www.tv3.cat/svp2/svp2.swf"
            width="320"
            height="277"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '1234567',
        src: 'https://www.3cat.cat/3cat/video/1234567/embed/',
        url: 'https://www.ccma.cat/video/1234567/',
        width: 320,
        height: 277,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a player standing outside an object, where the id is not written', async () => {
      const value = '<embed src="https://www.tv3.cat/svp2/svp2.swf">'

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
  })

  describe('the modern player frame', () => {
    it('should claim the frame the current snippet writes', async () => {
      const value = html`
        <iframe
          src="https://www.3cat.cat/3cat/video/1234567/embed/"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ccma',
        id: '1234567',
        src: 'https://www.3cat.cat/3cat/video/1234567/embed/',
        url: 'https://www.ccma.cat/video/1234567/',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the article page, which refuses to be framed', async () => {
      const value = '<iframe src="https://www.3cat.cat/3cat/video/1234567/"></iframe>'

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
          src="https://evil.test/www.tv3.cat/ria/players/3ac/evp/Main.swf"
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
