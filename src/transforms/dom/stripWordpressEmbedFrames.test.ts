import { describe, expect, it } from 'bun:test'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import type { TransformContext } from '../../types.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { stripWordpressEmbedFrames } from './stripWordpressEmbedFrames.js'

describeForEachParser('stripWordpressEmbedFrames', (parseHtml) => {
  const transform = (value: string, context: TransformContext = baseContext) => {
    return applyDomTransforms(parseHtml(value), [stripWordpressEmbedFrames(context)])
  }

  describe('the frame beside its blockquote', () => {
    it('should strip the frame that shares the blockquote secret', async () => {
      const value = html`
        <p>Read also:</p>
        <blockquote class="wp-embedded-content" data-secret="hDl4S8YwKz">
          <a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a>
        </blockquote>
        <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.e-startupindia.com/learn/gstr-1/embed/#?secret=hDl4S8YwKz" data-secret="hDl4S8YwKz" width="600" height="338"></iframe>
      `
      const expected = html`
        <p>Read also:</p>
        <blockquote class="wp-embedded-content" data-secret="hDl4S8YwKz">
          <a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the frame wpautop wrapped in a paragraph', () => {
    it('should strip the frame and the paragraph it leaves empty', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="SKmjMBV4Gw">
          <p><a href="https://wprawo.pl/liczby-nie-klamia-mamy-lekki-sezon-grypowy-w-ubieglych-latach-liczba-infekcji-byla-o-wiele-wyzsza/">Liczby nie kłamią! Mamy lekki sezon grypowy.</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://wprawo.pl/liczby-nie-klamia-mamy-lekki-sezon-grypowy-w-ubieglych-latach-liczba-infekcji-byla-o-wiele-wyzsza/embed/#?secret=SKmjMBV4Gw" data-secret="SKmjMBV4Gw" width="600" height="338"></iframe>
        </p>
        <p>Na koniec.</p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="SKmjMBV4Gw">
          <p><a href="https://wprawo.pl/liczby-nie-klamia-mamy-lekki-sezon-grypowy-w-ubieglych-latach-liczba-infekcji-byla-o-wiele-wyzsza/">Liczby nie kłamią! Mamy lekki sezon grypowy.</a></p>
        </blockquote>
        <p>Na koniec.</p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the line wpautop joined to the frame', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="j37IzWKSZa">
          <p><a href="https://quileutenation.org/">Home</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://quileutenation.org/embed/#?secret=j37IzWKSZa" data-secret="j37IzWKSZa" width="600" height="338"></iframe>
          <br>
          http://www.burkemuseum.org/static/truth_vs_twilight/
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="j37IzWKSZa">
          <p><a href="https://quileutenation.org/">Home</a></p>
        </blockquote>
        <p>
          <br>
          http://www.burkemuseum.org/static/truth_vs_twilight/
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep the prose that shares the paragraph with the frame', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="z8adgdixmM">
          <p><a href="https://thingstolucat.com/class-iv-packrafting/">Technical Water Packrafting</a></p>
        </blockquote>
        <p>
          <iframe loading="lazy" class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://thingstolucat.com/class-iv-packrafting/embed/#?secret=vnTKaU51TO#?secret=z8adgdixmM" data-secret="z8adgdixmM" width="600" height="338"></iframe>
          . All I am saying is that in Nepal the water is bigger than you might be used to.
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="z8adgdixmM">
          <p><a href="https://thingstolucat.com/class-iv-packrafting/">Technical Water Packrafting</a></p>
        </blockquote>
        <p>
          . All I am saying is that in Nepal the water is bigger than you might be used to.
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the frame in a span inside a paragraph', () => {
    it('should strip the frame and both wrappers it leaves empty', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="Sydl4ifX7d">
          <p><a href="https://1marunet.com/post-1576/">【超初心者向け】ジムに着て行くウェアはどんなのがいい？</a></p>
        </blockquote>
        <p><span class="i-embed"><iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://1marunet.com/post-1576/embed/#?secret=Sydl4ifX7d" data-secret="Sydl4ifX7d" width="500" height="282"></iframe></span></p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="Sydl4ifX7d">
          <p><a href="https://1marunet.com/post-1576/">【超初心者向け】ジムに着て行くウェアはどんなのがいい？</a></p>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the frame in a div', () => {
    it('should strip the frame a consent plugin wrapped in a div', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="MPjjgcI9Qc">
          <p><a href="https://kirjallisuuskalenteri.fi/event/kohtaamispaikalla-sari-kivisto-katariina-karkela-erika-pihl-ja-isa-valimaki/">Kohtaamispaikalla Sari Kivistö, Katariina Kärkelä, Erika Pihl ja Isa Välimäki</a></p>
        </blockquote>
        <div data-consent="marketing"><iframe data-consent="marketing" class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://kirjallisuuskalenteri.fi/event/kohtaamispaikalla-sari-kivisto-katariina-karkela-erika-pihl-ja-isa-valimaki/embed/#?secret=aENkUhrCNT#?secret=MPjjgcI9Qc" data-secret="MPjjgcI9Qc" width="500" height="282"></iframe></div>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="MPjjgcI9Qc">
          <p><a href="https://kirjallisuuskalenteri.fi/event/kohtaamispaikalla-sari-kivisto-katariina-karkela-erika-pihl-ja-isa-valimaki/">Kohtaamispaikalla Sari Kivistö, Katariina Kärkelä, Erika Pihl ja Isa Välimäki</a></p>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('the frame copy in a noscript', () => {
    it('should strip a lazy frame and its noscript copy', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="tHaPP7Eb1G">
          <a href="https://www.poitan.jp/archives/141500">「ぽんたまATM」でローソンATM×Pontaポイントの優位性とは？</a>
        </blockquote>
        <iframe class="lazy lazy-hidden wp-embedded-content" sandbox="allow-scripts" security="restricted" data-lazy-type="iframe" data-src="https://www.poitan.jp/archives/141500/embed#?secret=BD6kR6XU7V#?secret=tHaPP7Eb1G" data-secret="tHaPP7Eb1G" width="600" height="338"></iframe>
        <noscript><iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.poitan.jp/archives/141500/embed#?secret=BD6kR6XU7V#?secret=tHaPP7Eb1G" data-secret="tHaPP7Eb1G" width="600" height="338"></iframe></noscript>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="tHaPP7Eb1G">
          <a href="https://www.poitan.jp/archives/141500">「ぽんたまATM」でローソンATM×Pontaポイントの優位性とは？</a>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('pairs missing a data-secret on either half', () => {
    it('should read the secret from the src fragment of a frame with no data-secret', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="pVPjmSz7KP">
          <p><a href="https://www.kevinmd.com/blog/2020/09/health-cares-tech-renaissance-during-the-pandemic-extends-to-medical-training.html">Health care’s tech renaissance during the pandemic extends to medical training</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" src="https://www.kevinmd.com/blog/2020/09/health-cares-tech-renaissance-during-the-pandemic-extends-to-medical-training.html/embed#?secret=pVPjmSz7KP" width="600" height="338"></iframe>
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="pVPjmSz7KP">
          <p><a href="https://www.kevinmd.com/blog/2020/09/health-cares-tech-renaissance-during-the-pandemic-extends-to-medical-training.html">Health care’s tech renaissance during the pandemic extends to medical training</a></p>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read the secret parameter name in capitals', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="pVPjmSz7KP">
          <p><a href="https://example.com/2020/09/medical-training/">Medical training</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" src="https://example.com/2020/09/medical-training/embed/#?SECRET=pVPjmSz7KP"></iframe>
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="pVPjmSz7KP">
          <p><a href="https://example.com/2020/09/medical-training/">Medical training</a></p>
        </blockquote>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // WordPress 4.4 wrote its inline loader script into the paragraph ahead of the frame.
    it('should strip a secretless frame after the loader script in the next paragraph', async () => {
      const value = html`
        <blockquote class="wp-embedded-content">
          <p><a href="http://5garage.com/archives/323">Post</a></p>
        </blockquote>
        <p>
          <script type="text/javascript"></script>
          <iframe loading="lazy" sandbox="allow-scripts" security="restricted" src="http://5garage.com/archives/323/embed" width="600" height="338" class="wp-embedded-content"></iframe>
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content">
          <p><a href="http://5garage.com/archives/323">Post</a></p>
        </blockquote>
        <p>
          <script type="text/javascript"></script>
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should strip the frame beside a blockquote that lost its secret', async () => {
      const value = html`
        <div class="wp-block-embed__wrapper">
          <blockquote class="wp-embedded-content"><a href="https://www.parcparmentier.be/evenement/">Evénements</a></blockquote>
          <iframe class="wp-embedded-content" src="https://www.parcparmentier.be/evenement/embed/#?secret=JbNqu4MtlW%23?secret=7lqsSqW12p" width="600" height="338"></iframe>
        </div>
      `
      const expected = html`
        <div class="wp-block-embed__wrapper">
          <blockquote class="wp-embedded-content"><a href="https://www.parcparmentier.be/evenement/">Evénements</a></blockquote>
        </div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('frames left alone', () => {
    it('should keep a frame whose secret no blockquote carries', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="p8frefqv0M">
          <p><a href="https://kazcharietc.com/fleche-hokkaido-2025/">Flèche Hokkaido 2025</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://hatenablog-parts.com/embed?url=https%3A%2F%2Fpikacycling.hateblo.jp%2Fentry%2F2026%2F06%2F16%2F120000#?secret=6kX1KoGRxK" data-secret="6kX1KoGRxK"></iframe>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a provider frame that shares the paragraph of a post frame', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="5csCEEZczA">
          <p><a href="https://quileuteoceanside.com/">Home</a></p>
        </blockquote>
        <p>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://quileuteoceanside.com/embed/#?secret=5csCEEZczA" data-secret="5csCEEZczA" width="600" height="338"></iframe>
          <br>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.nytimes.com/svc/oembed/html/?url=https%3A%2F%2Fwww.nytimes.com%2F2010%2F02%2F08%2Fopinion%2F08riley.html#?secret=6yudc1oKT9" data-secret="6yudc1oKT9"></iframe>
        </p>
      `
      const expected = html`
        <blockquote class="wp-embedded-content" data-secret="5csCEEZczA">
          <p><a href="https://quileuteoceanside.com/">Home</a></p>
        </blockquote>
        <p>
          <br>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.nytimes.com/svc/oembed/html/?url=https%3A%2F%2Fwww.nytimes.com%2F2010%2F02%2F08%2Fopinion%2F08riley.html#?secret=6yudc1oKT9" data-secret="6yudc1oKT9"></iframe>
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a frame with no blockquote in the item', async () => {
      const value = html`
        <p>Viz náš dřívější článek:</p>
        <p>
          <iframe class="wp-embedded-content" sandbox="allow-scripts" src="https://cesko2050.cz/stat-je-podvod/embed/#?secret=oRecUfiR9Y" data-secret="oRecUfiR9Y" width="600" height="619"></iframe>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    // A post with no title gets an empty link, so no cite is made and the frame shows the post.
    it('should keep the frame of a blockquote whose link has no text', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="ZBi6rL5nTR">
          <a href="https://thevirginiaworker.com/2022/10/26/black-nationalism-in-the-old-dominion/"></a>
        </blockquote>
        <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://thevirginiaworker.com/2022/10/26/black-nationalism-in-the-old-dominion/embed/#?secret=cpG0mZhlA7#?secret=ZBi6rL5nTR" data-secret="ZBi6rL5nTR" width="529" height="298"></iframe>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep a secretless frame after a blockquote whose link has no text', async () => {
      const value = html`
        <blockquote class="wp-embedded-content">
          <p><a href="http://5garage.com/archives/323"></a></p>
        </blockquote>
        <p>
          <script type="text/javascript"></script>
          <iframe loading="lazy" sandbox="allow-scripts" security="restricted" src="http://5garage.com/archives/323/embed" width="600" height="338" class="wp-embedded-content"></iframe>
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should keep every frame when no cite resolver claims the blockquote', async () => {
      const value = html`
        <blockquote class="wp-embedded-content" data-secret="hDl4S8YwKz">
          <a href="https://www.e-startupindia.com/learn/gstr-1/">GSTR-1 Return Filing</a>
        </blockquote>
        <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://www.e-startupindia.com/learn/gstr-1/embed/#?secret=hDl4S8YwKz" data-secret="hDl4S8YwKz" width="600" height="338"></iframe>
      `
      const context: TransformContext = {
        ...baseContext,
        widgetResolvers: baseContext.widgetResolvers.filter((resolver) => resolver.kind !== 'cite'),
      }

      expect(await transform(value, context)).toEqualHtml(value)
    })
  })

  it('should be idempotent', async () => {
    const value = html`
      <blockquote class="wp-embedded-content" data-secret="SKmjMBV4Gw">
        <p><a href="https://wprawo.pl/liczby-nie-klamia-mamy-lekki-sezon-grypowy-w-ubieglych-latach-liczba-infekcji-byla-o-wiele-wyzsza/">Liczby nie kłamią! Mamy lekki sezon grypowy.</a></p>
      </blockquote>
      <p>
        <iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" src="https://wprawo.pl/liczby-nie-klamia-mamy-lekki-sezon-grypowy-w-ubieglych-latach-liczba-infekcji-byla-o-wiele-wyzsza/embed/#?secret=SKmjMBV4Gw" data-secret="SKmjMBV4Gw" width="600" height="338"></iframe>
      </p>
    `
    const once = await transform(value)
    const twice = await transform(once)

    expect(twice).toEqualHtml(once)
  })
})
