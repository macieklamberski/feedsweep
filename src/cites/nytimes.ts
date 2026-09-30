import { parseUrl } from 'trousse'
import type { CiteResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr } from '../utils/dom.js'
import { absoluteUrlRegex, parseUrlOnHosts } from '../utils/urls.js'

const cardHost = 'nytimes.com'
const cardPath = '/svc/oembed/html/'
const articleBaseUrl = 'https://www.nytimes.com'

// The Times' oEmbed answer: an iframe of its own article card, a link card and not a player.
// The card is a headline, byline, date and summary linking to the article. WordPress emits it
// for a pasted article link, and the snippet states the headline in the iframe's title.
export const nytimesCiteResolver: CiteResolver = {
  kind: 'cite',
  selector: `iframe[src*="nytimes.com${cardPath}"]`,
  extract: (element) => {
    const card = parseUrlOnHosts(attr(element, 'src'), cardHost)

    if (card?.pathname !== cardPath) {
      return
    }

    const article = card.searchParams.get('url') || undefined
    let url = article

    // A bare path names a page on nytimes.com, the host of the card itself, not on the feed's host.
    if (article && !absoluteUrlRegex.test(article) && !article.startsWith('//')) {
      url = parseUrl(article, articleBaseUrl)?.href
    }

    return buildCite({
      provider: 'nytimes',
      // The card answers 404 for any url outside nytimes.com (checked 2026-09-07), so a host check
      // here would turn a card the reader can still open into an empty frame.
      url,
      title: attr(element, 'title'),
    })
  },
}
