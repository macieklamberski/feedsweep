import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { wikimediaMediaResolver } from './wikimedia.js'

describeForEachParser('wikimediaMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, wikimediaMediaResolver)

  describe('happy paths', () => {
    it('should play the file itself rather than the twenty-pixel player frame', async () => {
      const value = html`
        <iframe
          src="https://commons.wikimedia.org/wiki/File:Ak52_10x.ogg?embedplayer=yes"
          width="220"
          height="20"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ak52_10x.ogg',
        title: 'Ak52 10x',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The origin travels from the carrier, so an http carrier keeps http.
    it('should read a file page spelled with a percent-encoded colon', async () => {
      const value =
        '<iframe src="http://commons.wikimedia.org/wiki/File%3AFennec_Singing.ogg?embedplayer=yes"></iframe>'
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://commons.wikimedia.org/wiki/Special:FilePath/Fennec_Singing.ogg',
        title: 'Fennec Singing',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the title the publisher wrote on the frame', async () => {
      const value = html`
        <iframe
          title="Publisher caption"
          src="https://commons.wikimedia.org/wiki/File:Ak52_10x.ogg?embedplayer=yes"
        ></iframe>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ak52_10x.ogg',
        title: 'Publisher caption',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should skip the file page of a video file', async () => {
      const value =
        '<iframe src="https://commons.wikimedia.org/wiki/File:Example.webm?embedplayer=yes"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip an ordinary wiki article', async () => {
      const value = '<iframe src="https://en.wikipedia.org/wiki/Fennec_fox"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip a file page named by a title parameter', async () => {
      const value =
        '<iframe src="https://commons.wikimedia.org/w/index.php?title=File:Song.ogg"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
