import { codepenFieldCleaners } from '../embeds/codepen.js'
import { instagramFieldCleaners } from '../embeds/instagram.js'
import { kalturaFieldCleaners } from '../embeds/kaltura.js'
import { speakerdeckFieldCleaners } from '../embeds/speakerdeck.js'
import { spotifyFieldCleaners } from '../embeds/spotify.js'
import type { FieldCleaner } from '../types.js'

// The labels a platform's snippet writes where the item's own title or description belongs,
// stripped once where every placeholder is prepared rather than in each resolver. Declared
// beside the resolver that knows the platform.
export const defaultFieldCleaners: Array<FieldCleaner> = [
  ...codepenFieldCleaners,
  ...instagramFieldCleaners,
  ...kalturaFieldCleaners,
  ...speakerdeckFieldCleaners,
  ...spotifyFieldCleaners,
]
