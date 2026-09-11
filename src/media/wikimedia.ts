import { composeFilePathUrl, composeFileTitle } from '../embeds/wikimedia.js'
import type { MediaResolver, MediaResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import { audioFileRegex, isMediaWikiFilePage, parseMediaWikiFileName } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

// A MediaWiki file page for audio frames a player 20 pixels tall, and `Special:FilePath` offers
// it only a generic file icon in place of a poster, so the file plays as a native element.
export const wikimediaMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'iframe',
  extract: (element) => {
    const source = readCarrierUrl(element)

    if (!source || !isMediaWikiFilePage(source) || !audioFileRegex.test(source)) {
      return
    }

    const fileName = parseMediaWikiFileName(source)
    // No width: a width is what turns this address into the file icon.
    const file = fileName && composeFilePathUrl(source, fileName)

    if (!fileName || !file) {
      return
    }

    const result: MediaResolverResult = { tag: 'audio', src: file }
    const title = attr(element, 'title') ?? composeFileTitle(fileName)

    if (title) {
      result.title = title
    }

    return result
  },
}
