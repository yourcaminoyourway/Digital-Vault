// ── PDF.js lazy loader & thumbnail renderer ──────────────────────────

let _pdfjsPromise = null

function loadPdfJs() {
  if (_pdfjsPromise) return _pdfjsPromise
  _pdfjsPromise = new Promise((resolve, reject) => {
    const src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs'
    import(/* @vite-ignore */ src)
      .then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs'
        resolve(pdfjsLib)
      })
      .catch(reject)
  })
  return _pdfjsPromise
}

/**
 * Render the first page of a PDF into a container element.
 * The canvas fills the container and is cropped via overflow:hidden.
 *
 * @param {HTMLElement} containerEl  – target element (should have explicit height & overflow:hidden)
 * @param {string}      pdfUrl      – URL to the PDF file
 * @param {object}      [opts]      – optional overrides
 * @param {number}      [opts.targetHeight] – desired pixel height for scaling (default: container height or 140)
 */
export async function renderPdfThumbnail(containerEl, pdfUrl, opts = {}) {
  try {
    const pdfjsLib = await loadPdfJs()
    const pdf = await pdfjsLib.getDocument({
      url: pdfUrl,
      disableAutoFetch: true,
      disableStream: true
    }).promise
    const page = await pdf.getPage(1)

    const containerWidth = containerEl.clientWidth || 300
    const containerHeight = opts.targetHeight || containerEl.clientHeight || 140
    const unscaledViewport = page.getViewport({ scale: 1 })

    // Scale so the page covers the container (like object-fit: cover)
    const scale = Math.max(
      containerHeight / unscaledViewport.height,
      containerWidth / unscaledViewport.width
    )
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.cssText = 'width:100%;height:100%;object-fit:cover;'

    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    // Replace spinner / placeholder with rendered canvas
    containerEl.innerHTML = ''
    containerEl.appendChild(canvas)
  } catch (e) {
    console.warn('PDF thumbnail render failed:', e)
    // On failure show a graceful fallback
    containerEl.innerHTML = `
      <i class="bi bi-file-earmark-pdf" style="font-size:2.5rem;color:#ef4444;"></i>
      <span class="small fw-semibold mt-1" style="color:#374151;">PDF preview unavailable</span>
    `
  }
}
