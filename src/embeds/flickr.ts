import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getQueryParam,
  isHostOf,
  type Nullish,
  trimObject,
} from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import {
  attr,
  find,
  flashVar,
  flashVars,
  keepIfMatches,
  parseFlashVars,
  parsePixelSize,
} from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'flickr'

const sizes = {
  // The player fills its frame, and photos come in every shape.
  photo: { ratio: '4/3' },
  // The size Flickr's own dialog wrote for years. The slideshow fills whatever frame it gets, so
  // there is no rendered height to measure against.
  slideshow: { width: 400, height: 300 },
  video: { ratio: '16/9' },
}

const hosts = ['flickr.com']
const embedrHosts = ['embedr.flickr.com']

// Both swf urls name only the player. Their `?v=` cache-buster names no item.
const flashPlayerPathRegex = /^\/apps\/slideshow\//i
const flashVideoPathRegex = /^\/apps\/video\/stewart\.swf$/i
const legacyPlayerPathRegex = /^\/slideshow\/index\.gne$/i

// The set id is its digit run, so a link a feed cut into still names the set.
const setPathRegex = /^\/photos\/([^/]+)\/(?:sets|albums)\/(\d+)/i
const streamPathRegex = /^\/photos\/([^/]+)\/show\/?$/i
const groupPathRegex = /^\/groups\/([^/]+)\/pool\/show\/?$/i
const groupPagePathRegex = /^\/groups\//i
const groupAliasPoolPathRegex = /^\/groups\/[^/]+\/pool\/show(?:\/with\/[^/]+)?\/?$/i
// An owner of `_` names nobody: the player ignores it, and `/photos/_/{photoId}/` answers 404.
const photoPathRegex = /^\/photos\/(?:_|([^/]+))\/(\d+)(?:\/in\/[^/]+)?\/player(?:\/([^/]+))?\/?$/i
const embedrPhotoPathRegex = /^\/photos\/(\d+)\/?$/i
// The page hrefs Flickr's embed script turns into a player. A photo page keeps whatever follows
// its id, such as the `in/{context}` it was opened from, and a pool filtered by a tag has none.
const anchorPhotoPathRegex = /^\/photos\/([^/]+)\/(\d+)(?:\/|$)/i
const anchorGroupPathRegex = /^\/groups\/([^/]+)\/pool\/?$/i
const anchorStreamPathRegex = /^\/photos\/([^/]+)\/?$/i
const photoFileRegex = /(?:^|\/)(\d+)_([a-z0-9]+)(?:_[a-z0-9]{1,2})?\.jpg(?:\?zz=1)?$/i

// A group and a photostream each resolve by NSID and only by NSID: the player answers 200 for
// `groups/{nsid}` and for `photostreams/{nsid}`, and 404 for a path alias in either position.
// An NSID carries `@N` and an alias never does.
const nsidRegex = /^\d+@N\d+$/

// What a carrier names, whichever carrier and whichever spelling: an album needs its set, a
// group pool its NSID, a photostream only its owner.
type FlickrSubject = { setId?: string; owner?: string; groupId?: string }

// A single photo, whose owner and secret are each in the path on one of the two carriers only.
type FlickrPhoto = { photoId: string; owner?: string; secret?: string }

type PhotoQuery = { secret?: string; width?: number; height?: number }

// Flickr's own embed script writes these embedr endpoints into a frameless iframe. A real id
// answers 200 with the whole slideshow and an invented one 404.
const composeAlbumPlayer = (setId: string): string => {
  return `https://embedr.flickr.com/photosets/${encodePathSegment(setId)}`
}

const composeStreamPlayer = (owner: string): string => {
  return `https://embedr.flickr.com/photostreams/${encodePathSegment(owner)}`
}

// The page player takes either owner spelling and serves no frame-blocking header.
const composeAliasStreamPlayer = (owner: string): string => {
  return `https://www.flickr.com/photos/${encodePathSegment(owner)}/player`
}

const composeGroupPlayer = (groupId: string): string => {
  return `https://embedr.flickr.com/groups/${groupId}`
}

// embedr answers 404 for a private photo without its secret, and serves a public one whatever
// secret it is sent.
const composePhotoPlayer = (photoId: string, query: PhotoQuery = {}): string => {
  return `https://embedr.flickr.com/photos/${photoId}${composeQuery(trimObject(query))}`
}

// The page player ignores the owner segment and the secret after `player/`, and serves the same
// page for a wrong secret. An `in/{context}` segment only picks the set its arrows walk through.
const composePagePhotoPlayer = (photo: FlickrPhoto): string => {
  const owner = photo.owner ? encodePathSegment(photo.owner) : '_'
  return `https://www.flickr.com/photos/${owner}/${photo.photoId}/player/`
}

// Flickr's base58 alphabet for flic.kr short urls.
const base58Alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'

// A set id exceeds 2^53.
const encodeBase58 = (id: string): string => {
  let remaining = BigInt(id)
  let encoded = ''

  while (remaining > 0n) {
    encoded = base58Alphabet[Number(remaining % 58n)] + encoded
    remaining /= 58n
  }

  return encoded || base58Alphabet[0]
}

// `flic.kr/s/{code}` redirects to the owned album page.
const composeShortAlbumUrl = (setId: string): string => {
  return `https://flic.kr/s/${encodeBase58(setId)}`
}

// `flic.kr/p/{code}` is the `web_page_short_url` Flickr's own oEmbed answers for a photo, and it
// redirects to the owned photo page.
const composeShortPhotoUrl = (photoId: string): string => {
  return `https://flic.kr/p/${encodeBase58(photoId)}`
}

// The server segment in a photo file path is a don't-care: `/0/` serves the same bytes as the
// photo's own server.
const composePhotoThumbnail = (photoId: string, secret: string): string => {
  return `https://live.staticflickr.com/0/${photoId}_${encodePathSegment(secret)}_b.jpg`
}

// embedr draws its box at the size the query names, whatever the frame, so the video player is
// asked for 16:9.
const videoSize = { width: 640, height: 360 }

// What a page path names, whether it arrived in the flashvars or as the framed page itself.
// A value read out of a path is decoded, so each is held in one form and only the urls encode it.
const decodePathValue = (owner: string): string => {
  return decodeSegment(owner) ?? owner
}

const readPageSubject = (page: string): FlickrSubject | undefined => {
  const set = setPathRegex.exec(page)

  if (set) {
    return { owner: decodePathValue(set[1]), setId: decodePathValue(set[2]) }
  }

  const group = groupPathRegex.exec(page)

  if (group && nsidRegex.test(group[1])) {
    return { groupId: group[1] }
  }

  const stream = streamPathRegex.exec(page)

  if (stream) {
    return { owner: decodePathValue(stream[1]) }
  }
}

// The swf carrier names its subject in the flashvars beside it: the page path first, and the
// bare `user_id` for the few snippets that carry nothing else.
const readFlashSubject = (element: Nullish<Element>): FlickrSubject => {
  const config = parseFlashVars(flashVars(element))
  const page = getQueryParam(config, 'page_show_url') ?? ''
  const subject = readPageSubject(page)

  if (subject) {
    return subject
  }

  // Flickr's dialog names a group with a path alias in the pool path and by its NSID in
  // `group_id`, the spelling the group player takes. The player reads no start photo, so a
  // `with/{photoId}` start is dropped.
  if (groupAliasPoolPathRegex.test(page)) {
    return { groupId: getQueryParam(config, 'group_id') }
  }

  // A page path under a group names a pool, and a `user_id` beside it names a member's
  // photostream, which is another item.
  if (groupPagePathRegex.test(page)) {
    return {}
  }

  return { owner: getQueryParam(config, 'user_id') }
}

// The video swf names its photo in the flashvars and nothing else: no page path and no owner,
// so the photo id is all there is to address the player with.
const readFlashPhoto = (element: Nullish<Element>): FlickrPhoto | undefined => {
  const photoId = keepIfMatches(flashVar(element, 'photo_id'), digitsRegex)

  if (!photoId) {
    return
  }

  return { photoId, secret: flashVar(element, 'photo_secret') }
}

// The iframe carrier names its subject in its own query. A set is preferred where several
// appear, being the narrowest of the three.
const readLegacySubject = (parsed: URL): FlickrSubject => {
  return {
    setId: getQueryParam(parsed.searchParams, 'set_id'),
    owner: getQueryParam(parsed.searchParams, 'user_id'),
    groupId: getQueryParam(parsed.searchParams, 'group_id'),
  }
}

// Only the path alias is a name. The NSID spelling of the same owner names nobody a reader
// could read.
const readOwnerAlias = (owner: string | undefined): string | undefined => {
  if (!owner || owner.includes('@N')) {
    return
  }

  return owner
}

// Flickr's own page player, `/photos/{owner}/{photoId}/player/`, optionally with the browsing
// context it was opened from and the photo secret. embedr's endpoint names the photo alone, and
// a bare numeric segment is a photo only there: on `www` it is an owner's photostream.
const readPhotoPlayer = (parsed: URL): { src: string; photo: FlickrPhoto } | undefined => {
  const player = parsed.pathname.match(photoPathRegex)

  if (player) {
    const photo = {
      owner: player[1] ? decodePathValue(player[1]) : undefined,
      photoId: player[2],
      secret: player[3] ? decodePathValue(player[3]) : undefined,
    }

    return { src: composePagePhotoPlayer(photo), photo }
  }

  const embedr = isHostOf(parsed, embedrHosts) && parsed.pathname.match(embedrPhotoPathRegex)

  if (embedr) {
    return { src: composePhotoPlayer(embedr[1]), photo: { photoId: embedr[1] } }
  }
}

// Both carriers frame the photo. At the box publishers declare, embedr's chrome takes most of
// the frame.
const composePhotoEmbed = (src: string, photo: FlickrPhoto): EmbedResolverResult => {
  const { photoId, owner, secret } = photo

  return {
    provider,
    // The photo's key-free oEmbed answers on the short url, which names the photo without its owner.
    id: `p/${encodeBase58(photoId)}`,
    src,
    url: owner
      ? `https://www.flickr.com/photos/${encodePathSegment(owner)}/${photoId}/`
      : composeShortPhotoUrl(photoId),
    thumbnail: secret ? composePhotoThumbnail(photoId, secret) : undefined,
    author: readOwnerAlias(owner),
    ...sizes.photo,
  }
}

const composeEmbed = (subject: FlickrSubject): EmbedResolverResult | undefined => {
  const owner = subject.owner
  const author = readOwnerAlias(owner)

  // The album page path starts with the owner. `/sets/{id}` is still served and does not
  // redirect to `/albums/`, while the `/albums/` player redirects to `/sets/` (2026-09-29).
  if (subject.setId && owner) {
    return {
      provider,
      // Flickr serves the album without its owner, on the short url too, so the owner stays out
      // of the key and an ownerless carrier of the same album gets the same one.
      id: `photosets/${subject.setId}`,
      src: composeAlbumPlayer(subject.setId),
      url: `https://www.flickr.com/photos/${encodePathSegment(owner)}/sets/${encodePathSegment(subject.setId)}`,
      author,
    }
  }

  // The short url spells the set id in base58, which only a numeric id has.
  if (subject.setId && digitsRegex.test(subject.setId)) {
    return {
      provider,
      id: `photosets/${subject.setId}`,
      src: composeAlbumPlayer(subject.setId),
      url: composeShortAlbumUrl(subject.setId),
    }
  }

  // A group named by its alias has no player, and the owner beside it names another item.
  if (subject.groupId) {
    if (!nsidRegex.test(subject.groupId)) {
      return
    }

    // A query or flashvars group id comes out decoded, and it goes into a path.
    const groupSegment = encodePathSegment(subject.groupId)

    return {
      provider,
      id: `groups/${subject.groupId}`,
      src: composeGroupPlayer(groupSegment),
      url: `https://www.flickr.com/groups/${groupSegment}/`,
    }
  }

  // embedr takes the NSID and 404s on an alias, and nothing offline converts one into the
  // other. An alias resolves through the page player instead, which serves both spellings.
  if (owner) {
    return {
      provider,
      id: `photostreams/${owner}`,
      // embedr 404s on an alias, so only an NSID goes there.
      src: nsidRegex.test(owner) ? composeStreamPlayer(owner) : composeAliasStreamPlayer(owner),
      url: `https://www.flickr.com/photos/${encodePathSegment(owner)}/`,
      author,
    }
  }
}

const composePlayerEmbed = (
  parsed: URL,
  element: Nullish<Element>,
): EmbedResolverResult | undefined => {
  if (flashVideoPathRegex.test(parsed.pathname)) {
    const photo = readFlashPhoto(element)

    if (!photo) {
      return
    }

    const src = composePhotoPlayer(photo.photoId, { secret: photo.secret, ...videoSize })

    return composePhotoEmbed(src, photo)
  }

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    return composeEmbed(readFlashSubject(element))
  }

  if (legacyPlayerPathRegex.test(parsed.pathname)) {
    return composeEmbed(readLegacySubject(parsed))
  }

  const subject = readPageSubject(parsed.pathname)

  return subject && composeEmbed(subject)
}

const resolveTarget = (url: URL, element: Nullish<Element>): EmbedResolverResult | undefined => {
  const player = readPhotoPlayer(url)

  if (player) {
    return composePhotoEmbed(player.src, player.photo)
  }

  const result = composePlayerEmbed(url, element)

  if (!result) {
    return
  }

  if (flashVideoPathRegex.test(url.pathname)) {
    return { ...result, ...sizes.video }
  }

  return { ...result, ...sizes.slideshow }
}

export const flickrResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const target = resolveTarget(url, element)

  if (!target) {
    return
  }

  return {
    ...target,
    title: target.title ?? attr(element, 'title'),
  }
}

// Flickr's slideshow swf, its video swf, the legacy iframe, a framed album or stream page, and
// the two players for a single photo. Only `/player/` and `embedr.flickr.com` are served without
// `x-frame-options: SAMEORIGIN`, so the rest name a frame that renders empty.
export const flickrIframeEmbedResolver = createUrlEmbedResolver(hosts, flickrResolveEmbed)

// What an anchor href names other than a photo: the album, the group pool or the photostream.
const readAnchorSubject = (url: URL): FlickrSubject | undefined => {
  const set = setPathRegex.exec(url.pathname)

  if (set) {
    return { owner: decodePathValue(set[1]), setId: decodePathValue(set[2]) }
  }

  const group = anchorGroupPathRegex.exec(url.pathname)

  if (group) {
    return { groupId: group[1] }
  }

  // The script maps an owner page to the photostream by NSID only, and leaves an alias as a link.
  const stream = anchorStreamPathRegex.exec(url.pathname)

  if (stream && nsidRegex.test(stream[1])) {
    return { owner: stream[1] }
  }
}

type AnchorSize = { width: number; height: number }

// The image's size goes on the placeholder only. embedr lays out at the size a query names and
// ignores its frame, so a query crops the player in a frame narrower than the image, while a bare
// src fills whatever frame it gets.
const sizeAnchorPlayer = (result: EmbedResolverResult, size: AnchorSize): EmbedResolverResult => {
  const { ratio, ...rest } = result

  return {
    ...rest,
    ...size,
  }
}

const readAnchorTarget = (
  url: URL,
  imageSrc: string | undefined,
  size: AnchorSize | undefined,
): EmbedResolverResult | undefined => {
  const photo = anchorPhotoPathRegex.exec(url.pathname)

  if (photo) {
    const photoId = photo[2]
    // Flickr's script sends the secret the image file names, whatever photo or size the file is.
    const file = imageSrc ? photoFileRegex.exec(imageSrc) : undefined
    const result = composePhotoEmbed(composePhotoPlayer(photoId, { secret: file?.[2] }), {
      owner: decodePathValue(photo[1]),
      photoId,
    })

    if (!size) {
      return result
    }

    return sizeAnchorPlayer(result, size)
  }

  const subject = readAnchorSubject(url)
  const result = subject && composeEmbed(subject)

  if (!result) {
    return
  }

  return sizeAnchorPlayer(result, size ?? sizes.slideshow)
}

// The script leaves an image this narrow as a linked thumbnail.
const maximumThumbnailWidth = 150

// Flickr's embed code, an anchor around an image that its embedr script replaces with a player
// asked for the image's own size. Without the script the anchor is a linked image.
// See: https://widgets.flickr.com/embedr/embedr-47ad26da5deade67d472950b12c94b6c.js.
export const flickrAnchorEmbedResolver = createMarkupEmbedResolver(
  'a[data-flickr-embed="true"][href]',
  (element) => {
    const image = find(element, 'img')
    const url = parseUrlOnHosts(attr(element, 'href'), hosts)

    if (!image || !url) {
      return
    }

    const width = parsePixelSize(attr(image, 'width'))
    const height = parsePixelSize(attr(image, 'height'))

    if (width && width <= maximumThumbnailWidth) {
      return
    }

    const imageSrc = attr(image, 'src')
    const result = readAnchorTarget(url, imageSrc, width && height ? { width, height } : undefined)

    if (!result) {
      return
    }

    return {
      ...result,
      thumbnail: imageSrc,
      title: attr(element, 'title') ?? attr(image, 'alt'),
    }
  },
)

// Only embedr's video player answers player.js. A photo and the page player post no ready message.
export const flickrRenderHint: EmbedRenderHint = {
  provider,
  // With no size in its query, embedr serves every slide at 2048 px and loads them all at once.
  sizeParams: { width: 'width', height: 'height' },
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
