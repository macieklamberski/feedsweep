import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripPlayableMediaFallbacks } from './stripPlayableMediaFallbacks.js'

describeForEachParser('stripPlayableMediaFallbacks', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [stripPlayableMediaFallbacks(baseContext)])
  }

  describe('happy paths', () => {
    it('should drop a paragraph fallback beside a source', async () => {
      const value = html`
        <video class="fig-video" controls alt>
          <source
            src="https://example.com/clip.mp4"
            type="video/mp4"
          >
          <p>Your browser doesn't support HTML5 Video :/</p>
        </video>
      `
      const expected = html`
        <video class="fig-video" controls alt>
          <source
            src="https://example.com/clip.mp4"
            type="video/mp4"
          >
        </video>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a link fallback from an audio', async () => {
      const value = html`
        <audio controls>
          <source src="https://example.com/episode.mp3">
          <a href="https://example.com/episode.mp3">Download the episode</a>
        </audio>
      `
      const expected = html`
        <audio controls>
          <source src="https://example.com/episode.mp3">
        </audio>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the fallback of a player with a src attribute and no source child', async () => {
      const value = html`
        <video
          src="https://example.com/clip.mp4"
          controls
        >
          <p>Your browser does not support the video tag.</p>
        </video>
      `
      const expected = html`
        <video
          src="https://example.com/clip.mp4"
          controls
        ></video>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a bare text fallback', async () => {
      const value = html`
        <audio
          src="https://example.com/episode.mp3"
          controls
        >Your browser does not support the audio element.</audio>
      `
      const expected = html`
        <audio
          src="https://example.com/episode.mp3"
          controls
        ></audio>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a track beside the source', async () => {
      const value = html`
        <video controls>
          <source src="https://example.com/clip.mp4">
          <track
            kind="captions"
            src="https://example.com/clip.vtt"
          >
          <p>No video</p>
        </video>
      `
      const expected = html`
        <video controls>
          <source src="https://example.com/clip.mp4">
          <track
            kind="captions"
            src="https://example.com/clip.vtt"
          >
        </video>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep the fallback of a player with no source', async () => {
      const value = html`
        <video controls>
          <p>No video</p>
        </video>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep the fallback when the source child has no src', async () => {
      const value = html`
        <video controls>
          <source data-src="https://example.com/clip.mp4">
          <p>No video</p>
        </video>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep the fallback when the src attribute is empty', async () => {
      const value = html`
        <audio
          src=""
          controls
        >
          <a href="https://example.com/episode.mp3">Download the episode</a>
        </audio>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an object fallback alone', async () => {
      const value = html`
        <object data="https://example.com/player.swf">
          <p>Get Flash to see this player.</p>
        </object>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = html`
        <video controls>
          <source src="https://example.com/clip.mp4">
          <track
            kind="captions"
            src="https://example.com/clip.vtt"
          >
          <p>No video</p>
        </video>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('stripPlayableMediaFallbacks through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should leave no fallback link under a playing audio', async () => {
    const value = html`
      <audio
        src="https://example.com/episode.mp3"
        controls
      >
        <p><a href="https://example.com/episode.mp3">Download the episode</a></p>
      </audio>
    `
    const expected = html`
      <audio
        src="https://example.com/episode.mp3"
        controls
      ></audio>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
