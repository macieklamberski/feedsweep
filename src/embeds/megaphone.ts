import { composeQuery, getQueryParam, getQueryParams, isHostOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { digitsRegex, isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'megaphone'

const hosts = ['megaphone.fm']

const legacyPlayerPathRegex = /^\/(?<id>[A-Z]+\d+)\/?$/

const sizes = {
  // Both players are fixed in height whatever their width: the episode player draws 200 and the
  // playlist 481 at 640 wide and wider.
  episode: { height: 200 },
  playlist: { height: 482 },
}

const embedKinds = { e: 'episode', p: 'playlist' }

export const extractMegaphoneEmbed = (
  url: URL,
): { param: string; kind: string; id: string } | undefined => {
  // Megaphone serves the episode files from the same domain as the players.
  // Episode files carry the publisher's own ?e= and ?p=, so a claimed enclosure loses its audio.
  if (isFileName(url.pathname)) {
    return
  }

  for (const [param, kind] of Object.entries(embedKinds)) {
    const id = getQueryParam(url.searchParams, param)

    if (!id) {
      continue
    }

    // NPR writes its bare story number into ?e=, and an episode id opens with letters.
    if (param === 'e' && digitsRegex.test(id)) {
      continue
    }

    return { param, kind, id }
  }

  // The legacy episode player names the episode in its path, `player.megaphone.fm/{id}`.
  if (!isHostOf(url, 'player.megaphone.fm')) {
    return
  }

  const legacyId = url.pathname.match(legacyPlayerPathRegex)?.groups?.id

  if (!legacyId) {
    return
  }

  return { param: 'e', kind: 'episode', id: legacyId }
}

// No metadata and no thumbnail without an api key, so the height is the substance here, and
// some iframes carry no height at all.
export const megaphoneResolveEmbed: ResolveUrlEmbed = (url) => {
  const embed = extractMegaphoneEmbed(url)

  if (!embed) {
    return
  }

  const playback = getQueryParams(url.search, ['start'])
  const query = composeQuery({ [embed.param]: embed.id, ...playback })

  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://playlist.megaphone.fm/${query}`,
    ...(embed.kind === 'playlist' ? sizes.playlist : sizes.episode),
  }
}

// Megaphone's player iframe, ?e= for an episode or ?p= for a playlist, some with no height at all.
export const megaphoneEmbedResolver = createUrlEmbedResolver(hosts, megaphoneResolveEmbed)

export const megaphoneRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
