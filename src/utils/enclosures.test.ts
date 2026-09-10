import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser } from '../tests.js'
import type { Enclosure, TransformContext } from '../types.js'
import { prepareEnclosures } from './enclosures.js'

describeForEachParser('prepareEnclosures', (parseHtml) => {
  const prepare = (
    enclosures: Array<Enclosure>,
    context: TransformContext = baseContext,
  ): Array<Enclosure> => {
    return prepareEnclosures(enclosures, parseHtml(''), context)
  }

  const prepareUrls = (
    enclosures: Array<Enclosure>,
    context: TransformContext = baseContext,
  ): Array<string | undefined> => {
    return prepare(enclosures, context).map((enclosure) => enclosure.url)
  }

  describe('image variants', () => {
    it('should keep the original when two urls differ only by query', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg?w=300', type: 'image/jpeg' },
        { url: 'https://example.com/cover.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/cover.jpg'])
    })

    // A feed listing one picture as both a native enclosure and a media:content can spell the
    // two differently, and the fingerprint that collapses them only compares hosts and paths.
    it('should collapse two urls that differ only by a missing scheme', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg', type: 'image/jpeg' },
        { url: '//example.com/cover.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/cover.jpg'])
    })

    it('should collapse a WordPress -WxH variant to the full-res original', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/uploads/photo.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/uploads/photo-800x450.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/uploads/photo.jpg'])
    })

    it('should keep the larger of two sized variants', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg?w=300', type: 'image/jpeg' },
        { url: 'https://example.com/cover.jpg?w=900', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/cover.jpg?w=900'])
    })

    it('should keep the higher-ranked size keyword when neither url encodes a size', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/large.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/photos/sunset/large.jpg'])
    })

    // Order is what the ranking replaces, so the smaller keyword arriving first has to lose too.
    it('should keep the higher-ranked size keyword when the smaller one comes first', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/large.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/photos/sunset/large.jpg'])
    })

    // "preview" is a thumbnail on one host and the full image on another, so it ranks 0 and
    // cannot decide: the first enclosure stays, as it did before any keyword was read.
    it('should keep the first variant when one size keyword is unrankable', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/preview.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/photos/sunset/preview.jpg'])
    })

    // The size keyword is read off the path, so a segment naming a member every object inherits
    // reaches that table too. Read as a rank it outranks nothing and decides nothing, which
    // leaves the no-query url to settle the pair, exactly as the unknown segment below does.
    it('should let no size keyword decide when a segment names an inherited member', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/constructor/small.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/photos/constructor', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/photos/constructor'])
    })

    it('should let no size keyword decide when a segment is one nothing ranks', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/small.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/photos/sunset'])
    })

    it('should prefer the no-query url when colliding variants have no size to compare', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/cover.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual(['https://example.com/cover.jpg'])
    })

    it('should keep distinct images that differ by path', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/a/photo.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/b/photo.jpg', type: 'image/jpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual([
        'https://example.com/a/photo.jpg',
        'https://example.com/b/photo.jpg',
      ])
    })
  })

  describe('player pages', () => {
    it('should merge a player page with its media file into one enclosure', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]

      expect(prepare(enclosures)).toEqual([
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ])
    })

    it('should fill missing display size from the player page and keep the file metadata', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/embed?file=https://example.com/ep.mp3', height: 165 },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg', duration: 843 },
      ]

      expect(prepare(enclosures)).toEqual([
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          duration: 843,
          height: 165,
          playerUrl: 'https://player.example.com/embed?file=https://example.com/ep.mp3',
        },
      ])
    })

    it('should not merge a file entry into a player page with a different nested url', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fother.mp3' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]

      expect(prepareUrls(enclosures)).toEqual([
        'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fother.mp3',
        'https://example.com/ep.mp3',
      ])
    })

    it('should parse a playerEmbed enclosure and merge it with its media file', () => {
      const enclosures: Array<Enclosure> = [
        {
          playerEmbed:
            '<iframe src="https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3&amp;modern=1" scrolling="no" width="100%" height="165"></iframe>',
        },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]

      expect(prepare(enclosures)).toEqual([
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          height: 165,
          playerUrl:
            'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3&modern=1',
        },
      ])
    })

    // A hidden or lazy player frame declares a zero, which is not a height to reserve.
    it('should ignore a zero the player frame declares', () => {
      const enclosures: Array<Enclosure> = [
        {
          playerEmbed:
            '<iframe src="https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3" width="0" height="0"></iframe>',
        },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]

      expect(prepare(enclosures)).toEqual([
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ])
    })

    it('should drop a playerEmbed enclosure without an iframe src', () => {
      const enclosures: Array<Enclosure> = [
        { playerEmbed: '<p>player</p>' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]

      expect(prepare(enclosures)).toEqual([
        {},
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
        },
      ])
    })

    it('should merge using cleanUrlFn-normalized urls', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3' },
        { url: 'https://example.com/ep.mp3?utm_source=feed', type: 'audio/mpeg' },
      ]
      const context: TransformContext = {
        ...baseContext,
        cleanUrlFn: (url) => url.split('?')[0],
      }

      expect(prepare(enclosures, context)).toEqual([
        {
          url: 'https://example.com/ep.mp3?utm_source=feed',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ])
    })
  })
})
