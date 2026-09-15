import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import {
  composeQuery,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const figmaHost = 'figma.com'
const figmaEmbedHost = 'embed.figma.com'

// Figma keeps opening kinds: `make` and `slides` sit beside the `file`, `design`, `proto`,
// `board` and `deck` the feeds carry, and every one of them takes the same route shape.
const kindRegex = /^[a-z]+$/

// A file key is base62, so a hyphenated marketing slug sitting in the same position is not one.
const fileKeyRegex = /^[A-Za-z0-9]+$/

// `node-id` names the frame the embed opens on.
const contentParams = ['node-id']

type FigmaFile = { kind: string; key: string; name: string; search: string }

// The community catalogue spells `community/file/{numeric id}`, which fills the same three
// segments a file url does and reads as kind `community` over key `file`. That pair is identical
// for every community file there is, so keying on it would give two different embeds one id.
const catalogueKind = 'community'

// A figma url names a file as `{kind}/{key}/{name}` and nothing else.
const readFile = (url: URL): FigmaFile | undefined => {
  const segments = getPathSegments(url)
  const [kind, key, name] = segments

  if (segments.length !== 3 || !kind || !key || !name) {
    return
  }

  if (!kindRegex.test(kind) || kind === catalogueKind || !fileKeyRegex.test(key)) {
    return
  }

  return { kind, key, name, search: url.search }
}

const composeEmbed = (file: FigmaFile): EmbedResolverResult => {
  const params = pickQueryParams(file.search, contentParams)
  const path = `${file.kind}/${file.key}/${file.name}`

  return {
    provider: 'figma',
    // The id carries the kind because every kind shares one key grammar, and the oEmbed url it
    // rebuilds for a `file` is `figma.com/file/{key}`.
    id: `${file.kind}/${file.key}`,
    // `embed-host` is what makes the route serve a player at all, not a reader's preference.
    src: `https://${figmaEmbedHost}/${path}${composeQuery({ ...params, 'embed-host': 'share' })}`,
    url: `https://www.${figmaHost}/${path}${composeQuery(params)}`,
  }
}

const resolveWrappedEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const segments = parsed ? getPathSegments(parsed) : []

  if (!parsed || segments.length !== 1 || segments[0] !== 'embed') {
    return
  }

  // The wrapper frames whatever its `url` names, so a value off figma is refused and never minted.
  const wrapped = parseUrlOnHosts(parsed.searchParams.get('url') ?? undefined, figmaHost)
  const file = wrapped && readFile(wrapped)

  return file && composeEmbed(file)
}

const resolveDirectEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const file = parsed && readFile(parsed)

  return file && composeEmbed(file)
}

// Figma's older embed code, `figma.com/embed?embed_host=share&url={encoded figma url}`, which
// leaves the file and its kind inside a percent-encoded query nothing downstream reads.
export const figmaWrappedEmbedResolver = createUrlEmbedResolver([figmaHost], resolveWrappedEmbed)

// Figma's current embed code, `embed.figma.com/{kind}/{key}/{name}`.
export const figmaDirectEmbedResolver = createUrlEmbedResolver([figmaEmbedHost], resolveDirectEmbed)
