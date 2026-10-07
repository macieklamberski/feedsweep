import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { arcgisEmbedResolver, arcgisResolveEmbed, arcgisWidgetEmbedResolver } from './arcgis.js'

describe('arcgisResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep a classic snippet on the classic player with its box', () => {
      const value =
        '//sonomaopenspace.maps.arcgis.com/apps/Embed/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7&extent=-123.0692,38.5233,-122.9947,38.5929&zoom=true&scale=true&disable_scroll=true&theme=light'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '62bf87f7b2f64f15b48491d39242f4d7',
        src: 'https://www.arcgis.com/apps/Embed/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7&extent=-123.0692,38.5233,-122.9947,38.5929',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the centre and level of a classic snippet', () => {
      const value =
        'https://www.arcgis.com/apps/Embed/index.html?webmap=84a606bfb3d848c69ca61321f3ac2e9f&center=-0.1985,51.5554&level=11&zoom=true&scale=true'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '84a606bfb3d848c69ca61321f3ac2e9f',
        src: 'https://www.arcgis.com/apps/Embed/index.html?webmap=84a606bfb3d848c69ca61321f3ac2e9f&center=-0.1985,51.5554&level=11',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=84a606bfb3d848c69ca61321f3ac2e9f',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the classic embed viewer with its box', () => {
      const value =
        'http://www.arcgis.com/home/webmap/embedViewer.html?webmap=5179ec6c47cf4fbb8ac31f6476b31203&zoom=true&extent=65.5444286545374,30.2897882432581,79.7983889146329,35.1848211677353'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '5179ec6c47cf4fbb8ac31f6476b31203',
        src: 'https://www.arcgis.com/home/webmap/embedViewer.html?webmap=5179ec6c47cf4fbb8ac31f6476b31203&extent=65.5444286545374,30.2897882432581,79.7983889146329,35.1848211677353',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=5179ec6c47cf4fbb8ac31f6476b31203',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild an organization embed viewer onto the public host with its box', () => {
      const value =
        'http://carto.maps.arcgis.com/home/webmap/embedViewer.html?webmap=115bdac4334d46ef86b6414ab63b260a&extent=-139.4316,18.7911,-62.2896,55.2527&zoom=true'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '115bdac4334d46ef86b6414ab63b260a',
        src: 'https://www.arcgis.com/home/webmap/embedViewer.html?webmap=115bdac4334d46ef86b6414ab63b260a&extent=-139.4316,18.7911,-62.2896,55.2527',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=115bdac4334d46ef86b6414ab63b260a',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a world box on the embed viewer as written', () => {
      const value =
        'http://carto.maps.arcgis.com/home/webmap/embedViewer.html?webmap=dd1f8119a2b144d28db1d35ad10f0995&extent=-90.5273,-58.9046,90.5273,58.9046&zoom=true'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'dd1f8119a2b144d28db1d35ad10f0995',
        src: 'https://www.arcgis.com/home/webmap/embedViewer.html?webmap=dd1f8119a2b144d28db1d35ad10f0995&extent=-90.5273,-58.9046,90.5273,58.9046',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=dd1f8119a2b144d28db1d35ad10f0995',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the start position of the Map Viewer embed and drop its display settings', () => {
      const value =
        'https://arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=02b63130e0ad4462a904215858213ee7&theme=dark&heading=true&scroll=false&center=-118.62436330839162,37.21741015933211&scale=36111.909643'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '02b63130e0ad4462a904215858213ee7',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=02b63130e0ad4462a904215858213ee7&center=-118.62436330839162,37.21741015933211&scale=36111.909643',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=02b63130e0ad4462a904215858213ee7',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the zoom level of a Map Viewer link', () => {
      const value =
        'https://www.arcgis.com/apps/mapviewer/index.html?webmap=02b63130e0ad4462a904215858213ee7&level=12'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '02b63130e0ad4462a904215858213ee7',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=02b63130e0ad4462a904215858213ee7&level=12',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=02b63130e0ad4462a904215858213ee7',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the retired OnePane template onto Map Viewer and drop its box', () => {
      const value =
        'http://www.arcgis.com/home/webmap/templates/OnePane/basicviewer/embed.html?webmap=9b6a2497b3d84aeb95633a58560025ee&gcsextent=-86.1328,-74.9594,180,81.6214&displayslider=true&displaylegend=true'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '9b6a2497b3d84aeb95633a58560025ee',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=9b6a2497b3d84aeb95633a58560025ee',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=9b6a2497b3d84aeb95633a58560025ee',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a story on its own player', () => {
      const value = 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'ec8a4b675cac476380df910304a47547',
        src: 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547',
        url: 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the item a story collection opens on', () => {
      const value =
        'https://storymaps.arcgis.com/collections/984d18ba39934a2095bb793b28ad697e?item=2&header=false'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '984d18ba39934a2095bb793b28ad697e',
        src: 'https://storymaps.arcgis.com/collections/984d18ba39934a2095bb793b28ad697e?item=2',
        url: 'https://storymaps.arcgis.com/collections/984d18ba39934a2095bb793b28ad697e',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should read the StoryMaps route word in any case', () => {
      const value = 'https://storymaps.arcgis.com/Stories/ec8a4b675cac476380df910304a47547'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'ec8a4b675cac476380df910304a47547',
        src: 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547',
        url: 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep an Experience Builder app on its own player', () => {
      const value = 'https://experience.arcgis.com/experience/ebec3698f7a94be5a43e9370f2f5015a/'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'ebec3698f7a94be5a43e9370f2f5015a',
        src: 'https://experience.arcgis.com/experience/ebec3698f7a94be5a43e9370f2f5015a',
        url: 'https://experience.arcgis.com/experience/ebec3698f7a94be5a43e9370f2f5015a',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the template of an Instant App, which picks the app', () => {
      const value =
        'https://www.arcgis.com/apps/instant/basic/index.html?appid=6b81ccb18d40497d879207d291dcc966&locale=es'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '6b81ccb18d40497d879207d291dcc966',
        src: 'https://www.arcgis.com/apps/instant/basic/index.html?appid=6b81ccb18d40497d879207d291dcc966',
        url: 'https://www.arcgis.com/apps/instant/basic/index.html?appid=6b81ccb18d40497d879207d291dcc966',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild an organization Instant App onto the public host', () => {
      const value =
        'https://carto.maps.arcgis.com/apps/instant/basic/index.html?appid=f3be57b7a5f94e5c82e6039efa48e6b3'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'f3be57b7a5f94e5c82e6039efa48e6b3',
        src: 'https://www.arcgis.com/apps/instant/basic/index.html?appid=f3be57b7a5f94e5c82e6039efa48e6b3',
        url: 'https://www.arcgis.com/apps/instant/basic/index.html?appid=f3be57b7a5f94e5c82e6039efa48e6b3',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a dashboard on its own player', () => {
      const value = 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'bda7594740fd40299423467b48e9ecf6',
        src: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        url: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should read the dashboard from the Dashboards app shell fragment', () => {
      const value =
        'https://www.arcgis.com/apps/dashboards/index.html#/bda7594740fd40299423467b48e9ecf6'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'bda7594740fd40299423467b48e9ecf6',
        src: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        url: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should rebuild the retired Operations Dashboard onto Dashboards', () => {
      const value =
        'https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'bda7594740fd40299423467b48e9ecf6',
        src: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        url: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the web map path', () => {
      const value =
        'https://evil.test/apps/Embed/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the story path', () => {
      const value = 'https://evil.test/stories/ec8a4b675cac476380df910304a47547'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the experience path', () => {
      const value = 'https://evil.test/experience/ebec3698f7a94be5a43e9370f2f5015a'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the developer SDK host, which serves scripts', () => {
      const value = 'https://js.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a story route on the portal host', () => {
      const value = 'https://www.arcgis.com/stories/ec8a4b675cac476380df910304a47547'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a story route on the Experience Builder host', () => {
      const value = 'https://experience.arcgis.com/stories/ec8a4b675cac476380df910304a47547'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a route word StoryMaps does not serve', () => {
      const value = 'https://storymaps.arcgis.com/briefings2/ec8a4b675cac476380df910304a47547'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a story page past the item', () => {
      const value = 'https://storymaps.arcgis.com/stories/ec8a4b675cac476380df910304a47547/edit'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the StoryMaps route list with no item', () => {
      const value = 'https://storymaps.arcgis.com/stories'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a lowercase classic embed path, which answers 404', () => {
      const value =
        'https://www.arcgis.com/apps/embed/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a web map route that names no web map', () => {
      const value =
        'https://www.arcgis.com/apps/Embed/index.html?appid=62bf87f7b2f64f15b48491d39242f4d7'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an Instant App route that names no app', () => {
      const value =
        'https://www.arcgis.com/apps/instant/basic/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an Instant App path under another prefix', () => {
      const value =
        'https://www.arcgis.com/x/apps/instant/basic/index.html?appid=6b81ccb18d40497d879207d291dcc966'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an Instant App path with a trailing segment', () => {
      const value =
        'https://www.arcgis.com/apps/instant/basic/index.html/extra?appid=6b81ccb18d40497d879207d291dcc966'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a dashboard path under another prefix', () => {
      const value = 'https://www.arcgis.com/x/apps/dashboards/bda7594740fd40299423467b48e9ecf6'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a dashboard path with a trailing segment', () => {
      const value = 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6/extra'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Dashboards app shell with no dashboard in the fragment', () => {
      const value = 'https://www.arcgis.com/apps/dashboards/index.html'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Operations Dashboard with no dashboard in the fragment', () => {
      const value = 'https://www.arcgis.com/apps/opsdashboard/index.html'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an Operations Dashboard fragment that does not start the route', () => {
      const value =
        'https://www.arcgis.com/apps/opsdashboard/index.html#home#/bda7594740fd40299423467b48e9ecf6'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an item file, which is not a player', () => {
      const value =
        'https://www.arcgis.com/sharing/rest/content/items/62bf87f7b2f64f15b48491d39242f4d7/data'

      expect(arcgisResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should fold the item id into the key and keep it as written in the player', () => {
      const value = 'https://storymaps.arcgis.com/stories/EC8A4B675CAC476380DF910304A47547'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'ec8a4b675cac476380df910304a47547',
        src: 'https://storymaps.arcgis.com/stories/EC8A4B675CAC476380DF910304A47547',
        url: 'https://storymaps.arcgis.com/stories/EC8A4B675CAC476380DF910304A47547',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should use an item id as written, even if the player answers an error', () => {
      const value = 'https://experience.arcgis.com/experience/not-an-item'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'not-an-item',
        src: 'https://experience.arcgis.com/experience/not-an-item',
        url: 'https://experience.arcgis.com/experience/not-an-item',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })

    it('should read the dashboard from an Operations Dashboard fragment with a query', () => {
      const value =
        'https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6?mobile=false'
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: 'bda7594740fd40299423467b48e9ecf6',
        src: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        url: 'https://www.arcgis.com/apps/dashboards/bda7594740fd40299423467b48e9ecf6',
        height: 500,
      }

      expect(arcgisResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('arcgisEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, arcgisEmbedResolver)

  describe('happy paths', () => {
    it('should take the map name from the stated title and drop the frame box', async () => {
      const value = html`
        <iframe
          width="600"
          height="400"
          title="Lifeform Map - Sonoma Veg Map"
          src="http://sonomaopenspace.maps.arcgis.com/apps/Embed/index.html?webmap=7bd57dbfa6e145df86268fd3e93b7766&amp;zoom=true&amp;legend=true&amp;theme=light"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '7bd57dbfa6e145df86268fd3e93b7766',
        src: 'https://www.arcgis.com/apps/Embed/index.html?webmap=7bd57dbfa6e145df86268fd3e93b7766',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=7bd57dbfa6e145df86268fd3e93b7766',
        height: 500,
        title: 'Lifeform Map - Sonoma Veg Map',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve an untitled frame', async () => {
      const value = html`
        <iframe
          src="https://experience.arcgis.com/experience/2cf7ebbe492f401db826cb21eae9bfae"
          width="100%"
          height="650px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '2cf7ebbe492f401db826cb21eae9bfae',
        src: 'https://experience.arcgis.com/experience/2cf7ebbe492f401db826cb21eae9bfae',
        url: 'https://experience.arcgis.com/experience/2cf7ebbe492f401db826cb21eae9bfae',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the developer SDK script', async () => {
      const value = '<iframe src="https://js.arcgis.com/4.33/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('arcgisWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, arcgisWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should open the element on Map Viewer at its start position and drop its box', async () => {
      const value = html`
        <arcgis-embedded-map
          style="height:800px;width:1000px;"
          item-id="51f91333c1de45c6bfa8b0c83f9a434f"
          theme="light"
          heading-enabled
          legend-enabled
          information-enabled
          basemap-gallery-enabled
          time-zone-label-enabled
          center="-36.817038734225186,-71.50051233783137"
          scale="14134452.869988834"
          portal-url="https://ncluni.maps.arcgis.com"
        ></arcgis-embedded-map>
      `
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '51f91333c1de45c6bfa8b0c83f9a434f',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=51f91333c1de45c6bfa8b0c83f9a434f&center=-36.817038734225186%2C-71.50051233783137&scale=14134452.869988834',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=51f91333c1de45c6bfa8b0c83f9a434f',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should open an element with no start position at the saved view of the map', async () => {
      const value = html`
        <arcgis-embedded-map
          style="height:500px;width:700px;"
          item-id="2a900856e71d4398a44c5a76d456641d"
          theme="light"
          heading-disabled
          legend-enabled
          portal-url="https://svt.maps.arcgis.com"
        ></arcgis-embedded-map>
      `
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '2a900856e71d4398a44c5a76d456641d',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=2a900856e71d4398a44c5a76d456641d',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=2a900856e71d4398a44c5a76d456641d',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should open an element that names no portal on ArcGIS Online, as the component does', async () => {
      const value = html`
        <arcgis-embedded-map
          item-id="2a900856e71d4398a44c5a76d456641d"
          theme="light"
        ></arcgis-embedded-map>
      `
      const expected: EmbedResolverResult = {
        provider: 'arcgis',
        id: '2a900856e71d4398a44c5a76d456641d',
        src: 'https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=2a900856e71d4398a44c5a76d456641d',
        url: 'https://www.arcgis.com/apps/mapviewer/index.html?webmap=2a900856e71d4398a44c5a76d456641d',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore an element that names no item', async () => {
      const value = html`
        <arcgis-embedded-map
          theme="light"
          portal-url="https://svt.maps.arcgis.com"
        ></arcgis-embedded-map>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an element whose portal is not a url', async () => {
      const value = html`
        <arcgis-embedded-map
          item-id="2a900856e71d4398a44c5a76d456641d"
          portal-url="svt.maps.arcgis.com"
        ></arcgis-embedded-map>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an element whose portal is not on ArcGIS Online', async () => {
      const value = html`
        <arcgis-embedded-map
          item-id="2a900856e71d4398a44c5a76d456641d"
          portal-url="https://evil.test"
        ></arcgis-embedded-map>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// An item's file is served from the portal host, so an enclosure there reaches the resolver.
describeForEachParser('arcgis through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim a web map framed as an embed', async () => {
    const value =
      '<iframe src="https://www.arcgis.com/home/webmap/embedViewer.html?webmap=62bf87f7b2f64f15b48491d39242f4d7"></iframe>'
    const expected = html`
      <div
        data-embed-id="62bf87f7b2f64f15b48491d39242f4d7"
        data-embed-provider="arcgis"
        data-embed-src="https://www.arcgis.com/home/webmap/embedViewer.html?webmap=62bf87f7b2f64f15b48491d39242f4d7"
        data-embed-url="https://www.arcgis.com/apps/mapviewer/index.html?webmap=62bf87f7b2f64f15b48491d39242f4d7"
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should claim an embedded map whose loader the pipeline strips', async () => {
    const value = html`
      <script
        type="module"
        src="https://js.arcgis.com/embeddable-components/4.32/arcgis-embeddable-components.esm.js"
      ></script>
      <arcgis-embedded-map
        item-id="06e4c3cb93114672bfb3d0ea7264fe43"
        portal-url="https://www.arcgis.com"
      ></arcgis-embedded-map>
    `
    const expected = html`
      <div
        data-embed-id="06e4c3cb93114672bfb3d0ea7264fe43"
        data-embed-provider="arcgis"
        data-embed-src="https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=06e4c3cb93114672bfb3d0ea7264fe43"
        data-embed-url="https://www.arcgis.com/apps/mapviewer/index.html?webmap=06e4c3cb93114672bfb3d0ea7264fe43"
        data-embed-height="500"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave an item file enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://www.arcgis.com/sharing/rest/content/items/62bf87f7b2f64f15b48491d39242f4d7/data',
        type: 'video/mp4',
      },
    ]
    const expected = html`
      <video data-enclosure="" controls src="https://www.arcgis.com/sharing/rest/content/items/62bf87f7b2f64f15b48491d39242f4d7/data"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
