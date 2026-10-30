import { coerceNumber, decodeSegment, isNonEmptyString, parseUrl } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { placeholderBaseUrl } from '../../utils/urls.js'
import {
  createCaptionedFigure,
  createFilePlaceholder,
  createImage,
  createMediaElement,
} from '../../utils/widgets.js'

// An Active Storage url names the upload by its signed blob id, in the original's path and in
// every resized copy's: `/rails/active_storage/blobs/redirect/{id}/{file}` and
// `/rails/active_storage/representations/redirect/{id}/{variation}/{file}`.
const blobIdRegex =
  /\/rails\/active_storage\/(?:blobs|representations)\/(?:redirect\/|proxy\/)?([^/]+)\//i

// What names an upload: its signed blob id and its file name. Rails has signed one blob in two
// formats, `{"data":…}` and the older `{"message":…}`, and a feed can mix them, so the file
// name matches a copy the id does not.
const readUploadKeys = (link: string | undefined): Array<string> => {
  const path = parseUrl(link ?? '', placeholderBaseUrl)?.pathname ?? ''
  const blobId = blobIdRegex.exec(path)?.[1]
  const fileName = decodeSegment(path.split('/').at(-1))

  return [blobId, fileName].filter(isNonEmptyString)
}

// The kind of player an upload's content type plays in, `image/png` in an <img>.
const mediaKinds = ['image', 'video', 'audio'] as const

type MediaKind = (typeof mediaKinds)[number]

const readMediaKind = (attachment: Element): MediaKind | undefined => {
  const [kind] = (attr(attachment, 'content-type') ?? '').toLowerCase().split('/')

  return mediaKinds.find((mediaKind) => mediaKind === kind)
}

// Rails writes the stored element and the figure it renders side by side. A figure cannot sit
// inside a paragraph, so for an element in one the figure follows the paragraph, and otherwise
// the element itself.
const findRenderedFigure = (attachment: Element): Element | undefined => {
  const parent = attachment.parentElement
  const next = parent?.localName === 'p' ? parent.nextElementSibling : attachment.nextElementSibling

  if (!next?.matches('figure.attachment')) {
    return
  }

  return next
}

const isRenderedNextTo = (attachment: Element, url: string): boolean => {
  const figure = findRenderedFigure(attachment)
  const keys = readUploadKeys(url)

  if (!figure || !keys.length) {
    return false
  }

  const media = figure.querySelectorAll('img[src], video[src], video[poster], source[src]')

  return Array.from(media).some((element) => {
    const links = [attr(element, 'src'), attr(element, 'poster')]

    return links.some((link) => readUploadKeys(link).some((key) => keys.includes(key)))
  })
}

const readDimension = (attachment: Element, name: string): number | undefined => {
  const value = coerceNumber(attr(attachment, name))

  if (!value) {
    return
  }

  return Math.round(value)
}

const buildMedia = (
  document: Document,
  attachment: Element,
  url: string,
  kind: MediaKind | undefined,
): HTMLElement => {
  const width = readDimension(attachment, 'width')
  const height = readDimension(attachment, 'height')

  if (kind === 'image') {
    return createImage(document, { src: url, width, height })
  }

  if (kind) {
    return createMediaElement(document, { tag: kind, src: url, width, height })
  }

  return createFilePlaceholder(document, {
    url,
    name: attr(attachment, 'filename') ?? url,
    type: attr(attachment, 'content-type'),
    size: coerceNumber(attr(attachment, 'filesize')),
    caption: attr(attachment, 'caption'),
    // A previewable file, such as a PDF, holds the preview image Rails rendered for it.
    thumbnail: attr(attachment.querySelector('img'), 'src'),
  })
}

// Action Text stores an upload as `action-text-attachment`, naming it in attributes, and renders
// it into a figure when the page is built. A feed can carry the stored element with the figure
// inside it, beside it, or nowhere at all, and a file it never renders into more than a card.
export const rebuildActionTextAttachments: DomTransform = () => (document) => {
  for (const attachment of document.querySelectorAll('action-text-attachment[url]')) {
    const url = attr(attachment, 'url')
    const kind = readMediaKind(attachment)

    if (!url) {
      continue
    }

    // The figure a rendered upload carries, inside the element or beside it, is the copy the
    // page shows. A file renders into no more than a card, so a file is rebuilt either way.
    if (kind && (attachment.children.length || isRenderedNextTo(attachment, url))) {
      continue
    }

    const media = buildMedia(document, attachment, url, kind)
    const caption = attr(attachment, 'caption')
    const replacement = caption && kind ? createCaptionedFigure(document, media, caption) : media

    attachment.replaceWith(replacement)
  }
}
