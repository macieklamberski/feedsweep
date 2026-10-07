import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { convertTradingEconomicsEmbeds } from './convertTradingEconomicsEmbeds.js'

// The two parsers order the img attributes and escape `&` differently, so every case compares
// through toEqualHtml.
describeForEachParser('convertTradingEconomicsEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [convertTradingEconomicsEmbeds(baseContext)])
  }

  describe('happy paths', () => {
    it('should replace a tradingeconomics.com iframe with its chart linked to the ref page', async () => {
      const value = html`
        <iframe
          src="https://tradingeconomics.com/embed/?s=usareninf&#038;v=202406121234V20230410&#038;h=300&#038;w=600&#038;ref=/united-states/rent-inflation&#038;type=spline&#038;d1=2019-06-01&#038;d2=2024-06-01"
          height="300"
          width="600"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/united-states/rent-inflation">
          <img
            src="https://tradingeconomics.com/charts/embed.png?s=usareninf&amp;v=202406121234V20230410&amp;h=300&amp;w=600&amp;ref=/united-states/rent-inflation&amp;type=spline&amp;d1=2019-06-01&amp;d2=2024-06-01"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the cloudfront host and link the root when there is no ref', async () => {
      const value = html`
        <iframe
          src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=grcdebt2gdp&v=202107132317V20200908&d1=19961223&h=450&w=900"
          width="900"
          height="450"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=grcdebt2gdp&amp;v=202107132317V20200908&amp;d1=19961223&amp;h=450&amp;w=900"
            width="900"
            height="450"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the www host and the http scheme the feed wrote', async () => {
      const value = html`
        <iframe
          src="http://www.tradingeconomics.com/embed/?s=dxy&amp;v=201604122040n&amp;forecast=2&amp;h=300&amp;w=600&amp;ref=/united-states/currency/forecast"
          height="300"
          width="600"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/united-states/currency/forecast">
          <img
            src="http://www.tradingeconomics.com/charts/embed.png?s=dxy&amp;v=201604122040n&amp;forecast=2&amp;h=300&amp;w=600&amp;ref=/united-states/currency/forecast"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should convert every iframe when a post packs several', async () => {
      const value = html`
        <iframe src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=unitedstamorrat&v=202208241115V20220312&d1=19970901&h=480&w=960"></iframe>
        <iframe src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=usareninf&v=202208101303V20220312&d1=20120910&h=480&w=960"></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=unitedstamorrat&amp;v=202208241115V20220312&amp;d1=19970901&amp;h=480&amp;w=960"
            width="960"
            height="480"
          >
        </a>
        <a href="https://tradingeconomics.com/">
          <img
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=usareninf&amp;v=202208101303V20220312&amp;d1=20120910&amp;h=480&amp;w=960"
            width="960"
            height="480"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the legacy chart.aspx route alone', async () => {
      const value =
        '<iframe src="http://www.tradingeconomics.com/iframe/chart.aspx?url=/sri-lanka/gdp-growth"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an embed url with no symbol alone', async () => {
      const value = '<iframe src="https://tradingeconomics.com/embed/?h=300&amp;w=600"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a foreign host carrying the same path alone', async () => {
      const value = '<iframe src="https://evil.test/embed/?s=dxy&amp;h=300&amp;w=600"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an embed segment under another path alone', async () => {
      const value =
        '<iframe src="https://tradingeconomics.com/x/embed/?s=dxy&amp;h=300&amp;w=600"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a path that continues past the embed segment alone', async () => {
      const value =
        '<iframe src="https://tradingeconomics.com/embed/extra?s=dxy&amp;h=300&amp;w=600"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should pass a query the feed escaped twice through as written', async () => {
      const value = html`
        <iframe
          src="https://tradingeconomics.com/embed/?s=usareninf&#038;v=202406121234V20230410&%23038;h=300&%23038;w=600&%23038;ref=/united-states/rent-inflation&%23038;type=spline&%23038;d1=2019-06-01&%23038;d2=2024-06-01"
          height="300"
          width="600"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://tradingeconomics.com/charts/embed.png?s=usareninf&amp;v=202406121234V20230410&amp;%23038;h=300&amp;%23038;w=600&amp;%23038;ref=/united-states/rent-inflation&amp;%23038;type=spline&amp;%23038;d1=2019-06-01&amp;%23038;d2=2024-06-01"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should take the width from the query when the iframe states a percentage', async () => {
      const value = html`
        <iframe
          src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=australiawaggro&amp;v=201705232024v&amp;d1=20120101&amp;d2=20171231&amp;h=300&amp;w=600"
          height="300"
          width="100%"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=australiawaggro&amp;v=201705232024v&amp;d1=20120101&amp;d2=20171231&amp;h=300&amp;w=600"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should take both sizes from the query when the iframe states none', async () => {
      const value =
        '<iframe src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=grcdebt2gdp&amp;h=450&amp;w=900"></iframe>'
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=grcdebt2gdp&amp;h=450&amp;w=900"
            width="900"
            height="450"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should link the root when ref is not a path', async () => {
      const value =
        '<iframe src="https://tradingeconomics.com/embed/?s=dxy&amp;h=300&amp;w=600&amp;ref=evil.test/x"></iframe>'
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://tradingeconomics.com/charts/embed.png?s=dxy&amp;h=300&amp;w=600&amp;ref=evil.test/x"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should match the embed path in any case and without its trailing slash', async () => {
      const value = html`
        <iframe src="https://tradingeconomics.com/Embed/?s=dxy&amp;h=300&amp;w=600"></iframe>
        <iframe src="https://tradingeconomics.com/embed?s=dxy&amp;h=300&amp;w=600"></iframe>
      `
      const expected = html`
        <a href="https://tradingeconomics.com/">
          <img
            src="https://tradingeconomics.com/charts/embed.png?s=dxy&amp;h=300&amp;w=600"
            width="600"
            height="300"
          >
        </a>
        <a href="https://tradingeconomics.com/">
          <img
            src="https://tradingeconomics.com/charts/embed.png?s=dxy&amp;h=300&amp;w=600"
            width="600"
            height="300"
          >
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <iframe
          src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=grcdebt2gdp&v=202107132317V20200908&d1=19961223&h=450&w=900"
          width="900"
          height="450"
        ></iframe>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('trading economics charts through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should reach the output as a linked image, not an iframe placeholder', async () => {
    const value = html`
      <p>
        <iframe
          src="https://d3fy651gv2fhd3.cloudfront.net/embed/?s=grcdebt2gdp&v=202107132317V20200908&d1=19961223&h=450&w=900"
          width="900"
          height="450"
          frameborder="0"
          scrolling="no"
        ></iframe>
        <br>
        source: <a href="https://tradingeconomics.com/greece/government-debt-to-gdp">tradingeconomics.com</a>
      </p>
    `
    const expected = html`
      <p>
        <a href="https://tradingeconomics.com/">
          <img
            height="450"
            width="900"
            src="https://d3fy651gv2fhd3.cloudfront.net/charts/embed.png?s=grcdebt2gdp&amp;v=202107132317V20200908&amp;d1=19961223&amp;h=450&amp;w=900"
          >
        </a>
        source: <a href="https://tradingeconomics.com/greece/government-debt-to-gdp">tradingeconomics.com</a>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
