import {
  composeQuery,
  decodeSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  parseUrl,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver, readCleanedFlashVar } from '../utils/widgets.js'

const provider = 'mixcloud'

// Without the publisher's `mini`, `hide_cover`, `hide_artwork` and `light`, the widget is the cover
// player, which fills whatever box it gets. 120 is the height Mixcloud's oEmbed states for its
// widget.
const sizes = {
  player: { height: 120 },
}

const hosts = ['mixcloud.com']

// An account's sections sit where a show slug does, and the widget answers {user}/uploads with the
// same empty shell as a fabricated slug.
const sectionSlugs = [
  'activity',
  'community',
  'dashboard',
  'favorites',
  'followers',
  'following',
  'listens',
  'playlists',
  'reposts',
  'select',
  'stream',
  'subscribe',
  'tracks',
  'uploads',
]

// Site pages at the show shape: `genres/{x}` in any case, `categories/{x}` and `tag/{x}` that
// redirect to it, and the widget's own url when a carrier loses its `feed` parameter. `media` and
// `search` are real users with shows, so they stay off the list.
const siteSegments = ['categories', 'discover', 'genres', 'live', 'tag', 'upload', 'widget']

type Show = { key: string; path: string }

// Exactly a user and a slug: a deeper path is a section of the site, not a show. The decoded
// names serve the lookups and the key, and the written segments serve the page path.
const readShow = (segments: Array<string>): Show | undefined => {
  const [rawUser, rawSlug] = segments

  if (segments.length !== 2 || !rawUser || !rawSlug) {
    return
  }

  const user = decodeSegment(rawUser) ?? rawUser
  const slug = decodeSegment(rawSlug) ?? rawSlug

  if (isAnyOf(user, siteSegments) || isAnyOf(slug, sectionSlugs)) {
    return
  }

  return { key: `${user}/${slug}`, path: `${rawUser}/${rawSlug}` }
}

const readShowUrl = (url: URL, flashFeed?: string): Show | undefined => {
  // The feed parameter holds a path in the newer embeds and a whole url in the Flash
  // mixcloudLoader.swf one, which takes it in its query or in its flashvars.
  const feed = getQueryParam(url.searchParams, 'feed') ?? flashFeed
  const source = feed ? parseUrl(feed, placeholderBaseUrl) : url

  // Mixcloud serves the show audio and the artwork from subdomains of mixcloud.com.
  // A file path has a show's two segments, so a claimed enclosure would lose its element.
  if (!source || isFileName(source.pathname)) {
    return
  }

  return readShow(getPathSegments(source))
}

export const extractMixcloudShow = (url: URL): string | undefined => {
  return readShowUrl(url)?.key
}

export const mixcloudResolveEmbed: ResolveUrlEmbed = (url, element, context) => {
  const show = readShowUrl(url, readCleanedFlashVar(element, 'feed', context))

  if (!show) {
    return
  }

  const query = composeQuery({ feed: `/${show.key}/` })

  const title = attr(element, 'title')
  const [author] = show.key.split('/')

  return {
    provider,
    id: show.key,
    // The www url 301s to player-widget.mixcloud.com, a host one redirect away from changing.
    src: `https://www.mixcloud.com/widget/iframe/${query}`,
    url: `https://www.mixcloud.com/${show.path}/`,
    ...sizes.player,
    author,
    title,
  }
}

// Mixcloud's widget iframe, its Flash player and a bare mixcloud.com/{user}/{slug} show url.
export const mixcloudEmbedResolver = createUrlEmbedResolver(hosts, mixcloudResolveEmbed)

export const mixcloudRenderHint: EmbedRenderHint = {
  provider,
  // The widget switches autoplay off on a mobile user agent. The www url redirects, so an iframe
  // allow="autoplay" has to grant any origin or the widget sits at 00:00.
  autoplayParams: { autoplay: '1' },
}
