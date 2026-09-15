import type { EmbedResolverResult } from '../types.js'
import { attr, keepIfMatches, parsePixelSize } from '../utils/dom.js'
import { decodeOrKeep, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'yandexmaps'

const yandexMapsHosts = ['api-maps.yandex.ru']

// The Constructor addresses one map through three id spaces, and none of them reads as another:
// the current `um=constructor:{64 hex}`, the older `sid={32 url-safe}`, and the short link of
// `/frame/v1/-/{short}`, which arrives as its own iframe and never as a script.
const constructorIdRegex = /^constructor:([0-9a-f]{64})$/i
const legacySidRegex = /^[A-Za-z0-9_-]{32}$/

// The static render answers 400 unless both dimensions are stated, and 400 again above 650 by
// 450, so a larger carrier box is scaled into that range on the way into the url.
const maximumStaticWidth = 650
const maximumStaticHeight = 450

// Composed from the id alone, with no key and no expiry.
const composeStatic = (name: string, id: string, width: number, height: number): string => {
  const scale = Math.min(maximumStaticWidth / width, maximumStaticHeight / height, 1)
  const query = new URLSearchParams([
    [name, id],
    ['width', `${Math.round(width * scale)}`],
    ['height', `${Math.round(height * scale)}`],
  ])

  return `https://api-maps.yandex.ru/services/constructor/1.0/static/?${query}`
}

const composeWidget = (um: string): string => {
  const query = new URLSearchParams([
    ['um', um],
    ['source', 'constructor'],
  ])

  return `https://yandex.ru/map-widget/v1/?${query}`
}

// The Constructor's script injects the map where it stands, so a reader strips it and the map
// renders as nothing. Its own query states the id and the size the publisher chose.
export const yandexMapsScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="api-maps.yandex.ru/services/constructor/"]',
  (element): EmbedResolverResult | undefined => {
    // The selector matches a substring any host can carry, so the host is checked here.
    const query = parseUrlOnHosts(attr(element, 'src'), yandexMapsHosts)?.searchParams

    if (!query) {
      return
    }

    const width = parsePixelSize(query.get('width'))
    const height = parsePixelSize(query.get('height'))
    const size = width && height ? { width, height } : undefined

    // The `um` value carries its `constructor:` prefix percent-encoded in most feeds, and the
    // query decodes one level, so a doubly escaped one still arrives with the escape on it.
    const constructorId = decodeOrKeep(query.get('um') ?? undefined)?.match(constructorIdRegex)?.[1]

    if (constructorId) {
      const um = `constructor:${constructorId}`
      const thumbnail = size && composeStatic('um', um, size.width, size.height)

      return { provider, id: um, src: composeWidget(um), thumbnail, ...size }
    }

    // `yandex.ru/map-widget/v1` answers 200 for an id it cannot serve, so nothing there says
    // whether it reads the `sid` space, and this branch mints the static render instead.
    const sid = keepIfMatches(query.get('sid'), legacySidRegex)

    if (!sid || !size) {
      return
    }

    const staticUrl = composeStatic('sid', sid, size.width, size.height)

    return { provider, id: `sid:${sid}`, src: staticUrl, thumbnail: staticUrl, ...size }
  },
)
