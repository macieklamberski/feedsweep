import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fliphtml5'

// The viewer lives on this host alone. The apex serves the author's shelf at `homepage/{account}`,
// the same two-segment shape.
const fliphtml5Hosts = ['online.fliphtml5.com']

const safeSegmentRegex = /^[\w-]+$/

// FlipHTML5's flipbook viewer, `online.fliphtml5.com/{account}/{book}/`. The publisher's own url
// carries the `#?secret=` the viewer's embed form issues, so it is passed through as it stands.
export const fliphtml5ResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, fliphtml5Hosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [account, book] = segments

  if (segments.length !== 2 || !account || !book) {
    return
  }

  if (!safeSegmentRegex.test(account) || !safeSegmentRegex.test(book)) {
    return
  }

  return {
    provider,
    id: `${account}/${book}`,
    src: url,
    url: `https://online.fliphtml5.com/${account}/${book}/`,
    // The cover the viewer's own `og:image` names, 404 on a book that does not exist.
    thumbnail: `https://online.fliphtml5.com/${account}/${book}/files/shot.jpg`,
  }
}

export const fliphtml5EmbedResolver = createUrlEmbedResolver(fliphtml5Hosts, fliphtml5ResolveEmbed)
