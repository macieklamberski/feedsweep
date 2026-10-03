import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { bunnystreamEmbedResolver, bunnystreamResolveEmbed } from './bunnystream.js'

describe('bunnystreamResolveEmbed', () => {
  describe('happy paths', () => {
    it('should move the older player onto the current one with autoplay off', () => {
      const value =
        'https://iframe.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false&loop=false&muted=false&preload=true&responsive=true'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false',
        url: 'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the muting from the current player', () => {
      const value =
        'https://player.mediadelivery.net/embed/611228/c1627376-4b93-4d89-b335-552576450ee0?autoplay=false&loop=false&muted=true&preload=true&responsive=true'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '611228/c1627376-4b93-4d89-b335-552576450ee0',
        src: 'https://player.mediadelivery.net/embed/611228/c1627376-4b93-4d89-b335-552576450ee0?autoplay=false',
        url: 'https://player.mediadelivery.net/play/611228/c1627376-4b93-4d89-b335-552576450ee0',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should turn the publisher autoplay off on the direct play page', () => {
      const value =
        'https://iframe.mediadelivery.net/play/54257/cb983aec-cd8d-4c21-a2a5-937a077ad47f?autoplay=true&loop=false&muted=false&preload=true&responsive=true&chromecast=true'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '54257/cb983aec-cd8d-4c21-a2a5-937a077ad47f',
        src: 'https://player.mediadelivery.net/embed/54257/cb983aec-cd8d-4c21-a2a5-937a077ad47f?autoplay=false',
        url: 'https://player.mediadelivery.net/play/54257/cb983aec-cd8d-4c21-a2a5-937a077ad47f',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should read the direct play page on the current host', () => {
      const value =
        'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false',
        url: 'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position as written', () => {
      const value =
        'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?t=1m30s&autoplay=false'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false&t=1m30s',
        url: 'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a route the player does not serve', () => {
      const value =
        'https://iframe.mediadelivery.net/watch/490164/808903b8-30ff-49df-b389-1f2baeef0ea7'

      expect(bunnystreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route under a prefix', () => {
      const value =
        'https://iframe.mediadelivery.net/x/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7'

      expect(bunnystreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the player route followed by another segment', () => {
      const value =
        'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7/extra'

      expect(bunnystreamResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player url naming no video', () => {
      const value = 'https://player.mediadelivery.net/embed/490164'

      expect(bunnystreamResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use the video id as written, even if the player answers an error', () => {
      const value =
        'https://player.mediadelivery.net/embed/490164/808903B8-30FF-49DF-B389-1F2BAEEF0EA7'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903B8-30FF-49DF-B389-1F2BAEEF0EA7',
        src: 'https://player.mediadelivery.net/embed/490164/808903B8-30FF-49DF-B389-1F2BAEEF0EA7?autoplay=false',
        url: 'https://player.mediadelivery.net/play/490164/808903B8-30FF-49DF-B389-1F2BAEEF0EA7',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should drop a tracking parameter', () => {
      const value =
        'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?utm_source=newsletter'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false',
        url: 'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the token pair in the src and leave the page url unset', () => {
      const value =
        'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?token=4e1b0c8a2f7d9e3b5a6c&expires=1767225600'
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false&token=4e1b0c8a2f7d9e3b5a6c&expires=1767225600',
        ratio: '16/9',
      }

      expect(bunnystreamResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('bunnystreamEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, bunnystreamEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform ratio over the carrier box', async () => {
      const value = html`
        <iframe
          src="https://iframe.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false&#038;loop=false&#038;muted=false&#038;preload=true&#038;responsive=true"
          loading="lazy"
          style="border:0;position:absolute;top:0;height:100%;width:100%;"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        src: 'https://player.mediadelivery.net/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7?autoplay=false',
        url: 'https://player.mediadelivery.net/play/490164/808903b8-30ff-49df-b389-1f2baeef0ea7',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the current player iframe', async () => {
      const value = html`
        <iframe
          src="https://player.mediadelivery.net/embed/611228/c1627376-4b93-4d89-b335-552576450ee0?autoplay=false&loop=false&muted=true&preload=true&responsive=true"
          loading="lazy"
          style="border:0;position:absolute;top:0;height:100%;width:100%;"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen;"
          allowfullscreen="true"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'bunnystream',
        id: '611228/c1627376-4b93-4d89-b335-552576450ee0',
        src: 'https://player.mediadelivery.net/embed/611228/c1627376-4b93-4d89-b335-552576450ee0?autoplay=false',
        url: 'https://player.mediadelivery.net/play/611228/c1627376-4b93-4d89-b335-552576450ee0',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the player path', async () => {
      const value =
        '<iframe src="https://evil.test/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://player.mediadelivery.net.evil.test/embed/490164/808903b8-30ff-49df-b389-1f2baeef0ea7"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
