import { getPathSegments, isAnyOf } from 'trousse'
import { parseUrlOnHosts } from '../utils/urls.js'

const hosts = ['gofundme.com']

// The share dialog's embed code writes `/f/{slug}/widget/{size}?sharesheet=…`, with Large checked
// by default, and every size frames the same campaign.
export const composeGofundmeWidgetUrl = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, hosts)
  const [route, slug] = parsed ? getPathSegments(parsed) : []

  if (!isAnyOf(route, 'f') || !slug) {
    return
  }

  return `https://www.gofundme.com/f/${slug}/widget/large`
}
