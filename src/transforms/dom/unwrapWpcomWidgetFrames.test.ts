import { expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { unwrapWpcomWidgetFrames } from './unwrapWpcomWidgetFrames.js'

describeForEachParser('unwrapWpcomWidgetFrames', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [unwrapWpcomWidgetFrames(baseContext)])
  }

  it('should rebuild the frame into the Flash embed its query names', async () => {
    const value = html`
      <iframe
        frameborder="0"
        width="500"
        height="360"
        src="https://wpcomwidgets.com/?src=http%3A%2F%2Fwww.example.com%2Fapps%2Fslideshow%2Fshow.swf%3Fv%3D71649&#038;width=500&#038;flashvars=offsite%3Dtrue%26lang%3Den-us%26set_id%3D72157630500191816&#038;allowfullscreen=true&#038;height=360&#038;_tag=gigya&#038;_hash=c5929a9fba9ef66ba55b7ea01159528c"
        id="wpcom-iframe-c5929a9fba9ef66ba55b7ea01159528c"
      ></iframe>
    `
    const expected = html`
      <embed
        src="http://www.example.com/apps/slideshow/show.swf?v=71649"
        flashvars="offsite=true&amp;lang=en-us&amp;set_id=72157630500191816"
        width="500"
        height="360"
        type="application/x-shockwave-flash"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the flashvars escaping as written', async () => {
    const value = html`
      <iframe
        frameborder="0"
        src="https://wpcomwidgets.com/?src=http%3A%2F%2Fwww.example.com%2FmixcloudLoader.swf&#038;flashvars=feed%3Dhttp%253A%252F%252Fwww.example.com%252Fshow%252F%26embed_type%3Dwidget_standard&#038;width=480&#038;height=80&#038;_tag=gigya&#038;_hash=87bc4c141e7bd008bb608220e1fa8139"
      ></iframe>
    `
    const expected = html`
      <embed
        src="http://www.example.com/mixcloudLoader.swf"
        flashvars="feed=http%3A%2F%2Fwww.example.com%2Fshow%2F&amp;embed_type=widget_standard"
        width="480"
        height="80"
        type="application/x-shockwave-flash"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the flashvars as written', async () => {
    const value = html`
      <iframe
        frameborder="0"
        src="https://wpcomwidgets.com/?width=320&#038;height=260&#038;src=http%3A%2F%2Fstatic.example.com%2Fexpress%2Fembed%2Fpxplayer.swf&#038;quality=high&#038;flashvars=uid%3Dhome_760b194c93794e5998b9fcda08dd31b1%26gid%3D83bf91d3dbe0497a9a445036475ae62e%26gig_lt%3D1250952913867%26gig_pt%3D1250952954089%26gig_g%3D2%26gig_n%3Dwordpress&#038;wmode=tranparent&#038;_tag=gigya&#038;_hash=a511bb95b7fb400f1099d5da09e22515"
      ></iframe>
    `
    const expected = html`
      <embed
        src="http://static.example.com/express/embed/pxplayer.swf"
        flashvars="uid=home_760b194c93794e5998b9fcda08dd31b1&amp;gid=83bf91d3dbe0497a9a445036475ae62e&amp;gig_lt=1250952913867&amp;gig_pt=1250952954089&amp;gig_g=2&amp;gig_n=wordpress"
        width="320"
        height="260"
        type="application/x-shockwave-flash"
      >
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild the frame where it sits inside its wrapper', async () => {
    const value = html`
      <div id="__ss_8001505">
        <strong>Comunicado</strong>
        <iframe src="https://wpcomwidgets.com/?width=477&#038;height=510&#038;src=http%3A%2F%2Fstatic.example.com%2Fswf%2Fdoc_player.swf&#038;_tag=gigya&#038;_hash=4e4fd3b79084a82385aba660f83bf024"></iframe>
        <div>View more</div>
      </div>
    `
    const expected = html`
      <div id="__ss_8001505">
        <strong>Comunicado</strong>
        <embed src="http://static.example.com/swf/doc_player.swf" width="477" height="510" type="application/x-shockwave-flash">
        <div>View more</div>
      </div>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a wrapper frame naming no player', async () => {
    const value = '<iframe src="https://wpcomwidgets.com/render/"></iframe>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a frame on another host carrying the same query', async () => {
    const value = html`
      <iframe src="https://evil.test/?src=http%3A%2F%2Fstatic.example.com%2Fswf%2Fdoc_player.swf&#038;width=477&#038;height=510&#038;_tag=gigya"></iframe>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should be idempotent', async () => {
    const value = html`
      <iframe src="https://wpcomwidgets.com/?src=http%3A%2F%2Fstatic.example.com%2Fswf%2Fdoc_player.swf&#038;width=477&#038;height=510&#038;_tag=gigya"></iframe>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})

// The rebuilt embed is a dead swf, which only a Flash resolver turns into a player, so the
// pipeline is what shows the frame ending up as the platform's placeholder or dropped.
describeForEachParser('unwrapWpcomWidgetFrames through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should let the Flash resolver claim the player the frame wraps', async () => {
    const value = html`
      <iframe
        frameborder="0"
        width="500"
        height="360"
        src="https://wpcomwidgets.com/?src=http%3A%2F%2Fwww.flickr.com%2Fapps%2Fslideshow%2Fshow.swf%3Fv%3D71649&#038;width=500&#038;flashvars=offsite%3Dtrue%26lang%3Den-us%26page_show_url%3D%2Fphotos%2Fmacarignan%2Fsets%2F72157630500191816%2Fshow%2F%26page_show_back_url%3D%2Fphotos%2Fmacarignan%2Fsets%2F72157630500191816%2F%26set_id%3D72157630500191816%26jump_to%3D&#038;allowfullscreen=true&#038;height=360&#038;_tag=gigya&#038;_hash=c5929a9fba9ef66ba55b7ea01159528c"
        id="wpcom-iframe-c5929a9fba9ef66ba55b7ea01159528c"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-src="https://embedr.flickr.com/photosets/72157630500191816?width=400&amp;height=300"
        data-embed-provider="flickr"
        data-embed-id="macarignan/72157630500191816"
        data-embed-url="https://www.flickr.com/photos/macarignan/sets/72157630500191816"
        data-embed-width="400"
        data-embed-height="300"
        data-embed-author="macarignan"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should let SlideShare read the wrapper around the frame', async () => {
    const value = html`
      <div style="width:477px;" id="__ss_8001505">
        <strong><a href="http://www.slideshare.net/redmuseoschlima/comunicado-da-internacional-de-los-museos" title="Comunicado día internacional de los museos">Comunicado día internacional de los museos</a></strong>
        <iframe frameborder="0" width="477" height="510" src="https://wpcomwidgets.com/?width=477&#038;height=510&#038;src=http%3A%2F%2Fstatic.slidesharecdn.com%2Fswf%2Fdoc_player.swf%3Fdoc%3Dcomunicado-dainternacionaldelosmuseos-110517160345-phpapp01%26stripped_title%3Dcomunicado-da-internacional-de-los-museos%26userName%3Dredmuseoschlima&#038;quality=high&#038;flashvars=gig_lt%3D1305666319563%26gig_pt%3D1305666337201%26gig_g%3D1%26gig_n%3Dwordpress&#038;wmode=tranparent&#038;allowfullscreen=true&#038;_tag=gigya&#038;_hash=4e4fd3b79084a82385aba660f83bf024" id="wpcom-iframe-4e4fd3b79084a82385aba660f83bf024"></iframe>
        <div style="padding:5px 0 12px;">View more <a href="http://www.slideshare.net/">documents</a> from <a href="http://www.slideshare.net/redmuseoschlima">redmuseoschlima</a></div>
      </div>
    `
    const expected = html`
      <p>
        <strong><a title="Comunicado día internacional de los museos" href="http://www.slideshare.net/redmuseoschlima/comunicado-da-internacional-de-los-museos">Comunicado día internacional de los museos</a></strong>
      </p>
      <div
        data-embed-src="https://www.slideshare.net/slideshow/embed_code/8001505"
        data-embed-provider="slideshare"
        data-embed-id="8001505"
        data-embed-url="http://www.slideshare.net/redmuseoschlima/comunicado-da-internacional-de-los-museos"
        data-embed-ratio="595/485"
        data-embed-title="Comunicado día internacional de los museos"
        data-embed-author="redmuseoschlima"
      ></div>
      <p>View more <a href="http://www.slideshare.net/">documents</a> from <a href="http://www.slideshare.net/redmuseoschlima">redmuseoschlima</a></p>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should frame the inner url when it is not a swf', async () => {
    const value = html`
      <iframe src="https://wpcomwidgets.com/?src=http%3A%2F%2Fvideo.rutube.ru%2Fc7cadcdf05ecd5edb6b22745663ab1db&#038;_tag=gigya"></iframe>
    `
    const expected =
      '<div data-embed-src="http://video.rutube.ru/c7cadcdf05ecd5edb6b22745663ab1db"></div>'

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should drop the player when no Flash resolver claims it', async () => {
    const value = html`
      <iframe src="https://wpcomwidgets.com/?width=320&#038;height=20&#038;src=http%3A%2F%2Fwww.example.com%2Fswf%2Fjwplayer44.swf&#038;flashvars=file%3D3055619_stnd.mp3&#038;_tag=gigya&#038;_hash=668922c4d7ff8b07cf3bbcb2cb57b4b1"></iframe>
    `

    expect(await convert(value)).toBe('')
  })
})
