import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type FlipBook = {
  id: string
  path: string
}

const provider = 'heyzine'

// Listed exactly, not by subdomain: cdnm.heyzine.com serves the uploaded PDFs.
const heyzineHosts = ['heyzine.com', 'www.heyzine.com', 'cdn.heyzine.com']

// The embed id is ten hexadecimal characters, with or without the `.html` the snippet writes.
// The viewer answers the id in either case.
const flipBookIdRegex = /^([0-9a-f]{10})(?:\.html)?$/i
// A custom slug is served only without `.html`, in either case.
const htmlExtensionRegex = /\.html$/i
// The viewer opens on the page a `#page/{n}` fragment names, framed or not.
const pageFragmentRegex = /^#page\/[^/]+$/

const readFlipBook = (name: string): FlipBook | undefined => {
  const flipBookId = name.match(flipBookIdRegex)?.[1]

  if (flipBookId) {
    return {
      id: flipBookId.toLowerCase(),
      path: `${flipBookId}.html`,
    }
  }

  if (!name || htmlExtensionRegex.test(name)) {
    return
  }

  return {
    id: name.toLowerCase(),
    path: name,
  }
}

// Heyzine's flipbook viewer, which renders on its own and is its own page.
export const heyzineResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, heyzineHosts)) {
    return
  }

  const [route, name = '', ...rest] = getPathSegments(parsed)
  const flipBook = readFlipBook(name)

  if (route !== 'flip-book' || !flipBook || rest.length) {
    return
  }

  const page = parsed.hash.match(pageFragmentRegex)?.[0] ?? ''
  const src = `https://heyzine.com/flip-book/${flipBook.path}${page}`

  return {
    provider,
    id: flipBook.id,
    src,
    url: src,
    ratio: '490/600',
  }
}

export const heyzineEmbedResolver = createUrlEmbedResolver(heyzineHosts, heyzineResolveEmbed)
