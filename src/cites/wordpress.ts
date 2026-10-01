import type { CiteResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr, find, text } from '../utils/dom.js'

// WordPress core writes a link to another WordPress post as this blockquote, holding the post's
// url and title, beside a frame that renders the post's card. The frame is stripped as a duplicate.
export const wordpressCiteResolver: CiteResolver = {
  kind: 'cite',
  selector: 'blockquote.wp-embedded-content',
  extract: (element) => {
    // The anchor sits directly in the blockquote on some installs and inside a `<p>` on others.
    const link = find(element, 'a[href]')

    return buildCite({
      provider: 'wordpress',
      url: attr(link, 'href'),
      title: text(link),
    })
  },
}
