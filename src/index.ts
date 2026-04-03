import PostalMime from 'postal-mime'

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      // Parse the raw email
      const rawEmail = await new Response(message.raw).arrayBuffer()
      const parser = new PostalMime()
      const parsed = await parser.parse(rawEmail)

      // Build normalized payload
      const payload = {
        from: message.from,
        to: message.to,
        subject: parsed.subject ?? '',
        body: parsed.text ?? parsed.html ?? '',
        attachments: (parsed.attachments ?? []).map(a => ({
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.content.byteLength,
        })),
      }

      // Forward to Nuxt app
      const response = await fetch(`${env.APP_URL}/api/email/inbound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': env.WORKER_SECRET,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`App responded with ${response.status}`)
      }

    } catch (err) {
      console.error('Email worker error:', err)
    }
  },
}

interface Env {
  APP_URL: string
  WORKER_SECRET: string
}
