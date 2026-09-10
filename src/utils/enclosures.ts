import { parseUrl } from 'trousse'
import type { CleanUrlFn, Enclosure, TransformContext } from '../types.js'
import { getImageFingerprint, getSizeKeywordRank, getUrlSizeHint } from './images.js'
import { absoluteUrlRegex, cleanUrl, isOnHosts, resolveOrKeepUrl } from './urls.js'
import { getEmbedSize } from './widgets.js'

export const isAudioEnclosure = (enclosure: Enclosure): boolean => {
  return enclosure.medium === 'audio' || !!enclosure.type?.startsWith('audio/')
}

export const isVideoEnclosure = (enclosure: Enclosure): boolean => {
  return enclosure.medium === 'video' || !!enclosure.type?.startsWith('video/')
}

export const isImageEnclosure = (enclosure: Enclosure): boolean => {
  return enclosure.medium === 'image' || !!enclosure.type?.startsWith('image/')
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
    if (typeof enclosure.url !== 'string' || !isImageEnclosure(enclosure)) {
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

// Reads the enclosures and gets them into the shape injection works with: image variants
// collapsed, player pages merged with their files.
export const prepareEnclosures = (
  enclosures: ReadonlyArray<Enclosure>,
  document: Document,
  context: TransformContext,
): Array<Enclosure> => {
  const resolved = enclosures.map((enclosure) => readEnclosure(enclosure, document, context))
  const deduped = dedupeImageEnclosures(resolved, context.cleanUrlFn)

  return mergePlayerEnclosures(deduped, context.cleanUrlFn)
}
