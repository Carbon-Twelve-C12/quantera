import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  try {
    if (DEBUG) {
      options.cacheControl = {
        bypassCache: true,
      }
    }
    
    // Try to get the asset from KV
    let response
    try {
      response = await getAssetFromKV(event, options)
    } catch (e) {
      // If the asset is not found, return the index.html for SPA routing
      if (!DEBUG && url.pathname.indexOf('.') === -1) {
        response = await getAssetFromKV(event, {
          ...options,
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
        })
      } else {
        throw e
      }
    }

    // Set security headers
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
    
    // Cache static assets longer
    if (url.pathname.startsWith('/static/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600')
    }

    return response
  } catch (e) {
    // Handle 404
    return new Response(`Not found: ${url.pathname}`, {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
} 