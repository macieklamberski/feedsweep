import { isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr, flashVars, keepIfMatches } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver, getEmbedSize } from '../utils/widgets.js'

const flickrHosts = ['flickr.com']
const embedrHost = 'embedr.flickr.com'

// The swf url names only the player, with a `?v=` cache-buster identical on every slideshow.
const flashPlayerPathRegex = /^\/apps\/slideshow\//i
const legacyPlayerPathRegex = /^\/slideshow\/index\.gne$/i

const setPathRegex = /^\/photos\/([\w.@-]+)\/sets\/(\d+)/
const streamPathRegex = /^\/photos\/([\w.@-]+)\/show\/?$/
const groupPathRegex = /^\/groups\/(\d+@N\d\d)\/pool\/show\/?$/
const photoPathRegex = /^\/photos\/([\w.@-]+)\/(\d+)(?:\/in\/[^/]+)?\/player(?:\/([^/]+))?\/?$/
const embedrPhotoPathRegex = /^\/photos\/(\d+)\/?$/

const safeSetIdRegex = /^\d+$/

// The secret lands in the photo file's name, so a dot or a separator in it would name
// another path.
const safePhotoSecretRegex = /^[\w-]+$/

// The first class admits no dot, so `..` never reaches a minted path.
// An owner is a numeric NSID with its `@N0…` suffix, or the path alias the owner chose.
const safeOwnerRegex = /^[\w-][\w.-]*(?:@N\d\d)?$/

// A group and a photostream each resolve by NSID and only by NSID: the player answers 200 for
// `groups/{nsid}` and for `photostreams/{nsid}`, and 404 for a path alias in either position.
// Feeds spell `group_id` as an NSID in every non-mangled occurrence.
const safeNsidRegex = /^\d+@N\d\d$/

// What a carrier names, whichever carrier and whichever spelling: an album needs its set, a
// group pool its NSID, a photostream only its owner.
type FlickrSubject = { setId?: string; owner?: string; groupId?: string }

// A single photo, whose owner and secret are each in the path on one of the two carriers only.
type FlickrPhoto = { photoId: string; owner?: string; secret?: string }

// Flickr's own embed script writes these embedr endpoints into a frameless iframe. A real id
// answers 200 with the whole slideshow and an invented one 404.
const composeAlbumPlayer = (setId: string): string => {
  return `https://embedr.flickr.com/photosets/${setId}`
}

const composeStreamPlayer = (owner: string): string => {
  return `https://embedr.flickr.com/photostreams/${owner}`
}

// The page player takes either owner spelling, serves no frame-blocking header and takes the
// same width and height query as embedr.
const composeAliasStreamPlayer = (owner: string): string => {
  return `https://www.flickr.com/photos/${owner}/player`
}

const composeGroupPlayer = (groupId: string): string => {
  return `https://embedr.flickr.com/groups/${groupId}`
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
  return `https://live.staticflickr.com/0/${photoId}_${secret}_b.jpg`
}

// The size Flickr's own dialog wrote for years. The slideshow renders at whatever box the query
// names, so there is no rendered height to measure against.
const dialogSize = { width: 400, height: 300 }

// What a page path names, whether it arrived in the flashvars or as the framed page itself.
const readPageSubject = (page: string): FlickrSubject | undefined => {
  const set = page.match(setPathRegex)

  if (set) {
    return { owner: set[1], setId: set[2] }
  }

  const group = page.match(groupPathRegex)

  if (group) {
    return { groupId: group[1] }
  }

  const stream = page.match(streamPathRegex)

  if (stream) {
    return { owner: stream[1] }
  }
}

// The swf carrier names its subject in the flashvars beside it: the page path first, and the
// bare `user_id` for the few snippets that carry nothing else.
const readFlashSubject = (element: Element): FlickrSubject => {
  const config = new URLSearchParams(flashVars(element) ?? '')
  const page = config.get('page_show_url') ?? ''

  return readPageSubject(page) ?? { owner: config.get('user_id') ?? undefined }
}

// The iframe carrier names its subject in its own query. A set is preferred where several
// appear, being the narrowest of the three.
const readLegacySubject = (parsed: URL): FlickrSubject => {
  return {
    setId: parsed.searchParams.get('set_id') ?? undefined,
    owner: parsed.searchParams.get('user_id') ?? undefined,
    groupId: parsed.searchParams.get('group_id') ?? undefined,
  }
}

// Only the path alias is a name. The NSID spelling of the same owner names nobody a reader
// could read.
const readOwnerAlias = (owner: string | undefined): string | undefined => {
  return owner && !safeNsidRegex.test(owner) ? owner : undefined
}

// Flickr's own page player, `/photos/{owner}/{photoId}/player/`, optionally with the browsing
// context it was opened from and the photo secret. embedr's endpoint names the photo alone, and
// a bare numeric segment is a photo only there: on `www` it is an owner's photostream.
const readPhotoSubject = (parsed: URL): FlickrPhoto | undefined => {
  const player = parsed.pathname.match(photoPathRegex)

  if (player) {
    return { owner: player[1], photoId: player[2], secret: player[3] }
  }

  const embedr = isHostOf(parsed, embedrHost) && parsed.pathname.match(embedrPhotoPathRegex)

  if (embedr) {
    return { photoId: embedr[1] }
  }
}

// Both carriers frame the photo. At the box publishers declare, embedr's chrome takes most of
// the frame.
const composePhotoEmbed = (link: string, photo: FlickrPhoto): EmbedResolverResult => {
  const { photoId, owner } = photo
  const secret = keepIfMatches(photo.secret, safePhotoSecretRegex)

  return {
    provider: 'flickr',
    // The photo's key-free oEmbed answers on the page url and on the short url alike.
    id: owner ? `photos/${owner}/${photoId}` : `p/${encodeBase58(photoId)}`,
    src: link,
    url: owner
      ? `https://www.flickr.com/photos/${owner}/${photoId}/`
      : composeShortPhotoUrl(photoId),
    thumbnail: secret ? composePhotoThumbnail(photoId, secret) : undefined,
    author: readOwnerAlias(owner),
  }
}

const composeEmbed = (subject: FlickrSubject): EmbedResolverResult | undefined => {
  const owner = keepIfMatches(subject.owner, safeOwnerRegex)
  const author = readOwnerAlias(owner)

  if (subject.setId && safeSetIdRegex.test(subject.setId)) {
    // The album page path starts with the owner, and `/sets/{id}` is kept as the markup spells
    // it: the path is still served and does not redirect to `/albums/` (both 200, 2026-08-14).
    return owner
      ? {
          provider: 'flickr',
          // The album's key-free oEmbed needs `{owner}/{setId}`: a title, an author, a thumbnail.
          id: `${owner}/${subject.setId}`,
          src: composeAlbumPlayer(subject.setId),
          url: `https://www.flickr.com/photos/${owner}/sets/${subject.setId}`,
          author,
        }
      : {
          provider: 'flickr',
          // Addresses the player but not oEmbed.
          id: `photosets/${subject.setId}`,
          src: composeAlbumPlayer(subject.setId),
          url: composeShortAlbumUrl(subject.setId),
        }
  }

  if (subject.groupId && safeNsidRegex.test(subject.groupId)) {
    return {
      provider: 'flickr',
      id: `groups/${subject.groupId}`,
      src: composeGroupPlayer(subject.groupId),
      url: `https://www.flickr.com/groups/${subject.groupId}/`,
    }
  }

  // embedr takes the NSID and 404s on an alias, and nothing offline converts one into the
  // other. An alias resolves through the page player instead, which serves both spellings.
  if (owner) {
    return {
      provider: 'flickr',
      id: `photostreams/${owner}`,
      // embedr 404s on an alias, so only an NSID goes there.
      src: safeNsidRegex.test(owner) ? composeStreamPlayer(owner) : composeAliasStreamPlayer(owner),
      url: `https://www.flickr.com/photos/${owner}/`,
      author,
    }
  }
}

const resolveTarget = (link: string, element: Element): EmbedResolverResult | undefined => {
  const parsed = parseUrl(link, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const photo = readPhotoSubject(parsed)

  if (photo) {
    return composePhotoEmbed(link, photo)
  }

  let subject: FlickrSubject | undefined

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    subject = readFlashSubject(element)
  } else if (legacyPlayerPathRegex.test(parsed.pathname)) {
    subject = readLegacySubject(parsed)
  } else {
    subject = readPageSubject(parsed.pathname)
  }

  const result = subject && composeEmbed(subject)

  if (!result) {
    return
  }

  const declared = getEmbedSize(element, 0)
  // Both halves or neither: given one half, the endpoint uses its default for the other as is.
  const { width, height } =
    declared.width && declared.height
      ? { width: declared.width, height: declared.height }
      : dialogSize

  // The size always travels in the src: with no query every image renders at NaN.
  return { ...result, src: `${result.src}?width=${width}&height=${height}`, width, height }
}

export const flickrResolveEmbed = (
  link: string,
  element: Element,
): EmbedResolverResult | undefined => {
  const target = resolveTarget(link, element)

  return target && { ...target, title: target.title ?? attr(element, 'title') }
}

// Flickr's slideshow swf, its legacy iframe, a framed album or stream page, and the two players
// for a single photo. Only `/player/` and `embedr.flickr.com` are served without
// `x-frame-options: SAMEORIGIN`, so the rest name a frame that renders empty.
export const flickrEmbedResolver = createUrlEmbedResolver(flickrHosts, flickrResolveEmbed, {
  // The carrier's size is already folded into the src, and it is what the endpoint renders at.
  preferResolverSize: true,
})
