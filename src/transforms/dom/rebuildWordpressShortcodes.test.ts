import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildWordpressShortcodes } from './rebuildWordpressShortcodes.js'

describeForEachParser('rebuildWordpressShortcodes', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildWordpressShortcodes(baseContext)])
  }

  describe('youtube url', () => {
    it('should rebuild the player from a url with its sizes', async () => {
      const value = '<p>[youtube http://www.youtube.com/watch?v=5rgHF0dwPV0&w=480&h=360]</p>'
      const expected =
        '<p><iframe src="http://www.youtube.com/watch?v=5rgHF0dwPV0&amp;w=480&amp;h=360"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a url after an equals sign', async () => {
      const value = '<p>[youtube=http://www.youtube.com/watch?v=Gdir9NGCMLg]</p>'
      const expected = '<p><iframe src="http://www.youtube.com/watch?v=Gdir9NGCMLg"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a link onto its own url', async () => {
      const value = html`
        <p>[youtube <a href="http://www.youtube.com/watch?v=DTYsElEGswc">http://www.youtube.com/watch?v=DTYsElEGswc</a>]</p>
      `
      const expected = '<p><iframe src="http://www.youtube.com/watch?v=DTYsElEGswc"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a label that names no url', async () => {
      const value = '<p>Listen on [YouTube musicpioneerpodcast] every week.</p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('youtube around a value', () => {
    it('should rebuild the player from a video id', async () => {
      const value = '<p>[youtube]X3FbfBevHBs[/youtube]</p>'
      const expected = '<p><iframe src="https://www.youtube.com/embed/X3FbfBevHBs"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a video id in uppercase bbcode', async () => {
      const value = '<p>[YOUTUBE]DPOgo67EiMM[/YOUTUBE]</p>'
      const expected = '<p><iframe src="https://www.youtube.com/embed/DPOgo67EiMM"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a url', async () => {
      const value = '<p>[youtube]http://www.youtube.com/watch?v=9lkuG2jYktg[/youtube]</p>'
      const expected = '<p><iframe src="http://www.youtube.com/watch?v=9lkuG2jYktg"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a link onto its own url', async () => {
      const value = html`
        <p>[youtube]<a href="http://www.youtube.com/watch?v=jh7Dz18ghjE">http://www.youtube.com/watch?v=jh7Dz18ghjE</a>[/youtube]</p>
      `
      const expected = '<p><iframe src="http://www.youtube.com/watch?v=jh7Dz18ghjE"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from the url a link shows', async () => {
      const value = html`
        <p>[youtube]<a href="https://example.com/?URL=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dl5qwSPbSHZA">http://www.youtube.com/watch?v=l5qwSPbSHZA</a>[/youtube]</p>
      `
      const expected = '<p><iframe src="http://www.youtube.com/watch?v=l5qwSPbSHZA"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a link to a video outside a shortcode', async () => {
      const value = html`
        <p>Watch <a href="https://www.youtube.com/watch?v=tgB9bcggBoE">https://www.youtube.com/watch?v=tgB9bcggBoE</a> today.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: a real specimen with its closer replaced by the prose that follows it elsewhere.
    it('should keep a link after an opener that is never closed', async () => {
      const value = html`
        <p>[youtube]<a href="http://www.youtube.com/watch?v=jh7Dz18ghjE">http://www.youtube.com/watch?v=jh7Dz18ghjE</a> Film à voir.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a value the publisher broke', async () => {
      const value =
        '<p>[youtube]qhIMQOx6eV8&amp;list=PLKQT-1Rv4Yr3Be_cJCQMveuSAh5Y1CASB&amp;index=8&amp;t=0s[/youtube]</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a shortcode shown as code', async () => {
      const value = '<pre><code>[youtube]xKOY8zJx2Q4[/youtube]</code></pre>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the linked specimen above shown as code.
    it('should keep a linked shortcode shown as code', async () => {
      const value =
        '<pre><code>[youtube]<a href="http://www.youtube.com/watch?v=jh7Dz18ghjE">http://www.youtube.com/watch?v=jh7Dz18ghjE</a>[/youtube]</code></pre>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('embed', () => {
    it('should rebuild the player from a YouTube url', async () => {
      const value = '<p>[embed]https://www.youtube.com/watch?v=tgB9bcggBoE[/embed]</p>'
      const expected = '<p><iframe src="https://www.youtube.com/watch?v=tgB9bcggBoE"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a Vimeo url', async () => {
      const value = '<p>[embed]http://vimeo.com/435815756[/embed]</p>'
      const expected = '<p><iframe src="http://vimeo.com/435815756"></iframe></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the text the shortcode is glued to', async () => {
      const value = html`
        <p>Agora com desconto de $350 nos EUA.[embed]https://www.youtube.com/watch?v=tgB9bcggBoE[/embed]</p>
      `
      const expected = html`
        <p>Agora com desconto de $350 nos EUA.<iframe src="https://www.youtube.com/watch?v=tgB9bcggBoE"></iframe></p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild the player from a link onto its own url', async () => {
      const value = html`
        <p>[embed]<a href="https://www.facebook.com/YogaVidya/videos/616620195822540/">https://www.facebook.com/YogaVidya/videos/616620195822540/</a>[/embed]</p>
      `
      const expected = html`
        <p><iframe src="https://www.facebook.com/YogaVidya/videos/616620195822540/"></iframe></p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Constructed: a real unclaimed specimen with the url autolinked onto itself.
    it('should keep a link onto a url no resolver claims', async () => {
      const value = html`
        <p>[embed]<a href="https://quizlet.com/413785651/flashcards/embed">https://quizlet.com/413785651/flashcards/embed</a>[/embed]</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: a real specimen with prose between the opener and the link.
    it('should keep a link the opener does not touch', async () => {
      const value = html`
        <p>[embed] Mira esto: <a href="https://www.youtube.com/watch?v=tgB9bcggBoE">https://www.youtube.com/watch?v=tgB9bcggBoE</a>[/embed]</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a url no resolver claims', async () => {
      const value =
        '<p>[embed]https://quizlet.com/413785651/flashcards/embed?i=24veoc&amp;x=1jj1[/embed]</p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('caption', () => {
    it('should rebuild a figure from an image and the text after it', async () => {
      const value = html`
        [caption id="attachment_1128250" align="aligncenter" width="1200"]<img class="size-full wp-image-1128250" src="https://example.com/wp-content/uploads/2026/07/Kusan-City-of-Wolves-Provato-della-demo_2.webp" alt="Kusan: City of Wolves – Provato della demo 2" width="1200" height="675" /> Kusan: City of Wolves Provato della demo 2[/caption]
      `
      const expected = html`
        <figure>
          <img class="size-full wp-image-1128250" src="https://example.com/wp-content/uploads/2026/07/Kusan-City-of-Wolves-Provato-della-demo_2.webp" alt="Kusan: City of Wolves – Provato della demo 2" width="1200" height="675">
          <figcaption> Kusan: City of Wolves Provato della demo 2</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the link around the image', async () => {
      const value = html`
        [caption id="attachment_66731" align="alignright" width="519"]<a href="https://example.com/app/uploads/2024/09/20240903_110159-e1725618098563.jpg"><img class="wp-image-66731" src="https://example.com/app/uploads/2024/09/20240903_110159-e1725618098563.jpg" alt="foto colorida" width="519" height="278" /></a> Fernanda Pedrazzi e Jorge Cruz[/caption]
      `
      const expected = html`
        <figure>
          <a href="https://example.com/app/uploads/2024/09/20240903_110159-e1725618098563.jpg"><img class="wp-image-66731" src="https://example.com/app/uploads/2024/09/20240903_110159-e1725618098563.jpg" alt="foto colorida" width="519" height="278"></a>
          <figcaption> Fernanda Pedrazzi e Jorge Cruz</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a line break inside the caption text', async () => {
      const value = html`
        [caption id="attachment_8061" align="aligncenter" width="455"]<img class="wp-image-8061" src="http://example.com/wp-content/uploads/2017/02/37_1Flauta.jpg" alt="instrumentos musicales chino" width="455" height="455" /> 笛子 (dízi)<br />Flauta transversal de bambú[/caption]
      `
      const expected = html`
        <figure>
          <img class="wp-image-8061" src="http://example.com/wp-content/uploads/2017/02/37_1Flauta.jpg" alt="instrumentos musicales chino" width="455" height="455">
          <figcaption> 笛子 (dízi)<br>Flauta transversal de bambú</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should take the caption from the caption attribute', async () => {
      const value = html`
        [caption id="" align="aligncenter" width="425" caption="Happy Valentine Day from Good Morning Kuching Show"]<img alt="" height="283" src="http://example.com/material/news/HappyValentinesDay.png" width="425" />[/caption]
      `
      const expected = html`
        <figure>
          <img alt="" height="283" src="http://example.com/material/news/HappyValentinesDay.png" width="425">
          <figcaption>Happy Valentine Day from Good Morning Kuching Show</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the image alone when there is no caption', async () => {
      const value = html`
        [caption id="attachment_3381" align="aligncenter" width="620"]<a href="http://example.com/wp-content/uploads/2010/12/summify.png"><img src="https://example.com/images/summify-620x491.png" alt="Summify screenshot" title="Summify"></a>[/caption]
      `
      const expected = html`
        <a href="http://example.com/wp-content/uploads/2010/12/summify.png"><img src="https://example.com/images/summify-620x491.png" alt="Summify screenshot" title="Summify"></a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a caption around a link whose image is gone', async () => {
      const value = html`
        [caption id="attachment_1322" align="aligncenter" width="300" caption="timigraphie"]<a href="http://example.com/philippe/2014/08/timigraphies/timigraphies-ria-etel/"></a>[/caption]
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a caption with no image', async () => {
      const value =
        '[caption id="attachment_21469" align="alignnone" width="726"] IPC en la Eurozona entre febrero -marzo 2024[/caption]'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a caption the excerpt cut before its closer', async () => {
      const value = html`
        [caption id="attachment_20786" align="alignnone" width="300"]<img class="size-full wp-image-20786" src="http://example.com/wp-content/uploads/2025/07/jacket.webp" alt="trapstar jacket" width="300" height="300"> trapstar jacket
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Constructed: the caption attribute of a real specimen respelled with the curly quotes
    // wptexturize writes, which one sampled feed carries on a caption with no image.
    it('should keep a caption attribute in quotes it cannot read', async () => {
      const value = html`
        [caption id="" align="aligncenter" width="425" caption=&#8221;Happy Valentine Day&#8221;]<img alt="" height="283" src="http://example.com/material/news/HappyValentinesDay.png" width="425" />[/caption]
      `
      const expected = html`
        [caption id="" align="aligncenter" width="425" caption=”Happy Valentine Day”]<img alt="" height="283" src="http://example.com/material/news/HappyValentinesDay.png" width="425">[/caption]
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('gallery', () => {
    it('should drop a gallery of attachment ids on its own paragraph', async () => {
      const value = html`
        <p>Les voici :</p>
        <p>[gallery ids="399,404,398" type="rectangular"]</p>
      `
      const expected = html`
        <p>Les voici :</p>
        <p></p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop a bare gallery on its own line', async () => {
      const value = '<p>Our job queue.</p>\n<div>[gallery]\n\n</div>'
      const expected = '<p>Our job queue.</p>\n<div>\n\n</div>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a gallery that carries its items', async () => {
      const value = html`
        <p>[gallery width="258" height="186" columns="3"]<br />
        [gallery_item src="https://example.com/images/Lubcza/2017/1.jpg"] Poświęcenie pojazdu OSP Lubcza [/gallery_item]<br />
        [/gallery]</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a gallery glued to the text before it', async () => {
      const value = '<p>We have more jobs in our job queue. Exciting times![gallery]</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a gallery glued to the text after it', async () => {
      const value = '<p>[gallery search engine](https://example.com/js/search_favPictures.js)</p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a gallery shown as code', async () => {
      const value = '<p><code>[gallery]</code></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a gallery that shares its line with prose', async () => {
      const value = html`
        <p>Ce billet explore l'évolution des shortcodes de WordPress, ces balises dynamiques comme [gallery id="123"], en les modernisant.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <p>[youtube http://www.youtube.com/watch?v=5rgHF0dwPV0&w=480&h=360]</p>
      <p>[caption id="attachment_1128250" align="aligncenter" width="1200"]<img src="https://example.com/demo_2.webp" alt="" /> Provato della demo 2[/caption]</p>
      <p>[gallery ids="399,404,398" type="rectangular"]</p>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('rebuildWordpressShortcodes through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn a sized youtube shortcode into the player', async () => {
    const value = '<p>[youtube https://www.youtube.com/watch?v=ZAUwnPgbUas&amp;w=560&amp;h=315]</p>'
    const expected =
      '<div data-embed-ratio="16/9" data-embed-thumbnail="https://i.ytimg.com/vi/ZAUwnPgbUas/hqdefault.jpg" data-embed-url="https://www.youtube.com/watch?v=ZAUwnPgbUas" data-embed-id="ZAUwnPgbUas" data-embed-provider="youtube" data-embed-src="https://www.youtube.com/embed/ZAUwnPgbUas"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn a caption into a figure', async () => {
    const value = html`
      <p>[caption id="attachment_329" align="alignright" width="211"]<img class="wp-image-329" alt="Sweater Scraps" src="https://example.com/files/blog_photo-97.jpg" width="211" height="158"> Sweater Scraps[/caption]</p>
    `
    const expected = html`
      <figure><img class="wp-image-329" alt="Sweater Scraps" src="https://example.com/files/blog_photo-97.jpg" width="211" height="158"><figcaption> Sweater Scraps</figcaption></figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop a bare gallery after a no-break space', async () => {
    const value = '<p>Photos</p><div>&nbsp;[gallery]\n\n</div>'
    const expected = '<p>Photos</p>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop the paragraph an id-only gallery leaves empty', async () => {
    const value = html`
      <p>Les voici :</p>
      <p>[gallery ids="399,404,398" type="rectangular"]</p>
    `
    const expected = '<p>Les voici :</p>'

    expect(await convert(value)).toEqualHtml(expected)
  })
})
