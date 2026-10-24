import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'

const wrapperHosts = ['wpcomwidgets.com']

// WordPress.com's frame around a Flash embed its post filter took out, which serves only a "No
// hotlinking please." page. Its query holds the player: the swf in `src`, its configuration in
// `flashvars` and its box in `width` and `height`.
export const unwrapWpcomWidgetFrames: DomTransform = () => {
  return (document) => {
    for (const iframe of document.querySelectorAll('iframe[src]')) {
      const wrapper = parseUrlOnHosts(attr(iframe, 'src'), wrapperHosts)

      if (!wrapper) {
        continue
      }

      const query = wrapper.searchParams
      const src = query.get('src')

      if (!src) {
        continue
      }

      const flashvars = query.get('flashvars')
      const attributes = {
        src,
        flashvars,
        width: query.get('width'),
        height: query.get('height'),
        type: 'application/x-shockwave-flash',
      }
      const embed = document.createElement('embed')

      for (const [name, value] of Object.entries(attributes)) {
        if (value) {
          embed.setAttribute(name, value)
        }
      }

      // In place, so a wrapper a resolver reads around the player, such as SlideShare's
      // `__ss_{id}` div, still holds it.
      iframe.replaceWith(embed)
    }
  }
}
