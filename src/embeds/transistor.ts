import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'transistor'

const transistorHosts = ['transistor.fm']

// The episode player is fixed at 180, and Transistor's own oEmbed agrees. A `/latest` player holds
// one episode and `/playlist` the whole show.
const playerHeights = { e: 180, latest: 180, playlist: 390 }

// What a placeholder's id names, which has to address the endpoint on its own for enrichment.
const subjectNames = { e: 'episode', latest: 'latest', playlist: 'playlist' }

// `/e/{slug}/latest` is the newest episode of a show and `/e/{slug}/playlist` the whole show.
// Every other trailing segment, `/dark` among them, is a display option on an episode id.
const showModes = ['latest', 'playlist'] as const

type Subject = { kind: keyof typeof playerHeights; id: string }

export const extractTransistorEmbed = (link: string): Subject | undefined => {
  const segments = getPathSegments(link)
  const kind = segments[0]
  const subject = segments[1]

  // Transistor serves the episode audio on the player host, so a file name is an enclosure.
  if ((kind !== 'e' && kind !== 's') || !subject || isFileName(subject)) {
    return
  }

  const mode = showModes.find((named) => named === segments[2])

  if (kind === 'e' && mode) {
    return { kind: mode, id: subject }
  }

  // A share page is `/s/{id}` and takes nothing after it. A third segment is a transcript:
  // Transistor writes sidecars at `/s/{id}/{token}.{ext}`.
  if (kind === 's' && segments[2]) {
    return
  }

  return { kind: 'e', id: subject }
}

export const transistorResolveEmbed: ResolveEmbed = (url) => {
  const embed = extractTransistorEmbed(url)

  if (!embed) {
    return
  }

  // Dropping the mode mints /e/{slug}, an episode by a show's name, which answers 404.
  const path = embed.kind === 'e' ? `e/${embed.id}` : `e/${embed.id}/${embed.kind}`

  return {
    provider,
    id: `${subjectNames[embed.kind]}/${embed.id}`,
    src: `https://share.transistor.fm/${path}`,
    // A show mode has no page: the embed slug is not the show's subdomain, which 404s.
    // `/s/{id}` is the same episode's share page, which answers under `frame-ancestors 'self'`.
    ...(embed.kind === 'e' && { url: `https://share.transistor.fm/s/${embed.id}` }),
    height: playerHeights[embed.kind],
  }
}

// A Transistor player iframe, or a frame of the share page, which refuses framing.
export const transistorEmbedResolver = createUrlEmbedResolver(
  transistorHosts,
  transistorResolveEmbed,
)

export const transistorRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
