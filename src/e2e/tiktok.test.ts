import { expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html } from '../tests.js'

describeForEachParser('TikTok', (parseHtml) => {
  // tiktokBlockquoteEmbedResolver owns the oEmbed blockquote: the clip it names when a video id
  // survives anywhere in the markup, the account it names when none does.
  // tiktokIframeEmbedResolver owns the pasted player and the watch page a wrapper frames instead.
  // The embed.js loader that ships beside the blockquote is dropped as non-content. Every other
  // tiktok.com page framed as itself, a profile or a tag or a search, is left to the generic
  // iframe fallback, and so is a clip a third party hosts, such as the iframely player Substack
  // writes around one.

  // What WordPress delivers: the figure, its wrapper div, the blockquote and the loader script.
  // The section's author and sound anchors are bare inline, and wrapBareInlineInParagraphs gives
  // each of them a paragraph of its own before the widget pass runs, so the caption the
  // placeholder carries is the one picked by content and not the first paragraph in the section.
  // The wrapper div dissolves and the figure goes with it, since the placeholder is all it holds.
  it('should convert a clip inside the block editor wrapper and drop the loader script', async () => {
    const value = html`
      <figure class="wp-block-embed is-type-video is-provider-tiktok wp-block-embed-tiktok">
        <div class="wp-block-embed__wrapper">
          <blockquote
            class="tiktok-embed"
            cite="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
            data-video-id="7001234567890123456"
            data-embed-from="oembed"
            style="max-width: 605px; min-width: 325px;"
          >
            <section>
              <a target="_blank" title="@cookingwithlynja" href="https://www.tiktok.com/@cookingwithlynja?refer=embed">@cookingwithlynja</a>
              <p>Midnight pasta <a title="#pasta" target="_blank" href="https://www.tiktok.com/tag/pasta?refer=embed">#pasta</a></p>
              <a target="_blank" title="original sound" href="https://www.tiktok.com/music/original-sound-7001234567890123456?refer=embed">&#9836; original sound - Lynja</a>
            </section>
          </blockquote>
          <script
            async
            src="https://www.tiktok.com/embed.js"
          ></script>
        </div>
      </figure>
    `
    const expected = html`
      <div
        data-embed-provider="tiktok"
        data-embed-id="@cookingwithlynja/video/7001234567890123456"
        data-embed-src="https://www.tiktok.com/embed/v2/7001234567890123456"
        data-embed-url="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
        data-embed-description="Midnight pasta #pasta"
        data-embed-author="@cookingwithlynja"
        data-embed-height="738"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // A blockquote a CMS stripped of its data attributes names only the account, and its caption is
  // a bare text node beside the profile anchor. The blockquote has no block child, so the
  // paragraph pass leaves that run where it is and the caption still reaches the placeholder. The
  // creator widget is the same account placeholder without the caption: it declares the handle in
  // data-unique-id, so nothing it needs depends on the passes that run first.
  it('should keep the caption a stripped account blockquote leaves as bare text', async () => {
    const value = html`
      <blockquote class="tiktok-embed" style="max-width: 605px;">
        <a target="_blank" href="https://www.tiktok.com/@cookingwithlynja?refer=embed">@cookingwithlynja</a> Midnight pasta
      </blockquote>
      <script
        async
        src="https://www.tiktok.com/embed.js"
      ></script>
    `
    const expected = html`
      <div
        data-embed-provider="tiktok"
        data-embed-id="@cookingwithlynja"
        data-embed-src="https://www.tiktok.com/embed/@cookingwithlynja"
        data-embed-url="https://www.tiktok.com/@cookingwithlynja"
        data-embed-description="Midnight pasta"
        data-embed-author="@cookingwithlynja"
        data-embed-height="478"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // The pasted snippet states a landscape box on a player taller than it is wide, so the
  // placeholder carries the height the player really has instead.
  it('should resolve a pasted player and drop the landscape box it declares', async () => {
    const value = html`
      <p>Watch this:</p>
      <iframe
        src="https://www.tiktok.com/player/v1/7001234567890123456?music_info=1&description=1"
        width="560"
        height="400"
        allow="fullscreen"
        title="TikTok video"
      ></iframe>
    `
    const expected = html`
      <p>Watch this:</p>
      <div
        data-embed-provider="tiktok"
        data-embed-id="7001234567890123456"
        data-embed-src="https://www.tiktok.com/embed/v2/7001234567890123456"
        data-embed-height="738"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // The watch page refuses framing, so the frame a wrapper wrote renders nothing. Its path names
  // the clip and the handle, which is enough to mint the player and to keep the page as the link.
  it('should mint the player from a framed watch page', async () => {
    const value = html`
      <iframe
        src="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
        width="325"
        height="740"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="tiktok"
        data-embed-id="@cookingwithlynja/video/7001234567890123456"
        data-embed-src="https://www.tiktok.com/embed/v2/7001234567890123456"
        data-embed-url="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
        data-embed-height="738"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // A hashtag is neither a clip nor an account, so there is nothing to mint and the quoted text
  // is all the reader gets. The loader script goes either way, which is the point of asserting
  // this shape: the script is dropped for naming embed.js, not for having been resolved.
  it('should leave a blockquote naming neither a clip nor an account as markup', async () => {
    const value = html`
      <blockquote class="tiktok-embed">
        <a href="https://www.tiktok.com/tag/pasta?refer=embed">#pasta</a> Midnight pasta
      </blockquote>
      <script
        async
        src="https://www.tiktok.com/embed.js"
      ></script>
    `
    const expected = html`
      <blockquote class="tiktok-embed">
        <a href="https://www.tiktok.com/tag/pasta?refer=embed">#pasta</a> Midnight pasta
      </blockquote>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // An account is resolved from what a blockquote names, never from a tiktok.com page framed as
  // itself, so the generic iframe fallback takes this one and the placeholder names no provider.
  it('should fall back a framed profile page to a generic placeholder', async () => {
    const value = '<iframe src="https://www.tiktok.com/@cookingwithlynja"></iframe>'
    const expected = '<div data-embed-src="https://www.tiktok.com/@cookingwithlynja"></div>'

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // A forum's s9e helper frame names the clip in its fragment, and tiktokS9eEmbedResolver reads
  // it into the same player placeholder a pasted frame gives.
  it('should convert the s9e helper frame into the player placeholder', async () => {
    const value = html`
      <iframe
        data-s9e-mediaembed="tiktok"
        src="https://s9e.github.io/iframe/2/tiktok.min.html#7000000000000000001"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-provider="tiktok"
        data-embed-id="7000000000000000001"
        data-embed-src="https://www.tiktok.com/embed/v2/7000000000000000001"
        data-embed-height="738"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // MetaSlider Pro writes every slide but the first hidden, and its TikTok slide is a poster and
  // a play button its script swaps for the player. The slide survives stripHiddenElements, and
  // tiktokWidgetEmbedResolver keeps the poster as the placeholder's thumbnail.
  it('should convert the MetaSlider slide into the player placeholder and keep its poster', async () => {
    const value = html`
      <ul class="slides">
        <li
          class="slide-25548 ms-tiktok "
          style="display: none; width: 100%;"
          data-slide-type="tiktok"
        >
          <div
            style="height: 700px; width: 100%;"
            class="tiktok"
            data-lazy-load="1"
            data-video-id="7636550859958045972"
            data-cite="https://www.tiktok.com/@pm.yamaha/video/7636550859958045972?is_from_webapp=1&#038;sender_device=pc&#038;web_id=7602492902425691655"
            data-url="//www.tiktok.com/embed/v2/7636550859958045972"
            data-width="325"
            data-height="605"
          >
            <img
              loading="lazy"
              decoding="async"
              src="https://example.com/wp-content/uploads/2026/05/tiktok_7636550859958045972-325x605.webp"
              alt=""
              class="msDefaultImage"
              height="605"
              width="325"
            />
            <span class="play_button">
              <a tabindex="0" role="button" id="toggle">
                <img
                  width="75"
                  src="https://example.com/wp-content/plugins/ml-slider-pro/modules/tiktok/assets/play-button.png"
                >
              </a>
            </span>
          </div>
        </li>
      </ul>
    `
    const expected = html`
      <ul class="slides">
        <li
          class="slide-25548 ms-tiktok"
          style=" width: 100%;"
          data-slide-type="tiktok"
        >
          <div
            data-embed-provider="tiktok"
            data-embed-id="@pm.yamaha/video/7636550859958045972"
            data-embed-src="https://www.tiktok.com/embed/v2/7636550859958045972"
            data-embed-url="https://www.tiktok.com/@pm.yamaha/video/7636550859958045972"
            data-embed-thumbnail="https://example.com/wp-content/uploads/2026/05/tiktok_7636550859958045972-325x605.webp"
            data-embed-height="738"
          ></div>
        </li>
      </ul>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })
})
