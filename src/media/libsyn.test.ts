import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { libsynMediaResolver } from './libsyn.js'

describeForEachParser('libsynMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, libsynMediaResolver)

  describe('happy paths', () => {
    it('should play the file the player names in its flashvars', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          width="500"
          height="20"
        >
          <param
            name="movie"
            value="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          >
          <param
            name="flashvars"
            value="file=http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"
          >
          <embed
            type="application/x-shockwave-flash"
            src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
            width="500"
            height="20"
            flashvars="file=http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"
          />
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a file behind a redirect through as written', async () => {
      const value = html`
        <embed
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          flashvars="file=http://www.podtrac.com/pts/redirect.mp3/media.libsyn.com/media/themerlinshowhi/43f-Mann-Rutgers-Impro.mp3"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://www.podtrac.com/pts/redirect.mp3/media.libsyn.com/media/themerlinshowhi/43f-Mann-Rutgers-Impro.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a file whose host no longer serves it', async () => {
      const value = html`
        <embed
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          flashvars="file=http://example.com/d/a/2011/19/348/episode-001.mp3"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://example.com/d/a/2011/19/348/episode-001.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a YouTube watch page the player names as its file', async () => {
      const value = html`
        <embed
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          flashvars="file=http://www.youtube.com/watch?v=A7uvttu8ct0"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player naming no file', async () => {
      const value = html`
        <embed
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          flashvars="frontcolor=#cccccc"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <embed
          src="http://evil.test/media/themerlinshowhi/_static/play/player-licensed.swf"
          flashvars="file=http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The embed sits inside an `<object>` with no `data`, so only the pipeline shows the object
// leaving with it.
describeForEachParser('the object the libsyn snippet wraps around its embed', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the whole object with one audio element', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        width="500"
        height="20"
      >
        <param
          name="movie"
          value="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
        >
        <param
          name="flashvars"
          value="file=http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"
        >
        <embed
          type="application/x-shockwave-flash"
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          width="500"
          height="20"
          flashvars="file=http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"
        />
      </object>
    `
    const expected =
      '<audio controls src="http://media.libsyn.com/media/themerlinshowhi/Fresh_Starts___Modest_Changes.mp3"></audio>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave the player alone when its file is a YouTube watch page', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        width="500"
        height="400"
      >
        <param
          name="movie"
          value="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
        >
        <param
          name="flashvars"
          value="file=http://www.youtube.com/watch?v=A7uvttu8ct0"
        >
        <embed
          type="application/x-shockwave-flash"
          src="http://media.libsyn.com/media/themerlinshowhi/_static/play/player-licensed.swf"
          width="500"
          height="400"
          flashvars="file=http://www.youtube.com/watch?v=A7uvttu8ct0"
        />
      </object>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
