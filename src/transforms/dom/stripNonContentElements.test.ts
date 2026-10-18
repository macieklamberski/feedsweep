import { describe, expect, it } from 'bun:test'
import { defaultNonContentSelectors } from '../../defaults.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripNonContentElements } from './stripNonContentElements.js'

// One real-world specimen per default selector, keyed by the selector itself. The completeness
// test below keeps this table in lockstep with defaultNonContentSelectors, so a selector cannot
// be added (or removed) without its specimen.
// A specimen is removed whole, or [input, expected] when the selector strips a child and the
// element around it must survive.
const specimens: Record<string, string | [string, string]> = {
  '[data-component-name="SubscribeWidget"]':
    '<div data-component-name="SubscribeWidget"><input type="email"><button>Subscribe</button></div>',
  '.subscription-widget-wrap-editor':
    '<div class="subscription-widget-wrap-editor"><div class="subscription-widget"><h2>Keep reading with a 7-day free trial</h2></div></div>',
  'iframe[src*=".substack.com/"][src$="/embed"]':
    '<iframe src="https://other.substack.com/embed" width="480" height="320"></iframe>',
  '.wp-block-jetpack-subscriptions':
    '<div class="wp-block-jetpack-subscriptions"><form><input type="email"></form></div>',
  '.kg-signup-card':
    '<div class="kg-card kg-signup-card" data-lexical-signup-form><h2>Subscribe</h2></div>',
  '.mc4wp-form': '<form class="mc4wp-form" method="post"><input type="email" name="EMAIL"></form>',
  '.formkit-form': '<form class="formkit-form" data-sv-form="123456"><input type="email"></form>',
  'iframe[src*="embeds.beehiiv.com"]':
    '<iframe src="https://embeds.beehiiv.com/72773897-9d0c" height="320"></iframe>',
  '.jetpack_subscription_widget':
    '<div class="jetpack_subscription_widget"><form><input type="email"></form></div>',
  'form[action*="buttondown.email"]':
    '<form action="https://buttondown.email/api/emails/embed-subscribe/foo" method="post"><input name="email"></form>',
  '.sqs-block-newsletter':
    '<div class="sqs-block newsletter-block sqs-block-newsletter"><form><input type="email"></form></div>',
  '.wpforms-container': '<div class="wpforms-container"><form></form></div>',
  '[class*="tve-leads"]': '<div class="tve-leads-conversion-object"></div>',
  'form[action*=".list-manage"]:not(:has(img, picture, video, iframe))':
    '<form action="https://example.us8.list-manage.com/subscribe/post?u=6812a77ff87af5e2479fffcec&amp;id=2fe16a669" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank"><div id="mc_embed_signup_scroll"><h2>Subscribe to my mailing list</h2><div class="mc-field-group"><label for="mce-EMAIL">Email Address</label><input type="email" name="EMAIL" class="required email" id="mce-EMAIL"></div><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div></form>',
  'form[class*="fivestar"]':
    '<form class="fivestar-widget" action="/taxonomy/term/116/feed" method="post" id="fivestar-custom-widget" accept-charset="UTF-8"><div class="clearfix fivestar-combo-text fivestar-combo-stars fivestar-form-item fivestar-default"><div class="form-item form-type-select form-item-vote"><select id="edit-vote--2" name="vote" class="form-select"><option value="-">Select rating</option><option value="20">Give it 1/5</option><option value="40">Give it 2/5</option><option value="60">Give it 3/5</option><option value="80">Give it 4/5</option><option value="100">Give it 5/5</option></select><div class="description"><div class="fivestar-summary fivestar-summary-average-count"><span class="average-rating">Average: <span>4.9</span></span> <span class="total-votes">(<span>8</span> votes)</span></div></div></div><input class="fivestar-submit form-submit" type="submit" id="edit-fivestar-submit" name="op" value="Rate"></div></form>',
  'form[id^="rate-widget"]':
    '<form class="vote-form" id="rate-widget-base-form" action="/taxonomy/term/8744/feed" method="post" accept-charset="UTF-8"><table class="rating-table"><tr class="rating-table-tr"><td class="rating-table-td">Was this article useful?</td></tr><tr class="rating-table-tr"><td class="rating-table-td"><div class="thumbsup-rating-wrapper rate-enabled"><label class="rating-label thumbsup-rating-label thumbsup-rating-label-up"><input class="rating-input thumbsup-rating-input form-radio" type="radio" id="edit-value-1" name="value" value="1"></label><div class="rating-option-result">0</div></div><input class="thumbsup-rating-submit button form-submit" type="submit" id="edit-submit--2" name="op" value="OK"></td></tr></table></form>',
  'form[role="search"]':
    '<form id="searchwp-form-1" role="search" method="get" class="searchwp-form" action="https://example.com/" aria-label="Search"><input type="hidden" name="swp_form[form_id]" value="1"><div class="searchwp-form-input-container swp-items-stretch"><input type="search" class="swp-input--search swp-input" name="swps" aria-label="Search"></div><input type="submit" class="search-submit swp-button" value="archive search"></form>',
  'form:has(input[name="s"]:not([type="submit"]))':
    '<form class="e-search-form" action="https://example.com/blog" method="get"><label class="e-search-label" for="search-f088e24"><span class="elementor-screen-only">Search</span></label><div class="e-search-input-wrapper"><input id="search-f088e24" placeholder="Search" class="e-search-input" type="search" name="s" value=""></div><button class="e-search-submit" type="submit">Search</button></form>',
  '.adsbygoogle':
    '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-x" data-ad-slot="123"></ins>',
  'div[id^="div-gpt-ad"]': '<div id="div-gpt-ad-1234567890"></div>',
  '.adthrive-ad': '<div class="adthrive-ad adthrive-content"></div>',
  'amp-ad':
    '<amp-ad width="100vw" height="320" type="adsense" data-ad-client="ca-pub-1234567890123456" data-ad-slot="1234567890" data-auto-format="rspv" data-full-width layout="fixed"></amp-ad>',
  'amp-auto-ads':
    '<amp-auto-ads type="adsense" data-ad-client="ca-pub-1234567890123456"></amp-auto-ads>',
  'amp-sticky-ad':
    '<amp-sticky-ad layout="nodisplay"><amp-ad width="320" height="50" type="doubleclick" data-slot="/4119129/sticky"></amp-ad></amp-sticky-ad>',
  'amp-sticky-ad-top-padding':
    '<amp-sticky-ad-top-padding class="amp-sticky-ad-top-padding"></amp-sticky-ad-top-padding>',
  '[src*="amazon"][src*="/e/cm"]':
    '<iframe src="https://rcm.amazon.com/e/cm?t=tag-20&o=1&p=8&l=as1&asins=B00451B7WU&f=ifr" style="width:120px;height:240px;" scrolling="no" frameborder="0"></iframe>',
  '[src*="amazon"][src*="/widgets/q"]':
    '<iframe src="//ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&asins=B00451B7WU" width="120" height="240"></iframe>',
  'object[data*="amazon"][data*="/widgets/q"]':
    '<object data="//ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&asins=B00451B7WU" width="120" height="240"></object>',
  'iframe[src*="ad.duga.jp/"]':
    '<iframe src="https://ad.duga.jp/dynamic/1002/34/?mode=1" width="440" height="195" scrolling="no"><a href="https://example.com/1002-01">DUGA</a></iframe>',
  'iframe[src*="shopsensewidget.shopstyle.com"]':
    '<iframe src="//shopsensewidget.shopstyle.com/#/?options=%7B%22widgetId%22%3A%225bad8374%22%2C%22pid%22%3A%22uid0000-00000000-00%22%7D" width="460" height="402"></iframe>',
  'script[src*="shopsensewidget.shopstyle.com"]': [
    '<div class="shopsense-widget" data-options="%7B%22widgetId%22%3A%225dac5d8d%22%7D"><script id="shopsensewidget-script" src="//shopsensewidget.shopstyle.com/widget-script.js?cb=1571575698116"></script></div>',
    '<div class="shopsense-widget" data-options="%7B%22widgetId%22%3A%225dac5d8d%22%7D"></div>',
  ],
  'amp-pixel':
    '<amp-pixel src="https://www16.a8.net/0.gif?a8=abcdef" layout="nodisplay"></amp-pixel>',
  'amp-analytics':
    '<amp-analytics type="googleanalytics" data-credentials="include"><script type="application/json">{"vars":{"account":"UA-12345-6"}}</script></amp-analytics>',
  '.captioned-button-wrap':
    '<div class="captioned-button-wrap"><p class="button-wrapper"><a class="button primary" href="https://example.com/p/post?action=share"><span>Share</span></a></p></div>',
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="/subscribe"])':
    '<p class="button-wrapper" data-component-name="ButtonCreateButton"><a class="button primary" href="https://example.com/subscribe?"><span>Subscribe now</span></a></p>',
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="/comments"])':
    '<p class="button-wrapper" data-component-name="ButtonCreateButton"><a class="button primary" href="https://example.com/p/post/comments"><span>Leave a comment</span></a></p>',
  '[data-component-name="ButtonCreateButton"]:has(> a[href*="action=share"])':
    '<p class="button-wrapper" data-component-name="ButtonCreateButton"><a class="button primary" href="https://example.com/p/post?action=share"><span>Share</span></a></p>',
  '[class*="social-share"]': '<div class="social-share"><a href="/x">X</a></div>',
  'iframe[src*="eventbrite."][src*="/tickets-external"]':
    '<iframe width="100%" height="214" src="//eventbrite.es/tickets-external?eid=13461809635&amp;ref=etckt"></iframe>',
  'iframe[src*="eventbrite."][src*="/countdown-widget"]':
    '<iframe allowtransparency="true" frameborder="0" height="383" marginheight="0" marginwidth="0" scrolling="no" src="https://www.eventbrite.ca/countdown-widget?eid=24687510007" width="195"></iframe>',
  'form[action*="paypal.com/cgi-bin/webscr"]':
    '<form action="https://www.paypal.com/cgi-bin/webscr" method="post"><input type="hidden" name="cmd" value="_donations"><input type="image" src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" name="submit" alt="Donate"></form>',
  'img[src*="paypal.com/"][src*="/i/btn/"]:not(a img)':
    '<img src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" alt="Donate with PayPal">',
  'form.edd_download_purchase_form':
    '<form id="edd_purchase_4374" class="edd_download_purchase_form edd_purchase_4374" method="post"><div class="edd_purchase_submit_wrapper"><button class="edd-add-to-cart button red edd-submit" data-action="edd_add_to_cart" data-download-id="4374" data-variable-price="no" data-price-mode="single" data-price="15.00"><span class="edd-add-to-cart-label">$15.00&nbsp;&ndash;&nbsp;Purchase</span></button><a href="https://example.com/checkout/" class="edd_go_to_checkout button red edd-submit" style="display:none;">Checkout</a><span class="edd-cart-ajax-alert" aria-live="assertive"><span class="edd-cart-added-alert" style="display: none;">Added to cart</span></span></div><input type="hidden" name="download_id" value="4374"><input type="hidden" name="edd_action" class="edd_action_input" value="add_to_cart"></form>',
  'p:has(> a.redcircle-link)':
    '<p style="font-size: 10px; color: gray;">Powered by <a class="redcircle-link" href="https://example.com/?utm_source=rc_embedded_player">RedCircle</a></p>',
  'iframe[src*="zeno.fm/player/"] + a:is([href$="//zeno.fm/"], [href$="//www.zeno.fm/"], [href$="//www.zeno.fm"], [href$="//www.zenomedia.com/"])':
    [
      '<iframe src="https://zeno.fm/player/halshack" width="575" height="250" frameborder="0" scrolling="no"></iframe><a href="https://zeno.fm/" target="_blank" style="display: block; font-size: 0.9em; line-height: 10px;">A Zeno.FM Station</a>',
      '<iframe src="https://zeno.fm/player/halshack" width="575" height="250" frameborder="0" scrolling="no"></iframe>',
    ],
  '[class*="share-buttons"]': '<div class="share-buttons"><a href="/fb">Facebook</a></div>',
  '.sharethis-inline-share-buttons': '<div class="sharethis-inline-share-buttons"></div>',
  '.sharedaddy': '<div class="sharedaddy sd-sharing-enabled"></div>',
  '.feedflare': '<div class="feedflare"><a href="/ff">Share</a></div>',
  '.addtoany_share_save_container':
    '<div class="addtoany_share_save_container"><a class="a2a_button_facebook" href="#">Share</a></div>',
  'iframe[src*="platform.twitter.com/widgets/"]':
    '<iframe id="twitter-widget-0" scrolling="no" frameborder="0" allowtransparency="true" src="https://platform.twitter.com/widgets/tweet_button.1397165098.html#_=1400000000000&amp;count=horizontal&amp;id=twitter-widget-0&amp;lang=en&amp;original_referer=https%3A%2F%2Fexample.com%2Fpost&amp;size=m&amp;text=A%20post&amp;url=https%3A%2F%2Fexample.com%2Fpost" class="twitter-share-button twitter-share-button-rendered twitter-tweet-button" style="position: static; visibility: visible; width: 107px; height: 20px;" title="Twitter Tweet Button"></iframe>',
  'iframe:is([src*="facebook.com/plugins/like.php"], [src*="facebook.com/v"][src*="/plugins/like.php"])':
    '<iframe src="http://www.facebook.com/plugins/like.php?href=https://example.com/post/&amp;layout=standard&amp;show_faces=1&amp;width=450&amp;action=like" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:450px; height:25px"></iframe>',
  'iframe:is([src*="facebook.com/plugins/page.php"], [src*="facebook.com/v"][src*="/plugins/page.php"])':
    '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Facme&amp;tabs=timeline&amp;width=340&amp;height=500&amp;small_header=false&amp;adapt_container_width=true&amp;hide_cover=false&amp;show_facepile=true" width="340" height="500" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>',
  'iframe:is([src*="facebook.com/plugins/likebox.php"], [src*="facebook.com/v"][src*="/plugins/likebox.php"])':
    '<iframe src="//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2Facme&amp;width=292&amp;height=258&amp;show_faces=true&amp;header=false&amp;stream=false&amp;show_border=false" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:292px; height:258px" allowtransparency="true"></iframe>',
  'iframe:is([src*="facebook.com/plugins/share_button.php"], [src*="facebook.com/v"][src*="/plugins/share_button.php"])':
    '<iframe src="https://www.facebook.com/plugins/share_button.php?href=https%3A%2F%2Fexample.com%2Fpost&amp;layout=button_count&amp;size=small&amp;width=90&amp;height=20" width="90" height="20" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>',
  '.a2a_kit': '<span class="a2a_kit a2a_kit_size_32 addtoany_list"></span>',
  '[class*="addthis_"]': '<div class="addthis_toolbox addthis_default_style"></div>',
  '.shareaholic-canvas': '<div class="shareaholic-canvas" data-app="share_buttons"></div>',
  'amp-social-share':
    '<amp-social-share type="twitter" width="60" height="44" data-param-text="Read this"></amp-social-share>',
  '.wp-block-social-links':
    '<ul class="wp-block-social-links is-layout-flex wp-block-social-links-is-layout-flex"><li class="wp-social-link wp-social-link-linkedin wp-block-social-link"><a href="https://www.linkedin.com/company/acme/" class="wp-block-social-link-anchor"><svg viewBox="0 0 24 24"><path d="M12 4.6"></path></svg><span class="wp-block-social-link-label screen-reader-text">LinkedIn</span></a></li></ul>',
  '.et_pb_social_media_follow':
    '<ul class="et_pb_social_media_follow et_pb_module et_pb_social_media_follow_0 clearfix"><li class="et_pb_social_icon et_pb_social_network_link et-social-linkedin et_pb_social_media_follow_network_2"><a href="https://www.linkedin.com/in/funtraining1/" class="icon et_pb_with_border" title="LinkedIn"><span class="et_pb_social_media_follow_network_name">LinkedIn</span></a></li></ul>',
  '.elementor-social-icons-wrapper':
    '<div class="elementor-social-icons-wrapper elementor-grid"><span class="elementor-grid-item"><a class="elementor-icon elementor-social-icon elementor-social-icon-linkedin elementor-repeater-item-32fb565" href="https://www.linkedin.com/company/acme/" target="_blank"><span class="elementor-screen-only">Linkedin</span><i class="fab fa-linkedin"></i></a></span></div>',
  '.rrssb-buttons':
    '<ul class="rrssb-buttons"><li class="rrssb-linkedin"><a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=https%3A%2F%2Fexample.com%2Fpost" class="popup"><span class="rrssb-icon"></span><span class="rrssb-text">linkedin</span></a></li></ul>',
  '.simplesocialbuttons':
    '<div class="simplesocialbuttons simplesocial-sm-round simplesocialbuttons_inline simplesocialbuttons-align-left"><button rel="nofollow" target="_blank" class="simplesocial-linkedin-share" aria-label="LinkedIn Share" data-href="https://www.linkedin.com/sharing/share-offsite/?url=https://example.com/post"><span class="simplesocialtxt">LinkedIn</span></button></div>',
  '[data-key="social-share"]':
    '<div data-label="Social Share" data-key="social-share" data-atomgroup="module" id="m-1765185492477" class="module-wrap" data-icon="eicon-social-icons" data-ver="1.0"><div class="module gf_module-left" data-modelink="auto"><a href="#" title="facebook" data-sharetext="Share" data-sharein="popup" class="gf_social gf_social-facebook"><i class="fa fa-facebook" aria-hidden="true"></i><span class="gf_social-label">Share</span></a><a href="#" title="pinterest" data-sharetext="Pin it" data-sharein="popup" class="gf_social gf_social-pinterest"><i class="fa fa-pinterest" aria-hidden="true"></i><span class="gf_social-label">Pin it</span></a></div></div>',
  'a.synved-social-button':
    '<a class="synved-social-button synved-social-button-share synved-social-size-24 synved-social-provider-linkedin nolightbox" data-provider="linkedin" target="_blank" rel="nofollow" title="Share on Linkedin" href="https://www.linkedin.com/shareArticle?mini=true&amp;url=https%3A%2F%2Fexample.com%2Fpost"><img alt="Linkedin" title="Share on Linkedin" class="synved-share-image synved-social-image synved-social-image-share" width="24" height="24" src="https://example.com/wp-content/plugins/social-media-feather/synved-social/image/social/regular/48x48/linkedin.png"></a>',
  '.av-share-box':
    '<div class="av-share-box"><h5 class="av-share-link-description av-no-toc">Share this entry</h5><ul class="av-share-box-list noLightbox"><li class="av-share-link av-social-link-linkedin"><a target="_blank" href="https://linkedin.com/shareArticle?mini=true&amp;title=A%20post&amp;url=https://example.com/post" aria-hidden="true" data-av_icon="" data-av_iconfont="entypo-fontello"><span class="avia_hidden_link_text">Share on LinkedIn</span></a></li></ul></div>',
  '[class*="elementor-share-buttons"]':
    '<div class="elementor-element elementor-share-buttons--view-icon elementor-share-buttons--skin-flat elementor-widget-share-buttons"><div class="elementor-widget-container"><div class="elementor-grid"><div class="elementor-share-btn elementor-share-btn_facebook"><span class="elementor-share-btn__title">Facebook</span></div></div></div></div>',
  '[class*="heateor_sss"]':
    '<div class="heateor_sss_sharing_container heateor_sss_horizontal_sharing"><div class="heateor_sss_sharing_ul"><a class="heateor_sss_facebook" href="https://example.com/share/facebook"><span class="heateor_sss_svg"></span></a></div></div>',
  '.mashsb-container':
    '<aside class="mashsb-container mashsb-main"><div class="mashsb-buttons"><a href="https://example.com/share/facebook" class="mashicon-facebook"><span class="text">Share</span></a></div></aside>',
  '.ssbp-wrap':
    '<div class="ssba-classic-2 ssba ssbp-wrap alignleft ssbp--theme-1"><div style="text-align:left"><span class="ssba-share-text">Share this</span><a data-site="facebook" class="ssba_facebook_share ssba_share_link" href="https://example.com/share/facebook">Facebook</a></div></div>',
  '.swp_social_panel':
    '<div class="swp_social_panel swp_horizontal_panel swp_flat_fresh" data-min-width="1100"><div class="nc_tweetContainer swp_share_button"><a class="nc_tweet swp_share_link" href="https://example.com/share/facebook"><span class="swp_share">Share</span></a></div></div>',
  'div.ya-share2':
    '<div class="ya-share2" data-services="vkontakte,odnoklassniki,twitter,telegram" data-image="https://example.com/logo.png" data-title=""></div>',
  'div.zemanta-pixie':
    '<div style="margin-top: 10px; height: 15px;" class="zemanta-pixie"><a class="zemanta-pixie-a" href="https://example.com/zemified/da212ae4/" title="Reblog this post"><img class="zemanta-pixie-img" src="https://example.com/reblog_e.png?x-id=da212ae4" alt="Reblog this post"></a></div>',
  'a[href*="digg.com/submit"]':
    '<a href="https://digg.com/submit?url=https%3A%2F%2Fexample.com%2Fa&title=A+post"><img src="https://digg.com/img/badges/100x20-digg-button.png" alt="Digg"></a>',
  'img[src*="digg.com/img/badges"]':
    '<img src="https://digg.com/img/badges/100x20-digg-button.png" alt="Digg this">',
  'iframe[src*="plusone.google.com"]':
    '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="https://plusone.google.com/_/+1/fastbutton?bsv&size=medium&hl=en-US&url=https%3A%2F%2Fexample.com%2Fa"></iframe>',
  'iframe[src*="tunein.com/embed/follow/"]':
    '<iframe src="https://tunein.com/embed/follow/p950157/?wmode=opaque"></iframe>',
  'img[src*="w.sharethis.com/"]':
    '<img src="https://w.sharethis.com/images/facebook_32.png" alt="Share on Facebook">',
  'a.hatena-bookmark-button':
    '<a href="https://example.com/entry/https://example.com/a" class="hatena-bookmark-button" data-hatena-bookmark-layout="basic-label-counter" title="Add to Hatena Bookmark"><img src="https://example.com/entry-button/button-only@2x.png" alt="Add to Hatena Bookmark" width="20" height="20"></a>',
  'iframe.hatena-bookmark-button-frame':
    '<iframe src="https://example.com/bc/bcbutton?url=https%3A%2F%2Fexample.com%2Fa" class="hatena-bookmark-button-frame" width="150" height="28" frameborder="0" scrolling="no"></iframe>',
  'img:is([src*="flagcounter.com/count"], [src*="flagcounter.com/mini/"], [src*="flagcounter.com/map/"])':
    '<img src="http://s01.flagcounter.com/mini/ezoj/bg_FFFFFF/txt_000000/border_CCCCCC/flags_1.jfif">',
  'a[href*="flagcounter.com/"]:has(img:is([src*="flagcounter.com/count"], [src*="flagcounter.com/mini/"], [src*="flagcounter.com/map/"]))':
    '<a href="https://info.flagcounter.com/9q1P"><img src="https://s11.flagcounter.com/count2/9q1P/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_0/flags_0/percent_0/" alt="Flag Counter" border="0"></a>',
  '.yarpp-related':
    '<div class="yarpp yarpp-related yarpp-template-list"><h3>Related</h3><ol><li><a href="/a">A</a></li></ol></div>',
  '.jp-relatedposts':
    '<div id="jp-relatedposts" class="jp-relatedposts"><h3 class="jp-relatedposts-headline">Related</h3></div>',
  '.crp_related': '<div class="crp_related"><ul><li><a href="/a">A</a></li></ul></div>',
  '.zergnet-widget':
    '<div class="zergnet-widget widget-loaded"><div class="zerglayoutcl"><div class="zergrow"><div class="zergentity"><a href="https://example.com/story">A story you might like</a></div></div></div></div>',
  '.wp-block-post-author':
    '<div class="wp-block-post-author"><div class="wp-block-post-author__content"><p>Jane</p></div></div>',
  '.saboxplugin-wrap':
    '<div class="saboxplugin-wrap"><div class="saboxplugin-tab"><p>About the author</p></div></div>',
  'a[class*="read-more"]': '<a class="read-more-link" href="/post">Read more</a>',
  'a[class*="continue-reading"]': '<a class="continue-reading" href="/post">Continue reading</a>',
  '.fb-comments': '<div class="fb-comments" data-href="https://example.com/p"></div>',
  '.printfriendly': '<a class="printfriendly" href="#">Print</a>',
  '.pf-button': '<button class="pf-button">Print</button>',
  'nav.breadcrumb':
    '<nav class="mb-6 flex items-center gap-2 breadcrumb"><a href="https://example.com/"><img src="https://example.com/home.png" alt="Home" width="16" height="16"></a><span class="breadcrumb-divider">/</span><a href="https://example.com/blog/category/business">Business</a></nav>',
  'nav.breadcrumbs':
    '<nav class="breadcrumbs"><a href="https://example.com/">Home</a> &raquo; <a href="https://example.com/news/">News</a></nav>',
  'nav[aria-label^="breadcrumb" i]':
    '<nav aria-label="Breadcrumbs"><div class="breadcrumb-container"><a href="https://example.com/">Home</a> / <span>Guides</span></div></nav>',
  '[role="navigation"][aria-label^="breadcrumb" i]':
    '<div role="navigation" aria-label="Breadcrumbs"><ol><li><a href="https://example.com/">Home</a></li><li>Docs</li></ol></div>',
  '.aioseo-breadcrumbs':
    '<div class="aioseo-breadcrumbs"><span class="aioseo-breadcrumb"><a href="https://example.com/">Home</a></span><span class="aioseo-breadcrumb-separator">&raquo;</span><span class="aioseo-breadcrumb">Recipes</span></div>',
  '.rt-reading-time': [
    '<p><span class="span-reading-time rt-reading-time" style="display: block;"><span class="rt-label rt-prefix">Reading Time: </span> <span class="rt-time"> 6</span> <span class="rt-label rt-postfix">minutes</span></span>Building in public once helped me.</p>',
    '<p>Building in public once helped me.</p>',
  ],
  '.yoast-reading-time__wrapper':
    '<p class="wp-block-yoast-seo-estimated-reading-time yoast-reading-time__wrapper"><span class="yoast-reading-time__icon"><svg aria-hidden="true" width="20" height="20"><path d="M12 8v4l3 3"></path></svg></span><span class="yoast-reading-time__spacer" style="display:inline-block;width:1em"></span><span class="yoast-reading-time__descriptive-text">Estimated reading time: </span><span class="yoast-reading-time__reading-time">6</span><span class="yoast-reading-time__time-unit"> minutes</span></p>',
  '.booster-read-block':
    '<div class="booster-block booster-read-block"><div class="twp-read-time"><i class="booster-icon twp-clock"></i> <span>Read Time:</span>6 Minute, 55 Second</div></div>',
  '.bsf-rt-reading-time':
    '<span class="bsf-rt-reading-time"><span class="bsf-rt-display-label" prefix=""></span> <span class="bsf-rt-display-time" reading_time="2"></span> <span class="bsf-rt-display-postfix" postfix="minute read"></span></span>',
  '.reading-time-article':
    '<span class="reading-time reading-time-article"><i class="far fa-file-alt" aria-hidden="true"></i> <span class="d-none d-sm-inline">Lesezeit: </span>3 Minuten</span>',
  '.reading-time-teaser':
    '<span class="reading-time reading-time-teaser"><i class="far fa-file-alt" aria-hidden="true"></i> 3 Minuten</span>',
  'a.rcptr':
    '<a class="rcptr" data-raflid="0b78662439" data-template="" data-theme="classic" href="https://example.com/rafl/display/0b78662439/" id="rcwidget_cq72wtxg" rel="nofollow">a Rafflecopter giveaway</a>',
  'a.rafl':
    '<a class="rafl" href="https://example.com/rafl/display/70b9a02412/" id="rc-70b9a02412" rel="nofollow">a Rafflecopter giveaway</a>',
  'a.e-widget':
    '<a class="e-widget no-button" href="https://example.com/3wKIE/win-100-amazon-gift-card" rel="nofollow">Win $100 Amazon Gift Card</a>',
  '[id^="goodreadsGiveawayWidget"]':
    '<div id="goodreadsGiveawayWidget182419"><div class="goodreadsGiveawayWidget"><h2><a href="https://example.com/">Goodreads</a> Book Giveaway</h2><div style="float: left;"><a href="https://example.com/book/show/29745568"><img alt="Benjamin McTish and The Hidden Caverns of Bristonbel by June M. Pace" src="https://example.com/books/1459384569l/29745568.jpg" width="100"></a></div><div class="giveaway_details">Giveaway ends May 13, 2016.<br>See the <a href="https://example.com/giveaway/show/182419">giveaway details</a> at Goodreads.</div><a class="goodreadsGiveawayWidgetEnterLink" href="https://example.com/giveaway/enter_choose_address/182419">Enter Giveaway</a></div></div>',
  '.goodreadsGiveawayWidget':
    '<div class="goodreadsGiveawayWidget" style="max-width: 350px; margin: 10px auto; padding: 10px 15px;"><h2><a href="https://example.com/">Goodreads</a> Book Giveaway</h2><div style="float: left;"><a href="https://example.com/book/show/36704145"><img src="https://example.com/books/1517005563l/36704145.jpg" alt="A Kiss, a Dance and a Diamond by Helen Lacey" width="100"></a></div><div class="giveaway_details"><p>Giveaway ends April 30, 2018.</p></div><p><a class="goodreadsGiveawayWidgetEnterLink" href="https://example.com/giveaway/enter_choose_address/268862">Enter Giveaway</a></p></div>',
  'a.goodreadsGiveawayWidgetEnterLink[href*="goodreads.com/giveaway/"]': [
    '<h2 style="font-size: 20px; font-weight: normal; line-height: 20px; margin: 0 0 10px; padding: 0; text-align: center;"><a class="goodreadsGiveawayWidgetEnterLink" href="https://www.goodreads.com/giveaway/show/249139">Enter Giveaway</a></h2>',
    '<h2 style="font-size: 20px; font-weight: normal; line-height: 20px; margin: 0 0 10px; padding: 0; text-align: center;"></h2>',
  ],
  'iframe[src*="stay22.com/embed"]':
    '<iframe id="stay22-widget" src="https://www.stay22.com/embed/699754889b53f8015d33a6ae" width="100%" height="428" frameborder="0"></iframe>',
  ':is(p, div)[data-gyg-href]:not(:has(*:not(a)))':
    '<div data-gyg-href="https://example.com/default/activities.frame" data-gyg-locale-code="en-US" data-gyg-widget="activities" data-gyg-number-of-items="3" data-gyg-partner-id="66RVO1V" data-gyg-tour-ids="76035,75950,400712">Powered by <a href="https://example.com/sarajevo-l2281/" target="_blank" rel="noopener sponsored">GetYourGuide</a></div>',
  '.image-link-expand': '<div class="image-link-expand"><button><svg></svg></button></div>',
  'drupal-render-placeholder':
    '<drupal-render-placeholder callback="comment.lazy_builders:renderLinks" arguments="0=node:1"></drupal-render-placeholder>',
  '.mcnPreviewText': '<span class="mcnPreviewText" style="display:none">Preview text</span>',
  '.tmblr-alt-text-helper': '<span class="tmblr-alt-text-helper">ALT</span>',
  'blockquote.wp-embedded-content + iframe.wp-embedded-content': [
    '<blockquote class="wp-embedded-content" data-secret="hDl4S8YwKz"><a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a></blockquote><iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.e-startupindia.com/learn/gstr-1/embed/#?secret=hDl4S8YwKz" data-secret="hDl4S8YwKz" width="600" height="338"></iframe>',
    '<blockquote class="wp-embedded-content" data-secret="hDl4S8YwKz"><a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a></blockquote>',
  ],
  'img[src*="steamcommunity.com"][src*="placeholder"]':
    '<img src="https://cdn.steamcommunity.com/news/placeholder_video.gif">',
  'script[consent-original-src-_]':
    '<script type="text/plain" consent-original-src-_="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>',
  '.cookieconsent-optout-marketing':
    '<div class="cookieconsent-optout-marketing"><a href="javascript:Cookiebot.renew()">Please accept marketing cookies to see this content.</a></div>',
  '.pec-overlay':
    '<div class="pec-overlay pec-active"><div class="pec-box"><p>This content is blocked. Accept cookies to watch it.</p></div></div>',
  '.onetrust-css-video-wrapper .fallback-container': [
    '<div class="onetrust-css-video-wrapper"><div class="fallback-container"><img class="fallback-bg" src="https://i.ytimg.com/vi/x/maxresdefault.jpg"><p>Enable cookies to view this content.</p></div><iframe class="optanon-category-C0004" data-src="https://www.youtube.com/embed/x"></iframe></div>',
    '<div class="onetrust-css-video-wrapper"><iframe class="optanon-category-C0004" data-src="https://www.youtube.com/embed/x"></iframe></div>',
  ],
  '[class*="et_bloom"]':
    '<div class="et_bloom_inline_form"><form><input type="email"><button>Subscribe</button></form></div>',
  'a.addtoany_share_save': '<a class="a2a_button_facebook addtoany_share_save">Share</a>',
  'a.twitter-share-button':
    '<a href="https://twitter.com/share" class="twitter-share-button" data-via="someone">Tweet</a>',
  '.vm-like-button':
    '<div class="vm-like-button"><span class="pt-like-it-not"><button class="like-button" data-href="https://example.com/wp-admin/admin-ajax.php?action=pt_like_it&amp;post_id=25556" data-id="25556" data-modus="activity"><span class="like-icon"><i class="far fa-heart"></i></span>&nbsp;<span class="like-count">3</span></button></span></div>',
  'div.easy_social_box': [
    '<div class="easy_social_box"><div class="easy_social-widget"><iframe src="https://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fexample.com"></iframe></div></div>',
    '',
  ],
  '.uSpoilerButton:not([value^="[+]"])':
    '<input type="button" class="uSpoilerButton" onclick="if($(\'#uSpoiler13Cu30\')[0]){}" value="Открыть спойлер">',
  'span[data-s9e-mediaembed]:not(:has(iframe, embed, object, video, audio))':
    '<span data-s9e-mediaembed="youtube" style="display:inline-block;max-width:640px"><span style="padding-bottom:56.25%"> <strong>iframe</strong> </span></span>',
  '.fusion-privacy-placeholder':
    '<div class="fusion-privacy-placeholder" data-privacy-type="youtube"><div class="fusion-privacy-label">For privacy reasons YouTube needs your permission to be loaded.</div></div>',
  'amp-consent':
    '<amp-consent id="consent" layout="nodisplay"><script type="application/json">{"consentInstanceId":"abc","promptUI":"consent-ui"}</script><div id="consent-ui"><p>We use cookies to personalise content and ads.</p><button on="tap:consent.accept">Accept</button></div></amp-consent>',
}

const specimenEntries = Object.entries(specimens)

const flagCounterImageUrls = [
  'http://flagcounter.com/count/t5KP/bg=B3B3B3/txt=000000/border=CCCCCC/columns=5/maxflags=248/viewers=0/labels=1/',
  'http://s01.flagcounter.com/mini/ezoj/bg_FFFFFF/txt_000000/border_CCCCCC/flags_1.jfif',
  'https://s09.flagcounter.com/map/1ue/size_s/txt_000000/border_CCCCCC/pageviews_1/viewers_0/flags_1/',
]

const wordpressHandshakeFrames: Array<[string, string]> = [
  [
    'trailing slash',
    '<iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.e-startupindia.com/learn/gstr-1/embed/#?secret=hDl4S8YwKz" data-secret="hDl4S8YwKz" width="600" height="338"></iframe>',
  ],
  [
    'no trailing slash',
    '<iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.elzeviro.eu/affari-di-palazzo/economia-e-finanza/la-coppia-liberista-boeri-perotti-vuole-ridurre-fondi-alle-universita.html/embed#?secret=77zVWLFl2K" data-secret="77zVWLFl2K" width="600" height="338"></iframe>',
  ],
  [
    'query',
    '<iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="http://technodivine.com/home/?p=687&amp;embed=true#?secret=j0JpdvuMl3" data-secret="j0JpdvuMl3" width="600" height="338"></iframe>',
  ],
]

// WordPress stamps the class on the frame it renders for any oEmbed provider.
const wordpressProviderFrames: Array<[string, string]> = [
  [
    'New York Times',
    '<iframe class="wp-embedded-content" src="https://www.nytimes.com/svc/oembed/html/?url=https%3A%2F%2Fwww.nytimes.com%2Fstory.html"></iframe>',
  ],
  [
    'Rumble',
    '<iframe class="wp-embedded-content" src="https://rumble.com/embed/v2cr0zv/#?secret=YCf2RLw39L"></iframe>',
  ],
  [
    'Audioboom',
    '<iframe class="wp-embedded-content" src="https://embeds.audioboom.com/posts/6605531/embed/v4?eid=AQAAAJLuZVrbymQA#?secret=afwIW2qi8k"></iframe>',
  ],
  [
    'Anchor show',
    '<iframe class="wp-embedded-content" src="https://anchor.fm/turpentine-productions/embed#?secret=TBoS2x00Eq"></iframe>',
  ],
  [
    'Flourish',
    '<iframe class="wp-embedded-content" src="https://public.flourish.studio/visualisation/3197522/embed#?secret=VcZeafKFSe"></iframe>',
  ],
]

// Zeno.FM's snippet links to the Zeno home page under each of its names, whatever text the
// publisher gave the link.
const zenoHomeLinks: Array<[string, string, string]> = [
  [
    'www.zeno.fm with no trailing slash',
    '<iframe src="//www.zeno.fm/player/straighttalkradio" width="575" height="240" frameborder="0" scrolling="no"></iframe><a href="https://www.zeno.fm" target="_blank" style="display: block; font-size: 0.9em; line-height: 10px;">Omnicast Media Station - Listen Live</a>',
    '<iframe src="//www.zeno.fm/player/straighttalkradio" width="575" height="240" frameborder="0" scrolling="no"></iframe>',
  ],
  [
    'www.zeno.fm',
    '<iframe frameborder="0" height="290" scrolling="no" src="//www.zeno.fm/player/Ranchos-de-Coahuila-online" width="768"></iframe><a href="https://www.zeno.fm/" style="display: block; font-size: 0.9em; line-height: 10px;" target="_blank">A Zeno Media Station</a>',
    '<iframe frameborder="0" height="290" scrolling="no" src="//www.zeno.fm/player/Ranchos-de-Coahuila-online" width="768"></iframe>',
  ],
  [
    'zenomedia.com',
    '<iframe frameborder="0" height="240" scrolling="no" src="//www.zeno.fm/player/sure-fm-master-input-station" width="575"></iframe><a href="https://www.zenomedia.com/" style="display: block; font-size: 0.9em; line-height: 10px;" target="_blank">...</a>',
    '<iframe frameborder="0" height="240" scrolling="no" src="//www.zeno.fm/player/sure-fm-master-input-station" width="575"></iframe>',
  ],
]

const eventbriteComFrames = [
  '<iframe src="https://www.eventbrite.com/tickets-external?eid=2112794425&ref=etckt" frameborder="0" width="100%" height="192"></iframe>',
  '<iframe src="//www.eventbrite.com/countdown-widget?eid=20577825831" width="195" height="295" frameborder="0"></iframe>',
]

// Eventbrite's checkout and countdown routes on a host that is not Eventbrite.
const foreignEventbriteRouteFrames = [
  'https://tickets.example.com/tickets-external?eid=13461809635',
  'https://myeventbrite-clone.example/tickets-external?eid=13461809635',
  'https://tickets.example.com/countdown-widget?eid=37526907992',
]

describeForEachParser('stripNonContentElements', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [stripNonContentElements(context)])
  }

  describe('with default selectors', () => {
    it('should have a specimen for every default selector', () => {
      const specimenSelectors = Object.keys(specimens).sort()
      const defaultSelectors = [...defaultNonContentSelectors].sort()

      expect(specimenSelectors).toEqual(defaultSelectors)
    })

    it.each(specimenEntries)('should strip %s', async (_selector, specimen) => {
      const [value, expected] = Array.isArray(specimen) ? specimen : [specimen, '']

      expect(await transform(`<p>Before</p>${value}<p>After</p>`)).toEqualHtml(
        `<p>Before</p>${expected}<p>After</p>`,
      )
    })

    // Only the AMP elements that are advertising or tracking by definition are listed. The
    // rest of the vocabulary renders the publisher's own words and stays.
    it('should keep AMP elements that carry content', async () => {
      const value = html`
        <amp-fx-flying-carpet height="300">
          <p>A scroll-revealed passage.</p>
        </amp-fx-flying-carpet>
        <amp-list src="https://example.com/items.json">
          <template type="amp-mustache">{{title}}</template>
        </amp-list>
        <amp-accordion>
          <section>
            <h4>Chapter one</h4>
            <p>Body</p>
          </section>
        </amp-accordion>
        <amp-carousel width="600" height="400">
          <amp-img src="a.jpg"></amp-img>
        </amp-carousel>
        <amp-fit-text width="300" height="80">A headline</amp-fit-text>
        <amp-timeago datetime="2026-08-01T00:00:00Z">1 August 2026</amp-timeago>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // Each social cluster is matched on its own vendor namespace, so the neighbouring blocks and
    // widgets those same page builders emit around the post body have to survive untouched.
    it('should keep the page-builder blocks that neighbour the social clusters', async () => {
      const value = html`
        <figure class="wp-block-image size-large">
          <img src="photo.jpg" alt="A photo">
        </figure>
        <div class="elementor-widget-container">
          <p>Body text</p>
        </div>
        <ul class="et_pb_text">
          <li>A list item</li>
        </ul>
        <div class="av-content-box">
          <p>More body text</p>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should strip an empty GetYourGuide paragraph mount', async () => {
      const value =
        '<p>Before</p><p data-gyg-href="https://example.com/default/activities.frame" data-gyg-locale-code="en-US" data-gyg-widget="activities" data-gyg-number-of-items="3" data-gyg-partner-id="66RVO1V"></p><p>After</p>'
      const expected = '<p>Before</p><p>After</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Publishers paste the GetYourGuide snippet's whole attribute set onto their own markup, so
    // the attribute alone also names a heading and a hand-written list of tours, not only the
    // partner script's mount.
    it("should keep GetYourGuide mounts that carry the publisher's own markup", async () => {
      const value = html`
        <h3 data-gyg-href="https://widget.getyourguide.com/default/activities.frame" data-gyg-widget="activities" data-gyg-partner-id="SN3E6N5">The best Turkish bath and spa experiences in Istanbul:</h3>
        <div data-gyg-href="https://widget.getyourguide.com/default/activities.frame" data-gyg-widget="activities" data-gyg-partner-id="SN3E6N5">
          <ul>
            <li><a href="https://gyg.me/o5CJHgXr">Private Turkish Bath, Sauna, and Massage</a> from US$58</li>
            <li><a href="https://gyg.me/lXzd4xxJ">Traditional Turkish Bath</a> from US$25</li>
          </ul>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it.each(zenoHomeLinks)(
      'should strip the Zeno.FM link to %s after the player',
      async (_name, value, expected) => {
        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    it('should keep a read-more wrapper that holds real content (anchor-scoped)', async () => {
      const value = '<div class="read-more-section"><p>Body</p></div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // WordPress writes the handshake frame as `{post}/embed/`, `{post}/embed` and
    // `?p={id}&embed=true`, each after its blockquote.
    it.each(wordpressHandshakeFrames)(
      'should strip a %s handshake frame paired with its blockquote',
      async (_name, frame) => {
        const blockquote = html`
          <blockquote class="wp-embedded-content" data-secret="77zVWLFl2K">
            <a href="https://www.elzeviro.eu/affari-di-palazzo/post.html">Post title</a>
          </blockquote>
        `
        const value = `<p>Before.</p>${blockquote}\n${frame}<p>After.</p>`
        const expected = `<p>Before.</p>${blockquote}\n<p>After.</p>`

        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    // A handshake frame alone renders the post's card, and nothing else carries the post.
    it('should keep a handshake frame with no blockquote beside it', async () => {
      const value = html`
        <p>Before.</p>
        <iframe
          class="wp-embedded-content"
          sandbox="allow-scripts"
          security="restricted"
          src="https://www.e-startupindia.com/learn/gstr-1/embed/#?secret=hDl4S8YwKz"
          data-secret="hDl4S8YwKz"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a provider frame that follows a plain blockquote', async () => {
      const value = html`
        <blockquote><p>A quoted line.</p></blockquote>
        <iframe
          class="wp-embedded-content"
          src="https://rumble.com/embed/v2cr0zv/#?secret=YCf2RLw39L"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a provider frame that follows a post embed further down', async () => {
      const value = html`
        <blockquote class="wp-embedded-content">
          <a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a>
        </blockquote>
        <p>And the video:</p>
        <iframe
          class="wp-embedded-content"
          src="https://rumble.com/embed/v2cr0zv/#?secret=YCf2RLw39L"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it.each(wordpressProviderFrames)(
      'should keep the %s frame WordPress stamped as wp-embedded-content',
      async (_name, frame) => {
        const value = `<p>Before.</p>${frame}`

        expect(await transform(value)).toEqualHtml(value)
      },
    )

    it('should remove image-link-expand carrying additional classes', async () => {
      const value = html`
        <picture>
          <img src="x.jpg">
        </picture>
        <div class="image-link-expand extra-class">
          <button></button>
        </div>
      `
      const expected = '<picture><img src="x.jpg"></picture>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove the Tumblr alt-text badge and keep the image alt it labels', async () => {
      const value = html`
        <figure class="tmblr-full" data-orig-height="814" data-orig-width="1000">
          <img src="photo.jpg" alt="A cat asleep on a windowsill">
          <span class="tmblr-alt-text-helper">ALT</span>
        </figure>
      `
      const expected = html`
        <figure class="tmblr-full" data-orig-height="814" data-orig-width="1000">
          <img src="photo.jpg" alt="A cat asleep on a windowsill">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove SubscribeWidget regardless of the host tag', async () => {
      const value = html`
        <section data-component-name="SubscribeWidget">Inner</section>
        <p>After</p>
      `
      const expected = '<p>After</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should not match elements with a different data-component-name', async () => {
      const value = '<div data-component-name="ShareWidget">Share</div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // A generator can write the Graph API version between the host and the file, and those urls
    // still serve.
    it('should strip a versioned Facebook chrome plugin frame', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/v2.3/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Facme"
        ></iframe>
        <iframe
          src="https://www.facebook.com/v2.10/plugins/share_button.php?href=https%3A%2F%2Fexample.com%2Fpost"
        ></iframe>
        <iframe
          src="https://www.facebook.com/v2.5/plugins/like.php?href=https%3A%2F%2Fexample.com%2Fpost&layout=standard"
        ></iframe>
      `

      expect(await transform(`<p>Before</p>${value}<p>After</p>`)).toEqualHtml(
        '<p>Before</p><p>After</p>',
      )
    })

    // Two plugins on the same path carry the post itself and must survive to be resolved.
    it('should keep the Facebook post and video plugin frames', async () => {
      const value = html`
        <iframe
          src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Facme%2Fposts%2F123"
        ></iframe>
        <iframe
          src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Facme%2Fvideos%2F456"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a same-named plugin file on another host that mentions facebook.com', async () => {
      const value = html`
        <iframe src="https://example.com/wp-content/plugins/like.php?ref=facebook.com"></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave unrelated iframes and forms untouched', async () => {
      const value = html`
        <iframe src="https://example.com/embed"></iframe>
        <form action="/search">
          <input name="q">
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should remove both Substack and Drupal markers in the same document', async () => {
      const value = html`
        <picture>
          <img src="x.jpg">
        </picture>
        <div class="image-link-expand">
          <button></button>
        </div>
        <p>article</p>
        <drupal-render-placeholder
          callback="comment.lazy_builders:renderLinks"
        >
        </drupal-render-placeholder>
      `
      const expected = html`
        <picture>
          <img src="x.jpg">
        </picture>
        <p>article</p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove multiple matches of the same selector', async () => {
      const value = html`
        <div class="image-link-expand">
          <button>1</button>
        </div>
        <div class="image-link-expand">
          <button>2</button>
        </div>
      `
      const expected = ''

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave document untouched when no non-content elements are present', async () => {
      const value = html`
        <p>article text</p>
        <figure>
          <img src="x.jpg">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should not touch unrelated classes containing "expand"', async () => {
      const value = '<div class="expand-collapse"><span>still here</span></div>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave non-Drupal custom elements untouched', async () => {
      const value = '<lite-youtube videoid="abc"></lite-youtube>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should be idempotent', async () => {
      const value = html`
        <picture>
          <img src="x.jpg">
        </picture>
        <div class="image-link-expand">
          <button>
            <svg></svg>
          </button>
        </div>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })

  describe('scoped selectors', () => {
    // A bookmark comment is a quoted post with the reader's own words in it, not the add button,
    // so the button entries are matched on their own classes and never on the shared prefix.
    it('should keep a Hatena bookmark comment beside the button', async () => {
      const value = html`
        <blockquote class="hatena-bookmark-comment">
          <p>Interesting point about the new release.</p>
          <p><cite><a href="https://example.com/entry/1/comment/reader">example.com</a></cite></p>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // The same wrapper with its player intact is a working embed, not chrome. Only the shells
    // whose iframe the feed generator removed are stripped.
    it('should keep an s9e wrapper whose player survived', async () => {
      const value = html`
        <span data-s9e-mediaembed="youtube">
          <span>
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
          </span>
        </span>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // The tweet player sits on the same host as the buttons, one path segment away, so the
    // button entry is anchored on `/widgets/` and the frame that carries a tweet survives.
    it('should keep the tweet player that shares the button host', async () => {
      const value =
        '<iframe src="https://platform.twitter.com/embed/Tweet.html?id=123456789012345"></iframe>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a prose link to the Zeno.FM home page away from the player', async () => {
      const value = html`
        <iframe src="https://zeno.fm/player/halshack" width="575" height="250"></iframe>
        <p>Download the app from <a href="https://zeno.fm/">Zeno.FM</a> to listen on the go.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Zeno.FM home link that follows the player at a distance', async () => {
      const value =
        '<iframe src="https://zeno.fm/player/halshack" width="575" height="250"></iframe><br><a href="https://zeno.fm/">Zeno.FM</a>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep links to hosts ending in zeno.fm after the player', async () => {
      const value = html`
        <iframe src="https://zeno.fm/player/halshack" width="575" height="250"></iframe><a href="https://notzeno.fm">Not Zeno</a>
        <iframe src="https://zeno.fm/player/halshack" width="575" height="250"></iframe><a href="https://notzeno.fm/">Not Zeno</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a link to the station page after the Zeno.FM player', async () => {
      const value =
        '<iframe src="https://zeno.fm/player/speedradiobgd" width="300" height="250"></iframe><a href="https://zeno.fm/radio/speedradiobgd/">https://zeno.fm/radio/speedradiobgd/</a>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Zeno.FM home link after another player streaming from Zeno', async () => {
      const value =
        '<iframe src="https://radioplayer.link/iframe/index.php?stream=http://stream.zeno.fm/qe66dtnrxd0uv" width="660" height="400"></iframe><a href="https://www.zeno.fm">Listen on Zeno.FM</a>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a prose link to a Goodreads giveaway', async () => {
      const value = html`
        <p>Enter the <a href="https://www.goodreads.com/giveaway/show/249139">Goodreads giveaway</a> by Friday.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a link carrying the enter-link class that points away from Goodreads', async () => {
      const value = html`
        <p><a class="goodreadsGiveawayWidgetEnterLink" href="https://example.com/giveaway">Enter Giveaway</a></p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it.each(eventbriteComFrames)('should strip the eventbrite.com frame %s', async (value) => {
      expect(await transform(`<p>Before</p>${value}<p>After</p>`)).toEqualHtml(
        '<p>Before</p><p>After</p>',
      )
    })

    // The full event page in a frame still serves and carries the event itself.
    it('should keep an Eventbrite event page frame', async () => {
      const value = html`
        <iframe
          src="https://www.eventbrite.co.uk/e/23180298898"
          width="100%"
          height="600"
        ></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it.each(foreignEventbriteRouteFrames)(
      'should keep a frame on another host at %s',
      async (url) => {
        const value = `<iframe src="${url}" width="100%" height="214"></iframe>`

        expect(await transform(value)).toEqualHtml(value)
      },
    )

    it.each(flagCounterImageUrls)('should strip the Flag Counter image %s', async (url) => {
      expect(await transform(`<p>Thanks for reading.<img src="${url}"></p>`)).toEqualHtml(
        '<p>Thanks for reading.</p>',
      )
    })

    it.each(flagCounterImageUrls)('should strip the Flag Counter link around %s', async (url) => {
      const value = html`
        <p>Thanks for reading.<a href="http://s09.flagcounter.com/more/1ue"><img src="${url}"></a></p>
      `

      expect(await transform(value)).toEqualHtml('<p>Thanks for reading.</p>')
    })

    it('should keep a prose link to Flag Counter', async () => {
      const value = html`
        <p><a href="http://flagcounter.com/">Flag Counter</a> counts the visitors of a blog by country.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep the Flag Counter flag icons in a list of visitors', async () => {
      const value = html`
        <p>
          <a href="http://flagcounter.com/factbook/ru"><img src="http://flagcounter.com/images/flags/ru.png"></a>
          <a href="http://flagcounter.com/factbook/ru">Russian Federation</a> 251
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a link to another site that holds the Flag Counter image', async () => {
      const value = html`
        <a href="https://example.com/visitors">
          <img src="https://s09.flagcounter.com/map/1ue/size_s/txt_000000/border_CCCCCC/pageviews_1/viewers_0/flags_1/">
          Visitors so far
        </a>
      `
      const expected = html`
        <a href="https://example.com/visitors">
          Visitors so far
        </a>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a PayPal button image that links to its target', async () => {
      const value = html`
        <a href="https://www.paypal.com/donate/?hosted_button_id=2BXZQLFUKNZ3Y">
          <img src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" alt="Donate">
        </a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // A titled spoiler button is the only copy of the spoiler's title, which
    // convertUcozSpoilerButtons keeps as text.
    it('should keep a uCoz spoiler button that carries a title', async () => {
      const value = '<input type="button" class="uSpoilerButton" value="[+] Обложка">'

      expect(await transform(value)).toEqualHtml(value)
    })

    // The password form's prompt is the only text a protected post ships with.
    it('should keep a WordPress password form', async () => {
      const value = html`
        <form action="https://example.com/wp-login.php?action=postpass" class="post-password-form" method="post">
          <p>This content is password protected. To view it please enter your password below:</p>
          <p><label for="pwbox-531">Password: <input name="post_password" id="pwbox-531" type="password"></label> <input type="submit" name="Submit" value="Enter"></p>
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Mailchimp form the author put the post photo in', async () => {
      const value = html`
        <form action="https://example.us8.list-manage.com/subscribe/post?u=1&amp;id=2" method="post" class="validate">
          <h2><img src="https://example.com/street-photo.jpg" alt="On Reading"></h2>
          <input type="email" name="EMAIL">
          <input type="submit" value="Subscribe">
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a validated form that posts to another host', async () => {
      const value = html`
        <form action="https://example.com/register" method="post" class="validate">
          <p>Choose a workshop date.</p>
          <input type="date" name="date">
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a poll named vote-form without the Rate widget id', async () => {
      const value = html`
        <form class="vote-form" action="https://example.com/poll" method="post">
          <p>Which route should the new tram line take?</p>
          <label><input type="radio" name="route" value="a"> Along the river</label>
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a form whose submit button is named s', async () => {
      const value = html`
        <form action="https://example.com/pokedex" method="get">
          <input type="text" name="q">
          <input type="submit" name="s" value="Look up">
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Drupal webform that carries the event it registers for', async () => {
      const value = html`
        <form class="webform-submission-form webform-submission-add-form" action="/annual-dinner" method="post">
          <p>Dinner is served at 7pm. Choose an entree for each guest.</p>
          <label for="edit-guest-1-entree">Guest #1 Entree</label>
          <select id="edit-guest-1-entree" name="guest_1_entree"><option>Lemon Herb Chicken (gluten free)</option><option>Honey Miso Glazed Salmon (gluten free)</option></select>
          <input type="submit" value="Register">
        </form>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })
})

describeForEachParser('stripNonContentElements through the pipeline', (parseHtml) => {
  it('should let a strip selector remove a parked chrome frame', async () => {
    const value = html`
      <iframe
        width="1200"
        height="240"
        data-cookieconsent="marketing"
        data-cookieblock-src="//www.facebook.com/plugins/likebox.php?href=http%3A%2F%2Fwww.facebook.com%2F354052831640272&amp;width=1200&amp;height=258&amp;show_faces=true&amp;header=false"
      ></iframe>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })

    expect(result).toEqualHtml('')
  })
})
