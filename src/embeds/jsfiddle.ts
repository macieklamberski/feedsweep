import { getPathSegments } from 'trousse'
import { parseUrlOnHosts } from '../utils/urls.js'

const jsfiddleHosts = ['jsfiddle.net']

// An author, a slug and a version are letters, digits, dashes and underscores.
const safeSegmentRegex = /^[\w-]+$/

// The loader path is `/{author}/{slug}/{version}/embed/{panels}/`, with the author and the
// version each optional, and `/embedded/…?username=` where the loader spells the author in its
// query instead.
const embedRoutes = new Set(['embed', 'embedded'])

// Every embed spelling redirects onto the fiddle's own page, which allows framing, so that page
// is what the loader gets rebuilt onto. A fabricated slug 404s.
export const composeFiddleUrl = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, jsfiddleHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const route = segments.findIndex((segment) => embedRoutes.has(segment))
  const fiddle = route > 0 ? segments.slice(0, route) : []

  if (
    !fiddle.length ||
    fiddle.length > 3 ||
    !fiddle.every((segment) => safeSegmentRegex.test(segment))
  ) {
    return
  }

  return `https://jsfiddle.net/${fiddle.join('/')}/`
}
