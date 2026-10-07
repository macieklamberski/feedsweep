import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildGofundmeEmbeds } from './rebuildGofundmeEmbeds.js'

describeForEachParser('rebuildGofundmeEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildGofundmeEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the large widget from the campaign url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the query the share dialog writes', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large?sharesheet=campaign_page"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a medium widget as the large one', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/medium"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a small button widget as the large one', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/small/donate"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a campaign page url onto its widget', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mint https for an http campaign url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="http://www.gofundme.com/f/save-the-hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should insert the slug as written', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/Save-The-Hall/widget/large"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/Save-The-Hall/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a data-url on a foreign host', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://evil.test/f/save-the-hall/widget/large"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a lookalike host', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://gofundme.com.evil.test/f/save-the-hall/widget/large"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a data-url that is not a url', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="loaded"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a charity widget on another route', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/charity/save-the-hall/widget/donationsbtn"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a campaign route that is not the first segment', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/x/f/save-the-hall"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a campaign route naming no campaign', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should leave a widget div that already holds the player', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        >
          <iframe src="https://www.gofundme.com/f/save-the-hall/widget/large"></iframe>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a widget div carrying a donation link', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/save-the-hall/widget/large"
        >
          <a href="https://www.gofundme.com/f/save-the-hall">Donate</a>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('the specimen widget div', () => {
    it('should rebuild a campaign url with a trailing slash', async () => {
      const value = html`
        <div
          class="gfm-embed"
          data-url="https://www.gofundme.com/f/fire-destroyed-the-crimethinc-mailorder-space/widget/large/"
          style="margin-bottom: 3rem"
        ></div>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/fire-destroyed-the-crimethinc-mailorder-space/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the Flash widget naming the campaign in flashvars', () => {
    it('should rebuild the object with its nested embed into one widget', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          height="338"
          title="Click Here to donate!"
          type="application/x-shockwave-flash"
          width="258"
        >
          <param
            name="movie"
            value="//funds.gofundme.com/Widgetflex.swf"
          />
          <param
            name="quality"
            value="high"
          />
          <param
            name="flashvars"
            value="page=posyfilledpockets&template=1"
          />
          <param
            name="wmode"
            value="transparent"
          />
          <embed
            allowScriptAccess="always"
            src="//funds.gofundme.com/Widgetflex.swf"
            quality="high"
            flashVars="page=posyfilledpockets&template=1"
            type="application/x-shockwave-flash"
            wmode="transparent"
            width="258"
            height="338"
          ></embed>
        </object>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/posyfilledpockets/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a bare embed', async () => {
      const value = html`
        <embed
          src="//funds.gofundme.com/Widgetflex.swf"
          flashvars="page=posyfilledpockets&template=1"
          type="application/x-shockwave-flash"
        />
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/posyfilledpockets/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild an object naming the file in data', async () => {
      const value = html`
        <object
          data="//funds.gofundme.com/Widgetflex.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="flashvars"
            value="page=posyfilledpockets&template=1"
          />
        </object>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/posyfilledpockets/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should insert the page as written', async () => {
      const value = html`
        <embed
          src="//funds.gofundme.com/Widgetflex.swf"
          flashvars="page=3dCamera&template=1"
        />
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/3dCamera/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the widget file on a foreign host', async () => {
      const value = html`
        <embed
          src="https://evil.test/Widgetflex.swf?funds.gofundme.com"
          flashvars="page=posyfilledpockets&template=1"
        />
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave another Flash file on the widget host', async () => {
      const value = html`
        <embed
          src="//funds.gofundme.com/Player.swf"
          flashvars="page=posyfilledpockets&template=1"
        />
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave the widget file naming no page', async () => {
      const value = html`
        <embed
          src="//funds.gofundme.com/Widgetflex.swf"
          flashvars="template=1"
        />
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('the media widget naming the campaign in its id', () => {
    it('should rebuild the empty frame', async () => {
      const value = html`
        <iframe
          class="gfm-media-widget"
          coinfo="1"
          frameborder="0"
          height="100%"
          id="lukejansen-mentoring-music"
          image="1"
          width="100%"
        ></iframe>
      `
      const expected = html`
        <iframe src="https://www.gofundme.com/f/lukejansen-mentoring-music/widget/large"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a frame the loader already pointed somewhere', async () => {
      const value = html`
        <iframe
          class="gfm-media-widget"
          id="lukejansen-mentoring-music"
          src="https://www.gofundme.com/mvc.php?route=widgets/mediawidget&fund=lukejansen-mentoring-music"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a frame of another class', async () => {
      const value = html`
        <iframe
          class="media-widget"
          id="lukejansen-mentoring-music"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <div
        class="gfm-embed"
        data-url="https://www.gofundme.com/f/save-the-hall/widget/large?sharesheet=campaign_page"
      ></div>
      <object data="//funds.gofundme.com/Widgetflex.swf">
        <param
          name="flashvars"
          value="page=posyfilledpockets"
        />
      </object>
      <iframe
        class="gfm-media-widget"
        id="lukejansen-mentoring-music"
      ></iframe>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('rebuildGofundmeEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should surface the widget div into a placeholder and drop the loader script', async () => {
    const value = html`
      <div
        class="gfm-embed"
        data-url="https://www.gofundme.com/f/save-the-hall/widget/medium?sharesheet=campaign_page"
      ></div>
      <script
        defer
        src="https://www.gofundme.com/static/js/embed.js"
      ></script>
    `
    const expected = html`
      <div
        data-embed-url="https://www.gofundme.com/f/save-the-hall"
        data-embed-id="save-the-hall"
        data-embed-provider="gofundme"
        data-embed-src="https://www.gofundme.com/f/save-the-hall/widget/large"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should surface the Flash widget into a placeholder', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        height="338"
        type="application/x-shockwave-flash"
        width="258"
      >
        <param
          name="movie"
          value="//funds.gofundme.com/Widgetflex.swf"
        />
        <param
          name="flashvars"
          value="page=posyfilledpockets&template=1"
        />
        <embed
          src="//funds.gofundme.com/Widgetflex.swf"
          flashVars="page=posyfilledpockets&template=1"
          type="application/x-shockwave-flash"
          width="258"
          height="338"
        ></embed>
      </object>
    `
    const expected = html`
      <div
        data-embed-url="https://www.gofundme.com/f/posyfilledpockets"
        data-embed-id="posyfilledpockets"
        data-embed-provider="gofundme"
        data-embed-src="https://www.gofundme.com/f/posyfilledpockets/widget/large"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should surface the media widget into a placeholder and drop the loader script', async () => {
    const value = html`
      <iframe
        class="gfm-media-widget"
        coinfo="1"
        frameborder="0"
        height="100%"
        id="lukejansen-mentoring-music"
        image="1"
        width="100%"
      ></iframe>
      <script src="//funds.gofundme.com/js/5.0/media-widget.js"></script>
    `
    const expected = html`
      <div
        data-embed-url="https://www.gofundme.com/f/lukejansen-mentoring-music"
        data-embed-id="lukejansen-mentoring-music"
        data-embed-provider="gofundme"
        data-embed-src="https://www.gofundme.com/f/lukejansen-mentoring-music/widget/large"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
