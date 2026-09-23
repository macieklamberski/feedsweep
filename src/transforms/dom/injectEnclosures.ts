import type {
  DomTransform,
  EmbedResolverResult,
  Enclosure,
  TransformContext,
  WidgetResolver,
} from '../../types.js'
import { isAvatarEnclosure, isEnclosureKind, prepareEnclosures } from '../../utils/enclosures.js'
import { getImageFingerprint } from '../../utils/images.js'
import {
  cleanUrl,
  flashFileRegex,
  imageFileRegex,
  resolveOrDropUrl,
  resolveOrKeepUrl,
} from '../../utils/urls.js'
import {
  createCaptionedFigure,
  createEmbedPlaceholder,
  createImage,
  createMediaElement,
  isEmbedOrMediaResolver,
  isMediaResult,
  prepareEmbedMetadata,
  setDimensions,
} from '../../utils/widgets.js'

// Marks an injected element so a repeat run skips it and stripDuplicateEnclosures (an
// opt-in heuristic) can tell it from the item's own inline content. Exported because
// stripDuplicateEnclosures and assignVideoPosters both read it.
export const enclosureMarker = 'data-enclosure'

// Text a publishing tool wrote where a description would go, lowercased.
const placeholderCaptions = new Set([
  'thumbnail', // Duda
  'main image', // Duda
  'getassetsmediafromrepository', // Newsweek Polska
  'undefined', // A Mastodon client posting an image with no alt text
])

// A single token holding a digit, an underscore or a hyphen: an upload's file name.
const fileNameRegex = /^[\w.-]*[\d_-][\w.-]*$/

const resolveEnclosure = async (
  url: string,
  enclosure: Enclosure,
  resolvers: ReadonlyArray<WidgetResolver>,
  document: Document,
): Promise<EmbedResolverResult | undefined> => {
  const embedOrMediaResolvers = resolvers.filter(isEmbedOrMediaResolver)
  const probe = document.createElement('iframe')
  probe.setAttribute('src', url)
  setDimensions(probe, enclosure)

  for (const resolver of embedOrMediaResolvers) {
    if (probe.matches(resolver.selector)) {
      const metadata = await resolver.extract(probe)

      // A media result is not an embeddable player page, and the audio/video enclosure
      // branches below already produce the native element for it.
      if (metadata && !isMediaResult(metadata)) {
        return metadata
      }
    }
  }
}

// TODO: render the enclosure title and description, <audio> and <video> have no caption slot.
const createNativeMediaElement = (
  document: Document,
  tag: 'audio' | 'video',
  src: string,
  enclosure: Enclosure,
  context: TransformContext,
): HTMLElement => {
  const poster = resolveOrKeepUrl(enclosure.thumbnails?.[0]?.url, context)

  return createMediaElement(document, {
    tag,
    src,
    poster,
    width: enclosure.width,
    height: enclosure.height,
  })
}

// The src arrives resolved from the loop, the way createNativeMediaElement takes its own: an
// image enclosure never carries a player url, so what the loop resolved is this enclosure's own
// url and resolving it a second time here would only be a second chance to disagree.
const injectImageEnclosure = (
  document: Document,
  enclosure: Enclosure,
  src: string,
): HTMLElement | undefined => {
  if (!isEnclosureKind(enclosure, 'image')) {
    return
  }

  return createImage(document, {
    src,
    alt: enclosure.title,
    width: enclosure.width,
    height: enclosure.height,
  })
}

// A media:description on an image is the photo's caption on most feeds that send one. The rest
// repeat the title, the item's title or the item's own text, which a caption would show twice.
const readImageCaption = (
  enclosure: Enclosure,
  document: Document,
  context: TransformContext,
): string | undefined => {
  const normalize = (value: string | null | undefined): string => {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  }

  const caption = enclosure.description?.trim()
  const normalized = normalize(caption)

  if (!caption || placeholderCaptions.has(normalized)) {
    return
  }

  if (fileNameRegex.test(caption) || imageFileRegex.test(caption)) {
    return
  }

  if (normalized === normalize(enclosure.title) || normalized === normalize(context.articleTitle)) {
    return
  }

  if (normalize(document.body.textContent).includes(normalized)) {
    return
  }

  return caption
}

// The feed carries the publisher's real thumbnail, title and duration, where a resolver only
// composes a thumbnail from the url, like YouTube's hqdefault.
const mergeEnclosureMetadata = (
  resolved: EmbedResolverResult | undefined,
  enclosure: Enclosure,
): Partial<EmbedResolverResult> => {
  return {
    ...(resolved ?? { width: enclosure.width, height: enclosure.height }),
    thumbnail: enclosure.thumbnails?.[0]?.url ?? resolved?.thumbnail,
    title: enclosure.title ?? resolved?.title,
    description: enclosure.description ?? resolved?.description,
    duration: enclosure.duration ?? resolved?.duration,
  }
}

// The attribute the injected element carries its source in: `src` on native audio, video,
// and img elements, `data-embed-src` on embed placeholders.
const getInjectedSource = (element: Element): string | null => {
  return element.getAttribute('src') ?? element.getAttribute('data-embed-src')
}

// An enclosure rides outside the item body, so the content alone never shows its media.
export const injectEnclosures: DomTransform = (context) => {
  const enclosures = context.enclosures

  if (!enclosures?.length) {
    return () => {}
  }

  const feedImageFingerprints = new Set(
    context.feedImageUrls?.map((url) => getImageFingerprint(url, context.cleanUrlFn)),
  )

  return async (document) => {
    const created: Array<HTMLElement> = []
    const captions = new Map<HTMLElement, string>()

    const hasContentImage = !!document.querySelector('img[src], picture, [data-embed-thumbnail]')

    for (const enclosure of prepareEnclosures(enclosures, document, context)) {
      // The embeddable URL: a media:player console (when present) is the canonical thing to
      // embed, otherwise the content URL. Enclosures come from untrusted feed data that
      // doesn't honor the required-`url` type, so guard before any URL handling.
      const embedSource = enclosure.playerUrl ?? enclosure.url

      if (typeof embedSource !== 'string' || embedSource === '') {
        continue
      }

      // Whatever this enclosure becomes, a player or a native element, the reader loads this url,
      // so an enclosure stating one that will not resolve is not injected at all.
      const src = resolveOrDropUrl(embedSource, context)

      if (!src) {
        continue
      }

      const resolved = await resolveEnclosure(
        embedSource,
        enclosure,
        context.widgetResolvers,
        document,
      )

      // Only an enclosure no resolver claimed reaches the Flash checks, and a resolver rebuilds
      // the console url of every platform it knows. What is left is a .swf, and no browser has
      // run one since 2021: framing it shows an empty box, playing it plays nothing.
      const framesFlash =
        !resolved && !!enclosure.playerUrl && flashFileRegex.test(enclosure.playerUrl)

      // A resolver match, or an explicit player URL (embeddable by the Media RSS spec even
      // when no resolver claims it), produces an embed placeholder.
      if (resolved || (enclosure.playerUrl && !framesFlash)) {
        const metadata = mergeEnclosureMetadata(resolved, enclosure)

        // A resolver rebuilds the src from the parsed id. Without one the enclosure's own
        // URL stands in.
        const prepared = prepareEmbedMetadata(metadata, context)

        created.push(createEmbedPlaceholder(document, { ...prepared, src: metadata.src ?? src }))
        continue
      }

      // The enclosure's own file is what is left to render, and a dropped Flash player means
      // `src` is the console's url, not the file's.
      const mediaSource = framesFlash ? resolveOrDropUrl(enclosure.url, context) : src

      // A Flash file carries a medium or a type that would send it to the audio or video branch,
      // where the reader gets a player pointed at bytes it cannot decode.
      if (!mediaSource || (enclosure.url && flashFileRegex.test(enclosure.url))) {
        continue
      }

      if (isEnclosureKind(enclosure, 'audio')) {
        created.push(createNativeMediaElement(document, 'audio', mediaSource, enclosure, context))
        continue
      }

      if (isEnclosureKind(enclosure, 'video')) {
        created.push(createNativeMediaElement(document, 'video', mediaSource, enclosure, context))
        continue
      }

      // WordPress attaches the author's gravatar as a per-item media:content image, and Substack
      // fills the enclosure of a post with no cover with the publication logo.
      if (
        isEnclosureKind(enclosure, 'image') &&
        (isAvatarEnclosure(embedSource, context.avatarImageHosts) ||
          feedImageFingerprints.has(getImageFingerprint(embedSource, context.cleanUrlFn)))
      ) {
        continue
      }

      // An image enclosure is almost always the lead image, scaled or cropped, on another url.
      if (hasContentImage) {
        continue
      }

      const imageElement = injectImageEnclosure(document, enclosure, mediaSource)

      if (!imageElement) {
        continue
      }

      const caption = readImageCaption(enclosure, document, context)
      created.push(imageElement)

      if (caption) {
        captions.set(imageElement, caption)
      }
    }

    // A source already on the page, put there by a previous run or by an earlier entry in this
    // one, would show up twice. A feed naming one file twice does it, and so does an item whose
    // enclosures all inherit the same media:embed. Sources compare cleaned, so a tracking
    // parameter does not make two copies of one file look like two files.
    const injectedSources = new Set<string>()

    for (const element of document.querySelectorAll(`[${enclosureMarker}]`)) {
      const source = getInjectedSource(element)

      if (source) {
        injectedSources.add(cleanUrl(source, { cleanUrlFn: context.cleanUrlFn }))
      }
    }

    const injected = created.filter((element) => {
      const source = getInjectedSource(element)

      if (!source) {
        return true
      }

      const key = cleanUrl(source, { cleanUrlFn: context.cleanUrlFn })

      if (injectedSources.has(key)) {
        return false
      }

      injectedSources.add(key)

      return true
    })

    // Tag each injected element so the optional stripDuplicateEnclosures pass can
    // recognize it as injected media, not the item's own content.
    for (const element of injected) {
      element.setAttribute(enclosureMarker, '')
    }

    // A forward loop of prepends reverses the enclosure order.
    for (let index = injected.length - 1; index >= 0; index--) {
      const element = injected[index]
      const caption = captions.get(element)

      document.body.prepend(caption ? createCaptionedFigure(document, element, caption) : element)
    }
  }
}
