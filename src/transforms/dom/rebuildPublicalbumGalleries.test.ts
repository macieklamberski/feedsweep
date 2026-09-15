import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildPublicalbumGalleries } from './rebuildPublicalbumGalleries.js'

describeForEachParser('rebuildPublicalbumGalleries', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildPublicalbumGalleries(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the gallery player into linked photos under a captioned figure', async () => {
      const value = html`
        <div
          class="pa-gallery-player-widget"
          style="width:100%; height:480px; display:none;"
          data-link="https://photos.example.com/share/first-album"
          data-title="Spring walk"
          data-description="Shared album · Tap to view!"
        >
          <object data="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080"></object>
          <object data="https://lh3.example.com/pw/AP1GczSecond=w1920-h1080"></object>
        </div>
      `
      const expected = html`
        <figure>
          <a href="https://photos.example.com/share/first-album">
            <img src="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080">
          </a>
          <a href="https://photos.example.com/share/first-album">
            <img src="https://lh3.example.com/pw/AP1GczSecond=w1920-h1080">
          </a>
          <figcaption>
            <a href="https://photos.example.com/share/first-album">Spring walk</a>
            Shared album · Tap to view!</figcaption>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })

    it('should read the carousel photo whose object states a Flash type over the url', async () => {
      const value = html`
        <div
          class="pa-carousel-widget"
          style="width: 90%; height: 480px; display: none;"
          data-link="https://photos.example.com/share/venice"
          data-title="Venice 2023"
          data-description="A week on the lagoon"
          data-background-color="#eee"
        >
          <object
            width="320"
            height="240"
            data="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080"
            type="application/x-shockwave-flash"
          >
            <param
              name="src"
              value="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080"
            >
          </object>
        </div>
      `
      const expected = html`
        <figure>
          <a href="https://photos.example.com/share/venice">
            <img src="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080">
          </a>
          <figcaption>
            <a href="https://photos.example.com/share/venice">Venice 2023</a>
            A week on the lagoon</figcaption>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave an object carrying a photo outside either widget class alone', async () => {
      const value = '<object data="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080"></object>'

      expect(await transform(value)).toBe(value)
    })

    it('should leave a widget whose objects name no photo alone', async () => {
      const value = html`
        <div
          class="pa-gallery-player-widget"
          data-link="https://photos.example.com/share/first-album"
          data-title="Spring walk"
        >
          <object></object>
        </div>
      `

      expect(await transform(value)).toBe(value)
    })
  })

  describe('edge cases', () => {
    it('should emit unlinked photos when the widget names no album', async () => {
      const value = html`
        <div
          class="pa-gallery-player-widget"
          data-title="Spring walk"
        >
          <object data="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080"></object>
        </div>
      `
      const expected = html`
        <figure>
          <img src="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080">
          <figcaption>Spring walk</figcaption>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })

    it('should caption with the description alone when the widget states no title', async () => {
      const value = html`
        <div
          class="pa-carousel-widget"
          data-link="https://photos.example.com/share/venice"
          data-description="A week on the lagoon"
        >
          <object data="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080"></object>
        </div>
      `
      const expected = html`
        <figure>
          <a href="https://photos.example.com/share/venice">
            <img src="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080">
          </a>
          <figcaption>A week on the lagoon</figcaption>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })

    it('should emit no caption when the widget carries neither title nor description', async () => {
      const value = html`
        <div
          class="pa-carousel-widget"
          data-link="https://photos.example.com/share/venice"
        >
          <object data="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080"></object>
        </div>
      `
      const expected = html`
        <figure>
          <a href="https://photos.example.com/share/venice">
            <img src="https://lh3.example.com/W3-YKSN0Hi2LL9w3=w1920-h1080">
          </a>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })
  })

  describe('the hosts publishers serve the album photos from', () => {
    it('should rebuild photos served from blogger.googleusercontent.com', async () => {
      const value = html`
        <div
          class="pa-gallery-player-widget"
          data-link="https://photos.example.com/share/first-album"
        >
          <object data="https://blogger.example.com/img/a/AVvXsEgFirst=w1920-h1080"></object>
        </div>
      `
      const expected = html`
        <figure>
          <a href="https://photos.example.com/share/first-album">
            <img src="https://blogger.example.com/img/a/AVvXsEgFirst=w1920-h1080">
          </a>
        </figure>
      `

      expect(await transform(value)).toBe(expected)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <div
        class="pa-gallery-player-widget"
        data-link="https://photos.example.com/share/first-album"
        data-title="Spring walk"
        data-description="Shared album · Tap to view!"
      >
        <object data="https://lh3.example.com/pw/AP1GczFirst=w1920-h1080"></object>
      </div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
