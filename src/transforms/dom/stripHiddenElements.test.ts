import { describe, expect, it } from 'bun:test'
import { defaultRevealableSelectors } from '../../defaults.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripHiddenElements } from './stripHiddenElements.js'

// One real-world specimen per default revealable selector, keyed by the selector itself, as the
// hidden input and the unhidden output. The completeness test keeps it in step with
// defaultRevealableSelectors.
const specimens: Record<string, [string, string]> = {
  '[class*="accordion"]': [
    '<div class="text-accordion-content" style="display:none">Panel</div>',
    '<div class="text-accordion-content">Panel</div>',
  ],
  '[class*="collaps"]': [
    '<div class="collapsible-block-unfolded" style="display:none">Panel</div>',
    '<div class="collapsible-block-unfolded">Panel</div>',
  ],
  '[id^="fv-more-text"]': [
    '<div id="fv-more-text-1" style="display:none">Panel</div>',
    '<div id="fv-more-text-1">Panel</div>',
  ],
  '.yrm-content': [
    '<div class="yrm-content yrm-content-1 yrm-content-hide" style="display:none">Panel</div>',
    '<div class="yrm-content yrm-content-1 yrm-content-hide">Panel</div>',
  ],
  '[class*="carousel"]': [
    '<div class="premium-adv-carousel__inner-container" style="display:none">Panel</div>',
    '<div class="premium-adv-carousel__inner-container">Panel</div>',
  ],
  '.esg-grid': [
    '<div class="esg-grid" id="esg-grid-1-1" style="display:none">Panel</div>',
    '<div class="esg-grid" id="esg-grid-1-1">Panel</div>',
  ],
  '[class*="gallery"]': [
    '<div class="unite-gallery tiles" id="gg_1_1" style="display:none">Panel</div>',
    '<div class="unite-gallery tiles" id="gg_1_1">Panel</div>',
  ],
  '[class*="slider"]': [
    '<ul class="bxslider-1" style="display:none"><li>Panel</li></ul>',
    '<ul class="bxslider-1"><li>Panel</li></ul>',
  ],
  '[id^="rev_slider"]': [
    '<div id="rev_slider_1_1_wrapper" style="display:none">Panel</div>',
    '<div id="rev_slider_1_1_wrapper">Panel</div>',
  ],
  '[class^="slide-"]': [
    '<div class="slide-1 ms-image" style="display:none">Panel</div>',
    '<div class="slide-1 ms-image">Panel</div>',
  ],
  '.field-slideshow-slide': [
    '<div class="field-slideshow-slide field-slideshow-slide-2 odd" style="display:none">Panel</div>',
    '<div class="field-slideshow-slide field-slideshow-slide-2 odd">Panel</div>',
  ],
  '.swiper-slide': [
    '<div class="swiper-slide hidden-slide" style="display:none">Panel</div>',
    '<div class="swiper-slide hidden-slide">Panel</div>',
  ],
  '.testimonial_slide': [
    '<div class="testimonial_slide" style="display:none">Panel</div>',
    '<div class="testimonial_slide">Panel</div>',
  ],
  '[class*="spoiler"]': [
    '<div class="spoilermain" id="1" style="display:none">Panel</div>',
    '<div class="spoilermain" id="1">Panel</div>',
  ],
  '[class*="Spoiler"]': [
    '<div class="uSpoilerText" style="display:none">Panel</div>',
    '<div class="uSpoilerText">Panel</div>',
  ],
  '[id^="spoiler"]': [
    '<div id="spoiler1" style="display:none">Panel</div>',
    '<div id="spoiler1">Panel</div>',
  ],
  '[id^="rlta-panel"]': [
    '<div id="rlta-panel-sources" style="display:none">Panel</div>',
    '<div id="rlta-panel-sources">Panel</div>',
  ],
  '[id^="wiki-tab"]': [
    '<div id="wiki-tab-0-2" style="display:none">Panel</div>',
    '<div id="wiki-tab-0-2">Panel</div>',
  ],
}

describeForEachParser('stripHiddenElements', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [stripHiddenElements(context)])
  }

  describe('removes hidden elements', () => {
    it('should remove an element with the hidden attribute', async () => {
      const value = '<p>Keep</p><div hidden>Gone</div>'
      const expected = '<p>Keep</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove an element with inline display:none', async () => {
      const value = '<p>Keep</p><div style="display:none">Gone</div>'
      const expected = '<p>Keep</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove an element with inline visibility:hidden', async () => {
      const value = '<p>Keep</p><span style="visibility:hidden">Gone</span>'
      const expected = '<p>Keep</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove the whole hidden subtree', async () => {
      const value = '<div style="display:none"><p>a</p><img src="x.jpg"></div><p>Keep</p>'
      const expected = '<p>Keep</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove an email preheader', async () => {
      const value = html`
        <span
          class="mcnPreviewText"
          style="display:none; font-size:0px; line-height:0px; max-height:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;"
        >Forthcoming events and new resources</span>
        <p>Dear members,</p>
      `
      const expected = '<p>Dear members,</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden block inside a form even when a link names its id', async () => {
      const value = html`
        <form>
          <a href="#options">More options</a>
          <div id="options" style="display:none">Advanced search</div>
        </form>
      `
      const expected = html`
        <form>
          <a href="#options">More options</a>
        </form>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden dialog a control names', async () => {
      const value = html`
        <button aria-controls="viewer">View</button>
        <div id="viewer" role="dialog" hidden><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<button aria-controls="viewer">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden dialog element a control names', async () => {
      const value = html`
        <button aria-controls="viewer">View</button>
        <dialog id="viewer" style="display:none"><img src="https://example.com/photo.jpg"></dialog>
      `
      const expected = '<button aria-controls="viewer">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden modal a control names', async () => {
      const value = html`
        <button aria-controls="viewer">View</button>
        <div id="viewer" class="image-modal" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<button aria-controls="viewer">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden lightbox a link names', async () => {
      const value = html`
        <a href="#lightbox-1">View</a>
        <div id="lightbox-1" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<a href="#lightbox-1">View</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a block only a click handler beside it reveals', async () => {
      const value = html`
        <a onclick="layerVis('842878823', 1)">pic</a>
        <div id="842878823" style="display: none;"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = `<a onclick="layerVis('842878823', 1)">pic</a>`

      expect(await transform(value)).toEqualHtml(expected)
    })
    it('should remove a slideshow control panel', async () => {
      const value = html`
        <div
          class="slideshow_controlPanel slideshow_transparent"
          style="display: none;"
        ><ul><li class="slideshow_togglePlay"></li></ul></div>
        <p>Keep</p>
      `
      const expected = '<p>Keep</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a block with no id when a link points at the top of the page', async () => {
      const value = '<a href="#">Back to top</a><div style="display:none">Gone</div>'
      const expected = '<a href="#">Back to top</a>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden form inside a kept slider', async () => {
      const value = html`
        <div class="bxslider-1" style="display:none">
          <img src="https://example.com/a.jpg">
          <form style="display:none"><input name="email"></form>
        </div>
      `
      const expected = html`
        <div class="bxslider-1">
          <img src="https://example.com/a.jpg">
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden dialog inside a kept gallery', async () => {
      const value = html`
        <div class="unite-gallery" style="display:none">
          <img src="https://example.com/a.jpg">
          <div role="dialog" hidden><img src="https://example.com/a-large.jpg"></div>
        </div>
      `
      const expected = html`
        <div class="unite-gallery">
          <img src="https://example.com/a.jpg">
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('keeps and unhides what a reader can reveal', () => {
    it('should keep a slider hidden until its script starts', async () => {
      const value = html`
        <ul class="bxslider-1" style="display:none;">
          <li><img src="https://example.com/a.jpg" width="800" height="600"></li>
        </ul>
      `
      const expected = html`
        <ul class="bxslider-1">
          <li><img src="https://example.com/a.jpg" width="800" height="600"></li>
        </ul>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it.each(Object.entries(specimens))(
      'should keep a %s panel',
      async (_selector, [value, expected]) => {
        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    it('should have a specimen for every default revealable selector', () => {
      const specimenSelectors = Object.keys(specimens).sort()
      const defaultSelectors = [...defaultRevealableSelectors].sort()

      expect(specimenSelectors).toEqual(defaultSelectors)
    })

    it('should keep a spoiler holding only text', async () => {
      const value =
        '<div class="uSpoilerText" style="display:none;">The killer is the butler.</div>'
      const expected = '<div class="uSpoilerText">The killer is the butler.</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a tab panel', async () => {
      const value = '<div role="tabpanel" hidden>Second tab</div>'
      const expected = '<div role="tabpanel">Second tab</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep content hidden until found', async () => {
      const value = '<div hidden="until-found"><p>The full answer.</p></div>'
      const expected = '<div><p>The full answer.</p></div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a hidden player', async () => {
      const value = '<video src="https://example.com/clip.mp4" style="display:none"></video>'
      const expected = '<video src="https://example.com/clip.mp4"></video>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a hidden audio player', async () => {
      const value = '<audio src="https://example.com/episode.mp3" hidden></audio>'
      const expected = '<audio src="https://example.com/episode.mp3"></audio>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block a control names by aria-controls', async () => {
      const value = html`
        <p>Answer: <a aria-controls="answer">show</a></p>
        <div id="answer" style="display:none">Forty-two.</div>
      `
      const expected = html`
        <p>Answer: <a aria-controls="answer">show</a></p>
        <div id="answer">Forty-two.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block an in-page link names', async () => {
      const value = html`
        <p>Answer: <a href="#answer">show</a></p>
        <div id="answer" style="display:none">Forty-two.</div>
      `
      const expected = html`
        <p>Answer: <a href="#answer">show</a></p>
        <div id="answer">Forty-two.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the unnamed slides inside a kept slider', async () => {
      const value = html`
        <ul class="bxslider-1" style="display:none;">
          <li><img src="https://example.com/a.jpg"></li>
          <li style="display:none"><img src="https://example.com/b.jpg"></li>
          <li style="display:none"><img src="https://example.com/c.jpg"></li>
        </ul>
      `
      const expected = html`
        <ul class="bxslider-1">
          <li><img src="https://example.com/a.jpg"></li>
          <li><img src="https://example.com/b.jpg"></li>
          <li><img src="https://example.com/c.jpg"></li>
        </ul>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop only the hiding declarations and aria-hidden', async () => {
      const value = html`
        <div
          class="spoiler"
          style="color:red; display:none; visibility:hidden"
          aria-hidden="true"
        >Forty-two.</div>
      `
      const expected = '<div class="spoiler" style="color:red">Forty-two.</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('leaves visible content', () => {
    it('should keep a normal element', async () => {
      const value = '<div style="color:red">Visible</div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not remove opacity:0 (left to removeTrackingPixels)', async () => {
      const value = '<img src="x.jpg" style="opacity:0">'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <p>Keep</p>
      <div style="display:none">Gone</div>
      <div class="spoiler" style="display:none">Kept</div>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('stripHiddenElements through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the slides of a slider hidden until its script starts', async () => {
    const value = html`
      <ul class="bxslider-1" style="display:none;">
        <li><img src="https://example.com/a.jpg" width="800" height="600"></li>
      </ul>
    `
    const expected = html`
      <ul class="bxslider-1">
        <li><img src="https://example.com/a.jpg" width="800" height="600"></li>
      </ul>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
