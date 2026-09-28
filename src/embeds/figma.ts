import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const figmaHost = 'figma.com'
const figmaEmbedHost = 'embed.figma.com'

// Other figma subdomains serve pages the wrapper never frames: `help.figma.com/hc/articles/{id}`
// has three segments and would mint a 404.
const figmaFileHosts = ['figma.com', 'www.figma.com']

// Figma keeps opening kinds: `design`, `make` and `slides` sit beside the `file`, `proto`,
// `board` and `deck` the feeds carry, and every one of them takes the same route shape.
const kindRegex = /^[a-z]+$/

// A file key is base62, so a hyphenated marketing slug sitting in the same position is not one.
const fileKeyRegex = /^[A-Za-z0-9]+$/

// `node-id` names the frame the embed opens on, and `page-id` the page that holds it.
const contentParams = ['node-id', 'page-id']

// `scaling` is how the publisher fit the canvas to the frame, and only the player reads it.
const layoutParams = ['scaling']

// The community catalogue spells `community/file/{numeric id}`, which fills the same three
// segments a file url does and reads as kind `community` over key `file`. That pair is identical
// for every community file there is, so keying on it would give two different embeds one id.
const catalogueKind = 'community'

// A figma url names a file as `{kind}/{key}/{name}` and nothing else.
const readFileEmbed = (url: URL): EmbedResolverResult | undefined => {
  const segments = getPathSegments(url)
  const [kind, key, name] = segments

  if (segments.length !== 3 || !kind || !key || !name) {
    return
  }

  if (!kindRegex.test(kind) || kind === catalogueKind || !fileKeyRegex.test(key)) {
    return
  }

  const params = pickQueryParams(url.search, contentParams)
  const layout = pickQueryParams(url.search, layoutParams)
  const path = `${kind}/${key}/${name}`
  // Figma renamed the `file` route to `design`, and both name one file, so they share one key.
  const idKind = kind === 'file' ? 'design' : kind

  return {
    provider: 'figma',
    // The id carries the kind because `proto` and `board` are different views of one file, and the
    // oEmbed url it rebuilds is `figma.com/{kind}/{key}`.
    id: `${idKind}/${key}`,
    // `embed-host` is what makes the route serve a player at all, not a reader's preference.
    src: `https://${figmaEmbedHost}/${path}${composeQuery({ ...params, ...layout, 'embed-host': 'share' })}`,
    url: `https://www.${figmaHost}/${path}${composeQuery(params)}`,
  }
}

const resolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments.length === 1 && segments[0] === 'embed') {
    // The wrapper frames whatever its `url` names, so a value off figma is refused and never minted.
    const wrapped = parseUrl(parsed.searchParams.get('url') ?? '', placeholderBaseUrl)

    if (!wrapped || !isHostOf(wrapped, figmaFileHosts)) {
      return
    }

    return readFileEmbed(wrapped)
  }

  if (!isHostOf(parsed, figmaEmbedHost)) {
    return
  }

  return readFileEmbed(parsed)
}

// Figma's two embed codes: the older `figma.com/embed?embed_host=share&url={encoded figma url}`,
// which leaves the file inside a percent-encoded query nothing downstream reads, and the current
// `embed.figma.com/{kind}/{key}/{name}`.
export const figmaEmbedResolver = createUrlEmbedResolver([figmaHost], resolveEmbed)
