import { parseUrl } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yandexmaps'

const yandexMapsHosts = ['api-maps.yandex.ru']
const yandexMapsWidgetHosts = ['yandex.by', 'yandex.com', 'yandex.ru']

const widgetPath = '/map-widget/v1/'
// A short link the map's share dialog writes, `/map-widget/v1/-/{code}`. The code names the same
// map on every regional host.
const shortLinkPathRegex = /^\/map-widget\/v1\/-\/(?<code>[^/]+)\/?$/i

// The Constructor's own script loads the older `sid={id}` as `um=constructor:{id}`. The prefix
// names the constructor space, since `um` also carries `mymaps:` maps.
const constructorIdRegex = /^constructor:(.+)/

// A coordinate map names no item, only where the map opens: its centre `ll`, its zoom `z` and its
// layer `l`. A frame naming anything more, such as an organisation's `oid` or a search `text`,
// stays as written.
const positionParams = ['ll', 'z', 'l']

const mapHeight = 400

// Composed from the id alone, with no key and no expiry. The static render answers 400 unless
// both dimensions are stated, and 400 again above 650 by 450.
const composeStatic = (um: string): string => {
  const query = composeQuery({ um, width: '650', height: `${mapHeight}` })

  return `https://api-maps.yandex.ru/services/constructor/1.0/static/${query}`
}

const composeWidget = (um: string): string => {
  const query = composeQuery({ um, source: 'constructor' })

  return `https://yandex.ru${widgetPath}${query}`
}

const resolveConstructorMap = (query: URLSearchParams): EmbedResolverResult | undefined => {
  const constructorId = query.get('um')?.match(constructorIdRegex)?.[1] ?? query.get('sid')

  if (!constructorId) {
    return
  }

  const um = `constructor:${constructorId}`

  return {
    provider,
    id: um,
    src: composeWidget(um),
    thumbnail: composeStatic(um),
    height: mapHeight,
  }
}

const resolveCoordinateMap = (
  query: URLSearchParams,
  element: Element | undefined,
): EmbedResolverResult | undefined => {
  const names = [...query.keys()]

  if (!query.has('ll') || !names.every((name) => positionParams.includes(name))) {
    return
  }

  const position = composeQuery(pickQueryParams(query.toString(), positionParams))

  return {
    provider,
    src: `https://yandex.ru${widgetPath}${position}`,
    height: mapHeight,
    title: attr(element, 'title'),
  }
}

// The Constructor's script injects the map where it stands, so a reader strips it and the map
// renders as nothing. Its own query states the id.
export const yandexMapsScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="api-maps.yandex.ru/services/constructor/"]',
  (element): EmbedResolverResult | undefined => {
    // The selector matches a substring any host can carry, so the host is checked here.
    const url = parseUrlOnHosts(attr(element, 'src'), yandexMapsHosts)

    if (!url) {
      return
    }

    return resolveConstructorMap(url.searchParams)
  },
)

// The frame the Constructor's iframe snippet writes, which names the map by `um` alone, the frame
// of a short link, and a coordinate map's frame.
export const yandexMapsIframeEmbedResolver = createUrlEmbedResolver(
  yandexMapsWidgetHosts,
  (url, element) => {
    const parsed = parseUrl(url)
    const code = parsed?.pathname.match(shortLinkPathRegex)?.groups?.code

    if (code) {
      return {
        provider,
        id: `-/${code}`,
        src: `https://yandex.ru${widgetPath}-/${code}`,
        height: mapHeight,
      }
    }

    if (parsed?.pathname.toLowerCase() !== widgetPath) {
      return
    }

    return (
      resolveConstructorMap(parsed.searchParams) ??
      resolveCoordinateMap(parsed.searchParams, element)
    )
  },
)
