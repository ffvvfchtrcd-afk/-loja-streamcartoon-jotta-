import { prisma } from '@/lib/prisma'

export async function generateMetadata({ params }) {
  try {
    const id = Number(params.id)
    const product = await prisma.product.findUnique({
      where: { id },
      select: { name: true, description: true, price: true, category: true, images: { select: { url: true }, take: 1 } },
    })

    if (!product) {
      return { title: 'Produto não encontrado - StreamCartoon' }
    }

    const imageUrl = product.images?.[0]?.url || null
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loja-streamcartoon-jotta.vercel.app'

    return {
      title: `${product.name} - StreamCartoon`,
      description: product.description?.slice(0, 160) || `${product.name} por R$ ${Number(product.price).toFixed(2)}`,
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 160),
        url: `${baseUrl}/produto/${id}`,
        siteName: 'StreamCartoon',
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
        type: 'website',
        locale: 'pt_BR',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description?.slice(0, 160),
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return { title: 'StreamCartoon' }
  }
}

export default function ProdutoLayout({ children }) {
  return children
}
