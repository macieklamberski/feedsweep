import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { composeQuery, digitsRegex, isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'megaphone'

const megaphoneHosts = ['megaphone.fm']

const embedKinds = {
  // Both players are fixed in height whatever their width: the episode player draws 200 and the
  // playlist 481 at 640 wide and wider.
  e: { kind: 'episode', height: 200 },
  p: { kind: 'playlist', height: 482 },
}

export const extractMegaphoneEmbed = (
  link: string,
): { param: string; kind: string; id: string; height: number } | undefined => {
  const parsed = parseUrl(link, placeholderBaseUrl)

  // Megaphone serves the episode files from the same domain as the players.
  // Episode files carry the publisher's own ?e= and ?p=, so a claimed enclosure loses its audio.
  if (!parsed || isFileName(parsed.pathname)) {
    return
  }

  for (const [param, { kind, height }] of Object.entries(embedKinds)) {
    const id = parsed.searchParams.get(param)

    if (!id) {
      continue
    }

    // NPR writes its bare story number into ?e=, and an episode id opens with letters.
    if (param === 'e' && digitsRegex.test(id)) {
      continue
    }

    return { param, kind, id, height }
  }
}

// No metadata and no thumbnail without an api key, so the height is the substance here, and
// some iframes carry no height at all.
export const megaphoneResolveEmbed: ResolveEmbed = (url) => {
  const embed = extractMegaphoneEmbed(url)

  if (!embed) {
    return
  }

  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://playlist.megaphone.fm/${composeQuery({ [embed.param]: embed.id })}`,
    height: embed.height,
  }
}

// Megaphone's player iframe, ?e= for an episode or ?p= for a playlist, some with no height at all.
export const megaphoneEmbedResolver = createUrlEmbedResolver(megaphoneHosts, megaphoneResolveEmbed)

export const megaphoneRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
