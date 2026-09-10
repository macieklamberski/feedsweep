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
      const expected = ['https://example.com/cover.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // A feed listing one picture as both a native enclosure and a media:content can spell the
    // two differently, and the fingerprint that collapses them only compares hosts and paths.
    it('should collapse two urls that differ only by a missing scheme', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg', type: 'image/jpeg' },
        { url: '//example.com/cover.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/cover.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should collapse a WordPress -WxH variant to the full-res original', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/uploads/photo.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/uploads/photo-800x450.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/uploads/photo.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should keep the larger of two sized variants', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg?w=300', type: 'image/jpeg' },
        { url: 'https://example.com/cover.jpg?w=900', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/cover.jpg?w=900']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should keep the higher-ranked size keyword when neither url encodes a size', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/large.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/photos/sunset/large.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // Order is what the ranking replaces, so the smaller keyword arriving first has to lose too.
    it('should keep the higher-ranked size keyword when the smaller one comes first', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/large.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/photos/sunset/large.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // "preview" is a thumbnail on one host and the full image on another, so it ranks 0 and
    // cannot decide: the first enclosure stays, as it did before any keyword was read.
    it('should keep the first variant when one size keyword is unrankable', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/preview.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset/small.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/photos/sunset/preview.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // The size keyword is read off the path, so a segment naming a member every object inherits
    // reaches that table too. Read as a rank it outranks nothing and decides nothing, which
    // leaves the no-query url to settle the pair, exactly as the unknown segment below does.
    it('should let no size keyword decide when a segment names an inherited member', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/constructor/small.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/photos/constructor', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/photos/constructor']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should let no size keyword decide when a segment is one nothing ranks', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/photos/sunset/small.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/photos/sunset', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/photos/sunset']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should prefer the no-query url when colliding variants have no size to compare', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/cover.jpg?v=2', type: 'image/jpeg' },
        { url: 'https://example.com/cover.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/cover.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should keep distinct images that differ by path', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/a/photo.jpg', type: 'image/jpeg' },
        { url: 'https://example.com/b/photo.jpg', type: 'image/jpeg' },
      ]
      const expected = ['https://example.com/a/photo.jpg', 'https://example.com/b/photo.jpg']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })
  })

  describe('media groups', () => {
    it('should pick the rendition the group flags as default', () => {
      const enclosures: Array<Enclosure> = [
        {
          url: 'https://example.com/clip-360.mp4',
          type: 'video/mp4',
          width: 640,
          height: 360,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/clip-720.mp4',
          type: 'video/mp4',
          width: 1280,
          height: 720,
          isDefault: true,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          width: 1920,
          height: 1080,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/clip-720.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should pick the largest rendition of a group without a default', () => {
      const enclosures: Array<Enclosure> = [
        {
          url: 'https://example.com/clip-360.mp4',
          type: 'video/mp4',
          width: 640,
          height: 360,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          width: 1920,
          height: 1080,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/clip-720.mp4',
          type: 'video/mp4',
          width: 1280,
          height: 720,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/clip-1080.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // A talk shipped at four sizes of one mp4 states no dimensions at all, so area ties at zero
    // for every rendition and the first listed is the smallest copy.
    it('should pick the largest file when the renditions state no size', () => {
      const enclosures: Array<Enclosure> = [
        {
          url: 'https://example.com/talk-64k.mp4',
          type: 'video/mp4',
          length: 8161944,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/talk-450k.mp4',
          type: 'video/mp4',
          length: 56289631,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/talk-180k.mp4',
          type: 'video/mp4',
          length: 22631808,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/talk-450k.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // A group holds the video and its poster, and the poster is the bigger picture of the two.
    it('should pick the video over a poster listed first', () => {
      const enclosures: Array<Enclosure> = [
        {
          url: 'https://example.com/poster.jpg',
          medium: 'image',
          width: 1920,
          height: 1080,
          groupIndex: 0,
        },
        {
          url: 'https://example.com/clip.mp4',
          type: 'video/mp4',
          width: 640,
          height: 360,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/clip.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should pick the audio over an image in a group that carries no video', () => {
      const enclosures: Array<Enclosure> = [
        {
          url: 'https://example.com/cover.jpg',
          medium: 'image',
          width: 1400,
          height: 1400,
          groupIndex: 0,
        },
        { url: 'https://example.com/episode.mp3', type: 'audio/mpeg', groupIndex: 0 },
      ]
      const expected = ['https://example.com/episode.mp3']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    // A stream manifest names no medium and no media type, so nothing about it says it plays.
    it('should pick the video over a manifest listed first', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/clip.m3u8', type: 'application/x-mpegurl', groupIndex: 0 },
        { url: 'https://example.com/clip.mp4', type: 'video/mp4', groupIndex: 0 },
      ]
      const expected = ['https://example.com/clip.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should leave an enclosure with no url beside a group alone', () => {
      const enclosures: Array<Enclosure> = [
        { type: 'audio/mpeg' },
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4', height: 720, groupIndex: 0 },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          height: 1080,
          isDefault: true,
          groupIndex: 0,
        },
      ]
      const expected = [undefined, 'https://example.com/clip-1080.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should fold an ungrouped enclosure naming a group member into the group', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4' },
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4', height: 720, groupIndex: 0 },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          height: 1080,
          isDefault: true,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/clip-1080.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should fold an ungrouped enclosure listed after its group member', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4', height: 720, groupIndex: 0 },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          height: 1080,
          isDefault: true,
          groupIndex: 0,
        },
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4' },
      ]
      const expected = ['https://example.com/clip-1080.mp4']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should fold on the cleaned url', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/clip-720.mp4?utm_source=feed', type: 'video/mp4' },
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4', height: 720, groupIndex: 0 },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          height: 1080,
          isDefault: true,
          groupIndex: 0,
        },
      ]
      const context: TransformContext = {
        ...baseContext,
        cleanUrlFn: (url) => url.split('?')[0],
      }
      const expected = ['https://example.com/clip-1080.mp4']

      expect(prepareUrls(enclosures, context)).toEqual(expected)
    })

    it('should drop a group whose renditions have no url', () => {
      const enclosures: Array<Enclosure> = [
        { type: 'video/mp4', height: 720, groupIndex: 0 },
        { type: 'video/mp4', height: 1080, isDefault: true, groupIndex: 0 },
      ]
      const expected: Array<Enclosure> = []

      expect(prepare(enclosures)).toEqual(expected)
    })

    it('should keep a group where its first rendition stood', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://example.com/clip-720.mp4', type: 'video/mp4', height: 720, groupIndex: 0 },
        { url: 'https://example.com/episode.mp3', type: 'audio/mpeg' },
        {
          url: 'https://example.com/clip-1080.mp4',
          type: 'video/mp4',
          height: 1080,
          groupIndex: 0,
        },
      ]
      const expected = ['https://example.com/clip-720.mp4', 'https://example.com/episode.mp3']

      expect(prepareUrls(enclosures)).toEqual(expected)
    })
  })

  describe('player pages', () => {
    it('should merge a player page with its media file into one enclosure', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]
      const expected = [
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ]

      expect(prepare(enclosures)).toEqual(expected)
    })

    it('should fill missing display size from the player page and keep the file metadata', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/embed?file=https://example.com/ep.mp3', height: 165 },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg', duration: 843 },
      ]
      const expected = [
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          duration: 843,
          height: 165,
          playerUrl: 'https://player.example.com/embed?file=https://example.com/ep.mp3',
        },
      ]

      expect(prepare(enclosures)).toEqual(expected)
    })

    it('should not merge a file entry into a player page with a different nested url', () => {
      const enclosures: Array<Enclosure> = [
        { url: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fother.mp3' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]
      const expected = [
        'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fother.mp3',
        'https://example.com/ep.mp3',
      ]

      expect(prepareUrls(enclosures)).toEqual(expected)
    })

    it('should parse a playerEmbed enclosure and merge it with its media file', () => {
      const enclosures: Array<Enclosure> = [
        {
          playerEmbed:
            '<iframe src="https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3&amp;modern=1" scrolling="no" width="100%" height="165"></iframe>',
        },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]
      const expected = [
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          height: 165,
          playerUrl:
            'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3&modern=1',
        },
      ]

      expect(prepare(enclosures)).toEqual(expected)
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
      const expected = [
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ]

      expect(prepare(enclosures)).toEqual(expected)
    })

    it('should drop a playerEmbed enclosure without an iframe src', () => {
      const enclosures: Array<Enclosure> = [
        { playerEmbed: '<p>player</p>' },
        { url: 'https://example.com/ep.mp3', type: 'audio/mpeg' },
      ]
      const expected = [
        {},
        {
          url: 'https://example.com/ep.mp3',
          type: 'audio/mpeg',
        },
      ]

      expect(prepare(enclosures)).toEqual(expected)
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
      const expected = [
        {
          url: 'https://example.com/ep.mp3?utm_source=feed',
          type: 'audio/mpeg',
          playerUrl: 'https://player.example.com/?media_url=https%3A%2F%2Fexample.com%2Fep.mp3',
        },
      ]

      expect(prepare(enclosures, context)).toEqual(expected)
    })
  })
})
