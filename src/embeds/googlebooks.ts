import { getPathSegments, parseUrl } from 'trousse'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, readCarrierUrl } from '../utils/widgets.js'

const provider = 'googlebooks'

// Google serves the viewer from every country domain it runs, books.google.de and
// books.google.co.uk alike, and the volume id is the same on all of them.
const viewerHostRegex = /^books\.google\.[a-z]{2,3}(?:\.[a-z]{2})?$/

// A volume id is url-safe base64, and nothing else may reach a minted query.
const volumeIdRegex = /^[\w-]+$/

// `pg` and `lpg` select which page the viewer opens. Everything else the carrier states is chrome.
const pageParams = ['pg', 'lpg']

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

    if (route !== 'books' || rest.length || !id || !volumeIdRegex.test(id)) {
      return
    }

    const volume = { id, ...pickQueryParams(parsed.search, pageParams) }
    const cover = { id, printsec: 'frontcover', img: '1', zoom: '1' }

    return {
      provider,
      id,
      src: `https://${parsed.hostname}/books${composeQuery({ ...volume, output: 'embed' })}`,
      url: `https://${parsed.hostname}/books${composeQuery(volume)}`,
      thumbnail: `https://${parsed.hostname}/books/content${composeQuery(cover)}`,
    }
  },
)
