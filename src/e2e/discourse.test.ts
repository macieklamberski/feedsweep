import { expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html } from '../tests.js'

describeForEachParser('Discourse', (parseHtml) => {
  // discourseCiteResolver turns generic onebox cards into cites, passing through the
  // engines in omittedOneboxClasses and the social posts recognized via socialPostHosts
  // and the Mastodon status signals. discourseMediaResolver rebuilds uploaded videos from
  // their placeholder divs, and the engines that emit bare iframes are left to the
  // host-keyed embed resolvers.

  it('should convert a generic onebox into a cite placeholder', async () => {
    const value = html`
      <aside
        class="onebox allowlistedgeneric"
        data-onebox-src="https://example.com/page"
      >
        <header class="source">
          <img
            src="https://forum.example.org/uploads/default/original/2X/1/icon.png"
            class="site-icon"
            alt=""
            width="32"
            height="32"
          >
          <a href="https://example.com/page">example.com</a>
        </header>
        <article class="onebox-body">
          <div class="aspect-image" style="--aspect-ratio:690/362;">
            <img
              src="https://forum.example.org/uploads/default/optimized/2X/d/thumb.jpeg"
              class="thumbnail"
              width="690"
              height="362"
            >
          </div>
          <h3>
            <a href="https://example.com/page">Page title</a>
          </h3>
          <p>Preview text</p>
        </article>
      </aside>
    `
    const expected = html`
      <div
        data-cite-provider="discourse"
        data-cite-url="https://example.com/page"
        data-cite-title="Page title"
        data-cite-description="Preview text"
        data-cite-publisher="example.com"
        data-cite-icon="https://forum.example.org/uploads/default/original/2X/1/icon.png"
        data-cite-thumbnail="https://forum.example.org/uploads/default/optimized/2X/d/thumb.jpeg"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // A social post is not a link preview, so the engines in omittedOneboxClasses keep their
  // markup. The wrappers still go: the pipeline's own passes unwrap the header and the body
  // and paragraphize what is left, which is what a reader ends up with.
  it('should leave an omitted engine as markup', async () => {
    const value = html`
      <aside
        class="onebox twitterstatus"
        data-onebox-src="https://twitter.com/handle/status/1"
      >
        <header class="source">
          <a href="https://twitter.com/handle/status/1">twitter.com</a>
        </header>
        <article class="onebox-body">
          <h4>
            <a href="https://twitter.com/handle/status/1">Display name (@handle) on X</a>
          </h4>
          <div class="tweet">
            <span class="tweet-description">Tweet text</span>
          </div>
        </article>
      </aside>
    `
    const expected = html`
      <aside
        class="onebox twitterstatus"
        data-onebox-src="https://twitter.com/handle/status/1"
      >
        <p>
          <a href="https://twitter.com/handle/status/1">twitter.com</a>
        </p>
        <h4>
          <a href="https://twitter.com/handle/status/1">Display name (@handle) on X</a>
        </h4>
        <p>
          <span class="tweet-description">Tweet text</span>
        </p>
      </aside>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should keep the code excerpt of a file onebox', async () => {
    const value = html`
      <aside
        class="onebox githubblob"
        data-onebox-src="https://github.com/owner/repo/blob/master/check_config.py"
      >
        <header class="source">
          <a href="https://github.com/owner/repo/blob/master/check_config.py">github.com</a>
        </header>
        <article class="onebox-body">
          <h4>
            <a href="https://github.com/owner/repo/blob/master/check_config.py">owner/repo/blob/master/check_config.py</a>
          </h4>
          <pre><code class="lang-py">#!/usr/bin/python3</code></pre>
          This file has been truncated.
          <a href="https://github.com/owner/repo/blob/master/check_config.py">show original</a>
        </article>
        <div class="onebox-metadata"></div>
        <div style="clear: both"></div>
      </aside>
    `
    const expected = html`
      <aside
        class="onebox githubblob"
        data-onebox-src="https://github.com/owner/repo/blob/master/check_config.py"
      >
        <p>
          <a href="https://github.com/owner/repo/blob/master/check_config.py">github.com</a>
        </p>
        <h4>
          <a href="https://github.com/owner/repo/blob/master/check_config.py">owner/repo/blob/master/check_config.py</a>
        </h4>
        <pre
          data-pre-language="py"
          data-pre-label="Python"
        ><code class="lang-py hljs"><span class="hljs-comment">#!/usr/bin/python3</span></code></pre>
        <p>
          This file has been truncated.
          <a href="https://github.com/owner/repo/blob/master/check_config.py">show original</a>
        </p>
      </aside>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  // Bluesky has no onebox engine of its own, so its posts arrive through the generic one and
  // are recognized by the cited host instead of a class.
  it('should leave a social post recognized by its host as markup', async () => {
    const value = html`
      <aside
        class="onebox allowlistedgeneric"
        data-onebox-src="https://bsky.app/profile/someone.example/post/abc"
      >
        <header class="source">
          <a href="https://bsky.app/profile/someone.example/post/abc">bsky.app</a>
        </header>
        <article class="onebox-body">
          <h3>
            <a href="https://bsky.app/profile/someone.example/post/abc">Display Name</a>
          </h3>
          <p>Post text</p>
        </article>
      </aside>
    `
    const expected = html`
      <aside
        class="onebox allowlistedgeneric"
        data-onebox-src="https://bsky.app/profile/someone.example/post/abc"
      >
        <p>
          <a href="https://bsky.app/profile/someone.example/post/abc">bsky.app</a>
        </p>
        <h3>
          <a href="https://bsky.app/profile/someone.example/post/abc">Display Name</a>
        </h3>
        <p>Post text</p>
      </aside>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should rebuild an uploaded video from its placeholder div', async () => {
    const value = html`
      <div
        class="video-placeholder-container"
        data-video-src="https://forum.example.com/uploads/original/3X/9/3/93051db2aa7c.mp4"
        data-thumbnail-src="https://forum.example.com/uploads/original/3X/5/1/51d8c274da56.jpeg"
        data-video-base62-sha1="kYB9fkYkZTfdq3QOXOUCWHIxRcl.mp4"
      ></div>
    `
    const expected = html`
      <video
        src="https://forum.example.com/uploads/original/3X/9/3/93051db2aa7c.mp4"
        poster="https://forum.example.com/uploads/original/3X/5/1/51d8c274da56.jpeg"
        controls
      ></video>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should replace a stock emoji gemoji does not know', async () => {
    const value = html`
      <p>Signed
        <img
          src="https://forum.example.com/images/emoji/twitter/fingerprint.png?v=15"
          title=":fingerprint:"
          class="emoji"
          alt=":fingerprint:"
          loading="lazy"
          width="20"
          height="20"
        >
      </p>
    `
    const expected = '<p>Signed 🫆</p>'

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })
})
