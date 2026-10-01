import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { flashMp3PlayerMediaResolver } from './flashmp3player.js'

describeForEachParser('flashMp3PlayerMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flashMp3PlayerMediaResolver)

  describe('happy paths', () => {
    it('should play the file the object names in its param', async () => {
      const value = html`
        <object
          data="http://flash-mp3-player.net/medias/player_mp3_maxi.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="FlashVars"
            value="mp3=http://example.com/audio/track.mp3&showstop=1"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/track.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should decode the file url the embed dialect escapes', async () => {
      const value = html`
        <embed
          src="http://flash-mp3-player.net/medias/player_mp3_mini.swf"
          flashvars="mp3=http%3A//example.com/audio/track.mp3&showvolume=1"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/track.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the file named in the player url', () => {
    it('should play the file the player url names when flashvars name none', async () => {
      const value = html`
        <object
          id="flash"
          type="application/x-shockwave-flash"
          data="http://flash-mp3-player.net/medias/player_mp3_multi.swf?mp3=http://example.com/audio/track.mp3&amp;width=700&amp;autoplay=0&amp;volume=90&amp;showstop=1&amp;showvolume=1"
          width="700"
          height="50"
        ></object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/track.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the file flashvars name over the one in the player url', async () => {
      const value = html`
        <embed
          src="http://flash-mp3-player.net/medias/player_mp3_maxi.swf?mp3=http://example.com/audio/other.mp3"
          flashvars="mp3=http://example.com/audio/track.mp3"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/track.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the nested pair the snippet usually ships', () => {
    it('should play the file once when the embed sits inside its object', async () => {
      const value = html`
        <object
          data="http://flash-mp3-player.net/medias/player_mp3_maxi.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="FlashVars"
            value="mp3=http://example.com/audio/track.mp3&showstop=1"
          />
          <embed
            src="http://flash-mp3-player.net/medias/player_mp3_maxi.swf"
            flashvars="mp3=http://example.com/audio/track.mp3&showstop=1"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/audio/track.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming no file', async () => {
      const value = html`
        <embed
          src="http://flash-mp3-player.net/medias/player_mp3_maxi.swf"
          flashvars="showstop=1&showinfo=1&showvolume=1"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <embed
          src="http://evil.test/medias/player_mp3_maxi.swf?flash-mp3-player.net/medias/"
          flashvars="mp3=http://example.com/audio/track.mp3"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
