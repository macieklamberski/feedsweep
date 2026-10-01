import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  tiktokBlockquoteEmbedResolver,
  tiktokIframeEmbedResolver,
  tiktokS9eEmbedResolver,
} from './tiktok.js'

// One test per shape the corpus survey found, so a shape nobody handles is visible here as a
// missing test. Each asserts the whole result, since the point is that every shape maps to the
// same fields and not merely that it is recognised.
describeForEachParser('tiktokBlockquoteEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tiktokBlockquoteEmbedResolver)

  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  describe('happy paths', () => {
    it('should resolve the canonical oembed blockquote', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
          data-video-id="7001234567890123456"
          data-embed-from="oembed"
          style="max-width: 605px; min-width: 325px;"
        >
          <section>
            <a target="_blank" title="@cookingwithlynja" href="https://www.tiktok.com/@cookingwithlynja">@cookingwithlynja</a>
            <p>Midnight pasta <a title="#pasta" target="_blank" href="https://www.tiktok.com/tag/pasta">#pasta</a>
            </p>
            <a target="_blank" title="original sound" href="https://www.tiktok.com/music/original-sound-7001234567890123456">♬ original sound - Lynja</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@cookingwithlynja/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456',
        height: 738,
        description: 'Midnight pasta #pasta',
        author: '@cookingwithlynja',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should match a sanitized copy with the class after other attributes', async () => {
      const value = html`
        <blockquote
          data-video-id="7001234567890123456"
          cite="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456"
          class="tiktok-embed"
        >
          <section>
            <a href="https://www.tiktok.com/@cookingwithlynja">@cookingwithlynja</a>
            <p>Midnight pasta</p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@cookingwithlynja/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456',
        height: 738,
        description: 'Midnight pasta',
        author: '@cookingwithlynja',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The theme, news-engine and Ghost wrappers are the same shape with another class, so the
    // selector keys on the blockquote and they cost nothing.
    it('should resolve the blockquote inside a block editor wrapper', async () => {
      const value = html`
        <figure class="wp-block-embed is-type-video is-provider-tiktok wp-block-embed-tiktok">
          <div class="wp-block-embed__wrapper">
            <blockquote
              class="tiktok-embed"
              cite="https://www.tiktok.com/@user/video/7000000000000000000"
              data-video-id="7000000000000000000"
            >
              <section>
                <a target="_blank" href="https://www.tiktok.com/@user?refer=embed">@user</a>
                <p>caption text <a href="https://www.tiktok.com/tag/tag?refer=embed">#tag</a>
                </p>
              </section>
            </blockquote>
          </div>
        </figure>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7000000000000000000',
        src: 'https://www.tiktok.com/embed/v2/7000000000000000000',
        url: 'https://www.tiktok.com/@user/video/7000000000000000000',
        height: 738,
        description: 'caption text #tag',
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should still mint the player from the id when the cite is only the bare host', async () => {
      const value = html`
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/" data-video-id="7001234567890123456">
          <section>
            <a href="https://www.tiktok.com/@cookingwithlynja">@cookingwithlynja</a>
            <p>Midnight pasta</p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@cookingwithlynja/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456',
        height: 738,
        description: 'Midnight pasta',
        author: '@cookingwithlynja',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A sanitizer that empties the attribute leaves the cite intact, so the clip is still
    // named and the id chain recovers it there.
    it('should recover the clip from the cite when the video id attribute is empty', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7001234567890123456"
          data-video-id=""
        ></blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the caption and author from the paragraph-wrapped shape', async () => {
      // The shape the default pipeline hands to convertWidgets: earlier transforms have
      // wrapped the section's bare author and sound anchors into paragraphs of their own.
      const value = html`
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456" data-video-id="7001234567890123456">
          <section>
            <p>
              <a href="https://www.tiktok.com/@cookingwithlynja">@cookingwithlynja</a>
            </p>
            <p>Midnight pasta <a href="https://www.tiktok.com/tag/pasta">#pasta</a>
            </p>
            <p>
              <a href="https://www.tiktok.com/music/original-sound-7001234567890123456">♬ original sound - Lynja</a>
            </p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@cookingwithlynja/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@cookingwithlynja/video/7001234567890123456',
        height: 738,
        description: 'Midnight pasta #pasta',
        author: '@cookingwithlynja',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The hydrated iframe's inline height is the carrier's box, which shallow handling does not
    // read. The text is gone, replaced by the frame, so there is no caption or author left to take.
    it('should state the player height over the size the hydrated player rendered at', async () => {
      const value = html`
        <blockquote
          id="v25421583374779120"
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7000000000000000000"
          data-video-id="7000000000000000000"
          style="max-width: 605px;min-width: 325px"
        >
          <p>
            <iframe
              name="__tt_embed__v25421583374779120"
              src="https://www.tiktok.com/embed/v2/7000000000000000000?lang=es-ES"
              style="width: 100%;height: 758px;max-height: 758px"
            ></iframe>
          </p>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7000000000000000000',
        src: 'https://www.tiktok.com/embed/v2/7000000000000000000',
        url: 'https://www.tiktok.com/@user/video/7000000000000000000',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The creator widget names an account and no clip at all, so a selector keyed on a video
    // id silently misses it.
    it('should resolve the creator widget to the profile viewer', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user"
          data-unique-id="user"
          data-embed-from="oembed"
          data-embed-type="creator"
          style="max-width:780px; min-width:288px;"
        >
          <section>
            <a target="_blank" href="https://www.tiktok.com/@user?refer=creator_embed">@user</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user',
        src: 'https://www.tiktok.com/embed/@user',
        url: 'https://www.tiktok.com/@user',
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Both handle readers take the account with no length checked, the declared attribute here
    // and the profile anchor below, so a name past the 24 characters the signup form allows still
    // resolves.
    it('should resolve a declared handle longer than the signup form allows', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id="averylonghandlepastwhatsignupallows"
          data-embed-type="creator"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@averylonghandlepastwhatsignupallows',
        src: 'https://www.tiktok.com/embed/@averylonghandlepastwhatsignupallows',
        url: 'https://www.tiktok.com/@averylonghandlepastwhatsignupallows',
        author: '@averylonghandlepastwhatsignupallows',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a long handle from the profile anchor alone', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@averylonghandlepastwhatsignupallows">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@averylonghandlepastwhatsignupallows',
        src: 'https://www.tiktok.com/embed/@averylonghandlepastwhatsignupallows',
        url: 'https://www.tiktok.com/@averylonghandlepastwhatsignupallows',
        author: '@averylonghandlepastwhatsignupallows',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The minimal authored shape, stripped of every data attribute and of the cite: no video id,
    // no cite, no /video/ link. The account is the only thing this markup still identifies, so it
    // resolves to the profile viewer rather than being left as text.
    it('should resolve a stripped blockquote to the account its anchor names', async () => {
      const value = html`
        <blockquote class="tiktok-embed" style="max-width: 605px;">
          <a target="_blank" href="https://www.tiktok.com/@user?refer=embed">@user</a> caption text
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user',
        src: 'https://www.tiktok.com/embed/@user',
        url: 'https://www.tiktok.com/@user',
        description: 'caption text',
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a declared handle holding digits', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id="401kgoldirarollovers"
          data-embed-type="creator"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@401kgoldirarollovers',
        src: 'https://www.tiktok.com/embed/@401kgoldirarollovers',
        url: 'https://www.tiktok.com/@401kgoldirarollovers',
        author: '@401kgoldirarollovers',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a declared handle holding an underscore', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id="ott_races"
          data-embed-type="creator"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@ott_races',
        src: 'https://www.tiktok.com/embed/@ott_races',
        url: 'https://www.tiktok.com/@ott_races',
        author: '@ott_races',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a declared handle holding dots', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id=".a.u00"
          data-embed-type="creator"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@.a.u00',
        src: 'https://www.tiktok.com/embed/@.a.u00',
        url: 'https://www.tiktok.com/@.a.u00',
        author: '@.a.u00',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // TikTok handles are case-sensitive: `@NBA` and `@nba` are two accounts.
    it('should resolve a declared handle holding capitals', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id="NBA"
          data-embed-type="creator"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@NBA',
        src: 'https://www.tiktok.com/embed/@NBA',
        url: 'https://www.tiktok.com/@NBA',
        author: '@NBA',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a profile anchor whose handle holds digits', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@401kgoldirarollovers">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@401kgoldirarollovers',
        src: 'https://www.tiktok.com/embed/@401kgoldirarollovers',
        url: 'https://www.tiktok.com/@401kgoldirarollovers',
        author: '@401kgoldirarollovers',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a profile anchor whose handle holds an underscore', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@ott_races">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@ott_races',
        src: 'https://www.tiktok.com/embed/@ott_races',
        url: 'https://www.tiktok.com/@ott_races',
        author: '@ott_races',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a profile anchor whose handle holds dots', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@.a.u00">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@.a.u00',
        src: 'https://www.tiktok.com/embed/@.a.u00',
        url: 'https://www.tiktok.com/@.a.u00',
        author: '@.a.u00',
      }

      expect(await extract(value)).toEqual(expected)
    })
    it('should resolve a profile anchor whose handle holds capitals', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@NBA">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@NBA',
        src: 'https://www.tiktok.com/embed/@NBA',
        url: 'https://www.tiktok.com/@NBA',
        author: '@NBA',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // TikTok's own snippet wrote the account's opaque secUid where the handle goes.
    it('should read a clip whose cite names the account by its secUid', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@MS4wLjABAAAAK8xx3229m3fUzgHwcSSSaRV0c9Jb2tJ1hEx29oIMwyU/video/6808836928138448129"
          data-video-id="6808836928138448129"
        >
          <section>
            <a
              title="@158669521"
              href="https://www.tiktok.com/@MS4wLjABAAAAK8xx3229m3fUzgHwcSSSaRV0c9Jb2tJ1hEx29oIMwyU"
              target="_blank"
              >@158669521</a
            >
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@MS4wLjABAAAAK8xx3229m3fUzgHwcSSSaRV0c9Jb2tJ1hEx29oIMwyU/video/6808836928138448129',
        src: 'https://www.tiktok.com/embed/v2/6808836928138448129',
        url: 'https://www.tiktok.com/@MS4wLjABAAAAK8xx3229m3fUzgHwcSSSaRV0c9Jb2tJ1hEx29oIMwyU/video/6808836928138448129',
        author: '@158669521',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The clip branch has measured the player better than the snippet a publisher pastes, so it
  // outranks whatever box the blockquote states. The account branch states no size of its own,
  // and a resolver stating none falls back to the carrier however the option is set, which is
  // what keeps the option from producing a sizeless placeholder.
  describe('a box the blockquote states over the player it holds', () => {
    it('should state the player height over a pixel box on the blockquote', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7001234567890123456"
          data-video-id="7001234567890123456"
          style="width:605px;height:400px"
        >
          <section>
            <a href="https://www.tiktok.com/@user">@user</a>
            <p>Midnight pasta</p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
        description: 'Midnight pasta',
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should let the account shape keep the box the blockquote states', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-unique-id="user"
          style="width:605px;height:400px"
        >
          <section></section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user',
        src: 'https://www.tiktok.com/embed/@user',
        url: 'https://www.tiktok.com/@user',
        width: 605,
        height: 400,
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined when the video id is empty and no clip or account is named', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/"
          data-video-id=""
        ></blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a profile anchor under another directory', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/x/@user">Profile</a>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a profile anchor followed by another segment', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@user/extra">Profile</a>
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed profile handle as written, even if the player answers an error', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/@user%2Fx">Profile</a>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user%2Fx',
        src: 'https://www.tiktok.com/embed/@user%2Fx',
        url: 'https://www.tiktok.com/@user%2Fx',
        author: '@user%2Fx',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A hashtag is not an account and there is no clip either, so nothing can be minted.
    it('should return undefined for a blockquote naming no account anywhere', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <a href="https://www.tiktok.com/tag/tag?refer=embed">#tag</a> orphaned caption
        </blockquote>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    // The attribute and the cite are both gone, so the caption's own watch anchor is the last
    // source in the id chain that still names the clip.
    it('should recover the clip from a watch anchor when the attribute and cite are stripped', async () => {
      const value = html`
        <blockquote class="tiktok-embed">
          <section>
            <a href="https://www.tiktok.com/@user/video/7001234567890123456">Watch on TikTok</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed handle from the author text as written, even if the url answers an error', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          data-video-id="7001234567890123456"
        >
          <section>
            <a href="https://www.tiktok.com/@lynja-cooks?refer=embed">@lynja-cooks</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@lynja-cooks/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@lynja-cooks/video/7001234567890123456',
        height: 738,
        author: '@lynja-cooks',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed data-video-id as written over the cite, even if the player answers an error', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7001234567890123456"
          data-video-id="../evil"
        ></blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/../evil',
        src: 'https://www.tiktok.com/embed/v2/../evil',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed data-unique-id as written, even if the player answers an error', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user"
          data-unique-id="../evil"
          data-embed-type="creator"
        >
          <section>
            <a href="https://www.tiktok.com/@user">@user</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@../evil',
        src: 'https://www.tiktok.com/embed/@../evil',
        url: 'https://www.tiktok.com/@user',
        author: '@../evil',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A foreign cite names neither the url nor a handle, and nothing else in the markup does
    // either, so the id stays the bare video id: the player is still mintable, only the
    // enrichment key is out of reach.
    it('should fall back to the bare video id for a cite on a foreign host', async () => {
      const value = html`
        <blockquote class="tiktok-embed" cite="https://example.com/@user/video/7001234567890123456" data-video-id="7001234567890123456">
          <section>
            <p>Midnight pasta</p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        height: 738,
        description: 'Midnight pasta',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should omit the description when the caption paragraph is empty', async () => {
      const value = html`
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/7001234567890123456" data-video-id="7001234567890123456">
          <section>
            <a href="https://www.tiktok.com/@user">@user</a>
            <p></p>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
        author: '@user',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should omit the author when the first section anchor is not a handle', async () => {
      const value = html`
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/7001234567890123456" data-video-id="7001234567890123456">
          <section>
            <a href="https://www.tiktok.com/music/original-sound-7001234567890123456">♬ original sound - Artist</a>
          </section>
        </blockquote>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7001234567890123456',
        src: 'https://www.tiktok.com/embed/v2/7001234567890123456',
        url: 'https://www.tiktok.com/@user/video/7001234567890123456',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // What only the whole pipeline shows: the snippet arrives as a blockquote plus a loader
  // script, and a feed may deliver the pair entity-encoded. Neither is visible to the resolver
  // on its own, so both are asserted on the finished document.
  describe('through the pipeline', () => {
    it('should leave the placeholder and no loader script behind', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7000000000000000000"
          data-video-id="7000000000000000000"
          data-embed-from="oembed"
          style="max-width:605px; min-width:325px;"
        >
          <section>
            <a target="_blank" title="@user" href="https://www.tiktok.com/@user?refer=embed">@user</a>
            <p>caption text <a href="https://www.tiktok.com/tag/tag?refer=embed">#tag</a></p>
            <a href="https://www.tiktok.com/music/x-700001?refer=embed">&#9836; original sound</a>
          </section>
        </blockquote>
        <script
          async
          src="https://www.tiktok.com/embed.js"
        ></script>
      `
      const expected = html`
        <div
          data-embed-provider="tiktok"
          data-embed-id="@user/video/7000000000000000000"
          data-embed-src="https://www.tiktok.com/embed/v2/7000000000000000000"
          data-embed-url="https://www.tiktok.com/@user/video/7000000000000000000"
          data-embed-description="caption text #tag"
          data-embed-author="@user"
          data-embed-height="738"
        ></div>
      `

      expect(await convert(value)).toEqualHtml(expected)
    })

    // The decoding happens upstream, so by the time the widget pass runs this is the canonical
    // blockquote again.
    it('should resolve a snippet the feed delivered entity-encoded', async () => {
      const value =
        '&lt;blockquote cite=&quot;https://www.tiktok.com/@user/video/7000000000000000000&quot; class=&quot;tiktok-embed&quot; data-video-id=&quot;7000000000000000000&quot;&gt; &lt;section&gt; &lt;a href=&quot;https://www.tiktok.com/@user&quot;&gt;@user&lt;/a&gt; &lt;p&gt;caption text &lt;a href=&quot;https://www.tiktok.com/tag/tag&quot;&gt;#tag&lt;/a&gt;&lt;/p&gt; &lt;/section&gt; &lt;/blockquote&gt;'
      const expected = html`
        <div
          data-embed-provider="tiktok"
          data-embed-id="@user/video/7000000000000000000"
          data-embed-src="https://www.tiktok.com/embed/v2/7000000000000000000"
          data-embed-url="https://www.tiktok.com/@user/video/7000000000000000000"
          data-embed-description="caption text #tag"
          data-embed-author="@user"
          data-embed-height="738"
        ></div>
      `

      expect(await convert(value)).toEqualHtml(expected)
    })

    // A hydrated blockquote carries the player iframe inside it, which the url-keyed resolver
    // would also claim, so the pass must leave one placeholder and not two.
    it('should leave one placeholder for a hydrated blockquote and its inner player', async () => {
      const value = html`
        <blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@user/video/7000000000000000000"
          data-video-id="7000000000000000000"
          style="max-width: 605px;"
        >
          <p>
            <iframe
              src="https://www.tiktok.com/embed/v2/7000000000000000000?lang=es-ES"
              style="width: 100%;height: 758px"
            ></iframe>
          </p>
        </blockquote>
      `
      const expected = html`
        <div
          data-embed-provider="tiktok"
          data-embed-id="@user/video/7000000000000000000"
          data-embed-src="https://www.tiktok.com/embed/v2/7000000000000000000"
          data-embed-url="https://www.tiktok.com/@user/video/7000000000000000000"
          data-embed-height="738"
        ></div>
      `

      expect(await convert(value)).toEqualHtml(expected)
    })
  })
})

// The player iframe pasted directly, with no blockquote around it: 62 corpus feeds carry the
// embed paths and 5 the player path, 40 of them with no blockquote fallback at all.
describeForEachParser('tiktokIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tiktokIframeEmbedResolver)

  describe('happy paths', () => {
    // The declared 560x400 is the snippet's landscape box on a vertical player, wrong on both
    // axes, so the player's own height stands in its place.
    it('should resolve the pasted v2 player and decline its landscape size', async () => {
      const value = html`
        <iframe
          src="https://www.tiktok.com/embed/v2/7520573541146692886"
          width="560"
          height="400"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7520573541146692886',
        src: 'https://www.tiktok.com/embed/v2/7520573541146692886',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the v2 player from the first-generation embed path', async () => {
      const value = '<iframe src="https://www.tiktok.com/embed/7568177676003970326"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7568177676003970326',
        src: 'https://www.tiktok.com/embed/v2/7568177676003970326',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the v2 player from the player path', async () => {
      const value = '<iframe src="https://www.tiktok.com/player/v1/7633882165272513815"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7633882165272513815',
        src: 'https://www.tiktok.com/embed/v2/7633882165272513815',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the display flags of the player path', async () => {
      const value = html`
        <iframe
          src="https://www.tiktok.com/player/v1/7655022967344139551?description=0&amp;music_info=0&amp;rel=0&amp;native_context_menu=0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7655022967344139551',
        src: 'https://www.tiktok.com/embed/v2/7655022967344139551',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the language and referrer of the v2 player', async () => {
      const value = html`
        <iframe
          src="https://www.tiktok.com/embed/v2/7481819442272374018?lang=es-ES&amp;referrer=https%3A%2F%2Fexample.com%2Fpost%2F&amp;embedFrom=oembed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7481819442272374018',
        src: 'https://www.tiktok.com/embed/v2/7481819442272374018',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the web app tracking of the first-generation embed path', async () => {
      const value = html`
        <iframe
          src="https://www.tiktok.com/embed/7082054018259848453?is_from_webapp=1&amp;sender_device=pc&amp;web_id=6962132261881841158"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7082054018259848453',
        src: 'https://www.tiktok.com/embed/v2/7082054018259848453',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the watch page a wrapper frames instead of the player', () => {
    // This was pinned as a non-resolution, on the grounds that the watch page refuses framing.
    // It does, which is why it is claimed now: unclaimed it becomes a placeholder pointing at a
    // page that renders nothing, and the path names the clip well enough to mint the player.
    it('should mint the player from a framed watch page', async () => {
      const value = html`
        <iframe src="https://www.tiktok.com/@user/video/7520573541146692886"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user/video/7520573541146692886',
        src: 'https://www.tiktok.com/embed/v2/7520573541146692886',
        url: 'https://www.tiktok.com/@user/video/7520573541146692886',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player from a watch page whose handle is long', async () => {
      const value = html`
        <iframe
          src="https://www.tiktok.com/@averylonghandlepastwhatsignupallows/video/7520573541146692886"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@averylonghandlepastwhatsignupallows/video/7520573541146692886',
        src: 'https://www.tiktok.com/embed/v2/7520573541146692886',
        url: 'https://www.tiktok.com/@averylonghandlepastwhatsignupallows/video/7520573541146692886',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A sanitizer that drops the handle leaves the bare `/video/{id}` half, which still names
    // the clip. With no handle to carry, the id is the same bare video id the player carrier
    // states for the same clip.
    it('should mint the player from a handle-less watch page', async () => {
      const value = html`
        <iframe src="https://www.tiktok.com/video/7520573541146692886"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7520573541146692886',
        src: 'https://www.tiktok.com/embed/v2/7520573541146692886',
        url: 'https://www.tiktok.com/video/7520573541146692886',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player from a watch page whose handle holds digits', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/@10gsocial/video/7178262497063914795"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@10gsocial/video/7178262497063914795',
        src: 'https://www.tiktok.com/embed/v2/7178262497063914795',
        url: 'https://www.tiktok.com/@10gsocial/video/7178262497063914795',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player from a watch page whose handle holds underscores', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/@_cat_riki/video/7162989971240930565"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@_cat_riki/video/7162989971240930565',
        src: 'https://www.tiktok.com/embed/v2/7162989971240930565',
        url: 'https://www.tiktok.com/@_cat_riki/video/7162989971240930565',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player from a watch page whose handle holds dots', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/@.a.u00/video/7312895136185289990"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@.a.u00/video/7312895136185289990',
        src: 'https://www.tiktok.com/embed/v2/7312895136185289990',
        url: 'https://www.tiktok.com/@.a.u00/video/7312895136185289990',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The host is TikTok's and the resolver now reads more than the player path, so every
    // shape that is not a clip has to be refused by name rather than by the host gate.
    it('should return undefined for a profile page framed directly', async () => {
      const value = html`<iframe src="https://www.tiktok.com/@user"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a hashtag page', async () => {
      const value = html`<iframe src="https://www.tiktok.com/tag/dance"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a search page', async () => {
      const value = html`<iframe src="https://www.tiktok.com/search?q=dance"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the site root', async () => {
      const value = html`<iframe src="https://www.tiktok.com/"></iframe>`

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a foreign host carrying the player path', async () => {
      const value = '<iframe src="https://evil.test/embed/v2/7520573541146692886"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the player path under another directory', async () => {
      const value = '<iframe src="https://www.tiktok.com/x/embed/v2/7520573541146692886"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for the player path followed by another segment', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/embed/v2/7520573541146692886/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a watch path under another directory', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/x/@user/video/7520573541146692886"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a watch path followed by another segment', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/@user/video/7520573541146692886/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed watch page handle as written, even if the url answers an error', async () => {
      const value =
        '<iframe src="https://www.tiktok.com/@user%2Fx/video/7520573541146692886"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '@user%2Fx/video/7520573541146692886',
        src: 'https://www.tiktok.com/embed/v2/7520573541146692886',
        url: 'https://www.tiktok.com/@user%2Fx/video/7520573541146692886',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined when the player path holds no numeric id', async () => {
      const value = '<iframe src="https://www.tiktok.com/embed/v2/latest"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // An enclosure's size reaches the resolver the same way a carrier's does, so refusing the
  // carrier refuses the feed as well. Before the player stated a height, that left a TikTok
  // enclosure with no size at all.
  describe('an enclosure the feed sizes itself', () => {
    it('should state the player height over the clip dimensions the feed carries', async () => {
      const expected = html`
        <div
          data-enclosure=""
          data-embed-height="738"
          data-embed-url="https://www.tiktok.com/@user/video/7000000000000000000"
          data-embed-id="@user/video/7000000000000000000"
          data-embed-provider="tiktok"
          data-embed-src="https://www.tiktok.com/embed/v2/7000000000000000000"
        ></div>
      `
      const result = await transformContent('', {
        parseHtmlFn: parseHtml,
        enclosures: [
          {
            url: 'https://www.tiktok.com/@user/video/7000000000000000000',
            type: 'video/mp4',
            width: 1080,
            height: 1920,
          },
        ],
      })

      expect(result).toEqualHtml(expected)
    })
  })
})

describeForEachParser('tiktokS9eEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, tiktokS9eEmbedResolver)

  describe('happy paths', () => {
    it('should read the clip id out of the helper frame', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="tiktok"
          src="https://s9e.github.io/iframe/2/tiktok.min.html#7331735634815601922"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7331735634815601922',
        src: 'https://www.tiktok.com/embed/v2/7331735634815601922',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the player height over the box the helper frame states', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="tiktok"
          src="https://s9e.github.io/iframe/2/tiktok.min.html#7331735634815601922"
          width="325"
          height="740"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'tiktok',
        id: '7331735634815601922',
        src: 'https://www.tiktok.com/embed/v2/7331735634815601922',
        height: 738,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a fragment that is not a clip id', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="tiktok"
          src="https://s9e.github.io/iframe/2/tiktok.min.html#@handle"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a fragment stepping out of the player path', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="tiktok"
          src="https://s9e.github.io/iframe/2/tiktok.min.html#../../@evil/video/999"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a fragment carrying a query', async () => {
      const value = html`
        <iframe
          data-s9e-mediaembed="tiktok"
          src="https://s9e.github.io/iframe/2/tiktok.min.html#7331735634815601922?lang=en"
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
