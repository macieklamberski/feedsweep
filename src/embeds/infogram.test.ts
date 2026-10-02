import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  infogramIframeEmbedResolver,
  infogramScriptEmbedResolver,
  infogramWidgetEmbedResolver,
} from './infogram.js'

describeForEachParser('infogramWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, infogramWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should build the chart frame and read the title off the mount', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
          data-type="interactive"
          data-title="NHC Data 2018-2019"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'e8eda814-7ea2-4d8f-b8ab-1010d45de70e',
        src: 'https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed',
        url: 'https://infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e',
        title: 'NHC Data 2018-2019',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the chart frame from an id the current editor issues', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="_/t3P4RQCXpncbMdxGG3BO"
          data-type="interactive"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '_/t3P4RQCXpncbMdxGG3BO',
        src: 'https://e.infogram.com/_/t3P4RQCXpncbMdxGG3BO?src=embed',
        url: 'https://infogram.com/_/t3P4RQCXpncbMdxGG3BO',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the live flag of a live chart into the frame', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz?live"
          data-type="interactive"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz',
        src: 'https://e.infogram.com/1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz?src=embed&live',
        url: 'https://infogram.com/1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a mount naming an empty chart id', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id=""
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a mount the loader already filled with its frame', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
          data-type="interactive"
        >
          <iframe
            src="https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed"
            style="height: 615px; width: 777px"
          ></iframe>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed chart id as written, even if the player answers an error', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="../other"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '../other',
        src: 'https://e.infogram.com/../other?src=embed',
        url: 'https://infogram.com/../other',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker riding beside the live flag', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz?live&utm_source=newsletter"
          data-type="interactive"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz',
        src: 'https://e.infogram.com/1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz?src=embed&live',
        url: 'https://infogram.com/1pzgr95gw37zqwu295dvlwz9q1c11rrl9kz',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build a chart whose mount names no title', async () => {
      const value = html`
        <div
          class="infogram-embed"
          data-id="c712e3f3-ba64-4c78-b340-f323883a2c8a"
          data-type="interactive"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'c712e3f3-ba64-4c78-b340-f323883a2c8a',
        src: 'https://e.infogram.com/c712e3f3-ba64-4c78-b340-f323883a2c8a?src=embed',
        url: 'https://infogram.com/c712e3f3-ba64-4c78-b340-f323883a2c8a',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('infogramScriptEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, infogramScriptEmbedResolver)

  describe('happy paths', () => {
    it('should build the chart frame and read the title off the script', async () => {
      const value = html`
        <script
          id="infogram_0_ff7b6712-fc9f-408c-be33-88bc114f32ab"
          title="ENG - Citas CEE"
          src="https://e.infogram.com/js/dist/embed.js?7qh"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'ff7b6712-fc9f-408c-be33-88bc114f32ab',
        src: 'https://e.infogram.com/ff7b6712-fc9f-408c-be33-88bc114f32ab?src=embed',
        url: 'https://infogram.com/ff7b6712-fc9f-408c-be33-88bc114f32ab',
        title: 'ENG - Citas CEE',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the chart frame from an id the current editor issues', async () => {
      const value = html`
        <script
          id="infogram_0__/K2LVRZCfsFME6VqmR2xg"
          title="2020 Education Poll Dashboard"
          src="https://e.infogram.com/js/dist/embed.js?BVQ"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '_/K2LVRZCfsFME6VqmR2xg',
        src: 'https://e.infogram.com/_/K2LVRZCfsFME6VqmR2xg?src=embed',
        url: 'https://infogram.com/_/K2LVRZCfsFME6VqmR2xg',
        title: '2020 Education Poll Dashboard',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move a slug id on the retired domain onto the current frame', async () => {
      const value = html`
        <script
          id="infogram_0_another_year_another_city___deborah_lau"
          src="http://e.infogr.am/js/embed.js?a4o"
          type="text/javascript"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'another_year_another_city___deborah_lau',
        src: 'https://e.infogram.com/another_year_another_city___deborah_lau?src=embed',
        url: 'https://infogram.com/another_year_another_city___deborah_lau',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a script from a foreign host', async () => {
      const value = html`
        <script
          id="infogram_0_ff7b6712-fc9f-408c-be33-88bc114f32ab"
          src="https://evil.test/js/dist/embed.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script asking the loader for a static image', async () => {
      const value = html`
        <script
          id="infogramimg_0_ff7b6712-fc9f-408c-be33-88bc114f32ab"
          src="https://e.infogram.com/js/dist/embed.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script id with no width', async () => {
      const value = html`
        <script
          id="infogram__ff7b6712-fc9f-408c-be33-88bc114f32ab"
          src="https://e.infogram.com/js/dist/embed.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a script id that reaches the loader shape only after a prefix', async () => {
      const value = html`
        <script
          id="infogram_x_infogram_0_ff7b6712-fc9f-408c-be33-88bc114f32ab"
          src="https://e.infogram.com/js/dist/embed.js"
        ></script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed chart id as written, even if the player answers an error', async () => {
      const value = html`
        <script
          id="infogram_0_abc/def"
          src="https://e.infogram.com/js/dist/embed.js"
        ></script>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'abc/def',
        src: 'https://e.infogram.com/abc/def?src=embed',
        url: 'https://infogram.com/abc/def',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('infogramIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, infogramIframeEmbedResolver)

  describe('happy paths', () => {
    it('should drop the layout setting of a chart frame', async () => {
      const value = html`
        <iframe
          title="US Venture-Backed Billion-Dollar IPO Counts And Exit Value, By Quarter"
          src="https://e.infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403?src=embed&embed_type=responsive_iframe"
          allowfullscreen="allowfullscreen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '7c55cc6b-d3b6-4786-b60b-2507efdcf403',
        src: 'https://e.infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403?src=embed',
        url: 'https://infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should build the chart frame from an id the current editor issues', async () => {
      const value = html`
        <iframe
          src="https://e.infogram.com/_/xCt9tZZlJeRza5h27e5F?src=embed&embed_type=responsive_iframe"
          title="Mashable Samsung UK"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '_/xCt9tZZlJeRza5h27e5F',
        src: 'https://e.infogram.com/_/xCt9tZZlJeRza5h27e5F?src=embed',
        url: 'https://infogram.com/_/xCt9tZZlJeRza5h27e5F',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore the declared box of a chart frame', async () => {
      const value = html`
        <iframe
          title="Evolució passatgers aeroport"
          src="https://e.infogram.com/43292ecb-8a6f-48dd-8cfe-ebf1501154b7?src=embed"
          width="1024"
          height="576"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '43292ecb-8a6f-48dd-8cfe-ebf1501154b7',
        src: 'https://e.infogram.com/43292ecb-8a6f-48dd-8cfe-ebf1501154b7?src=embed',
        url: 'https://infogram.com/43292ecb-8a6f-48dd-8cfe-ebf1501154b7',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move the retired domain frame onto the current one', async () => {
      const value = html`
        <iframe
          src="https://e.infogr.am/lobby_w_ue-168048?src=embed"
          width="600"
          height="1620"
          frameborder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: 'lobby_w_ue-168048',
        src: 'https://e.infogram.com/lobby_w_ue-168048?src=embed',
        url: 'https://infogram.com/lobby_w_ue-168048',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should move the retired chart page onto the chart frame', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="924"
          scrolling="no"
          src="https://infogr.am/89c927075b35-2930"
          width="550"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '89c927075b35-2930',
        src: 'https://e.infogram.com/89c927075b35-2930?src=embed',
        url: 'https://infogram.com/89c927075b35-2930',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a chart frame path on a foreign host', async () => {
      const value = html`
        <iframe src="https://evil.test/_/xCt9tZZlJeRza5h27e5F?src=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the loader script served from the frame host', async () => {
      const value = html`
        <iframe src="https://e.infogram.com/js/dist/embed.js"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a chart id behind a prefix', async () => {
      const value = html`
        <iframe src="https://e.infogram.com/x/_/xCt9tZZlJeRza5h27e5F?src=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a chart id followed by a trailing segment', async () => {
      const value = html`
        <iframe src="https://e.infogram.com/_/xCt9tZZlJeRza5h27e5F/extra?src=embed"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a frame naming no chart', async () => {
      const value = html`
        <iframe src="https://e.infogram.com/"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed chart id as written, even if the player answers an error', async () => {
      const value = html`
        <iframe src="https://e.infogram.com/_/xCt9tZZl.JeRza5h27e5F?src=embed"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '_/xCt9tZZl.JeRza5h27e5F',
        src: 'https://e.infogram.com/_/xCt9tZZl.JeRza5h27e5F?src=embed',
        url: 'https://infogram.com/_/xCt9tZZl.JeRza5h27e5F',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker and the layout setting', async () => {
      const value = html`
        <iframe
          src="https://e.infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403?src=embed&embed_type=responsive_iframe&utm_source=newsletter"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'infogram',
        id: '7c55cc6b-d3b6-4786-b60b-2507efdcf403',
        src: 'https://e.infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403?src=embed',
        url: 'https://infogram.com/7c55cc6b-d3b6-4786-b60b-2507efdcf403',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The mount is an empty div, which stripEmptyTags deletes, so only the whole run shows the chart
// surviving at all.
describeForEachParser('infogram charts through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the mount with a placeholder naming the chart frame', async () => {
    const value = html`
      <p>Before</p>
      <div
        class="infogram-embed"
        data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-type="interactive"
        data-title="NHC Data 2018-2019"
      ></div>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-provider="infogram"
        data-embed-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-embed-src="https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed"
        data-embed-url="https://infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-embed-title="NHC Data 2018-2019"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the loader script with a placeholder naming the chart frame', async () => {
    const value = html`
      <p>Before</p>
      <script
        id="infogram_0_ff7b6712-fc9f-408c-be33-88bc114f32ab"
        title="ENG - Citas CEE"
        src="https://e.infogram.com/js/dist/embed.js?7qh"
        type="text/javascript"
      ></script>
    `
    const expected = html`
      <p>Before</p>
      <div
        data-embed-provider="infogram"
        data-embed-id="ff7b6712-fc9f-408c-be33-88bc114f32ab"
        data-embed-src="https://e.infogram.com/ff7b6712-fc9f-408c-be33-88bc114f32ab?src=embed"
        data-embed-url="https://infogram.com/ff7b6712-fc9f-408c-be33-88bc114f32ab"
        data-embed-title="ENG - Citas CEE"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should move a protocol-relative frame on the retired domain onto the current one', async () => {
    const value = html`
      <iframe
        src="//e.infogr.am/galaxy_s6_memoria"
        width="550"
        height="600"
        scrolling="no"
        frameborder="0"
        style="border:none;"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="infogram"
        data-embed-id="galaxy_s6_memoria"
        data-embed-src="https://e.infogram.com/galaxy_s6_memoria?src=embed"
        data-embed-url="https://infogram.com/galaxy_s6_memoria"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a filled mount to the frame it holds', async () => {
    const value = html`
      <div
        class="infogram-embed"
        data-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-type="interactive"
      >
        <iframe
          src="https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed"
          style="height: 615px; width: 777px"
        ></iframe>
      </div>
    `
    const expected = html`
      <div
        data-embed-provider="infogram"
        data-embed-id="e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
        data-embed-src="https://e.infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e?src=embed"
        data-embed-url="https://infogram.com/e8eda814-7ea2-4d8f-b8ab-1010d45de70e"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
