import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { tumblrMediaResolver } from './tumblr.js'

describeForEachParser('tumblrMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tumblrMediaResolver)

  describe('happy paths', () => {
    it('should play the file Tumblr hosts rather than the player page', async () => {
      const value = html`
        <iframe
          class="tumblr_audio_player tumblr_audio_player_83372210021"
          src="https://example.com/post/83372210021/audio_player_iframe/example/tumblr_n4d1nwh3ub1qz6kxf?audio_file=https%3A%2F%2Fa.tumblr.com%2Ftumblr_n4d1nwh3ub1qz6kxfo1_r1.mp3"
          frameborder="0"
          allowtransparency="true"
          scrolling="no"
          width="540"
          height="169"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://a.tumblr.com/tumblr_n4d1nwh3ub1qz6kxfo1_r1.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should play a file the publisher hosts off Tumblr', async () => {
      const value = html`
        <iframe
          class="tumblr_audio_player tumblr_audio_player_138955950803"
          src="https://example.tumblr.com/post/138955950803/audio_player_iframe/example/tumblr_o297fiIHk11so8a6o?audio_file=http%3A%2F%2Fexample.org%2Fmisc%2Fepisode-55.mp3"
          width="540"
          height="169"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.org/misc/episode-55.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should skip a player page that names no audio file', async () => {
      const value = html`
        <iframe
          class="tumblr_audio_player tumblr_audio_player_83372210021"
          src="https://example.com/post/83372210021/audio_player_iframe/example/tumblr_n4d1nwh3ub1qz6kxf"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip an audio_file value that is not an audio file', async () => {
      const value = html`
        <iframe
          class="tumblr_audio_player tumblr_audio_player_83372210021"
          src="https://example.com/post/83372210021/audio_player_iframe/example/tumblr_n4d1nwh3ub1qz6kxf?audio_file=https%3A%2F%2Fexample.org%2Fepisode%2F55"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip a frame without the Tumblr audio player class', async () => {
      const value = html`
        <iframe
          class="audio_player"
          src="https://example.com/player?audio_file=https%3A%2F%2Fexample.org%2Fepisode-55.mp3"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
