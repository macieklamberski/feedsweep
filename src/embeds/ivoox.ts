import { parseUrl } from 'trousse'
import type { FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'

const provider = 'ivoox'

import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `playerivoox_ee_`, `_ep_` and `_em_` are three generations of the legacy episode player, and
// all of them name the episode by the same numeric id.
const legacyPlayerRegex = /\/playerivoox_e[emp]_([^_/]+)_\d+\.html$/
// Enumerated, not `e[a-z]`: `player_el_` answers 404 while `ej` and `ek` serve.
// `player_ej_` is the current player and `player_ek_` the mini one.
const episodePlayerRegex = /\/player_e[jk]_([^_/]+)(?:_\d+)?_(\d+)\.html$/

// The show player, which carries every episode. Its id is the podcast's, a different id space
// from an episode's, so it cannot share the episode kind.
// The skin is a number, or `zp` on the current player.
const showPlayerRegex = /\/player_es_podcast_([^_/]+)(?:_[^_/]+)?_(\d+)\.html$/

const ivooxHosts = ['ivoox.com']

// The heights iVoox's embed dialog states for the current episode and show players.
const episodeHeight = 200
const showHeight = 400

export type IvooxSubject = {
  kind: 'episode' | 'show'
  id: string
  // Which episode a show's playlist opens on.
  page: string
}

export const extractIvooxSubject = (link: string): IvooxSubject | undefined => {
  const parsed = parseUrl(link, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const show = parsed.pathname.match(showPlayerRegex)

  if (show?.[1]) {
    return { kind: 'show', id: show[1], page: show[2] }
  }

  const episode = parsed.pathname.match(episodePlayerRegex)

  if (episode?.[1]) {
    return { kind: 'episode', id: episode[1], page: episode[2] }
  }

  // The three generations share one id space: `ivoox.com/x_rf_{id}_1.html` redirects to the
  // episode's own page for a legacy id and 404s for a fabricated one.
  const legacy = parsed.pathname.match(legacyPlayerRegex)

  return legacy?.[1] ? { kind: 'episode', id: legacy[1], page: '1' } : undefined
}

// iVoox's player iframes, whose legacy `playerivoox_` generation now answers 404 for every id.
// Every generation and skin is minted as the player the embed dialog calls current:
// `player_ej_{id}_6_{page}` for an episode and `player_es_podcast_{id}_zp_{page}` for a show.
// `player_ej_` answers 200 to any id at all, a javascript shell that resolves the id on load.
export const ivooxResolveEmbed: ResolveEmbed = (url, element) => {
  const subject = extractIvooxSubject(url)

  if (!subject) {
    return
  }

  if (subject.kind === 'show') {
    return {
      provider,
      id: `podcast/${subject.id}`,
      src: `https://www.ivoox.com/player_es_podcast_${subject.id}_zp_${subject.page}.html`,
      height: showHeight,
      title: attr(element, 'title'),
    }
  }

  // No thumbnail: iVoox publishes no key-free metadata endpoint for an episode id.
  return {
    provider,
    id: subject.id,
    src: `https://www.ivoox.com/player_ej_${subject.id}_6_${subject.page}.html`,
    height: episodeHeight,
    title: attr(element, 'title'),
  }
}

export const ivooxEmbedResolver = createUrlEmbedResolver(ivooxHosts, ivooxResolveEmbed)

export const ivooxFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'YouTube video player' },
]
