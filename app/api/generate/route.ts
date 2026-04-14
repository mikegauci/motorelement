import { fal } from '@fal-ai/client'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  persistFalImageToSupabase,
  type PersistFalKind,
} from '@/lib/customizer/persistGeneratedToSupabase'

type VehiclePayload = {
  carModel?: string
  showNumberPlate?: boolean
  numberPlate?: string
  customerNotes?: string
}

function getFalQueueId(queued: unknown): string | undefined {
  const q = queued as { request_id?: string; requestId?: string }
  return q?.request_id ?? q?.requestId
}

// const FAL_MODEL = 'fal-ai/gpt-image-1.5/edit'
const FAL_MODEL = 'fal-ai/reve/fast/remix'
const NANO_BANANA_MODEL = 'fal-ai/nano-banana-2'
const STYLE_REFERENCE_ROOT = path.join(process.cwd(), 'public', 'style-reference')
const STYLE_REFERENCE_PATH = path.join(STYLE_REFERENCE_ROOT, 'front', 'hatchback', 'front-01.jpg')
const ROUND_BACKGROUND_REFERENCE_1_PATH = path.join(
  process.cwd(),
  'public',
  'round-background-reference',
  'style-reference-1.png'
)
const ROUND_BACKGROUND_REFERENCE_2_PATH = path.join(
  process.cwd(),
  'public',
  'round-background-reference',
  'style-reference-2.png'
)
function detectExpectedBodyStyle({ carModel, customerNotes }: VehiclePayload) {
  const text = `${carModel || ''} ${customerNotes || ''}`.toLowerCase()
  if (!text.trim()) return null
  const checks: [string, RegExp][] = [
    ['hatchback', /\bhatch(back)?\b/],
    ['sedan', /\b(sedan|saloon)\b/],
    ['wagon', /\b(wagon|estate)\b/],
    ['coupe', /\bcoupe\b/],
    ['ute', /\bute\b/],
    ['pickup', /\b(pickup|pick-up|truck)\b/],
    ['suv', /\b(suv|crossover)\b/],
    ['van', /\bvan\b/],
  ]
  for (const [bodyStyle, re] of checks) {
    if (re.test(text)) return bodyStyle
  }
  return null
}

async function loadStyleReference() {
  return loadStyleReferenceDataUrl(STYLE_REFERENCE_PATH)
}

function buildVehicleDetailsBlock({
  carModel,
  showNumberPlate,
  numberPlate,
  customerNotes,
}: VehiclePayload) {
  const vehicle = typeof carModel === 'string' ? carModel.trim() : ''
  const lines = [
    `  - Car Model + Year: ${vehicle}`,
  ]
  if (showNumberPlate) {
    const plate = typeof numberPlate === 'string' ? numberPlate.trim() : ''
    if (plate) lines.push(`  - Number Plate: ${plate}`)
  }
  const notes = typeof customerNotes === 'string' ? customerNotes.trim() : ''
  if (notes) lines.push(`  - Customer Notes: ${notes}`)
  return `VEHICLE DETAILS:\n${lines.join('\n')}`
}

function buildFullPrompt(vehicle: VehiclePayload) {
  const details = buildVehicleDetailsBlock(vehicle)
  const resolvedBodyStyle = detectExpectedBodyStyle(vehicle)
  const bodyLabel = resolvedBodyStyle ? resolvedBodyStyle.toUpperCase() : null
  const bodyLine = bodyLabel ? `This is a ${bodyLabel}.` : ''
  const numberPlateLine = vehicle.showNumberPlate
    ? 'Reproduce the number plate text and POSITION exactly from Image 1. The plate must be in the same location on the bumper as in Image 1 (e.g. if it is offset to one side, keep it offset — do NOT center it). If unreadable, leave blank.'
    : 'Remove any number plate. Fill the area with the car body colour.'
  const customerNotes = typeof vehicle.customerNotes === 'string' ? vehicle.customerNotes.trim() : ''
  const notesLine = customerNotes ? `\nApply these customer notes: ${customerNotes}` : ''

  return `${details}

---

Convert the car in Image 1 into a vector illustration. ${bodyLine}
Image 2 is a STYLE REFERENCE ONLY — copy the art style, NOT any car shape, angle, or direction from it.

RULE 1 — DO NOT MIRROR OR FLIP THE CAR:
If the car in Image 1 faces left, the output MUST face left.
If the car in Image 1 faces right, the output MUST face right.
NEVER mirror, flip, or reverse the car's facing direction.

RULE 2 — COPY ALL GEOMETRY FROM IMAGE 1 EXACTLY:
Image 1 is the ONLY source for shape, angle, proportions, and details.
- Same angle, perspective, and camera height
- Same body proportions: wheelbase, roof height, bonnet length, rear overhang
- Same window count and placement
- Same wheel size ratio and visibility
- Same number plate position (left-offset, right-offset, or centered — match Image 1 exactly)
- Do not rotate, recompose, or normalize the view
${numberPlateLine}${notesLine}

STYLE (from Image 2 only):
- Bold thick black outlines around all panels
- Flat solid colour fills, minimal shading, hard sharp edges
- ALL windows very dark tinted, near black — no visible interior
- One subtle white highlight streak per window only
- Windshield: dark tint band across top, fading slightly toward bottom
- Satin/matte paint finish, no glossy flares or specular hotspots
- Only render details visible in Image 1 — do not hallucinate or add extras

White background, flat black shadow beneath.`
}

function buildBackgroundPrompt(backgroundValue: string) {
  const value = typeof backgroundValue === 'string' ? backgroundValue.trim() : ''
  return `BACKGROUND DETAILS:
  - Location/Theme: ${value}

---

Transform the scene in Image 1 into a polished graphic
illustration cropped into a perfect circle.

Use Images 2 and 3 as STYLE REFERENCES ONLY for
the illustration style, circle crop format, and
level of detail.

The output must match the style references in:
- Bold flat colour fills with minimal gradients
- Clean simplified shapes, no photographic detail
- Hard edges and strong colour contrast
- Cartoon illustration aesthetic
- Perfect circular crop with clean edges
- No photorealism, no grain, no texture

CRITICAL — COMPOSITION:
- Fill the entire circle with the illustrated scene
- Keep the most iconic elements of the scene prominent
- Use layered depth with foreground and background elements
- Sky, ground, and key landmarks all visible

CRITICAL — COLOUR LIMIT:
- Use a maximum of 5 colours in the final artwork for a clean print-ready result
- If the user explicitly asks for more or less colours in BACKGROUND DETAILS, follow their request
- Prefer tonal variations/shading within the same base colours instead of introducing new colours

CRITICAL — NO HALLUCINATIONS:
- Only illustrate elements visible in Image 1
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

ACCURACY:
  - Unless specified in the BACKGROUND DETAILS, do not add fictional buildings, objects, or extra elements

OUTPUT:
  - High-resolution graphic illustration
  - Perfect circular crop
  - Clean edge around the circle
  - Background outside the circle to be solid white`
}

function parseDataUrl(dataUrl: string) {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!m) throw new Error('Invalid image data URL')
  return { mime: m[1], base64: m[2] }
}

async function uploadDataUrl(dataUrl: string) {
  const { mime, base64 } = parseDataUrl(dataUrl)
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mime })
  return fal.storage.upload(blob)
}

function resolvePersistKind({
  mode,
  endpointId,
}: {
  mode?: unknown
  endpointId?: unknown
}): PersistFalKind {
  if (mode === 'background') return 'background'
  if (mode === 'car') return 'car'
  if (String(endpointId || '') === NANO_BANANA_MODEL) return 'background'
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

async function loadRoundBackgroundReferenceDataUrls() {
  const [buffer1, buffer2] = await Promise.all([
    readFile(ROUND_BACKGROUND_REFERENCE_1_PATH),
    readFile(ROUND_BACKGROUND_REFERENCE_2_PATH),
  ])
  return [
    `data:image/png;base64,${buffer1.toString('base64')}`,
    `data:image/png;base64,${buffer2.toString('base64')}`,
  ]
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
    carModel,
    showNumberPlate,
    numberPlate,
    customerNotes,
    backgroundImageDataUrl,
    backgroundValue,
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
        if (backgroundImageDataUrl && typeof backgroundImageDataUrl === 'string') {
          const [ref1DataUrl, ref2DataUrl] = await loadRoundBackgroundReferenceDataUrls()
          const [url1, url2, url3] = await Promise.all([
            uploadDataUrl(backgroundImageDataUrl),
            uploadDataUrl(ref1DataUrl),
            uploadDataUrl(ref2DataUrl),
          ])
          const prompt = buildBackgroundPrompt(String(backgroundValue ?? ''))
          const queued = await fal.queue.submit(FAL_MODEL, {
            input: { prompt, image_urls: [url1, url2, url3] },
          })
          const queuedId = getFalQueueId(queued)
          return Response.json({ requestId: queuedId, endpointId: FAL_MODEL, status: 'IN_QUEUE' })
        }

        const prompt = buildNanoBananaBackgroundPrompt(String(backgroundValue ?? ''))
        const queued = await fal.queue.submit(NANO_BANANA_MODEL, {
          input: { prompt },
        })
        const queuedId = getFalQueueId(queued)
        return Response.json({
          requestId: queuedId,
          endpointId: NANO_BANANA_MODEL,
          status: 'IN_QUEUE',
        })
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
        carModel: typeof carModel === 'string' ? carModel : undefined,
        showNumberPlate: Boolean(showNumberPlate),
        numberPlate: typeof numberPlate === 'string' ? numberPlate : undefined,
        customerNotes: typeof customerNotes === 'string' ? customerNotes : undefined,
      })
      const queued = await fal.queue.submit(FAL_MODEL, {
        input: {
          prompt,
          image_urls: [carImageUrl, styleRefUrl],
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
        const [ref1DataUrl, ref2DataUrl] = await loadRoundBackgroundReferenceDataUrls()
        const [url1, url2, url3] = await Promise.all([
          uploadDataUrl(backgroundImageDataUrl),
          uploadDataUrl(ref1DataUrl),
          uploadDataUrl(ref2DataUrl),
        ])
        const prompt = buildBackgroundPrompt(String(backgroundValue ?? ''))
        console.log('\n[generate-background-edit] Prompt sent to Fal:\n')
        console.log(prompt)
        result = await fal.subscribe(FAL_MODEL, {
          input: {
            prompt,
            image_urls: [url1, url2, url3],
          },
          logs: true,
        })
      } else {
        const prompt = buildNanoBananaBackgroundPrompt(String(backgroundValue ?? ''))
        console.log('\n[generate-background-text] Prompt sent to Fal (nano-banana-2 ):\n')
        console.log(prompt)
        result = await fal.subscribe(NANO_BANANA_MODEL, {
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
        carModel: typeof carModel === 'string' ? carModel : undefined,
        showNumberPlate: Boolean(showNumberPlate),
        numberPlate: typeof numberPlate === 'string' ? numberPlate : undefined,
        customerNotes: typeof customerNotes === 'string' ? customerNotes : undefined,
      })
      console.log('\n[generate] Prompt sent to Fal:\n')
      console.log(prompt)
      result = await fal.subscribe(FAL_MODEL, {
        input: {
          prompt,
          image_urls: [carImageUrl, styleRefUrl],
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
            car_model: carModel != null ? String(carModel) : '',
            show_number_plate: Boolean(showNumberPlate),
            number_plate: numberPlate != null ? String(numberPlate) : '',
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
