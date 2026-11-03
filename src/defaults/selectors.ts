export const defaultNonContentSelectors = [
  // Subscribe and newsletter signup forms.
  '[data-component-name="SubscribeWidget"]', // Substack inline subscribe widget.
  '.subscription-widget-wrap-editor', // Substack paywall / subscribe CTA.

  // The same subscribe form as the wrap below, arriving as Substack's other snippet. The path is
  // anchored so a post embed (`/embed/post/{id}`) is not caught by it.
  'iframe[src*=".substack.com/" i][src$="/embed" i]',
  '.wp-block-jetpack-subscriptions', // Jetpack Gutenberg subscribe block.
  '.kg-signup-card', // Ghost (Koenig) signup card.
  '.mc4wp-form', // Mailchimp for WordPress plugin form.
  '.formkit-form', // ConvertKit / Kit subscribe form.
  'iframe[src*="embeds.beehiiv.com" i]', // Beehiiv embed iframe.
  '.jetpack_subscription_widget', // Jetpack legacy sidebar subscribe widget.
  'form[action*="buttondown.email" i]', // Buttondown embed-subscribe form; mentions of the host are nearly all plain links.
  '.sqs-block-newsletter', // Squarespace newsletter block.

  // Bloom (Elegant Themes) optin. The bare `.et_bloom` class does not exist on any element in
  // the wild: the tokens are `et_bloom_bottom_trigger`, `et_bloom_fields` and so on, and a
  // class selector matches whole tokens, so it stripped nothing. Matched on the prefix instead.
  // Most of what that reaches is the empty trigger span, which stripEmptyTags already removed;
  // the few feeds carrying the popup form are what this actually gains.
  '[class*="et_bloom"]',
  '.wpforms-container', // WPForms.
  '[class*="tve-leads"]', // Thrive Leads optin.
  'form[action*=".list-manage" i]:not(:has(img, picture, video, iframe))', // Mailchimp embedded signup form, posting to `{account}.us{n}.list-manage.com`, unless the author put media in it.

  // Rating and voting widgets, whose controls do nothing in a reader and whose count survives as
  // a stray line of text.
  'form[class*="fivestar"]', // Drupal Fivestar rating widget.
  'form[id^="rate-widget"]', // Drupal Rate module vote widget.

  // Site search forms.
  'form[role="search"]', // Theme search form with its ARIA role.
  'form:has(input[name="s"]:not([type="submit"]))', // WordPress search form without the role, named by the `s` query WordPress searches on.

  // reCAPTCHA challenge frames, the no-script fallback of a comment or contact form. Google
  // serves them under `/recaptcha/` on its own host, where Maps and Calendar frames sit beside
  // them. recaptcha.net, the mirror for regions that block google.com, serves only reCAPTCHA.
  'iframe[src*="google.com/recaptcha/" i]',
  'iframe[src*="recaptcha.net/" i]',

  // The reCAPTCHA response box beside the fallback frame in its no-script fallback.
  'noscript textarea[name="g-recaptcha-response"]',
  'noscript textarea[name="recaptcha_challenge_field"]', // The same box in reCAPTCHA v1.
  'noscript label[for="g-recaptcha-response"]', // The box's screen-reader label, written by some themes.

  // Ad slots.
  '.adsbygoogle', // Google AdSense ad slot.
  'div[id^="div-gpt-ad"]', // Google Ad Manager (GPT) ad slot.
  '.adthrive-ad', // AdThrive (Raptive) ad slot.
  'amp-ad', // AMP ad slot.
  'amp-auto-ads', // AMP auto-ads placement marker.
  'amp-sticky-ad', // AMP sticky bottom ad bar.
  'amp-sticky-ad-top-padding', // AMP runtime spacer holding room for the sticky ad bar.

  // Affiliate product widgets. Each carries the publisher's own affiliate id and advertises a
  // product the item is not about.
  // Amazon Associates names its ad unit by route, `/e/cm` on the legacy one and `/widgets/q` on
  // the current, and a dozen regional hosts serve both, so the route carries the discrimination
  // and the host is matched loosely. Neither is tag-qualified: both arrive on every carrier.
  '[src*="amazon" i][src*="/e/cm" i]',
  '[src*="amazon" i][src*="/widgets/q" i]',
  'object[data*="amazon" i][data*="/widgets/q" i]',
  'iframe[src*="ad.duga.jp/" i]', // DUGA affiliate banner frame.

  // ShopSense product grid. Its loader survives where a wrapper held it, so both carriers go.
  'iframe[src*="shopsensewidget.shopstyle.com" i]',
  'script[src*="shopsensewidget.shopstyle.com" i]',

  // Tracking beacons, which render nothing at all.
  'amp-pixel', // AMP tracking pixel.
  'amp-analytics', // AMP analytics element, a JSON config for its runtime.

  // Share and call-to-action button clusters.
  '.captioned-button-wrap', // Substack caption + CTA button (Share/Subscribe/Comment).

  // Substack's ButtonCreateButton, its CTA button outside a captioned wrap. The component wraps
  // author-authored buttons too (donation links, "Read <post title>"), and Elementor emits the
  // same button-wrapper class, so the platform action in the href is what is matched rather than
  // the component or the class.
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="/subscribe" i])',
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="/comments" i])',
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="action=share" i])',
  '[class*="social-share"]', // Generic social-share button cluster.
  '[class*="share-buttons"]', // Generic social-share button cluster.
  '.sharethis-inline-share-buttons', // ShareThis inline share buttons.
  '.sharedaddy', // Jetpack Sharedaddy share buttons.
  '.feedflare', // FeedBurner share footer ("Share on X / Email this").
  '.addtoany_share_save_container', // AddToAny share buttons (WordPress).

  // The AddToAny anchor itself. Usually empty, where stripEmptyTags already removed it. This is
  // for the variant that carries an image or text and survives as a "Share" button.
  'a.addtoany_share_save',

  // Survives as a live "Tweet" link in the output, usually with no other non-content selector
  // matching anywhere.
  'a.twitter-share-button',

  // The rendered form of the same button, and of the follow button and the share counter beside
  // it. Every class the corpus puts on one of these frames names a button, so the path is the
  // whole platform's button namespace; the player lives under `/embed/` and is untouched.
  'iframe[src*="platform.twitter.com/widgets/" i]',

  // Drupal Easy Social. The widget is chrome, but the pipeline cannot tell, so its Facebook
  // Like iframe becomes an embed placeholder card and the chrome is promoted to content.
  'div.easy_social_box',

  // A per-post like button with its count, which a community activity feed writes under every
  // update. The button renders nothing in a reader and the count survives as a stray digit.
  '.vm-like-button',

  // The Like button pasted on its own, a 25 pixel iframe that would otherwise reach the reader
  // as a click-to-play placeholder for a button. Matched in both spellings for the same reason
  // as the plugins below.
  'iframe:is([src*="facebook.com/plugins/like.php" i], [src*="facebook.com/v" i][src*="/plugins/like.php" i])',

  // The rest of the plugin namespace that is chrome rather than a post: the Page box in both its
  // spellings, and the Share button. The resolver already refuses each of these as an embed, and
  // refusing leaves them to the generic fallback, which draws a card for a follow widget. The two
  // plugins that do carry content, `post.php` and `video.php`, are named nowhere here.
  //
  // Each entry takes the bare path and the one with a Graph API version between the host and
  // the file (`facebook.com/v2.3/plugins/page.php`), which a generator can write and which still
  // serves. The host is anchored to the path so a WordPress plugin file of the same name, with
  // facebook.com somewhere in its query, stays.
  'iframe:is([src*="facebook.com/plugins/page.php" i], [src*="facebook.com/v" i][src*="/plugins/page.php" i])',
  'iframe:is([src*="facebook.com/plugins/likebox.php" i], [src*="facebook.com/v" i][src*="/plugins/likebox.php" i])',
  'iframe:is([src*="facebook.com/plugins/share_button.php" i], [src*="facebook.com/v" i][src*="/plugins/share_button.php" i])',
  '.a2a_kit', // AddToAny share icons (higher-prevalence marker than the wrapper).
  '[class*="addthis_"]', // AddThis share toolbox.
  '.shareaholic-canvas', // Shareaholic share/related widget.
  'amp-social-share', // AMP share button.

  // Theme and plugin social clusters, each one its own vendor namespace rather than a generic
  // class the two [class*=] entries above already reach.
  '.wp-block-social-links', // WordPress core social-links block (follow icons).
  '.et_pb_social_media_follow', // Divi social-media-follow module.
  '.elementor-social-icons-wrapper', // Elementor social-icons widget (follow icons).
  '.rrssb-buttons', // Ridiculously Responsive Social Sharing Buttons.
  '.simplesocialbuttons', // SimpleSocialButtons share bar.

  // Synved Social Share renders no wrapper, so the anchors are siblings of the post's own
  // paragraphs and the button itself is the only thing there is to match.
  'a.synved-social-button', // Synved Social Share buttons.

  // GemPages (Shopify page builder) social-share module. The wrapper's class is only
  // "module-wrap", so the [class*=] entries above never reach it.
  '[data-key="social-share"]',
  '.av-share-box', // Enfold theme "Share this entry" box.

  // Elementor names the widget only through modifier classes (elementor-share-buttons--view-icon
  // and siblings), so there is no bare class to match.
  '[class*="elementor-share-buttons"]', // Elementor share-buttons widget.
  '[class*="heateor_sss"]', // Sassy Social Share sharing container.
  '.mashsb-container', // MashShare share bar.

  // Simple Share Buttons Adder writes the wrapper as `ssba ssbp-wrap`; there is no `ssba-wrap`
  // class despite the plugin's name.
  '.ssbp-wrap', // Simple Share Buttons Adder share bar.
  '.swp_social_panel', // Social Warfare share panel.
  '.sw-ctt-btn', // Social Warfare's "Click To Tweet" label inside the quote it shares.
  'div.ya-share2', // Yandex share2 button row, whose data-image otherwise arrives as content.
  'div.zemanta-pixie', // Zemanta "Reblog this post" badge: a dead attribution link and its pixel.
  'a[href*="digg.com/submit" i]', // Digg submit button, and the badge image nested inside it.
  'img[src*="digg.com/img/badges" i]', // The same badge pasted without its anchor.
  'iframe[src*="plusone.google.com" i]', // Google+ +1 button, whose endpoint closed with the service.
  'iframe[src*="tunein.com/embed/follow/" i]', // TuneIn follow button for a station or a show.
  'iframe[src*="youtube.com/subscribe_embed" i]', // YouTube subscribe button, as its loader writes it.
  'iframe[src*="youtube.com/subscribe_widget" i]', // YouTube subscribe button, its retired route.
  'img[src*="w.sharethis.com/" i]', // ShareThis chicklet icons, the button row's pre-widget form.

  // TweetMeme retweet button, whose api.tweetmeme.com host no longer resolves. Publishers link
  // to tweetmeme.com in prose, so the anchor is matched by the button image it holds. The
  // plugin's `div.tweetmeme_button` is left alone: an unclosed one holds the whole post.
  'a:has(> img[src*="tweetmeme.com/imagebutton.gif" i])',
  'iframe[src*="tweetmeme.com/button.js" i]', // The same button as a counter frame.

  // Alex King's Share This WordPress plugin: a link to the plugin's own share page.
  '.akst_link',
  'a.akst_share_link', // The same link written without its wrapper.

  // Hatena Bookmark's add button. A bookmark comment carries an author's real text on a
  // blockquote of its own, so neither entry is widened to the class prefix.
  'a.hatena-bookmark-button',
  'iframe.hatena-bookmark-button-frame',

  // Visitor counters.
  // Flag Counter's counter image and the link around it, matched on the counter's routes. The
  // same host serves the flag icons and the logo that a post listing its visitors or reviewing
  // the service carries.
  'img:is([src*="flagcounter.com/count" i], [src*="flagcounter.com/mini/" i], [src*="flagcounter.com/map/" i])',
  'a[href*="flagcounter.com/" i]:has(img:is([src*="flagcounter.com/count" i], [src*="flagcounter.com/mini/" i], [src*="flagcounter.com/map/" i]))',

  // Related-posts widgets.
  '.yarpp-related', // YARPP related-posts widget (WordPress).
  '.jp-relatedposts', // Jetpack related-posts carousel.
  '.crp_related', // Contextual Related Posts WordPress plugin.
  '.zergnet-widget', // ZergNet content-recommendation widget.

  // Zemanta's related-articles block, in its thumbnail layouts. Editors carry the block's classes
  // onto what the publisher types next: the title class onto paragraphs, the item class onto
  // citations in the text-only list. The title entry stays above the list entry, since a title
  // whose list is gone no longer matches.
  '.zemanta-related-title:not(:has(a)):has(+ ul.zemanta-article-ul-image)',
  'ul.zemanta-article-ul-image',
  'fieldset.zemanta-related:has(> legend):not(:has(ul))',

  // Author bio blocks.
  '.wp-block-post-author', // WordPress Gutenberg author bio block.
  '.saboxplugin-wrap', // Simple Author Box WordPress plugin.

  // Excerpt-truncation links. Anchor-scoped so wrappers holding real content survive.
  // Some sites class the link of a WordPress post embed as `inline-read-more`.
  'a[class*="read-more"]:not(blockquote.wp-embedded-content a)', // "Read more" excerpt-truncation links.
  'a[class*="continue-reading"]', // "Continue reading" excerpt-truncation links.

  // Comment-system embeds (JS mounts that render nothing without their loader script).
  '.fb-comments', // Facebook Comments.

  // Comment form frames, which take a reply on the publisher's site and show nothing else.
  'iframe[src*="jetpack.wordpress.com/jetpack-comment/" i]', // Jetpack Comments.

  // Breadcrumb trails, carried into the item by themes that put the page hero into the content
  // field. Gated on a navigation element or a plugin class, because the bare word also names
  // recipes and articles about breadcrumbs.
  'nav.breadcrumb', // Theme breadcrumb trail.
  'nav.breadcrumbs', // Theme breadcrumb trail, plural spelling.
  'nav[aria-label^="breadcrumb" i]', // ARIA-labelled breadcrumb trail, singular or plural.
  '[role="navigation"][aria-label^="breadcrumb" i]', // The same trail on a div with a navigation role.
  '.aioseo-breadcrumbs', // All in One SEO breadcrumb trail.

  // Reading-time badges, which plugins write into the post body so they ship in the feed as a
  // stray "Reading Time: 6 minutes" line above the article.
  '.rt-reading-time', // Reading Time WP badge.
  '.yoast-reading-time__wrapper', // Yoast SEO estimated-reading-time block.
  '.booster-read-block', // Booster read-time block.
  '.bsf-rt-reading-time', // Ultimate Addons for Elementor reading-time shortcode.
  '.reading-time-article', // Drupal theme badge, the article copy.
  '.reading-time-teaser', // Drupal theme badge, the teaser copy emitted beside it.

  // Print / PDF buttons.
  '.printfriendly', // PrintFriendly print/PDF button.
  '.pf-button', // PrintFriendly button.

  // Giveaway widgets. Each is a script mount whose loader never runs in a reader, so what
  // survives is the mount's own fallback.
  'a.rcptr', // Rafflecopter giveaway mount, a link reading "a Rafflecopter giveaway".
  'a.rafl', // The same mount as Rafflecopter's earlier loader wrote it.

  // Gleam competition mount. The loader would replace it with the entry form; without it the
  // anchor survives as a bare link named after the competition.
  'a.e-widget',

  // Goodreads giveaway widget: a static card with the cover, the title, the closing date and an
  // "Enter Giveaway" button, wrapped in a div whose id the script targets. The card is the
  // widget's own fallback and is also pasted on its own without the wrapper.
  '[id^="goodreadsGiveawayWidget"]',
  '.goodreadsGiveawayWidget',

  // The card's "Enter Giveaway" button, which publishers also paste on its own beside the cover
  // and title they copied out of the card.
  'a.goodreadsGiveawayWidgetEnterLink[href*="goodreads.com/giveaway/" i]',

  // Ticketing and payment widgets, which are chrome around a transaction rather than anything
  // the item is about.
  'iframe[src*="eventbrite." i][src*="/tickets-external" i]', // Eventbrite checkout frame.
  'iframe[src*="eventbrite." i][src*="/countdown-widget" i]', // Eventbrite countdown widget.
  'form[action*="paypal.com/cgi-bin/webscr" i]', // PayPal buy, cart or subscribe form, or a donate form naming no button.
  'img[src*="paypal.com/" i][src*="/i/btn/" i]:not(a img)', // The PayPal button image pasted without its form.
  'form.edd_download_purchase_form', // Easy Digital Downloads buy button and price.

  // Affiliate booking widgets, which render a map or a form to sell the reader a stay or a
  // ticket and carry none of the post.
  'iframe[src*="stay22.com/embed" i]', // Stay22 hotel map.

  // GetYourGuide activity and availability widgets. The mount is an empty paragraph or div the
  // partner script fills, or one holding only a "Powered by GetYourGuide" credit anchor.
  // Publishers also paste the widget's whole attribute set onto their own heading or list of
  // tours, so only a paragraph or div with no child element but anchors is claimed. Text is not
  // checked, so a publisher's paragraph of prose carrying the attribute is claimed too.
  ':is(p, div)[data-gyg-href]:not(:has(*:not(a)))',

  // Platform UI chrome and non-rendered scaffolding.
  // RedCircle's embed snippet ships a ten-pixel "Powered by RedCircle" line under the player.
  'p:has(> a.redcircle-link)',

  // Zeno.FM's widget snippet writes a link to the Zeno home page right after the player. Matched
  // on that position and href only, since publishers rewrite its text.
  'iframe[src*="zeno.fm/player/" i] + a:is([href$="//zeno.fm/" i], [href$="//www.zeno.fm/" i], [href$="//www.zeno.fm" i], [href$="//www.zenomedia.com/" i])',
  '.image-link-expand', // Substack restack/zoom buttons next to images.
  'drupal-render-placeholder', // Drupal lazy-render markers for comments/forms/flag widgets.
  '.mcnPreviewText', // Mailchimp hidden email preheader text.
  '.tmblr-alt-text-helper', // Tumblr badge rendering a stray "ALT" beside an image that keeps its own alt attribute.
  'img[src*="steamcommunity.com" i][src*="placeholder" i]', // Steam news static poster gif shown before its JS swaps in the YouTube iframe.

  // uCoz spoiler toggle with no title, reading "Open spoiler" over text that is already revealed.
  // A titled one reads `[+] Title` and becomes its title in convertUcozSpoilerButtons.
  '.uSpoilerButton:not([value^="[+]"])',

  // GDPR/consent-gated embeds are recovered, not stripped: each CMP parks the author's embed
  // URL on the iframe itself, so fixLazyIframes promotes it back into src (see the CMP block in
  // defaultLazyIframeAttributes). What stays stripped here is the part that renders as chrome.
  // Real Cookie Banner also gates <script> tags (adsbygoogle, Vimeo player.js). Script-scoped so
  // the gated scripts still go while the gated iframes are recovered.
  'script[consent-original-src-_]', // Real Cookie Banner gated scripts.
  '.cookieconsent-optout-marketing', // Cookiebot "please accept marketing cookies" notice beside the gated iframe.
  '.pec-overlay', // Publii Embed Consent click-to-accept overlay beside the gated iframe.

  // OneTrust video fallback: thumbnail plus "enable cookies to view this content" text and a
  // settings link, serialized as a sibling of the gated iframe inside the wrapper.
  '.onetrust-css-video-wrapper .fallback-container', // OneTrust video fallback notice.

  // Avada's leftover "For privacy reasons … please accept" notice. The gated iframe itself is
  // recovered via data-privacy-src (a lazy attribute); only this consent nag is dead chrome.
  '.fusion-privacy-placeholder', // Avada privacy-embed notice.

  // AMP's own gate follows the same split. The element holds the config and the prompt UI and
  // nothing else, since whatever it gates carries data-block-on-consent and sits elsewhere in
  // the document, so removing it takes the nag and leaves the gated element to be recovered.
  'amp-consent', // AMP consent gate.

  // s9e MediaEmbed (forum software) wraps its player in a sizing span. Where the feed generator
  // stripped the iframe out of it, what survives is the wrapper around the literal word
  // "iframe", which renders as that word in the middle of the post. Scoped to a wrapper holding
  // no player, so the ones whose iframe survived are untouched. The video id is nowhere in the
  // markup, so there is nothing to recover here, only chrome to remove.
  'span[data-s9e-mediaembed]:not(:has(iframe, embed, object, video, audio))',
]

// Anchors whose href opens a platform's share or bookmark form for the post. Each is matched on
// the form's own route, since the same hosts serve the posts, profiles and pin pages publishers
// link to. `stripShareIntentAnchors` removes a matched anchor, or unwraps one holding a quote.
export const defaultShareIntentSelectors = [
  // Facebook, Twitter and X. A bare `facebook.com/share/{id}` is a link to a post or a group, and
  // `twitter.com/shareaholic` a profile, so neither host is matched on `/share` alone.
  'a:is([href*="facebook.com/sharer" i], [href*="facebook.com/share.php" i], [href*="facebook.com/dialog/share" i])',
  'a:is([href*="twitter.com/intent/tweet" i], [href*="twitter.com/intent/post" i], [href*="twitter.com/share?" i], [href$="twitter.com/share" i])',
  'a[href*="twitter.com/home" i][href*="status=" i]', // Twitter's share form before Web Intents.
  'a:is([href*="//x.com/intent/tweet" i], [href*="//x.com/intent/post" i], [href*="//x.com/share?" i])',

  // Other networks' share forms.
  'a:is([href*="linkedin.com/shareArticle" i], [href*="linkedin.com/sharing/share-offsite" i], [href*="linkedin.com/cws/share" i])',
  'a[href*="pinterest.com/pin/create/" i]', // Pinterest, on regional hosts too, such as `de.pinterest.com`.
  'a[href*="reddit.com/submit" i]', // Reddit.
  'a[href*="tumblr.com/widgets/share/tool" i]', // Tumblr.
  'a[href*="tumblr.com/share" i]', // Tumblr, its retired form.
  'a[href*="bsky.app/intent/compose" i]', // Bluesky.
  'a[href*="threads.net/intent/post" i]', // Threads.
  'a:is([href*="social-plugins.line.me/lineit/share" i], [href*="line.me/r/msg/text/" i])', // LINE.
  'a:is([href*="//t.me/share/url" i], [href*="//telegram.me/share/url" i])', // Telegram.
  'a[href*="xing.com/spi/shares/new" i]', // XING.
  'a[href*="web.skype.com/share" i]', // Skype.
  'a[href*="plus.google.com/share" i]', // Google+.
  'a[href*="myspace.com/index.cfm?fuseaction=postto" i]', // MySpace.
  'a[href*="myspace.com/modules/postto/" i]', // MySpace, its later form.
  'a[href*="blogger.com/share-post.g" i]', // Blogger's share menu.
  'a[href*="addtoany.com/share" i]', // AddToAny's share page, `/share` and `/share_save`.

  // WhatsApp's share form carries the post in `text`. With `phone` it opens a chat with the
  // publisher's own number, and so does `wa.me/{number}`, which are contact links and stay.
  'a[href*="whatsapp.com/send" i]:not([href*="phone=" i])',
  'a[href*="//wa.me/?" i]',

  // Mail forms with no recipient. A `mailto:` naming an address, or a Gmail form with `to` and
  // no `body`, writes to the publisher and stays.
  'a[href^="mailto:?" i]',
  'a[href*="mail.google.com/mail/" i][href*="view=cm" i][href*="body=" i]',

  // Bookmarking services.
  // Google Bookmarks. Anchored on the host, since a broken slideshow link writes the same route
  // into a path on the publisher's site, as `%3A/www.google.com/bookmarks/mark`.
  'a[href*="//www.google.com/bookmarks/mark" i]',
  'a[href*="bookmarks.yahoo.com/myresults/bookmarklet" i]', // Yahoo Bookmarks.
  'a:is([href*="delicious.com/save" i], [href*="delicious.com/post" i])', // Delicious.
  'a[href*="stumbleupon.com/submit" i]', // StumbleUpon.
  'a[href*="technorati.com/faves" i]', // Technorati.
  'a[href*="getpocket.com/save" i]', // Pocket.
  'a[href*="share.flipboard.com/bookmarklet" i]', // Flipboard.
  'a[href*="evernote.com/clip.action" i]', // Evernote.
]

// CSS class tokens that mark a <pre> as author-chosen distinct content
// (poetry stanzas, scriptural verses, leader-dotted tables of contents).
// `mergeConsecutiveOneLinerPres` skips any run where at least one <pre>
// carries one of these tokens. Of all
// matching runs, `wp-block-verse` and `wp-block-preformatted` dominate
// the false-positive cases (split poems, ToCs), while `wp-block-code`
// stays out: fragmented code blocks are the merge's intended target.
export const defaultPreservedPreClasses = [
  'wp-block-verse', // WordPress Gutenberg Verse block: poems, lyrics, scripture stanzas.
  'wp-block-preformatted', // WordPress Gutenberg Preformatted block: author-chosen distinct blocks (ToCs, quotes, numbered headings).
]

// Slider, gallery, spoiler, accordion and tab containers, and document frames, a plugin hides
// until a click or its script shows them. `stripHiddenElements` unhides a hidden element matching
// one of these.
export const defaultRevealableSelectors = [
  // Accordions and collapsible blocks.
  '.text-accordion-content', // Accordion block panel.
  '.collapsible-block-unfolded', // Wikidot collapsible block.

  // Read more toggles.
  '[id^="fv-more-text"]', // FV Read More.
  '.yrm-content', // Read More by Edmon.

  // Document viewers.
  '.ead-iframe', // Embed Any Document, whose script shows the frame on load.

  // Carousels, galleries and sliders.
  '[class*="premium-adv-carousel"]', // Premium Addons advanced carousel.
  '.esg-grid', // Essential Grid.
  '[class*="gallery"]', // Unite Gallery, `crp-light-gallery`.
  '[class*="slider"]', // bxSlider, Revolution Slider, SiteOrigin `sow-slider-base`.
  '[id^="rev_slider"]', // Revolution Slider wrapper, which carries the name in its id only.
  '[class^="slide-"]', // MetaSlider slide.
  '.field-slideshow-slide', // Drupal Field Slideshow slide.
  '.swiper-slide', // Swiper slide.
  '.testimonial_slide', // Testimonial slider slide.

  // Spoilers.
  '[class*="spoiler" i]', // `spoilermain`, `spoiler_div`, uCoz `uSpoilerText`, Easy Spoiler `easySpoilerSpoils`.
  '[id^="spoiler"]', // Easy Spoiler `spoilerDiv` panel.
  '.alt2 > div', // vBulletin spoiler BB code, also pasted into SMF, phpBB 2, MyBB and Blogger posts.
  '.quotecontent > div', // phpBB spoiler BB code, also on SMF and XenForo 1 boards.

  // Tabs.
  '[id^="rlta-panel"]', // Regular Labs Tabs and Accordions.
  '[id^="wiki-tab"]', // Wikidot tabs.
]
