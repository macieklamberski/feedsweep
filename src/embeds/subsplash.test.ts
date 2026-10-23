import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { subsplashEmbedResolver, subsplashResolveEmbed } from './subsplash.js'

describe('subsplashResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the player without the display options', () => {
      const value =
        'https://subsplash.com/u/pastorallenjackson/media/embed/d/67wnjbx?info=0&logoWatermark=0&shareable=0'
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: '67wnjbx',
        src: 'https://subsplash.com/u/pastorallenjackson/media/embed/d/67wnjbx',
        url: 'https://subspla.sh/67wnjbx',
        ratio: '16/9',
      }

      expect(subsplashResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the audio layout flag the player ignores', () => {
      const value = 'https://subsplash.com/u/-BNBD8V/media/embed/d/ypdt5h2?video=0&logoWatermark=0'
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: 'ypdt5h2',
        src: 'https://subsplash.com/u/-BNBD8V/media/embed/d/ypdt5h2',
        url: 'https://subspla.sh/ypdt5h2',
        ratio: '16/9',
      }

      expect(subsplashResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position', () => {
      const value = 'https://subsplash.com/u/cbcponca/media/embed/d/zrgcjnm?t=120&utm_source=feed'
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: 'zrgcjnm',
        src: 'https://subsplash.com/u/cbcponca/media/embed/d/zrgcjnm?t=120',
        url: 'https://subspla.sh/zrgcjnm',
        ratio: '16/9',
      }

      expect(subsplashResolveEmbed(value)).toEqual(expected)
    })

    it('should fold the case of the short code in the key only', () => {
      const value = 'https://subsplash.com/u/-677XD4/media/embed/d/9XVBXMG?'
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: '9xvbxmg',
        src: 'https://subsplash.com/u/-677XD4/media/embed/d/9XVBXMG',
        url: 'https://subspla.sh/9xvbxmg',
        ratio: '16/9',
      }

      expect(subsplashResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the older app route and key it by the short code', () => {
      const value =
        'https://subsplash.com/+754a/embed/mi/+r58c2x5?audio&info&embeddable&shareable&logo_watermark'
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: 'r58c2x5',
        src: 'https://subsplash.com/+754a/embed/mi/+r58c2x5',
        url: 'https://subspla.sh/r58c2x5',
        ratio: '16/9',
      }

      expect(subsplashResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/u/cbcponca/media/embed/d/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a leading segment', () => {
      const value = 'https://subsplash.com/x/u/cbcponca/media/embed/d/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a path with a trailing segment', () => {
      const value = 'https://subsplash.com/u/cbcponca/media/embed/d/zrgcjnm/extra'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a media path under another first route word', () => {
      const value = 'https://subsplash.com/x/cbcponca/media/embed/d/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed path under another section', () => {
      const value = 'https://subsplash.com/u/cbcponca/x/embed/d/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a media path that is not an embed', () => {
      const value = 'https://subsplash.com/u/cbcponca/media/x/d/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an embed of another kind than a media item', () => {
      const value = 'https://subsplash.com/u/cbcponca/media/embed/x/zrgcjnm'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the giving form', () => {
      const value = 'https://subsplash.com/u/cbcponca/give?embed=true'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an older route whose app key has no plus sign', () => {
      const value = 'https://subsplash.com/754a/embed/mi/+r58c2x5?audio'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the lightbox, which opens the media page', () => {
      const value = 'https://subsplash.com/+754a/lb/mi/+r58c2x5?autoplay=true'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an older embed of another kind than a media item', () => {
      const value = 'https://subsplash.com/+754a/embed/x/+r58c2x5?audio'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a file on the media CDN', () => {
      const value =
        'https://cdn.subsplash.com/audios/BNBD8V/2dc8100c-528c-4108-97b0-7959cd2e2da9/audio.mp3'

      expect(subsplashResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('subsplashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, subsplashEmbedResolver)

  describe('happy paths', () => {
    it('should claim the iframe the embed dialog writes', async () => {
      const value = html`
        <iframe
          src="https://subsplash.com/u/cbcponca/media/embed/d/zrgcjnm"
          frameborder="0"
          webkitallowfullscreen
          mozallowfullscreen
          allowfullscreen
          allow="clipboard-read; clipboard-write"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'subsplash',
        id: 'zrgcjnm',
        src: 'https://subsplash.com/u/cbcponca/media/embed/d/zrgcjnm',
        url: 'https://subspla.sh/zrgcjnm',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/u/cbcponca/media/embed/d/zrgcjnm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('subsplash player through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should state the player ratio over the declared box', async () => {
    const value = html`
      <iframe
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        src="https://subsplash.com/+754a/embed/mi/+r58c2x5?audio&#38;info&#38;embeddable&#38;shareable&#38;logo_watermark"
        frameborder="0"
        allowfullscreen="allowfullscreen"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://subspla.sh/r58c2x5"
        data-embed-id="r58c2x5"
        data-embed-provider="subsplash"
        data-embed-src="https://subsplash.com/+754a/embed/mi/+r58c2x5"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a subsplash audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://cdn.subsplash.com/audios/BNBD8V/2dc8100c-528c-4108-97b0-7959cd2e2da9/audio.mp3',
        type: 'audio/mpeg',
      },
    ]
    const expected = html`
      <audio data-enclosure="" controls src="https://cdn.subsplash.com/audios/BNBD8V/2dc8100c-528c-4108-97b0-7959cd2e2da9/audio.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
