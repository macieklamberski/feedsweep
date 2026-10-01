import type { CiteResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr, find, text } from '../utils/dom.js'

// BuddyPress's link preview: unfurled into the activity update as bare divs the theme styles.
// BuddyBoss, built on BuddyPress, ships the same preview under its own class prefix.
export const createLinkPreviewCiteResolver = (provider: string, prefix: string): CiteResolver => {
  return {
    kind: 'cite',
    selector: `.${prefix}-container`,
    extract: (element) => {
      return buildCite({
        provider,
        url: attr(find(element, `.${prefix}-title a`), 'href') ?? attr(find(element, 'a'), 'href'),
        title: text(element, `.${prefix}-title`),
        description: text(element, `.${prefix}-excerpt`),
        // BuddyPress's preview names no host, so only BuddyBoss's carries a publisher.
        publisher: text(element, `.${prefix}-link-name`),
        thumbnail: attr(find(element, `.${prefix}-image img`), 'src'),
      })
    },
  }
}

export const buddypressCiteResolver = createLinkPreviewCiteResolver(
  'buddypress',
  'activity-link-preview',
)
