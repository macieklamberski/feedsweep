import { describe, expect, it } from 'bun:test'
import { composeEmbedUrl, isFlashPlayerUrl } from '../../embeds/wmaker.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildWmakerEmbeds } from './rebuildWmakerEmbeds.js'

const permalink = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html'

describe('isFlashPlayerUrl', () => {
  it('should accept the player path holding a sha1', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba'

    expect(isFlashPlayerUrl(value)).toBe(true)
  })

  it('should accept a player url carrying a query', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba?autoplay=1'

    expect(isFlashPlayerUrl(value)).toBe(true)
  })

  it('should accept a player url carrying a fragment', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba#autoplay'

    expect(isFlashPlayerUrl(value)).toBe(true)
  })

  it('should refuse a sha1 that is the wrong length', () => {
    const value = 'https://www.hospitalia.fr/v/633ed090acc56dbee0'

    expect(isFlashPlayerUrl(value)).toBe(false)
  })

  it('should refuse forty characters that span two segments', () => {
    const value = 'https://example.com/v/633ed090acc56dbee0ae/06de3d69c00e8757bba'

    expect(isFlashPlayerUrl(value)).toBe(false)
  })

  it('should refuse a Flash url that is not a WMaker player', () => {
    const value = 'https://example.com/player/movie.swf'

    expect(isFlashPlayerUrl(value)).toBe(false)
  })

  it('should refuse a missing url', () => {
    expect(isFlashPlayerUrl(undefined)).toBe(false)
  })
})

describe('composeEmbedUrl', () => {
  it('should mint the embed route from the article id in the permalink', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should read the article id from a permalink carrying a query', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html?xtor=RSS-1'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should read the article id from a permalink carrying a fragment', () => {
    const value = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html#xtor=RSS-1'

    expect(composeEmbedUrl(value)).toBe('https://www.hospitalia.fr/embed/4183/')
  })

  it('should return undefined for a permalink stating no article id', () => {
    const value = 'https://www.hospitalia.fr/index.html'

    expect(composeEmbedUrl(value)).toBeUndefined()
  })

  // The embed route lives on the publisher's own origin, which a relative permalink does not name.
  it('should return undefined for a relative permalink', () => {
    const value = '/Soiree-debat-Softway-Medical_a4183.html'

    expect(composeEmbedUrl(value)).toBeUndefined()
  })

  it('should return undefined when there is no permalink', () => {
    expect(composeEmbedUrl(undefined)).toBeUndefined()
  })
})

describeForEachParser('rebuildWmakerEmbeds', (parseHtml) => {
  // Two spellings of one layer: a default-parameter version cannot express "no permalink at all",
  // because passing undefined falls back to the default and tests the wrong branch.
  const transformWith = (value: string, baseUrl: string | undefined) => {
    return applyDomTransforms(parseHtml(value), [rebuildWmakerEmbeds({ ...baseContext, baseUrl })])
  }
  const transform = (value: string) => transformWith(value, permalink)

  describe('happy paths', () => {
    it('should repair the dead player onto the article embed route', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba"
          width="608"
          height="372"
        >
          <param name="movie" value="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba">
        </object>
      `
      const expected =
        '<iframe src="https://www.hospitalia.fr/embed/4183/" width="608" height="372"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should take the origin from the permalink rather than from the path it sits on', async () => {
      const value =
        '<object data="https://www.ccmag.fr/v/751de3d3566cb8441f72eebcbc8b939bbdfaad79"></object>'
      const expected = '<iframe src="https://www.ccmag.fr/embed/391/"></iframe>'

      expect(
        await transformWith(value, 'https://www.ccmag.fr/section/Me-and-My-Captain_a391.html'),
      ).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a Flash object that is not a WMaker player', async () => {
      const value =
        '<object type="application/x-shockwave-flash" data="https://example.com/player/movie.swf"></object>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave the carrier when the permalink states no article id', async () => {
      const value =
        '<object data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba"></object>'

      expect(await transformWith(value, 'https://www.hospitalia.fr/index.html')).toEqualHtml(value)
    })

    it('should leave the carrier when there is no permalink at all', async () => {
      const value =
        '<object data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba"></object>'

      expect(await transformWith(value, undefined)).toEqualHtml(value)
    })
  })

  describe('an item carrying more than one player', () => {
    // The embed route addresses the article and serves one video for it, so repairing each object
    // would show that one video several times and lose the others. Left alone deliberately: this
    // pins the decision so it does not read as an oversight.
    it('should leave every object when the item carries two', async () => {
      const value = html`
        <object data="https://www.chevenement.fr/v/18b48747925cb4bfb6724ad22cee54bcbf62854c"></object>
        <object data="https://www.chevenement.fr/v/00266a5a3ad268199c4be738478536b66d91a857"></object>
      `

      expect(
        await transformWith(
          value,
          'https://www.chevenement.fr/Halte-au-Hollande-bashing-_a1485.html',
        ),
      ).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should reject a sha1 that is the wrong length', async () => {
      const value = '<object data="https://www.hospitalia.fr/v/633ed090acc56dbee0"></object>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should repair a player whose url carries a query', async () => {
      const value =
        '<object data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba?autoplay=1"></object>'
      const expected = '<iframe src="https://www.hospitalia.fr/embed/4183/"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A zero reserves no space, so it is not a box the publisher declared.
    it('should not carry a zero dimension onto the player', async () => {
      const value = html`
        <object
          data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba"
          width="0"
          height="372"
        ></object>
      `
      const expected = '<iframe src="https://www.hospitalia.fr/embed/4183/" height="372"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should be idempotent', async () => {
    const value =
      '<object data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba" width="608" height="372"></object>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('dead WMaker players the pipeline repairs into an embed', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: permalink })
  }

  it('should turn the repaired player into an embed placeholder', async () => {
    const value = html`
      <object
        type="application/x-shockwave-flash"
        data="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba"
        width="608"
        height="372"
      >
        <param name="movie" value="https://www.hospitalia.fr/v/633ed090acc56dbee0aea06de3d69c00e8757bba">
      </object>
    `
    const expected = html`
      <div
        data-embed-height="372"
        data-embed-width="608"
        data-embed-src="https://www.hospitalia.fr/embed/4183/"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
