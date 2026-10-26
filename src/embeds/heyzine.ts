import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type FlipBook = {
  id: string
  path: string
}

const provider = 'heyzine'

// Listed exactly, not by subdomain: cdnm.heyzine.com serves the uploaded PDFs.
const hosts = ['heyzine.com', 'www.heyzine.com', 'cdn.heyzine.com']
// Paid custom domains serve an account's flipbooks at the root, `{account}.aflip.in/{name}`. A
// book can live on its custom domain alone, so the mint keeps the host.
const customDomainHosts = ['aflip.in', 'hflip.co']

// The embed id is ten hexadecimal characters, with or without the `.html` the snippet writes.
// The viewer answers the id in either case.
const flipBookIdRegex = /^([0-9a-f]{10})(?:\.html)?$/i
// A custom slug is served without `.html`, and only some are served with it too.
const htmlExtensionRegex = /\.html$/i
// The viewer opens on the page a `#page/{n}` fragment names, framed or not.
const pageFragmentRegex = /^#page\/[^/]+$/i

const sizes = {
  player: { ratio: '490/600' },
}

const readFlipBook = (name: string): FlipBook | undefined => {
  const flipBookId = name.match(flipBookIdRegex)?.[1]

  if (flipBookId) {
    return {
      id: flipBookId,
      path: `${flipBookId}.html`,
    }
  }

  if (!name || htmlExtensionRegex.test(name)) {
    return
  }

  return {
    id: name,
    path: name,
  }
}

// A custom domain serves a name with `.html` only when the publisher wrote it into the name, and
// then serves it without too, so the key drops it.
const readCustomFlipBook = (name: string): FlipBook | undefined => {
  if (!name) {
    return
  }

  return {
    id: name.replace(htmlExtensionRegex, ''),
    path: name,
  }
}

const readPage = (parsed: URL): string => {
  return parsed.hash.match(pageFragmentRegex)?.[0] ?? ''
}

// Heyzine's flipbook viewer, which renders on its own and is its own page.
export const heyzineResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (isHostOrSubdomainOf(url, customDomainHosts)) {
    const [name = '', ...rest] = getPathSegments(url)
    const flipBook = readCustomFlipBook(name)

    if (!flipBook || rest.length) {
      return
    }

    const src = `https://${url.hostname}/${flipBook.path}${readPage(url)}`

    return {
      provider,
      id: flipBook.id,
      src,
      url: src,
      ...sizes.player,
      title: attr(element, 'title'),
    }
  }

  if (!isHostOf(url, hosts)) {
    return
  }

  const [route, name = '', ...rest] = getPathSegments(url)
  const flipBook = readFlipBook(name)

  if (!isAnyOf(route, 'flip-book') || !flipBook || rest.length) {
    return
  }

  const src = `https://heyzine.com/flip-book/${flipBook.path}${readPage(url)}`

  return {
    provider,
    id: flipBook.id,
    src,
    url: src,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const heyzineEmbedResolver = createUrlEmbedResolver(
  [...hosts, ...customDomainHosts],
  heyzineResolveEmbed,
)
