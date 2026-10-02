import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripHiddenElements } from './stripHiddenElements.js'

const revealableClassNames = [
  'text-accordion-content',
  'premium-adv-carousel__inner-container',
  'collapsible-block-unfolded',
  'esg-grid',
  'unite-gallery',
  'fv-more-text-1',
  'rlta-panel-sources',
  'bxslider-1',
  'uSpoilerText',
  'tabItem_Ymn1',
  'wiki-tab-0-2',
  'yrm-content-1',
]

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

    it('should remove a hidden image beside a form whose only control is its submit button', async () => {
      const value = html`
        <div><form><button>Search</button></form></div>
        <img class="sidx-image-cookie" style="display:none;" src="https://example.com/signin/guest">
      `
      const expected = '<div><form><button>Search</button></form></div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden control even beside another control', async () => {
      const value = html`
        <button onclick="next()">Next</button>
        <button style="display:none" onclick="previous()">Previous</button>
      `
      const expected = '<button onclick="next()">Next</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden dialog a button opens', async () => {
      const value = html`
        <button onclick="openViewer()">View</button>
        <div class="ps-image-viewer" role="dialog" hidden><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<button onclick="openViewer()">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden dialog element a button opens', async () => {
      const value = html`
        <button onclick="openViewer()">View</button>
        <dialog style="display:none"><img src="https://example.com/photo.jpg"></dialog>
      `
      const expected = '<button onclick="openViewer()">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden modal a button opens', async () => {
      const value = html`
        <button onclick="openViewer()">View</button>
        <div class="image-modal" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<button onclick="openViewer()">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a hidden lightbox a button opens', async () => {
      const value = html`
        <button onclick="openViewer()">View</button>
        <div id="lightbox-1" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = '<button onclick="openViewer()">View</button>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a code-fold stand-in its click handler swaps for a visible block', async () => {
      const value = html`
        <img
          id="Codehighlighter1_52_125_Open_Image"
          onclick="this.style.display='none'; Codehighlighter1_52_125_Open_Text.style.display='none'; Codehighlighter1_52_125_Closed_Text.style.display='inline';"
          src="https://example.com/ExpandedBlockStart.gif"
        >
        <span
          id="Codehighlighter1_52_125_Closed_Text"
          style="border: #808080 1px solid; display: none"
        ><img src="https://example.com/dot.gif"></span>
        <span id="Codehighlighter1_52_125_Open_Text">int main() {}</span>
      `
      const expected = html`
        <img
          id="Codehighlighter1_52_125_Open_Image"
          onclick="this.style.display='none'; Codehighlighter1_52_125_Open_Text.style.display='none'; Codehighlighter1_52_125_Closed_Text.style.display='inline';"
          src="https://example.com/ExpandedBlockStart.gif"
        >
        <span id="Codehighlighter1_52_125_Open_Text">int main() {}</span>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
    it('should remove a code-fold stand-in holding only a comment marker', async () => {
      const value = html`
        <img
          id="Codehighlighter1_0_239_Open_Image"
          onclick="this.style.display='none'; Codehighlighter1_0_239_Open_Text.style.display='none'; Codehighlighter1_0_239_Closed_Text.style.display='inline';"
          src="https://example.com/ExpandedBlockStart.gif"
        >
        <span
          id="Codehighlighter1_0_239_Closed_Text"
          style="border: #808080 1px solid; display: none"
        >/**/</span>
        <span id="Codehighlighter1_0_239_Open_Text">/* Prints a greeting. */</span>
      `
      const expected = html`
        <img
          id="Codehighlighter1_0_239_Open_Image"
          onclick="this.style.display='none'; Codehighlighter1_0_239_Open_Text.style.display='none'; Codehighlighter1_0_239_Closed_Text.style.display='inline';"
          src="https://example.com/ExpandedBlockStart.gif"
        >
        <span id="Codehighlighter1_0_239_Open_Text">/* Prints a greeting. */</span>
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

    it.each(revealableClassNames)('should keep a %s panel', async (name) => {
      const value = `<div class="${name}" style="display:none">Second panel</div>`
      const expected = `<div class="${name}">Second panel</div>`

      expect(await transform(value)).toEqualHtml(expected)
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

    it('should keep a block a click handler names', async () => {
      const value = html`
        <p>Answer: <span onclick="layerVis('842878823', 1)">show</span></p>
        <div id="842878823" style="display: none;">Forty-two.</div>
      `
      const expected = html`
        <p>Answer: <span onclick="layerVis('842878823', 1)">show</span></p>
        <div id="842878823">Forty-two.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block a jQuery click handler names as a selector', async () => {
      const value = html`
        <p><a onclick="jQuery('#answer').slideToggle()">Show the answer</a></p>
        <p>Think it over first.</p>
        <p>Then check below.</p>
        <div id="answer" style="display:none">Forty-two.</div>
      `
      const expected = html`
        <p><a onclick="jQuery('#answer').slideToggle()">Show the answer</a></p>
        <p>Think it over first.</p>
        <p>Then check below.</p>
        <div id="answer">Forty-two.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block right after a button', async () => {
      const value = '<button>Show</button><div style="display:none">Forty-two.</div>'
      const expected = '<button>Show</button><div>Forty-two.</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block one element after a button', async () => {
      const value = '<button>Show</button><br><div style="display:none">Forty-two.</div>'
      const expected = '<button>Show</button><br><div>Forty-two.</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block whose parent follows a button', async () => {
      const value = '<button>Show</button><div><div style="display:none">Forty-two.</div></div>'
      const expected = '<button>Show</button><div><div>Forty-two.</div></div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block right before a button', async () => {
      const value =
        '<div style="display:none">Forty-two.</div><p><input type="button" value="Show"></p>'
      const expected = '<div>Forty-two.</div><p><input type="button" value="Show"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block a role button sits beside', async () => {
      const value = '<span role="button">Show</span><div style="display:none">Forty-two.</div>'
      const expected = '<span role="button">Show</span><div>Forty-two.</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the full text a click handler swaps in for a visible excerpt', async () => {
      const value = html`
        <a onclick="excerpt.style.display='none'; full.style.display='inline';">more</a>
        <span id="excerpt">The plan</span>
        <span id="full" style="display:none">The plan is to sail at dawn.</span>
      `
      const expected = html`
        <a onclick="excerpt.style.display='none'; full.style.display='inline';">more</a>
        <span id="excerpt">The plan</span>
        <span id="full">The plan is to sail at dawn.</span>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image-only block a click handler names beside an unrelated one', async () => {
      const value = html`
        <a onclick="summary.style.display='none'">Hide summary</a>
        <p id="summary">Two days on the coast.</p>
        <p><button onclick="document.getElementById('photos-1').style.display='block'">Show photos</button></p>
        <p>Taken on the second day.</p>
        <p>Most of them at low tide.</p>
        <div id="photos-1" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = html`
        <a onclick="summary.style.display='none'">Hide summary</a>
        <p id="summary">Two days on the coast.</p>
        <p><button onclick="document.getElementById('photos-1').style.display='block'">Show photos</button></p>
        <p>Taken on the second day.</p>
        <p>Most of them at low tide.</p>
        <div id="photos-1"><img src="https://example.com/photo.jpg"></div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a number a click handler swaps in for a visible mask', async () => {
      const value = html`
        <a onclick="masked.style.display='none'; phone.style.display='inline';">Show number</a>
        <span id="masked">555 XXXX</span>
        <span id="phone" style="display:none">555 0134</span>
      `
      const expected = html`
        <a onclick="masked.style.display='none'; phone.style.display='inline';">Show number</a>
        <span id="masked">555 XXXX</span>
        <span id="phone">555 0134</span>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a block right after a link whose click handler shows it', async () => {
      const value = html`
        <a onclick="this.nextElementSibling.style.display='block'">Show the answer</a>
        <div style="display:none">Forty-two.</div>
      `
      const expected = html`
        <a onclick="this.nextElementSibling.style.display='block'">Show the answer</a>
        <div>Forty-two.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image-only pane a click handler swaps for another hidden pane', async () => {
      const value = html`
        <a onclick="photo.style.display='block'; notes.style.display='none'">Photo</a>
        <a onclick="notes.style.display='block'; photo.style.display='none'">Notes</a>
        <p>Pick a tab.</p>
        <p>The page script opens the first.</p>
        <div id="photo" style="display:none"><img src="https://example.com/photo.jpg"></div>
        <div id="notes" style="display:none">Shot at dawn.</div>
      `
      const expected = html`
        <a onclick="photo.style.display='block'; notes.style.display='none'">Photo</a>
        <a onclick="notes.style.display='block'; photo.style.display='none'">Notes</a>
        <p>Pick a tab.</p>
        <p>The page script opens the first.</p>
        <div id="photo"><img src="https://example.com/photo.jpg"></div>
        <div id="notes">Shot at dawn.</div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image-only block a link shows while hiding itself', async () => {
      const value = html`
        <a
          id="photo-link"
          onclick="document.getElementById('photo-link').style.display='none'; document.getElementById('photo').style.display='block'"
        >Show the photo</a>
        <p>It is a large file.</p>
        <p>Open it on a fast connection.</p>
        <div id="photo" style="display:none"><img src="https://example.com/photo.jpg"></div>
      `
      const expected = html`
        <a
          id="photo-link"
          onclick="document.getElementById('photo-link').style.display='none'; document.getElementById('photo').style.display='block'"
        >Show the photo</a>
        <p>It is a large file.</p>
        <p>Open it on a fast connection.</p>
        <div id="photo"><img src="https://example.com/photo.jpg"></div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image a click handler swaps for a visible image', async () => {
      const value = html`
        <a onclick="before.style.display='none'; after.style.display='inline'">Show after</a>
        <p>Same room, two years apart.</p>
        <p>Before on the left.</p>
        <span id="before"><img src="https://example.com/before.jpg"></span>
        <span id="after" style="display:none"><img src="https://example.com/after.jpg"></span>
      `
      const expected = html`
        <a onclick="before.style.display='none'; after.style.display='inline'">Show after</a>
        <p>Same room, two years apart.</p>
        <p>Before on the left.</p>
        <span id="before"><img src="https://example.com/before.jpg"></span>
        <span id="after"><img src="https://example.com/after.jpg"></span>
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
