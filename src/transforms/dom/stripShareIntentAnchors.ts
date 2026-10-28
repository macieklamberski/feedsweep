import { parseUrl } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, batchSelectors, text } from '../../utils/dom.js'
import { absoluteUrlRegex, placeholderBaseUrl } from '../../utils/urls.js'

const wordRegex = /[\p{L}\p{N}]+/gu

// A label such as "Share this on LinkedIn" never repeats four words in a row of the message its
// link posts, while the url and title it carries can repeat one or two of them.
const quotedRunLength = 4

// A share label runs to ten words at most, and a publisher's sentence written into a share link
// runs longer. A `"` marks markup a broken href swallowed, such as a shortener's error page.
const sentenceLength = 12

const getWords = (value: string): Array<string> => {
  return value.toLowerCase().match(wordRegex) ?? []
}

const getRuns = (words: Array<string>): Array<string> => {
  const runs: Array<string> = []

  for (let index = 0; index + quotedRunLength <= words.length; index++) {
    runs.push(words.slice(index, index + quotedRunLength).join(' '))
  }

  return runs
}

// A click-to-tweet anchor wraps the author's quote, and its link posts that same quote. A post
// about share links shows the link itself as its text, and a publisher can write a whole sentence
// into one.
const isAuthorText = (anchor: Element): boolean => {
  const anchorText = text(anchor) ?? ''

  if (absoluteUrlRegex.test(anchorText)) {
    return true
  }

  const words = getWords(anchorText)

  if (words.length >= sentenceLength && !anchorText.includes('"')) {
    return true
  }

  const url = parseUrl(attr(anchor, 'href'), placeholderBaseUrl)
  const messageWords = [...(url?.searchParams.values() ?? [])].flatMap(getWords)
  const messageRuns = new Set(getRuns(messageWords))

  return getRuns(words).some((run) => messageRuns.has(run))
}

// Share and bookmark buttons written as plain links to each platform's share form, outside any
// container a non-content selector names. A parent they leave empty goes in stripEmptyTags.
export const stripShareIntentAnchors: DomTransform = ({ shareIntentSelectors }) => {
  const selectors = batchSelectors(shareIntentSelectors)

  return (document) => {
    for (const selector of selectors) {
      for (const anchor of document.querySelectorAll(selector)) {
        if (isAuthorText(anchor)) {
          anchor.replaceWith(...anchor.childNodes)
          continue
        }

        anchor.remove()
      }
    }
  }
}
