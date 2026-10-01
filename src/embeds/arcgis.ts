import { getPathSegments, isHostOf, isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type Item = {
  id: string
  src: string
  url: string
}

const provider = 'arcgis'

const arcgisHosts = ['arcgis.com']
const portalHosts = ['arcgis.com', 'www.arcgis.com']
// An organization's own host, `{org}.maps.arcgis.com`. It serves anonymous readers only when the
// organization allows them, while the public host serves every public item.
const organizationHosts = ['maps.arcgis.com']
const storyMapsHosts = ['storymaps.arcgis.com']
const experienceHosts = ['experience.arcgis.com']

// The portal answers 404 to these paths in any other case.
const webMapPaths = [
  '/apps/Embed/index.html', // The Map Viewer Classic snippet
  '/apps/mapviewer/index.html',
  '/home/webmap/embedViewer.html', // The Map Viewer Classic snippet
]
const storyRoutes = ['stories', 'collections']

const instantPathRegex = /^\/apps\/instant\/([^/]+)\/index\.html$/
const dashboardPathRegex = /^\/apps\/dashboards\/([^/]+)$/
const opsDashboardPath = '/apps/opsdashboard/index.html'
// The retired Operations Dashboard names the dashboard in the fragment, which its 301 keeps.
const opsDashboardFragmentRegex = /^#\/([^/?]+)/

// The box Map Viewer's and StoryMaps' iframe snippets write.
const snippetHeight = 500

const composeItem = (id: string, src: string): Item => {
  return { id, src, url: src }
}

const readDashboardId = (url: URL): string | undefined => {
  if (url.pathname === opsDashboardPath) {
    return url.hash.match(opsDashboardFragmentRegex)?.[1]
  }

  return url.pathname.match(dashboardPathRegex)?.[1]
}

const readPortalItem = (url: URL): Item | undefined => {
  if (webMapPaths.includes(url.pathname)) {
    const webMapId = url.searchParams.get('webmap')

    if (!webMapId) {
      return
    }

    // `configurableview` is what Map Viewer's iframe embed writes: the map without the viewer's
    // panels and sign-in bar.
    return {
      id: webMapId,
      src: `https://www.arcgis.com/apps/mapviewer/index.html?configurableview=true&webmap=${webMapId}`,
      url: `https://www.arcgis.com/apps/mapviewer/index.html?webmap=${webMapId}`,
    }
  }

  const template = url.pathname.match(instantPathRegex)?.[1]

  if (template) {
    const appId = url.searchParams.get('appid')

    if (!appId) {
      return
    }

    const src = `https://www.arcgis.com/apps/instant/${template}/index.html?appid=${appId}`

    return composeItem(appId, src)
  }

  const dashboardId = readDashboardId(url)

  if (!dashboardId) {
    return
  }

  return composeItem(dashboardId, `https://www.arcgis.com/apps/dashboards/${dashboardId}`)
}

const readItem = (url: URL): Item | undefined => {
  if (isHostOf(url, portalHosts) || isHostOrSubdomainOf(url, organizationHosts)) {
    return readPortalItem(url)
  }

  const [route = '', itemId, ...rest] = getPathSegments(url)

  if (!itemId || rest.length) {
    return
  }

  if (isHostOf(url, storyMapsHosts) && storyRoutes.includes(route)) {
    return composeItem(itemId, `https://storymaps.arcgis.com/${route}/${itemId}`)
  }

  if (isHostOf(url, experienceHosts) && route === 'experience') {
    return composeItem(itemId, `https://experience.arcgis.com/experience/${itemId}`)
  }
}

// ArcGIS Online's players for web maps, StoryMaps, Experience Builder apps, Instant Apps and
// Dashboards. Each names one item, whose id the item api answers whatever its kind.
export const arcgisResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const item = parsed ? readItem(parsed) : undefined

  if (!item) {
    return
  }

  return {
    provider,
    id: item.id.toLowerCase(),
    src: item.src,
    url: item.url,
    height: snippetHeight,
    title: attr(element, 'title'),
  }
}

export const arcgisEmbedResolver = createUrlEmbedResolver(arcgisHosts, arcgisResolveEmbed)
