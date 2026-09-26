import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html } from '../tests.js'

describeForEachParser('WordPress', (parseHtml) => {
  // convertWidgets claims the embed carriers inside the oEmbed wrapper figures, with
  // getWrapperRatio reading their wp-embed-aspect-* classes when the carrier
  // states no size. fixLazyIframes and fixLazyImages recover the consent-gate and
  // lazy-loader attribute stashes (defaultLazyIframeAttributes, defaultLazySrcAttributes).
  // The plugin facades are rebuilt by rebuildLyteEmbeds, rebuildRocketYoutubePreviews,
  // rebuildLazyLoadForVideos, rebuildEmbedPlusEmbeds and rebuildElementorVideoEmbeds.
  // An oEmbed block whose provider call failed ships the bare url alone. LinkifyUrls makes it a
  // link and unwrapWrappers drops the figure shell around it.
  // wp-embedded-content post embeds are in open PR #361; add that clause when it merges.

  it('should reduce a failed oEmbed block to its linkified url', async () => {
    const value = html`
      <p>Look:</p>
      <figure class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter">
        <div class="wp-block-embed__wrapper">
          https://twitter.com/someone/status/1234567890123456789
        </div>
      </figure>
    `
    const expected = html`
      <p>Look:</p>
      <p> <a href="https://twitter.com/someone/status/1234567890123456789">https://twitter.com/someone/status/1234567890123456789</a> </p>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should carry the oEmbed figure ratio onto a placeholder for a sizeless iframe', async () => {
    const value = html`
      <figure class="wp-block-embed is-type-video wp-embed-aspect-16-9 wp-has-aspect-ratio">
        <div class="wp-block-embed__wrapper">
          <iframe src="https://www.youtube.com/embed/0OqYNLrUoes"></iframe>
        </div>
      </figure>
    `
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-thumbnail="https://i.ytimg.com/vi/0OqYNLrUoes/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=0OqYNLrUoes"
        data-embed-id="0OqYNLrUoes"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/0OqYNLrUoes"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  describe('Avada privacy embed without a dedicated transform', () => {
    // Avada gates a video behind a consent notice: a hidden <iframe> parks the real URL in
    // data-privacy-src, and a sibling .fusion-privacy-placeholder shows "please accept". No
    // single transform owns this. fixLazyIframes recovers the iframe (then the youtube
    // resolver placeholders it) while stripNonContentElements removes the notice.
    it('should recover the gated video and strip the "please accept" notice', async () => {
      const value = html`
        <p>
          <iframe class="fusion-hidden" data-privacy-type="youtube" src="" title="YouTube video player" data-privacy-src="https://www.youtube.com/embed/0OqYNLrUoes?si=ZEdmlrLKAggBE_AS" width="560" height="315"></iframe>
        </p>
        <div class="fusion-privacy-placeholder" style="width:560px; height:315px;" data-privacy-type="youtube">
          <div class="fusion-privacy-placeholder-content">
            <div class="fusion-privacy-label">For privacy reasons YouTube needs your permission to be loaded.</div>
            <a href="" class="fusion-privacy-consent">I Accept</a>
          </div>
        </div>
      `
      const expected = html`
        <div
          data-embed-thumbnail="https://i.ytimg.com/vi/0OqYNLrUoes/hqdefault.jpg"
          data-embed-ratio="16/9"
          data-embed-url="https://www.youtube.com/watch?v=0OqYNLrUoes"
          data-embed-id="0OqYNLrUoes"
          data-embed-provider="youtube"
          data-embed-src="https://www.youtube.com/embed/0OqYNLrUoes"
        ></div>
      `

      expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
    })
  })

  // Big Think's theme writes the image description in site-classed divs grouped with the
  // credit figcaption in one wrapper. mergeWrappedCaptionText folds the description into
  // the figcaption before unwrapWrappers dissolves the grouping.
  it('should fold a theme-classed caption description into the credit figcaption', async () => {
    const value = html`
      <figure class="wp-block-image size-large">
        <img src="https://example.com/ceres.jpg" alt="Ceres" /></p>
        <div class="img-caption">
          <div class="img-caption__desc">
            <div class="img-caption__desc-inner">The dwarf planet Ceres is the largest world in the asteroid belt.</div>
          </div>
          <figcaption><a href="https://example.com/source" target="_blank">Credit</a>: NASA/JPL<br /></figcaption>
        </div>
      </figure>
    `
    const expected = html`
      <figure class="wp-block-image size-large">
        <img src="https://example.com/ceres.jpg" alt="Ceres">
        <figcaption>
          <p>The dwarf planet Ceres is the largest world in the asteroid belt.</p>
          <p><a href="https://example.com/source" target="_blank">Credit</a>: NASA/JPL</p>
        </figcaption>
      </figure>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // A "?" alt is WordPress failing to encode the emoji it meant, and the file is named by the
  // codepoint.
  it('should replace a core emoji image whose alt is "?" by its filename', async () => {
    const value = html`
      <p>Thanks
        <img
          draggable="false"
          role="img"
          class="emoji"
          alt="?"
          src="https://s.w.org/images/core/emoji/2.4/72x72/1f642.png"
        >
      </p>
    `
    const expected = '<p>Thanks 🙂</p>'

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // WordPress.com serves its smileys from s1 and s2 too, and one outside the Twemoji folder has
  // no glyph, so it keeps its picture.
  it('should mark a WordPress.com smiley served from s1', async () => {
    const value = html`
      <p>Ha
        <img
          src="https://s1.wp.com/wp-content/mu-plugins/wpcom-smileys/rolling-on-the-floor-laughing.png"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>Ha
        <img
          data-emoji=""
          src="https://s1.wp.com/wp-content/mu-plugins/wpcom-smileys/rolling-on-the-floor-laughing.png"
          alt=""
        >
      </p>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // Core binds :evil: to icon_evil.gif, an angry devil, and the alt is read before the filename.
  it('should replace an :evil: smiley with the angry devil its file draws', async () => {
    const value = html`
      <p>Grr
        <img
          src="https://example.com/wp-includes/images/smilies/icon_evil.gif"
          alt=":evil:"
          class="wp-smiley"
          style="height: 1em; max-height: 1em;"
        >
      </p>
    `
    const expected = '<p>Grr 👿</p>'

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should replace a WP Emoji One image with its character', async () => {
    const value = html`
      <p>Party
        <img
          decoding="async"
          style="margin-left: 3px; margin-right: 3px; vertical-align: middle;"
          src="https://example.com/wp-content/plugins/wp-emoji-one/icons/1F389.png"
          width="16"
          height="16"
        >
      </p>
    `
    const expected = '<p>Party 🎉</p>'

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should mark a pictogram from the TypePad Emoji for TinyMCE plugin', async () => {
    const value = html`
      <p>Sunny
        <img
          src="https://example.com/wp-content/plugins/typepad-emoji-for-tinymce/icons/01/sun.gif"
          width="16"
          height="16"
        >
      </p>
    `
    const expected = html`
      <p>Sunny
        <img
          data-emoji=""
          src="https://example.com/wp-content/plugins/typepad-emoji-for-tinymce/icons/01/sun.gif"
          width="16"
          height="16"
        >
      </p>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })
})
