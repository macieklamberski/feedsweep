import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { threeSixtyCitiesEmbedResolver, threeSixtyCitiesResolveEmbed } from './360cities.js'

describe('threeSixtyCitiesResolveEmbed', () => {
  describe('happy paths', () => {
    it('should mint the frame onto https', () => {
      const value = 'http://www.360cities.net/embed_iframe/af-chapman-youth-hostel-ship-sweden'
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'af-chapman-youth-hostel-ship-sweden',
        src: 'https://www.360cities.net/embed_iframe/af-chapman-youth-hostel-ship-sweden',
        url: 'https://www.360cities.net/image/af-chapman-youth-hostel-ship-sweden',
        ratio: '425/315',
      }

      expect(threeSixtyCitiesResolveEmbed(value)).toEqual(expected)
    })

    it('should pass the slug through as written', () => {
      const value = 'https://www.360cities.net/embed_iframe/korea-sengnam-test'
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'korea-sengnam-test',
        src: 'https://www.360cities.net/embed_iframe/korea-sengnam-test',
        url: 'https://www.360cities.net/image/korea-sengnam-test',
        ratio: '425/315',
      }

      expect(threeSixtyCitiesResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the frame path', () => {
      const value = 'https://evil.test/embed_iframe/peterstrasse-hamburg'

      expect(threeSixtyCitiesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the frame path under another route', () => {
      const value = 'https://www.360cities.net/x/embed_iframe/peterstrasse-hamburg'

      expect(threeSixtyCitiesResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the frame path with a trailing segment', () => {
      const value = 'https://www.360cities.net/embed_iframe/peterstrasse-hamburg/extra'

      expect(threeSixtyCitiesResolveEmbed(value)).toBeUndefined()
    })

    it('should leave the PRO frame alone', () => {
      const value = 'http://www.360cities.net/pro_embed_iframe/af17c22e64/hotel-colon'

      expect(threeSixtyCitiesResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('threeSixtyCitiesEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, threeSixtyCitiesEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the frame box', async () => {
      const value = html`
        <iframe
          src="http://www.360cities.net/embed_iframe/af-chapman-youth-hostel-ship-sweden"
          width="700"
          height="500"
          frameborder="0"
          bgcolor="#000000"
          target="_blank"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'af-chapman-youth-hostel-ship-sweden',
        src: 'https://www.360cities.net/embed_iframe/af-chapman-youth-hostel-ship-sweden',
        url: 'https://www.360cities.net/image/af-chapman-youth-hostel-ship-sweden',
        ratio: '425/315',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the panorama out of the Flash object and its embed', async () => {
      const value = html`
        <object
          classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
          height="315"
          id="_360_krpano_id_406100"
          width="425"
        >
          <param
            name="movie"
            value="http://www.360cities.net/javascripts/krpano/krpano.swf"
          />
          <param
            name="flashvars"
            value="pano=http://www.360cities.net/krpano/external_embed/little-hagia-sophia-istanbul.xml&amp;epd=http://www.360cities.net/data/embed/plugin_data/little-hagia-sophia-istanbul"
          />
          <embed
            src="http://www.360cities.net/javascripts/krpano/krpano.swf"
            width="425"
            height="315"
            allowfullscreen="true"
            flashvars="pano=http://www.360cities.net/krpano/external_embed/little-hagia-sophia-istanbul.xml&amp;epd=http://www.360cities.net/data/embed/plugin_data/little-hagia-sophia-istanbul"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'little-hagia-sophia-istanbul',
        src: 'https://www.360cities.net/embed_iframe/little-hagia-sophia-istanbul',
        url: 'https://www.360cities.net/image/little-hagia-sophia-istanbul',
        ratio: '425/315',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the panorama out of an object param with no embed', async () => {
      const value = html`
        <object
          height="315"
          width="425"
          data="http://www.360cities.net/javascripts/krpano/krpano.swf"
          type="application/x-shockwave-flash"
        >
          <param
            name="flashvars"
            value="pano=http://www.360cities.net/krpano/external_embed/church-saint-peter-of-montrouge.xml&amp;epd=http://www.360cities.net/data/embed/plugin_data/church-saint-peter-of-montrouge"
          />
          <param
            name="src"
            value="http://www.360cities.net/javascripts/krpano/krpano.swf"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'church-saint-peter-of-montrouge',
        src: 'https://www.360cities.net/embed_iframe/church-saint-peter-of-montrouge',
        url: 'https://www.360cities.net/image/church-saint-peter-of-montrouge',
        ratio: '425/315',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the panorama out of a bare embed on https', async () => {
      const value = html`
        <embed
          src="https://www.360cities.net/javascripts/krpano/krpano.swf"
          width="525"
          height="315"
          flashvars="pano=https://www.360cities.net/krpano/external_embed/memleben-kloster-germany.xml&amp;epd=https://www.360cities.net/data/embed/plugin_data/memleben-kloster-germany"
        />
      `
      const expected: EmbedResolverResult = {
        provider: '360cities',
        id: 'memleben-kloster-germany',
        src: 'https://www.360cities.net/embed_iframe/memleben-kloster-germany',
        url: 'https://www.360cities.net/image/memleben-kloster-germany',
        ratio: '425/315',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the Flash viewer with nothing naming a panorama', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf"
          quality="autohigh"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a panorama named on a foreign host', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf"
          flashvars="pano=https://evil.test/krpano/external_embed/memleben-kloster-germany.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a panorama file under another route', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf"
          flashvars="pano=http://www.360cities.net/x/krpano/external_embed/memleben-kloster-germany.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a panorama file with a trailing segment', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf"
          flashvars="pano=http://www.360cities.net/krpano/external_embed/memleben-kloster-germany.xml/extra"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash viewer path under another route', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/x/javascripts/krpano/krpano.swf"
          flashvars="pano=http://www.360cities.net/krpano/external_embed/memleben-kloster-germany.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash viewer path with a trailing segment', async () => {
      const value = html`
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf/extra"
          flashvars="pano=http://www.360cities.net/krpano/external_embed/memleben-kloster-germany.xml"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('the Flash object the pipeline leaves as markup', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the whole Flash object into a placeholder onto the frame', async () => {
    const value = html`
      <object
        classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        height="315"
        width="425"
      >
        <param
          name="movie"
          value="http://www.360cities.net/javascripts/krpano/krpano.swf"
        />
        <param
          name="flashvars"
          value="pano=http://www.360cities.net/krpano/external_embed/baroque-abbey-church-altar-hungary.xml&amp;epd=http://www.360cities.net/data/embed/plugin_data/baroque-abbey-church-altar-hungary"
        />
        <embed
          src="http://www.360cities.net/javascripts/krpano/krpano.swf"
          width="425"
          height="315"
          flashvars="pano=http://www.360cities.net/krpano/external_embed/baroque-abbey-church-altar-hungary.xml&amp;epd=http://www.360cities.net/data/embed/plugin_data/baroque-abbey-church-altar-hungary"
        />
      </object>
    `
    const expected = html`
      <div
        data-embed-provider="360cities"
        data-embed-id="baroque-abbey-church-altar-hungary"
        data-embed-ratio="425/315"
        data-embed-src="https://www.360cities.net/embed_iframe/baroque-abbey-church-altar-hungary"
        data-embed-url="https://www.360cities.net/image/baroque-abbey-church-altar-hungary"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
