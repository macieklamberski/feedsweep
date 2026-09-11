import { parseUrl } from 'trousse'
import type { CleanUrlFn, Enclosure, TransformContext } from '../types.js'
import { getImageFingerprint, getSizeKeywordRank, getUrlSizeHint } from './images.js'
import { absoluteUrlRegex, cleanUrl, isOnHosts, resolveOrKeepUrl } from './urls.js'
import { getEmbedSize } from './widgets.js'

const kindTypePrefixes = ['audio/', 'video/', 'image/'] as const

// PeerTube ships an audio-only rendition as `type="audio/mp4"` under `medium="video"`, so the
// type decides whenever it names a kind. A type naming none, `text/html` or a stream manifest,
// leaves the medium to answer.
export const isEnclosureKind = (
  enclosure: Enclosure,
  kind: 'audio' | 'video' | 'image',
): boolean => {
  const typed = kindTypePrefixes.find((prefix) => enclosure.type?.startsWith(prefix))

  if (typed) {
    return typed === `${kind}/`
  }

  return enclosure.medium === kind
}

export const isAvatarEnclosure = (url: string, avatarHosts: ReadonlyArray<string>): boolean => {
  return isOnHosts(url, avatarHosts)
}

const isPreferredVariant = (incoming: Enclosure, kept: Enclosure): boolean => {
  const incomingUrl = incoming.url ?? ''
  const keptUrl = kept.url ?? ''
  const incomingHint = getUrlSizeHint(incomingUrl)
  const keptHint = getUrlSizeHint(keptUrl)

  const incomingIsOriginal = incomingHint === 0
  const keptIsOriginal = keptHint === 0
  if (incomingIsOriginal !== keptIsOriginal) {
    return incomingIsOriginal
  }

  if (incomingHint !== keptHint) {
    return incomingHint > keptHint
  }

  // A rank of 0 is a keyword the table cannot order, so it must not lose to a ranked one:
  // preview is a thumbnail on one host and full-size on another.
  if (incomingIsOriginal && keptIsOriginal) {
    const incomingRank = getSizeKeywordRank(incomingUrl)
    const keptRank = getSizeKeywordRank(keptUrl)

    if (incomingRank !== 0 && keptRank !== 0 && incomingRank !== keptRank) {
      return incomingRank > keptRank
    }
  }

  return keptUrl.includes('?') && !incomingUrl.includes('?')
}

// A feed often lists one image twice, as an enclosure and a media:content at another size or
// with a ?w= query. An audio or video query string often carries identity, as on a podcast proxy.
const dedupeImageEnclosures = (
  enclosures: ReadonlyArray<Enclosure>,
  cleanUrlFn?: CleanUrlFn,
): Array<Enclosure> => {
  const indexByKey = new Map<string, number>()
  const result: Array<Enclosure> = []

  for (const enclosure of enclosures) {
    if (typeof enclosure.url !== 'string' || !isEnclosureKind(enclosure, 'image')) {
      result.push(enclosure)
      continue
    }

    const key = getImageFingerprint(enclosure.url, cleanUrlFn)
    const existingIndex = indexByKey.get(key)

    if (existingIndex === undefined) {
      indexByKey.set(key, result.length)
      result.push(enclosure)
      continue
    }

    if (isPreferredVariant(enclosure, result[existingIndex])) {
      result[existingIndex] = enclosure
    }
  }

  return result
}

const getKindRank = (rendition: Enclosure): number => {
  if (isEnclosureKind(rendition, 'video')) {
    return 3
  }

  if (isEnclosureKind(rendition, 'audio')) {
    return 2
  }

  if (isEnclosureKind(rendition, 'image')) {
    return 1
  }

  return 0
}

// PeerTube and every `podcast:alternateEnclosure` state a height and no width, so an area that
// multiplies the two is zero for the whole ladder.
const getRenditionArea = (rendition: Enclosure): number => {
  const width = rendition.width ?? rendition.height ?? 0
  const height = rendition.height ?? rendition.width ?? 0

  return width * height
}

// What orders two renditions of one thing, most significant first. A group can hold the video,
// its poster, an audio-only copy and a stream manifest, so kind outranks the publisher's default
// flag and the flag settles the rest. A ladder that states no dimensions falls to bytes, and
// every rendition of a group runs the same length.
const getRenditionRanks = (rendition: Enclosure): Array<number> => {
  return [
    getKindRank(rendition),
    rendition.isDefault ? 1 : 0,
    getRenditionArea(rendition),
    rendition.length ?? 0,
  ]
}

const outranksRendition = (incoming: Enclosure, kept: Enclosure): boolean => {
  const incomingRanks = getRenditionRanks(incoming)
  const keptRanks = getRenditionRanks(kept)

  for (const [index, rank] of incomingRanks.entries()) {
    if (rank !== keptRanks[index]) {
      return rank > keptRanks[index]
    }
  }

  return false
}

// A media group is one thing in several renditions, so only one of them renders. A group with
// nothing to load renders nothing.
const pickGroupRendition = (renditions: ReadonlyArray<Enclosure>): Enclosure | undefined => {
  const renderable = renditions.filter((rendition) => rendition.url ?? rendition.playerUrl)

  let picked = renderable[0]

  for (const rendition of renderable) {
    if (outranksRendition(rendition, picked)) {
      picked = rendition
    }
  }

  return picked
}

// An entry outside any group that names the same file as a group member is that member listed
// again, so it joins the group: it keeps its own position and takes the member's fields.
const foldEqualMembers = (
  enclosures: ReadonlyArray<Enclosure>,
  cleanUrlFn?: CleanUrlFn,
): Array<Enclosure> => {
  const members = new Map<string, Enclosure>()

  for (const enclosure of enclosures) {
    if (enclosure.groupIndex !== undefined && typeof enclosure.url === 'string') {
      members.set(cleanUrl(enclosure.url, { cleanUrlFn }), enclosure)
    }
  }

  if (!members.size) {
    return [...enclosures]
  }

  const emitted = new Set<Enclosure>()
  const folded: Array<Enclosure> = []

  for (const enclosure of enclosures) {
    if (enclosure.groupIndex !== undefined) {
      if (!emitted.has(enclosure)) {
        emitted.add(enclosure)
        folded.push(enclosure)
      }

      continue
    }

    if (typeof enclosure.url !== 'string') {
      folded.push(enclosure)
      continue
    }

    const member = members.get(cleanUrl(enclosure.url, { cleanUrlFn }))

    if (!member) {
      folded.push(enclosure)
      continue
    }

    if (!emitted.has(member)) {
      emitted.add(member)
      folded.push({ ...enclosure, ...member })
    }
  }

  return folded
}

// Keeps one rendition per group, in the place the group's first member had. Enclosures outside
// a group pass through as they are.
const collapseGroups = (
  enclosures: ReadonlyArray<Enclosure>,
  cleanUrlFn?: CleanUrlFn,
): Array<Enclosure> => {
  const folded = foldEqualMembers(enclosures, cleanUrlFn)
  const groups = new Map<number, Array<Enclosure>>()

  for (const enclosure of folded) {
    if (enclosure.groupIndex === undefined) {
      continue
    }

    const renditions = groups.get(enclosure.groupIndex) ?? []
    renditions.push(enclosure)
    groups.set(enclosure.groupIndex, renditions)
  }

  const collapsed: Array<Enclosure> = []

  for (const enclosure of folded) {
    if (enclosure.groupIndex === undefined) {
      collapsed.push(enclosure)
      continue
    }

    const renditions = groups.get(enclosure.groupIndex)

    if (renditions?.[0] !== enclosure) {
      continue
    }

    const rendition = pickGroupRendition(renditions)

    if (rendition) {
      collapsed.push(rendition)
    }
  }

  return collapsed
}

// Query param values that are themselves absolute URLs, e.g. the file URL inside
// a player page like player.example.com/?media_url=<file>.
const extractNestedUrls = (url: string): Array<string> => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return []
  }

  const nested: Array<string> = []

  for (const value of parsed.searchParams.values()) {
    if (absoluteUrlRegex.test(value)) {
      nested.push(value)
    }
  }

  return nested
}

// rawvoice:embed carries the player as raw embed HTML: an iframe, or a native <audio> for the
// enclosure's own file, or plain text.
const extractEnclosureFromEmbed = (enclosure: Enclosure, document: Document): Enclosure => {
  if (!enclosure.playerEmbed) {
    return enclosure
  }

  const { playerEmbed, ...rest } = enclosure
  const container = document.createElement('div')
  container.innerHTML = playerEmbed

  const frame = container.querySelector('iframe[src], embed[src]')

  if (!frame) {
    return rest
  }

  // The size moves whole from whichever source states one, the enclosure's own Media RSS
  // dimensions first and the frame's otherwise: a width the feed stated beside a height the
  // iframe stated is a box neither describes. A lone height is the size a fixed-height player states.
  const frameSize = getEmbedSize(frame, 0)
  const stated = rest.width || rest.height ? rest : frameSize

  return {
    ...rest,
    url: rest.url ?? frame.getAttribute('src') ?? undefined,
    ...(stated.width && { width: stated.width }),
    ...(stated.height && { height: stated.height }),
  }
}

const readEnclosure = (
  enclosure: Enclosure,
  document: Document,
  context: TransformContext,
): Enclosure => {
  const extracted = extractEnclosureFromEmbed(enclosure, document)

  return {
    ...extracted,
    url: resolveOrKeepUrl(extracted.url, context),
    playerUrl: resolveOrKeepUrl(extracted.playerUrl, context),
  }
}

// A podcast host pairs a plain <enclosure> with a player page carrying the file url in a query
// param, like …/?media_url=<file>, and the param name varies by host.
const mergePlayerEnclosures = (
  enclosures: ReadonlyArray<Enclosure>,
  cleanUrlFn?: CleanUrlFn,
): Array<Enclosure> => {
  const result = [...enclosures]
  const removed = new Set<number>()

  const findFileIndex = (nestedUrl: string, playerIndex: number): number => {
    return result.findIndex((candidate, index) => {
      if (index === playerIndex || removed.has(index)) {
        return false
      }

      return (
        typeof candidate.url === 'string' && cleanUrl(candidate.url, { cleanUrlFn }) === nestedUrl
      )
    })
  }

  for (let playerIndex = 0; playerIndex < result.length; playerIndex++) {
    const player = result[playerIndex]

    if (removed.has(playerIndex) || typeof player.url !== 'string') {
      continue
    }

    for (const nested of extractNestedUrls(player.url)) {
      const fileIndex = findFileIndex(cleanUrl(nested, { cleanUrlFn }), playerIndex)

      if (fileIndex === -1) {
        continue
      }

      const file = result[fileIndex]
      // A player page often carries the display size the file entry lacks.
      const merged: Enclosure = { ...player, ...file, playerUrl: file.playerUrl ?? player.url }

      result[Math.min(playerIndex, fileIndex)] = merged
      removed.add(Math.max(playerIndex, fileIndex))
      break
    }
  }

  return result.filter((_, index) => !removed.has(index))
}

// Reads the enclosures and gets them into the shape injection works with: one rendition per
// group, image variants collapsed, player pages merged with their files.
export const prepareEnclosures = (
  enclosures: ReadonlyArray<Enclosure>,
  document: Document,
  context: TransformContext,
): Array<Enclosure> => {
  const resolved = enclosures.map((enclosure) => readEnclosure(enclosure, document, context))
  const collapsed = collapseGroups(resolved, context.cleanUrlFn)
  const deduped = dedupeImageEnclosures(collapsed, context.cleanUrlFn)

  return mergePlayerEnclosures(deduped, context.cleanUrlFn)
}
