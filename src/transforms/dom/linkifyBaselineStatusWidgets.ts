import { encodePathSegment } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createLink } from '../../utils/widgets.js'

// The widget takes the id as `featureId`, which an HTML attribute spells `featureid`, or as
// `feature-id`.
const featureIdAttributes = ['featureid', 'feature-id']

// The web-platform-dx `baseline-status` widget shows a web feature's browser support, which its
// script fetches from the webstatus.dev api by the feature's id. A reader runs no script, so the
// element renders nothing, and the feature's page on webstatus.dev is linked instead.
export const linkifyBaselineStatusWidgets: DomTransform = () => (document) => {
  for (const widget of document.querySelectorAll('baseline-status')) {
    const featureId = featureIdAttributes.map((name) => attr(widget, name)).find(Boolean)

    if (!featureId) {
      continue
    }

    const url = `https://webstatus.dev/features/${encodePathSegment(featureId)}`

    widget.replaceWith(createLink(document, url, featureId))
  }
}
