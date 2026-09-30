import { decodeSegment, getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { encodePathSegment } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const linkedinHosts = ['linkedin.com']

// The post fills the frame's width and grows with its text and images, and neither scrolls inside
// the frame nor reports its height. 800 fits the header, the text and most images, and cuts the
// reactions under a long post.
const postHeight = 800

// A post has no name, and the frame titles itself `Embedded post` in the reader's language.
const linkedinResolveEmbed: ResolveEmbed = (url) => {
  const [route, section, action, urn] = getPathSegments(url)

  if (route !== 'embed' || section !== 'feed' || action !== 'update') {
    return
  }

  // Some carriers escape the colons, `urn%3Ali%3Ashare%3A…`, and LinkedIn serves both alike.
  const postUrn = decodeSegment(urn)

  if (!postUrn) {
    return
  }

  const urnSegment = encodePathSegment(postUrn)

  // No title: carriers state the boilerplate "Embedded post" in eight languages.
  return {
    provider: 'linkedin',
    id: postUrn,
    src: `https://www.linkedin.com/embed/feed/update/${urnSegment}`,
    // The activity urn is assigned server-side, so a share urn cannot be rewritten to it.
    url: `https://www.linkedin.com/feed/update/${urnSegment}`,
    height: postHeight,
  }
}

// LinkedIn's post iframe, linkedin.com/embed/feed/update/{urn}, the platform's only embed form.
// A carrier's height fits the `collapsed` or `compact` layout the mint drops, or one post's length.
export const linkedinEmbedResolver = createUrlEmbedResolver(linkedinHosts, linkedinResolveEmbed, {
  preferResolverSize: true,
})
