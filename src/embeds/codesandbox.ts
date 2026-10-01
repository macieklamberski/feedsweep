import { getPathSegments, isHostOf, parseUrl, trimObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { composeQuery, isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'codesandbox'

// Listed exactly, not by subdomain: sse.codesandbox.io and blog.codesandbox.io name no sandbox.
const codesandboxHosts = ['codesandbox.io', 'www.codesandbox.io']

// Words CodeSandbox owns where a slug sits. `new` opens a starter template with nothing saved
// behind it.
// `/embed/github/…` carries no hash and meets a Cloudflare challenge on every server-side
// request.
const reservedSlugSegments = new Set(['github', 'github.com', 'fork', 'new'])

const projectKinds = ['sandbox', 'devbox']
const playerRoutes = ['embed', 's']

// A height, not a ratio: the editor fills any box, and an unsized frame renders 150 tall.
// The share dialog writes 500.
const defaultSandboxHeight = 500

type CodesandboxTarget = {
  // The path segment the publisher wrote, hash and slug together. Kept whole because the page url
  // takes it as written and both spellings resolve.
  slug: string
  id: string
  // Where a reader goes when they click through. `/p/…` carriers already name their own page, so
  // only the `/embed/` and `/s/` forms are rewritten onto the `/s/{slug}` route CodeSandbox
  // declares canonical in its own `og:url`.
  pagePath: string
  // The player. CodeSandbox's own `/embed/` redirects a DevBox-era sandbox to `/p/sandbox/`, a
  // DevBox included, so a `/p/` carrier keeps its route.
  src: string
}

// The slug in front of the hash is renamable, so only the hash identifies a sandbox.
const readId = (slug: string): string => {
  return slug.slice(slug.lastIndexOf('-') + 1)
}

const parseTarget = (value: string | undefined): CodesandboxTarget | undefined => {
  const parsed = parseUrl(value ?? '', placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, codesandboxHosts)) {
    return
  }

  const [first, second, third] = getPathSegments(parsed)
  // `/embed/{slug}` is the embed renderer and `/s/{slug}` the legacy user url for the same sandbox.
  // `/p/sandbox/` and `/p/devbox/` are the DevBox-era routes, which take `?embed=1` on the page's
  // own address.
  const isProject = first === 'p' && projectKinds.includes(second)
  const isPlayer = playerRoutes.includes(first)
  let slug: string | undefined

  if (isProject) {
    slug = third
  } else if (isPlayer) {
    slug = second
  }

  // CodeSandbox serves files on its own host, so a file name is an enclosure.
  if (!slug || reservedSlugSegments.has(slug.toLowerCase()) || isFileName(slug)) {
    return
  }

  const id = readId(slug)

  if (!id) {
    return
  }

  // The file the editor opens on, spelled `file` on the DevBox-era routes and `module` on the
  // embed renderer. The rest of the query is the editor's look.
  if (isProject) {
    const pagePath = `p/${second}/${slug}`
    const file = parsed.searchParams.get('file') ?? undefined
    const query = composeQuery(trimObject({ file, embed: '1' }, Boolean))

    return { slug, id, pagePath, src: `https://codesandbox.io/${pagePath}${query}` }
  }

  const module = parsed.searchParams.get('module') ?? undefined
  const query = composeQuery(trimObject({ module }, Boolean))

  return { slug, id, pagePath: `s/${slug}`, src: `https://codesandbox.io/embed/${slug}${query}` }
}

export const codesandboxResolveEmbed: ResolveEmbed = (url, element) => {
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
    height: defaultSandboxHeight,
    title,
  }
}

// CodeSandbox's editor iframe, under /embed/, /s/ or the DevBox-era /p/ routes.
export const codesandboxIframeEmbedResolver = createUrlEmbedResolver(
  ['codesandbox.io'],
  codesandboxResolveEmbed,
)

// The editor posts its rendered height unasked.
export const codesandboxRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: a `www.` src 301s to the apex, so every message arrives from here.
  origin: 'https://codesandbox.io',
  // Without it the editor posts a constant 500, whatever it holds.
  params: { autoresize: '1' },
  readHeight: readIframeResizeHeight,
}
