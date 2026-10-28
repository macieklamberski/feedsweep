import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripMediumSyndicationFooters } from './stripMediumSyndicationFooters.js'

describeForEachParser('stripMediumSyndicationFooters', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [stripMediumSyndicationFooters(baseContext)])
  }

  describe('happy paths', () => {
    it('should remove the footer of a publication on medium.com with the rule above it', async () => {
      const value = html`
        <p>I’m looking forward to reading Drew’s book.</p>
        <hr>
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `
      const expected = '<p>I’m looking forward to reading Drew’s book.</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should remove the footer of a publication on its own domain', async () => {
      const value = html`
        <p><em>Originally published at </em><a href="https://example.com/how-to-develop-secure-web-applications/"><em>https://example.com</em></a><em> on February 9, 2023.</em></p>
        <hr>
        <p>
          <a href="https://blog.example.com/how-to-develop-secure-web-applications-b5bc315b3b83">How to develop secure web applications</a>
          was originally published in
          <a href="https://blog.example.com">SoftwareMill Tech Blog</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `
      const expected = html`
        <p><em>Originally published at </em><a href="https://example.com/how-to-develop-secure-web-applications/"><em>https://example.com</em></a><em> on February 9, 2023.</em></p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should keep prose that mentions Medium', async () => {
      const value = html`
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where it got more readers than anything I wrote here.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a paragraph that words the credit differently', async () => {
      const value = html`
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was first published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a paragraph with prose before the sentence', async () => {
      const value = html`
        <p>
          Update:
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a paragraph with prose after the sentence', async () => {
      const value = html`
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.<em>Thanks for reading.</em></p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a paragraph that names the post without a link', async () => {
      const value = html`
        <p>
          <strong>What is modern Vim?</strong>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a paragraph that names the publication without a link', async () => {
      const value = html`
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <strong>usevim</strong>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should keep the paragraph above a footer that has no rule', async () => {
      const value = html`
        <p>I’m looking forward to reading Drew’s book.</p>
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `
      const expected = '<p>I’m looking forward to reading Drew’s book.</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <p>I’m looking forward to reading Drew’s book.</p>
        <hr>
        <p>
          <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
          was originally published in
          <a href="https://medium.com/usevim">usevim</a>
          on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('stripMediumSyndicationFooters in the pipeline', (parseHtml) => {
  const convert = (value: string, heuristics?: boolean) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04',
      heuristics,
    })
  }

  it('should remove the footer, its rule and its pixel when heuristics are enabled', async () => {
    const value = html`
      <p>I’m looking forward to reading Drew’s book.</p>
      <img
        src="https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=2591f6b1ec04"
        width="1"
        height="1"
        alt=""
      >
      <hr>
      <p>
        <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
        was originally published in
        <a href="https://medium.com/usevim">usevim</a>
        on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
    `
    const expected = '<p>I’m looking forward to reading Drew’s book.</p>'

    expect(await convert(value, true)).toEqualHtml(expected)
  })

  it('should keep the footer by default', async () => {
    const value = html`
      <p>I’m looking forward to reading Drew’s book.</p>
      <hr>
      <p>
        <a href="https://medium.com/usevim/what-is-modern-vim-2591f6b1ec04">What is modern Vim?</a>
        was originally published in
        <a href="https://medium.com/usevim">usevim</a>
        on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
    `

    expect(await convert(value)).toEqualHtml(value)
  })
})
