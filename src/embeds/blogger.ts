import { composeQuery, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'blogger'

const bloggerHosts = ['blogger.com']

const sizes = {
  player: { ratio: '16/9' },
}

export const extractBloggerToken = (url: URL): string | undefined => {
  if (!isAnyOf(getPathSegments(url)[0], 'video.g')) {
    return
  }

  const token = getQueryParam(url.searchParams, 'token')

  if (!token) {
    return
  }

  return token
}

// Blogger's own hosted video: an iframe on blogger.com/video.g with no poster and no page to open.
// The poster is a css background on `i9.ytimg.com/vi_blogger/{internalId}/1.jpg`, and that id is
// in neither the token nor the feed. A live, a deleted and an invented token all answer 200.
export const bloggerResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const token = extractBloggerToken(url)

  if (!token) {
    return
  }

  return {
    provider,
    id: token,
    src: `https://www.blogger.com/video.g${composeQuery({ token })}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const bloggerEmbedResolver = createUrlEmbedResolver(bloggerHosts, bloggerResolveEmbed)

export const bloggerFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'YouTube video player' },
]
