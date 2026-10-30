import { describe, expect, it } from 'bun:test'
import { transformContent } from '../../index.js'
import { baseContext, describeForEachParser, html } from '../../tests.js'
import { applyDomTransforms } from '../../utils/transforms.js'
import { rebuildActionTextAttachments } from './rebuildActionTextAttachments.js'

describeForEachParser('rebuildActionTextAttachments', (parseHtml) => {
  const transform = (value: string) => {
    return applyDomTransforms(parseHtml(value), [rebuildActionTextAttachments(baseContext)])
  }

  describe('happy paths', () => {
    it('should rebuild an empty image attachment into its captioned image', async () => {
      const value = html`
        <action-text-attachment
          sgid="BAh7CEkiCGdpZAY6BkVUSSI6Z2lkOi8v--d9be4b5bcb84a18d65871d2803fde824330498c4"
          content-type="image/png"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTE1LCJwdXIiOiJibG9iX2lkIn19--8f9825b8d68e5dea30402e63bfabf683d23ceeb5/s3-degraded-status.png"
          filename="s3-degraded-status.png"
          filesize="154737"
          width="1910"
          height="574"
          previewable="true"
          presentation="gallery"
          caption="Status page: Object storage degraded"
        ></action-text-attachment>
      `
      const expected = html`
        <figure>
          <img
            src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTE1LCJwdXIiOiJibG9iX2lkIn19--8f9825b8d68e5dea30402e63bfabf683d23ceeb5/s3-degraded-status.png"
            width="1910"
            height="574"
          >
          <figcaption>Status page: Object storage degraded</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild an empty image attachment with no caption into a bare image', async () => {
      const value = html`
        <action-text-attachment
          content-type="image/jpeg"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MjUyOX0=--703b170c/idea.jpg"
          width="1200"
          height="675"
        ></action-text-attachment>
      `
      const expected = html`
        <img
          src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MjUyOX0=--703b170c/idea.jpg"
          width="1200"
          height="675"
        >
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild an empty video attachment into a player', async () => {
      const value = html`
        <action-text-attachment
          content-type="video/mp4"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjM1fQ==--026f54a6/demo.mp4"
          width="1890.0"
          height="1011.9999999999999"
        ></action-text-attachment>
      `
      const expected = html`
        <video
          src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjM1fQ==--026f54a6/demo.mp4"
          controls
          width="1890"
          height="1012"
        ></video>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild a file card into a file placeholder', async () => {
      const value = html`
        <action-text-attachment
          content-type="application/pdf"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
          filename="mri-report.pdf"
          filesize="8096801"
          presentation="gallery"
          caption=""
        >
          <figure class="attachment attachment--file attachment--pdf">
            <div class="attachment__file-card attachment__file-card--pdf">
              <div class="attachment__file-details">
                <div class="attachment__file-name">mri-report.pdf</div>
                <div class="attachment__file-meta">PDF <span aria-hidden="true">·</span> 7.7 MB</div>
              </div>
            </div>
          </figure>
        </action-text-attachment>
      `
      const expected = html`
        <div
          data-file-url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
          data-file-name="mri-report.pdf"
          data-file-type="application/pdf"
          data-file-size="8096801"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave an image attachment that holds its rendered figure', async () => {
      const value = html`
        <action-text-attachment
          content-type="image/jpeg"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTY1fQ==--74089f2a/prototype-back.jpeg"
          width="1280"
          height="960"
        >
          <figure class="attachment attachment--preview attachment--jpeg">
            <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTY1fQ==--74089f2a/eyJfcmFpbHMiOnsidmFyaWF0aW9uIjp7fX19--1cc3/prototype-back.jpeg">
          </figure>
        </action-text-attachment>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an empty attachment whose rendered image follows its paragraph', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/comparison.png"
            width="712"
            height="266"
            caption="Comparison"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/eyJfcmFpbHMiOnsidmFyaWF0aW9uIjp7fX19--90eb/comparison.png">
          <figcaption class="attachment__caption">Comparison</figcaption>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an empty video attachment whose rendered player names it in the poster', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="video/mp4"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjM1fQ==--026f54a6/demo.mp4"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--mp4">
          <video
            controls
            poster="/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjM1fQ==--026f54a6/eyJfcmFpbHMiOnsidmFyaWF0aW9uIjp7fX19--1cc3/demo.jpg"
          ></video>
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an attachment with no url', async () => {
      const value = html`
        <action-text-attachment
          content-type="image"
          url=""
          width="532"
          height="1285"
        ></action-text-attachment>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('edge cases', () => {
    it('should rebuild an empty attachment whose following figure renders another upload', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/first.png"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6Mn0=--bbbb/eyJ2YXJpYXRpb24ifQ==--cccc/second.png">
        </figure>
      `
      const expected = html`
        <p>
          <img src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/first.png">
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6Mn0=--bbbb/eyJ2YXJpYXRpb24ifQ==--cccc/second.png">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an empty attachment that closes a paragraph of text before line breaks', async () => {
      const value = html`
        <p>
          It is much easier to take a break than it was in a city apartment.<action-text-attachment
            content-type="image/jpeg"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDI5fQ==--ef11/balcony.jpg"
            caption="View from the balcony at night"
          ></action-text-attachment><br><br>
        </p>
        <figure class="attachment attachment--preview attachment--jpeg">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDI5fQ==--ef11/eyJ2YXJpYXRpb24ifQ==--1cc3/balcony.jpg">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should match a rendered copy signed in the older blob id format by its file name', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/jpeg"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDI5fQ==--ef11/IMG_4052.jpg"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--jpeg">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcTBCIn19--110a/eyJ2YXJpYXRpb24ifQ==--1cc3/IMG_4052.jpg">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should rebuild an empty attachment that text follows inside its paragraph', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6N30=--dddd/chart.png"
          ></action-text-attachment> The chart above shows the drop.
        </p>
      `
      const expected = html`
        <p>
          <img src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6N30=--dddd/chart.png"> The chart above shows the drop.
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should match a rendered copy off Active Storage by its file name', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/gif"
            url="https://example.org/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--gif">
          <img src="https://example.org/media/3o7TKSjRrfIPjeiVyM/giphy.gif">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave an empty attachment whose rendered figure follows it outside a paragraph', async () => {
      const value = html`
        <div>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OH0=--eeee/diagram.png"
          ></action-text-attachment>
          <figure class="attachment attachment--preview attachment--png">
            <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OH0=--eeee/eyJ2YXJpYXRpb24ifQ==--cccc/diagram.png">
          </figure>
        </div>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should rebuild only the empty attachment in a paragraph whose figure renders the other', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/first.png"
          ></action-text-attachment>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6Mn0=--bbbb/second.png"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/eyJ2YXJpYXRpb24ifQ==--cccc/first.png">
        </figure>
      `
      const expected = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/first.png"
          ></action-text-attachment>
          <img src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6Mn0=--bbbb/second.png">
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MX0=--aaaa/eyJ2YXJpYXRpb24ifQ==--cccc/first.png">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should rebuild an attachment whose file name holds a malformed escape', async () => {
      const value = html`
        <action-text-attachment
          content-type="image/png"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OX0=--ffff/100%.png"
        ></action-text-attachment>
      `
      const expected =
        '<img src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OX0=--ffff/100%.png">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should read a following figure whose image file name holds a malformed escape', async () => {
      const value = html`
        <p>
          <action-text-attachment
            content-type="image/png"
            url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OX0=--ffff/chart.png"
          ></action-text-attachment>
        </p>
        <figure class="attachment attachment--preview attachment--png">
          <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OX0=--ffff/eyJ2YXJpYXRpb24ifQ==--cccc/100%.png">
        </figure>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should read the content type in any case', async () => {
      const value = html`
        <action-text-attachment
          content-type="IMAGE/PNG"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6N30=--dddd/chart.png"
        ></action-text-attachment>
      `
      const expected =
        '<img src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6N30=--dddd/chart.png">'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should carry the caption of a file onto its placeholder, with no figure', async () => {
      const value = html`
        <action-text-attachment
          content-type="application/pdf"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
          filename="mri-report.pdf"
          caption="The report the clinic sent"
        ></action-text-attachment>
      `
      const expected = html`
        <div
          data-file-url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
          data-file-name="mri-report.pdf"
          data-file-type="application/pdf"
          data-file-description="The report the clinic sent"
        ></div>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <action-text-attachment
          content-type="image/png"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTE1fQ==--8f98/status.png"
          caption="Object storage degraded"
        ></action-text-attachment>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})

describeForEachParser('rebuildActionTextAttachments in the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should rebuild an empty image attachment into a dimensioned figure', async () => {
    const value = html`
      <p>Before</p>
      <action-text-attachment
        content-type="image/png"
        url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTE1fQ==--8f98/status.png"
        width="1910"
        height="574"
        caption="Object storage degraded"
      ></action-text-attachment>
    `
    const expected = html`
      <p>Before</p>
      <figure>
        <img
          src="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTE1fQ==--8f98/status.png"
          width="1910"
          height="574"
        >
        <figcaption>Object storage degraded</figcaption>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should keep an upload paired with its rendered figure single', async () => {
    const value = html`
      <p>
        <action-text-attachment
          content-type="image/png"
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/comparison.png"
          caption="Comparison"
        ></action-text-attachment>
      </p>
      <figure class="attachment attachment--preview attachment--png">
        <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/eyJ2YXJpYXRpb24ifQ==--90eb/comparison.png">
        <figcaption class="attachment__caption">Comparison</figcaption>
      </figure>
    `
    const expected = html`
      <p>
        <action-text-attachment
          url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/comparison.png"
          content-type="image/png"
          caption="Comparison"
        ></action-text-attachment>
      </p>
      <figure class="attachment attachment--preview attachment--png">
        <img src="https://example.com/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA5fQ==--606e3e61/eyJ2YXJpYXRpb24ifQ==--90eb/comparison.png">
        <figcaption class="attachment__caption">Comparison</figcaption>
      </figure>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should turn a file card into a file placeholder', async () => {
    const value = html`
      <action-text-attachment
        content-type="application/pdf"
        url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
        filename="mri-report.pdf"
        filesize="8096801"
      >
        <figure class="attachment attachment--file attachment--pdf">
          <div class="attachment__file-card">
            <div class="attachment__file-name">mri-report.pdf</div>
            <div class="attachment__file-meta">PDF <span aria-hidden="true">·</span> 7.7 MB</div>
          </div>
        </figure>
      </action-text-attachment>
    `
    const expected = html`
      <div
        data-file-url="https://example.com/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NDJ9--5c1d/mri-report.pdf"
        data-file-type="application/pdf"
        data-file-size="8096801"
        data-file-name="mri-report.pdf"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
