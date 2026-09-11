import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildWmakerEmbeds } from './rebuildWmakerEmbeds.js'

const permalink = 'https://www.hospitalia.fr/Soiree-debat-Softway-Medical_a4183.html'

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
