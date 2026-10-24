import { isHostOrSubdomainOf, isHttpUrl, parseUrl } from 'trousse'
import { jwplayerHosts } from '../../embeds/jwplayer.js'
import { composeTwitterStatusUrl } from '../../embeds/twitter.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { digitsRegex, placeholderBaseUrl } from '../../utils/urls.js'

const playerPath = '/res/scraper/embed/'
const tweetPath = '/res/community/twitter_embed/'

// The wrapper writes any url into its page, so only a player host is let through.
const playerHosts = [
  ...jwplayerHosts,
  'video.primis.tech', // GB News HLS streams
  'mm-v2.simplestream.com', // GB News player
]

const readPlayerUrl = (query: URLSearchParams): string | undefined => {
  const url = query.get('jwplayer_video_url') ?? query.get('video_url')

  if (!url || !isHttpUrl(url) || !isHostOrSubdomainOf(url, playerHosts)) {
    return
  }

  return url
}

const readTweetUrl = (query: URLSearchParams): string | undefined => {
  const id = query.get('id')
  const handle = query.get('screen_name')

  if (!id || !handle || !digitsRegex.test(id)) {
    return
  }

  return composeTwitterStatusUrl(handle, id)
}

const readInnerUrl = (src: string | undefined): string | undefined => {
  const wrapper = parseUrl(src ?? '', placeholderBaseUrl)

  if (wrapper?.pathname === playerPath) {
    return readPlayerUrl(wrapper.searchParams)
  }

  if (wrapper?.pathname === tweetPath) {
    return readTweetUrl(wrapper.searchParams)
  }
}

// RebelMouse's embed frames, served on each publisher's own domain, so the frame names the site
// and not the player. `/res/scraper/embed/` takes the player url in `jwplayer_video_url` or
// `video_url`, and `/res/community/twitter_embed/` takes a tweet's fields and answers 404.
export const unwrapRebelmouseEmbedFrames: DomTransform = () => {
  return (document) => {
    for (const iframe of document.querySelectorAll('iframe[src*="/res/"]')) {
      const url = readInnerUrl(attr(iframe, 'src'))

      if (!url) {
        continue
      }

      iframe.setAttribute('src', url)
    }
  }
}
