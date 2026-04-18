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

// const FAL_MODEL = 'fal-ai/reve/fast/remix'
const FAL_MODEL = 'fal-ai/gpt-image-1.5/edit'
const IMAGE_BACKGROUNDS = 'fal-ai/nano-banana-2/edit'
const TEXT_BACKGROUNDS = 'fal-ai/nano-banana-2'
const MODEL_TWEAK = 'fal-ai/gemini-3-pro-image-preview/edit'
const STYLE_REFERENCE_ROOT = path.join(process.cwd(), 'public', 'style-reference')
const STYLE_REFERENCE_PATH = path.join(STYLE_REFERENCE_ROOT, 'front', 'hatchback', 'front-01.jpg')
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
Image 2 is a STYLE REFERENCE ONLY — copy its art style. Do not copy its camera, angle, framing, or car shape.

RULE 1 — CAMERA MUST MATCH IMAGE 1 EXACTLY (MOST IMPORTANT — wins over every other rule):
Before drawing anything, study Image 1's camera and reproduce it precisely.
- YAW: measure how much of the car's side is visible in Image 1. Reproduce the SAME amount. If Image 1 shows a slight 3/4 angle, the output must also be a slight 3/4 angle — not a pure rear, pure front, or pure side view, and not a stronger 3/4 angle. If Image 1 is a pure rear view, keep it a pure rear view.
- HEIGHT: match the camera height from Image 1 (low, ground-level, eye-level, or high).
- PERSPECTIVE: match the focal-length feel of Image 1 (wide-angle, normal, or telephoto). Do not flatten perspective into an orthographic projection.
- FRAMING: keep the same zoom and composition. Do not re-center, re-crop, or re-compose.
- FACING: if the car faces left, keep it facing left; if right, keep it right. Never mirror or flip.
- Do NOT use Image 2 for any camera information.

RULE 2 — PRESERVE EVERY DETAIL FROM IMAGE 1 (DO NOT GENERALISE TO A STOCK CAR):
Before drawing, scan Image 1 and inventory every feature. The output must match the SPECIFIC car in Image 1, not a generic/stock version of that model. If a feature exists in Image 1, it MUST exist in the output. If it does not exist in Image 1, it MUST NOT be added.

Check each of these categories and reproduce exactly what you see:
- BODY COLOUR: Match the exact paint colour (hue, saturation, lightness). A blue car must stay that exact blue, not a generic blue. A matte car must stay matte.
- AERO / BODY KIT: Spoilers (roof spoiler, boot spoiler, ducktail, GT wing), splitters, diffusers, side skirts, canards, vents, hood scoops, bonnet bulges, roof scoops, fender flares, widebody kits. If ANY of these are present in Image 1, include them. If absent, do NOT add them.
- MIRRORS: Match the exact shape, style, colour, and mounting of the side mirrors (e.g. body-colour vs black vs carbon, stalk-mounted vs door-mounted, standard vs aftermarket). Do not swap for a generic mirror.
- BADGES & TRIM: Keep all visible badges, emblems, model letters, and trim pieces in their exact positions. Do not reposition, resize, remove, or add badges.
- LIGHTS: Match the exact shape and layout of headlights, taillights, fog lights, and indicators visible in Image 1.
- BUMPERS & GRILLE: Match the specific front/rear bumper design and grille pattern — including any aftermarket bumpers, lips, or grille meshes.
- WHEELS: Match size, design, spoke pattern, spoke count, and colour exactly. If wheels are hidden in Image 1, keep them hidden — do NOT rotate the car even slightly to expose a wheel. It is better to show zero wheels than to change the camera angle.
- WINDOWS & DOORS: Only render windows, door handles, and trim that are visible in Image 1. Match the number and layout of doors/windows.
- NUMBER PLATE POSITION: The plate must appear in the EXACT SAME position on the bumper as in Image 1. If it is offset to one side (e.g. left of centre), keep it offset in the same direction by the same amount. If it is centred, keep it centred. Do not relocate it.
- PROPORTIONS: Match body proportions exactly as they appear in Image 1's camera view. Do NOT infer or extrapolate proportions (wheelbase, bonnet length, rear overhang) not visible from Image 1's angle. If Image 1 is a rear view, you are drawing a rear view — do not rotate the car.

RULE OF THUMB: If you catch yourself thinking "the standard [Model Name] has X", stop. Only draw what THIS specific car in Image 1 has. Stock features may be missing; aftermarket features may be added. Trust Image 1, not your training data.

- ${numberPlateLine}${notesLine}

RULE 3 — ISOLATE THE CAR:
Render only the car. Remove everything else from Image 1 — buildings, streets, pavements, walls, people, other vehicles, signs, trees, sky, and ground textures. Do not render shadows cast by surrounding objects — only the car's own flat shadow directly beneath it. The area around the car must be pure solid white (#FFFFFF), with no ghost outlines, sketches, or grey shapes.

RULE 4 — CAR MUST SIT LEVEL ON A FLAT PLANE:
The car must sit level on a flat, horizontal ground plane in the output.
- If both wheels on the same side are visible, they must rest on the same horizontal line. The line connecting the bottom of the front and rear wheels must be perfectly horizontal (0° tilt).
- The car's roll axis must be level — no diagonal tilt, no leaning left or right, no "pasted at an angle" look.
- If the uploaded photo was taken on a slope, off-camber, or slightly rotated, correct the car so it appears level on flat ground. This is the ONLY correction allowed to the camera — yaw, pitch, framing, and facing from Rule 1 must still be preserved exactly.
- The car's own flat shadow beneath it must also be horizontal, aligned with the flat ground plane.

STYLE (from Image 2 only):
- Bold thick black outlines around all panels
- Flat solid colour fills, minimal shading, hard sharp edges
- All windows very dark tinted, near black — no visible interior. One subtle light-grey highlight streak per window.
- Windshield: dark tint band across the top, fading slightly toward the bottom.
- Satin/matte paint finish — no glossy flares or specular hotspots.

OUTPUT COLOURS — PURE WHITE IS FOR THE BACKGROUND ONLY:
The background behind the car must be pure solid white (#FFFFFF). Every element that is part of the car or its shadow must use a non-white colour. If the customer notes request smoke, exhaust vapour, or any other light-coloured element, render it in off-white or light grey (for example #F5F5F5), never pure white. This keeps the car safe when the white background is later removed for transparency.

Background: pure white. Shadow: flat black, directly beneath the car.`
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
    carModel,
    showNumberPlate,
    numberPlate,
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
        const notes = typeof customerNotes === 'string' ? customerNotes.trim() : ''
        const hasOriginalPhoto =
          typeof carImageDataUrl === 'string' && carImageDataUrl.length > 0
        const originalPhotoUrl = hasOriginalPhoto
          ? await uploadDataUrl(String(carImageDataUrl))
          : null
        const referenceLine = originalPhotoUrl
          ? `\n\nImage 1 is the current illustration — this is what you must edit. The output must stay in the SAME vector illustration art style as Image 1.\nImage 2 is the original photo of the real car — use it ONLY as a visual reference to correct the car's shape, proportions, wheels, badges, mirrors, spoilers, or other details the illustration got wrong.\n\nCRITICAL — Image 2 IS NOT A SCENE TO RECREATE:\n- Do NOT copy anything from Image 2 except the car itself.\n- Do NOT include Image 2's background, buildings, street, pavement, road markings, sky, trees, people, other vehicles, signs, or any scenery.\n- Do NOT copy Image 2's photographic style, lighting, shadows, or colours of surroundings.\n- The output must show ONLY the car on a pure solid white (#FFFFFF) background — exactly like Image 1.`
          : ''
        const prompt = `Edit this car illustration based on these instructions:\n${notes}${referenceLine}\n\nKeep the existing art style, proportions, and composition intact.\nOnly apply the requested changes.\n\nOUTPUT REQUIREMENTS:\n- The output must contain ONLY the car illustration on a pure solid white (#FFFFFF) background.\n- Do NOT add any scenery, buildings, streets, pavements, roads, skies, trees, people, other vehicles, signs, or environment of any kind.\n- Do NOT render shadows cast by surrounding objects — only the car's own flat shadow directly beneath it.\n- The area around the car must be pure solid white (#FFFFFF), with no ghost outlines, sketches, grey shapes, or photographic elements.\n\nSHADOW COLOUR (STRICT):\n- The car's shadow MUST be flat solid black (#000000) or a neutral dark grey. No other colour is allowed.\n- Do NOT tint the shadow with yellow, brown, red, or any colour bled from the original photo's ground, road markings, pavement, or surroundings.\n- If the existing illustration (Image 1) already has a black shadow, keep it exactly as it is — do not change its colour, shape, or position.`
        console.log(`\n[generate-car-tweak] Prompt sent to Fal (${MODEL_TWEAK}):\n`)
        console.log(prompt)
        const imageUrls = originalPhotoUrl
          ? [String(tweakImageUrl), originalPhotoUrl]
          : [String(tweakImageUrl)]
        const queued = await fal.queue.submit(MODEL_TWEAK, {
          input: {
            prompt,
            image_urls: imageUrls,
            output_format: 'png',
          },
        })
        const queuedId = getFalQueueId(queued)
        return Response.json({ requestId: queuedId, endpointId: MODEL_TWEAK, status: 'IN_QUEUE' })
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
      console.log(`\n[generate-car] Prompt sent to Fal (${FAL_MODEL}):\n`)
      console.log(prompt)
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
        carModel: typeof carModel === 'string' ? carModel : undefined,
        showNumberPlate: Boolean(showNumberPlate),
        numberPlate: typeof numberPlate === 'string' ? numberPlate : undefined,
        customerNotes: typeof customerNotes === 'string' ? customerNotes : undefined,
      })
      console.log(`\n[generate] Prompt sent to Fal (${FAL_MODEL}):\n`)
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
