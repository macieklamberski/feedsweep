import {
  composeQuery,
  getPathSegments,
  getQueryParam,
  getQueryParams,
  isAnyOf,
  isHostOf,
} from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { alphanumericRegex, lettersRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'figma'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['figma.com']
const embedHosts = ['embed.figma.com']

// Other figma subdomains serve pages the wrapper never frames: `help.figma.com/hc/articles/{id}`
// has three segments and would mint a 404.
const fileHosts = ['figma.com', 'www.figma.com']

// `node-id` names the frame the embed opens on, `page-id` the page that holds it,
// `starting-point-node-id` the node that starts a prototype's flow, and `version-id` the version.
// See: https://developers.figma.com/docs/embeds/embed-figma-prototype/.
const contentParams = ['node-id', 'page-id', 'starting-point-node-id', 'version-id']

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

  // Figma keeps opening kinds beside the `file`, `proto`, `board` and `deck` the feeds carry, and
  // every one takes the same route shape. A file key is base62, so a hyphenated slug is not one.
  if (!lettersRegex.test(kind) || isAnyOf(kind, catalogueKind) || !alphanumericRegex.test(key)) {
    return
  }

  const params = getQueryParams(url.search, contentParams)
  const path = `${kind}/${key}/${name}`
  // Figma renamed the `file` route to `design`, and both name one file, so they share one key.
  const idKind = isAnyOf(kind, 'file') ? 'design' : kind

  return {
    provider,
    // The id carries the kind because `proto` and `board` are different views of one file, and the
    // oEmbed url it rebuilds is `figma.com/{kind}/{key}`.
    id: `${idKind}/${key}`,
    // `embed-host` is what makes the route serve a player at all, not a reader's preference.
    src: `https://embed.figma.com/${path}${composeQuery({ ...params, 'embed-host': 'share' })}`,
    url: `https://www.figma.com/${path}${composeQuery(params)}`,
    ...sizes.player,
  }
}

const resolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)
  const [route] = segments

  if (segments.length === 1 && isAnyOf(route, 'embed')) {
    // The wrapper frames whatever its `url` names, so
    // a value off figma is refused and never minted.
    const wrapped = parseUrlOnHosts(getQueryParam(url.searchParams, 'url'), fileHosts, isHostOf)

    if (!wrapped) {
      return
    }

    return readFileEmbed(wrapped)
  }

  if (!isHostOf(url, embedHosts)) {
    return
  }

  return readFileEmbed(url)
}

// Figma's two embed codes: the older `figma.com/embed?embed_host=share&url={encoded figma url}`,
// which leaves the file inside a percent-encoded query nothing downstream reads, and the current
// `embed.figma.com/{kind}/{key}/{name}`.
export const figmaEmbedResolver = createUrlEmbedResolver(hosts, resolveEmbed)
