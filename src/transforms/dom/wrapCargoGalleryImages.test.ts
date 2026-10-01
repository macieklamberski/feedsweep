import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { wrapCargoGalleryImages } from './wrapCargoGalleryImages.js'

describeForEachParser('wrapCargoGalleryImages', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [wrapCargoGalleryImages(baseContext)])
  }

  describe('wraps', () => {
    it('should wrap a bare cargo image in a figure', async () => {
      const value = '<img src="https://freight.cargo.site/i/aaa/piece.jpg">'
      const expected = '<figure><img src="https://freight.cargo.site/i/aaa/piece.jpg"></figure>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should wrap each image in its own figure, leaving caption and nav as siblings', async () => {
      const value =
        'Delta<img src="https://freight.cargo.site/i/aaa/1.jpg"><img src="https://freight.cargo.site/i/bbb/2.jpg">PREV NEXT'
      const expected =
        'Delta<figure><img src="https://freight.cargo.site/i/aaa/1.jpg"></figure><figure><img src="https://freight.cargo.site/i/bbb/2.jpg"></figure>PREV NEXT'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should match a data-src cargo image', async () => {
      const value = '<img data-src="https://freight.cargo.site/i/aaa/1.jpg">'
      const expected = '<figure><img data-src="https://freight.cargo.site/i/aaa/1.jpg"></figure>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should wrap the enclosing textless link', async () => {
      const value = html`
        <a href="https://example.com/project">
          <img src="https://freight.cargo.site/i/aaa/1.jpg">
        </a>
      `
      const expected = html`
        <figure>
          <a href="https://example.com/project">
            <img src="https://freight.cargo.site/i/aaa/1.jpg">
          </a>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should wrap only the image when the enclosing link holds text', async () => {
      const value = html`
        <a href="https://example.com/project">
          <img src="https://freight.cargo.site/i/aaa/1.jpg">
          Project
        </a>
      `
      const expected = html`
        <a href="https://example.com/project">
          <figure>
            <img src="https://freight.cargo.site/i/aaa/1.jpg">
          </figure>
          Project
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('leaves untouched', () => {
    it('should leave a non-cargo image', async () => {
      const value = '<img src="https://example.com/1.jpg">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image already inside a figure', async () => {
      const value = '<figure><img src="https://freight.cargo.site/i/aaa/1.jpg"></figure>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside a paragraph', async () => {
      const value = '<p>See <img src="https://freight.cargo.site/i/aaa/1.jpg"> here</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside a figcaption', async () => {
      const value = '<figcaption><img src="https://freight.cargo.site/i/aaa/1.jpg"></figcaption>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h1', async () => {
      const value = '<h1><img src="https://freight.cargo.site/i/aaa/1.jpg"></h1>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h2', async () => {
      const value = '<h2><img src="https://freight.cargo.site/i/aaa/1.jpg"></h2>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h3', async () => {
      const value = '<h3><img src="https://freight.cargo.site/i/aaa/1.jpg"></h3>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h4', async () => {
      const value = '<h4><img src="https://freight.cargo.site/i/aaa/1.jpg"></h4>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h5', async () => {
      const value = '<h5><img src="https://freight.cargo.site/i/aaa/1.jpg"></h5>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a cargo image inside an h6', async () => {
      const value = '<h6><img src="https://freight.cargo.site/i/aaa/1.jpg"></h6>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value =
      'Delta<img src="https://freight.cargo.site/i/aaa/1.jpg"><img src="https://freight.cargo.site/i/bbb/2.jpg">'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('wrapCargoGalleryImages in the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the caption and nav out of the images before bare inline wrapping', async () => {
    const value =
      'Delta<img src="https://freight.cargo.site/i/aaa/1.jpg"><img src="https://freight.cargo.site/i/bbb/2.jpg">PREV NEXT'
    const expected =
      '<p>Delta</p><figure><img src="https://freight.cargo.site/i/aaa/1.jpg"></figure><figure><img src="https://freight.cargo.site/i/bbb/2.jpg"></figure><p>PREV NEXT</p>'

    expect(await convert(value)).toBe(expected)
  })
})
