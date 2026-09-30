import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googleslidesEmbedResolver, googleslidesResolveEmbed } from './googleslides.js'

describe('googleslidesResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the slideshow settings of a published deck frame and drop its autoplay', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?start=true&loop=true&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?loop=true&delayms=3000',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a published deck on /embed when the carrier names /pubembed', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pubembed?start=false&loop=false&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?loop=false&delayms=3000',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a published deck on /embed when the carrier names its /pub page', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub?start=false'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the fragment of a deck frame', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed#slide=id.p5'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed#slide=id.p5',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should resolve a deck framed by its file id', () => {
      const value =
        'https://docs.google.com/presentation/d/1OZRGyfKsSRX84MBi3LYPUkLkArsvevJV52Hm6zTd-9s/embed?start=false&loop=false&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1OZRGyfKsSRX84MBi3LYPUkLkArsvevJV52Hm6zTd-9s',
        src: 'https://docs.google.com/presentation/d/1OZRGyfKsSRX84MBi3LYPUkLkArsvevJV52Hm6zTd-9s/embed?loop=false&delayms=3000',
        url: 'https://docs.google.com/presentation/d/1OZRGyfKsSRX84MBi3LYPUkLkArsvevJV52Hm6zTd-9s/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a deck on /embed and drop the share tracker when the carrier names its /edit page', () => {
      const value =
        'https://docs.google.com/presentation/d/1GouoBUQy3gu2gK8RHe3mOJNf6VsuEVyahHSDDGyUQXM/edit?usp=sharing'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1GouoBUQy3gu2gK8RHe3mOJNf6VsuEVyahHSDDGyUQXM',
        src: 'https://docs.google.com/presentation/d/1GouoBUQy3gu2gK8RHe3mOJNf6VsuEVyahHSDDGyUQXM/embed',
        url: 'https://docs.google.com/presentation/d/1GouoBUQy3gu2gK8RHe3mOJNf6VsuEVyahHSDDGyUQXM/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a deck on /embed when the carrier names its /preview page', () => {
      const value =
        'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/preview'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE',
        src: 'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/embed',
        url: 'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a deck on /embed when the carrier names no route after the id', () => {
      const value =
        'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE',
        src: 'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/embed',
        url: 'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start slide of a deck frame', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?slide=id.p5'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?slide=id.p5',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the legacy frame that names the file id in its query onto the current player', () => {
      const value =
        'https://docs.google.com/presentation/embed?id=1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk&start=false&loop=false&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk',
        src: 'https://docs.google.com/presentation/d/1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk/embed?loop=false&delayms=3000',
        url: 'https://docs.google.com/presentation/d/1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a deck exported as a pdf', () => {
      const value =
        'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/export/pdf'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a published deck on a route that is not a page', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/export'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deck route with a foreign word before the id', () => {
      const value =
        'https://docs.google.com/presentation/x/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a form on the same host', () => {
      const value = 'https://docs.google.com/forms/d/e/1FAIpQLSfQq3/viewform?embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a document on the same host', () => {
      const value = 'https://docs.google.com/document/d/e/2PACX-1vT/pub?embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet on the same host', () => {
      const value = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT/pubhtml'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the pdf viewer on the same host', () => {
      const value =
        'https://docs.google.com/viewer?url=https%3A%2F%2Fexample.com%2Fa.pdf&embedded=true'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed published id as written, even if the player answers an error', () => {
      const value = 'https://docs.google.com/presentation/d/e/2PACX-1v%2F..%2Fx/embed'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1v%2F..%2Fx',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1v%2F..%2Fx/embed',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1v%2F..%2Fx/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed legacy file id as written, even if the player answers an error', () => {
      const value = 'https://docs.google.com/presentation/embed?id=../../document/d/x'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '../../document/d/x',
        src: 'https://docs.google.com/presentation/d/..%2F..%2Fdocument%2Fd%2Fx/embed',
        url: 'https://docs.google.com/presentation/d/..%2F..%2Fdocument%2Fd%2Fx/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed legacy file id carrying an encoded slash as written, even if the player answers an error', () => {
      const value =
        'https://docs.google.com/presentation/embed?id=1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk%2Fx'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk/x',
        src: 'https://docs.google.com/presentation/d/1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk%2Fx/embed',
        url: 'https://docs.google.com/presentation/d/1iIAxMLjeBLU436Mgy2owelpY9m8ZhwUd3u_2iVB27Kk%2Fx/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the Workspace domain prefix', () => {
    it('should frame a published deck behind a Workspace prefix on its own path', () => {
      const value =
        'https://docs.google.com/a/redhat.com/presentation/d/e/2PACX-1vQEcK-_l5PvQtIMVBRj1_2TU3M52F44esHEVSVfDvYVcvfsDFk9JsY6mvGgPgPp5nfCDw2RwMg8s231/embed?start=false&loop=false&delayms=3000'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vQEcK-_l5PvQtIMVBRj1_2TU3M52F44esHEVSVfDvYVcvfsDFk9JsY6mvGgPgPp5nfCDw2RwMg8s231',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vQEcK-_l5PvQtIMVBRj1_2TU3M52F44esHEVSVfDvYVcvfsDFk9JsY6mvGgPgPp5nfCDw2RwMg8s231/embed?loop=false&delayms=3000',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vQEcK-_l5PvQtIMVBRj1_2TU3M52F44esHEVSVfDvYVcvfsDFk9JsY6mvGgPgPp5nfCDw2RwMg8s231/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should frame a deck behind a Workspace prefix on /embed when the carrier names /preview', () => {
      const value =
        'https://docs.google.com/a/cgwerks.net/presentation/d/1elLlCMSHhJP-PbDoML8ytuWr0smzhBiXEfHIOBqnaHk/preview'
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '1elLlCMSHhJP-PbDoML8ytuWr0smzhBiXEfHIOBqnaHk',
        src: 'https://docs.google.com/presentation/d/1elLlCMSHhJP-PbDoML8ytuWr0smzhBiXEfHIOBqnaHk/embed',
        url: 'https://docs.google.com/presentation/d/1elLlCMSHhJP-PbDoML8ytuWr0smzhBiXEfHIOBqnaHk/pub',
      }

      expect(googleslidesResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a deck behind a prefix that is not a Workspace domain', () => {
      const value =
        'https://docs.google.com/x/redhat.com/presentation/d/e/2PACX-1vQEcK-_l5PvQtIMVBRj1_2TU3M52F44esHEVSVfDvYVcvfsDFk9JsY6mvGgPgPp5nfCDw2RwMg8s231/embed'

      expect(googleslidesResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googleslidesEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googleslidesEmbedResolver)

  describe('happy paths', () => {
    it('should take the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?start=true&loop=true&delayms=3000"
          width="1280"
          height="749"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googleslides',
        id: '2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw',
        src: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed?loop=true&delayms=3000',
        url: 'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pub',
        width: 1280,
        height: 749,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <iframe src="https://evil.test/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only an enclosure case reaches the path where claiming a file url would cost the reader the
// download.
describeForEachParser('googleslides through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should leave a deck exported as a pdf downloadable', async () => {
    const enclosures = [
      {
        url: 'https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/export/pdf',
        type: 'application/pdf',
      },
    ]

    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/pdf"
        data-file-name="pdf"
        data-file-url="https://docs.google.com/presentation/d/1k5NXExE8IvVgEIAwhxzwNw93Kt6f8Yqp1K7TuSigXiE/export/pdf"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
