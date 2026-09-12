import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { odeoMediaResolver } from './odeo.js'

describeForEachParser('odeoMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, odeoMediaResolver)

  describe('happy paths', () => {
    it('should play the file the player names in its flashvars', async () => {
      const value = html`
        <embed
          src="http://odeo.com/flash/audio_player_gray.swf"
          type="application/x-shockwave-flash"
          flashvars="audio_id=2348789&audio_duration=295.424&external_url=http://example.com/show/episode.mp3"
          height="54"
          width="322"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/show/episode.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the object spelling, which carries the vars as a param', async () => {
      const value = html`
        <object
          data="http://odeo.com/flash/audio_player_standard.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="FlashVars"
            value="audio_id=2348789&external_url=http://example.com/show/episode.mp3"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/show/episode.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the nested pair the snippet usually ships', () => {
    it('should play the file once when the embed sits inside its object', async () => {
      const value = html`
        <object
          data="http://odeo.com/flash/audio_player_gray.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="FlashVars"
            value="audio_id=2348789&external_url=http://example.com/show/episode.mp3"
          />
          <embed
            src="http://odeo.com/flash/audio_player_gray.swf"
            flashvars="audio_id=2348789&external_url=http://example.com/show/episode.mp3"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/show/episode.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should refuse a file on the retired Odeo media host, which no longer resolves', async () => {
      const value = html`
        <embed
          src="http://odeo.com/flash/audio_player_gray.swf"
          flashvars="audio_id=2348789&external_url=http://media.odeo.com/4/3/4/episode.mp3"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player naming no file', async () => {
      const value = html`
        <embed
          src="http://odeo.com/flash/audio_player_gray.swf"
          flashvars="audio_id=2348789&audio_duration=295.424"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the player in its path', async () => {
      const value = html`
        <embed
          src="http://evil.test/odeo.com/flash/audio_player_gray.swf"
          flashvars="external_url=http://example.com/show/episode.mp3"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
