import { expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html } from '../tests.js'

describeForEachParser('Mastodon', (parseHtml) => {
  // Multi-carrier resolvers are in open PR #546; the suite becomes writable when it merges.

  it('should convert an embetty-mastodon component that carries no text', async () => {
    const value = html`
      <embetty-mastodon status="https://social.heise.de/@heiseonline/110372412617177781"></embetty-mastodon>
    `
    const expected = html`
      <div
        data-embed-provider="mastodon"
        data-embed-id="social.heise.de/110372412617177781"
        data-embed-src="https://social.heise.de/@heiseonline/110372412617177781/embed"
        data-embed-url="https://social.heise.de/@heiseonline/110372412617177781"
        data-embed-author="@heiseonline@social.heise.de"
        data-embed-publisher="social.heise.de"
      ></div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should keep the break after a custom emoji image', async () => {
    const value = html`
      <p>
        Nice
        <img src="https://mastodon.example/custom_emojis/images/blob.png" alt=":blob:">
        <br>
        Have fun!
      </p>
    `
    const expected = html`
      <p>
        Nice
        <img src="https://mastodon.example/custom_emojis/images/blob.png" alt=":blob:" data-emoji="">
        <br>
        Have fun!
      </p>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })
})
