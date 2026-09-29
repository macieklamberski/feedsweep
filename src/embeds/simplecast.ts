import { getPathSegments, isHostOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { digitsRegex, uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `embed.simplecast.com/{8hex}` and `simplecast.com/e/{numeric}` are legacy spellings of the
// episode, and `play.simplecast.com/{uuid}` is the share host.
const legacyIdRegex = /^[0-9a-f]{8}$/i

const simplecastHosts = ['simplecast.com']

// The share host answers "This site is not available" in a frame, while the player host plays the
// same uuid.
const shareHost = 'play.simplecast.com'

// The one height every iframe states.
const playerHeight = 200

export const extractSimplecastEpisode = (link: string): string | undefined => {
  const segments = getPathSegments(link)
  const id = segments[0] === 'e' ? segments[1] : segments[0]

  if (!id) {
    return
  }

  if (uuidRegex.test(id) || legacyIdRegex.test(id) || digitsRegex.test(id)) {
    return id
  }
}

export const simplecastResolveEmbed: ResolveEmbed = (url) => {
  const id = extractSimplecastEpisode(url)

  if (!id) {
    return
  }

  return {
    provider: 'simplecast',
    id,
    src: isHostOf(url, [shareHost]) ? `https://player.simplecast.com/${id}` : url,
    height: playerHeight,
  }
}

// Simplecast's player iframe, player.simplecast.com/{uuid}, and its three legacy spellings.
export const simplecastEmbedResolver = createUrlEmbedResolver(
  simplecastHosts,
  simplecastResolveEmbed,
)
