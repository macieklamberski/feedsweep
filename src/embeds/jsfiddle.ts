import { getPathSegments } from 'trousse'
import { parseUrlOnHosts } from '../utils/urls.js'

const jsfiddleHosts = ['jsfiddle.net']

// Every embed spelling redirects onto the fiddle's own page, which allows framing, so that page
// is what the loader gets rebuilt onto.
export const composeFiddleUrl = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, jsfiddleHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  // The loader path is `/{author}/{slug}/{version}/embed/{panels}/`, with the author and the
  // version each optional.
  const route = segments.indexOf('embed')
  const fiddle = route > 0 ? segments.slice(0, route) : []

  if (!fiddle.length) {
    return
  }

  return `https://jsfiddle.net/${fiddle.join('/')}/`
}
