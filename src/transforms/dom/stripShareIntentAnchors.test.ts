import { describe, expect, it } from 'bun:test'
import { defaultShareIntentSelectors } from '../../defaults.js'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripShareIntentAnchors } from './stripShareIntentAnchors.js'

// One real-world specimen per default selector, keyed by the selector itself, with the
// publisher's own host swapped for a reserved one. The completeness test below keeps this table
// in lockstep with defaultShareIntentSelectors.
const specimens: Record<string, string> = {
  'a:is([href*="facebook.com/sharer" i], [href*="facebook.com/share.php" i], [href*="facebook.com/dialog/share" i])':
    '<a target="_blank" aria-label="Condividi su Facebook" href="https://www.facebook.com/sharer.php?u=https://example.com/progetto/&amp;t=Progetto%20per%20l%E2%80%99Autoimpiego"><span class="avia_hidden_link_text">Condividi su Facebook</span></a>',
  'a:is([href*="twitter.com/intent/tweet" i], [href*="twitter.com/intent/post" i], [href*="twitter.com/share?" i], [href$="twitter.com/share" i])':
    '<a target="_blank" aria-label="Condividi su X" href="https://twitter.com/share?text=Progetto%20per%20l%E2%80%99Autoimpiego&amp;url=https://example.com/?p=6709"><span class="avia_hidden_link_text">Condividi su X</span></a>',
  'a[href*="twitter.com/home" i][href*="status=" i]':
    '<a class="tt" href="http://twitter.com/home/?status=RT+@example:+Toy+Robot%21+http://example.com/yeljunw" title="Post to Twitter">Tweet This Post</a>',
  'a:is([href*="//x.com/intent/tweet" i], [href*="//x.com/intent/post" i], [href*="//x.com/share?" i])':
    '<a href="https://x.com/intent/post?url=https%3A%2F%2Fexample.com%2F%3Fp%3D12045&amp;text=The+evolving+landscape+of+the+Hybrid+Work+Model&amp;related=">Click to tweet</a>',
  'a:is([href*="linkedin.com/shareArticle" i], [href*="linkedin.com/sharing/share-offsite" i], [href*="linkedin.com/cws/share" i])':
    '<a target="_blank" aria-label="Condividi su LinkedIn" href="https://linkedin.com/shareArticle?mini=true&amp;title=Progetto%20per%20l%E2%80%99Autoimpiego&amp;url=https://example.com/progetto/"><span class="avia_hidden_link_text">Condividi su LinkedIn</span></a>',
  'a[href*="pinterest.com/pin/create/" i]':
    '<a class="pin-it-button" count-layout="horizontal" href="http://pinterest.com/pin/create/button/">Pin It</a>',
  'a[href*="reddit.com/submit" i]':
    '<a href="http://reddit.com/submit?url=https%3A%2F%2Fexample.com%2Fprincipes-fondateurs&amp;title=PRINCIPES%20FONDATEURS" class="social-share-reddit" title="Reddit" target="_blank">Reddit</a>',
  'a[href*="tumblr.com/widgets/share/tool" i]':
    '<a class="ymc-social ymc-tumblr" href="https://www.tumblr.com/widgets/share/tool?canonicalUrl=https%3A%2F%2Fexample.com%2Ffeed%2F&amp;caption=test" target="_blank">Tumblr</a>',
  'a[href*="tumblr.com/share" i]':
    '<a href="http://www.tumblr.com/share?v=3&amp;u=http%3A%2F%2Fexample.com%2Fblog%2Fwarning-signs%2F&amp;t=7+Warning+Signs" rel="nofollow" class="external" title="Share this on Tumblr">Share this on Tumblr</a>',
  'a[href*="bsky.app/intent/compose" i]':
    '<a class="st-custom-button" href="https://bsky.app/intent/compose?text=Check this out: https://example.com/article/culture/bernard-malamud/" target="_blank" rel="noopener noreferrer">Bluesky</a>',
  'a[href*="threads.net/intent/post" i]':
    '<a class="socials-item threads" target="_blank" href="https://www.threads.net/intent/post?text=https%3A%2F%2Fexample.com%2Ffeed" title="Threads"><i class="socials-item-icon threads"></i></a>',
  'a:is([href*="social-plugins.line.me/lineit/share" i], [href*="line.me/r/msg/text/" i])':
    '<a class="share-btn line" href="https://social-plugins.line.me/lineit/share?url=%23" target="_blank" rel="noopener">LINEでシェア</a>',
  'a:is([href*="//t.me/share/url" i], [href*="//telegram.me/share/url" i])':
    '<a target="_blank" aria-label="Condividi su Telegram" href="https://t.me/share/url?url=https://example.com/progetto/&amp;text=Progetto%20per%20l%E2%80%99Autoimpiego"><span class="avia_hidden_link_text">Condividi su Telegram</span></a>',
  'a[href*="xing.com/spi/shares/new" i]':
    '<a rel="external nofollow" class="ss-button-xing" href="https://www.xing.com/spi/shares/new?url=https%3A%2F%2Fexample.com%2Fthe-summer-makes-me-feel-alive" target="_blank">Share on Xing</a>',
  'a[href*="web.skype.com/share" i]':
    '<a aria-label="Skype" class="heateor_sss_button_skype" href="https://web.skype.com/share?url=https%3A%2F%2Fexample.com%2F2026%2F03%2F05%2Finvestitsiya%2F" title="Skype" rel="nofollow noopener" target="_blank"><span class="heateor_sss_svg heateor_sss_s_skype"></span></a>',
  'a[href*="plus.google.com/share" i]':
    '<a href="https://plus.google.com/share?url=https%3A//example.com/about" title="Share this on Google+" class="service-links-google-plus" rel="nofollow" target="_blank"><img src="https://example.com/sites/all/modules/service_links/images/google_plus.png" alt="Google+ logo"> Google+</a>',
  'a[href*="myspace.com/index.cfm?fuseaction=postto" i]':
    '<a href="https://www.myspace.com/index.cfm?fuseaction=postto&amp;t=About&amp;u=https%3A//example.com/about" title="Share on MySpace" class="service-links-myspace" rel="nofollow" target="_blank"><img src="https://example.com/sites/all/modules/service_links/images/myspace.png" alt="MySpace logo"> MySpace</a>',
  'a[href*="myspace.com/modules/postto/" i]':
    '<a href="http://www.myspace.com/Modules/PostTo/Pages/?u=http://example.com/gasp-t-shirts-bestellen/&amp;t=GASP+T-Shirts+bestellen" rel="nofollow" class="external" title="Sende dies zu MySpace">Sende dies zu MySpace</a>',
  'a[href*="blogger.com/share-post.g" i]':
    '<a class="goog-inline-block share-button sb-email" href="https://www.blogger.com/share-post.g?blogID=1234567890123456789&amp;pageID=9876543210987654321&amp;target=email" target="_blank" title="Envoyer par e-mail"><span class="share-button-link-text">Envoyer par e-mail</span></a>',
  'a[href*="addtoany.com/share" i]':
    '<a class="da2a_button" href="http://www.addtoany.com/share_save" id="da2a_1"> Share</a>',
  'a[href*="whatsapp.com/send" i]:not([href*="phone=" i])':
    '<a target="_blank" aria-label="Condividi su WhatsApp" href="https://api.whatsapp.com/send?text=https://example.com/progetto/"><span class="avia_hidden_link_text">Condividi su WhatsApp</span></a>',
  'a[href*="//wa.me/?" i]':
    '<a href="https://wa.me/?text=Obesidad%20Infantil%20https%3A%2F%2Fexample.com%2Fnode%2F10285" class="popup"><span class="rrssb-icon"></span><span class="rrssb-text">whatsapp</span></a>',
  'a[href^="mailto:?" i]':
    '<a aria-label="Condividi attraverso Mail" href="mailto:?subject=Progetto%20per%20l%E2%80%99Autoimpiego&amp;body=https://example.com/progetto/"><span class="avia_hidden_link_text">Condividi attraverso Mail</span></a>',
  'a[href*="mail.google.com/mail/" i][href*="view=cm" i][href*="body=" i]':
    '<a class="shr-lnk gmail btn btn-default" href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;tf=1&amp;to=&amp;su=Do%20you%20owe%20income%20tax%3F&amp;body=http%3A%2F%2Fexample.com%2Fnwsrm%2Ftfsk15-eng.html%0A" target="_blank">Gmail</a>',
  'a[href*="//www.google.com/bookmarks/mark" i]':
    '<a href="https://www.google.com/bookmarks/mark?op=add&amp;bkmk=https%3A//example.com/about&amp;title=About" title="Bookmark this post on Google" class="service-links-google" rel="nofollow" target="_blank"><img src="https://example.com/sites/all/modules/service_links/images/google.png" alt="Google logo"> Google</a>',
  'a[href*="bookmarks.yahoo.com/myresults/bookmarklet" i]':
    '<a href="https://bookmarks.yahoo.com/myresults/bookmarklet?u=https%3A//example.com/about&amp;t=About" title="Bookmark this post on Yahoo" class="service-links-yahoo" rel="nofollow" target="_blank"><img src="https://example.com/sites/all/modules/service_links/images/yahoo.png" alt="Yahoo logo"> Yahoo</a>',
  'a:is([href*="delicious.com/save" i], [href*="delicious.com/post" i])':
    '<a href="http://delicious.com/post?url=http://example.com/hello-world/&amp;title=Hello+world%21" rel="nofollow" class="external" title="Share this on del.icio.us">Share this on del.icio.us</a>',
  'a[href*="stumbleupon.com/submit" i]':
    '<a href="http://www.stumbleupon.com/submit?url=https%3A//example.com/about&amp;title=About" title="Thumb this up at StumbleUpon" class="service-links-stumbleupon" rel="nofollow" target="_blank"><img src="https://example.com/sites/all/modules/service_links/images/stumbleit.png" alt="StumbleUpon logo"> StumbleUpon</a>',
  'a[href*="technorati.com/faves" i]':
    '<a href="http://technorati.com/faves?add=http://example.com/hello-world/" rel="nofollow" class="external" title="Share this on Technorati">Share this on Technorati</a>',
  'a[href*="getpocket.com/save" i]':
    '<a href="https://getpocket.com/save?url=https%3A%2F%2Fexample.com%2Fplace%2Fgowanda-170" class="popup"><span class="rrssb-icon"></span><span class="rrssb-text">pocket</span></a>',
  'a[href*="share.flipboard.com/bookmarklet" i]':
    '<a aria-label="Flipboard" class="social-share--container js-social-share" href="https://share.flipboard.com/bookmarklet/popout?v=2&amp;title=Playful%20learning&amp;url=https%3A%2F%2Fexample.com%2Fagenda%2F2022%2F05%2Fplayful-learning%2F">Flipboard</a>',
  'a[href*="evernote.com/clip.action" i]':
    '<a class="cc-sharebuttons-evernote" href="http://www.evernote.com/clip.action?url=https://example.com/granada/&amp;title=Granatapfelkerne%20aus%20Granada" title="Evernote" target="_blank"></a>',
}

// One real-world specimen per arm of an `:is()` selector the table above pins through another
// arm, with the publisher's own host swapped for a reserved one.
const armSpecimens: Array<string> = [
  '<a class="btn01 btn01_btncolor03" href="http://www.facebook.com/share.php?u=http://example.com/2019/04/19/nishiyama-yujiro/"> Facebookでシェア</a>',
  '<a class="call_to_facebook" href="https://www.facebook.com/dialog/share?app_id=123456789012345&amp;display=popup&amp;mode=friend&amp;href=https://example.com/?p=268162" target="_blank"><img src="https://example.com/img/facebook-white.png" width="24" alt="Facebook">Share on Facebook</a>',
  '<a class="share-link" href="https://twitter.com/intent/post?text=View Tag&amp;url=https://example.com/taxonomy/term/957/feed" rel="nofollow noopener" target="_blank"><span class="share-btn-text">X</span></a>',
  '<a href="http://twitter.com/share" class="twitter-share-button">Tweet</a>',
  '<a class="twitter" href="https://x.com/intent/tweet?url=https%3A%2F%2Fexample.com%2Fen%2Frss.xml" target="_blank" rel="nofollow noopener">X</a>',
  '<a rel="noopener noreferrer nofollow" href="https://x.com/share?url=https://example.com/2021/08/27/coffee-brewing-ritual/" target="_blank" class="wd-social-icon social-twitter" aria-label="X social link"><span class="wd-icon"></span></a>',
  '<a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2F1745226%2F9056478">LinkedIn</a>',
  '<a class="nc_tweet swp_share_link" rel="nofollow noreferrer noopener" target="_blank" href="https://www.linkedin.com/cws/share?url=https%3A%2F%2Fexample.com%2Fpmad-better-doula%2F"><span class="swp_share">Share</span></a>',
  '<a class="btn01 btn01_btncolor04" href="http://line.me/R/msg/text/?http://example.com/2019/04/11/sample_page01/"> LINEで送る</a>',
  '<a rel="noopener noreferrer nofollow" href="https://telegram.me/share/url?url=https://example.com/2021/08/27/coffee-brewing-ritual/" target="_blank" class="wd-social-icon social-tg" aria-label="Telegram social link"><span class="wd-icon"></span></a>',
  '<a class="lightsocial_a" href="http://delicious.com/save?title=Open+Call+for+Papers&amp;url=https%3A%2F%2Fexample.com%2F2026%2F04%2F27%2Fopen-call-for-papers%2F"><img class="lightsocial_img" src="https://example.com/plugins/light-social/delicious.png" alt="Bookmark this on Delicious"></a>',
]

describeForEachParser('stripShareIntentAnchors', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [stripShareIntentAnchors(baseContext)])
  }

  describe('with default selectors', () => {
    it('should have a specimen for every default selector', () => {
      const specimenSelectors = Object.keys(specimens).sort((left, right) => {
        return left.localeCompare(right)
      })
      const defaultSelectors = [...defaultShareIntentSelectors].sort((left, right) => {
        return left.localeCompare(right)
      })

      expect(specimenSelectors).toEqual(defaultSelectors)
    })

    it.each(Object.entries(specimens))('should strip %s', async (_selector, value) => {
      expect(await transform(`<p>Before ${value} after</p>`)).toEqualHtml('<p>Before  after</p>')
    })

    it.each(armSpecimens)('should strip %s', async (value) => {
      expect(await transform(`<p>Before ${value} after</p>`)).toEqualHtml('<p>Before  after</p>')
    })
  })

  describe('the protocol-relative spelling', () => {
    it('should strip a share link written without a scheme', async () => {
      const value = html`
        <a
          href="//twitter.com/intent/tweet?text=Reading&amp;url=https%3A%2F%2Fexample.com%2Fpost"
          title="Tweet"
        >Tweet</a>
      `

      expect(await transform(value)).toEqualHtml('')
    })
  })

  describe('a quote a click-to-tweet link wraps', () => {
    it('should keep the quote when the link posts it', async () => {
      const value = html`
        <p>
          <span class="tweet_quote"><a
            href="https://twitter.com/intent/tweet?url=http%3A%2F%2Fexample.com%2Fsites%2Ffinancial-advisors%2F&amp;text=Are%20you%20ready%20to%20become%20a%20%22social%20advisor%22%20to%20build%20your%20business%3F%20%3E%40example"
            target="_blank"
          >Are you ready to step off the sidelines and become a "social advisor" to build your business?<span></span></a></span>&nbsp;Here are 15 tips.
        </p>
      `
      const expected = html`
        <p>
          <span class="tweet_quote">Are you ready to step off the sidelines and become a "social advisor" to build your business?<span></span></span>&nbsp;Here are 15 tips.
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a label that repeats fewer than four words of the message', async () => {
      const value = html`
        <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=https%3a%2f%2fexample.com%2flocal-news%2fshare-on-linkedin-tips">Share on LinkedIn</a>
      `

      expect(await transform(value)).toEqualHtml('')
    })

    it('should remove a label of four words the message does not repeat', async () => {
      const value = html`
        <a href="mailto:?subject=%227%20Warning%20Signs%20Your%20Marriage%20is%20in%20Trouble%22&amp;body=Link: http://example.com/blog/7-warning-signs/ (sent via shareaholic)%0D%0A%0D%0A----%0D%0A I have seen many marriages turn around">Email this to a friend?</a>
      `

      expect(await transform(value)).toEqualHtml('')
    })
  })

  describe('a sentence the publisher wrote into a share link', () => {
    it('should keep the sentence without its link', async () => {
      const value = html`
        <p>
          <span style="font-size: 12pt;">Sie mögen diesen Artikel oder erkennen sich sogar darin wieder?! </span><span style="font-size: 12pt;"><span style="text-decoration: underline;"><em><a
            href="https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.example.com%2Fitem%2F47-10-gruende-warum-introvertierte-menschen-ueber-eine-grosse-anziehungskraft-verfuegen&amp;ret=login"
            rel="alternate"
          >Dann freuen wir uns über jeden Leser, der diesen Beitrag mit seinen Facebook-Freunden teilt, um mehr Verständnis zu verbreiten! (hier klicken).</a><br><br></em></span></span>
        </p>
      `
      const expected = html`
        <p>
          <span style="font-size: 12pt;">Sie mögen diesen Artikel oder erkennen sich sogar darin wieder?! </span><span style="font-size: 12pt;"><span style="text-decoration: underline;"><em>Dann freuen wir uns über jeden Leser, der diesen Beitrag mit seinen Facebook-Freunden teilt, um mehr Verständnis zu verbreiten! (hier klicken).<br><br></em></span></span>
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a sentence of fourteen words', async () => {
      const value = html`
        <p><a href="https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.example.com%2Fitem%2F47-zehn-gruende&amp;ret=login">Dann freuen wir uns über jeden Leser, der diesen Beitrag mit seinen Freunden teilt.</a></p>
      `
      const expected =
        '<p>Dann freuen wir uns über jeden Leser, der diesen Beitrag mit seinen Freunden teilt.</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove a label of ten words', async () => {
      const value = html`
        <p><a href="http://www.addtoany.com/share_save?linkurl=http%3A%2F%2Fexample.com&amp;linkname=Example">*Invite others to Example.com through facebook, Twitter and more!*</a></p>
      `

      expect(await transform(value)).toEqualHtml('<p></p>')
    })

    it('should remove an error page a broken share link swallowed', async () => {
      const value = html`
        <a href="http://twitter.com/home?status=Enjoy+Making+Bar+Graphs+-+<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
        <html><head>
        <title>404 Not Found</title>
        </head><body>
        <h1>Not Found</h1>
        <p>The requested URL /api.php was not found on this server.</p>
        </body></html>&amp;source=shareaholic" rel="nofollow" class="external" title="Tweet This!">Tweet This!</a>
      `

      expect(await transform(value)).toEqualHtml('')
    })
  })

  describe('a share link written as its own text', () => {
    it('should keep a url a post about share links shows', async () => {
      const value = html`
        <p>
          <a href="http://reddit.com/submit?url=http://example.com/Post/Adding-share-buttons">http://reddit.com/submit?url=&lt;%=contentUrl%&gt;&amp;title=&lt;%=contentTitle%&gt;</a>
        </p>
      `
      const expected = html`
        <p>http://reddit.com/submit?url=&lt;%=contentUrl%&gt;&amp;title=&lt;%=contentTitle%&gt;</p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('links that are not share forms', () => {
    it('should keep a WhatsApp chat with a number of the publisher', async () => {
      const value = html`
        <a href="https://api.whatsapp.com/send?phone=15555550123">Vamos conversar no whatsapp</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a WhatsApp chat with a number of the publisher and a prefilled message', async () => {
      const value = html`
        <a href="https://web.whatsapp.com/send?phone=15555550123&amp;text=Hello%20Pet%20First!">Whatsapp Enquiry</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a wa.me link to a number of the publisher', async () => {
      const value = html`
        <a
          class="btn"
          href="https://wa.me/15555550123"
        >📲 Recevoir le Pronostic VIP</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a wa.me link to a number of the publisher with a prefilled message', async () => {
      const value = html`
        <a
          class="btn-ghost"
          href="https://wa.me/15555550123?text=Halo,%20saya%20ingin%20konsultasi%20layanan%20air"
        >Konsultasi Gratis</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a mailto naming an address of the publisher', async () => {
      const value = html`
        <a href="mailto:info@example.com?subject=Solicitud%20de%20evaluaci%C3%B3n">✉️ Enviar email</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Gmail form addressed to the publisher', async () => {
      const value = html`
        <a href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;tf=1&amp;to=info@example.com">info@example.com</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Pinterest pin page', async () => {
      const value = html`
        <a
          href="https://www.pinterest.com/pin/123456789012345678/"
          rel="nofollow"
          target="_blank"
        >Edible pumpkin candy bowls</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Twitter profile whose name starts with share', async () => {
      const value = html`
        <a href="https://twitter.com/shareaholic/">@Shareaholic</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Telegram channel whose name starts with share', async () => {
      const value = html`
        <a href="https://t.me/share_example_news">Our channel</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a Facebook link to a shared post', async () => {
      const value = html`
        <a href="https://www.facebook.com/share/p/1AbCdEfGhI/">https://www.facebook.com/share/p/1AbCdEfGhI/</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a link whose path carries the Google Bookmarks route', async () => {
      const value = html`
        <a
          href="//example.com/taxonomy/term/7/%26quot%3Bhttps%3A/www.google.com/bookmarks/mark"
          class="ssc-next active"
        >Next</a>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should compare a long text with a long message within a second', async () => {
      const message = 'alpha beta gamma delta '.repeat(10000)
      const words = 'epsilon zeta eta theta '.repeat(10000)
      const value = `<a href="https://twitter.com/intent/tweet?text=${message}">${words}</a>`
      const start = performance.now()
      await transform(value)

      expect(performance.now() - start).toBeLessThan(1000)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <p>
        <a href="https://www.facebook.com/sharer.php?u=https%3A%2F%2Fexample.com%2Fpost">Facebook</a>
        <span class="tweet_quote"><a href="https://twitter.com/intent/tweet?text=Every%20quote%20the%20link%20posts%20stays">Every quote the link posts stays</a></span>
      </p>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

describeForEachParser('stripShareIntentAnchors through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should remove a bare cluster of share links with the paragraph it leaves empty', async () => {
    const value = html`
      <p>The last paragraph of the post.</p>
      <p>
        <a href="https://www.facebook.com/sharer.php?u=https%3A%2F%2Fexample.com%2Fpost">Facebook</a>
        <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com%2Fpost">X</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=https%3A%2F%2Fexample.com%2Fpost">LinkedIn</a>
        <a href="https://bsky.app/intent/compose?text=https%3A%2F%2Fexample.com%2Fpost">Bluesky</a>
      </p>
    `
    const expected = '<p>The last paragraph of the post.</p>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep a Social Warfare quote without its link and its label', async () => {
    const value = html`
      <div class="wp-block-social-warfare-click-to-tweet social-warfare-admin-block">
        <div class="sw-tweet-clear"></div>
        <a
          class="swp_CTT style1"
          href="https://twitter.com/share?text=47+percent+of+consumers+expect+a+website+to+load+in+no+more+than+two+seconds&amp;via=example&amp;url=https://example.com/create-a-website-that-converts/"
          rel="nofollow noreferrer noopener"
          target="_blank"
        ><span class="sw-click-to-tweet"><span class="sw-ctt-text">47 percent of consumers expect a website to load in no more than two seconds</span><span class="sw-ctt-btn">Click To Tweet<i class="sw swp_twitter_icon"></i></span></span></a>
      </div>
    `
    const expected = html`
      <p>
        <span class="sw-click-to-tweet"><span class="sw-ctt-text">47 percent of consumers expect a website to load in no more than two seconds</span></span>
      </p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
