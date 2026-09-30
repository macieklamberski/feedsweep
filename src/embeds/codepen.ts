import { getPathSegments, isHostOf, parseUrl, trimObject } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches, parsePixelSize, text } from '../utils/dom.js'
import { composeQuery, placeholderBaseUrl, uuidRegex } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'codepen'

// Listed exactly, not by subdomain: blog.codepen.io and cdpn.io name no pen, and www.codepen.io
// redirects every path to the site root.
const codepenHosts = ['codepen.io']

// Slugs come in three lengths: 5 on pens from around 2012, 7 since, and 32 hex on CodePen's own.
// Pens saved in the 2.0 editor take a uuid instead.
const slugRegex = /^[A-Za-z0-9]+$/
// Theme ids are digits or a lowercase name, and panes a comma-joined list of lowercase names.
const playerParamRegex = /^[a-z0-9,]{1,64}$/
const leadingAtRegex = /^@/

// Segments CodePen owns in the position a username sits in. `cpe` is the 2.0 editor's own path
// and the prefill endpoint lives under it, so `cpe/embed/prefill` has the exact shape of a pen
// url while naming no pen.
const reservedOwnerSegments = new Set(['collection', 'cpe', 'spark'])

// What CodePen's share dialog writes in place of an author who asked not to be named, and what
// the resolver falls back to when the markup names nobody. The player ignores this segment, and
// the pen page redirects it to the real owner, so it only has to be a syntactically valid username.
const anonymousUser = 'anon'

// Handles that name nobody. CodePen serves a pen under any word in the username position and
// redirects its page to the real owner, so a route word there says nothing about who wrote it.
const ownerlessUsers = new Set([anonymousUser, 'api', 'pen', 'project'])

// CodePen's snippet ships `data-height="300"` and calls every attribute but slug and user optional.
const defaultPenHeight = 300

type CodepenTarget = {
  kind: 'pen' | 'embed'
  // Absent when the url or the markup names no author. Only a private pen's page needs it: the
  // page redirects any other word here to the real owner, but drops the token segment on the way.
  user?: string
  // How the owner is addressed in a public url: `team/{name}` for a team, `{name}` for a person.
  // The player does not care, but the pen's page does.
  ownerPath?: string
  // What opens a private pen: the share dialog's `key`, or the token the loader appends to the
  // slug as a path segment. Without either the placeholder would link to a pen the reader
  // cannot see.
  key?: string
  token?: string
  // Which panes the player opens on and in what colours. The loader copies both into the query
  // of the iframe it builds, so a placeholder minted from the block carries them too. Neither
  // belongs on the pen's own page, which has no panes to choose.
  defaultTab?: string
  themeId?: string
  // A block from the 2.0 editor, whose player the loader builds under `/editor/`.
  isEditor?: boolean
  // The height stated in the player's own query, which is where the loader puts it and where most
  // iframe urls carry it. An attribute on the carrier outranks it, since that is the box the
  // publisher actually laid out.
  height?: number
  slug: string
}

const readUser = (value: string | undefined): string | undefined => {
  // The share dialog writes the handle with its `@`, while the url path carries both spellings.
  const name = value?.trim().replace(leadingAtRegex, '')

  if (!name || ownerlessUsers.has(name.toLowerCase())) {
    return
  }

  return name
}

const parseTarget = (value: string | undefined): CodepenTarget | undefined => {
  // A twice-encoded feed leaves a literal `&amp;` that hides the `key` parameter after it.
  const parsed = parseUrl(value?.replaceAll('&amp;', '&') ?? '', placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, codepenHosts)) {
    return
  }

  const allSegments = getPathSegments(parsed)
  // The 2.0 editor's pens sit one segment deeper, under `editor/`. The route word is case-sensitive.
  const segments = allSegments[0] === 'editor' ? allSegments.slice(1) : allSegments
  // A team's pens sit one segment deeper, under `team/{name}/`.
  const isTeam = segments[0] === 'team'
  const [rawUser, kind, ...rest] = isTeam ? segments.slice(1) : segments

  if (!rawUser || reservedOwnerSegments.has(rawUser.toLowerCase())) {
    return
  }

  if (kind !== 'pen' && kind !== 'embed') {
    return
  }

  // `embed/preview/{slug}` is the deferred-loading player, the same pen behind one more segment.
  const [slug, pathToken] = kind === 'embed' && rest[0] === 'preview' ? rest.slice(1) : rest

  if (!slug || !(slugRegex.test(slug) || uuidRegex.test(slug))) {
    return
  }

  const user = readUser(rawUser)
  const queryToken = parsed.searchParams.get('token')
  // A query token comes out decoded, and it goes into a path beside the raw path spelling.
  const token = pathToken ?? (queryToken ? encodeURIComponent(queryToken) : undefined)
  const height = parsePixelSize(parsed.searchParams.get('height'))

  return {
    kind,
    slug,
    user,
    ownerPath: user && (isTeam ? `team/${user}` : user),
    key: parsed.searchParams.get('key') ?? undefined,
    token,
    height,
  }
}

const composePenQuery = (target: CodepenTarget, forPlayer: boolean): string => {
  const grants = trimObject({ key: target.key }, Boolean)

  if (!forPlayer) {
    return composeQuery(grants)
  }

  return composeQuery({
    ...grants,
    ...(target.defaultTab && { 'default-tab': target.defaultTab }),
    ...(target.themeId && { 'theme-id': target.themeId }),
  })
}

const composeThumbnail = (target: CodepenTarget): string => {
  // `shots.codepen.io` serves four widths, 512 through 1280, and answers 200 with a picture of
  // CodePen's own 404 page once a pen is gone or private.
  // The slug alone selects the render, so an author-less embed still carries a thumbnail.
  return `https://shots.codepen.io/${target.user ?? anonymousUser}/pen/${target.slug}-512.jpg`
}

const composeEmbed = (
  target: CodepenTarget,
  extra: Partial<EmbedResolverResult> = {},
): EmbedResolverResult => {
  const owner = target.user ?? anonymousUser
  const slugPath = target.token ? `${target.slug}/${target.token}` : target.slug
  const playerPath = target.isEditor ? `editor/${owner}` : owner
  let pageOwner = target.ownerPath

  // The page redirects to the real owner and keeps the query, but drops a token segment. A key
  // pen stays out too: no private pen was at hand to see its redirect.
  if (!pageOwner && !target.token && !target.key) {
    pageOwner = anonymousUser
  }

  return {
    provider,
    id: target.slug,
    src: `https://codepen.io/${playerPath}/embed/${slugPath}${composePenQuery(target, true)}`,
    ...(pageOwner && {
      url: `https://codepen.io/${pageOwner}/pen/${slugPath}${composePenQuery(target, false)}`,
    }),
    // `shots.codepen.io` answers its 404 picture for a pen the 2.0 editor slugs with a uuid, and
    // a blank white one for a pen moved to that editor.
    ...(!target.isEditor &&
      !uuidRegex.test(target.slug) && { thumbnail: composeThumbnail(target) }),
    height: target.height ?? defaultPenHeight,
    ...(target.user && { author: `@${target.user}` }),
    ...extra,
  }
}

// `data-slug-hash` is what the dialog writes today and `data-href` what it wrote before, holding
// the pen's whole url. A prefill block carries neither.
const readPenReference = (element: Element): CodepenTarget | undefined => {
  const slug = attr(element, 'data-slug-hash')

  if (slug) {
    return { kind: 'embed', slug }
  }

  const href = attr(element, 'data-href')

  if (!href) {
    return
  }

  return parseTarget(href) ?? (slugRegex.test(href) ? { kind: 'embed', slug: href } : undefined)
}

const readWidget = (element: Element): EmbedResolverResult | undefined => {
  const reference = readPenReference(element)

  if (!reference) {
    return
  }

  const { slug, key } = reference
  // The loader appends the block's token to the slug of the player it builds, so a private pen
  // embedded this way names its token here, not in a url.
  const token = attr(element, 'data-token') ?? reference.token
  let user = reference.user
  let ownerPath = reference.ownerPath
  let linkedTitle: string | undefined

  // The loader follows the sentence's own link, whose text is the pen's name in an intact snippet.
  for (const anchor of element.querySelectorAll('a[href]')) {
    const target = parseTarget(attr(anchor, 'href'))

    if (target?.kind !== 'pen' || target.slug !== slug) {
      continue
    }

    user ??= target.user
    ownerPath ??= target.ownerPath
    linkedTitle ??= text(anchor)
  }

  // After the link: `data-user` goes stale when a block is copied and the two disagree.
  // `data-user` names a person and has no way to say team.
  user ??= readUser(attr(element, 'data-user'))
  ownerPath ??= user

  const title = attr(element, 'data-pen-title') ?? linkedTitle
  // The height the author chose for the player, which the loader passes straight through. A
  // block naming the pen by its whole url states it in that url's query instead, so the
  // attribute is read first and the url is what answers when it is absent.
  const height = parsePixelSize(attr(element, 'data-height')) ?? reference.height

  // The panes and the theme the author picked for this player, which the loader would have put
  // into the query of the iframe it built.
  const defaultTab = keepIfMatches(attr(element, 'data-default-tab'), playerParamRegex)
  const themeId = keepIfMatches(attr(element, 'data-theme-id'), playerParamRegex)
  const isEditor = attr(element, 'data-version') === '2'

  return composeEmbed(
    { kind: 'embed', user, ownerPath, key, token, slug, defaultTab, themeId, isEditor, height },
    { title },
  )
}

// CodePen's "See the Pen" paragraph, which only the ei.js loader feeds strip turns into a pen.
// One ei.js script serves every pen in a post and often sits far below them.
export const codepenWidgetEmbedResolver = createMarkupEmbedResolver(
  [
    'p.codepen[data-slug-hash]',
    'p.codepen[data-href]',
    'div.codepen[data-slug-hash]',
    'div.codepen[data-href]',
  ].join(', '),
  readWidget,
)

export const codepenResolveEmbed: ResolveEmbed = (url, element) => {
  const target = parseTarget(url)

  if (target?.kind !== 'embed') {
    return
  }

  return composeEmbed(target, { src: url, title: attr(element, 'title') })
}

// CodePen's player iframe, written by hand or left behind by a CMS that ran ei.js on export.
export const codepenIframeEmbedResolver = createUrlEmbedResolver(
  ['codepen.io'],
  codepenResolveEmbed,
)

export const codepenFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: /^codepen (?:embed|by)\b.*$/ },
  { provider, field: 'title', drop: 'CodePen' },
  { provider, field: 'title', drop: 'Untitled' },
]
