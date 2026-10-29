import type { TrackingUrl } from '../types.js'

// Images served from these hosts are tracking. An entry with a `path` matches only the
// pathnames its regex tests true, for a host that also serves content images.
export const defaultTrackingUrls: Array<TrackingUrl> = [
  { host: 'feedsportal.com' }, // Postmedia/Newsfutures feed-syndication pixels (/c/<id>/<…>.gif).
  { host: 'stats.wordpress.com' }, // WordPress.com / Jetpack Stats pixels.
  { host: 'pixel.wp.com' }, // WordPress.com / Jetpack Stats pixels.
  { host: 'doubleclick.net' }, // Google ads tracking.
  { host: 'google-analytics.com' }, // Google Analytics measurement pixels.
  { host: 'list-manage.com' }, // Mailchimp opens.
  { host: 'feedburner.com' }, // FeedBurner flare pixels (/~ff/).
  { host: 'feedproxy.google.com' }, // FeedBurner-via-Google.
  { host: 'feedblitz.com' }, // FeedBlitz pixels.
  { host: 'mailerlite.com' }, // Newsletter platform.
  { host: 'convertkit-mail.com' }, // Newsletter platform.
  { host: 'beehiiv.com' }, // Newsletter platform.
  { host: 'googlesyndication.com' }, // Google AdSense ad pixels.
  { host: 'googleadservices.com' }, // AdSense for Feeds ad images and Google Ads conversion pixels.
  { host: 'googletagmanager.com' }, // Google Tag Manager.
  { host: 'amazon-adsystem.com' }, // Amazon ad serving pixels.
  { host: 'facebook.com', path: /^\/tr(\/|$)/i }, // Meta Pixel images. The host also serves logos and photos.
  { host: 'taboola.com' }, // Content-recommendation widget pixels.
  { host: 'outbrain.com' }, // Content-recommendation widget pixels.
  { host: 'linkwithin.com', path: /^\/pixel\.png$/i }, // LinkWithin pixels. lwlink3 wraps post images.
  { host: 'scorecardresearch.com' }, // Comscore audience-measurement pixels.
  { host: 'quantserve.com' }, // Quantcast measurement pixels.
  { host: 'chartbeat.com' }, // Chartbeat analytics pixels.
  { host: 'moatads.com' }, // Oracle Moat viewability pixels.
  { host: 'sentry.io' }, // Sentry error-monitoring beacons.
  { host: 'hubspot.com' }, // HubSpot __ptq.gif open-pixels.
  { host: 'follow.it' }, // follow.it RSS view pixels (api.follow.it/track-rss-*).
  { host: 'pheedo.com' }, // Pheedo feed-ad tracker (/feeds/tracker.php).
  { host: 'statcounter.com' }, // StatCounter analytics pixels (c.statcounter.com/counter.php).
  { host: 'mc.yandex.ru' }, // Yandex Metrica pixels (/watch/<id>), hidden off-screen, not sized.
  { host: 'gigya.com' }, // Gigya/SAP Wildfire IMP pixels (counters.gigya.com).
  { host: 'counter.theconversation.com' }, // The Conversation article counters (/content/<id>/count.gif).
  { host: 'counter.blakedrumm.com' }, // Page-view counter badges (/count/tag.svg).
  { host: 'rt.prnewswire.com' }, // PR Newswire release tracking (rt.gif).
  { host: 'reports.newsvoir.com' }, // Newsvoir release pixels. Not the bare host: www serves release photos.
  { host: 'emailwire.com', path: /^\/tracker\//i }, // EmailWire release pixels (/tracker/track.php). The host serves release images under /files.
  { host: 'assoc-amazon.com' }, // Amazon Associates link pixels (/e/ir?).
  { host: 'assoc-amazon.jp' }, // Amazon Associates link pixels (JP).
  { host: 'assoc-amazon.co.uk' }, // Amazon Associates link pixels (UK).
  { host: 'assoc-amazon.de' }, // Amazon Associates link pixels (DE).
  { host: 'assoc-amazon.fr' }, // Amazon Associates link pixels (FR).
  { host: 'linksynergy.com' }, // Rakuten Advertising (LinkSynergy) affiliate pixels.
  { host: 'pxf.io' }, // Impact Radius affiliate pixels.
  { host: 'ti.tradetracker.net' }, // TradeTracker affiliate impression pixels. Its sized banners stay.
  { host: 'valuecommerce.com' }, // ValueCommerce (JP) affiliate impression pixels.
  { host: 'a8.net' }, // A8.net (JP) affiliate pixels.
  { host: 'moshimo.com' }, // Moshimo Affiliate (JP) impression pixels.
  { host: 'accesstrade.net' }, // AccessTrade (JP) affiliate pixels.
  { host: 'rentracks.jp' }, // Rentracks (JP) affiliate pixels (/adx/p.gifx).
  { host: 'felmat.net' }, // felmat (JP) affiliate pixels (/fmimp/).
  { host: 'afi-b.com' }, // affiliate-B (JP) lead pixels (/lead/).
  { host: 'affiliate-b.com' }, // affiliate-B (JP) affiliate pixels.
  { host: 'evyy.net' }, // ValueCommerce/LinkShare (evyy) affiliate pixels.
  { host: 'flexlinkspro.com' }, // FlexOffers affiliate pixels (/i.ashx).
  { host: 'postaffiliatepro.com' }, // Post Affiliate Pro tracking pixels.
]

// Hosts that only ever serve author avatars. WordPress / WP.com attaches the
// author's gravatar as a per-item media:content image, so an otherwise imageless
// post would inject the author's face as its lead image. Matched by host and
// subdomain, so the sharded 0/1/2.gravatar.com and secure.gravatar.com are covered.
export const defaultAvatarImageHosts = [
  'gravatar.com', // WordPress / WP.com per-item author gravatar as media:content.
]
