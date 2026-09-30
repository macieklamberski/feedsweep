import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { flickrEmbedResolver, flickrResolveEmbed } from './flickr.js'

describeForEachParser('flickrEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrEmbedResolver)

  describe('the slideshow object and embed pair', () => {
    // The NSID spelling of the owner names nobody, so it fills no author, where the path
    // alias in the case below does.
    it('should map the dead player onto the album the flashvars name', async () => {
      const value = html`
        <object width="500" height="375">
          <param
            name="flashvars"
            value="offsite=true&amp;lang=fr-fr&amp;page_show_url=%2Fphotos%2F108534344%40N02%2Fsets%2F72157637855752606%2Fshow%2Fwith%2F10952473856%2F&amp;page_show_back_url=%2Fphotos%2F108534344%40N02%2Fsets%2F72157637855752606%2Fwith%2F10952473856%2F&amp;set_id=72157637855752606&amp;jump_to=10952473856"
          />
          <param name="allowFullScreen" value="true" />
          <param name="src" value="http://www.flickr.com/apps/slideshow/show.swf?v=138195" />
          <param name="allowfullscreen" value="true" />
          <embed
            type="application/x-shockwave-flash"
            width="500"
            height="375"
            src="http://www.flickr.com/apps/slideshow/show.swf?v=138195"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '108534344@N02/72157637855752606',
        src: 'https://embedr.flickr.com/photosets/72157637855752606?width=500&height=375',
        url: 'https://www.flickr.com/photos/108534344@N02/sets/72157637855752606',
        width: 500,
        height: 375,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the config off an embed that carries it itself', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=67348"
          allowFullScreen="true"
          flashvars="&offsite=true&amp;lang=en-us&page_show_url=%2Fphotos%2Fyotchan%2Fsets%2F72157615334609433%2Fshow%2F&page_show_back_url=%2Fphotos%2Fyotchan%2Fsets%2F72157615334609433%2F&set_id=72157615334609433&jump_to="
          width="500"
          height="375"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'yotchan/72157615334609433',
        src: 'https://embedr.flickr.com/photosets/72157615334609433?width=500&height=375',
        url: 'https://www.flickr.com/photos/yotchan/sets/72157615334609433',
        width: 500,
        height: 375,
        author: 'yotchan',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an owner alias carrying a hyphen', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=124984"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=de-de&amp;page_show_url=%2Fphotos%2Fe-governance%2Fsets%2F72157635557420286%2Fshow%2Fwith%2F9770691963%2F&amp;page_show_back_url=%2Fphotos%2Fe-governance%2Fsets%2F72157635557420286%2Fwith%2F9770691963%2F&amp;set_id=72157635557420286&amp;jump_to=9770691963"
          width="200"
          height="150"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'e-governance/72157635557420286',
        src: 'https://embedr.flickr.com/photosets/72157635557420286?width=200&height=150',
        url: 'https://www.flickr.com/photos/e-governance/sets/72157635557420286',
        width: 200,
        height: 150,
        author: 'e-governance',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The endpoint renders `width: NaNpx` when it is given no size, so a carrier that states
    // none still has to name one.
    it('should fall back to the dialog size when the carrier states none', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=67348"
          allowFullScreen="true"
          flashvars="&offsite=true&amp;lang=en-us&page_show_url=%2Fphotos%2Fyotchan%2Fsets%2F72157615334609433%2Fshow%2F&page_show_back_url=%2Fphotos%2Fyotchan%2Fsets%2F72157615334609433%2F&set_id=72157615334609433&jump_to="
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'yotchan/72157615334609433',
        src: 'https://embedr.flickr.com/photosets/72157615334609433?width=400&height=300',
        url: 'https://www.flickr.com/photos/yotchan/sets/72157615334609433',
        width: 400,
        height: 300,
        author: 'yotchan',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The other Flash-era carrier: an iframe on `flickr.com/slideshow/index.gne`, whose target
  // 302s to a page that refuses framing, so it renders an empty box today. Its subject is in
  // its own query. Of the 112 corpus feeds carrying it, 94 name a set and 90 name a user.
  // The rarer flash forms, measured at 5 and 6 feeds: a photostream slideshow whose page path
  // has no set, and a snippet naming the owner only in user_id.
  describe('the photostream slideshow swf', () => {
    it('should map a stream page path onto the stream player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=109615"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fphotos%2F77461019%40N07%2Fshow%2F&amp;page_show_back_url=%2Fphotos%2F77461019%40N07%2F&amp;user_id=77461019@N07&amp;jump_to="
          width="500"
          height="500"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/77461019@N07',
        src: 'https://embedr.flickr.com/photostreams/77461019@N07?width=500&height=500',
        url: 'https://www.flickr.com/photos/77461019@N07/',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // embedr takes only the NSID and nothing offline converts an alias into one, so an alias
    // goes through the page player instead, which serves both owner spellings.
    it('should mint the page player for an owner named by its path alias', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=109615"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fphotos%2Fdelightw%2Fshow%2F&amp;page_show_back_url=%2Fphotos%2Fdelightw%2F&amp;user_id=31652145@N08&amp;jump_to="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/delightw',
        src: 'https://www.flickr.com/photos/delightw/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/delightw/',
        width: 400,
        height: 300,
        author: 'delightw',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a group pool page path onto the group player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=109615"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fgroups%2F866523%40N20%2Fpool%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2F866523%40N20%2Fpool%2F&amp;group_id=866523@N20&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/866523@N20',
        src: 'https://embedr.flickr.com/groups/866523@N20?width=400&height=300',
        url: 'https://www.flickr.com/groups/866523@N20/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the user the config names when its page path names a tag', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=104087"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fphotos%2F39017545%40N02%2Ftags%2Ftumblrd%2Fshow%2F&amp;page_show_back_url=%2Fphotos%2F39017545%40N02%2Ftags%2Ftumblrd%2F&amp;user_id=39017545@N02&amp;tags=tumblrd&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/39017545@N02',
        src: 'https://embedr.flickr.com/photostreams/39017545@N02?width=400&height=300',
        url: 'https://www.flickr.com/photos/39017545@N02/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the legacy slideshow iframe', () => {
    it('should map a set slideshow onto the album player', async () => {
      const value = html`
        <iframe
          align="center"
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=72157639642975434&amp;detail=yes"
          frameborder="0"
          scrolling="no"
          width="600"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '35408001@N04/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434?width=600&height=500',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/72157639642975434',
        width: 600,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the dialog size when the carrier states a zero', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=72157639642975434&amp;detail=yes"
          width="0"
          height="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '35408001@N04/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434?width=400&height=300',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/72157639642975434',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The query is honoured half by half, so a stated half beside a default would render a box
    // nobody laid out. The pair moves together or not at all.
    it('should fall back to the dialog size when a zero leaves only one half stated', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=72157639642975434&amp;detail=yes"
          width="0"
          height="360"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '35408001@N04/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434?width=400&height=300',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/72157639642975434',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the dialog size when the carrier states one dimension only', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=72157639642975434&amp;detail=yes"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '35408001@N04/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434?width=400&height=300',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/72157639642975434',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A style pair under the carrier tier's ceiling is a shape rather than a box, so it reaches
    // here as nothing stated. This is what reading through `getEmbedSize` buys: the raw
    // dimension read would have minted `?width=88&height=21`.
    it('should fall back to the dialog size when the style pair is too small to be a box', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=72157639642975434&amp;detail=yes"
          style="width: 88px; height: 21px;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '35408001@N04/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434?width=400&height=300',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/72157639642975434',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a photostream slideshow onto the stream player', async () => {
      const value = html`
        <iframe
          loading="lazy"
          align="center"
          src="http://www.flickr.com/slideShow/index.gne?user_id=94397744@N03"
          width="500"
          height="500"
          frameBorder="0"
          scrolling="no"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/94397744@N03',
        src: 'https://embedr.flickr.com/photostreams/94397744@N03?width=500&height=500',
        url: 'https://www.flickr.com/photos/94397744@N03/',
        width: 500,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Without the owner the album page path cannot be built, but the platform's short url can:
    // it is the set id in base58, and flic.kr routes it to the owned page.
    it('should reach the album through the short url when the query names no user', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?group_id=&amp;user_id=&amp;set_id=72157613575700166&amp;text="
          align="center"
          scrolling="no"
          width="400"
          frameborder="0"
          height="400"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157613575700166',
        src: 'https://embedr.flickr.com/photosets/72157613575700166?width=400&height=400',
        url: 'https://flic.kr/s/aHsj9KxCzU',
        width: 400,
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A group only resolves by its NSID: the player 404s on a group's path alias but answers
    // the NSID with the whole pool slideshow, and the corpus spells group_id as an NSID.
    it('should map a group slideshow onto the group player', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?group_id=797770@N21&amp;user_id=&amp;set_id=&amp;text="
          align="middle"
          frameborder="0"
          height="400"
          scrolling="no"
          width="400"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/797770@N21',
        src: 'https://embedr.flickr.com/groups/797770@N21?width=400&height=400',
        url: 'https://www.flickr.com/groups/797770@N21/',
        width: 400,
        height: 400,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `group_id=197` appears in the corpus: a mangled value that is not an NSID and would mint
    // a 404, so it stays unresolved.
    it('should return undefined for a group id that is not an nsid', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/slideshow/index.gne?group_id=197"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // Flickr redirects this query to `/photos/17367418@N03%20/player`, which answers 404.
    it('should use a malformed user carrying a trailing space as written, even if the player answers an error', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=17367418@N03 &amp;tags=&amp;set_id=&amp;bgcolor=transparent"
          frameBorder="0"
          width="500px"
          scrolling="no"
          height="500px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/17367418@N03 ',
        src: 'https://www.flickr.com/photos/17367418@N03 /player?width=500&height=500',
        url: 'https://www.flickr.com/photos/17367418@N03 /',
        width: 500,
        height: 500,
        author: '17367418@N03 ',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The page an album's own "view slideshow" link opened, pasted as the iframe src. Flickr
  // refuses to be framed, so it is the same empty frame the legacy player leaves.
  describe('the album or stream page framed directly', () => {
    // The percentage width states no pixels, so the height beside it is half a pair and the
    // dialog size stands in for both.
    it('should map a framed album slideshow page onto the album player', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/photos/dublx/sets/72157623516208778/show/"
          style="height: 450px; width: 99%;"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'dublx/72157623516208778',
        src: 'https://embedr.flickr.com/photosets/72157623516208778?width=400&height=300',
        url: 'https://www.flickr.com/photos/dublx/sets/72157623516208778',
        width: 400,
        height: 300,
        author: 'dublx',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed album page without the show segment', async () => {
      const value = html`
        <iframe src="http://www.flickr.com/photos/53116286@N07/sets/72157627116531602/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '53116286@N07/72157627116531602',
        src: 'https://embedr.flickr.com/photosets/72157627116531602?width=400&height=300',
        url: 'https://www.flickr.com/photos/53116286@N07/sets/72157627116531602',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed album player onto the album player', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/112691023@N04/albums/72157704164072492/player"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '112691023@N04/72157704164072492',
        src: 'https://embedr.flickr.com/photosets/72157704164072492?width=400&height=300',
        url: 'https://www.flickr.com/photos/112691023@N04/sets/72157704164072492',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed photostream slideshow page onto the stream player', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/photos/33877051@N03/show/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/33877051@N03',
        src: 'https://embedr.flickr.com/photostreams/33877051@N03?width=400&height=300',
        url: 'https://www.flickr.com/photos/33877051@N03/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed photostream of an owner alias carrying a hyphen', async () => {
      const value = html`<iframe src="https://www.flickr.com/photos/e-governance/show/"></iframe>`
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/e-governance',
        src: 'https://www.flickr.com/photos/e-governance/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/e-governance/',
        width: 400,
        height: 300,
        author: 'e-governance',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Flickr answers 404 for `strictly.kev` and `-strictly-kev` beside the live `strictly-kev`.
    it('should use a malformed alias carrying a dot as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://www.flickr.com/photos/strictly.kev/show/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/strictly.kev',
        src: 'https://www.flickr.com/photos/strictly.kev/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/strictly.kev/',
        width: 400,
        height: 300,
        author: 'strictly.kev',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed alias opening with a hyphen as written, even if the player answers an error', async () => {
      const value = '<iframe src="https://www.flickr.com/photos/-strictly-kev/show/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/-strictly-kev',
        src: 'https://www.flickr.com/photos/-strictly-kev/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/-strictly-kev/',
        width: 400,
        height: 300,
        author: '-strictly-kev',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed photo owner carrying a dot as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.flickr.com/photos/strictly.kev/15753890338/player/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/strictly.kev/15753890338',
        src: 'https://www.flickr.com/photos/strictly.kev/15753890338/player/',
        url: 'https://www.flickr.com/photos/strictly.kev/15753890338/',
        author: 'strictly.kev',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed group pool slideshow page onto the group player', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/groups/1753363@N23/pool/show/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/1753363@N23',
        src: 'https://embedr.flickr.com/groups/1753363@N23?width=400&height=300',
        url: 'https://www.flickr.com/groups/1753363@N23/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The photo page answers `x-frame-options: SAMEORIGIN` and names no `/player/` segment.
    it('should return undefined for a photo page framed without the player segment', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/photos/12345678@N00/4362718294/"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // The player Flickr's own photo page opens, pasted as the iframe src. It sends no
  // frame-blocking header.
  describe('the single photo page player', () => {
    it('should name the photo the page player addresses', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/celesteh/15753890338/in/photostream/player/"
          width="500"
          height="97"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/celesteh/15753890338',
        src: 'https://www.flickr.com/photos/celesteh/15753890338/in/photostream/player/',
        url: 'https://www.flickr.com/photos/celesteh/15753890338/',
        width: 500,
        height: 97,
        author: 'celesteh',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The file url needs the secret beside the photo id.
    it('should compose the photo file when the path carries the secret', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/hankthetank/15637343340/player/2d3295bc6d"
          height="640"
          width="560"
          frameborder="0"
          allowfullscreen
          webkitallowfullscreen
          mozallowfullscreen
          oallowfullscreen
          msallowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/hankthetank/15637343340',
        src: 'https://www.flickr.com/photos/hankthetank/15637343340/player/2d3295bc6d',
        url: 'https://www.flickr.com/photos/hankthetank/15637343340/',
        thumbnail: 'https://live.staticflickr.com/0/15637343340_2d3295bc6d_b.jpg',
        width: 560,
        height: 640,
        author: 'hankthetank',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read an owner alias carrying a hyphen', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/kimim-photo/11616055053/player/c64480d113"
          height="480"
          width="640"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/kimim-photo/11616055053',
        src: 'https://www.flickr.com/photos/kimim-photo/11616055053/player/c64480d113',
        url: 'https://www.flickr.com/photos/kimim-photo/11616055053/',
        thumbnail: 'https://live.staticflickr.com/0/11616055053_c64480d113_b.jpg',
        width: 640,
        height: 480,
        author: 'kimim-photo',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed secret as written, even if the url answers an error', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/hankthetank/15637343340/player/2d3295bc6d%20"
          height="640"
          width="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/hankthetank/15637343340',
        src: 'https://www.flickr.com/photos/hankthetank/15637343340/player/2d3295bc6d%20',
        url: 'https://www.flickr.com/photos/hankthetank/15637343340/',
        thumbnail: 'https://live.staticflickr.com/0/15637343340_2d3295bc6d%20_b.jpg',
        width: 560,
        height: 640,
        author: 'hankthetank',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state no size when the carrier declares none', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/hankthetank/15591173770/player/542b374f55"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/hankthetank/15591173770',
        src: 'https://www.flickr.com/photos/hankthetank/15591173770/player/542b374f55',
        url: 'https://www.flickr.com/photos/hankthetank/15591173770/',
        thumbnail: 'https://live.staticflickr.com/0/15591173770_542b374f55_b.jpg',
        author: 'hankthetank',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should reach the photo through the short url when the owner is an underscore', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          scrolling="no"
          src="https://www.flickr.com/photos/_/54200280448/player/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2qzuB4W',
        src: 'https://www.flickr.com/photos/_/54200280448/player/',
        url: 'https://flic.kr/p/2qzuB4W',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fill no author when the owner is an nsid', async () => {
      const value = html`
        <iframe
          allowfullscreen=""
          frameborder="0"
          height="329"
          mozallowfullscreen=""
          msallowfullscreen=""
          oallowfullscreen=""
          src="http://www.flickr.com/photos/20899351@N00/3786844985/in/photolist-6LCz5M/player/"
          webkitallowfullscreen=""
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/20899351@N00/3786844985',
        src: 'http://www.flickr.com/photos/20899351@N00/3786844985/in/photolist-6LCz5M/player/',
        url: 'https://www.flickr.com/photos/20899351@N00/3786844985/',
        width: 640,
        height: 329,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  // The endpoint Flickr's embed script writes for a single photo. It names the photo alone, so
  // the owner the page url needs is nowhere in the carrier and the short url stands in for it.
  describe('the embedr single photo endpoint', () => {
    it('should reach the photo through the short url when the carrier names no owner', async () => {
      const value = html`
        <iframe
          title="con Petrona"
          style="width: 100%; height: 100%; position: absolute;"
          src="https://embedr.flickr.com/photos/5182695495"
          width="500"
          height="281"
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/8TYENT',
        src: 'https://embedr.flickr.com/photos/5182695495',
        url: 'https://flic.kr/p/8TYENT',
        width: 500,
        height: 281,
        title: 'con Petrona',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // A numeric segment in that position is a photo on embedr and an owner's photostream page on
    // the main host, which refuses framing.
    it('should return undefined for the same path on the main host', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/photos/2341623661"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  // Flickr's video swf, which no browser has run since 2021. Its flashvars name the photo and
  // the photo's secret and no page path at all, so the bare id addresses embedr's photo endpoint
  // and the pair composes the photo file with no network.
  describe('the video player object and embed pair', () => {
    it('should map the dead video player onto the photo the flashvars name', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          width="400"
          height="225"
          data="https://www.flickr.com/apps/video/stewart.swf?v=49235"
        >
          <param
            name="flashvars"
            value="intl_lang=en-us&amp;photo_secret=9f9359f01e&amp;photo_id=5123523742"
          />
          <param name="movie" value="https://www.flickr.com/apps/video/stewart.swf?v=49235" />
          <embed
            type="application/x-shockwave-flash"
            src="https://www.flickr.com/apps/video/stewart.swf?v=49235"
            flashvars="intl_lang=en-us&amp;photo_secret=9f9359f01e&amp;photo_id=5123523742"
            width="400"
            height="225"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/8NKp7f',
        src: 'https://embedr.flickr.com/photos/5123523742?width=400&height=225',
        url: 'https://flic.kr/p/8NKp7f',
        thumbnail: 'https://live.staticflickr.com/0/5123523742_9f9359f01e_b.jpg',
        width: 400,
        height: 225,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the config off an embed that carries it itself', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="https://www.flickr.com/apps/video/stewart.swf?v=49235"
          flashvars="intl_lang=en-us&amp;photo_secret=9f9359f01e&amp;photo_id=5123523742&amp;flickr_show_info_box=true"
          width="560"
          height="420"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/8NKp7f',
        src: 'https://embedr.flickr.com/photos/5123523742?width=560&height=420',
        url: 'https://flic.kr/p/8NKp7f',
        thumbnail: 'https://live.staticflickr.com/0/5123523742_9f9359f01e_b.jpg',
        width: 560,
        height: 420,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The photo file is named `{id}_{secret}`, so the id alone composes nothing.
    it('should drop the thumbnail when the flashvars name no secret', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf?v=49235"
          flashvars="intl_lang=en-us&amp;photo_id=2448291368"
          width="400"
          height="225"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4Jm8J9',
        src: 'https://embedr.flickr.com/photos/2448291368?width=400&height=225',
        url: 'https://flic.kr/p/4Jm8J9',
        width: 400,
        height: 225,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the dialog size when the carrier states none', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404&amp;photo_id=2448291368"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4Jm8J9',
        src: 'https://embedr.flickr.com/photos/2448291368?width=400&height=300',
        url: 'https://flic.kr/p/4Jm8J9',
        thumbnail: 'https://live.staticflickr.com/0/2448291368_3dfa305404_b.jpg',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should return undefined when the config names no set', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/slideshow/show.swf?v=143567"
          flashvars="offsite=true&amp;lang=en-us"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a carrier with no config at all', async () => {
      const value = '<embed src="https://www.flickr.com/apps/slideshow/show.swf?v=143567" />'

      expect(await extract(value)).toBeUndefined()
    })

    // The video swf names a photo and only a photo. No corpus carrier of it spells a page path,
    // and reading one would address an album through a player that never played one.
    it('should return undefined for a video carrier naming a page path and no photo', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="page_show_url=%2Fphotos%2Fbees%2Fsets%2F72157624341%2Fshow%2F"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a file that only starts with the video swf name', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf.bak"
          flashvars="photo_secret=3dfa305404&amp;photo_id=2448291368"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The photo id is minted into the endpoint and encoded as a number for the short url.
    it('should return undefined for a photo id that is not a number', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404&amp;photo_id=2448291368%2F..%2Fpricing"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a photo id that only ends in a number', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404&amp;photo_id=..%2F2448291368"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a video swf name under another path', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/photos/bees/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404&amp;photo_id=2448291368"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a page path with a segment between the owner and the set', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/slideshow/show.swf"
          flashvars="page_show_url=%2Fphotos%2F..%2F..%2Fsets%2F72157624341%2Fshow%2F"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed config user carrying an encoded slash as written, even if the player answers an error', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/slideshow/show.swf"
          flashvars="user_id=bees%2Fpricing"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/bees/pricing',
        src: 'https://www.flickr.com/photos/bees/pricing/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/bees/pricing/',
        width: 400,
        height: 300,
        author: 'bees/pricing',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed owner of a traversal segment as written, even if the url answers an error', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/slideshow/show.swf"
          flashvars="page_show_url=%2Fphotos%2F..%2Fsets%2F72157624341%2Fshow%2F"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: '../72157624341',
        src: 'https://embedr.flickr.com/photosets/72157624341?width=400&height=300',
        url: 'https://www.flickr.com/photos/../sets/72157624341',
        width: 400,
        height: 300,
        author: '..',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Only the slideshow swf and the video swf are read. Any other app under `/apps/` names no
    // subject this module can address.
    it('should return undefined for a flickr app that is neither player', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/galleries/show.swf?v=143567"
          flashvars="page_show_url=%2Fphotos%2Fbees%2Fsets%2F72157624341%2Fshow%2F"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a slideshow swf under another path', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/x/apps/slideshow/show.swf"
          flashvars="page_show_url=%2Fphotos%2Fbees%2Fsets%2F72157624341%2Fshow%2F"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a legacy slideshow path under another path', async () => {
      const value =
        '<iframe src="https://www.flickr.com/x/slideshow/index.gne?user_id=12345678@N00&amp;set_id=72157624341"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a legacy slideshow path followed by a trailing segment', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideshow/index.gne/extra?user_id=12345678@N00&amp;set_id=72157624341"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an album page under another path', async () => {
      const value =
        '<iframe src="https://www.flickr.com/x/photos/bees/sets/72157623516208778/show/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a photostream slideshow page under another path', async () => {
      const value = '<iframe src="https://www.flickr.com/x/photos/12345678@N04/show/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a photostream slideshow page followed by a trailing segment', async () => {
      const value = '<iframe src="https://www.flickr.com/photos/12345678@N04/show/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a group pool slideshow page under another path', async () => {
      const value = '<iframe src="https://www.flickr.com/x/groups/797770@N21/pool/show/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a group pool slideshow page followed by a trailing segment', async () => {
      const value =
        '<iframe src="https://www.flickr.com/groups/797770@N21/pool/show/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a photo page player under another path', async () => {
      const value =
        '<iframe src="https://www.flickr.com/x/photos/bees/2341623661/player/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed photo owner carrying an encoded slash as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.flickr.com/photos/kimim%2Fphoto/11616055053/player/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photos/kimim%2Fphoto/11616055053',
        src: 'https://www.flickr.com/photos/kimim%2Fphoto/11616055053/player/',
        url: 'https://www.flickr.com/photos/kimim%2Fphoto/11616055053/',
        author: 'kimim%2Fphoto',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a photo page player followed by a trailing segment', async () => {
      const value =
        '<iframe src="https://www.flickr.com/photos/bees/2341623661/player/7c99f48bbf/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an embedr photo under another path', async () => {
      const value = '<iframe src="https://embedr.flickr.com/x/photos/2341623661"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for an embedr photo followed by a trailing segment', async () => {
      const value = '<iframe src="https://embedr.flickr.com/photos/2341623661/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should use a malformed owner opening with an encoded slash as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?user_id=%2Fbees"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams//bees',
        src: 'https://www.flickr.com/photos//bees/player?width=400&height=300',
        url: 'https://www.flickr.com/photos//bees/',
        width: 400,
        height: 300,
        author: '/bees',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should use a malformed owner closing with an encoded traversal as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?user_id=bees%2F..%2Fx"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/bees/../x',
        src: 'https://www.flickr.com/photos/bees/../x/player?width=400&height=300',
        url: 'https://www.flickr.com/photos/bees/../x/',
        width: 400,
        height: 300,
        author: 'bees/../x',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a group id opening with an encoded traversal', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?group_id=..%2F797770@N21"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a group id closing with an encoded traversal', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?group_id=797770@N21%2F.."></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should return undefined for a carrier on another host', async () => {
      const value = html`
        <embed
          src="https://evil.test/apps/slideshow/show.swf"
          flashvars="page_show_url=%2Fphotos%2Fbees%2Fsets%2F72157624341%2Fshow%2F"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// The factory checks the host before calling in, so this guard is only reachable by calling
// the function itself, which is importable on its own.
describeForEachParser('flickrResolveEmbed', (parseHtml) => {
  it('should return undefined for a url that cannot be parsed', () => {
    const element = parseHtml('<embed></embed>').querySelector('embed') as Element

    expect(flickrResolveEmbed('https://[', element)).toBeUndefined()
  })
})

describeForEachParser('flickrEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrEmbedResolver)

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe
        loading="lazy"
        title="6 month Ampuversary"
        style="width: 100%; height: 100%; position: absolute;"
        src="https://embedr.flickr.com/photos/5405676135"
        width="500"
        height="281"
        frameborder="0"
        allow="autoplay; fullscreen"
        allowfullscreen
      ></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'flickr',
      id: 'p/9eFvbF',
      src: 'https://embedr.flickr.com/photos/5405676135',
      url: 'https://flic.kr/p/9eFvbF',
      width: 500,
      height: 281,
      title: '6 month Ampuversary',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
