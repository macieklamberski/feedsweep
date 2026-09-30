import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { composeQuery, isFileName, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The letters keep NPR's bare story number, written into ?e=, from reading as an episode.
const safeEpisodeIdRegex = /^[A-Z]+\d+$/i
const safePlaylistIdRegex = /^[A-Z0-9]+$/i

const megaphoneHosts = ['megaphone.fm']

const embedKinds = {
  // Both players are fixed in height whatever their width: the episode player draws 200 and the
  // playlist 481 at 640 wide and wider.
  e: { kind: 'episode', height: 200, safeIdRegex: safeEpisodeIdRegex },
  p: { kind: 'playlist', height: 482, safeIdRegex: safePlaylistIdRegex },
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

  for (const [param, { kind, height, safeIdRegex }] of Object.entries(embedKinds)) {
    const id = parsed.searchParams.get(param)

    if (id && safeIdRegex.test(id)) {
      return { param, kind, id, height }
    }
  }
}

// No metadata and no thumbnail without an api key, so the height is the substance here, and
// some iframes carry no height at all.
// Where playback starts stays in the player url. The look the publisher picked is a param a reader
// may apply or override.
const startParams = ['start']
const displayParams = ['light', 'artwork']

export const megaphoneResolveEmbed: ResolveEmbed = (url) => {
  const embed = extractMegaphoneEmbed(url)

  if (!embed) {
    return
  }

  const search = parseUrl(url, placeholderBaseUrl)?.search ?? ''
  const query = composeQuery({
    [embed.param]: embed.id,
    ...pickQueryParams(search, startParams),
  })

  return {
    provider: 'megaphone',
    id: `${embed.kind}/${embed.id}`,
    src: `https://playlist.megaphone.fm/${query}`,
    params: pickQueryParams(search, displayParams),
    height: embed.height,
  }
}

// Megaphone's player iframe, ?e= for an episode or ?p= for a playlist, some with no height at all.
export const megaphoneEmbedResolver = createUrlEmbedResolver(megaphoneHosts, megaphoneResolveEmbed)
