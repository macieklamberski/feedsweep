import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { linkifyGistEmbeds } from './linkifyGistEmbeds.js'

describeForEachParser('linkifyGistEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [linkifyGistEmbeds(baseContext)])
  }

  it('should replace a gist script with a link to the gist', async () => {
    const value = '<script src="https://gist.github.com/octocat/6cad326836d38bd3a7ae.js"></script>'
    const expected = html`
      <a
        href="https://gist.github.com/octocat/6cad326836d38bd3a7ae"
      >https://gist.github.com/octocat/6cad326836d38bd3a7ae</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should handle a user-less gist url', async () => {
    const value = '<script src="https://gist.github.com/6cad326836d38bd3a7ae.js"></script>'
    const expected = html`
      <a
        href="https://gist.github.com/6cad326836d38bd3a7ae"
      >https://gist.github.com/6cad326836d38bd3a7ae</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // gist.github.com answers an uppercase id on the user-less route with a redirect to the gist.
  it('should link a user-less gist script whose id is uppercase', async () => {
    const value = '<script src="https://gist.github.com/6CAD326836D38BD3A7AE.js"></script>'
    const expected = html`
      <a
        href="https://gist.github.com/6CAD326836D38BD3A7AE"
      >https://gist.github.com/6CAD326836D38BD3A7AE</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should drop a trailing ?file= query when building the link', async () => {
    const value = html`
      <script src="https://gist.github.com/octocat/6cad326836d38bd3a7ae.js?file=demo.py"></script>
    `
    const expected = html`
      <a
        href="https://gist.github.com/octocat/6cad326836d38bd3a7ae"
      >https://gist.github.com/octocat/6cad326836d38bd3a7ae</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an amp-gist with a link built from the bare gist id', async () => {
    const value = html`
      <amp-gist
        data-gistid="b9bb35bc68df68259af94430f012425f"
        layout="fixed-height"
        height="225"
      ></amp-gist>
    `
    const expected = html`
      <a
        href="https://gist.github.com/b9bb35bc68df68259af94430f012425f"
      >https://gist.github.com/b9bb35bc68df68259af94430f012425f</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should link an amp-gist whose gist id is uppercase', async () => {
    const value = '<amp-gist data-gistid="B9BB35BC68DF68259AF94430F012425F"></amp-gist>'
    const expected = html`
      <a
        href="https://gist.github.com/B9BB35BC68DF68259AF94430F012425F"
      >https://gist.github.com/B9BB35BC68DF68259AF94430F012425F</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should use a malformed gist id as written, even if the link answers an error', async () => {
    const value = '<amp-gist data-gistid="../../evil"></amp-gist>'
    const expected =
      '<a href="https://gist.github.com/../../evil">https://gist.github.com/../../evil</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should use a gist id carrying a trailing path as written', async () => {
    const value = '<amp-gist data-gistid="b9bb35bc68df68259af94430f012425f/raw"></amp-gist>'
    const expected =
      '<a href="https://gist.github.com/b9bb35bc68df68259af94430f012425f/raw">https://gist.github.com/b9bb35bc68df68259af94430f012425f/raw</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should use a malformed gist script id as written, even if the link answers an error', async () => {
    const value = html`
      <script src="https://gist.github.com/octocat/6cad326836d38bd3a7ae%2Fraw.js"></script>
    `
    const expected =
      '<a href="https://gist.github.com/octocat/6cad326836d38bd3a7ae%2Fraw">https://gist.github.com/octocat/6cad326836d38bd3a7ae%2Fraw</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an amp-gist with an empty gist id untouched', async () => {
    const value = '<amp-gist data-gistid=""></amp-gist>'

    expect(await transform(value)).toEqualHtml(value)
  })

  // A script pointing at the gist page rather than its `.js` embed names no gist to link to,
  // so nothing is minted from it.
  it('should leave a gist script that names no embed untouched', async () => {
    const value = '<script src="https://gist.github.com/octocat"></script>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a non-gist script untouched', async () => {
    const value = '<script src="https://example.com/widget.js"></script>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace a gist-Blogger mount holding its loader with a link to the gist', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="5362350"
        id="gist-5362350"
      >
        <script
          src="https://raw.github.com/moski/gist-Blogger/master/public/gistLoader.js"
          type="text/javascript"
        ></script>
      </div>
    `
    const expected = '<a href="https://gist.github.com/5362350">https://gist.github.com/5362350</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an empty gist-Blogger mount with a link to the gist', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="5203217"
        id="gist-5203217"
      ></div>
    `
    const expected = '<a href="https://gist.github.com/5203217">https://gist.github.com/5203217</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a gist-Blogger mount holding its loading text with a link to the gist', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="4343332"
        id="gist-GistID"
      >
        Loading ....
      </div>
    `
    const expected = '<a href="https://gist.github.com/4343332">https://gist.github.com/4343332</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a gist-Blogger mount whose loading text ends in line breaks', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="6414925"
        id="gist-6414925"
      >Loading ....<br><br></div>
    `
    const expected = '<a href="https://gist.github.com/6414925">https://gist.github.com/6414925</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a gist-Blogger mount the feed left open around the rest of the post', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="4343449"
        id="gist-GistID"
      >Loading ....<br>It extension point is for the application model, in fact, as the document.</div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a gist-Blogger mount that already holds the code', async () => {
    const value = html`
      <div
        class="gistLoad"
        id="gist-98d6a5d85ccd450370a947b6dd60076a"
        data-file="usage.sh"
        data-id="98d6a5d85ccd450370a947b6dd60076a"
      ><pre>./rotate.sh -u "jenkins-deployment"</pre></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace a gist-embed code element with a link to the gist', async () => {
    const value = html`
      <p><code data-gist-id="57c54d734aed4f719c19109a7afddc93"> </code></p>
    `
    const expected = html`
      <p><a href="https://gist.github.com/57c54d734aed4f719c19109a7afddc93">https://gist.github.com/57c54d734aed4f719c19109a7afddc93</a></p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should use a gist-embed id that names the owner as written', async () => {
    const value = html`
      <code
        class="gist-embed-code"
        data-gist-id="fwhigh/92a985dd8c494949a36433641c14e2e6"
        data-gist-hide-footer="false"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/fwhigh/92a985dd8c494949a36433641c14e2e6"
      >https://gist.github.com/fwhigh/92a985dd8c494949a36433641c14e2e6</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a gist-embed div with a link to the gist', async () => {
    const value = html`
      <div
        data-gist-id="d820e27ea986698789b93f56d3fae7fd"
        data-gist-hide-footer="true"
        data-gist-line="140-150"
      ></div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/d820e27ea986698789b93f56d3fae7fd"
      >https://gist.github.com/d820e27ea986698789b93f56d3fae7fd</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a gist-Blogger mount that already links to the gist', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="4045718"
        id="gist-4045718"
      ><a href="https://gist.github.com/deanberris/4045718#file-polymorphism-0-cpp">View in GitHub</a></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should link the gist script inside a gist-embed div, not the div', async () => {
    const value = html`
      <div
        class="gist"
        data-gist-id="your-gist-id"
      ><script src="https://gist.github.com/fournet/8f94607c600e0d78d640148003f021f6.js"></script></div>
    `
    const expected = html`
      <div
        class="gist"
        data-gist-id="your-gist-id"
      ><a href="https://gist.github.com/fournet/8f94607c600e0d78d640148003f021f6">https://gist.github.com/fournet/8f94607c600e0d78d640148003f021f6</a></div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should point the link at the file a gist-embed mount names', async () => {
    const value = html`
      <div
        data-gist-id="4acb19b6ac4e965552ba6961e1bc9054"
        data-gist-file="reduce.kt"
      >reduce.kt</div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/4acb19b6ac4e965552ba6961e1bc9054#file-reduce-kt"
      >https://gist.github.com/4acb19b6ac4e965552ba6961e1bc9054#file-reduce-kt</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should lowercase the file name in the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="f3f82bd3d865e9c66466c38c247d6584"
        data-gist-file="BuildElectron.cs"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/f3f82bd3d865e9c66466c38c247d6584#file-buildelectron-cs"
      >https://gist.github.com/f3f82bd3d865e9c66466c38c247d6584#file-buildelectron-cs</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep underscores and hyphens of the file name in the anchor', async () => {
    const value = html`
      <code
        class="gist"
        data-gist-file="activity_main.xml"
        data-gist-hide-footer="true"
        data-gist-id="8e43146623403f3eb34e"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/8e43146623403f3eb34e#file-activity_main-xml"
      >https://gist.github.com/8e43146623403f3eb34e#file-activity_main-xml</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // GitHub spells this file's anchor `file-funciones-de-agregacion-min-max-count-sum-avg-sql`.
  it('should fold accents and runs of punctuation in the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="dd56efffcf9510513dc8bb9477f6ffa2"
        data-gist-file="Funciones de agregación (\`MIN\`, \`MAX\`, \`COUNT\`, \`SUM\`, \`AVG\`).sql"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/dd56efffcf9510513dc8bb9477f6ffa2#file-funciones-de-agregacion-min-max-count-sum-avg-sql"
      >https://gist.github.com/dd56efffcf9510513dc8bb9477f6ffa2#file-funciones-de-agregacion-min-max-count-sum-avg-sql</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // GitHub spells this file's anchor `file-qx-20261003-conf`.
  it('should collapse a run of dashes in the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="90a5ecbb0778132650e9bcb60bb0a383"
        data-gist-file="QX-通用白板-20261003.conf"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/90a5ecbb0778132650e9bcb60bb0a383#file-qx-20261003-conf"
      >https://gist.github.com/90a5ecbb0778132650e9bcb60bb0a383#file-qx-20261003-conf</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // GitHub spells this file's anchor `file-rust-md`.
  it('should trim a leading dash from the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="163bac31f4a926953c900b726562cb92"
        data-gist-file="シニアエンジニアのためのRust集中写経チュートリアル設計ドラフト.md"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/163bac31f4a926953c900b726562cb92#file-rust-md"
      >https://gist.github.com/163bac31f4a926953c900b726562cb92#file-rust-md</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // GitHub ends this file's anchor in `-avg`, with no dash after it.
  it('should trim a trailing dash from the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="d2deaf1eba9694d94545cbc5fbceda5b"
        data-gist-file="CONSULTAS SQL: FUNCIONES DE AGREGACIÓN (MIN, MAX, COUNT, SUM, AVG)"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/d2deaf1eba9694d94545cbc5fbceda5b#file-consultas-sql-funciones-de-agregacion-min-max-count-sum-avg"
      >https://gist.github.com/d2deaf1eba9694d94545cbc5fbceda5b#file-consultas-sql-funciones-de-agregacion-min-max-count-sum-avg</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should point the link at the file a gist-Blogger mount names', async () => {
    const value = html`
      <div
        class="gistLoad"
        id="gist-323652f344edcd867451582b0d2aa929"
        data-file="rotate.sh"
        data-id="323652f344edcd867451582b0d2aa929"
      >Loading ....</div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/323652f344edcd867451582b0d2aa929#file-rotate-sh"
      >https://gist.github.com/323652f344edcd867451582b0d2aa929#file-rotate-sh</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // GitHub spells the anchor of a file named `-` as `file-`.
  it('should trim dashes from the edges of the anchor the way GitHub does', async () => {
    const value = html`
      <code
        data-gist-id="c368a3d6d13bfbd32218bb31acfd5d99"
        data-gist-file="-"
      ></code>
    `
    const expected = html`
      <a
        href="https://gist.github.com/c368a3d6d13bfbd32218bb31acfd5d99#file-"
      >https://gist.github.com/c368a3d6d13bfbd32218bb31acfd5d99#file-</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a div naming an id without the gistLoad class untouched', async () => {
    const value = '<div data-id="5362350"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a gist-embed code element with an empty gist id untouched', async () => {
    const value = '<code data-gist-id=""></code>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace a gist-oembed mount with a link to the gist its .json path names', async () => {
    const value = html`
      <div
        class="gist-oembed"
        data-gist="ayr-ton/8731331ea64583b0b3fc.json"
      ></div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/ayr-ton/8731331ea64583b0b3fc"
      >https://gist.github.com/ayr-ton/8731331ea64583b0b3fc</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a Laravel Playground mount with a link to its gist', async () => {
    const value = html`
      <div
        class="laravel-playground"
        data-filename="index.php"
        data-gist="d990a2c5f23b50564561b9266252f501"
      ></div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/d990a2c5f23b50564561b9266252f501"
      >https://gist.github.com/d990a2c5f23b50564561b9266252f501</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a Stargazer mount with a link to its gist', async () => {
    const value = html`
      <div
        class="stargazer with-controls labels"
        data-gist="6e54093b297c0f9df01d0c82f65b89f6"
        data-name="Server"
      ></div>
    `
    const expected = html`
      <a
        href="https://gist.github.com/6e54093b297c0f9df01d0c82f65b89f6"
      >https://gist.github.com/6e54093b297c0f9df01d0c82f65b89f6</a>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a div.gist mount naming a numeric gist id with a link to the gist', async () => {
    const value = html`
      <div
        class="gist"
        data-gist="2571207"
      ></div>
    `
    const expected = '<a href="https://gist.github.com/2571207">https://gist.github.com/2571207</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // gist.github.com answers an uppercase id on the user-less route with a redirect to the gist.
  it('should link a data-gist mount whose gist id is uppercase', async () => {
    const value = '<div class="gist" data-gist="6E54093B297C0F9DF01D0C82F65B89F6"></div>'
    const expected =
      '<a href="https://gist.github.com/6E54093B297C0F9DF01D0C82F65B89F6">https://gist.github.com/6E54093B297C0F9DF01D0C82F65B89F6</a>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a TweaksWP mount whose data-gist is a post slug untouched', async () => {
    const value = html`
      <div
        class="wp-block-html gist-embed-placeholder is-layout-flow wp-block-group-is-layout-flow"
        data-gist="tweakswp-12-filters-replace-plugins"
      ></div>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a data-gist mount whose value only starts with a gist id untouched', async () => {
    const value = '<div data-gist="2571207-draft"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a data-gist mount whose value only ends in a gist id untouched', async () => {
    const value = '<div data-gist="draft-2571207"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a data-gist mount that holds a whole gist url untouched', async () => {
    const value = '<div data-gist="https://gist.github.com/victorvhpg/5853429a825c94314884"></div>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = '<script src="https://gist.github.com/octocat/6cad326836d38bd3a7ae.js"></script>'
    const once = await transform(value)
    const twice = await applyDomTransforms(parseHtml(once), [linkifyGistEmbeds(baseContext)])

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('gist carriers the pipeline would otherwise delete', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep a gist script as a link to the gist', async () => {
    const value = '<script src="https://gist.github.com/octocat/6cad326836d38bd3a7ae.js"></script>'
    const expected = html`
      <p>
        <a
          href="https://gist.github.com/octocat/6cad326836d38bd3a7ae"
        >https://gist.github.com/octocat/6cad326836d38bd3a7ae</a>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a gist-Blogger mount as a link to the gist', async () => {
    const value = html`
      <div
        class="gistLoad"
        data-id="4343332"
        id="gist-GistID"
      >
        Loading ....
      </div>
    `
    const expected = html`
      <p><a href="https://gist.github.com/4343332">https://gist.github.com/4343332</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a gist-oembed mount as a link to the gist', async () => {
    const value = html`
      <div
        class="gist-oembed"
        data-gist="akkornel/b9cd992af449f0573285f1187aabfd9d.json"
      ></div>
    `
    const expected = html`
      <p><a href="https://gist.github.com/akkornel/b9cd992af449f0573285f1187aabfd9d">https://gist.github.com/akkornel/b9cd992af449f0573285f1187aabfd9d</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a gist-embed code element as a link to the gist', async () => {
    const value = html`
      <p><code data-gist-id="57c54d734aed4f719c19109a7afddc93"> </code></p>
    `
    const expected = html`
      <p><a href="https://gist.github.com/57c54d734aed4f719c19109a7afddc93">https://gist.github.com/57c54d734aed4f719c19109a7afddc93</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
