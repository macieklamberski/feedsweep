import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { srgplayEmbedResolver } from './srgplay.js'

describeForEachParser('srgplayEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, srgplayEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the shared player', async () => {
      const value = html`
        <iframe
          height="351"
          name="Wohngarten in Lanterswil TG"
          src="https://tp.srgssr.ch/p/srf/embed?urn=urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3&start="
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
        src: 'https://www.srf.ch/play/embed?urn=urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
        url: 'https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
        height: 351,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the ais urn through as the source wrote it', async () => {
      const value =
        '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1&start="></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1',
        src: 'https://www.srf.ch/play/embed?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1',
        url: 'https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player on the business unit own host', async () => {
      const value =
        '<iframe src="https://www.rts.ch/play/embed?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c&subdivisions=false"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
        src: 'https://www.rts.ch/play/embed?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
        url: 'https://www.rts.ch/play/tv/-/video/-?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the retired per-show player from the id it carries', async () => {
      const value =
        '<iframe src="http://www.srf.ch/player/tv/tagesschau--vom-19-07-2013/videoembed/g20-will-steuerschlupfloecher-stopfen?id=620986d4-4b67-4c35-9be7-e80ef4baa706&mode=embed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:srf:video:620986d4-4b67-4c35-9be7-e80ef4baa706',
        src: 'https://www.srf.ch/play/embed?urn=urn:srf:video:620986d4-4b67-4c35-9be7-e80ef4baa706',
        url: 'https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:video:620986d4-4b67-4c35-9be7-e80ef4baa706',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the popup window player from the id it carries', async () => {
      const value = html`
        <iframe
          height="480"
          name="10vor10 vom 06.02.2013"
          src="https://www.srf.ch/play/tv/popupvideoplayer?id=09c4a927-c156-46b7-8f53-c6a6302bfd88&startTime=22.597"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:srf:video:09c4a927-c156-46b7-8f53-c6a6302bfd88',
        src: 'https://www.srf.ch/play/embed?urn=urn:srf:video:09c4a927-c156-46b7-8f53-c6a6302bfd88',
        url: 'https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:video:09c4a927-c156-46b7-8f53-c6a6302bfd88',
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/tp.srgssr.ch/p/srf/embed?urn=urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://srf.ch.evil.test/play/embed?urn=urn:srf:video:cfb39f35-b1f7-4937-a806-68bea0e611d3"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    // Every one of these reaches the player path and is refused on the urn: an unknown business
    // unit has no host to mint, and a urn holding a separator would choose the query itself.
    it.each([
      '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=urn:zzz:video:cfb39f35-b1f7-4937"></iframe>',
      '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=urn%3Asrf%3Avideo%3Aabc%26autoplay%3D1"></iframe>',
      '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=urn%3Asrf%3Avideo%3Aabc%2F..%2Fother"></iframe>',
      '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=cfb39f35-b1f7-4937"></iframe>',
      '<iframe src="https://tp.srgssr.ch/p/srf/embed"></iframe>',
    ])('should return undefined for %s', async (value) => {
      expect(await extract(value)).toBeUndefined()
    })

    // The id of a retired player is written into a urn and then into a url, so a value holding a
    // separator would choose the query.
    it.each([
      '<iframe src="https://www.srf.ch/play/tv/popupvideoplayer?id=abc%26autoplay%3D1"></iframe>',
      '<iframe src="https://www.srf.ch/play/tv/popupvideoplayer?id=abc%2F..%2Fother"></iframe>',
    ])('should return undefined for %s', async (value) => {
      expect(await extract(value)).toBeUndefined()
    })

    // Pages and files on the same hosts. A `.mp3` on a media subdomain is the one that costs a
    // reader something: the enclosure probe offers it to every url resolver.
    it.each([
      '<iframe src="https://www.srf.ch/play/tv"></iframe>',
      '<iframe src="https://www.srf.ch/news/schweiz/an-article"></iframe>',
      '<iframe src="https://www.srf.ch/play/tv/popupvideoplayer"></iframe>',
      '<iframe src="https://download-media.srf.ch/world/audio/2014/03/episode.mp3"></iframe>',
    ])('should return undefined for %s', async (value) => {
      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should accept the digits RTS older player writes where SRF writes a uuid', async () => {
      const value =
        '<iframe src="https://www.rts.ch/play/embed?urn=urn:rts:video:5590499"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:rts:video:5590499',
        src: 'https://www.rts.ch/play/embed?urn=urn:rts:video:5590499',
        url: 'https://www.rts.ch/play/tv/-/video/-?urn=urn:rts:video:5590499',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no page for an audio urn', async () => {
      const value =
        '<iframe src="https://tp.srgssr.ch/p/rsi/embed?urn=urn:rsi:audio:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:rsi:audio:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1',
        src: 'https://www.rsi.ch/play/embed?urn=urn:rsi:audio:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the swissinfo host the swi unit answers on', async () => {
      const value =
        '<iframe src="https://tp.srgssr.ch/p/swi/embed?urn=urn:swi:video:cfb39f35-b1f7-4937-a806-68bea0e611d3"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:swi:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
        src: 'https://www.swissinfo.ch/play/embed?urn=urn:swi:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
        url: 'https://www.swissinfo.ch/play/tv/-/video/-?urn=urn:swi:video:cfb39f35-b1f7-4937-a806-68bea0e611d3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the urn business unit over the one the path names', async () => {
      const value =
        '<iframe src="https://tp.srgssr.ch/p/srf/embed?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'srgplay',
        id: 'urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
        src: 'https://www.rts.ch/play/embed?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
        url: 'https://www.rts.ch/play/tv/-/video/-?urn=urn:rts:video:a15ce9d3-7446-3deb-a710-70bddfd5239c',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the RTS short code, which is a live url in another id space', () => {
    // `rts.ch/embed/NSLL` 301s onto `play/embed?urn=urn:rts:video:5590499`, a number only the
    // platform holds: the integration layer answers 404 for `urn:rts:video:NSLL`. Nothing is
    // mintable from the code, and the carrier still plays, so it keeps the generic placeholder.
    it.each([
      '<iframe width="560" height="315" src="http://www.rts.ch/embed/NSLL"></iframe>',
      '<iframe src="https://www.rts.ch/embed/NSLL"></iframe>',
      '<iframe src="https://www.rts.ch/v/NSLL"></iframe>',
    ])('should return undefined for %s', async (value) => {
      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The carrier arrives protocol-relative, which the resolver cannot read until an earlier pass has
// given it a scheme, and both minted urls go through the url pass before the placeholder is
// written. Only the pipeline shows either.
describeForEachParser('srgplay through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should keep the minted player whole through the url pass', async () => {
    const value =
      '<iframe src="//tp.srgssr.ch/p/srf/embed?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1&start="></iframe>'

    const expected = html`
      <div
        data-embed-url="https://www.srf.ch/play/tv/-/video/-?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1"
        data-embed-id="urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1"
        data-embed-provider="srgplay"
        data-embed-src="https://www.srf.ch/play/embed?urn=urn:srf:ais:video:b47f4c3d-890a-4fe7-beb4-9a99e995d8c1"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an SRF audio enclosure playable', async () => {
    const enclosures = [
      { url: 'https://download-media.srf.ch/world/audio/2014/03/episode.mp3', type: 'audio/mpeg' },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://download-media.srf.ch/world/audio/2014/03/episode.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
