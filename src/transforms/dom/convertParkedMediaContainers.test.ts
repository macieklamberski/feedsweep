import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertParkedMediaContainers } from './convertParkedMediaContainers.js'

describeForEachParser('convertParkedMediaContainers', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [convertParkedMediaContainers(context)])
  }

  it('should convert an audio url into an audio element', async () => {
    const value = html`
      <div
        class="audiofield-wordpress-player"
        data-src="https://x.example/a.mp3"
      ></div>
    `
    const expected = html`
      <div class="audiofield-wordpress-player" data-src="https://x.example/a.mp3">
        <audio
          src="https://x.example/a.mp3"
          controls
        ></audio>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the container and its text, adding the media in front', async () => {
    const value = '<li data-audiopath="https://x.example/track.mp3">Track one</li>'
    const expected = html`
      <li
        data-audiopath="https://x.example/track.mp3"
      ><audio src="https://x.example/track.mp3" controls></audio>Track one</li>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should read a scoped entry on an element its selector matches', async () => {
    const value = html`
      <div
        class="track-block"
        data-track-url="https://cdn.example.com/ep.mp3"
      ></div>
    `
    const context: TransformContext = {
      ...baseContext,
      mediaSrcAttributes: [{ attribute: 'data-track-url', selector: '.track-block' }],
    }
    const expected = html`
      <div class="track-block" data-track-url="https://cdn.example.com/ep.mp3">
        <audio
          src="https://cdn.example.com/ep.mp3"
          controls
        ></audio>
      </div>
    `

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should leave a scoped entry unread outside its selector', async () => {
    const value = '<div data-track-url="https://cdn.example.com/ep.mp3"></div>'
    const context: TransformContext = {
      ...baseContext,
      mediaSrcAttributes: [{ attribute: 'data-track-url', selector: '.track-block' }],
    }

    expect(await transform(value, context)).toEqualHtml(value)
  })

  it('should resolve a relative parked url against the base url', async () => {
    const value = '<div data-video-src="/uploads/clip.mp4"></div>'
    const context = {
      ...baseContext,
      baseUrl: 'https://forum.example/t/1',
    }
    const expected = html`
      <div data-video-src="/uploads/clip.mp4">
        <video
          src="https://forum.example/uploads/clip.mp4"
          controls
        ></video>
      </div>
    `

    expect(await transform(value, context)).toEqualHtml(expected)
  })

  it('should convert a Squarespace audio block linking an external file', async () => {
    const value = html`
      <div
        class="sqs-audio-embed"
        data-design-style="classic"
        data-url="http://www.example.com/pts/redirect.mp3/storage/Curtain%20Call%20-%20Episode%205.mp3"
        data-asset-url=""
        data-author="Dale Campbell"
      >
        <span class="audio-author">Dale Campbell</span>
        <span class="audio-title">Curtain Call!: Episode #5</span>
      </div>
    `
    const expected = html`
      <div
        class="sqs-audio-embed"
        data-design-style="classic"
        data-url="http://www.example.com/pts/redirect.mp3/storage/Curtain%20Call%20-%20Episode%205.mp3"
        data-asset-url=""
        data-author="Dale Campbell"
      ><audio
          src="http://www.example.com/pts/redirect.mp3/storage/Curtain%20Call%20-%20Episode%205.mp3"
          controls
        ></audio>
        <span class="audio-author">Dale Campbell</span>
        <span class="audio-title">Curtain Call!: Episode #5</span>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should skip a Squarespace audio block linking a page', async () => {
    const value = html`
      <div
        class="sqs-audio-embed"
        data-url="https://soundcloud.example/user-363957584/session-08-song-backstory"
        data-asset-url=""
      ></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  // SoundCite plays a clip of the file inside a sentence, from its own start and end.
  it('should skip a data-url outside a Squarespace audio block', async () => {
    const value = html`
      <span
        class="soundcite"
        data-url="http://www.example.com/wp-content/uploads/2022/02/3121-Mission-Hill-Dr-8.m4a"
      >the bells</span>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should skip a streaming manifest', async () => {
    const value = '<div data-video-src="https://x.example/index.m3u8"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should skip a value that names an image', async () => {
    const value = '<div data-src="https://x.example/photo.jpg"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should skip a parked MediaWiki file page', async () => {
    const value =
      '<div data-src="https://commons.wikimedia.org/wiki/File:Example.webm?embedplayer=yes"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should skip a container that already wraps a player', async () => {
    const value = html`
      <div data-src="https://x.example/a.mp3">
        <audio
          controls
          src="https://x.example/a.mp3"
        ></audio>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should take the first attribute that names a media file', async () => {
    const value = html`
      <div
        data-mp4="https://x.example/a.mp4"
        data-webm="https://x.example/a.webm"
      ></div>
    `
    const expected = html`
      <div data-mp4="https://x.example/a.mp4" data-webm="https://x.example/a.webm">
        <video
          src="https://x.example/a.mp4"
          controls
        ></video>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // A parked url has to name a media file before the container is claimed, so an unmatched
  // extension left the container empty and the reader got nothing at all.
  it('should play a parked aac url as an audio element', async () => {
    const value = '<div data-src="https://cdn.example.com/ep.aac"></div>'
    const expected = html`
      <div data-src="https://cdn.example.com/ep.aac">
        <audio
          src="https://cdn.example.com/ep.aac"
          controls=""
        ></audio>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should be idempotent', async () => {
    const value = '<div data-src="https://cdn.example.com/ep.mp3"></div>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('convertParkedMediaContainers through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should hand the player it adds to the widget pass', async () => {
    const value =
      '<div data-src="https://feeds.soundcloud.com/stream/1234567890-example-episode.mp3"></div>'
    const expected = html`
      <div
        data-embed-height="166"
        data-embed-id="tracks/1234567890"
        data-embed-provider="soundcloud"
        data-embed-src="https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/1234567890"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
