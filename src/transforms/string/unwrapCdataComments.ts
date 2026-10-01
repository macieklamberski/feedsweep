import type { StringTransform } from '../../types.js'

const cdataOpenRegex = /<!--\s*\[CDATA\[/g
const cdataCloseRegex = /\]\]\s*-->/g

// WordPress writes CDATA as a <!--[CDATA[ … ]]--> comment, which comment stripping erases.
export const unwrapCdataComments: StringTransform = () => {
  return (html) => {
    if (!html.includes('[CDATA[')) {
      return html
    }

    let result = ''
    let position = 0

    cdataOpenRegex.lastIndex = 0

    while (true) {
      const open = cdataOpenRegex.exec(html)

      if (!open) {
        break
      }

      cdataCloseRegex.lastIndex = cdataOpenRegex.lastIndex

      const close = cdataCloseRegex.exec(html)

      // No later opener has a closer either. A lazy regex would rescan to the end from each one.
      if (!close) {
        break
      }

      result += `${html.slice(position, open.index)}${html.slice(cdataOpenRegex.lastIndex, close.index)}`
      position = cdataCloseRegex.lastIndex
      cdataOpenRegex.lastIndex = position
    }

    return `${result}${html.slice(position)}`
  }
}
