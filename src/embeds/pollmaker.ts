import { isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, text } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pollmaker'

// Exact: `scripts.poll-maker.com` and `cdn.poll-maker.com` serve the loader and its images.
const pollmakerHosts = ['poll-maker.com', 'www.poll-maker.com']

// The route word is glued to the id. A digit after it tells a poll from site pages such as
// `/polls`. The route words are case-insensitive.
const pollPathRegex = /^\/(?:frame|poll|results)(\d[^/]*)$/i
const snippetIdRegex = /^qp_main(?<number>\d+)$/

// A poll's height follows its options, not its width. The frame posts its height only when the
// parent url rides in its hash, which no reader sets.
const pollHeight = 372

const composeEmbed = (
  pollId: string,
  title?: string,
  description?: string,
): EmbedResolverResult => {
  return {
    provider,
    id: pollId,
    src: `https://poll-maker.com/frame${pollId}`,
    url: `https://poll-maker.com/poll${pollId}`,
    height: pollHeight,
    title,
    description,
  }
}

const readPollId = (url: string): string | undefined => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, pollmakerHosts)) {
    return
  }

  return parsed.pathname.match(pollPathRegex)?.[1]
}

// Poll Maker's poll frame, `/frame{id}`, and the poll page, `/poll{id}`, framed whole.
export const pollmakerResolveEmbed: ResolveEmbed = (url) => {
  const pollId = readPollId(url)

  if (!pollId) {
    return
  }

  return composeEmbed(pollId)
}

export const pollmakerIframeEmbedResolver = createUrlEmbedResolver(
  pollmakerHosts,
  pollmakerResolveEmbed,
)

// The form snippet: `form#qp_form{n}` posting to `/results{id}` inside `div#qp_main{n}`, which
// `scpolls.js` drives. Without the script, and with forms stripped by a reader, the options are
// inert text. A publisher can type a post into the `div#qp_all{n}` wrapper, so it stays.
export const pollmakerFormEmbedResolver = createMarkupEmbedResolver(
  'div[id^="qp_main"]',
  (element) => {
    const pollNumber = element.id.match(snippetIdRegex)?.groups?.number

    if (!pollNumber) {
      return
    }

    const form = element.querySelector(`#qp_form${pollNumber}[action]`)
    const pollId = readPollId(attr(form, 'action') ?? '')

    if (!form || !pollId) {
      return
    }

    // The question sits in the first block of `qp_main`, ahead of the form.
    const title = text(element.firstElementChild)

    // Each option is a radio or, in a multiple-choice poll, a checkbox beside its label, in
    // `div.qp_a` where the snippet has one, else in the input's own `span`.
    const options = Array.from(form.querySelectorAll('input[type="radio"], input[type="checkbox"]'))
      .map((input) => text(input.closest('.qp_a') ?? input.parentElement))
      .join('\n')

    return composeEmbed(pollId, title, options || undefined)
  },
)
