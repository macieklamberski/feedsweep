import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  codepenIframeEmbedResolver,
  codepenResolveEmbed,
  codepenWidgetEmbedResolver,
} from './codepen.js'

// Every `data-embed-*` field the placeholder carries, for the shapes that only resolve once the
// pipeline has repaired them and so cannot be asserted on the resolver alone.
const readPlaceholder = (
  result: string,
  parseHtml: (value: string) => Document,
): Record<string, string> => {
  const element = parseHtml(result).querySelector('[data-embed-src]')
  const fields: Record<string, string> = {}

  for (const name of element?.getAttributeNames() ?? []) {
    const value = element?.getAttribute(name)

    if (name.startsWith('data-embed-') && value) {
      fields[name.replace('data-embed-', '')] = value
    }
  }

  return fields
}

describe('codepenResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the placeholder from a player url', () => {
      const value = 'https://codepen.io/argyleink/embed/XJpKqXm'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    // CodePen route words that still play the pen when they stand in the username position.
    const ownerRouteWords: Array<string> = ['api', 'pen', 'project']

    it.each(ownerRouteWords)('should play %s in the username position with no author', (user) => {
      const value = `https://codepen.io/${user}/embed/XJpKqXm`
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: `https://codepen.io/${user}/embed/XJpKqXm`,
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    it('should read a route word in the username position in any case', () => {
      const value = 'https://codepen.io/API/embed/XJpKqXm'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/API/embed/XJpKqXm',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    it('should read the hex slug CodePen mints for its own pens', () => {
      const value = 'https://codepen.io/anon/embed/df41d39c06f1b477bd00d57ce9c853ee'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'df41d39c06f1b477bd00d57ce9c853ee',
        src: 'https://codepen.io/anon/embed/df41d39c06f1b477bd00d57ce9c853ee',
        url: 'https://codepen.io/anon/pen/df41d39c06f1b477bd00d57ce9c853ee',
        thumbnail: 'https://shots.codepen.io/anon/pen/df41d39c06f1b477bd00d57ce9c853ee-512.jpg',
        height: 300,
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    // The author's own query picks which panes open and which theme they use, so the url the
    // publisher wrote is what travels rather than one rebuilt from the slug.
    it('should keep the query the publisher wrote', () => {
      const value = 'https://codepen.io/argyleink/embed/XJpKqXm?default-tab=css%2Cresult'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?default-tab=css%2Cresult',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    // Three slug lengths are already in the wild, and the length is not what names a pen.
    it('should resolve a slug longer than the ones minted so far', () => {
      const value = 'https://codepen.io/argyleink/embed/XJpKqXmAndThenSomeMoreCharactersStillGoing'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXmAndThenSomeMoreCharactersStillGoing',
        src: 'https://codepen.io/argyleink/embed/XJpKqXmAndThenSomeMoreCharactersStillGoing',
        url: 'https://codepen.io/argyleink/pen/XJpKqXmAndThenSomeMoreCharactersStillGoing',
        thumbnail:
          'https://shots.codepen.io/argyleink/pen/XJpKqXmAndThenSomeMoreCharactersStillGoing-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    // The username selects the pen's page and its screenshot, and its length selects neither.
    it('should keep an author longer than the handles CodePen issues today', () => {
      const value = 'https://codepen.io/argyleink-with-a-much-longer-handle/embed/XJpKqXm'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink-with-a-much-longer-handle/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink-with-a-much-longer-handle/pen/XJpKqXm',
        thumbnail:
          'https://shots.codepen.io/argyleink-with-a-much-longer-handle/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink-with-a-much-longer-handle',
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })
  })

  // A team owns its pens one segment deeper. No sampled feed carries one, and CodePen blocks
  // automated requests, so the shape is read from the url rather than confirmed against a live
  // pen. The team prefix has to survive into `url`, which is the only field the owner selects.
  describe('a team pen, which sits under an extra path segment', () => {
    it('should read the pen from behind the team segment', () => {
      const value = 'https://codepen.io/team/keyframers/embed/XJpKqXm'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/team/keyframers/embed/XJpKqXm',
        url: 'https://codepen.io/team/keyframers/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/keyframers/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@keyframers',
      }

      expect(codepenResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a bare team profile, which names no pen', () => {
      const value = 'https://codepen.io/team/keyframers'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should ignore a pen page, which is a link rather than a player', () => {
      const value = 'https://codepen.io/argyleink/pen/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    // The path here is a valid embed path, so only the host check can reject it. A realistic
    // blog url would fall out on the path instead and leave this guard unexercised.
    it('should ignore a subdomain even when the path names a pen', () => {
      const value = 'https://blog.codepen.io/argyleink/embed/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the editor path', () => {
      const value = 'https://evil.test/editor/anon/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    // www.codepen.io redirects every path to the site root, so the player never loads.
    it('should ignore the www host', () => {
      const value = 'https://www.codepen.io/argyleink/embed/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    // `cpe` is the 2.0 editor's own path and the prefill endpoint sits under it, so this has the
    // exact shape of a pen url while naming no pen. Read as a username it mints a bogus pen.
    it('should ignore a path segment CodePen owns in the username position', () => {
      const value = 'https://codepen.io/cpe/embed/prefill'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the collection segment in the username position', () => {
      const value = 'https://codepen.io/collection/embed/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the spark segment in the username position', () => {
      const value = 'https://codepen.io/spark/embed/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    // A separate product with its own id space and no screenshot endpoint. Zero in the corpus.
    it('should ignore a project embed', () => {
      const value = 'https://codepen.io/argyleink/project/embed/ABCDEF'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    // `cdpn.io` serves a pen's raw output without the player chrome, so it is not an embed.
    it('should ignore the asset host', () => {
      const value = 'https://cdpn.io/pen/debug/XJpKqXm/abc123'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/argyleink/embed/XJpKqXm'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player url naming no pen', () => {
      const value = 'https://codepen.io/argyleink/embed'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a slug carrying a file name', () => {
      const value = 'https://codepen.io/argyleink/embed/XJpKqXm.mp4'

      expect(codepenResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('codepenWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, codepenWidgetEmbedResolver)

  describe('Variant #1: the anchor block the ei.js loader replaces', () => {
    it('should read the pen out of the data attributes', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="437"
          data-theme-id="default"
          data-default-tab="css,result"
          data-user="@argyleink"
          data-slug-hash="XJpKqXm"
          data-pen-title="Parallax Card"
        >
          <span
            >See the Pen
            <a href="https://codepen.io/argyleink/pen/XJpKqXm">Parallax Card</a> by Adam Argyle (<a
              href="https://codepen.io/argyleink"
              >@argyleink</a
            >) on <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?default-tab=css%2Cresult&theme-id=default',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 437,
        title: 'Parallax Card',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // About one anchor block in nine states no `data-user`, and the sentence's own pen link
    // still names the author.
    it('should recover the author from the pen link when data-user is missing', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="300"
          data-slug-hash="XJpKqXm"
        >
          <span
            >See the Pen <a href="https://codepen.io/argyleink/pen/XJpKqXm">Parallax Card</a> on
            <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'Parallax Card',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // With nobody named anywhere the slug alone still selects the player and the screenshot, and
    // the pen page redirects `anon` to the real owner.
    it('should still resolve when no author is named at all', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
        >
          <span>See the Pen on CodePen.</span>
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The block's own attribute names a person and cannot say "team", so the team prefix reaches
    // the placeholder only through the sentence's pen link.
    it('should keep the team prefix when the pen link names a team', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
        >
          <span
            >See the Pen
            <a href="https://codepen.io/team/keyframers/pen/XJpKqXm">A Team Pen</a> on
            <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/keyframers/embed/XJpKqXm',
        url: 'https://codepen.io/team/keyframers/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/keyframers/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'A Team Pen',
        author: '@keyframers',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The pen link names the pen and its owner together, so it outranks a `data-user` that says
    // otherwise: a copied block keeps a stale attribute while the link still points at the pen.
    // Without this the three addresses named three different people.
    it('should trust the pen link over a data-user that disagrees', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="mallory"
        >
          <span
            >See the Pen <a href="https://codepen.io/alice/pen/XJpKqXm">Parallax Card</a></span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/alice/embed/XJpKqXm',
        url: 'https://codepen.io/alice/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/alice/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'Parallax Card',
        author: '@alice',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `data-user` cannot say "team", so the link has to outrank it. Seeding the owner path from
    // the attribute made the same pen resolve to two different pages depending on its presence.
    it('should keep the team prefix even when data-user names the team', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="keyframers"
        >
          <span
            >See the Pen
            <a href="https://codepen.io/team/keyframers/pen/XJpKqXm">A Team Pen</a></span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/keyframers/embed/XJpKqXm',
        url: 'https://codepen.io/team/keyframers/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/keyframers/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'A Team Pen',
        author: '@keyframers',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The share dialog writes the same placeholder here as in the player's title attribute.
    it('should drop a data-pen-title that names no pen', async () => {
      const value = html`
        <p
          class="codepen"
          data-user="argyleink"
          data-slug-hash="XJpKqXm"
          data-pen-title="Untitled"
        >
          <span
            >See the Pen <a href="https://codepen.io/argyleink/pen/XJpKqXm">Untitled</a> by Adam
            Argyle on <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title from the pen link when data-pen-title is missing', async () => {
      const value = html`
        <p
          class="codepen"
          data-user="chriscoyier"
          data-slug-hash="gfdDu"
        >
          <span
            >See the Pen <a href="https://codepen.io/chriscoyier/pen/gfdDu">A Legacy Pen</a> by
            Chris Coyier on <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'gfdDu',
        src: 'https://codepen.io/chriscoyier/embed/gfdDu',
        url: 'https://codepen.io/chriscoyier/pen/gfdDu',
        thumbnail: 'https://shots.codepen.io/chriscoyier/pen/gfdDu-512.jpg',
        height: 300,
        title: 'A Legacy Pen',
        author: '@chriscoyier',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('Variant #1b: the pre-2018 form, attributes before the class', () => {
    it('should read a five-character legacy slug', async () => {
      const value = html`
        <p
          data-height="268"
          data-theme-id="0"
          data-slug-hash="pFzlJ"
          data-default-tab="result"
          data-user="@wesbos"
          class="codepen"
        >
          See the Pen <a href="https://codepen.io/wesbos/pen/pFzlJ/">Flexbox Demo</a> by Wes Bos (<a
            href="https://codepen.io/wesbos"
            >@wesbos</a
          >) on <a href="https://codepen.io">CodePen</a>.
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'pFzlJ',
        src: 'https://codepen.io/wesbos/embed/pFzlJ?default-tab=result&theme-id=0',
        url: 'https://codepen.io/wesbos/pen/pFzlJ',
        thumbnail: 'https://shots.codepen.io/wesbos/pen/pFzlJ-512.jpg',
        height: 268,
        title: 'Flexbox Demo',
        author: '@wesbos',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('Variant #1c: a div rather than a paragraph', () => {
    it('should read the block whatever element carries it', async () => {
      const value = html`
        <div
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="argyleink"
        >
          <span>See the Pen on <a href="https://codepen.io">CodePen</a>.</span>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the block the 2.0 editor writes', () => {
    it('should build the player under the editor path, as the loader does', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="700"
          data-pen-title="Theme and Mode Toggle Demo"
          data-version="2"
          data-default-tab="result"
          data-slug-hash="azpLzvW"
          data-user="sturobson"
          style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;"
        >
          <span
            >See the Pen
            <a href="https://codepen.io/editor/sturobson/pen/019f138e-9a52-7a4f-8fe8-39db4b632944">
              Theme and Mode Toggle Demo</a
            >
            by Stuart Robson (<a href="https://codepen.io/sturobson">@sturobson</a>) on
            <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'azpLzvW',
        src: 'https://codepen.io/editor/sturobson/embed/azpLzvW?default-tab=result',
        url: 'https://codepen.io/sturobson/pen/azpLzvW',
        thumbnail: 'https://shots.codepen.io/sturobson/pen/azpLzvW-512.jpg',
        height: 700,
        title: 'Theme and Mode Toggle Demo',
        author: '@sturobson',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the 1.0 player path for any other version', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="700"
          data-pen-title="Theme and Mode Toggle Demo"
          data-version="1"
          data-default-tab="result"
          data-slug-hash="azpLzvW"
          data-user="sturobson"
          style="height: 700px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;"
        >
          <span
            >See the Pen
            <a href="https://codepen.io/editor/sturobson/pen/019f138e-9a52-7a4f-8fe8-39db4b632944">
              Theme and Mode Toggle Demo</a
            >
            by Stuart Robson (<a href="https://codepen.io/sturobson">@sturobson</a>) on
            <a href="https://codepen.io">CodePen</a>.</span
          >
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'azpLzvW',
        src: 'https://codepen.io/sturobson/embed/azpLzvW?default-tab=result',
        url: 'https://codepen.io/sturobson/pen/azpLzvW',
        thumbnail: 'https://shots.codepen.io/sturobson/pen/azpLzvW-512.jpg',
        height: 700,
        title: 'Theme and Mode Toggle Demo',
        author: '@sturobson',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The loader copies both into the query of the iframe it builds. They describe the player, so
  // the pen's own page, which has no panes to choose, must not carry them.
  describe('the panes and theme the author picked', () => {
    it('should put them on the player and keep them off the pen page', async () => {
      const value = html`
        <p
          class="codepen"
          data-default-tab="js,result"
          data-theme-id="dark"
          data-user="argyleink"
          data-slug-hash="XJpKqXm"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?default-tab=js%2Cresult&theme-id=dark',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a theme carrying a query of its own', async () => {
      const value = html`
        <p
          class="codepen"
          data-theme-id="dark&amp;autoplay=1"
          data-user="argyleink"
          data-slug-hash="XJpKqXm"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a theme and panes spelled outside the lowercase names', async () => {
      const value = html`
        <p
          class="codepen"
          data-default-tab="CSS_Result"
          data-theme-id="Dark-1"
          data-user="argyleink"
          data-slug-hash="XJpKqXm"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a pane value that is not one', async () => {
      const value = html`
        <p
          class="codepen"
          data-default-tab="<script>"
          data-user="argyleink"
          data-slug-hash="XJpKqXm"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // What the dialog wrote before `data-slug-hash` existed. The loader still maps one onto the
  // other, so these blocks still build a player and would otherwise reach a reader as a sentence.
  describe('the legacy data-href spelling', () => {
    it('should read the pen from a whole url in data-href', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="300"
          data-href="https://codepen.io/argyleink/pen/XJpKqXm"
        >
          <span>See the Pen <a href="https://codepen.io/argyleink/pen/XJpKqXm">Parallax</a>
          </span>
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'Parallax',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The url in `data-href` is the player's own, so the height the author picked can sit in its
    // query with no `data-height` beside it.
    it('should take the height from the url when the block states none', async () => {
      const value = html`
        <p
          class="codepen"
          data-href="https://codepen.io/argyleink/pen/XJpKqXm?height=600"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 600,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The loader appends the block's token to the slug of the player it builds, so a private pen
    // embedded this way names its token here and nowhere else.
    it('should append a token stated on the block to the slug', async () => {
      const value = html`
        <p
          class="codepen"
          data-height="300"
          data-default-tab="css,result"
          data-slug-hash="OJYzQjN"
          data-pen-title="Transform keywords to other keywords (2 keyword version)"
          data-user="leaverou"
          data-token="c8ec7595b68381e99d38441487db546f"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/leaverou/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f?default-tab=css%2Cresult',
        url: 'https://codepen.io/leaverou/pen/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/leaverou/pen/OJYzQjN-512.jpg',
        height: 300,
        title: 'Transform keywords to other keywords (2 keyword version)',
        author: '@leaverou',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should append a token the data-href url carries to the slug', async () => {
      const value = html`
        <p
          class="codepen"
          data-href="https://codepen.io/leaverou/pen/OJYzQjN?token=c8ec7595b68381e99d38441487db546f"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/leaverou/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        url: 'https://codepen.io/leaverou/pen/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/leaverou/pen/OJYzQjN-512.jpg',
        height: 300,
        author: '@leaverou',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a token that would climb out of the pen path', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="argyleink"
          data-token=".."
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a token carrying a query of its own', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="argyleink"
          data-token="c8ec7595b68381e99d38441487db546f&amp;autoplay=1"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a bare slug in data-href', async () => {
      const value = html`
        <p
          class="codepen"
          data-href="XJpKqXm"
          data-user="argyleink"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a data-href naming something that is not a pen', async () => {
      const value = html`
        <p
          class="codepen"
          data-href="https://codepen.io/argyleink/collection/abcdef"
        ></p>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // A prefill block ships its code inline as `<pre>` children with no saved pen behind it, so
  // there is nothing to mint and the code is the content. It must stay exactly as it arrived.
  describe('shapes that carry no saved pen', () => {
    it('should ignore a prefill block', async () => {
      const value = html`
        <div
          class="codepen"
          data-prefill='{"title":"Demo"}'
          data-height="400"
        >
          <pre data-lang="html">&lt;h1&gt;Hi&lt;/h1&gt;</pre>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should ignore a block naming no pen', async () => {
      const value = '<p class="codepen"><span>See the Pen on CodePen.</span></p>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slug that is not a pen id', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="not a slug"
        >
          <span>See the Pen</span>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a slug hash carrying a query', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm?x=1"
        >
          <span>See the Pen</span>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The attribute alone is not the platform: other embed plugins carry their own slug hashes.
    it('should ignore a slug hash on a block that is not CodePen', async () => {
      const value = html`
        <p
          class="gist"
          data-slug-hash="XJpKqXm"
        >
          <span>Some other widget</span>
        </p>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    // The share dialog writes the handle with its `@` and the url path carries both spellings.
    it('should strip the at sign from the stated handle', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="@argyleink"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The block extends the class rather than replacing it, which is what themes do.
    it('should read a block carrying extra classes', async () => {
      const value = html`
        <p
          class="codepen embed-responsive"
          data-slug-hash="XJpKqXm"
          data-user="argyleink"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A pen link to a different pen belongs to the prose around the block, not to the block.
    it('should not take the author from a link naming another pen', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
        >
          <span>Compare with <a href="https://codepen.io/someoneelse/pen/aBcDeFg">this one</a>.</span>
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `anon` is what the share dialog writes for an author who asked not to be named, so it
    // names nobody and must not become a link to a profile of that name.
    it('should treat the anonymous handle as no author', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="anon"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should treat a handle with an at sign inside it as no author', async () => {
      const value = html`
        <p
          class="codepen"
          data-slug-hash="XJpKqXm"
          data-user="argyle@ink"
        ></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('codepenIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, codepenIframeEmbedResolver)

  describe('Variant #2: the player iframe', () => {
    it('should take the name out of the stated title', async () => {
      const value = html`
        <iframe
          height="400"
          style="width: 100%;"
          scrolling="no"
          title="Parallax Card"
          src="https://codepen.io/argyleink/embed/XJpKqXm?default-tab=js%2Cresult"
          loading="lazy"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?default-tab=js%2Cresult',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 400,
        title: 'Parallax Card',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The share path CodePen writes when the author is not named. The slug still selects the
    // pen, so the player, the page and the screenshot all work without one.
    it('should resolve the anonymous share path without an author', async () => {
      const value = html`
        <iframe
          height="331"
          src="https://codepen.io/anon/embed/XJpKqXm?theme-id=dark"
          title="CodePen Embed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm?theme-id=dark',
        url: 'https://codepen.io/anon/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 331,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // Three sources, in the order the publisher's own intent runs out: the box they laid out, the
  // number the loader put in the query, then CodePen's own default for a player that says nothing.
  describe('how tall the player is', () => {
    it('should take the height stated in the query when no attribute states one', async () => {
      const value = '<iframe src="https://codepen.io/argyleink/embed/XJpKqXm?height=600"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?height=600',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 600,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The attribute is the box the publisher actually laid out, so it outranks the query.
    it('should prefer the stated attribute over the query', async () => {
      const value = html`
        <iframe
          height="450"
          src="https://codepen.io/argyleink/embed/XJpKqXm?height=600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?height=600',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 450,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the height CodePen defaults to', async () => {
      const value = '<iframe src="https://codepen.io/argyleink/embed/XJpKqXm"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A zero is a height nobody laid out, so the player takes the default as if it stated none.
    it('should treat a height of zero as no height at all', async () => {
      const value = '<iframe src="https://codepen.io/argyleink/embed/XJpKqXm?height=0"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?height=0',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A carrier that states a width and no height neither takes the default nor gets paired with
    // it: 800 by the default height would describe a box the publisher never asked for, and 800
    // on its own is a number the reader lays nothing out from.
    it('should keep the default height over a width the carrier stated', async () => {
      const value = '<iframe width="800" src="https://codepen.io/argyleink/embed/XJpKqXm"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A ratio inferred from an ancestor's responsive wrapper ranks below what a resolver states.
    // The default height is a resolver statement, a corpus-typical value for a pen that declares
    // none, so it stands over the wrapper the same as a measured height would. Only the carrier
    // itself outranks the resolver, and a wrapper is not the carrier.
    it('should keep the default height over a ratio inferred from a wrapper', async () => {
      const value = html`
        <div style="padding-bottom:56.25%">
          <iframe src="https://codepen.io/argyleink/embed/XJpKqXm"></iframe>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('Variant #2b: the deferred-loading preview path', () => {
    it('should read the pen from behind the preview segment', async () => {
      const value = html`
        <iframe
          id="cp_embed_XJpKqXm"
          src="https://codepen.io/argyleink/embed/preview/XJpKqXm?height=300&amp;slug-hash=XJpKqXm"
          title="Parallax Card"
          height="300"
          class="cp_embed_iframe"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/preview/XJpKqXm?height=300&slug-hash=XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'Parallax Card',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('Variant #2e: the class on the iframe rather than the block', () => {
    it('should resolve the player by its url whatever class it carries', async () => {
      const value = html`
        <iframe
          class="codepen"
          height="331"
          src="https://codepen.io/argyleink/embed/XJpKqXm?theme-id=dark"
          title="Untitled"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?theme-id=dark',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 331,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the player the 2.0 editor writes', () => {
    it('should read the owner after the editor segment and the uuid slug', async () => {
      const value = html`
        <iframe
          id="cp_embed_019dcdfc-1e41-77c8-afdf-810ebc6f2480"
          src="https://codepen.io/editor/anon/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480?height=450&amp;theme-id=1&amp;slug-hash=019dcdfc-1e41-77c8-afdf-810ebc6f2480&amp;default-tab=result"
          height="450"
          scrolling="no"
          frameborder="0"
          allowfullscreen
          allowpaymentrequest
          name="CodePen Embed 019dcdfc-1e41-77c8-afdf-810ebc6f2480"
          title="CodePen Embed 019dcdfc-1e41-77c8-afdf-810ebc6f2480"
          class="cp_embed_iframe"
          style="width:100%;overflow:hidden"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: '019dcdfc-1e41-77c8-afdf-810ebc6f2480',
        src: 'https://codepen.io/editor/anon/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480?height=450&theme-id=1&slug-hash=019dcdfc-1e41-77c8-afdf-810ebc6f2480&default-tab=result',
        url: 'https://codepen.io/anon/pen/019dcdfc-1e41-77c8-afdf-810ebc6f2480',
        height: 450,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a named owner after the editor segment', async () => {
      const value =
        '<iframe src="https://codepen.io/editor/CiTA/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: '019dcdfc-1e41-77c8-afdf-810ebc6f2480',
        src: 'https://codepen.io/editor/CiTA/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480',
        url: 'https://codepen.io/CiTA/pen/019dcdfc-1e41-77c8-afdf-810ebc6f2480',
        height: 300,
        author: '@CiTA',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore an editor segment in capitals, which CodePen does not serve', async () => {
      const value =
        '<iframe src="https://codepen.io/EDITOR/anon/embed/019dcdfc-1e41-77c8-afdf-810ebc6f2480"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a hyphenated slug that is not a uuid', async () => {
      const value =
        '<iframe src="https://codepen.io/editor/anon/embed/019dcdfc-1e41-77c8-afdf-810ebc6f248"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    // The selector matches every iframe, so the host check inside `extract` is what rejects
    // this one. A lookalike host would never reach it.
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/argyleink/embed/XJpKqXm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    // The resolver's own host list rejects subdomains, but the factory's gate lets them through
    // to `extract`, so the path here is deliberately a valid one.
    it('should ignore a subdomain even when the path names a pen', async () => {
      const value = '<iframe src="https://blog.codepen.io/argyleink/embed/XJpKqXm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  // A private pen opens only for what its url carries, and CodePen gates them two ways: the
  // share dialog's `key` and a token. Dropping either from the pen page would leave the
  // placeholder linking to something the reader cannot open.
  describe('a private pen, reachable only with what unlocks it', () => {
    it('should carry a token appended to the slug into the pen page', async () => {
      const value = html`
        <iframe
          height="300"
          src="https://codepen.io/leaverou/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f?default-tab=css%2Cresult"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/leaverou/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f?default-tab=css%2Cresult',
        url: 'https://codepen.io/leaverou/pen/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/leaverou/pen/OJYzQjN-512.jpg',
        height: 300,
        author: '@leaverou',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry a token appended to the slug of the deferred player', async () => {
      const value = html`
        <iframe
          height="300"
          src="https://codepen.io/leaverou/embed/preview/OJYzQjN/c8ec7595b68381e99d38441487db546f"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/leaverou/embed/preview/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        url: 'https://codepen.io/leaverou/pen/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/leaverou/pen/OJYzQjN-512.jpg',
        height: 300,
        author: '@leaverou',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry a token in the query into the pen page as a path segment', async () => {
      const value = html`
        <iframe
          height="300"
          src="https://codepen.io/leaverou/embed/OJYzQjN?token=c8ec7595b68381e99d38441487db546f"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/leaverou/embed/OJYzQjN?token=c8ec7595b68381e99d38441487db546f',
        url: 'https://codepen.io/leaverou/pen/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/leaverou/pen/OJYzQjN-512.jpg',
        height: 300,
        author: '@leaverou',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A feed that encoded its html twice leaves `&amp;` in the url, which turns the parameter
    // after it into `amp;key`. The pen page would silently lose what unlocks it.
    it('should still find the key behind a doubly-encoded ampersand', async () => {
      const value = html`
        <iframe
          height="400"
          src="https://codepen.io/argyleink/embed/XJpKqXm?height=600&amp;amp;key=abc123XYZ"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?height=600&amp;key=abc123XYZ',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm?key=abc123XYZ',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 400,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a key carrying a query of its own off the pen page', async () => {
      const value = html`
        <iframe
          height="400"
          src="https://codepen.io/argyleink/embed/XJpKqXm?key=abc%26autoplay%3D1"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?key=abc%26autoplay%3D1',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 400,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The page under `anon` redirects to the real owner without the token, which lands on a 404.
    it('should mint no pen page for a token pen naming no author', async () => {
      const value = html`
        <iframe
          height="300"
          src="https://codepen.io/anon/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'OJYzQjN',
        src: 'https://codepen.io/anon/embed/OJYzQjN/c8ec7595b68381e99d38441487db546f',
        thumbnail: 'https://shots.codepen.io/anon/pen/OJYzQjN-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint no pen page for a key pen naming no author', async () => {
      const value = html`
        <iframe
          height="400"
          src="https://codepen.io/anon/embed/XJpKqXm?key=abc123XYZ"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/anon/embed/XJpKqXm?key=abc123XYZ',
        thumbnail: 'https://shots.codepen.io/anon/pen/XJpKqXm-512.jpg',
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should carry the key into both addresses', async () => {
      const value = html`
        <iframe
          height="400"
          src="https://codepen.io/argyleink/embed/XJpKqXm?key=abc123XYZ"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm?key=abc123XYZ',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm?key=abc123XYZ',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 400,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('titles the snippet writes when the pen has none', () => {
    // The player writes its own name in place of a missing title, naming the carrier and the
    // author but never the pen.
    it('should drop the CodePen by author title', async () => {
      const value = html`
        <iframe
          src="https://codepen.io/argyleink/embed/XJpKqXm"
          title="CodePen by @argyleink"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the CodePen Embed title that carries the slug', async () => {
      const value = html`
        <iframe
          src="https://codepen.io/anon/embed/raxQQME"
          title="CodePen Embed raxQQME"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'raxQQME',
        src: 'https://codepen.io/anon/embed/raxQQME',
        url: 'https://codepen.io/anon/pen/raxQQME',
        thumbnail: 'https://shots.codepen.io/anon/pen/raxQQME-512.jpg',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a pen name that opens on the word CodePen', async () => {
      const value = html`
        <iframe
          src="https://codepen.io/argyleink/embed/XJpKqXm"
          title="CodePen tricks I keep forgetting"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        title: 'CodePen tricks I keep forgetting',
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the bare CodePen title', async () => {
      const value = html`
        <iframe
          src="https://codepen.io/argyleink/embed/XJpKqXm"
          title="CodePen"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // These name the carrier rather than the pen, so a placeholder is better off without them.
    it('should drop the generic CodePen Embed title', async () => {
      const value = html`
        <iframe
          src="https://codepen.io/argyleink/embed/XJpKqXm"
          title="CodePen Embed"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: 300,
        author: '@argyleink',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

// The Embedly wrapper and the plain-link forms only reach their final state after earlier passes
// have unwrapped or left them alone, so the assertion belongs at the end of the pipeline.
describeForEachParser('codepen shapes the pipeline settles first', (parseHtml) => {
  const convert = (value: string): Promise<string> => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  const placeholder = async (value: string): Promise<Record<string, string>> => {
    return readPlaceholder(await convert(value), parseHtml)
  }

  describe('Variant #1: the anchor block and its loader', () => {
    const value = html`
      <p
        class="codepen"
        data-height="437"
        data-user="@argyleink"
        data-slug-hash="XJpKqXm"
        data-pen-title="Parallax Card"
      >
        <span
          >See the Pen
          <a href="https://codepen.io/argyleink/pen/XJpKqXm">Parallax Card</a> by Adam Argyle (<a
            href="https://codepen.io/argyleink"
            >@argyleink</a
          >) on <a href="https://codepen.io">CodePen</a>.</span
        >
      </p>
      <script
        async
        src="https://cpwebassets.codepen.io/assets/embed/ei.js"
      ></script>
    `

    it('should turn the block into a placeholder', async () => {
      const expected: Record<string, string> = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/XJpKqXm',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://shots.codepen.io/argyleink/pen/XJpKqXm-512.jpg',
        height: '437',
        title: 'Parallax Card',
        author: '@argyleink',
      }

      expect(await placeholder(value)).toEqual(expected)
    })

    it('should leave none of the loader behind', async () => {
      expect(await convert(value)).not.toContain('ei.js')
    })
  })

  // Embedly proxies the whole embed for platforms that route third-party content through it.
  // `rebuildEmbedlyEmbeds` unwraps it to the inner player before the widget pass, and the poster
  // Embedly names is the exact frame the publisher chose, so it outranks the derived screenshot.
  describe('Variant #3: the Embedly-proxied player', () => {
    it('should resolve the inner pen and keep the proxied poster', async () => {
      const value = html`
        <iframe
          src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fcodepen.io%2Fargyleink%2Fembed%2Fpreview%2FXJpKqXm%3Fheight%3D600&amp;display_name=CodePen&amp;url=https%3A%2F%2Fcodepen.io%2Fargyleink%2Fpen%2FXJpKqXm&amp;image=https%3A%2F%2Fassets.codepen.io%2F2869%2Finternal%2Fscreenshots%2Fpens%2FXJpKqXm.default.png&amp;type=text%2Fhtml&amp;schema=codepen"
          width="800"
          height="600"
        ></iframe>
      `
      const expected: Record<string, string> = {
        provider: 'codepen',
        id: 'XJpKqXm',
        src: 'https://codepen.io/argyleink/embed/preview/XJpKqXm?height=600',
        url: 'https://codepen.io/argyleink/pen/XJpKqXm',
        thumbnail: 'https://assets.codepen.io/2869/internal/screenshots/pens/XJpKqXm.default.png',
        height: '600',
        author: '@argyleink',
      }

      expect(await placeholder(value)).toEqual(expected)
    })
  })

  // The share dialog writes the 2.0 player's src protocol-relative, which a resolver only sees once
  // the pipeline has made it absolute.
  describe('the protocol-relative player the 2.0 editor writes', () => {
    it('should turn the player into a placeholder', async () => {
      const value = html`
        <iframe
          id="cp_embed_019e2c40-99c5-7617-8163-23c489a628b5"
          src="//codepen.io/editor/anon/embed/019e2c40-99c5-7617-8163-23c489a628b5?height=450&amp;theme-id=1&amp;slug-hash=019e2c40-99c5-7617-8163-23c489a628b5&amp;default-tab=js,result"
          height="450"
          scrolling="no"
          frameborder="0"
          allowfullscreen
          allowpaymentrequest
          name="CodePen Embed 019e2c40-99c5-7617-8163-23c489a628b5"
          title="CodePen Embed 019e2c40-99c5-7617-8163-23c489a628b5"
          class="cp_embed_iframe"
          style="width:100%;overflow:hidden"
        ></iframe>
      `
      const expected: Record<string, string> = {
        provider: 'codepen',
        id: '019e2c40-99c5-7617-8163-23c489a628b5',
        src: 'https://codepen.io/editor/anon/embed/019e2c40-99c5-7617-8163-23c489a628b5?height=450&theme-id=1&slug-hash=019e2c40-99c5-7617-8163-23c489a628b5&default-tab=js,result',
        url: 'https://codepen.io/anon/pen/019e2c40-99c5-7617-8163-23c489a628b5',
        height: '450',
      }

      expect(await placeholder(value)).toEqual(expected)
    })
  })

  describe('shapes that are not an embed', () => {
    // Plain pen links are 28.5% of the corpus and bare-text urls another 41.5%. Replacing either
    // would turn a sentence in a tutorial into a player.
    it('should leave a pen link in prose alone', async () => {
      const value = html`
        <p>Look at <a href="https://codepen.io/argyleink/pen/XJpKqXm">this pen</a>.</p>
      `

      expect(await convert(value)).toBe(value)
    })

    // The linkifier claims it like any other bare url, which is its business rather than this
    // suite's. What matters is that no resolver turns a url pasted into show notes into a player.
    it('should not build a placeholder from a bare pen url', async () => {
      const value = '<p>Demo: https://codepen.io/argyleink/pen/XJpKqXm</p>'
      const expected: Record<string, string> = {}

      expect(await placeholder(value)).toEqual(expected)
    })
  })
})

// The enclosure probe offers every attachment a feed carries to this resolver, and CodePen serves
// uploads on its own host, so the slug alphabet is what keeps a file playable.
describeForEachParser('codepen through the pipeline', (parseHtml) => {
  it('should leave a video enclosure on the codepen host playable', async () => {
    const enclosures = [
      { url: 'https://codepen.io/argyleink/embed/XJpKqXm.mp4', type: 'video/mp4' },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://codepen.io/argyleink/embed/XJpKqXm.mp4"></video>
      <p>Body</p>
    `

    expect(
      await transformContent('<p>Body</p>', {
        parseHtmlFn: parseHtml,
        baseUrl: 'https://example.com/post',
        enclosures,
      }),
    ).toEqualHtml(expected)
  })
})
