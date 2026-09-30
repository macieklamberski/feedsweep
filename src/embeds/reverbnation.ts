import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { filterUrlQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const reverbnationHosts = ['reverbnation.com']

// Every widget names what it plays as a kind and a number: `artist_1018382`, `Playlist_957851`,
// `Album_170738`, and the rarer `fan_` and `promoter_`. The kind is capitalised inconsistently by
// the site's own snippets, so it is taken as written and passed through as written.
const safeIdRegex = /^[A-Za-z]+_\d+$/

// The Flash players, all of them under `widgets/swf/{revision}/`. `pro_widget` is the common one
// at 49 occurrences, then `tuneWidget` 17, `widgetPlayer` 7, `press` 5, `widgetPlayerMini` 3,
// `blog_player` 2 and `widgetPlayerMicro` 1.
const flashPathRegex = /^\/+widgets\/swf\//

// The three parameters those players use to name their subject. They are the same id space as
// the html widget's path: all six Flash-era ids sampled from the corpus answer 200 there, against
// 404 for a fabricated one.
const flashIdParams = ['id', 'emailPlaylist', 'twID']

// The three parameters that decide what the html widget plays. `widget_id` picks the player,
// `pwc[song_ids]` one song on it, and `pwc[included_songs]` whether the rest of the list comes too.
const widgetParams = ['widget_id', 'pwc[song_ids]', 'pwc[included_songs]']

const isWidgetParam = (name: string): boolean => {
  return widgetParams.includes(name)
}

const composeSource = (id: string, query: string): string => {
  return `https://www.reverbnation.com/widget_code/html_widget/${id}${query}`
}

const readWidgetId = (url: URL): string | undefined => {
  const segments = getPathSegments(url)

  return segments[0] === 'widget_code' && segments[1] === 'html_widget' ? segments[2] : undefined
}

// The Flash players sit on cache.reverbnation.com, which serves swf files and nothing else.
const readFlashId = (url: URL): string | undefined => {
  if (!flashPathRegex.test(url.pathname)) {
    return
  }

  for (const name of flashIdParams) {
    const id = url.searchParams.get(name)

    if (id) {
      return id
    }
  }
}

export const reverbnationResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, reverbnationHosts)

  if (!parsed) {
    return
  }

  const widget = readWidgetId(parsed)
  const id = widget ?? readFlashId(parsed)

  if (!id || !safeIdRegex.test(id)) {
    return
  }

  // No page url: reverbnation.com/artist/{id} and its siblings all 404 for the numeric id.
  // No size either: the widget reflows, 500 tall at 1200 wide and 400 tall at 400 wide, neither a
  // fixed height nor a ratio. The widget page carries the slug that names the artist's page.
  return {
    provider: 'reverbnation',
    id,
    src: composeSource(id, widget ? filterUrlQuery(parsed, isWidgetParam) : ''),
  }
}

// ReverbNation's html widget iframe and the Flash players under widgets/swf/ naming the same id.
export const reverbnationEmbedResolver = createUrlEmbedResolver(
  reverbnationHosts,
  reverbnationResolveEmbed,
)
