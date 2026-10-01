import { getPathSegments, parseUrl } from 'trousse'
import type { FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery } from '../utils/urls.js'

const provider = 'blogger'

import { createUrlEmbedResolver } from '../utils/widgets.js'

const bloggerHosts = ['blogger.com']

export const extractBloggerToken = (link: string): string | undefined => {
  const parsed = parseUrl(link)

  if (!parsed || getPathSegments(parsed)[0] !== 'video.g') {
    return
  }

  return parsed.searchParams.get('token') || undefined
}

// Blogger's own hosted video: an iframe on blogger.com/video.g with no poster and no page to open.
// The poster is a css background on `i9.ytimg.com/vi_blogger/{internalId}/1.jpg`, and that id is
// in neither the token nor the feed. A live, a deleted and an invented token all answer 200.
export const bloggerResolveEmbed: ResolveEmbed = (url, element) => {
  const token = extractBloggerToken(url)

  if (!token) {
    return
  }

  return {
    provider,
    id: token,
    src: `https://www.blogger.com/video.g${composeQuery({ token })}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const bloggerEmbedResolver = createUrlEmbedResolver(bloggerHosts, bloggerResolveEmbed)

export const bloggerFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'YouTube video player' },
]
