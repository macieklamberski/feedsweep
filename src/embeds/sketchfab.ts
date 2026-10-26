import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { alphanumericRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'sketchfab'

const sizes = {
  model: { ratio: '4/3' },
}

// A model uid is 32 hex characters, or 26 letters and digits of both cases on older models. The
// shape tells a uid from the listing words that share the bare page route, such as
// `/models/popular`, and from the slug words before it on the page url `/3d-models/{slug}-{uid}`.
const uidPattern = '[0-9a-f]{32}|[0-9a-z]{26}'
const uidRegex = new RegExp(`^(?:${uidPattern})$`, 'i')
const sluggedUidRegex = new RegExp(`(?<uid>${uidPattern})$`, 'i')

const hosts = ['sketchfab.com']

const readModelUid = (parsed: URL): string | undefined => {
  const [route, modelId, view] = getPathSegments(parsed)

  if (isAnyOf(route, 'models') && view === undefined) {
    return keepIfMatches(modelId, uidRegex)
  }

  // The viewer is `/models/{uid}/embed`, which the retired `/embed/{uid}` and `/show/{uid}`
  // redirect to.
  if ((isAnyOf(route, 'models') && isAnyOf(view, 'embed')) || isAnyOf(route, ['embed', 'show'])) {
    // Older models carry a 26-character uid in letters of both cases, which the viewer still plays.
    return keepIfMatches(modelId, alphanumericRegex)
  }

  if (isAnyOf(route, '3d-models')) {
    return modelId?.match(sluggedUidRegex)?.groups?.uid
  }
}

// The thumbnail sits under a per-model hash that the uid does not yield, and
// `sketchfab.com/oembed?url=…` answers with it and the title, with no key.
const sketchfabResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const uid = readModelUid(url)

  if (!uid) {
    return
  }

  return {
    provider,
    id: uid,
    src: `https://sketchfab.com/models/${uid}/embed`,
    // The slug is not derivable from the uid, and the site redirects the unslugged `/models/{uid}`
    // to the `/3d-models/{slug}-{uid}` page.
    url: `https://sketchfab.com/models/${uid}`,
    ...sizes.model,
    title: attr(element, 'title'),
  }
}

// Sketchfab's viewer iframe, /models/{uid}/embed, its retired spellings and a pasted page link.
export const sketchfabEmbedResolver = createUrlEmbedResolver(hosts, sketchfabResolveEmbed)

export const sketchfabFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'A 3D model' },
]

// Starts the viewer on the click that loads it; there is no audio to hold back.
export const sketchfabRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autostart: '1' },
}
