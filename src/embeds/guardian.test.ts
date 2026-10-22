import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { guardianEmbedResolver, guardianResolveEmbed } from './guardian.js'

describe('guardianResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from the player url', () => {
      const value =
        'https://embed.theguardian.com/embed/video/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
        src: 'https://embed.theguardian.com/embed/video/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
        url: 'https://www.theguardian.com/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
        ratio: '16/9',
        date: '2015-06-18',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })

    it('should date the video from a path naming a double-digit month', () => {
      const value =
        'https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-syria-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'world/video/2015/oct/08/ashton-carter-nato-syria-video',
        src: 'https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-syria-video',
        url: 'https://www.theguardian.com/world/video/2015/oct/08/ashton-carter-nato-syria-video',
        ratio: '16/9',
        date: '2015-10-08',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })

    it('should read a hyphenated section and a day in the thirties', () => {
      const value =
        'https://embed.theguardian.com/embed/video/us-news/video/2015/apr/30/freddie-gray-neighbors-baltimore-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'us-news/video/2015/apr/30/freddie-gray-neighbors-baltimore-video',
        src: 'https://embed.theguardian.com/embed/video/us-news/video/2015/apr/30/freddie-gray-neighbors-baltimore-video',
        url: 'https://www.theguardian.com/us-news/video/2015/apr/30/freddie-gray-neighbors-baltimore-video',
        ratio: '16/9',
        date: '2015-04-30',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })

    it('should read a slug carrying digits and a day in the twenties', () => {
      const value =
        'https://embed.theguardian.com/embed/video/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'world/video/2015/sep/21/viola-davis-speech-2015-emmys-video',
        src: 'https://embed.theguardian.com/embed/video/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video',
        url: 'https://www.theguardian.com/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video',
        ratio: '16/9',
        date: '2015-09-21',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The www host serves the same path with `x-frame-options: SAMEORIGIN`, so it frames nothing.
    it('should return undefined for the player path on the www host', () => {
      const value =
        'https://www.theguardian.com/embed/video/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player path below a leading segment', () => {
      const value =
        'https://embed.theguardian.com/x/embed/video/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the player path followed by a trailing segment', () => {
      const value =
        'https://embed.theguardian.com/embed/video/world/video/2015/sep/21/viola-davis-speech-2015-emmys-video/extra'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for the video page itself', () => {
      const value =
        'https://www.theguardian.com/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for an embed path that is not a video', () => {
      const value = 'https://embed.theguardian.com/embed/video/society/2015/jun/18/superbugs'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })

    it('should return undefined for a lookalike host', () => {
      const value =
        'https://embed.theguardian.com.evil.test/embed/video/society/video/2015/jun/18/superbugs-video'

      expect(guardianResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should state no date for a month name outside the twelve', () => {
      const value =
        'https://embed.theguardian.com/embed/video/society/video/2015/jou/18/superbugs-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'society/video/2015/jou/18/superbugs-video',
        src: 'https://embed.theguardian.com/embed/video/society/video/2015/jou/18/superbugs-video',
        url: 'https://www.theguardian.com/society/video/2015/jou/18/superbugs-video',
        ratio: '16/9',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })

    it('should state no date for a day outside the calendar', () => {
      const value =
        'https://embed.theguardian.com/embed/video/society/video/2015/jun/45/superbugs-video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'society/video/2015/jun/45/superbugs-video',
        src: 'https://embed.theguardian.com/embed/video/society/video/2015/jun/45/superbugs-video',
        url: 'https://www.theguardian.com/society/video/2015/jun/45/superbugs-video',
        ratio: '16/9',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed path as written, even if the player answers an error', () => {
      const value =
        'https://embed.theguardian.com/embed/video/Society/video/15/June/1st/superbugs_video'
      const expected: EmbedResolverResult = {
        provider: 'guardian',
        id: 'Society/video/15/June/1st/superbugs_video',
        src: 'https://embed.theguardian.com/embed/video/Society/video/15/June/1st/superbugs_video',
        url: 'https://www.theguardian.com/Society/video/15/June/1st/superbugs_video',
        ratio: '16/9',
      }

      expect(guardianResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('guardianEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, guardianEmbedResolver)

  it('should state the platform size over the box the pasted player iframe states', async () => {
    const value = html`
      <iframe
        src="https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video"
        width="560"
        height="315"
        allowfullscreen="yes"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'guardian',
      id: 'world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      src: 'https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      url: 'https://www.theguardian.com/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      ratio: '16/9',
      date: '2015-10-08',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should state the ratio for an iframe declaring no box', async () => {
    const value = html`
      <iframe
        src="https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video"
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'guardian',
      id: 'world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      src: 'https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      url: 'https://www.theguardian.com/world/video/2015/oct/08/ashton-carter-nato-russian-forces-behaving-unprofessionally-syria-video',
      ratio: '16/9',
      date: '2015-10-08',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should ignore a foreign host carrying the same path', async () => {
    const value =
      '<iframe src="https://evil.test/embed/video/world/video/2015/oct/08/syria-video"></iframe>'

    expect(await extract(value)).toBeUndefined()
  })
})

describeForEachParser('guardianEmbedResolver in any case', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, guardianEmbedResolver)

  it('should write the route word `video` and the month `jun` from the code when the carrier spells them in capitals', async () => {
    const value =
      '<iframe src="https://embed.theguardian.com/EMBED/VIDEO/society/VIDEO/2015/JUN/18/superbugs-la-mrsa-pigs-antibiotics-video"></iframe>'
    const expected = {
      provider: 'guardian',
      id: 'society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
      src: 'https://embed.theguardian.com/embed/video/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
      url: 'https://www.theguardian.com/society/video/2015/jun/18/superbugs-la-mrsa-pigs-antibiotics-video',
      ratio: '16/9',
      date: '2015-06-18',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should keep the section and the slug as written', async () => {
    const value =
      '<iframe src="https://embed.theguardian.com/embed/video/SOCIETY/video/2015/jun/18/Superbugs-LA-MRSA-pigs-antibiotics-video"></iframe>'
    const expected = {
      provider: 'guardian',
      id: 'SOCIETY/video/2015/jun/18/Superbugs-LA-MRSA-pigs-antibiotics-video',
      src: 'https://embed.theguardian.com/embed/video/SOCIETY/video/2015/jun/18/Superbugs-LA-MRSA-pigs-antibiotics-video',
      url: 'https://www.theguardian.com/SOCIETY/video/2015/jun/18/Superbugs-LA-MRSA-pigs-antibiotics-video',
      ratio: '16/9',
      date: '2015-06-18',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should keep a month slot outside the twelve months as written', async () => {
    const value =
      '<iframe src="https://embed.theguardian.com/embed/video/society/video/2015/Constructor/18/superbugs-la-mrsa-pigs-antibiotics-video"></iframe>'
    const expected = {
      provider: 'guardian',
      id: 'society/video/2015/Constructor/18/superbugs-la-mrsa-pigs-antibiotics-video',
      src: 'https://embed.theguardian.com/embed/video/society/video/2015/Constructor/18/superbugs-la-mrsa-pigs-antibiotics-video',
      url: 'https://www.theguardian.com/society/video/2015/Constructor/18/superbugs-la-mrsa-pigs-antibiotics-video',
      ratio: '16/9',
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should write the route word `video` and the month `oct` from the code when the carrier spells them in capitals', async () => {
    const value =
      '<iframe src="https://embed.theguardian.com/EMBED/VIDEO/world/VIDEO/2015/OCT/08/ashton-carter-nato-syria-video"></iframe>'
    const expected = {
      provider: 'guardian',
      id: 'world/video/2015/oct/08/ashton-carter-nato-syria-video',
      src: 'https://embed.theguardian.com/embed/video/world/video/2015/oct/08/ashton-carter-nato-syria-video',
      url: 'https://www.theguardian.com/world/video/2015/oct/08/ashton-carter-nato-syria-video',
      ratio: '16/9',
      date: '2015-10-08',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
