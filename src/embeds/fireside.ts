import { decodeSegment, getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `{show}+{episode}`: the `+` join tells a token from a single word, and each half is used as
// written.
const safeTokenRegex = /^[^+]+\+[^+]+$/

// A shape, not a version list: refusing a later version silently drops the height and the id.
const playerVersionRegex = /^v\d$/

const currentPlayerVersion = 'v3'

const firesideHosts = ['fireside.fm']

// Fireside's player is one fixed size: every iframe states `height="200"`.
const playerHeight = 200

type FiresidePlayer = { version: string; token: string }

// The version sits before the token on both hosts, `fireside.fm/player/{version}/{token}` and
// `player.fireside.fm/{version}/{token}`. `fireside.fm/s/{token}/iframe` is the retired share
// route, naming the same token and no version.
export const extractFiresideToken = (link: string): FiresidePlayer | undefined => {
  const segments = getPathSegments(link)
  const versioned = segments[0] === 'player' ? segments.slice(1) : segments
  const [version, encodedToken] =
    segments[0] === 's' ? [currentPlayerVersion, segments[1]] : versioned

  if (!version || !playerVersionRegex.test(version)) {
    return
  }

  // The `+` joining the two halves arrives as `%2B` from some feeds, so the segment is decoded
  // before it is tested. A malformed escape throws, and an unreadable token is no token.
  const token = decodeSegment(encodedToken)

  if (token && safeTokenRegex.test(token)) {
    return { version, token }
  }
}

export const firesideResolveEmbed: ResolveEmbed = (url) => {
  const player = extractFiresideToken(url)

  if (!player) {
    return
  }

  // A url ending in the token plays as written. The share route ends in `iframe`, and a `+` the
  // feed encoded as `%2B` answers 404, so only those two get the player url.
  const isPlayable = getPathSegments(url).at(-1) === player.token

  // The embed carries no metadata, no thumbnail and no canonical episode url.
  return {
    provider: 'fireside',
    id: player.token,
    src: isPlayable ? url : `https://player.fireside.fm/${player.version}/${player.token}`,
    height: playerHeight,
  }
}

// Fireside's episode player iframe, versioned or on the retired /s/ share route that is gone.
export const firesideEmbedResolver = createUrlEmbedResolver(firesideHosts, firesideResolveEmbed)
