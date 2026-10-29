import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildLiteVideoEmbeds } from './rebuildLiteVideoEmbeds.js'

describeForEachParser('rebuildLiteVideoEmbeds', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildLiteVideoEmbeds(baseContext)])
  }

  it('should rebuild an iframe from a lite-youtube element', async () => {
    const value = '<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>'
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild an iframe from a lite-vimeo element', async () => {
    const value = '<lite-vimeo videoid="76979871"></lite-vimeo>'
    const expected = '<iframe src="https://player.vimeo.com/video/76979871"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a lite-youtube element with no videoid alone', async () => {
    const value = '<lite-youtube></lite-youtube>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a lite-youtube element with an empty videoid alone', async () => {
    const value = '<lite-youtube videoid=""></lite-youtube>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should recover a lite-youtube id from quotes the feed escaped twice', async () => {
    const value = '<lite-youtube videoid=\\"k_3pRxdv-cI\\"></lite-youtube>'
    const expected = '<iframe src="https://www.youtube.com/embed/k_3pRxdv-cI"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should recover a lite-vimeo id from quotes the feed escaped twice', async () => {
    const value = '<lite-vimeo videoid=\\"364402896\\"></lite-vimeo>'
    const expected = '<iframe src="https://player.vimeo.com/video/364402896"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should build the player from a videoid as written, without checking it', async () => {
    const value = '<lite-youtube videoid="not-a-video"></lite-youtube>'
    const expected = '<iframe src="https://www.youtube.com/embed/not-a-video"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a lite-vimeo videoid holding a slash inside one path segment', async () => {
    const value = '<lite-vimeo videoid="../76979871"></lite-vimeo>'
    const expected = '<iframe src="https://player.vimeo.com/video/..%2F76979871"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a youtube start offset into a query param', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        start="90"
      ></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=90"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a vimeo start offset into a time fragment', async () => {
    const value = html`
      <lite-vimeo
        videoid="76979871"
        start="90"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/76979871#t=90s"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a vimeo start in the player form as written', async () => {
    const value = html`
      <lite-vimeo
        videoid="364402896"
        start="5m30s"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/364402896#t=5m30s"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a vimeo start in seconds with its unit as written', async () => {
    const value = html`
      <lite-vimeo
        videoid="364402896"
        start="63s"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/364402896#t=63s"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the videohash of an unlisted vimeo video into h', async () => {
    const value = html`
      <lite-vimeo
        videoid="364402896"
        videohash="2e5fd2d6a1"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/364402896?h=2e5fd2d6a1"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the videohash alongside the start', async () => {
    const value = html`
      <lite-vimeo
        videoid="364402896"
        videohash="2e5fd2d6a1"
        start="90"
      ></lite-vimeo>
    `
    const expected = html`
      <iframe src="https://player.vimeo.com/video/364402896?h=2e5fd2d6a1#t=90s"></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should produce a vimeo placeholder for an unlisted video end to end', async () => {
    const value = html`
      <lite-vimeo
        videoid="364402896"
        videohash="2e5fd2d6a1"
      ></lite-vimeo>
    `
    const expected = html`
      <div
        data-embed-url="https://vimeo.com/364402896/2e5fd2d6a1"
        data-embed-src="https://player.vimeo.com/video/364402896?h=2e5fd2d6a1"
        data-embed-ratio="16/9"
        data-embed-provider="vimeo"
        data-embed-id="364402896:2e5fd2d6a1"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should carry the videoStartAt of lite-youtube into the start param', async () => {
    const value = html`
      <lite-youtube
        videoid="thNyy5eYfbc"
        videotitle="High performance web user interfaces - Google I/O 2016"
        videoStartAt="475"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/thNyy5eYfbc?start=475"
        title="High performance web user interfaces - Google I/O 2016"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a videoStartAt of 0 as written', async () => {
    const value = html`
      <lite-youtube
        videoid="8ppTpiG0TXM"
        videoStartAt="0"
      ></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/8ppTpiG0TXM?start=0"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a videoStartAt in clock form as written', async () => {
    const value = html`
      <lite-youtube
        videoid="t3smBkiGUWw"
        videoStartAt="1:01"
      ></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/t3smBkiGUWw?start=1:01"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a videoStartAt on lite-vimeo unread', async () => {
    const value = html`
      <lite-vimeo
        videoid="76979871"
        videoStartAt="90"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/76979871"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should use a malformed start as written, as one parameter', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        start="10&autoplay=1"
      ></lite-youtube>
    `
    const expected =
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=10%26autoplay=1"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the whitelisted half of params', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        params="start=10"
      ></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=10"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // The attribute names the same option more specifically than the query string does.
  it('should let a start attribute win over the one inside params', async () => {
    const value = html`
      <lite-youtube videoid="dQw4w9WgXcQ" start="90" params="start=10"></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=90"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // Anything the iframe path would not carry cannot arrive this way either.
  it('should drop a param outside the whitelist', async () => {
    const value = html`
      <lite-youtube videoid="dQw4w9WgXcQ" params="start=10&autoplay=1"></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=10"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a params offset through the default pipeline', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        params="start=10"
      ></lite-youtube>
    `
    const expected = html`
      <div
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=10"
      >
      </div>
    `

    expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
  })

  it('should carry the poster lite-youtube-embed paints from style', async () => {
    const value = html`
      <lite-youtube
        videoid="DrqgnmcDvpk"
        style="background-image: url('https://example.com/images2026/IberiaStarlink.webp');"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/DrqgnmcDvpk"
        data-thumbnail="https://example.com/images2026/IberiaStarlink.webp"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry a YouTube poster of the quality the author picked in style', async () => {
    const value = html`
      <lite-youtube
        videoid="mSmMJQdEiVo"
        style="background-image: url('https://i.ytimg.com/vi/mSmMJQdEiVo/maxresdefault.jpg');"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/mSmMJQdEiVo"
        data-thumbnail="https://i.ytimg.com/vi/mSmMJQdEiVo/maxresdefault.jpg"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the poster lite-youtube shows from its image slot', async () => {
    const value = html`
      <lite-youtube
        videoid="EDzZjBXOI8U"
        videotitle="Elon Musk's Grok and the Mass Undressing Scandal"
        posterloading="lazy"
      >
        <img
          src="https://i.ytimg.com/vi_webp/EDzZjBXOI8U/hqdefault.webp"
          alt="Elon Musk's Grok and the Mass Undressing Scandal"
          slot="image"
        >
      </lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/EDzZjBXOI8U"
        title="Elon Musk's Grok and the Mass Undressing Scandal"
        data-thumbnail="https://i.ytimg.com/vi_webp/EDzZjBXOI8U/hqdefault.webp"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prefer the image slot over a style poster', async () => {
    const value = html`
      <lite-youtube
        videoid="EDzZjBXOI8U"
        style="background-image: url('https://example.com/poster.jpg');"
      >
        <img
          src="https://example.org/slotted-poster.jpg"
          slot="image"
        >
      </lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/EDzZjBXOI8U"
        data-thumbnail="https://example.org/slotted-poster.jpg"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the poster lite-vimeo-embed paints from style', async () => {
    const value = html`
      <lite-vimeo
        videoid="357274789"
        style="background-image: url('https://i.vimeocdn.com/video/810965406.webp?mw=1600&mh=900&q=70');"
      ></lite-vimeo>
    `
    const expected = html`
      <iframe
        src="https://player.vimeo.com/video/357274789"
        data-thumbnail="https://i.vimeocdn.com/video/810965406.webp?mw=1600&mh=900&q=70"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image that fills no slot to the platform poster', async () => {
    const value = html`
      <lite-youtube videoid="_hjRvZYkAgA">
        <img
          src="https://i.ytimg.com/vi_webp/_hjRvZYkAgA/maxresdefault.webp"
          alt="_hjRvZYkAgA thumbnail"
          class="lty-thumbnail"
        >
      </lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/_hjRvZYkAgA"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a style poster held in a custom property unread', async () => {
    const value = html`
      <lite-youtube
        videoid="o27oYUtXX0k"
        style="background-image: var(--yt-poster-img-url); --yt-poster-img-url-lazy: url('https://example.com/poster/auto/jpeg/')"
      ></lite-youtube>
    `
    const expected = '<iframe src="https://www.youtube.com/embed/o27oYUtXX0k"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should resolve a relative style poster into the placeholder thumbnail', async () => {
    const value = html`
      <lite-youtube
        videoid="Dk9QdDcWJIE"
        style="background-image: url('/hqdefault_6006595100789835371.jpg')"
      ></lite-youtube>
    `
    const expected = html`
      <div
        data-embed-url="https://www.youtube.com/watch?v=Dk9QdDcWJIE"
        data-embed-thumbnail="https://example.com/hqdefault_6006595100789835371.jpg"
        data-embed-src="https://www.youtube.com/embed/Dk9QdDcWJIE"
        data-embed-ratio="16/9"
        data-embed-provider="youtube"
        data-embed-id="Dk9QdDcWJIE"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/blog/post/',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should rebuild the player of mihdan Lite YouTube Embed from player-src', async () => {
    const value = html`
      <lite-youtube
        class="lite-youtube_16x9"
        video-id="sDddGSDpgGw"
        player-src="https://www.youtube-nocookie.com/embed/sDddGSDpgGw?autoplay=1&#038;feature=oembed"
      >
        <lite-youtube__button class="lite-youtube__button lty-playbtn"></lite-youtube__button>
        <lite-youtube__preview class="lite-youtube__preview">
          <img
            decoding="async"
            src="https://i.ytimg.com/vi/sDddGSDpgGw/maxresdefault.jpg"
            width="1280"
            height="720"
            class="lite-youtube__image"
            alt="Get Ready For The Immortal Man | Official Peaky Blinders S1-6 Recap"
          >
        </lite-youtube__preview>
        <lite-youtube__name class="lite-youtube__name">Get Ready For The Immortal Man | Official Peaky Blinders S1-6 Recap</lite-youtube__name>
      </lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube-nocookie.com/embed/sDddGSDpgGw?autoplay=1&amp;feature=oembed"
        title="Get Ready For The Immortal Man | Official Peaky Blinders S1-6 Recap"
        data-thumbnail="https://i.ytimg.com/vi/sDddGSDpgGw/maxresdefault.jpg"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the lazy poster of mihdan Lite YouTube Embed from data-src', async () => {
    const value = html`
      <lite-youtube
        class="lite-youtube_16x9"
        video-id="qdW9MLBu0rI"
        player-src="https://www.youtube-nocookie.com/embed/qdW9MLBu0rI?autoplay=1&#038;feature=oembed"
      >
        <lite-youtube__preview class="lite-youtube__preview">
          <img
            data-src="https://i.ytimg.com/vi/qdW9MLBu0rI/maxresdefault.jpg"
            data-placeholder-background="#000"
            width="1280"
            height="720"
            class="lite-youtube__image lite-youtube_lazy mihdan-lozad"
          >
        </lite-youtube__preview>
      </lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube-nocookie.com/embed/qdW9MLBu0rI?autoplay=1&amp;feature=oembed"
        data-thumbnail="https://i.ytimg.com/vi/qdW9MLBu0rI/maxresdefault.jpg"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the poster and name of a mihdan Rutube player end to end', async () => {
    const value = html`
      <lite-youtube
        class="lite-youtube_16x9"
        video-id="8c50f13ca83955b4a234839c2085de0f"
        player-src="https://rutube.ru/play/embed/8c50f13ca83955b4a234839c2085de0f"
      >
        <lite-youtube__button class="lite-youtube__button lty-playbtn"></lite-youtube__button>
        <lite-youtube__preview class="lite-youtube__preview">
          <img
            src="https://pic.rtbcdn.ru/video/2026-03-30/71/b1/71b1db2d97121c53dd31483954af4074.jpg"
            width="1280"
            height="720"
            class="lite-youtube__image"
            alt="Как живут и о чём мечтают в детском хосписе?"
          >
        </lite-youtube__preview>
        <lite-youtube__name class="lite-youtube__name">Как живут и о чём мечтают в детском хосписе?</lite-youtube__name>
      </lite-youtube>
    `
    const expected = html`
      <div
        data-embed-url="https://rutube.ru/video/8c50f13ca83955b4a234839c2085de0f/"
        data-embed-title="Как живут и о чём мечтают в детском хосписе?"
        data-embed-thumbnail="https://pic.rtbcdn.ru/video/2026-03-30/71/b1/71b1db2d97121c53dd31483954af4074.jpg"
        data-embed-src="https://rutube.ru/play/embed/8c50f13ca83955b4a234839c2085de0f"
        data-embed-ratio="16/9"
        data-embed-provider="rutube"
        data-embed-id="8c50f13ca83955b4a234839c2085de0f"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should leave a mihdan element whose player-src is not a url', async () => {
    const value = '<lite-youtube video-id="qdW9MLBu0rI" player-src="qdW9MLBu0rI"></lite-youtube>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a mihdan element that already holds its player', async () => {
    const value = html`
      <lite-youtube
        video-id="qdW9MLBu0rI"
        player-src="https://www.youtube-nocookie.com/embed/qdW9MLBu0rI"
      ><iframe src="https://www.youtube-nocookie.com/embed/qdW9MLBu0rI?autoplay=1"></iframe></lite-youtube>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should carry videotitle into the iframe title', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        videotitle="Never Gonna Give You Up"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Never Gonna Give You Up"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the title of paulirish lite-youtube-embed into the iframe title', async () => {
    const value = html`
      <lite-youtube
        videoid="ogfYd705cRs"
        title="Play: Keynote (Google I/O '18)"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/ogfYd705cRs"
        title="Play: Keynote (Google I/O '18)"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should prefer videotitle over title', async () => {
    const value = html`
      <lite-youtube
        videoid="dQw4w9WgXcQ"
        videotitle="Never Gonna Give You Up"
        title="Play video"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Never Gonna Give You Up"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should build the playlist player from a playlistid, as the component plays it', async () => {
    const value = html`
      <lite-youtube
        videoid="VLrYOji75Vc"
        playlistid="PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/videoseries?list=PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should build the playlist player from a playlistid with no videoid', async () => {
    const value = '<lite-youtube playlistid="PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"></lite-youtube>'
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/videoseries?list=PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should carry the start of a playlist into its player', async () => {
    const value = html`
      <lite-youtube
        playlistid="PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
        videoStartAt="30"
      ></lite-youtube>
    `
    const expected = html`
      <iframe
        src="https://www.youtube.com/embed/videoseries?start=30&list=PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></iframe>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a playlistid on lite-vimeo unread', async () => {
    const value = html`
      <lite-vimeo
        videoid="76979871"
        playlistid="PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></lite-vimeo>
    `
    const expected = '<iframe src="https://player.vimeo.com/video/76979871"></iframe>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should produce a youtube playlist placeholder end to end', async () => {
    const value = '<lite-youtube playlistid="PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"></lite-youtube>'
    const expected = html`
      <div
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/playlist?list=PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
        data-embed-id="playlist/PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/videoseries?list=PL-G5r6j4GptH5JTveoLTVqpp7w2oc27Q9"
      ></div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should produce a youtube placeholder end to end', async () => {
    const value = '<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>'
    const expected = html`
      <div
        data-embed-thumbnail="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        data-embed-ratio="16/9"
        data-embed-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        data-embed-id="dQw4w9WgXcQ"
        data-embed-provider="youtube"
        data-embed-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
      >
      </div>
    `
    const result = await transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com',
    })

    expect(result).toEqualHtml(expected)
  })

  it('should be idempotent', async () => {
    const value = '<lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>'
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
