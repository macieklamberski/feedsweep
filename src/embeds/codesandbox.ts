import {
  composeQuery,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  isHostOf,
  trimObject,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { isFileName, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'codesandbox'

// A height, not a ratio: the editor fills any box, and an unsized frame renders 150 tall.
// The share dialog writes 500.
const sizes = {
  player: { height: 500 },
}

// Listed exactly, not by subdomain: sse.codesandbox.io and blog.codesandbox.io name no sandbox.
const hosts = ['codesandbox.io', 'www.codesandbox.io']

// Words CodeSandbox owns where a slug sits. `new` opens a starter template with nothing saved
// behind it.
// `/embed/github/…` carries no hash and meets a Cloudflare challenge on every server-side
// request.
const reservedSlugSegments = ['github', 'github.com', 'fork', 'new']

const projectKinds = ['sandbox', 'devbox']
const playerRoutes = ['embed', 's']

type CodesandboxTarget = {
  // The path segment the publisher wrote, hash and slug together. Kept whole because the page url
  // takes it as written and both spellings resolve.
  slug: string
  id: string
  // Where a reader goes when they click through. `/p/…` carriers already name their own page, so
  // only the `/embed/` and `/s/` forms are rewritten onto the `/s/{slug}` route CodeSandbox
  // declares canonical in its own `og:url`.
  // CodeSandbox's oEmbed answers a `/p/` url with the full JSON body under a 403 status, so an
  // enricher reads the body before the status (probed 2026-10-25).
  pagePath: string
  // The player. CodeSandbox's own `/embed/` redirects a DevBox-era sandbox to `/p/sandbox/`, a
  // DevBox included, so a `/p/` carrier keeps its route.
  src: string
}

// The slug in front of the hash is renamable, so only the hash identifies a sandbox.
const readId = (slug: string): string => {
  return slug.slice(slug.lastIndexOf('-') + 1)
}

const parseTarget = (value: URL | undefined): CodesandboxTarget | undefined => {
  const parsed = parseUrlOnHosts(value, hosts, isHostOf)

  if (!parsed) {
    return
  }

  const [route, kindOrSlug, projectSlug] = getPathSegments(parsed)
  // `/embed/{slug}` is the embed renderer and `/s/{slug}` the legacy user url for the same sandbox.
  // `/p/sandbox/` and `/p/devbox/` are the DevBox-era routes, which take `?embed=1` on the page's
  // own address.
  const isProject = isAnyOf(route, 'p') && isAnyOf(kindOrSlug, projectKinds)
  const isPlayer = isAnyOf(route, playerRoutes)
  let slug: string | undefined

  if (isProject) {
    slug = projectSlug
  } else if (isPlayer) {
    slug = kindOrSlug
  }

  // CodeSandbox serves files on its own host, so a file name is an enclosure.
  if (!slug || isAnyOf(slug, reservedSlugSegments) || isFileName(slug)) {
    return
  }

  const id = readId(slug)

  if (!id) {
    return
  }

  // The file the editor opens on, spelled `file` on the DevBox-era routes and `module` on the
  // embed renderer. The rest of the query is the editor's look.
  if (isProject) {
    const pagePath = `p/${kindOrSlug}/${slug}`
    const file = getQueryParam(parsed.searchParams, 'file')
    const query = composeQuery(trimObject({ file, embed: '1' }, Boolean))

    return { slug, id, pagePath, src: `https://codesandbox.io/${pagePath}${query}` }
  }

  const module = getQueryParam(parsed.searchParams, 'module')
  const query = composeQuery(trimObject({ module }, Boolean))

  return { slug, id, pagePath: `s/${slug}`, src: `https://codesandbox.io/embed/${slug}${query}` }
}

export const codesandboxResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const target = parseTarget(url)

  if (!target) {
    return
  }

  // The sandbox's own name, which is what the share dialog writes and what a rendered DEV.to or
  // Hashnode embed carries. `title` on the carrier is the only place a sandbox names itself
  // offline.
  const title = attr(element, 'title')

  return {
    provider,
    id: target.id,
    src: target.src,
    url: `https://codesandbox.io/${target.pagePath}`,
    ...sizes.player,
    title,
  }
}

// CodeSandbox's editor iframe, under /embed/, /s/ or the DevBox-era /p/ routes.
export const codesandboxIframeEmbedResolver = createUrlEmbedResolver(hosts, codesandboxResolveEmbed)

// The editor posts its rendered height unasked.
export const codesandboxRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: a `www.` src 301s to the apex, so every message arrives from here.
  origin: 'https://codesandbox.io',
  // Without it the editor posts a constant 500, whatever it holds.
  params: { autoresize: '1' },
  readHeight: readIframeResizeHeight,
}
