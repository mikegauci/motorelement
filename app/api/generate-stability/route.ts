export async function POST(request: Request) {
  const { apiKey, prompt, imageB64, imageStrength, cfgScale, steps } = (await request.json()) as {
    apiKey?: string
    prompt?: string
    imageB64?: string
    imageStrength?: number
    cfgScale?: number
    steps?: number
  }

  if (!apiKey) {
    return Response.json({ error: 'Missing Stability AI API key' }, { status: 400 })
  }

  if (!imageB64) {
    return Response.json({ error: 'Missing image' }, { status: 400 })
  }

  try {
    const base64Data = imageB64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const formData = new FormData()
    formData.append('init_image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png')
    formData.append('init_image_mode', 'IMAGE_STRENGTH')
    formData.append('image_strength', String(imageStrength ?? 0.5))
    formData.append('text_prompts[0][text]', prompt ?? '')
    formData.append('text_prompts[0][weight]', '1')
    if (cfgScale) {
      formData.append('cfg_scale', String(cfgScale))
    }
    formData.append('steps', String(steps ?? 40))
    formData.append('samples', '1')

    const res = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      }
    )

    if (!res.ok) {
      const err = (await res.json().catch(() => ({ message: res.statusText }))) as {
        errors?: string[]
        message?: string
        name?: string
      }
      const msg = err.errors?.join(', ') || err.message || err.name || JSON.stringify(err)
      return Response.json({ error: msg }, { status: res.status })
    }

    const data = (await res.json()) as {
      artifacts?: { finishReason?: string; base64?: string }[]
    }
    const artifact = data.artifacts?.[0]

    if (!artifact || artifact.finishReason === 'ERROR') {
      return Response.json({ error: 'Generation failed' }, { status: 500 })
    }

    if (artifact.finishReason === 'CONTENT_FILTERED') {
      return Response.json({ error: 'Content filtered by safety system' }, { status: 400 })
    }

    return Response.json({ url: `data:image/png;base64,${artifact.base64}` })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
