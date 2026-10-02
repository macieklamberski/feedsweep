import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { umapEmbedResolver } from './umap.js'

describeForEachParser('umapEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, umapEmbedResolver)

  describe('happy paths', () => {
    it('should drop the controls the share dialog writes', async () => {
      const value = html`
        <iframe
          width="100%"
          height="300px"
          frameborder="0"
          allowfullscreen
          src="https://umap.openstreetmap.fr/fr/map/tour-vtt-rocher-de-muzig-schneeberg_351057?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=databrowser&captionBar=false"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'umap.openstreetmap.fr/351057',
        src: 'https://umap.openstreetmap.fr/fr/map/tour-vtt-rocher-de-muzig-schneeberg_351057',
        url: 'https://umap.openstreetmap.fr/fr/map/tour-vtt-rocher-de-muzig-schneeberg_351057',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should claim a map on Framacarte', async () => {
      const value = html`
        <iframe
          width="100%"
          height="300px"
          frameBorder="0"
          src="https://framacarte.org/fr/map/les-hautes-chaumes_13219?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'framacarte.org/13219',
        src: 'https://framacarte.org/fr/map/les-hautes-chaumes_13219',
        url: 'https://framacarte.org/fr/map/les-hautes-chaumes_13219',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the view the hash opens the map on', async () => {
      const value = html`
        <iframe
          class="openstreetmap"
          width="100%"
          height="600px"
          src="https://umap.openstreetmap.fr/en/map/demo-map_1?scaleControl=true&miniMap=false&scrollWheelZoom=true&zoomControl=true&allowEdit=false&moreControl=true&searchControl=true&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false#14/-37.7989/145.0003"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'umap.openstreetmap.fr/1',
        src: 'https://umap.openstreetmap.fr/en/map/demo-map_1#14/-37.7989/145.0003',
        url: 'https://umap.openstreetmap.fr/en/map/demo-map_1',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the http scheme and drop an empty layer list', async () => {
      const value = html`
        <iframe
          src="http://umap.openstreetmap.fr/en/map/bandung_357466?scaleControl=false&miniMap=true&scrollWheelZoom=true&zoomControl=true&allowEdit=false&moreControl=false&searchControl=true&tilelayersControl=false&embedControl=false&datalayersControl=true&onLoadPanel=undefined&captionBar=false&datalayers=&fullscreenControl=true&locateControl=true&measureControl=true&editinosmControl=false#12/-6.2817/107.0532"
          width="100%"
          height="400px"
          frameborder="0"
          allowfullscreen=""
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'umap.openstreetmap.fr/357466',
        src: 'http://umap.openstreetmap.fr/en/map/bandung_357466#12/-6.2817/107.0532',
        url: 'http://umap.openstreetmap.fr/en/map/bandung_357466',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the layers and the feature the map opens with', async () => {
      const value = html`
        <iframe
          src="https://umap.openstreetmap.fr/fr/map/sceaux-parcours-pedagogique-srav-savoir-rouler-a-v_760715?scaleControl=false&datalayers=08eb5610-a785-4b17-b4d5-c31baa8a2a38,1f323303-bd3c-4e91-8ab7-0a9bdd0fee82&feature=depart&utm_source=feed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'umap.openstreetmap.fr/760715',
        src: 'https://umap.openstreetmap.fr/fr/map/sceaux-parcours-pedagogique-srav-savoir-rouler-a-v_760715?datalayers=08eb5610-a785-4b17-b4d5-c31baa8a2a38%2C1f323303-bd3c-4e91-8ab7-0a9bdd0fee82&feature=depart',
        url: 'https://umap.openstreetmap.fr/fr/map/sceaux-parcours-pedagogique-srav-savoir-rouler-a-v_760715',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name out of the stated title', async () => {
      const value = html`
        <iframe
          src="https://framacarte.org/fr/map/les-hautes-chaumes_13219"
          title="Les Hautes Chaumes"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'framacarte.org/13219',
        src: 'https://framacarte.org/fr/map/les-hautes-chaumes_13219',
        url: 'https://framacarte.org/fr/map/les-hautes-chaumes_13219',
        height: 300,
        title: 'Les Hautes Chaumes',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a regional language and any slug as written', async () => {
      const value =
        '<iframe src="https://umap.openstreetmap.fr/pt-br/map/Anything_760715"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'umap',
        id: 'umap.openstreetmap.fr/760715',
        src: 'https://umap.openstreetmap.fr/pt-br/map/Anything_760715',
        url: 'https://umap.openstreetmap.fr/pt-br/map/Anything_760715',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a map path behind another segment', async () => {
      const value = '<iframe src="https://example.org/x/fr/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a map path followed by another segment', async () => {
      const value =
        '<iframe src="https://umap.openstreetmap.fr/fr/map/maison_203723/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a map page with no numeric id', async () => {
      const value = '<iframe src="https://example.org/fr/map/maison_mairie"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a first segment longer than a language', async () => {
      const value = '<iframe src="https://example.org/blog/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore two segments before the map route', async () => {
      const value = '<iframe src="https://example.org/en-us/blog/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore two short segments before the map route', async () => {
      const value = '<iframe src="https://example.org/m/a/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an uppercase language, which uMap answers 404', async () => {
      const value = '<iframe src="https://umap.openstreetmap.fr/FR/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a scheme other than http', async () => {
      const value = '<iframe src="ftp://umap.openstreetmap.fr/fr/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a protocol-relative src to the pipeline', async () => {
      const value = '<iframe src="//umap.openstreetmap.fr/fr/map/maison_203723"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Most carriers write a protocol-relative src, which only resolveRelativeUrls makes absolute.
describeForEachParser('umap through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should claim a protocol-relative map on OpenStreetMap France', async () => {
    const value = html`
      <iframe
        allowfullscreen=""
        frameborder="0"
        height="500px"
        src="//umap.openstreetmap.fr/fr/map/maison-des-associations_203723?scaleControl=true&amp;miniMap=true&amp;scrollWheelZoom=true&amp;zoomControl=true&amp;allowEdit=false&amp;moreControl=true&amp;searchControl=null&amp;tilelayersControl=null&amp;embedControl=null&amp;datalayersControl=true&amp;onLoadPanel=undefined&amp;captionBar=false#16/49.1799/-0.3700"
        width="100%"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="300"
        data-embed-url="https://umap.openstreetmap.fr/fr/map/maison-des-associations_203723"
        data-embed-id="umap.openstreetmap.fr/203723"
        data-embed-provider="umap"
        data-embed-src="https://umap.openstreetmap.fr/fr/map/maison-des-associations_203723#16/49.1799/-0.3700"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should claim a protocol-relative map on OpenStreetMap Germany', async () => {
    const value = html`
      <iframe
        style="width: 850px; height: 600px; border: 0;"
        allowfullscreen
        allow="geolocation"
        src="//umap.openstreetmap.de/de/map/interaktive-karte-von-zinnowitz-historische-bauwer_145587?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false&captionMenus=true#15/54.076425/13.914957"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="300"
        data-embed-url="https://umap.openstreetmap.de/de/map/interaktive-karte-von-zinnowitz-historische-bauwer_145587"
        data-embed-id="umap.openstreetmap.de/145587"
        data-embed-provider="umap"
        data-embed-src="https://umap.openstreetmap.de/de/map/interaktive-karte-von-zinnowitz-historische-bauwer_145587#15/54.076425/13.914957"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
