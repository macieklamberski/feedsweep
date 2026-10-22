import type { MediaResolver } from '../types.js'
import { jsonAttr } from '../utils/dom.js'
import { encodePathSegment } from '../utils/urls.js'

// Following the redirect stores a signed url that expires.
// The endpoint resolves the id anonymously and redirects at play time to a signed mp4 or mp3.
const composeSourceUrl = (mediaUploadId: string): string => {
  // The /video/upload/ path serves audio too, and api.substack.com resolves any publication's id.
  return `https://api.substack.com/api/v1/video/upload/${mediaUploadId}/src`
}

type MediaAttrs = {
  mediaUploadId?: string
}

// Substack uploads reach a feed as an empty div naming the file by a UUID, with no url anywhere.
export const substackMediaResolver: MediaResolver = {
  kind: 'media',
  selector: '.native-video-embed, .native-audio-embed',
  extract: (element) => {
    const attrs = jsonAttr<MediaAttrs>(element, 'data-attrs')
    // The payload's id comes out decoded, and it goes into a path.
    const mediaUploadId = encodePathSegment(attrs?.mediaUploadId ?? '')

    if (!mediaUploadId) {
      return
    }

    return {
      tag: element.classList.contains('native-audio-embed') ? 'audio' : 'video',
      src: composeSourceUrl(mediaUploadId),
    }
  },
}
