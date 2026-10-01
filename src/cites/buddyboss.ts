import { createLinkPreviewCiteResolver } from './buddypress.js'

// BuddyBoss's link preview: unfurled into the activity post body as bare divs the theme styles.
export const buddybossCiteResolver = createLinkPreviewCiteResolver('buddyboss', 'bb-link-preview')
