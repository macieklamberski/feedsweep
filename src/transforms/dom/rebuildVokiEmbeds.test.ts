import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildVokiEmbeds } from './rebuildVokiEmbeds.js'

describeForEachParser('rebuildVokiEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildVokiEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild the script embed onto the share page', async () => {
      const value = `<script language="JavaScript" type="text/javascript">AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a', 2981757, 1,'', 0);</script>`
      const expected =
        '<iframe src="https://www.voki.com/site/pickup?scid=2981757&amp;chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read a checksum in double quotes with no spaces', async () => {
      const value = `<script language="JavaScript" type="text/javascript">AC_Voki_Embed(200,267,"6e56d0dad556a08bee84930d40c31cb5",2525331, 1, "", 0);</script>`
      const expected =
        '<iframe src="https://www.voki.com/site/pickup?scid=2525331&amp;chsm=6e56d0dad556a08bee84930d40c31cb5"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the call the current snippet writes, with its player type', async () => {
      const value = `<script language="JavaScript" type="text/javascript">AC_Voki_Embed(600,338,"4c9a4747d40e7640c39f4bc5e61cc4fa",12738228, 1, "", 0, 1);</script>`
      const expected =
        '<iframe src="https://www.voki.com/site/pickup?scid=12738228&amp;chsm=4c9a4747d40e7640c39f4bc5e61cc4fa"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read a scene followed by a space before its comma', async () => {
      const value = `<script>AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a', 2981757 , 1,'', 0);</script>`
      const expected =
        '<iframe src="https://www.voki.com/site/pickup?scid=2981757&amp;chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the scene of a call that ends after it', async () => {
      const value = `<script>AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a', 2981757);</script>`
      const expected =
        '<iframe src="https://www.voki.com/site/pickup?scid=2981757&amp;chsm=007275daae1363c5599d3bae7e3ab08a"></iframe>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild every scene a script embeds', async () => {
      const value = html`
        <script>
          AC_Voki_Embed(200, 267, '6bc4b935c35a384948fdfa3414d1b80e', 3208798, 1,'', 0);
          AC_Voki_Embed(200, 267, 'dbea7be93e6943ae3040816352a72f71', 3208820, 1,'', 0);
        </script>
      `
      const expected = html`
        <iframe src="https://www.voki.com/site/pickup?scid=3208798&amp;chsm=6bc4b935c35a384948fdfa3414d1b80e"></iframe>
        <iframe src="https://www.voki.com/site/pickup?scid=3208820&amp;chsm=dbea7be93e6943ae3040816352a72f71"></iframe>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the loader script alone, which names no scene', async () => {
      const value = '<script src="http://vhss-d.oddcast.com/voki_embed_functions.php"></script>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave the SitePal call, which is another product', async () => {
      const value = `<script>AC_VHost_Embed(27229,372,650,'',1,1, 2504782, 0,1,0,'2716f7283537756c9c74cb2e57e450b8',9);</script>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a call whose checksum quotes do not match', async () => {
      const value = `<script>AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a", 2981757, 1,'', 0);</script>`

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a call with an empty checksum', async () => {
      const value = `<script>AC_Voki_Embed(200, 267, "", 2981757, 1);</script>`

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should be idempotent', async () => {
      const value = `<script>AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a', 2981757, 1,'', 0);</script>`
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildVokiEmbeds through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should keep the scene as a placeholder in place of the snippet', async () => {
    const value = html`
      <p>Listen to our Voki.</p>
      <script language="JavaScript" type="text/javascript" src="http://vhss-d.oddcast.com/voki_embed_functions.php"></script><script language="JavaScript" type="text/javascript">AC_Voki_Embed(200, 267, '007275daae1363c5599d3bae7e3ab08a', 2981757, 1,'', 0);</script>
    `
    const expected = html`
      <p>Listen to our Voki.</p>
      <div
        data-embed-height="547"
        data-embed-url="https://www.voki.com/site/pickup?scid=2981757&amp;chsm=007275daae1363c5599d3bae7e3ab08a"
        data-embed-id="2981757/007275daae1363c5599d3bae7e3ab08a"
        data-embed-provider="voki"
        data-embed-src="https://www.voki.com/site/pickup?scid=2981757&amp;chsm=007275daae1363c5599d3bae7e3ab08a"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
