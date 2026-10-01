import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  readTableauHeight,
  tableauIframeEmbedResolver,
  tableauObjectEmbedResolver,
  tableauWidgetEmbedResolver,
} from './tableau.js'

describeForEachParser('tableauWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tableauWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the viz frame from the image of the share snippet', async () => {
      const value = html`
        <div
          class="tableauPlaceholder"
          style="width: 754px; height: 719px;"
        >
          <noscript>
            <a href="#">
              <img
                alt="Dashboard 1 "
                src="http://public.tableau.com/static/images/In/IndustrialDevelopmentSubsidies_11-15/Dashboard1/1_rss.png"
                style="border: none"
              />
            </a>
          </noscript>
          <object
            class="tableauViz"
            style="display: none;"
            width="754"
            height="719"
          >
            <param name="host_url" value="http%3A%2F%2Fpublic.tableau.com%2F" />
            <param name="site_root" value="" />
            <param name="name" value="IndustrialDevelopmentSubsidies_11-15/Dashboard1" />
            <param name="tabs" value="no" />
            <param name="toolbar" value="yes" />
          </object>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'IndustrialDevelopmentSubsidies_11-15',
        src: 'https://public.tableau.com/views/IndustrialDevelopmentSubsidies_11-15/Dashboard1?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/IndustrialDevelopmentSubsidies_11-15/Dashboard1',
        title: 'Dashboard 1',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the image of the current snippet', async () => {
      const value = html`
        <div
          class="tableauPlaceholder"
          id="viz1742324575027"
        >
          <noscript>
            <a href="#">
              <img
                alt="FTE Dash"
                src="https://public.tableau.com/static/images/Bi/BillsData2025/FTEDash/1.png"
                style="border: none"
              />
            </a>
          </noscript>
          <object
            class="tableauViz"
            width="100%"
            height="100%"
          >
            <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
            <param name="embed_code_version" value="3" />
            <param name="name" value="BillsData2025/FTEDash" />
          </object>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'BillsData2025',
        src: 'https://public.tableau.com/views/BillsData2025/FTEDash?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/BillsData2025/FTEDash',
        title: 'FTE Dash',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a snippet on the retired domain onto the current one', async () => {
      const value = html`
        <div
          class="tableauPlaceholder"
          style="width:654px; height:655px;"
        >
          <noscript>
            <a href="#">
              <img
                alt=" "
                src="http://public.tableausoftware.com/static/images/Vi/ViewingBigDatawithaMap/PuttingBigDatainaMap/1_rss.png"
                style="border: none"
              />
            </a>
          </noscript>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'ViewingBigDatawithaMap',
        src: 'https://public.tableau.com/views/ViewingBigDatawithaMap/PuttingBigDatainaMap?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/ViewingBigDatawithaMap/PuttingBigDatainaMap',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a snippet on the retired image host onto the current one', async () => {
      const value = html`
        <div class="tableauPlaceholder">
          <noscript>
            <a href="#">
              <img
                alt=" "
                src="https://publicrevizit.tableausoftware.com/static/images/Wo/WorldEnergy_3/Energy/1_rss.png"
                style="border: none"
              />
            </a>
          </noscript>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'WorldEnergy_3',
        src: 'https://public.tableau.com/views/WorldEnergy_3/Energy?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/WorldEnergy_3/Energy',
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should read the image Blogger escaped to text inside the noscript', async () => {
      const value = html`
        <div
          class="tableauPlaceholder"
          style="height: 609px; width: 544px;"
        >
          <div style="text-align: center;">
            <noscript>&amp;amp;amp;lt;a href="#"&amp;amp;amp;gt;&amp;amp;amp;lt;img alt=" " src="http:&amp;amp;amp;amp;#47;&amp;amp;amp;amp;#47;public.tableausoftware.com&amp;amp;amp;amp;#47;static&amp;amp;amp;amp;#47;images&amp;amp;amp;amp;#47;Li&amp;amp;amp;amp;#47;LivingRoom&amp;amp;amp;amp;#47;LivingRoom&amp;amp;amp;amp;#47;1_rss.png" style="border: none" /&amp;amp;amp;gt;&amp;amp;amp;lt;/a&amp;amp;amp;gt;</noscript>
            <object
              class="tableauViz"
              height="609"
              style="display: none;"
              width="544"
            >
              <param name="host_url" value="http%3A%2F%2Fpublic.tableausoftware.com%2F" />
              <param name="name" value="LivingRoom&#47;LivingRoom" />
            </object>
          </div>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'LivingRoom',
        src: 'https://public.tableau.com/views/LivingRoom/LivingRoom?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/LivingRoom/LivingRoom',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same image path', async () => {
      const value = html`
        <div class="tableauPlaceholder">
          <noscript>
            <img src="https://evil.test/static/images/Bi/BillsData2025/FTEDash/1.png" />
          </noscript>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an image path under another prefix', async () => {
      const value = html`
        <div class="tableauPlaceholder">
          <noscript>
            <img src="https://public.tableau.com/x/static/images/Bi/BillsData2025/FTEDash/1.png" />
          </noscript>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an image path with a trailing segment', async () => {
      const value = html`
        <div class="tableauPlaceholder">
          <noscript>
            <img src="https://public.tableau.com/static/images/Bi/BillsData2025/FTEDash/1.png/x" />
          </noscript>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the image of a shared viz, which names no workbook', async () => {
      const value = html`
        <div class="tableauPlaceholder">
          <noscript>
            <a href="#">
              <img
                alt=" "
                src="https://public.tableau.com/static/images/4X/4X5X3NKZQ/1_rss.png"
                style="border: none"
              />
            </a>
          </noscript>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tableauObjectEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tableauObjectEmbedResolver)

  describe('happy paths', () => {
    it('should build the viz frame from the params of an object left visible', async () => {
      const value = html`
        <object class="tableauViz">
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="embed_code_version" value="3" />
          <param name="site_root" value="" />
          <param
            name="name"
            value="NumbersofInternationalTheatrePerformanceandMulti-ArtsFestivalsbyCountry/Sheet1"
          />
          <param name="tabs" value="no" />
          <param name="toolbar" value="yes" />
          <param
            name="static_image"
            value="https://public.tableau.com/static/images/Nu/NumbersofInternationalTheatrePerformanceandMulti-ArtsFestivalsbyCountry/Sheet1/1.png"
          />
          <param name="language" value="en-US" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'NumbersofInternationalTheatrePerformanceandMulti-ArtsFestivalsbyCountry',
        src: 'https://public.tableau.com/views/NumbersofInternationalTheatrePerformanceandMulti-ArtsFestivalsbyCountry/Sheet1?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/NumbersofInternationalTheatrePerformanceandMulti-ArtsFestivalsbyCountry/Sheet1',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an object on another Tableau server', async () => {
      const value = html`
        <object class="tableauViz">
          <param name="host_url" value="https%3A%2F%2Fevil.test%2F" />
          <param name="name" value="BillsData2025/FTEDash" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a shared viz, which names a path and no workbook', async () => {
      const value = html`
        <object class="tableauViz">
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="path" value="shared/4X5X3NKZQ" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a name with more than a workbook and a sheet', async () => {
      const value = html`
        <object class="tableauViz">
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="name" value="BillsData2025/FTEDash/x" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('tableauIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tableauIframeEmbedResolver)

  describe('happy paths', () => {
    it('should build the viz frame from a pasted views frame', async () => {
      const value = html`
        <iframe
          scrolling="no"
          src="https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog?:showVizHome=no"
          width="720"
          height="700"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'Dashboard_LR_focus',
        src: 'https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the display settings of a frame', async () => {
      const value = html`
        <iframe
          src="https://public.tableau.com/views/Tooltippin/FormattedDash?:embed=y&:display_count=yes&:showTabs=y&utm_source=example"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'Tooltippin',
        src: 'https://public.tableau.com/views/Tooltippin/FormattedDash?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/Tooltippin/FormattedDash',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a frame on the retired domain onto the current one', async () => {
      const value = html`
        <iframe
          src="https://public.tableausoftware.com/views/HDIWorldHumanDevIndex/HDI?:embed=y&:display_count=no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'HDIWorldHumanDevIndex',
        src: 'https://public.tableau.com/views/HDIWorldHumanDevIndex/HDI?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/HDIWorldHumanDevIndex/HDI',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name out of the stated title', async () => {
      const value = html`
        <iframe
          src="https://public.tableau.com/views/AfricanSlaveTrade/AfricanSlaveTradeintheAmericas?:showVizHome=no"
          title="A Glimpse at the African Slave Trade in the Americas"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tableau',
        id: 'AfricanSlaveTrade',
        src: 'https://public.tableau.com/views/AfricanSlaveTrade/AfricanSlaveTradeintheAmericas?:embed=y&:showVizHome=no',
        url: 'https://public.tableau.com/views/AfricanSlaveTrade/AfricanSlaveTradeintheAmericas',
        title: 'A Glimpse at the African Slave Trade in the Americas',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/views/BillsData2025/FTEDash"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a views path under another prefix', async () => {
      const value =
        '<iframe src="https://public.tableau.com/x/views/BillsData2025/FTEDash"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a views path with a trailing segment', async () => {
      const value =
        '<iframe src="https://public.tableau.com/views/BillsData2025/FTEDash/x"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a shared viz, which names no workbook', async () => {
      const value =
        '<iframe src="https://public.tableau.com/shared/8DK8H7Z7N?:display_count=yes"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readTableauHeight', () => {
  it('should add the toolbar to a fixed dashboard height', () => {
    const value = String.raw`api.FirstVizSizeKnownEvent,xdomainSourceId,,{"api.workbookName":"A Glimpse at the African Slave Trade in the Americas","api.worksheetName":"","api.commandData":"{\"sizeConstraints\":{\"maxHeight\":964,\"maxWidth\":1016,\"minHeight\":964,\"minWidth\":1016},\"chromeHeight\":27}"}`

    expect(readTableauHeight(value)).toBe(991)
  })

  it('should take the upper bound of a dashboard sized within a range', () => {
    const value = String.raw`api.FirstVizSizeKnownEvent,xdomainSourceId,,{"api.workbookName":"BillsData2025","api.worksheetName":"","api.commandData":"{\"sizeConstraints\":{\"maxHeight\":860,\"maxWidth\":650,\"minHeight\":560,\"minWidth\":420},\"chromeHeight\":27}"}`

    expect(readTableauHeight(value)).toBe(887)
  })

  it('should take the lower bound of a dashboard with no upper one', () => {
    const value = String.raw`api.FirstVizSizeKnownEvent,xdomainSourceId,,{"api.workbookName":"ViewingBigDatawithaMap","api.worksheetName":"","api.commandData":"{\"sizeConstraints\":{\"maxHeight\":0,\"maxWidth\":0,\"minHeight\":560,\"minWidth\":420},\"chromeHeight\":50}"}`

    expect(readTableauHeight(value)).toBe(610)
  })

  it('should read nothing for a dashboard sized by its container', () => {
    const value = String.raw`api.FirstVizSizeKnownEvent,xdomainSourceId,,{"api.workbookName":"Covid-19WorldComparisons","api.worksheetName":"","api.commandData":"{\"sizeConstraints\":{\"maxHeight\":0,\"maxWidth\":0,\"minHeight\":0,\"minWidth\":0},\"chromeHeight\":27}"}`

    expect(readTableauHeight(value)).toBeUndefined()
  })

  it('should ignore a message that only carries the size event further in', () => {
    const value = String.raw`x api.FirstVizSizeKnownEvent,xdomainSourceId,,{"api.workbookName":"BillsData2025","api.worksheetName":"","api.commandData":"{\"sizeConstraints\":{\"maxHeight\":860,\"maxWidth\":650,\"minHeight\":560,\"minWidth\":420},\"chromeHeight\":27}"}`

    expect(readTableauHeight(value)).toBeUndefined()
  })

  it('should ignore the other messages the viz posts', () => {
    expect(readTableauHeight('tableau.completed')).toBeUndefined()
  })

  it('should ignore a size message whose payload is not JSON', () => {
    expect(readTableauHeight('api.FirstVizSizeKnownEvent,xdomainSourceId,,{')).toBeUndefined()
  })
})

describeForEachParser('tableau snippets through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the share snippet whose object is hidden', async () => {
    const value = html`
      <p>
        <script
          src="http://public.tableau.com/javascripts/api/viz_v1.js"
          type="text/javascript"
        ></script>
      </p>
      <div
        class="tableauPlaceholder"
        style="width: 754px; height: 719px;"
      >
        <noscript>
          <a href="#">
            <img
              alt="Dashboard 1 "
              src="http:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;In&#47;IndustrialDevelopmentSubsidies_11-15&#47;Dashboard1&#47;1_rss.png"
              style="border: none"
            />
          </a>
        </noscript>
        <object
          class="tableauViz"
          style="display: none;"
          width="754"
          height="719"
        >
          <param name="host_url" value="http%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="name" value="IndustrialDevelopmentSubsidies_11-15&#47;Dashboard1" />
        </object>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="tableau"
        data-embed-id="IndustrialDevelopmentSubsidies_11-15"
        data-embed-src="https://public.tableau.com/views/IndustrialDevelopmentSubsidies_11-15/Dashboard1?:embed=y&amp;:showVizHome=no"
        data-embed-url="https://public.tableau.com/views/IndustrialDevelopmentSubsidies_11-15/Dashboard1"
        data-embed-title="Dashboard 1"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace an object left visible', async () => {
    const value = html`
      <object class="tableauViz">
        <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
        <param name="embed_code_version" value="3" />
        <param name="name" value="BillsData2025/FTEDash" />
        <param name="tabs" value="no" />
      </object>
    `
    const expected = html`
      <div
        data-embed-provider="tableau"
        data-embed-id="BillsData2025"
        data-embed-src="https://public.tableau.com/views/BillsData2025/FTEDash?:embed=y&amp;:showVizHome=no"
        data-embed-url="https://public.tableau.com/views/BillsData2025/FTEDash"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace a pasted views frame', async () => {
    const value = html`
      <iframe
        scrolling="no"
        src="https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog?:showVizHome=no"
        width="720"
        height="700"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="tableau"
        data-embed-id="Dashboard_LR_focus"
        data-embed-src="https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog?:embed=y&amp;:showVizHome=no"
        data-embed-url="https://public.tableau.com/views/Dashboard_LR_focus/Mobility_LR_Universities_blog"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
