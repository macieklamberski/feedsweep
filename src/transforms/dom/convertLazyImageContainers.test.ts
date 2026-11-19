import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertLazyImageContainers } from './convertLazyImageContainers.js'

describeForEachParser('convertLazyImageContainers', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [convertLazyImageContainers(context)])
  }

  it('should convert a media-less div carrying an image-shaped lazy src into an img', async () => {
    const value = '<div class="cesis_gallery_img" data-src="https://example.com/photo.jpg"></div>'
    const expected = '<img src="https://example.com/photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should convert a figure container the same way', async () => {
    const value = '<figure data-lazy-src="https://example.com/photo.png"></figure>'
    const expected = '<img src="https://example.com/photo.png">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prepend the img to a div that holds content and keep that content', async () => {
    const value = html`
      <div data-src="https://example.com/bg.jpg">
        <p>Important text</p>
      </div>
    `
    const expected = html`
      <div data-src="https://example.com/bg.jpg">
        <img src="https://example.com/bg.jpg">
        <p>Important text</p>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the figcaption of a figure container', async () => {
    const value = html`
      <figure data-src="https://example.com/photo.jpg">
        <figcaption>Caption</figcaption>
      </figure>
    `
    const expected = html`
      <figure data-src="https://example.com/photo.jpg">
        <img src="https://example.com/photo.jpg">
        <figcaption>Caption</figcaption>
      </figure>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep bare text inside the container', async () => {
    const value = html`
      <div data-src="https://example.com/photo.jpg">
        Caption
      </div>
    `
    const expected = html`
      <div data-src="https://example.com/photo.jpg">
        <img src="https://example.com/photo.jpg">
        Caption
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a textless child element inside the container', async () => {
    const value = html`
      <div data-src="https://example.com/photo.jpg">
        <a href="https://example.com/photo-large.jpg"></a>
      </div>
    `
    const expected = html`
      <div data-src="https://example.com/photo.jpg">
        <img src="https://example.com/photo.jpg">
        <a href="https://example.com/photo-large.jpg"></a>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a container that holds only whitespace', async () => {
    const value = '<div data-src="https://example.com/photo.jpg">\n  </div>'
    const expected = '<img src="https://example.com/photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an image-shaped src with a query string', async () => {
    const value = '<div data-src="https://example.com/photo.jpg?w=600"></div>'
    const expected = '<img src="https://example.com/photo.jpg?w=600">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a div that already wraps an image', async () => {
    const value = html`
      <div data-src="https://example.com/photo.jpg">
        <img src="https://example.com/real.jpg">
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a wrapper around a lazy video iframe', async () => {
    const value = html`
      <div data-src="https://example.com/x.jpg">
        <iframe src="about:blank"></iframe>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not convert a non-image lazy src like an AJAX content URL', async () => {
    const value = '<div data-src="https://example.com/load-more.html"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not touch a div without a lazy attribute', async () => {
    const value = '<div class="text">Some text</div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should ignore a flag-style value that is not an image URL', async () => {
    const value = '<div data-src="true"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  describe('ShopPad Blog Studio slider module', () => {
    it('should convert each painted slide into an image in slide order', async () => {
      const value = html`
        <div id="pvmlhxq" class="slider-on-box" style="width:100%;height:100%;display:none;">
          <div class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/6192334d4df0777ab5e4cff97e03e6cc.jpg');position:relative;"></div>
          <div class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/9a9dcdb3c4d0c62abe2b6dd8a95ba740.jpg');position:relative;"></div>
        </div>
      `
      const expected = html`
        <div id="pvmlhxq" class="slider-on-box" style="width:100%;height:100%;display:none;">
          <img src="https://blogstudio.example.com/shop/6192334d4df0777ab5e4cff97e03e6cc.jpg">
          <img src="https://blogstudio.example.com/shop/9a9dcdb3c4d0c62abe2b6dd8a95ba740.jpg">
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('ShopPad Blog Studio ImageSlider component', () => {
    it('should convert each painted slide into an image', async () => {
      const value = html`
        <div class="slider-on-content">
          <div data-aspect-ratio="3:2" class="is-boxes slider-image" style="background-image:url(https://blogstudio.example.com/shop/c164d4460b113347fe50560894ff92c0.jpeg);"></div>
        </div>
      `
      const expected = html`
        <div class="slider-on-content">
          <img src="https://blogstudio.example.com/shop/c164d4460b113347fe50560894ff92c0.jpeg">
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should put the image of a linked slide inside its link', async () => {
      const value = html`
        <div class="slider-on-content">
          <a href="https://example.org/" data-aspect-ratio="3:2" class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/0cc235103320faf06c926b5a22af3dcf.png');"> </a>
        </div>
      `
      const expected = html`
        <div class="slider-on-content">
          <a href="https://example.org/" data-aspect-ratio="3:2" class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/0cc235103320faf06c926b5a22af3dcf.png');"><img src="https://blogstudio.example.com/shop/0cc235103320faf06c926b5a22af3dcf.png"> </a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a slide with no background image', async () => {
      const value = html`
        <div class="slider-on-content">
          <div class="is-boxes slider-image" style="position:relative;"></div>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should leave a painted slide class outside a ShopPad slider', async () => {
    const value = html`
      <div class="carousel">
        <div class="slider-image" style="background-image: url('https://example.com/photo.jpg');"></div>
      </div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave an empty painted div that is not a slide', async () => {
    const value = '<div style="background-image: url(\'https://example.com/cover.jpg\');"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<div data-src="https://example.com/photo.jpg"></div>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })

  it('should be idempotent on a container that holds content', async () => {
    const value = html`
      <div data-src="https://example.com/photo.jpg">
        <p>Text</p>
      </div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })

  it('should be idempotent on a linked slide', async () => {
    const value = html`
      <div class="slider-on-content">
        <a href="https://example.org/" class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/0cc235103320faf06c926b5a22af3dcf.png');"> </a>
      </div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('convertLazyImageContainers through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn a gallery container into an image', async () => {
    const value = '<div class="cesis_gallery_img" data-src="https://example.com/photo.jpg"></div>'
    const expected = '<img src="https://example.com/photo.jpg">'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the slides of a hidden ShopPad slider', async () => {
    const value = html`
      <div class="slider-on-box" style="width:100%;height:100%;display:none;">
        <div class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/6192334d4df0777ab5e4cff97e03e6cc.jpg');position:relative;"></div>
        <div class="is-boxes slider-image" style="background-image: url('https://blogstudio.example.com/shop/9a9dcdb3c4d0c62abe2b6dd8a95ba740.jpg');position:relative;"></div>
      </div>
    `
    const expected = html`
      <img src="https://blogstudio.example.com/shop/6192334d4df0777ab5e4cff97e03e6cc.jpg">
      <img src="https://blogstudio.example.com/shop/9a9dcdb3c4d0c62abe2b6dd8a95ba740.jpg">
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
