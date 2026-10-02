import { stripWww } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { composeQuery, encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'abcotv'

// The eight ABC owned stations, on one site platform and one video id space.
const abcotvHosts = [
  '6abc.com', // Philadelphia
  'abc11.com', // Raleigh-Durham
  'abc13.com', // Houston
  'abc30.com', // Fresno
  'abc7.com', // Los Angeles
  'abc7chicago.com',
  'abc7news.com', // San Francisco
  'abc7ny.com',
]

// The server matches the route words in any case.
const playerPathRegex = /^\/video\/embed\/?$/i

// The stations' video player, `/video/embed?pid={pid}`, which the site's own script builds on the
// station's host. A pid plays on every station's host, each with its own branding.
export const abcotvResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, abcotvHosts)

  if (!parsed || !playerPathRegex.test(parsed.pathname)) {
    return
  }

  const pid = parsed.searchParams.get('pid')

  if (!pid) {
    return
  }

  // A `www.` host answers with a redirect to the apex, or with a certificate that fails.
  const host = stripWww(parsed.hostname)

  return {
    provider,
    id: pid,
    src: `https://${host}/video/embed${composeQuery({ pid })}`,
    url: `https://${host}/videoClip/${encodePathSegment(pid)}/`,
    ratio: '16/9',
  }
}

export const abcotvEmbedResolver = createUrlEmbedResolver(abcotvHosts, abcotvResolveEmbed)
