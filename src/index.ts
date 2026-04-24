import PostalMime from 'postal-mime'
export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      const rawEmail = await new Response(message.raw).arrayBuffer()
      const parser = new PostalMime()
      const parsed = await parser.parse(rawEmail)
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
      console.log('Sending to:', env.APP_URL)
      console.log('Payload to field:', payload.to)
      const response = await fetch(`${env.APP_URL}/api/email/inbound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': env.WORKER_SECRET,
        },
        body: JSON.stringify(payload),
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        const text = await response.text()
        console.error('Response body:', text)
        throw new Error(`App responded with ${response.status}`)
      }
      console.log('Success!')
    } catch (err) {
      console.error('Email worker error:', err)
    }
  },
}
interface Env {
  APP_URL: string
  WORKER_SECRET: string
}