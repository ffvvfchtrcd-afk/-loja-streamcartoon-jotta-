export async function generatePixPayment(order, mercadoPagoToken) {
  const token = mercadoPagoToken || process.env.MERCADO_PAGO_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!token) {
    throw new Error('Token do Mercado Pago não configurado. Adicione MERCADO_PAGO_ACCESS_TOKEN no .env ou configure no admin.')
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')

  const body = {
    transaction_amount: order.total,
    description: `${order.productName} - ${order.customerName}`,
    payment_method_id: 'pix',
    payer: { email: order.customerEmail, first_name: order.customerName },
    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    external_reference: order.id.toString(),
  }

  if (baseUrl && !isLocal) {
    body.notification_url = `${baseUrl}/api/webhooks/pix`
  }

  const idempotencyKey = `${order.id}-${Date.now()}`

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Mercado Pago: ${data.message || data.error || 'erro desconhecido'}`)
  }

  return {
    qrCode: data.point_of_interaction?.transaction_data?.qr_code_base64
      ? `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`
      : '',
    pixCode: data.point_of_interaction?.transaction_data?.qr_code || '',
    txid: data.id?.toString() || '',
    expiration: data.date_of_expiration,
    status: data.status,
  }
}


