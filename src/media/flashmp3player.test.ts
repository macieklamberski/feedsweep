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

    it('should ignore an editor attribute holding the player url', async () => {
      const value = html`
        <div
          data-mce-data="http://flash-mp3-player.net/medias/player_mp3_maxi.swf"
          data-mce-flashvars="mp3=http://example.com/audio/track.mp3"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player in its path', async () => {
      const value = html`
        <embed
          src="http://evil.test/flash-mp3-player.net/medias/player_mp3_maxi.swf"
          flashvars="mp3=http://example.com/audio/track.mp3"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
