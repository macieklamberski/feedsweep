import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { flickrAnchorEmbedResolver, flickrIframeEmbedResolver } from './flickr.js'

describeForEachParser('flickrIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrIframeEmbedResolver)

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
        id: 'photosets/72157637855752606',
        src: 'https://embedr.flickr.com/photosets/72157637855752606',
        url: 'https://www.flickr.com/photos/108534344@N02/sets/72157637855752606',
        width: 400,
        height: 300,
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
        id: 'photosets/72157615334609433',
        src: 'https://embedr.flickr.com/photosets/72157615334609433',
        url: 'https://www.flickr.com/photos/yotchan/sets/72157615334609433',
        width: 400,
        height: 300,
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
        id: 'photosets/72157635557420286',
        src: 'https://embedr.flickr.com/photosets/72157635557420286',
        url: 'https://www.flickr.com/photos/e-governance/sets/72157635557420286',
        width: 400,
        height: 300,
        author: 'e-governance',
      }

      expect(await extract(value)).toEqual(expected)
    })

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
        id: 'photosets/72157615334609433',
        src: 'https://embedr.flickr.com/photosets/72157615334609433',
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
        src: 'https://embedr.flickr.com/photostreams/77461019@N07',
        url: 'https://www.flickr.com/photos/77461019@N07/',
        width: 400,
        height: 300,
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
        src: 'https://www.flickr.com/photos/delightw/player',
        url: 'https://www.flickr.com/photos/delightw/',
        width: 400,
        height: 300,
        author: 'delightw',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should strip the whitespace around an owner named only in user_id', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=109615"
          flashvars="offsite=true&amp;user_id=17367418@N03 &amp;jump_to="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/17367418@N03',
        src: 'https://embedr.flickr.com/photostreams/17367418@N03',
        url: 'https://www.flickr.com/photos/17367418@N03/',
        width: 400,
        height: 300,
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
        src: 'https://embedr.flickr.com/groups/866523@N20',
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
        src: 'https://embedr.flickr.com/photostreams/39017545@N02',
        url: 'https://www.flickr.com/photos/39017545@N02/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should fall back to the user the config names when its tag is the word groups', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=104087"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fphotos%2F39017545%40N02%2Ftags%2Fgroups%2Fshow%2F&amp;page_show_back_url=%2Fphotos%2F39017545%40N02%2Ftags%2Fgroups%2F&amp;user_id=39017545@N02&amp;tags=groups&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/39017545@N02',
        src: 'https://embedr.flickr.com/photostreams/39017545@N02',
        url: 'https://www.flickr.com/photos/39017545@N02/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave a group pool named by its alias alone rather than mint the user beside it', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fgroups%2Ftorontophotowalks%2Fpool%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2Ftorontophotowalks%2Fpool%2F&amp;user_id=31652145@N08&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should map a group pool named by its alias onto the group player its NSID names', async () => {
      const value = html`
        <object
          height="300"
          width="400"
        >
          <param
            name="flashvars"
            value="offsite=true&amp;lang=es-us&amp;page_show_url=%2Fgroups%2Furbansketches%2Fpool%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2Furbansketches%2Fpool%2F&amp;group_id=568523@N21&amp;jump_to=&amp;start_index="
          >
          <embed
            type="application/x-shockwave-flash"
            src="http://www.flickr.com/apps/slideshow/show.swf?v=109615"
            allowFullScreen="true"
            flashvars="offsite=true&amp;lang=es-us&amp;page_show_url=%2Fgroups%2Furbansketches%2Fpool%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2Furbansketches%2Fpool%2F&amp;group_id=568523@N21&amp;jump_to=&amp;start_index="
            width="400"
            height="300"
          >
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/568523@N21',
        src: 'https://embedr.flickr.com/groups/568523@N21',
        url: 'https://www.flickr.com/groups/568523@N21/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a group pool named by its alias on the embed alone onto the group player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fgroups%2Foperationpaperstorm%2Fpool%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2Foperationpaperstorm%2Fpool%2F&amp;group_id=1614570@N22&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/1614570@N22',
        src: 'https://embedr.flickr.com/groups/1614570@N22',
        url: 'https://www.flickr.com/groups/1614570@N22/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a group pool path named by its alias under another path', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          flashvars="page_show_url=%2Fx%2Fgroups%2Foperationpaperstorm%2Fpool%2Fshow%2F&amp;group_id=1614570@N22"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should map a group pool named by its alias that starts on a photo onto the group player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fgroups%2Fafs85mmf14g%2Fpool%2Fshow%2Fwith%2F4959570037%2F&amp;page_show_back_url=%2Fgroups%2Fafs85mmf14g%2Fpool%2Fwith%2F4959570037%2F&amp;group_id=1461497@N24&amp;jump_to=4959570037&amp;start_index="
          width="400"
          height="300"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/1461497@N24',
        src: 'https://embedr.flickr.com/groups/1461497@N24',
        url: 'https://www.flickr.com/groups/1461497@N24/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should return undefined for a group pool path that starts on a photo and goes on', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          flashvars="page_show_url=%2Fgroups%2Fafs85mmf14g%2Fpool%2Fshow%2Fwith%2F4959570037%2Fextra%2F&amp;group_id=1461497@N24"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })

    // embedr's group player ignores a `tags` query and shows the whole pool.
    it('should leave a group pool filtered by a tag alone rather than mint the user beside it', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          src="http://www.flickr.com/apps/slideshow/show.swf?v=71649"
          allowFullScreen="true"
          flashvars="offsite=true&amp;lang=en-us&amp;page_show_url=%2Fgroups%2Ftorontophotowalks%2Fpool%2Ftags%2Ftopwbch%2Fshow%2F&amp;page_show_back_url=%2Fgroups%2Ftorontophotowalks%2Fpool%2Ftags%2Ftopwbch%2F&amp;group_id=1259833@N24&amp;user_id=31652145@N08&amp;tags=topwbch&amp;jump_to=&amp;start_index="
          width="400"
          height="300"
        >
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('set ids in a path', () => {
    it('should keep a decoded set id in one path segment', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?user_id=35408001@N04&amp;set_id=123%2F..%2F..%2Fphotos%2Fx"
          width="600"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/123/../../photos/x',
        src: 'https://embedr.flickr.com/photosets/123%2F..%2F..%2Fphotos%2Fx',
        url: 'https://www.flickr.com/photos/35408001@N04/sets/123%2F..%2F..%2Fphotos%2Fx',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the legacy slideshow iframe', () => {
    it('should drop the slash a feed glued onto the set id', async () => {
      const value = html`
        <iframe src="http://www.flickr.com/slideShow/index.gne?group_id=&amp;user_id=24006738@N07&amp;set_id=72157627734131040/&amp;text="></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157627734131040',
        src: 'https://embedr.flickr.com/photosets/72157627734131040',
        url: 'https://www.flickr.com/photos/24006738@N07/sets/72157627734131040',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The 600x500 box is the carrier's, which shallow handling does not read or fold into the src.
    it('should map a set slideshow onto the album player at the dialog size', async () => {
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
        id: 'photosets/72157639642975434',
        src: 'https://embedr.flickr.com/photosets/72157639642975434',
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
        src: 'https://embedr.flickr.com/photostreams/94397744@N03',
        url: 'https://www.flickr.com/photos/94397744@N03/',
        width: 400,
        height: 300,
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
        src: 'https://embedr.flickr.com/photosets/72157613575700166',
        url: 'https://flic.kr/s/aHsj9KxCzU',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should key an album the same with and without its owner', async () => {
      const owned =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?user_id=108534344@N02&amp;set_id=72157637855752606"></iframe>'
      const ownerless =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?set_id=72157637855752606"></iframe>'

      const ownedResult = await extract(owned)
      const ownerlessResult = await extract(ownerless)

      expect(ownedResult?.id).toBe('photosets/72157637855752606')
      expect(ownerlessResult?.id).toBe('photosets/72157637855752606')
      expect(ownerlessResult?.url).toBe('https://flic.kr/s/aHsjMK6fgG')
    })

    it('should use a malformed set id as written, even if the player answers an error', async () => {
      const value =
        '<iframe src="https://www.flickr.com/slideShow/index.gne?user_id=bees&amp;set_id=72157613575700166x"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157613575700166x',
        src: 'https://embedr.flickr.com/photosets/72157613575700166x',
        url: 'https://www.flickr.com/photos/bees/sets/72157613575700166x',
        width: 400,
        height: 300,
        author: 'bees',
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
        src: 'https://embedr.flickr.com/groups/797770@N21',
        url: 'https://www.flickr.com/groups/797770@N21/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // `group_id=197` appears in the corpus. The group player takes an NSID only.
    it('should return undefined for a group id that is not an nsid', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/slideshow/index.gne?group_id=197"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a group alias alone rather than mint the user beside it', async () => {
      const value = html`
        <iframe
          src="http://www.flickr.com/slideShow/index.gne?group_id=torontophotowalks&amp;user_id=31652145@N08&amp;set_id=&amp;text="
        ></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should trim a trailing space off a user read from the query', async () => {
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
        id: 'photostreams/17367418@N03',
        src: 'https://embedr.flickr.com/photostreams/17367418@N03',
        url: 'https://www.flickr.com/photos/17367418@N03/',
        width: 400,
        height: 300,
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
        id: 'photosets/72157623516208778',
        src: 'https://embedr.flickr.com/photosets/72157623516208778',
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
        id: 'photosets/72157627116531602',
        src: 'https://embedr.flickr.com/photosets/72157627116531602',
        url: 'https://www.flickr.com/photos/53116286@N07/sets/72157627116531602',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the set id as its digit run when the path runs on past it', async () => {
      const value = html`
        <iframe src="http://www.flickr.com/photos/53116286@N07/sets/72157627116531602x/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157627116531602',
        src: 'https://embedr.flickr.com/photosets/72157627116531602',
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
        id: 'photosets/72157704164072492',
        src: 'https://embedr.flickr.com/photosets/72157704164072492',
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
        src: 'https://embedr.flickr.com/photostreams/33877051@N03',
        url: 'https://www.flickr.com/photos/33877051@N03/',
        width: 400,
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map a framed photostream of an owner alias carrying a hyphen', async () => {
      const value = '<iframe src="https://www.flickr.com/photos/e-governance/show/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/e-governance',
        src: 'https://www.flickr.com/photos/e-governance/player',
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
        src: 'https://www.flickr.com/photos/strictly.kev/player',
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
        src: 'https://www.flickr.com/photos/-strictly-kev/player',
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
        id: 'p/q17NJW',
        src: 'https://www.flickr.com/photos/strictly.kev/15753890338/player/',
        url: 'https://www.flickr.com/photos/strictly.kev/15753890338/',
        author: 'strictly.kev',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a group NSID with a three-digit suffix as written', async () => {
      const value = html`
        <iframe src="https://www.flickr.com/groups/1753363@N230/pool/show/"></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/1753363@N230',
        src: 'https://embedr.flickr.com/groups/1753363@N230',
        url: 'https://www.flickr.com/groups/1753363@N230/',
        width: 400,
        height: 300,
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
        src: 'https://embedr.flickr.com/groups/1753363@N23',
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
        id: 'p/q17NJW',
        src: 'https://www.flickr.com/photos/celesteh/15753890338/player/',
        url: 'https://www.flickr.com/photos/celesteh/15753890338/',
        author: 'celesteh',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The file url needs the secret beside the photo id. The player serves the same page without it.
    it('should compose the photo file from the secret and leave it out of the player', async () => {
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
        id: 'p/pPPtnW',
        src: 'https://www.flickr.com/photos/hankthetank/15637343340/player/',
        url: 'https://www.flickr.com/photos/hankthetank/15637343340/',
        thumbnail: 'https://live.staticflickr.com/0/15637343340_2d3295bc6d_b.jpg',
        author: 'hankthetank',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave out the album the arrows walk through', async () => {
      const value = html`
        <iframe
          width="500"
          height="375"
          frameborder="0"
          src="https://www.flickr.com/photos/jackieboyslim/8740425686/in/set-72157633482544489/player/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/ejmY3A',
        src: 'https://www.flickr.com/photos/jackieboyslim/8740425686/player/',
        url: 'https://www.flickr.com/photos/jackieboyslim/8740425686/',
        author: 'jackieboyslim',
        ratio: '4/3',
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
        id: 'p/iGtjtg',
        src: 'https://www.flickr.com/photos/kimim-photo/11616055053/player/',
        url: 'https://www.flickr.com/photos/kimim-photo/11616055053/',
        thumbnail: 'https://live.staticflickr.com/0/11616055053_c64480d113_b.jpg',
        author: 'kimim-photo',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should trim a trailing space off a secret', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/hankthetank/15637343340/player/2d3295bc6d%20"
          height="640"
          width="560"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/pPPtnW',
        src: 'https://www.flickr.com/photos/hankthetank/15637343340/player/',
        url: 'https://www.flickr.com/photos/hankthetank/15637343340/',
        thumbnail: 'https://live.staticflickr.com/0/15637343340_2d3295bc6d_b.jpg',
        author: 'hankthetank',
        ratio: '4/3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state 4/3 when the carrier declares no size', async () => {
      const value = html`
        <iframe
          src="https://www.flickr.com/photos/hankthetank/15591173770/player/542b374f55"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/pKJQLS',
        src: 'https://www.flickr.com/photos/hankthetank/15591173770/player/',
        url: 'https://www.flickr.com/photos/hankthetank/15591173770/',
        thumbnail: 'https://live.staticflickr.com/0/15591173770_542b374f55_b.jpg',
        author: 'hankthetank',
        ratio: '4/3',
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
        ratio: '4/3',
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
        id: 'p/6LCz5M',
        src: 'https://www.flickr.com/photos/20899351@N00/3786844985/player/',
        url: 'https://www.flickr.com/photos/20899351@N00/3786844985/',
        ratio: '4/3',
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
        title: 'con Petrona',
        ratio: '4/3',
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
        src: 'https://embedr.flickr.com/photos/5123523742?secret=9f9359f01e&width=640&height=360',
        url: 'https://flic.kr/p/8NKp7f',
        thumbnail: 'https://live.staticflickr.com/0/5123523742_9f9359f01e_b.jpg',
        ratio: '16/9',
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
        src: 'https://embedr.flickr.com/photos/5123523742?secret=9f9359f01e&width=640&height=360',
        url: 'https://flic.kr/p/8NKp7f',
        thumbnail: 'https://live.staticflickr.com/0/5123523742_9f9359f01e_b.jpg',
        ratio: '16/9',
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
        src: 'https://embedr.flickr.com/photos/2448291368?width=640&height=360',
        url: 'https://flic.kr/p/4Jm8J9',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ask the video player for its 16:9 box when the carrier states none', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404&amp;photo_id=2448291368"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4Jm8J9',
        src: 'https://embedr.flickr.com/photos/2448291368?secret=3dfa305404&width=640&height=360',
        url: 'https://flic.kr/p/4Jm8J9',
        thumbnail: 'https://live.staticflickr.com/0/2448291368_3dfa305404_b.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a decoded secret carrying a separator in one thumbnail path segment', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404%2F..%2Fx&amp;photo_id=2448291368"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4Jm8J9',
        src: 'https://embedr.flickr.com/photos/2448291368?secret=3dfa305404/../x&width=640&height=360',
        url: 'https://flic.kr/p/4Jm8J9',
        thumbnail: 'https://live.staticflickr.com/0/2448291368_3dfa305404%2F..%2Fx_b.jpg',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep a decoded secret carrying an ampersand in one query value', async () => {
      const value = html`
        <embed
          src="https://www.flickr.com/apps/video/stewart.swf"
          flashvars="photo_secret=3dfa305404%26gp%3Dx&amp;photo_id=2448291368"
        />
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4Jm8J9',
        src: 'https://embedr.flickr.com/photos/2448291368?secret=3dfa305404%26gp=x&width=640&height=360',
        url: 'https://flic.kr/p/4Jm8J9',
        thumbnail: 'https://live.staticflickr.com/0/2448291368_3dfa305404&gp=x_b.jpg',
        ratio: '16/9',
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
        src: 'https://www.flickr.com/photos/bees%2Fpricing/player',
        url: 'https://www.flickr.com/photos/bees%2Fpricing/',
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
        id: 'photosets/72157624341',
        src: 'https://embedr.flickr.com/photosets/72157624341',
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
        id: 'p/iGtjtg',
        src: 'https://www.flickr.com/photos/kimim%2Fphoto/11616055053/player/',
        url: 'https://www.flickr.com/photos/kimim%2Fphoto/11616055053/',
        author: 'kimim/photo',
        ratio: '4/3',
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
        src: 'https://www.flickr.com/photos/%2Fbees/player',
        url: 'https://www.flickr.com/photos/%2Fbees/',
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
        src: 'https://www.flickr.com/photos/bees%2F..%2Fx/player',
        url: 'https://www.flickr.com/photos/bees%2F..%2Fx/',
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

describeForEachParser('flickrIframeEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrIframeEmbedResolver)

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
      title: '6 month Ampuversary',
      ratio: '4/3',
    }

    expect(await extract(value)).toEqual(expected)
  })
})

describeForEachParser('flickrAnchorEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, flickrAnchorEmbedResolver)

  describe('the photo anchor', () => {
    it('should map the photo page onto the embedr photo player, sized as the image', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/201411445@N05/53996765444/in/dateposted-public"
          title="Sims2EP9 2022-06-28 21-46-04-87"
        >
          <img
            alt="Sims2EP9 2022-06-28 21-46-04-87"
            height="360"
            src="https://live.staticflickr.com/65535/53996765444_ce07136ea1_h.jpg"
            width="640"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2qgvx9y',
        src: 'https://embedr.flickr.com/photos/53996765444?secret=ce07136ea1',
        url: 'https://www.flickr.com/photos/201411445@N05/53996765444/',
        thumbnail: 'https://live.staticflickr.com/65535/53996765444_ce07136ea1_h.jpg',
        width: 640,
        height: 360,
        title: 'Sims2EP9 2022-06-28 21-46-04-87',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the owner alias as the author', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/bees/2362225867/"
        >
          <img
            src="https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg"
            width="1024"
            height="768"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/4AK2sc',
        src: 'https://embedr.flickr.com/photos/2362225867?secret=4a87ab8baf',
        url: 'https://www.flickr.com/photos/bees/2362225867/',
        thumbnail: 'https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg',
        width: 1024,
        height: 768,
        author: 'bees',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the image alt as the title when the anchor states none', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/201411445@N05/53996765444/in/dateposted-public"
        >
          <img
            alt="Sims2EP9 2022-06-28 21-46-04-87"
            height="360"
            src="https://live.staticflickr.com/65535/53996765444_ce07136ea1_h.jpg"
            width="640"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2qgvx9y',
        src: 'https://embedr.flickr.com/photos/53996765444?secret=ce07136ea1',
        url: 'https://www.flickr.com/photos/201411445@N05/53996765444/',
        thumbnail: 'https://live.staticflickr.com/65535/53996765444_ce07136ea1_h.jpg',
        width: 640,
        height: 360,
        title: 'Sims2EP9 2022-06-28 21-46-04-87',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the photo size when the image states no height', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/lydiaabate/44717108900/in/dateposted-public/"
        >
          <img
            src="https://farm8.staticflickr.com/7877/44717108900_029fbfbf69_o.jpg"
            width="800"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2b8uSyd',
        src: 'https://embedr.flickr.com/photos/44717108900?secret=029fbfbf69',
        url: 'https://www.flickr.com/photos/lydiaabate/44717108900/',
        thumbnail: 'https://farm8.staticflickr.com/7877/44717108900_029fbfbf69_o.jpg',
        ratio: '4/3',
        author: 'lydiaabate',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send the secret a private photo needs', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/goaliej54/22404841959/in/photostream/"
          title="20151031_172747"
        >
          <img
            alt="20151031_172747"
            height="500"
            src="https://farm6.staticflickr.com/5662/22404841959_8bd221e41f.jpg"
            width="333"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/A8QEWB',
        src: 'https://embedr.flickr.com/photos/22404841959?secret=8bd221e41f',
        url: 'https://www.flickr.com/photos/goaliej54/22404841959/',
        thumbnail: 'https://farm6.staticflickr.com/5662/22404841959_8bd221e41f.jpg',
        width: 333,
        height: 500,
        title: '20151031_172747',
        author: 'goaliej54',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the secret from an image file with the zz flag', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/robert_trudeau/2749653854/in/photostream/"
          title="Harriet Dehan, Shreveport"
        >
          <img
            src="https://farm4.staticflickr.com/3193/2749653854_014489cdac_z.jpg?zz=1"
            width="426"
            height="640"
            alt="Harriet Dehan, Shreveport"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/5bYGi5',
        src: 'https://embedr.flickr.com/photos/2749653854?secret=014489cdac',
        url: 'https://www.flickr.com/photos/robert_trudeau/2749653854/',
        thumbnail: 'https://farm4.staticflickr.com/3193/2749653854_014489cdac_z.jpg?zz=1',
        width: 426,
        height: 640,
        title: 'Harriet Dehan, Shreveport',
        author: 'robert_trudeau',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send the secret of an image that names another photo', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/magnacasta/29729137680/in/album-72157671173657274/"
          title="Encruzado Day by #daowinelover 2016"
        >
          <img
            alt="Real Companhia Velha - Open Doors 260 anos"
            src="https://c8.staticflickr.com/8/7770/29396601663_0de516a68e_k.jpg"
            style="width: 320px; height: 427px;"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/Mi4ATj',
        src: 'https://embedr.flickr.com/photos/29729137680?secret=0de516a68e',
        url: 'https://www.flickr.com/photos/magnacasta/29729137680/',
        thumbnail: 'https://c8.staticflickr.com/8/7770/29396601663_0de516a68e_k.jpg',
        ratio: '4/3',
        title: 'Encruzado Day by #daowinelover 2016',
        author: 'magnacasta',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send the secret of a 4k file, which names its own', async () => {
      const value = html`
        <a
          title="Velocity 2021"
          href="https://www.flickr.com/photos/romanista/51444344145/in/album-72157719814802262/"
          data-flickr-embed="true"
        >
          <img
            src="https://live.staticflickr.com/65535/51444344145_83b0ac47ab_4k.jpg"
            alt="Velocity 2021"
            width="449"
            height="337"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2mnXHdM',
        src: 'https://embedr.flickr.com/photos/51444344145?secret=83b0ac47ab',
        url: 'https://www.flickr.com/photos/romanista/51444344145/',
        thumbnail: 'https://live.staticflickr.com/65535/51444344145_83b0ac47ab_4k.jpg',
        width: 449,
        height: 337,
        title: 'Velocity 2021',
        author: 'romanista',
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Constructed: no real file name holds a url separator in its secret.
    it('should send no secret for a file name with a separator in the secret', async () => {
      const value = html`
        <a
          title="Velocity 2021"
          href="https://www.flickr.com/photos/romanista/51444344145/in/album-72157719814802262/"
          data-flickr-embed="true"
        >
          <img
            src="https://live.staticflickr.com/65535/51444344145_83b0ac47ab%3Fx.jpg"
            width="449"
            height="337"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2mnXHdM',
        src: 'https://embedr.flickr.com/photos/51444344145',
        url: 'https://www.flickr.com/photos/romanista/51444344145/',
        thumbnail: 'https://live.staticflickr.com/65535/51444344145_83b0ac47ab%3Fx.jpg',
        width: 449,
        height: 337,
        title: 'Velocity 2021',
        author: 'romanista',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should send no secret for an image behind a resizing proxy', async () => {
      const value = html`
        <a
          title="31st anniversary of the foundation of the House of Mercy San Martin de Tours"
          href="https://www.flickr.com/photos/verboencarnado/54396892126/in/dateposted-public/"
          data-flickr-embed="true"
        >
          <img
            src="https://i0.wp.com/live.staticflickr.com/65535/54396892126_caa73b7c88_b.jpg?resize=1024%2C683&amp;ssl=1"
            width="1024"
            height="683"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2qSShSs',
        src: 'https://embedr.flickr.com/photos/54396892126',
        url: 'https://www.flickr.com/photos/verboencarnado/54396892126/',
        thumbnail:
          'https://i0.wp.com/live.staticflickr.com/65535/54396892126_caa73b7c88_b.jpg?resize=1024%2C683&ssl=1',
        width: 1024,
        height: 683,
        title: '31st anniversary of the foundation of the House of Mercy San Martin de Tours',
        author: 'verboencarnado',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the album anchor', () => {
    it('should map the albums page onto the embedr album player, sized as the image', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/riatpennstate/albums/72177720327772894"
        >
          <img
            src="https://live.staticflickr.com/65535/54676434565_0cf2dcfa4c_h.jpg"
            width="1600"
            height="1200"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72177720327772894',
        src: 'https://embedr.flickr.com/photosets/72177720327772894',
        url: 'https://www.flickr.com/photos/riatpennstate/sets/72177720327772894',
        thumbnail: 'https://live.staticflickr.com/65535/54676434565_0cf2dcfa4c_h.jpg',
        width: 1600,
        height: 1200,
        author: 'riatpennstate',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the anchor title over the image alt', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/197910129@N04/albums/72177720334022027/"
          title="33rd Annual Celebration of Mundelein - 2026 - Photographer Photos by University of Saint Mary of the Lake, on Flickr"
        >
          <img
            src="https://live.staticflickr.com/65535/55314222738_99e28970f0_z.jpg"
            width="800"
            height="600"
            alt="DSC_6044"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72177720334022027',
        src: 'https://embedr.flickr.com/photosets/72177720334022027',
        url: 'https://www.flickr.com/photos/197910129@N04/sets/72177720334022027',
        thumbnail: 'https://live.staticflickr.com/65535/55314222738_99e28970f0_z.jpg',
        width: 800,
        height: 600,
        title:
          '33rd Annual Celebration of Mundelein - 2026 - Photographer Photos by University of Saint Mary of the Lake, on Flickr',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should map the sets page onto the same album player', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/dublx/sets/72157623516208778"
        >
          <img
            src="https://live.staticflickr.com/2770/4390312561_34843547fe_b.jpg"
            width="800"
            height="600"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157623516208778',
        src: 'https://embedr.flickr.com/photosets/72157623516208778',
        url: 'https://www.flickr.com/photos/dublx/sets/72157623516208778',
        thumbnail: 'https://live.staticflickr.com/2770/4390312561_34843547fe_b.jpg',
        width: 800,
        height: 600,
        author: 'dublx',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the image size out of the src', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/98447946@N02/albums/72177720326463417"
          title="CNS Research Review 2025"
        >
          <img
            src="https://live.staticflickr.com/65535/54552464381_645a03ee21_h.jpg"
            width="1600"
            height="1200"
            alt="CNS Research Review 2025"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72177720326463417',
        src: 'https://embedr.flickr.com/photosets/72177720326463417',
        url: 'https://www.flickr.com/photos/98447946@N02/sets/72177720326463417',
        thumbnail: 'https://live.staticflickr.com/65535/54552464381_645a03ee21_h.jpg',
        width: 1600,
        height: 1200,
        title: 'CNS Research Review 2025',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should size the placeholder as the slideshow when the image states none', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/hanskellner/albums/72157628665527009"
        >
          <img src="https://live.staticflickr.com/7010/6613392169_0f23d79b04_b.jpg" />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photosets/72157628665527009',
        src: 'https://embedr.flickr.com/photosets/72157628665527009',
        url: 'https://www.flickr.com/photos/hanskellner/sets/72157628665527009',
        thumbnail: 'https://live.staticflickr.com/7010/6613392169_0f23d79b04_b.jpg',
        width: 400,
        height: 300,
        author: 'hanskellner',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the group pool anchor', () => {
    it('should map the pool onto the embedr group player', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/groups/340946@N24/pool/"
        >
          <img
            src="https://live.staticflickr.com/65535/55319721849_b8908b10a5.jpg"
            width="800"
            height="600"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'groups/340946@N24',
        src: 'https://embedr.flickr.com/groups/340946@N24',
        url: 'https://www.flickr.com/groups/340946@N24/',
        thumbnail: 'https://live.staticflickr.com/65535/55319721849_b8908b10a5.jpg',
        width: 800,
        height: 600,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // Constructed carrier: no feed writes a tag pool anchor. embedr shows the whole pool for it.
    it('should leave a pool filtered by a tag alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/groups/340946@N24/pool/tags/sunset/"
        >
          <img
            src="https://live.staticflickr.com/65535/55319721849_b8908b10a5.jpg"
            width="800"
            height="600"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the photostream anchor', () => {
    it('should map an NSID owner page onto the embedr photostream player', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/48340645@N05"
        >
          <img
            src="https://live.staticflickr.com/65535/53196963117_14994bda8c_z.jpg"
            width="640"
            height="480"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'photostreams/48340645@N05',
        src: 'https://embedr.flickr.com/photostreams/48340645@N05',
        url: 'https://www.flickr.com/photos/48340645@N05/',
        thumbnail: 'https://live.staticflickr.com/65535/53196963117_14994bda8c_z.jpg',
        width: 640,
        height: 480,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave an alias owner page as a link', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/govph/"
        >
          <img
            src="https://live.staticflickr.com/478/20453022001_f5fc8978fe_b.jpg"
            width="640"
            height="452"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // Constructed carrier: the script maps an owner's favorites page to another item.
    it('should leave a page under an NSID owner alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/48340645@N05/favorites"
        >
          <img
            src="https://live.staticflickr.com/65535/53196963117_14994bda8c_z.jpg"
            width="640"
            height="480"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should leave an anchor whose embed flag is false alone', async () => {
      const value = html`
        <a
          data-flickr-embed="false"
          href="https://www.flickr.com/photos/claremansell/24065618152/in/dateposted/"
        >
          <img
            src="https://farm2.staticflickr.com/1582/24065618152_18ec8b499c_n.jpg"
            width="320"
            height="214"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave an image the script keeps as a thumbnail alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/__u___/51104880060/in/datetaken-public/"
        >
          <img
            src="https://live.staticflickr.com/65535/51104880060_362beba670_w.jpg"
            width="144"
            height="400"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave an image exactly as wide as a thumbnail alone', async () => {
      const value = html`
        <a
          title="Patty Larkin and her Olsons"
          href="https://www.flickr.com/photos/thomconlon/55451163/in/photolist-5UcGx-oZV3A-oZV3k-7QHE29-9i3pDw-9i3q47-9hZjfB-9i3qEm-9hFCas-9hCwc8-9i3pLJ-4vrXLc-9i3pxQ-9i3p3b-9hZk9p-9hZj3e-9hZkr6-9hZj8p-pyw2H-9hZkdp-9hZjKP-9hZk3p-9hZjkF-5rzDpg-9i3qMj-5rzCKB-9i3oX3-9i3pYS-4vrWzz-iab1Sq-9i3oQC-5rDX59-4vw3u7-4vw3dA-5rDXnm-4vrWNv-5rDWxj-5rDWcd-5rzBha-5rzAT6-5rDWiW-5rDVX5-7VMkXK-5rzDDr-5rDY8f-pyw7S-pyzHR-4vw2Zh-pywu2-pywQi"
          data-flickr-embed="true"
        >
          <img
            src="https://c4.staticflickr.com/1/27/55451163_8121b38288_q.jpg"
            alt="Patty Larkin and her Olsons"
            width="150"
            height="150"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should claim an image one pixel wider than a thumbnail', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/__u___/51104880060/in/datetaken-public/"
        >
          <img
            src="https://live.staticflickr.com/65535/51104880060_362beba670_w.jpg"
            width="151"
            height="400"
          />
        </a>
      `
      const expected: EmbedResolverResult = {
        provider: 'flickr',
        id: 'p/2kRXSnJ',
        src: 'https://embedr.flickr.com/photos/51104880060?secret=362beba670',
        url: 'https://www.flickr.com/photos/__u___/51104880060/',
        thumbnail: 'https://live.staticflickr.com/65535/51104880060_362beba670_w.jpg',
        width: 151,
        height: 400,
        author: '__u___',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should leave an anchor with no image alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/bees/2362225867/"
        >Bacon Lollys</a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the photo path', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://evil.test/photos/bees/2362225867/"
        >
          <img
            src="https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg"
            width="1024"
            height="768"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the pool path below another segment', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/x/groups/340946@N24/pool/"
        >
          <img
            src="https://live.staticflickr.com/65535/55319721849_b8908b10a5.jpg"
            width="800"
            height="600"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the owner path below another segment', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/x/photos/48340645@N05"
        >
          <img
            src="https://live.staticflickr.com/65535/53196963117_14994bda8c_z.jpg"
            width="640"
            height="480"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the photo path below another segment', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/x/photos/bees/2362225867/"
        >
          <img
            src="https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg"
            width="1024"
            height="768"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a photo id followed by a stray quote', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href=https://www.flickr.com/photos/mgmax/55066413117"
          title="IMG_0721"
        >
          <img
            src="https://live.staticflickr.com/65535/55066413117_bebd2b07c0_z.jpg"
            width="640"
            height="480"
            alt="IMG_0721"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('anchors the script turns into nothing', () => {
    it('should leave a flic.kr short link alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://flic.kr/p/2oFUpVc"
        >
          <img
            src="https://live.staticflickr.com/65535/52960111065_07008a79c6_b.jpg"
            width="3000"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('kinds the script plays that no key covers yet', () => {
    it('should leave a gallery alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/corinnedangas/galleries/72157632398296719"
        >
          <img
            src="https://live.staticflickr.com/7027/6762140925_76153f807a_z.jpg"
            width="100%"
            height="auto"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should leave a guest pass alone', async () => {
      const value = html`
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/gp/nanpalmero/8zMGCx"
        >
          <img
            src="https://farm2.staticflickr.com/1733/27846819297_026fde2072_z.jpg"
            width="640"
            height="281"
          />
        </a>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// www.flickr.com serves a photo's video file on its play route, so an enclosure there reaches the
// resolver.
describeForEachParser('flickr through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should turn the embed code into a placeholder with the image as its poster', async () => {
    const value = html`
      <a
        data-flickr-embed="true"
        href="https://www.flickr.com/photos/bees/2362225867/"
      >
        <img
          src="https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg"
          width="1024"
          height="768"
        />
      </a>
      <script async src="https://embedr.flickr.com/assets/client-code.js"></script>
    `
    const expected = html`
      <div
        data-embed-provider="flickr"
        data-embed-id="p/4AK2sc"
        data-embed-src="https://embedr.flickr.com/photos/2362225867?secret=4a87ab8baf"
        data-embed-url="https://www.flickr.com/photos/bees/2362225867/"
        data-embed-thumbnail="https://live.staticflickr.com/3040/2362225867_4a87ab8baf_b.jpg"
        data-embed-width="1024"
        data-embed-height="768"
        data-embed-author="bees"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // Constructed carrier: no feed lists a Flickr video as an enclosure. The item is the real 360p
  // video the media resolver's own test pins, so the case plays.
  it('should leave a flickr video enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://www.flickr.com/photos/naturewoman/14392168940/play/360p/61d915cc45/',
        type: 'video/mp4',
      },
    ]

    const expected = html`
      <video data-enclosure="" controls src="https://www.flickr.com/photos/naturewoman/14392168940/play/360p/61d915cc45/"></video>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
