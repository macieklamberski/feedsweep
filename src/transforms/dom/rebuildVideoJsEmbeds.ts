import type { DomTransform, TransformContext } from '../../types.js'
import { attr, jsonAttr } from '../../utils/dom.js'
import { cleanUrl, videoFileRegex } from '../../utils/urls.js'
import { createMediaElement } from '../../utils/widgets.js'

type SetupConfig = {
  sources?: Array<{ src?: string }>
  poster?: string
}

// A stream manifest as the src leaves a native <video> an empty box everywhere but Safari.
const buildVideo = (
  document: Document,
  element: Element,
  context: TransformContext,
): Element | undefined => {
  const setup = jsonAttr<SetupConfig>(element, 'data-setup')
  const child = Array.from(element.querySelectorAll('source'))
    .map((source) => attr(source, 'src'))
    .find((source) => source && videoFileRegex.test(source))
  const source = child ?? setup?.sources?.find(({ src }) => src && videoFileRegex.test(src))?.src

  if (!source) {
    return
  }

  return createMediaElement(document, {
    tag: 'video',
    src: cleanUrl(source, context),
    poster: attr(element, 'poster') ?? setup?.poster,
  })
}

// <video-js> is a custom element that renders as nothing until the Video.js script upgrades it.
// Video.js plays whatever the markup hands it, a <source> child or the sources in data-setup JSON.
export const rebuildVideoJsEmbeds: DomTransform = (context) => (document) => {
  for (const element of document.querySelectorAll('video-js')) {
    const video = buildVideo(document, element, context)

    if (video) {
      element.replaceWith(video)
    }
  }
}
