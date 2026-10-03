import { describe, expect, it } from 'bun:test'
import { defaultLazySrcAttributes, defaultLazySrcsetAttributes } from '../../defaults.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { fixLazyImages } from './fixLazyImages.js'
import { flattenPictureElements } from './flattenPictureElements.js'

describeForEachParser('fixLazyImages', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [fixLazyImages(context)])
  }

  // Iterates the real default list, so every entry is exercised and a new entry
  // is covered automatically.
  it.each(defaultLazySrcAttributes)('should promote %s into src', async (attribute) => {
    const value = `<img ${attribute}="photo.jpg">`
    const expected = `<img ${attribute}="photo.jpg" src="photo.jpg">`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the original lazy attribute after promoting', async () => {
    const value = '<img data-src="photo.jpg">'
    const expected = '<img data-src="photo.jpg" src="photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should extract image from noscript when sibling is lazy placeholder', async () => {
    const value = html`
      <img data-src="real.jpg">
      <noscript>
        <img src="real.jpg">
      </noscript>
    `
    const expected = '<img src="real.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should normalize attribute case on images extracted from noscript', async () => {
    const value = html`
      <img data-src="real.jpg">
      <noscript>
        <IMG SRC="real.jpg">
      </noscript>
    `
    const expected = '<img src="real.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should extract image from noscript when sibling has only a data: placeholder', async () => {
    const value = html`
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
      <noscript>
        <img src="real.jpg">
      </noscript>
    `
    const expected = '<img src="real.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should extract image from noscript when it holds another size of the sibling image', async () => {
    const value = html`
      <img data-src="https://example.com/photo-300x200.jpg">
      <noscript>
        <img src="https://example.com/photo.jpg">
      </noscript>
    `
    const expected = '<img src="https://example.com/photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should not extract noscript when it holds a different image than the sibling', async () => {
    const value = html`
      <img src="https://example.com/photo.jpg">
      <noscript>
        <img
          src="https://example.com/pixel.gif"
          width="1"
          height="1"
        >
      </noscript>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not extract noscript when a lazy sibling names a different image', async () => {
    const value = html`
      <img data-src="https://example.com/photo.jpg">
      <noscript>
        <img src="https://example.com/pixel.gif">
      </noscript>
    `
    const expected = html`
      <img
        data-src="https://example.com/photo.jpg"
        src="https://example.com/photo.jpg"
      >
      <noscript>
        <img src="https://example.com/pixel.gif">
      </noscript>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should not extract noscript when a srcset-only sibling names a different image', async () => {
    const value = html`
      <img srcset="https://example.com/photo-640.jpg 640w, https://example.com/photo-1280.jpg 1280w">
      <noscript>
        <img src="https://example.com/pixel.gif">
      </noscript>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not extract noscript when sibling is not an image', async () => {
    const value = html`
      <div>text</div>
      <noscript>
        <img src="real.jpg">
      </noscript>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not extract noscript when it is the first child with no preceding sibling', async () => {
    const value = '<noscript><img src="real.jpg"></noscript>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should not modify images without lazy attributes', async () => {
    const value = '<img src="already-loaded.jpg" alt="photo">'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should move both data-src and data-srcset on same image', async () => {
    const value = '<img data-src="photo.jpg" data-srcset="small.jpg 300w, large.jpg 600w">'
    const expected = html`
      <img
        data-src="photo.jpg"
        data-srcset="small.jpg 300w, large.jpg 600w"
        src="photo.jpg"
        srcset="small.jpg 300w, large.jpg 600w"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prefer data-src over data-original when both present', async () => {
    const value = '<img data-src="preferred.jpg" data-original="fallback.jpg">'
    const expected = html`
      <img
        data-src="preferred.jpg"
        data-original="fallback.jpg"
        src="preferred.jpg"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prefer data-orig-file over data-large-file when both present', async () => {
    const value = '<img data-orig-file="orig.jpg" data-large-file="large.jpg">'
    const expected = html`
      <img
        data-orig-file="orig.jpg"
        data-large-file="large.jpg"
        src="orig.jpg"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prefer data-src over data-image when both present', async () => {
    const value = '<img data-src="real.jpg" data-image="fallback.jpg">'
    const expected = html`
      <img
        data-src="real.jpg"
        data-image="fallback.jpg"
        src="real.jpg"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  describe('URL-shape guard', () => {
    it('should not promote a non-URL value like "left"', async () => {
      const value = '<img data-orig="left">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not promote a numeric flag value like "1"', async () => {
      const value = '<img data-src="1">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not promote a boolean-string value like "true"', async () => {
      const value = '<img data-src="true">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not promote a JSON-object value', async () => {
      const value = '<img data-src=\'{"standard":"photo.jpg","retina":"photo@2x.jpg"}\'>'
      const expected = html`
        <img
          data-src="{&quot;standard&quot;:&quot;photo.jpg&quot;,&quot;retina&quot;:&quot;photo@2x.jpg&quot;}"
        >
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should not promote an empty string', async () => {
      const value = '<img data-src="">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should fall through to a later attribute when an earlier one is non-URL', async () => {
      const value = '<img data-src="loaded" data-original="real.jpg">'
      const expected = html`
        <img
          data-src="loaded"
          data-original="real.jpg"
          src="real.jpg"
        >
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should accept a relative path with extension', async () => {
      const value = '<img data-src="photos/img.jpg">'
      const expected = '<img data-src="photos/img.jpg" src="photos/img.jpg">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should accept a data: URI', async () => {
      const value = '<img data-src="data:image/png;base64,iVBORw0KGgo">'
      const expected = html`
        <img
          data-src="data:image/png;base64,iVBORw0KGgo"
          src="data:image/png;base64,iVBORw0KGgo"
        >
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should not extract noscript when sibling is img but noscript has no image', async () => {
    const value = html`
      <img src="x">
      <noscript>just text, no image tag</noscript>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should overwrite existing src with data-src', async () => {
    const value = '<img src="placeholder.gif" data-src="real.jpg">'
    const expected = '<img src="real.jpg" data-src="real.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should drop pixel-sized dimensions of the placeholder when promoting', async () => {
    const value = html`
      <img
        src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
        data-src="photo.jpg"
        width="1"
        height="1"
      >
    `
    const expected = '<img src="photo.jpg" data-src="photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should drop pixel-sized style dimensions of the placeholder when promoting', async () => {
    const value = html`
      <img
        src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
        data-src="photo.jpg"
        style="width:1px;height:1px"
      >
    `
    const expected = '<img src="photo.jpg" data-src="photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the other style rules when dropping pixel-sized style dimensions', async () => {
    const value = html`
      <img
        src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
        data-src="photo.jpg"
        style="border:0;width:1px;max-width:100%;height:1px"
      >
    `
    const expected = '<img src="photo.jpg" data-src="photo.jpg" style="border:0;max-width:100%">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a content-sized style dimension when dropping a pixel-sized one', async () => {
    const value = html`
      <img
        src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
        data-src="photo.jpg"
        style="width:1px;height:600px"
      >
    `
    const expected = '<img src="photo.jpg" data-src="photo.jpg" style="height:600px">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep content-sized dimensions when promoting', async () => {
    const value = '<img data-src="photo.jpg" width="800" height="600">'
    const expected = '<img data-src="photo.jpg" width="800" height="600" src="photo.jpg">'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep pixel-sized dimensions when there is nothing to promote', async () => {
    const value = '<img src="pixel.gif" width="1" height="1">'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should handle html with no images', async () => {
    const value = '<p>No images here</p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  describe('lazy srcset attributes', () => {
    it.each(defaultLazySrcsetAttributes)('should promote %s into srcset', async (attribute) => {
      const value = `<img ${attribute}="small.jpg 300w, large.jpg 600w">`
      const expected = `<img ${attribute}="small.jpg 300w, large.jpg 600w" srcset="small.jpg 300w, large.jpg 600w">`

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should prefer data-srcset over data-lazy-srcset when both present', async () => {
      const value = '<img data-srcset="primary.jpg 300w" data-lazy-srcset="fallback.jpg 300w">'
      const expected = html`
        <img
          data-srcset="primary.jpg 300w"
          data-lazy-srcset="fallback.jpg 300w"
          srcset="primary.jpg 300w"
        >
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should skip non-URL srcset values like Cloudinary transform params', async () => {
      const value = '<img data-srcset="w_200,h_200 200w, w_400,h_400 400w">'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should skip empty srcset values', async () => {
      const value = '<img data-image-srcset="">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('source elements', () => {
    it('should promote lazy srcset on a source element', async () => {
      const value = '<picture><source data-srcset="photo.avif" type="image/avif"></picture>'
      const expected = html`
        <picture>
          <source
            data-srcset="photo.avif"
            type="image/avif"
            srcset="photo.avif"
          >
        </picture>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should promote lazy src on a source element', async () => {
      const value = '<video><source data-src="clip.mp4"></video>'
      const expected = '<video><source data-src="clip.mp4" src="clip.mp4"></video>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the modern source through picture flattening', async () => {
      const value = html`
        <picture>
          <source data-srcset="photo.avif" type="image/avif">
          <img src="photo.jpg">
        </picture>
      `
      // Without the lazy-source promotion, flatten drops the empty-srcset source and
      // this would be src="photo.jpg" with no srcset.
      const expected = '<img src="photo.avif" srcset="photo.avif">'
      const result = await applyDomTransforms(parseHtml(value), [
        fixLazyImages(baseContext),
        flattenPictureElements(baseContext),
      ])

      expect(result).toEqualHtml(expected)
    })
  })

  describe('gallery noscript fallbacks', () => {
    it('should unwrap the noscript of a named gallery', async () => {
      const value = html`
        <div class="lazygal">
          <noscript>
            <img src="https://example.com/photos/a.jpeg" alt="A">
          </noscript>
        </div>
      `
      const expected = html`
        <div class="lazygal">
          <img src="https://example.com/photos/a.jpeg" alt="A">
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry the alt and caption of each picture', async () => {
      const value = html`
        <div class="juicebox-container">
          <noscript>
            <p class="jb-image">
              <img src="https://example.com/files/Kaffeetrinken01.jpg" alt="Wie jedes Jahr begann alles beim Kaffeetrinken..." class="image-field">
              <br>
              <span class="jb-title"></span><br>
              <span class="jb-caption">Wie jedes Jahr begann alles beim Kaffeetrinken...</span>
            </p>
          </noscript>
        </div>
      `
      const expected = html`
        <div class="juicebox-container">
          <p class="jb-image">
            <img src="https://example.com/files/Kaffeetrinken01.jpg" alt="Wie jedes Jahr begann alles beim Kaffeetrinken..." class="image-field">
            <br>
            <span class="jb-title"></span><br>
            <span class="jb-caption">Wie jedes Jahr begann alles beim Kaffeetrinken...</span>
          </p>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the noscript when the gallery shows the same picture beside it', async () => {
      const value = html`
        <div class="sqs-gallery">
          <div class="image-wrapper" id="5e4a693a8497647c62a37c5a" data-type="image" data-animation-role="image">
            <p><noscript><img src="https://example.com/nicktalk/z_f0e1d1bad37c57aaa8ba14ce1d7988b1.jpg" alt="1.jpg"></noscript><img class="thumb-image" src="https://example.com/nicktalk/z_f0e1d1bad37c57aaa8ba14ce1d7988b1.jpg" data-image="https://example.com/nicktalk/z_f0e1d1bad37c57aaa8ba14ce1d7988b1.jpg" data-image-dimensions="1920x940" data-image-focal-point="0.5,0.5" alt="1.jpg" data-load="false" data-image-id="5e4a693a8497647c62a37c5a" data-type="image"></p>
          </div>
        </div>
      `
      const context = { ...baseContext, galleryNoscriptSelectors: ['.sqs-gallery noscript'] }

      expect(await transform(value, context)).toEqualHtml(value)
    })

    it('should unwrap the noscript when the image beside it is another picture', async () => {
      const value = html`
        <div class="sqs-gallery">
          <a href="https://example.com/gallery">
            <noscript>
              <img src="https://images.example.com/content/v1/IMG_7101.jpg" alt="IMG_7101.jpg">
            </noscript>
            <img src="https://images.example.com/content/v1/IMG_7102.jpg">
          </a>
        </div>
      `
      const expected = html`
        <div class="sqs-gallery">
          <a href="https://example.com/gallery">
            <img src="https://images.example.com/content/v1/IMG_7101.jpg" alt="IMG_7101.jpg">
            <img src="https://images.example.com/content/v1/IMG_7102.jpg">
          </a>
        </div>
      `
      const context = { ...baseContext, galleryNoscriptSelectors: ['.sqs-gallery noscript'] }

      expect(await transform(value, context)).toEqualHtml(expected)
    })

    // Constructed: no feed in the sample repeats a gallery picture outside the gallery.
    it('should unwrap the noscript when the same picture shows outside the gallery', async () => {
      const value = html`
        <p><img src="https://example.com/files/Teichfest_01.jpg"></p>
        <div class="juicebox-container">
          <noscript>
            <p class="jb-image"><img src="https://example.com/files/Teichfest_01.jpg" alt=""></p>
          </noscript>
        </div>
      `
      const expected = html`
        <p><img src="https://example.com/files/Teichfest_01.jpg"></p>
        <div class="juicebox-container">
          <p class="jb-image"><img src="https://example.com/files/Teichfest_01.jpg" alt=""></p>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a gallery noscript alone when the list is empty', async () => {
      const value = html`
        <div class="lazygal">
          <noscript>
            <img src="https://example.com/photos/a.jpeg" alt="A">
          </noscript>
        </div>
      `
      const context = { ...baseContext, galleryNoscriptSelectors: [] }

      expect(await transform(value, context)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = '<img data-src="photo.jpg">'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('fixLazyImages gallery fallbacks through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should show a Juicebox gallery', async () => {
    const value = html`
      <div class="juicebox-parent">
        <div id="node--87--field-image--rss" class="juicebox-container">
          <noscript>
            <!-- Image gallery content for non-javascript devices -->
            <p class="jb-image">
              <img src="https://example.com/sites/default/files/2020-06/Teichfest_01.jpg" alt typeof="foaf:Image" class="image-field">
              <br>
              <span class="jb-title"></span><br>
              <span class="jb-caption"></span>
            </p>
            <p class="jb-image">
              <img src="https://example.com/sites/default/files/2020-06/Teichfest_02.jpg" alt typeof="foaf:Image" class="image-field">
              <br>
              <span class="jb-title"></span><br>
              <span class="jb-caption"></span>
            </p>
          </noscript>
        </div>
      </div>
    `
    const expected = html`
      <p class="jb-image">
        <img src="https://example.com/sites/default/files/2020-06/Teichfest_01.jpg" alt="" typeof="foaf:Image" class="image-field">
      </p>
      <p class="jb-image">
        <img src="https://example.com/sites/default/files/2020-06/Teichfest_02.jpg" alt="" typeof="foaf:Image" class="image-field">
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should show a Justified Image Grid gallery', async () => {
    const value = html`
      <div id="jig1" class="justified-image-grid jig-preset-3 jig-source-nextgen">
        <div class="jig-clearfix"></div>
        <noscript id="jig1-html" class="justified-image-grid-html" data-lazy-src="skiplazyload" data-src="skipunveillazyload">
          <ul>
            <li><a href="https://example.com/wp-content/gallery/live/EJ-02.jpg"><img decoding="async" src="https://example.com/wp-content/plugins/justified-image-grid/timthumb.php?src=https%3A%2F%2Fexample.com%2Fwp-content%2Fgallery%2Flive%2FEJ-02.jpg&amp;h=310&amp;q=90&amp;f=.jpg" alt="" width="465" height="310"></a></li>
            <li><a href="https://example.com/wp-content/gallery/live/EJ-03.jpg"><img loading="lazy" decoding="async" src="https://example.com/wp-content/plugins/justified-image-grid/timthumb.php?src=https%3A%2F%2Fexample.com%2Fwp-content%2Fgallery%2Flive%2FEJ-03.jpg&amp;h=310&amp;q=90&amp;f=.jpg" alt="" width="206" height="310"></a></li>
          </ul>
        </noscript>
      </div>
    `
    const expected = html`
      <ul>
        <li><a href="https://example.com/wp-content/gallery/live/EJ-02.jpg"><img decoding="async" src="https://example.com/wp-content/plugins/justified-image-grid/timthumb.php?src=https%3A%2F%2Fexample.com%2Fwp-content%2Fgallery%2Flive%2FEJ-02.jpg&amp;h=310&amp;q=90&amp;f=.jpg" alt="" width="465" height="310"></a></li>
        <li><a href="https://example.com/wp-content/gallery/live/EJ-03.jpg"><img loading="lazy" decoding="async" src="https://example.com/wp-content/plugins/justified-image-grid/timthumb.php?src=https%3A%2F%2Fexample.com%2Fwp-content%2Fgallery%2Flive%2FEJ-03.jpg&amp;h=310&amp;q=90&amp;f=.jpg" alt="" width="206" height="310"></a></li>
      </ul>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should show a Lazygal gallery', async () => {
    const value = html`
      <div class="lazygal" id="lazygal-gallery-lazygal_2013__08__18__knieskinderzoo_1">
        <noscript>
          <div class="lazygal-image-container" style="width: 49.0%; margin: 0.5%; max-width: 442px;">
            <div class="lazygal-image-outercont">
              <a href="https://example.com/photos/2013/08/ckkz-01.jpeg" style="width: 100%;">
                <span class="lazygal-image-outer" style="width: 100%;"><span class="lazygal-ka" style="padding-top: 66.36%;"></span><img src="https://example.com/photos/2013/08/ckkz-01-bw-440x292.jpeg" class="lazygal-image-scale" alt=""></span>
              </a>
            </div>
          </div>
        </noscript>
      </div>
    `
    const expected = html`
      <a href="https://example.com/photos/2013/08/ckkz-01.jpeg" style="width: 100%;">
        <span class="lazygal-image-outer" style="width: 100%;"><img height="292" width="440" src="https://example.com/photos/2013/08/ckkz-01-bw-440x292.jpeg" class="lazygal-image-scale" alt=""></span>
      </a>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should show a SimpLy Gallery Block gallery', async () => {
    const value = html`
      <div class="pgc-sgb-cb wp-block-pgcsimplygalleryblock-slider" data-gallery-id="72e84381">
        <div class="simply-gallery-amp pgc_sgb_slider">
          <noscript>
            <div class="sgb-gallery">
              <div class="sgb-item"><a href="https://example.com/?attachment_id=38284" target="_blank"><img decoding="async" alt="" width="300" height="167" loading="lazy" src="https://example.com/wp-content/uploads/2026/06/IMG-20260625-WA0003-300x167.jpg"></a></div>
              <div class="sgb-item"><a href="https://example.com/?attachment_id=38277" target="_blank"><img decoding="async" alt="" width="300" height="142" loading="lazy" src="https://example.com/wp-content/uploads/2026/06/IMG-20260624-WA0029-300x142.jpg"></a></div>
            </div>
          </noscript>
        </div>
      </div>
    `
    const expected = html`
      <a href="https://example.com/?attachment_id=38284" target="_blank"><img decoding="async" alt="" width="300" height="167" loading="lazy" src="https://example.com/wp-content/uploads/2026/06/IMG-20260625-WA0003-300x167.jpg"></a>
      <a href="https://example.com/?attachment_id=38277" target="_blank"><img decoding="async" alt="" width="300" height="142" loading="lazy" src="https://example.com/wp-content/uploads/2026/06/IMG-20260624-WA0029-300x142.jpg"></a>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
