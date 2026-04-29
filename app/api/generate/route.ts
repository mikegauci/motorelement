import { fal } from '@fal-ai/client'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  persistFalImageToSupabase,
  type PersistFalKind,
} from '@/lib/customizer/persistGeneratedToSupabase'

type VehiclePayload = {
  customerNotes?: string
}

function getFalQueueId(queued: unknown): string | undefined {
  const q = queued as { request_id?: string; requestId?: string }
  return q?.request_id ?? q?.requestId
}

const FAL_MODEL = 'openai/gpt-image-2/edit'
const IMAGE_BACKGROUNDS = 'fal-ai/nano-banana-2/edit'
const TEXT_BACKGROUNDS = 'fal-ai/nano-banana-2'
const MODEL_TWEAK = 'fal-ai/gemini-3-pro-image-preview/edit'

const STYLE_REFERENCE_ROOT = path.join(process.cwd(), 'public', 'style-reference')
const STYLE_REFERENCE_PATH = path.join(STYLE_REFERENCE_ROOT, 'style-reference.png')

async function loadStyleReference() {
  return loadStyleReferenceDataUrl(STYLE_REFERENCE_PATH)
}

function getCustomerNotesValue({ customerNotes }: VehiclePayload) {
  return typeof customerNotes === 'string' ? customerNotes.trim() : ''
}

function buildFullPrompt(vehicle: VehiclePayload) {
  const notes = getCustomerNotesValue(vehicle)
  return `Transform the car in Image 1 into a cartoon vector 
illustration that matches the EXACT style of the 
vehicle in Image 2.

Image 2 is a STYLE REFERENCE ONLY — do not copy 
any shapes, wheels, proportions, or details from it.

CRITICAL — ANGLE & COMPOSITION:
- Maintain the EXACT angle from Image 1
- Keep the exact same camera height and perspective
- Do not rotate, mirror, or recompose the car

CRITICAL — WHEELS:
- If the wheels are clearly visible in Image 1, copy the exact wheel design from Image 1 precisely
- Do not substitute or simplify them
- If no wheels are visible in Image 1, 
  do not add or invent one under any circumstances

CRITICAL — NUMBER PLATE:
- If a number plate is clearly visible in Image 1, 
  reproduce it exactly — same text, format, colors, if you cannot tell where it is from, leave it empty and do not hallucinate
- If no number plate is visible in Image 1, 
  do not add or invent one under any circumstances

CRITICAL — NO HALLUCINATIONS:
- Only render details explicitly visible in Image 1
- If unsure whether a detail exists, leave it out

GLASS — preserve exactly:
- All side windows: very dark tinted, near black
- One white highlight streak per window only

CRITICAL — CUSTOMER NOTES:
- If Customer Notes are provided in the next line, apply them
- Customer Notes: - ${notes}
- If Customer Notes are blank, ignore this section

The output must match Image 2 in style only:
- Bold thick black outlines around all panels
- Body panels: use zoned flat colour —  3 to 4 distinct tones of the same base colour.
- For black body panels make sure to keep very dark black tones.
- Preserve ALL colour accent details on body panels and trim pieces
  (coloured mirror caps, accent strips, contrasting trim — match exactly)
- Preserve ALL rear-mounted appendages exactly as visible
  (spoilers, wings, diffusers, lip extensions — do not omit or flatten)

ALL other details from Image 1 only.
White background, flat black shadow beneath.
No photorealism, no background, no road`
}

function buildBackgroundPrompt(backgroundValue: string) {
  const value = typeof backgroundValue === 'string' ? backgroundValue.trim() : ''
  return `BACKGROUND DETAILS:
  - Location/Theme: ${value}

---

Transform the scene in the provided image into a premium graphic
illustration cropped into a perfect circle.

STYLE:
- Bold colour fills — match the colour tones from the provided image faithfully
- Refined, detailed shapes — NOT cartoonish or childish
- Hard edges with strong colour contrast
- Premium graphic illustration style (poster or screen-print quality)
- Clean line work for definition
- No dark overlays, no moody filters — stay true to the original image's lighting and colour balance
- No photorealism, but richer detail than a basic cartoon
- Perfect circular crop with clean edges

CRITICAL — COMPOSITION:
- Fill the entire circle with the illustrated scene
- Keep the most iconic elements of the scene prominent
- Use layered depth with foreground and background elements
- Sky, ground, and key landmarks all visible

CRITICAL — COLOUR LIMIT:
- Use a maximum of 5 colours in the final artwork for a clean print-ready result
- If the user explicitly asks for more or less colours in BACKGROUND DETAILS, follow their request
- Prefer tonal variations/shading within the same base colours instead of introducing new colours

CRITICAL — NO VEHICLES:
- Do NOT include any cars, motorcycles, or vehicles unless the user explicitly requests one in BACKGROUND DETAILS
- This background will be used behind a separate vehicle illustration

CRITICAL — NO HALLUCINATIONS:
- Only illustrate elements visible in the provided image
- Do not add elements not present in the scene

Output: High resolution circular graphic illustration,
transparent or white background outside the circle.`
}

function buildNanoBananaBackgroundPrompt(backgroundValue: string) {
  const value = typeof backgroundValue === 'string' ? backgroundValue.trim() : ''
  return `
BACKGROUND DETAILS:
  - Location/Theme: ${value}

Create a polished graphic illustration cropped into a perfect circle.

STYLE:
  - Bold colour fills with subtle shading and depth
  - Refined, detailed shapes — NOT cartoonish or childish
  - Hard edges with strong colour contrast
  - Premium graphic illustration style (poster or screen-print quality)
  - Add line work and subtle texture for depth
  - Use a cohesive, sophisticated colour palette — avoid flat primary colours
  - image.png high-end graphic tee or art print, not a children's book
  - No photorealism, but richer detail than a basic cartoon

COLOUR LIMIT:
  - Use a maximum of 5 colours in the final artwork for a clean print-ready result
  - If the user explicitly asks for more colours in BACKGROUND DETAILS, follow their request
  - Prefer tonal variations/shading within the same base colours instead of introducing new colours

COMPOSITION:
  - The entire scene must fit inside a perfect circular frame
  - Fill the circle edge-to-edge with the composition
  - Use layered depth with foreground and background elements
  - Clear separation between foreground, midground, and background

NO VEHICLES:
  - Do NOT include any cars, motorcycles, or vehicles unless the user explicitly requests one in BACKGROUND DETAILS
  - This background will be used behind a separate vehicle illustration

ACCURACY:
  - Unless specified in the BACKGROUND DETAILS, do not add fictional buildings, objects, or extra elements

OUTPUT:
  - High-resolution graphic illustration
  - Perfect circular crop
  - Clean edge around the circle
  - Background outside the circle to be solid white`
}

function buildBackgroundTweakPrompt(tweakNotes: string) {
  const notes = typeof tweakNotes === 'string' ? tweakNotes.trim() : ''
  return `Edit this background illustration based on these instructions:
${notes}

Keep the existing composition, style, and circular crop intact.
Only apply the requested changes.`
}

import { uploadDataUrl } from '@/lib/api/fal'

function resolvePersistKind({
  mode,
  endpointId,
}: {
  mode?: unknown
  endpointId?: unknown
}): PersistFalKind {
  if (mode === 'background') return 'background'
  if (mode === 'car') return 'car'
  if (String(endpointId || '') === TEXT_BACKGROUNDS) return 'background'
  return 'car'
}

async function tryPersistGeneratedImage({
  imageUrl,
  kind,
  metadata,
}: {
  imageUrl: string
  kind: PersistFalKind
  metadata: Record<string, unknown>
}) {
  try {
    return await persistFalImageToSupabase({ imageUrl, kind, metadata })
  } catch (err: unknown) {
    console.error('[supabase] persist failed:', err instanceof Error ? err.message : err)
    return null
  }
}

function getMimeTypeForFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/png'
}

async function loadStyleReferenceDataUrl(filePath: string) {
  const buffer = await readFile(filePath)
  const mime = getMimeTypeForFile(filePath)
  return `data:${mime};base64,${buffer.toString('base64')}`
}



export async function POST(request: Request) {
  const apiKey = process.env.FAL_API_KEY
  const body = (await request.json()) as Record<string, unknown>
  const {
    action,
    requestId,
    endpointId,
    mode,
    carImageDataUrl,
    customerNotes,
    backgroundImageDataUrl,
    backgroundValue,
    backgroundTweakImageUrl,
    tweakImageUrl,
  } = body

  const persistKindForStatus = resolvePersistKind({ mode, endpointId })

  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json({ error: 'Server missing FAL_API_KEY' }, { status: 500 })
  }
  try {
    fal.config({ credentials: apiKey.trim() })
    let result: Awaited<ReturnType<typeof fal.subscribe>>

    if (action === 'status') {
      if (!requestId || !endpointId) {
        return Response.json({ error: 'requestId and endpointId are required' }, { status: 400 })
      }
      const statusResult = await fal.queue.status(String(endpointId), {
        requestId: String(requestId),
        logs: true,
      })
      const status = String(statusResult?.status || '').toUpperCase()
      if (status === 'COMPLETED') {
        const finalResult = (await fal.queue.result(String(endpointId), {
          requestId: String(requestId),
        })) as {
          data?: { images?: { url?: string }[] }
          images?: { url?: string }[]
          output?: { images?: { url?: string }[] }
        }
        const imageUrl =
          finalResult?.data?.images?.[0]?.url ||
          finalResult?.images?.[0]?.url ||
          finalResult?.output?.images?.[0]?.url
        let supabase = null
        if (imageUrl) {
          supabase = await tryPersistGeneratedImage({
            imageUrl,
            kind: persistKindForStatus,
            metadata: {
              source: 'fal_queue',
              fal_request_id: String(requestId),
              fal_endpoint_id: String(endpointId),
            },
          })
        }
        return Response.json({
          status: 'COMPLETED',
          requestId: String(requestId),
          endpointId: String(endpointId),
          url: imageUrl || null,
          supabase,
        })
      }
      if (status === 'FAILED' || status === 'CANCELED') {
        const errField = (statusResult as { error?: unknown })?.error
        return Response.json({
          status,
          requestId: String(requestId),
          endpointId: String(endpointId),
          error: errField ?? `Request ${status.toLowerCase()}`,
        })
      }
      return Response.json({
        status: status || 'IN_PROGRESS',
        requestId: String(requestId),
        endpointId: String(endpointId),
      })
    }

    if (action === 'cancel') {
      if (!requestId || !endpointId) {
        return Response.json({ error: 'requestId and endpointId are required' }, { status: 400 })
      }
      await fal.queue.cancel(String(endpointId), { requestId: String(requestId) })
      return Response.json({
        status: 'CANCELED',
        requestId: String(requestId),
        endpointId: String(endpointId),
      })
    }

    if (action === 'submit') {
      if (mode === 'background') {
        if (!backgroundValue || !String(backgroundValue).trim()) {
          return Response.json({ error: 'Background value is required' }, { status: 400 })
        }

        if (backgroundTweakImageUrl && typeof backgroundTweakImageUrl === 'string') {
          const prompt = buildBackgroundTweakPrompt(String(backgroundValue ?? ''))
          console.log(`\n[generate-background-tweak] Prompt sent to Fal (${MODEL_TWEAK}):\n`)
          console.log(prompt)
          const queued = await fal.queue.submit(MODEL_TWEAK, {
            input: {
              prompt,
              image_urls: [String(backgroundTweakImageUrl)],
              aspect_ratio: '1:1',
              output_format: 'png',
            },
          })
          const queuedId = getFalQueueId(queued)
          return Response.json({ requestId: queuedId, endpointId: MODEL_TWEAK, status: 'IN_QUEUE' })
        }

        if (backgroundImageDataUrl && typeof backgroundImageDataUrl === 'string') {
          const imageUrl = await uploadDataUrl(backgroundImageDataUrl)
          const prompt = buildBackgroundPrompt(String(backgroundValue ?? ''))
          console.log(`\n[generate-background-edit] Prompt sent to Fal (${IMAGE_BACKGROUNDS}):\n`)
          console.log(prompt)
          const queued = await fal.queue.submit(IMAGE_BACKGROUNDS, {
            input: {
              prompt,
              image_urls: [imageUrl],
              image_size: '1024x1024',
              background: 'transparent',
              quality: 'high',
            },
          })
          const queuedId = getFalQueueId(queued)
          return Response.json({ requestId: queuedId, endpointId: IMAGE_BACKGROUNDS, status: 'IN_QUEUE' })
        }

        const prompt = buildNanoBananaBackgroundPrompt(String(backgroundValue ?? ''))
        console.log(`\n[generate-background-text] Prompt sent to Fal (${TEXT_BACKGROUNDS}):\n`)
        console.log(prompt)
        const queued = await fal.queue.submit(TEXT_BACKGROUNDS, {
          input: { prompt },
        })
        const queuedId = getFalQueueId(queued)
        return Response.json({
          requestId: queuedId,
          endpointId: TEXT_BACKGROUNDS,
          status: 'IN_QUEUE',
        })
      }

      if (tweakImageUrl && typeof tweakImageUrl === 'string') {
        const prompt = typeof customerNotes === 'string' ? customerNotes.trim() : ''
        const hasOriginalPhoto =
          typeof carImageDataUrl === 'string' && carImageDataUrl.length > 0
        const originalPhotoUrl = hasOriginalPhoto
          ? await uploadDataUrl(String(carImageDataUrl))
          : null
        const imageUrls = originalPhotoUrl
          ? [originalPhotoUrl, String(tweakImageUrl)]
          : [String(tweakImageUrl)]
        console.log(`\n[generate-car-tweak] Prompt sent to Fal (${FAL_MODEL}):\n`)
        console.log(prompt)
        const queued = await fal.queue.submit(FAL_MODEL, {
          input: {
            prompt,
            image_urls: imageUrls,
            image_size: { width: 1024, height: 1024 },
            quality: 'medium',
            output_format: 'png',
            num_images: 1,
          },
        })
        const queuedId = getFalQueueId(queued)
        return Response.json({ requestId: queuedId, endpointId: FAL_MODEL, status: 'IN_QUEUE' })
      }

      if (typeof carImageDataUrl !== 'string' || !carImageDataUrl) {
        return Response.json({ error: 'Car image is required' }, { status: 400 })
      }
      const [styleRefDataUrl, carImageUrl] = await Promise.all([
        loadStyleReference(),
        uploadDataUrl(carImageDataUrl),
      ])
      const styleRefUrl = await uploadDataUrl(styleRefDataUrl)
      const prompt = buildFullPrompt({
        customerNotes: typeof customerNotes === 'string' ? customerNotes : undefined,
      })
      const imageUrlsForFal = [carImageUrl, styleRefUrl]
      console.log(`\n[generate-car] Prompt sent to Fal (${FAL_MODEL}) with ${imageUrlsForFal.length} image_urls:`)
      console.log(`  [1] (original) ${carImageUrl}`)
      console.log(`  [2] (style-ref) ${styleRefUrl}`)
      console.log(prompt)
      const queued = await fal.queue.submit(FAL_MODEL, {
        input: {
          prompt,
          image_urls: imageUrlsForFal,
          image_size: { width: 1024, height: 1024 },
          quality: 'medium',
          output_format: 'png',
          num_images: 1,
        },
      })
      const queuedId = getFalQueueId(queued)
      return Response.json({ requestId: queuedId, endpointId: FAL_MODEL, status: 'IN_QUEUE' })
    }

    if (mode === 'background') {
      if (!backgroundValue || !String(backgroundValue).trim()) {
        return Response.json({ error: 'Background value is required' }, { status: 400 })
      }
      if (backgroundImageDataUrl && typeof backgroundImageDataUrl === 'string') {
        const imageUrl = await uploadDataUrl(backgroundImageDataUrl)
        const prompt = buildBackgroundPrompt(String(backgroundValue ?? ''))
        console.log(`\n[generate-background-edit] Prompt sent to Fal (${IMAGE_BACKGROUNDS}):\n`)
        console.log(prompt)
        result = await fal.subscribe(IMAGE_BACKGROUNDS, {
          input: {
            prompt,
            image_urls: [imageUrl],
            image_size: '1024x1024',
            background: 'transparent',
            quality: 'high',
          },
          logs: true,
        })
      } else {
        const prompt = buildNanoBananaBackgroundPrompt(String(backgroundValue ?? ''))
        console.log(`\n[generate-background-text] Prompt sent to Fal (${TEXT_BACKGROUNDS}):\n`)
        console.log(prompt)
        result = await fal.subscribe(TEXT_BACKGROUNDS, {
          input: {
            prompt,
          },
          logs: true,
        })
      }
    } else {
      if (typeof carImageDataUrl !== 'string' || !carImageDataUrl) {
        return Response.json({ error: 'Car image is required' }, { status: 400 })
      }
      const [styleRefDataUrl, carImageUrl] = await Promise.all([
        loadStyleReference(),
        uploadDataUrl(carImageDataUrl),
      ])
      const styleRefUrl = await uploadDataUrl(styleRefDataUrl)
      const prompt = buildFullPrompt({
        customerNotes: typeof customerNotes === 'string' ? customerNotes : undefined,
      })
      const imageUrlsForFal = [carImageUrl, styleRefUrl]
      console.log(`\n[generate] Prompt sent to Fal (${FAL_MODEL}) with ${imageUrlsForFal.length} image_urls:`)
      console.log(`  [1] (original) ${carImageUrl}`)
      console.log(`  [2] (style-ref) ${styleRefUrl}`)
      console.log(prompt)
      result = await fal.subscribe(FAL_MODEL, {
        input: {
          prompt,
          image_urls: imageUrlsForFal,
          image_size: { width: 1024, height: 1024 },
          quality: 'medium',
          output_format: 'png',
          num_images: 1,
        },
        logs: true,
      })
    }

    const data = result.data
    const imageUrl = data?.images?.[0]?.url
    if (!imageUrl) {
      return Response.json(
        { error: 'No image URL in Fal response', detail: data },
        { status: 500 }
      )
    }

    const syncPersistKind = mode === 'background' ? 'background' : 'car'
    const metadata =
      syncPersistKind === 'background'
        ? {
            source: 'fal_subscribe',
            background_value: backgroundValue != null ? String(backgroundValue) : '',
            has_custom_background_image: Boolean(backgroundImageDataUrl),
            fal_request_id: result.requestId != null ? String(result.requestId) : null,
          }
        : {
            source: 'fal_subscribe',
            customer_notes: customerNotes != null ? String(customerNotes) : '',
            fal_request_id: result.requestId != null ? String(result.requestId) : null,
          }
    const supabase = await tryPersistGeneratedImage({
      imageUrl,
      kind: syncPersistKind,
      metadata,
    })

    return Response.json({
      url: imageUrl,
      requestId: result.requestId,
      supabase,
    })
  } catch (err: unknown) {
    const falErr = err as { message?: string; body?: unknown }
    const message = falErr?.message || String(err)
    const body =
      falErr?.body && typeof falErr.body === 'object'
        ? JSON.stringify(falErr.body)
        : falErr?.body
    return Response.json(
      { error: body ? `${message}: ${body}` : message },
      { status: 500 }
    )
  }
}
