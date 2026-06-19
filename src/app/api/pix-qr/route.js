import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Código PIX não informado' }, { status: 400 })
  }

  try {
    const qrBuffer = await QRCode.toBuffer(code, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar QR Code' }, { status: 500 })
  }
}
