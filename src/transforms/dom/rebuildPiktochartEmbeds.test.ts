import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildPiktochartEmbeds } from './rebuildPiktochartEmbeds.js'

describeForEachParser('rebuildPiktochartEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildPiktochartEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the empty div of the current snippet', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="41b63792605e-speer-it-energie-enquete-2025-copy"
        ></div>
      `
      const expected = html`
        <iframe
          src="https://create.piktochart.com/embed/41b63792605e-speer-it-energie-enquete-2025-copy"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the loading overlay nested in the canvas', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          style="height: 300px; position: relative;"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas">
              <div class="embed-loading-overlay">
                <img width="60px" alt="Loading..." src="https://create.piktochart.com/loading.gif" />
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      `
      const expected = html`
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the uid of the older snippet from pikto-uid', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          pikto-uid="15972881-bsc-blog-11"
          style="height: 300px; position: relative;"
        >
          <div class="embed-loading-overlay">
            <img width="60px" alt="Loading..." src="https://magic.piktochart.com/loading.gif" />
            <p>Loading...</p>
          </div>
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas"></div>
          </div>
        </div>
      `
      const expected = html`
        <iframe src="https://create.piktochart.com/embed/15972881-bsc-blog-11"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the loading text WordPress writes with an ellipsis', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          style="height: 300px; position: relative;"
          data-uid="31309561-moving-stats-california"
        >
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas">
              <div class="embed-loading-overlay">
                <img width="60px" alt="Loading..." src="https://create.piktochart.com/loading.gif" />
                <p>Loading&#8230;</p>
              </div>
            </div>
          </div>
        </div>
      `
      const expected = html`
        <iframe src="https://create.piktochart.com/embed/31309561-moving-stats-california"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the sentence written inside the loading overlay', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          pikto-uid="12065746-ms-project-different-variants-conflict-copy"
          style="height: 300px; position: relative;"
        >
          <div class="embed-loading-overlay">
            <img alt="Loading..." src="https://magic.piktochart.com/loading.gif" width="60px" /><br />
            <div style="font-size: 16px; font-weight: 600;">Loading...</div>This post covers the different variants of MS Project.</div>
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas"></div>
          </div>
        </div>
      `
      const expected =
        'This post covers the different variants of MS Project.<iframe src="https://create.piktochart.com/embed/12065746-ms-project-different-variants-conflict-copy"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the image link and paragraph written inside the loading overlay', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          pikto-uid="12065239-ms-project-what-was-new"
          style="height: 300px; position: relative;"
        >
          <div class="embed-loading-overlay">
            <div class="separator">
              <a href="https://example.com/ms-project.png"><img src="https://example.com/ms-project.png" /></a>
            </div>
            <div style="text-align: justify;">There are different versions of MS Project.</div>
            <img alt="Loading..." src="https://magic.piktochart.com/loading.gif" width="60px" /><br />
            <div style="font-size: 16px; font-weight: 600;">Loading...</div>
          </div>
          <div class="pikto-canvas-wrap">
            <div class="pikto-canvas"></div>
          </div>
        </div>
      `
      const expected = html`
        <div class="separator">
          <a href="https://example.com/ms-project.png"><img src="https://example.com/ms-project.png"></a>
        </div>
        <div style="text-align: justify;">There are different versions of MS Project.</div>
        <iframe src="https://create.piktochart.com/embed/12065239-ms-project-what-was-new"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should pass the uid on as written', async () => {
      const value = '<div class="piktowrapper-embed" data-uid="30289406-NEW-PIKTOCHART-COPY"></div>'
      const expected =
        '<iframe src="https://create.piktochart.com/embed/30289406-NEW-PIKTOCHART-COPY"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave a snippet with a blank uid alone', async () => {
      const value = '<div class="piktowrapper-embed" data-uid=""></div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a div with a uid but not the snippet class alone', async () => {
      const value = '<div data-uid="25180247-creatividad_pensamiento-critico"></div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a loading gif on a foreign host', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <img src="https://evil.test/loading.gif" />
        </div>
      `
      const expected = html`
        <img src="https://evil.test/loading.gif">
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep another image on the Piktochart host', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <img src="https://create.piktochart.com/x/loading.gif" />
        </div>
      `
      const expected = html`
        <img src="https://create.piktochart.com/x/loading.gif">
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a paragraph that says more than the loading text', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <p>Loading... the full chart takes a moment.</p>
        </div>
      `
      const expected = html`
        <p>Loading... the full chart takes a moment.</p>
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a paragraph that only ends in the loading text', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <p>Still Loading...</p>
        </div>
      `
      const expected = html`
        <p>Still Loading...</p>
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a line break with text between it and the loading gif', async () => {
      const value =
        '<div class="piktowrapper-embed" data-uid="25180247-creatividad_pensamiento-critico"><img src="https://create.piktochart.com/loading.gif">First line<br>Second line</div>'
      const expected =
        'First line<br>Second line<iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a div holding a publisher image beside the loading text', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <div class="embed-loading-overlay">
            <div><img src="https://example.com/photo.jpg" />Loading...</div>
          </div>
        </div>
      `
      const expected = html`
        <div><img src="https://example.com/photo.jpg">Loading...</div>
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a line break that does not follow the loading gif', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
        >
          <p>First line<br />Second line</p>
        </div>
      `
      const expected = html`
        <p>First line<br>Second line</p>
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('edge cases', () => {
    it('should prefer data-uid when both attributes name a uid', async () => {
      const value = html`
        <div
          class="piktowrapper-embed"
          data-uid="25180247-creatividad_pensamiento-critico"
          pikto-uid="15972881-bsc-blog-11"
        ></div>
      `
      const expected = html`
        <iframe src="https://create.piktochart.com/embed/25180247-creatividad_pensamiento-critico"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <p>Before</p>
        <div
          class="piktowrapper-embed"
          pikto-uid="12065746-ms-project-different-variants-conflict-copy"
        >
          <div class="embed-loading-overlay">
            <img alt="Loading..." src="https://magic.piktochart.com/loading.gif" /><br />
            <div>Loading...</div>
            This post covers the different variants of MS Project.
          </div>
        </div>
        <p>After</p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildPiktochartEmbeds in the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the sentence beside the placeholder', async () => {
    const value = html`
      <div
        class="piktowrapper-embed"
        pikto-uid="12065746-ms-project-different-variants-conflict-copy"
        style="height: 300px; position: relative;"
      >
        <div
          class="embed-loading-overlay"
          style="height: 100%; position: absolute; text-align: center; width: 100%;"
        >
          <img alt="Loading..." src="https://magic.piktochart.com/loading.gif" style="margin-top: 100px;" width="60px" /><br />
          <div style="font-size: 16px; font-weight: 600; margin: 0; padding: 0;">Loading...</div>This post covers the different variants of MS Project like Standard, Online , Project Server etc.</div>
        <div class="pikto-canvas-wrap">
          <div class="pikto-canvas"></div>
        </div>
      </div>
    `
    const expected = html`
      <p>This post covers the different variants of MS Project like Standard, Online , Project Server etc.</p>
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/12065746-ms-project-different-variants-conflict-copy"
        data-embed-id="12065746-ms-project-different-variants-conflict-copy"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/12065746-ms-project-different-variants-conflict-copy"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the image link and paragraph beside the placeholder', async () => {
    const value = html`
      <div
        class="piktowrapper-embed"
        pikto-uid="12065239-ms-project-what-was-new"
        style="height: 300px; position: relative;"
      >
        <div
          class="embed-loading-overlay"
          style="height: 100%; position: absolute; text-align: center; width: 100%;"
        >
          <div class="separator" style="clear: both; text-align: center;">
            <a href="https://example.com/ms-project.png" imageanchor="1"><img border="0" src="https://example.com/ms-project.png" /></a>
          </div>
          <div style="text-align: justify;">There are different versions of MS Project.</div>
          <img alt="Loading..." src="https://magic.piktochart.com/loading.gif" style="margin-top: 100px;" width="60px" /><br />
          <div style="font-size: 16px; font-weight: 600; margin: 0; padding: 0;">Loading...</div>
        </div>
        <div class="pikto-canvas-wrap">
          <div class="pikto-canvas"></div>
        </div>
      </div>
    `
    const expected = html`
      <a href="https://example.com/ms-project.png" imageanchor="1"><img data-align="center" border="0" src="https://example.com/ms-project.png"></a>
      <p>There are different versions of MS Project.</p>
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/12065239-ms-project-what-was-new"
        data-embed-id="12065239-ms-project-what-was-new"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/12065239-ms-project-what-was-new"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep the prose before and after the snippet', async () => {
    const value = html`
      <p>Here is the infographic.</p>
      <div
        class="piktowrapper-embed"
        data-uid="25785770-basketball-search-terms"
        style="height: 300px; position: relative;"
      >
        <div class="pikto-canvas-wrap">
          <div class="pikto-canvas">
            <div class="embed-loading-overlay">
              <img alt="Loading..." src="https://create.piktochart.com/loading.gif" width="60px" /><br />
              <div>Loading...</div>
            </div>
          </div>
        </div>
      </div>
      <p>Thanks for reading.</p>
    `
    const expected = html`
      <p>Here is the infographic.</p>
      <div
        data-embed-ratio="1/2"
        data-embed-url="https://create.piktochart.com/output/25785770-basketball-search-terms"
        data-embed-id="25785770-basketball-search-terms"
        data-embed-provider="piktochart"
        data-embed-src="https://create.piktochart.com/embed/25785770-basketball-search-terms"
      ></div>
      <p>Thanks for reading.</p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
