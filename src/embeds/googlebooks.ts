import { getPathSegments, parseUrl } from 'trousse'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, readCarrierUrl } from '../utils/widgets.js'

const provider = 'googlebooks'

// Google serves the viewer from every country domain it runs, books.google.de and
// books.google.co.uk alike, and the volume id is the same on all of them.
const viewerHostRegex = /^books\.google\.[a-z]{2,3}(?:\.[a-z]{2})?$/

// The host Google's embed code writes. It redirects each reader to their own country domain.
const viewerOrigin = 'https://books.google.com'

// `pg` selects which page the viewer opens.
const pageParams = ['pg']

// The viewer highlights the terms of a search the publisher ran on the page it opens.
const highlightParams = ['dq', 'q', 'vq']

// The viewer fills whatever box it gets, and Google's embed code writes it at 500 by 500.
const snippetSize = { width: 500, height: 500 }

// The viewer frames a volume at `/books?id={id}&output=embed`. The Ngram chart on
// `/ngrams/interactive_chart` and the store redirect on `/ebooks?id={id}` are separate resources
// on the same host.
export const googlebooksEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="books.google." i]',
  (element) => {
    const parsed = parseUrl(readCarrierUrl(element), placeholderBaseUrl)

    if (!parsed || !viewerHostRegex.test(parsed.hostname)) {
      return
    }

    const [route, ...rest] = getPathSegments(parsed)
    const id = parsed.searchParams.get('id')

    if (route !== 'books' || rest.length || !id) {
      return
    }

    const volume = { id, ...pickQueryParams(parsed.search, pageParams) }
    const highlights = pickQueryParams(parsed.search, highlightParams)
    const cover = { id, printsec: 'frontcover', img: '1', zoom: '1' }

    return {
      provider,
      id,
      src: `${viewerOrigin}/books${composeQuery({ ...volume, ...highlights, output: 'embed' })}`,
      url: `${viewerOrigin}/books${composeQuery(volume)}`,
      thumbnail: `${viewerOrigin}/books/content${composeQuery(cover)}`,
      ...snippetSize,
    }
  },
)
