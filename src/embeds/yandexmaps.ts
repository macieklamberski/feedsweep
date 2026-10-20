import { parseUrl } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yandexmaps'

const yandexMapsHosts = ['api-maps.yandex.ru']
const yandexMapsWidgetHosts = ['yandex.ru']

const widgetPath = '/map-widget/v1/'

// The Constructor's own script loads the older `sid={id}` as `um=constructor:{id}`. The prefix
// names the constructor space, since `um` also carries `mymaps:` maps.
const constructorIdRegex = /^constructor:(.+)/

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

// The frame the Constructor's iframe snippet writes, which names the map by `um` alone.
export const yandexMapsIframeEmbedResolver = createUrlEmbedResolver(
  yandexMapsWidgetHosts,
  (url) => {
    const parsed = parseUrl(url)

    if (parsed?.pathname !== widgetPath) {
      return
    }

    return resolveConstructorMap(parsed.searchParams)
  },
)
