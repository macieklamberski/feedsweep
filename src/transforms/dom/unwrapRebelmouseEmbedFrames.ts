import { getQueryParam, isAnyOf, isHostOrSubdomainOf, isHttpUrl, parseUrl } from 'trousse'
import { hosts as jwplayerHosts } from '../../embeds/jwplayer.js'
import { composeTwitterStatusUrl } from '../../embeds/twitter.js'
import type { DomTransform } from '../../types.js'
import { digitsRegex, placeholderBaseUrl } from '../../utils/urls.js'
import { readRepairedCarrierUrl } from '../../utils/widgets.js'

const playerPath = '/res/scraper/embed/'
const tweetPath = '/res/community/twitter_embed/'

// The wrapper writes `jwplayer_video_url` into a script, so only a JW script is let through.
// It writes `video_url` into an iframe, so any http url is framed as written.
const readPlayerUrl = (query: URLSearchParams): string | undefined => {
  const scriptUrl = getQueryParam(query, 'jwplayer_video_url')

  if (scriptUrl) {
    if (!isHttpUrl(scriptUrl) || !isHostOrSubdomainOf(scriptUrl, jwplayerHosts)) {
      return
    }

    return scriptUrl
  }

  const frameUrl = getQueryParam(query, 'video_url')

  if (!frameUrl || !isHttpUrl(frameUrl)) {
    return
  }

  return frameUrl
}

const readTweetUrl = (query: URLSearchParams): string | undefined => {
  const id = getQueryParam(query, 'id')
  const handle = getQueryParam(query, 'screen_name')

  if (!id || !handle || !digitsRegex.test(id)) {
    return
  }

  return composeTwitterStatusUrl(handle, id)
}

const readInnerUrl = (src: string): string | undefined => {
  const wrapper = parseUrl(src, placeholderBaseUrl)

  if (!wrapper) {
    return
  }

  if (isAnyOf(wrapper.pathname, playerPath)) {
    return readPlayerUrl(wrapper.searchParams)
  }

  if (isAnyOf(wrapper.pathname, tweetPath)) {
    return readTweetUrl(wrapper.searchParams)
  }
}

// RebelMouse's embed frames, served on each publisher's own domain, so the frame names the site
// and not the player. `/res/scraper/embed/` takes the player url in `jwplayer_video_url` or
// `video_url`, and `/res/community/twitter_embed/` takes a tweet's fields and answers 404.
export const unwrapRebelmouseEmbedFrames: DomTransform = (context) => {
  return (document) => {
    for (const iframe of document.querySelectorAll('iframe[src*="/res/" i]')) {
      const url = readInnerUrl(readRepairedCarrierUrl(iframe, context))

      if (!url) {
        continue
      }

      iframe.setAttribute('src', url)
    }
  }
}
