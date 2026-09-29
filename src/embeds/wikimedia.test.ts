import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { wikimediaEmbedResolver } from './wikimedia.js'

describeForEachParser('wikimediaEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, wikimediaEmbedResolver)

  describe('happy paths', () => {
    it('should frame the player and mint a poster from the file name', async () => {
      const value = html`
        <iframe
          src="https://commons.wikimedia.org/wiki/File:Sidang_Tahunan.webm?embedplayer=yes"
          width="512"
          height="288"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Sidang_Tahunan.webm',
        src: 'https://commons.wikimedia.org/wiki/File:Sidang_Tahunan.webm?embedplayer=yes',
        thumbnail:
          'https://commons.wikimedia.org/wiki/Special:FilePath/Sidang_Tahunan.webm?width=960',
        width: 512,
        height: 288,
        title: 'Sidang Tahunan',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The carrier's src is handed on as written and resolved by the pass, while the poster is
    // composed here and so takes a scheme.
    it('should keep a protocol-relative carrier and mint an absolute poster', async () => {
      const value = html`
        <iframe
          src="//commons.wikimedia.org/wiki/File:DesignThinking.ogv?embedplayer=yes"
          width="700"
          height="393"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'DesignThinking.ogv',
        src: '//commons.wikimedia.org/wiki/File:DesignThinking.ogv?embedplayer=yes',
        thumbnail:
          'https://commons.wikimedia.org/wiki/Special:FilePath/DesignThinking.ogv?width=960',
        width: 700,
        height: 393,
        title: 'DesignThinking',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The poster is served by whichever wiki framed the file, Commons upload or not.
    it('should mint the poster from the framing wiki', async () => {
      const value = html`
        <iframe
          src="https://de.wikipedia.org/wiki/Datei:Beispiel.webm?embedplayer=yes"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Beispiel.webm',
        src: 'https://de.wikipedia.org/wiki/Datei:Beispiel.webm?embedplayer=yes',
        thumbnail: 'https://de.wikipedia.org/wiki/Special:FilePath/Beispiel.webm?width=960',
        width: 640,
        height: 360,
        title: 'Beispiel',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should skip the file page of an audio file', async () => {
      const value =
        '<iframe src="https://commons.wikimedia.org/wiki/File:Fennec_Singing.ogg?embedplayer=yes"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    // The `/w/index.php?title=` spelling carries no iframe traffic in the corpus, so the guard
    // refuses it and the generic placeholder keeps the url as the publisher wrote it.
    it('should skip a file page named by a title parameter', async () => {
      const value =
        '<iframe src="https://commons.wikimedia.org/w/index.php?title=File:Clip.webm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip an ordinary wiki article', async () => {
      const value =
        '<iframe src="https://en.wikipedia.org/wiki/Correlation_does_not_imply_causation"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should skip a direct file on the upload host', async () => {
      const value =
        '<iframe src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Ada.webm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    // Without it the address answers with the description page, 101 KB against the player's 7.
    it('should add the player parameter when the publisher omitted it', async () => {
      const value = html`
        <iframe
          src="https://commons.wikimedia.org/wiki/File:Example.webm"
          width="640"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Example.webm',
        src: 'https://commons.wikimedia.org/wiki/File:Example.webm?embedplayer=yes',
        thumbnail: 'https://commons.wikimedia.org/wiki/Special:FilePath/Example.webm?width=960',
        width: 640,
        height: 360,
        title: 'Example',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a file page spelled with a percent-encoded colon', async () => {
      const value =
        '<iframe src="https://commons.wikimedia.org/wiki/File%3AExample.webm?embedplayer=yes"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Example.webm',
        src: 'https://commons.wikimedia.org/wiki/File%3AExample.webm?embedplayer=yes',
        thumbnail: 'https://commons.wikimedia.org/wiki/Special:FilePath/Example.webm?width=960',
        ratio: '16/9',
        title: 'Example',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Commons spells one file `Odia_Mobile.webmhd.webm`, two extensions deep.
    it('should keep every extension in the id', async () => {
      const value = html`
        <iframe
          src="https://commons.wikimedia.org/wiki/File:Odia_Mobile.webmhd.webm?embedplayer=yes"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Odia_Mobile.webmhd.webm',
        src: 'https://commons.wikimedia.org/wiki/File:Odia_Mobile.webmhd.webm?embedplayer=yes',
        thumbnail:
          'https://commons.wikimedia.org/wiki/Special:FilePath/Odia_Mobile.webmhd.webm?width=960',
        ratio: '16/9',
        title: 'Odia Mobile.webmhd',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the title the publisher wrote on the frame', async () => {
      const value = html`
        <iframe
          title="Publisher caption"
          src="https://commons.wikimedia.org/wiki/File:Example.webm?embedplayer=yes"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'wikimedia',
        id: 'Example.webm',
        src: 'https://commons.wikimedia.org/wiki/File:Example.webm?embedplayer=yes',
        thumbnail: 'https://commons.wikimedia.org/wiki/Special:FilePath/Example.webm?width=960',
        ratio: '16/9',
        title: 'Publisher caption',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})
