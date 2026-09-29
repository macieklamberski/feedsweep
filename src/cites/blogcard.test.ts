import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { CiteResolverResult } from '../types.js'
import { blogCardCiteResolver } from './blogcard.js'

describeForEachParser('blogCardCiteResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, blogCardCiteResolver)

  describe('happy paths', () => {
    it('should extract all fields from the excerpt dialect', async () => {
      const value = html`
        <div class="blog-card internal-blog-card blog-card-thumbnail-left cf">
          <div class="blog-card-thumbnail">
            <a href="https://example.com/post" class="blog-card-thumbnail-link">
              <img src="https://example.com/thumb.jpg" class="blog-card-thumb-image">
            </a>
          </div>
          <div class="blog-card-content">
            <div class="blog-card-title">
              <a href="https://example.com/post" class="blog-card-title-link">Page title</a>
            </div>
            <div class="blog-card-excerpt">Preview text</div>
            <div class="blog-card-date">2018.10.14</div>
          </div>
          <div class="blog-card-footer">
            <div class="blog-card-site">
              <span class="blog-card-favicon">
                <img src="//www.google.com/s2/favicons?domain=example.com" class="blog-card-favicon-img" alt="" width="16" height="16">
              </span>
              example.com
            </div>
          </div>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
        description: 'Preview text',
        publisher: 'example.com',
        date: '2018.10.14',
        icon: '//www.google.com/s2/favicons?domain=example.com',
        thumbnail: 'https://example.com/thumb.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should extract all fields from the text dialect', async () => {
      const value = html`
        <div class="blog-card">
          <div class="blog-card-body">
            <h5 class="blog-card-title">
              <a href="https://example.com/post">Page title</a>
            </h5>
            <p class="blog-card-text">Preview text</p>
            <div class="blog-card-site-title">
              <a href="https://example.com">Example Blog</a>
            </div>
          </div>
          <div class="blog-card-image-outer">
            <a href="https://example.com/post" class="blog-card-image-frame">
              <img src="https://example.com/thumb.jpg" class="blog-card-image-src">
            </a>
          </div>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
        description: 'Preview text',
        publisher: 'Example Blog',
        thumbnail: 'https://example.com/thumb.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should read the name the carrier states when the card has no title element', async () => {
      const value = html`
        <div class="blog-card" title="Page title">
          <div class="blog-card-body">
            <p class="blog-card-text">Preview text</p>
            <div class="blog-card-site-title"><a href="https://example.com">Example Blog</a></div>
          </div>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com',
        title: 'Page title',
        description: 'Preview text',
        publisher: 'Example Blog',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Most cards carry a Hatena bookmark button whose href wraps the target url. Reading the
    // first anchor in the card instead of the title's own would point the cite at b.hatena.ne.jp.
    it('should not take the url from the Hatena bookmark button', async () => {
      const value = html`
        <div class="blog-card">
          <div class="blog-card-content">
            <div class="blog-card-title">
              <a href="https://example.com/post">Page title</a>
            </div>
          </div>
          <div class="blog-card-hatebu">
            <a href="//b.hatena.ne.jp/entry/https://example.com/post" rel="nofollow">
              <img src="//b.hatena.ne.jp/entry/image/https://example.com/post">
            </a>
          </div>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the url from the card itself when the card is the anchor', async () => {
      const value = html`
        <a href="https://example.com/post" class="blog-card">
          <div class="blog-card-box">
            <div class="blog-card-title">Page title</div>
            <div class="blog-card-excerpt">Preview text</div>
          </div>
        </a>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
        description: 'Preview text',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to an anchor wrapping the card body when the title has none', async () => {
      const value = html`
        <div class="blog-card">
          <a href="https://example.com/post">
            <div class="blog-card-thumbnail">
              <img src="https://example.com/thumb.jpg" class="blog-card-thumb-image">
            </div>
            <div class="blog-card-title">Page title</div>
          </a>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
        thumbnail: 'https://example.com/thumb.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the thumbnail from the wrapper-classed dialect with a bare img', async () => {
      const value = html`
        <div class="blog-card">
          <a href="https://example.com/post">
            <div class="blog-card-thumbnail">
              <img src="https://example.com/thumb.jpg" alt="Page title" width="150" height="150">
            </div>
            <div class="blog-card-content">
              <div class="blog-card-title">Page title</div>
              <div class="blog-card-excerpt">Preview text</div>
            </div>
          </a>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
        description: 'Preview text',
        thumbnail: 'https://example.com/thumb.jpg',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave optional fields undefined when only the title link is present', async () => {
      const value = html`
        <div class="blog-card">
          <div class="blog-card-title">
            <a href="https://example.com/post">Page title</a>
          </div>
        </div>
      `
      const expected: CiteResolverResult = {
        provider: 'blogcard',
        url: 'https://example.com/post',
        title: 'Page title',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined when the title link has no href', async () => {
      const value = html`
        <div class="blog-card">
          <div class="blog-card-title">
            <a>Page title</a>
          </div>
          <div class="blog-card-excerpt">Preview text</div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined when there is no title', async () => {
      const value = html`
        <div class="blog-card">
          <div class="blog-card-excerpt">Preview text</div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should not take the url from the Hatena bookmark button when the title has no link', async () => {
      const value = html`
        <div class="blog-card internal-blog-card blog-card-thumbnail-left cf">
          <div class="blog-card-content">
            <div class="blog-card-title">Page title</div>
            <div class="blog-card-excerpt">Preview text</div>
          </div>
          <div class="blog-card-footer">
            <div class="blog-card-site">example.com</div>
            <div class="blog-card-hatebu">
              <a href="//b.hatena.ne.jp/entry/https://example.com/post" rel="nofollow">
                <img src="//b.hatena.ne.jp/entry/image/https://example.com/post" alt="">
              </a>
            </div>
          </div>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('shapes that are not a blog card', () => {
    // A Shopify blog listing that reuses the class for its own post tiles.
    it('should ignore a listing tile carrying the class with no card title', async () => {
      const value = html`
        <article class="blog-card">
          <a href="/blogs/news/faux-vs-real-sheepskin-5-surprising-truths-1">
            <h2>Faux vs Real Sheepskin: 5 Surprising Truths (2026 Guide) <span class="new-badge">FEATURED</span></h2>
          </a>
          <div class="blog-meta">
            <span>March 18, 2026</span>
          </div>
          <p class="blog-description">Thinking real sheepskin is better? Think again.</p>
        </article>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
