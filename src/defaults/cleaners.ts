import { acastFieldCleaners } from '../embeds/acast.js'
import { audioboomFieldCleaners } from '../embeds/audioboom.js'
import { blubrryFieldCleaners } from '../embeds/blubrry.js'
import { codepenFieldCleaners } from '../embeds/codepen.js'
import { dailymotionFieldCleaners } from '../embeds/dailymotion.js'
import { deezerFieldCleaners } from '../embeds/deezer.js'
import { instagramFieldCleaners } from '../embeds/instagram.js'
import { kalturaFieldCleaners } from '../embeds/kaltura.js'
import { libsynFieldCleaners } from '../embeds/libsyn.js'
import { sketchfabFieldCleaners } from '../embeds/sketchfab.js'
import { speakerdeckFieldCleaners } from '../embeds/speakerdeck.js'
import { spotifyFieldCleaners } from '../embeds/spotify.js'
import { youtubeFieldCleaners } from '../embeds/youtube.js'
import type { FieldCleaner } from '../types.js'

// The labels a platform's snippet writes where the item's own title or description belongs,
// stripped once where every placeholder is prepared rather than in each resolver. Declared
// beside the resolver that knows the platform.
export const defaultFieldCleaners: Array<FieldCleaner> = [
  ...acastFieldCleaners,
  ...audioboomFieldCleaners,
  ...blubrryFieldCleaners,
  ...codepenFieldCleaners,
  ...dailymotionFieldCleaners,
  ...deezerFieldCleaners,
  ...instagramFieldCleaners,
  ...kalturaFieldCleaners,
  ...libsynFieldCleaners,
  ...sketchfabFieldCleaners,
  ...speakerdeckFieldCleaners,
  ...spotifyFieldCleaners,
  ...youtubeFieldCleaners,
]
