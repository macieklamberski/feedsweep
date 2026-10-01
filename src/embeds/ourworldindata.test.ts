import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { ourworldindataEmbedResolver } from './ourworldindata.js'

describeForEachParser('ourworldindataEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, ourworldindataEmbedResolver)

  describe('happy paths', () => {
    it('should state the chart height over the box of the embed snippet', async () => {
      const value = html`
        <iframe
          allow="web-share; clipboard-write"
          loading="lazy"
          src="https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map"
          style="border: 0px none; height: 500px; width: 100%;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'grapher/fertilizer-use-per-hectare-of-cropland',
        src: 'https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map',
        url: 'https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map',
        thumbnail:
          'https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland.png?tab=map',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the countries and the time range as written', async () => {
      const value = html`
        <iframe
          src="https://ourworldindata.org/grapher/share-in-poverty-relative-to-different-poverty-thresholds?time=earliest..2017&country=~OWID_WRL"
          loading="lazy"
          style="width: 100%; height: 600px; border: 0px none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'grapher/share-in-poverty-relative-to-different-poverty-thresholds',
        src: 'https://ourworldindata.org/grapher/share-in-poverty-relative-to-different-poverty-thresholds?time=earliest..2017&country=~OWID_WRL',
        url: 'https://ourworldindata.org/grapher/share-in-poverty-relative-to-different-poverty-thresholds?time=earliest..2017&country=~OWID_WRL',
        thumbnail:
          'https://ourworldindata.org/grapher/share-in-poverty-relative-to-different-poverty-thresholds.png?time=earliest..2017&country=~OWID_WRL',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the tab and the legacy year, which the chart migrates itself', async () => {
      const value = html`
        <iframe
          src="https://ourworldindata.org/grapher/annual-co2-emissions-per-country?tab=chart&amp;year=2016&amp;time=1900..2017&amp;country=BRA+CHN+EU-28+IND+USA"
          style="width: 100%; height: 600px; border: 0px none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'grapher/annual-co2-emissions-per-country',
        src: 'https://ourworldindata.org/grapher/annual-co2-emissions-per-country?tab=chart&year=2016&time=1900..2017&country=BRA+CHN+EU-28+IND+USA',
        url: 'https://ourworldindata.org/grapher/annual-co2-emissions-per-country?tab=chart&year=2016&time=1900..2017&country=BRA+CHN+EU-28+IND+USA',
        thumbnail:
          'https://ourworldindata.org/grapher/annual-co2-emissions-per-country.png?tab=chart&year=2016&time=1900..2017&country=BRA+CHN+EU-28+IND+USA',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the stack mode and fold the slug case in the key only', async () => {
      const value = html`
        <iframe
          src="https://ourworldindata.org/grapher/CO2-by-source?stackMode=absolute&amp;time=1900..2017"
          style="width: 100%; height: 600px; border: 0px none;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'grapher/co2-by-source',
        src: 'https://ourworldindata.org/grapher/CO2-by-source?time=1900..2017',
        url: 'https://ourworldindata.org/grapher/CO2-by-source?time=1900..2017',
        thumbnail: 'https://ourworldindata.org/grapher/CO2-by-source.png?time=1900..2017',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from a chart', async () => {
      const value =
        '<iframe src="https://ourworldindata.org/grapher/co2-by-source?utm_source=newsletter"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'grapher/co2-by-source',
        src: 'https://ourworldindata.org/grapher/co2-by-source',
        url: 'https://ourworldindata.org/grapher/co2-by-source',
        thumbnail: 'https://ourworldindata.org/grapher/co2-by-source.png',
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the view of an explorer and drop its display settings', async () => {
      const value = html`
        <iframe
          loading="lazy"
          src="https://ourworldindata.org/explorers/coronavirus-data-explorer?zoomToSelection=true&amp;time=346..latest&amp;pickerSort=desc&amp;pickerMetric=population&amp;Metric=Vaccinations&amp;Interval=Cumulative&amp;Relative+to+Population=true&amp;Align+outbreaks=false&amp;country=USA~ISR~GBR~ARE~OWID_WRL~EuropeanUnion~CHL~CHE&amp;hideControls=true"
          style="border: 0px none; height: 600px; width: 100%;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'ourworldindata',
        id: 'explorers/coronavirus-data-explorer',
        src: 'https://ourworldindata.org/explorers/coronavirus-data-explorer?time=346..latest&Metric=Vaccinations&Interval=Cumulative&Relative+to+Population=true&Align+outbreaks=false&country=USA~ISR~GBR~ARE~OWID_WRL~EuropeanUnion~CHL~CHE',
        url: 'https://ourworldindata.org/explorers/coronavirus-data-explorer?time=346..latest&Metric=Vaccinations&Interval=Cumulative&Relative+to+Population=true&Align+outbreaks=false&country=USA~ISR~GBR~ARE~OWID_WRL~EuropeanUnion~CHL~CHE',
        thumbnail: undefined,
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/grapher/co2-by-source"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route nested under another segment', async () => {
      const value = '<iframe src="https://ourworldindata.org/x/grapher/co2-by-source"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a segment past the slug', async () => {
      const value = '<iframe src="https://ourworldindata.org/grapher/co2-by-source/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an unknown route word', async () => {
      const value = '<iframe src="https://ourworldindata.org/charts/co2-by-source"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the image the site serves beside a chart', async () => {
      const value = '<iframe src="https://ourworldindata.org/grapher/co2-by-source.png"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a static chart file from the old site', async () => {
      const value = html`
        <iframe
          src="https://ourworldindata.org/wp-content/uploads/nvd3/nvd3_lineChart_Kremer_CSV_WorldPop_MillionYears/nvd3_lineChart_Kremer_CSV_WorldPop_MillionYears.html"
          width="100%"
          height="500"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('ourworldindata through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim the chart frame of the embed snippet', async () => {
    const value = html`
      <iframe
        src="https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map"
        loading="lazy"
        style="width: 100%; height: 600px; border: 0px none;"
      ></iframe>
    `

    const expected = html`
      <div
        data-embed-id="grapher/fertilizer-use-per-hectare-of-cropland"
        data-embed-provider="ourworldindata"
        data-embed-src="https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map"
        data-embed-url="https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland?tab=map"
        data-embed-thumbnail="https://ourworldindata.org/grapher/fertilizer-use-per-hectare-of-cropland.png?tab=map"
        data-embed-height="600"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a chart image enclosure an image', async () => {
    const enclosures = [
      { url: 'https://ourworldindata.org/grapher/co2-by-source.png', type: 'image/png' },
    ]

    const expected = html`
      <img data-enclosure="" src="https://ourworldindata.org/grapher/co2-by-source.png">
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
