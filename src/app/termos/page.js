import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso - StreamCartoon',
  description: 'Termos e condições de uso da StreamCartoon. Saiba mais sobre nossas políticas.',
}

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-green-neon hover:underline text-sm mb-8 inline-block">← Voltar para Loja</Link>
      <h1 className="title-cartoon text-4xl text-white mb-8">Termos de Uso</h1>

      <div className="card-cartoon p-8 space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">1. Aceitação dos Termos</h2>
          <p>Ao utilizar os serviços da StreamCartoon, você concorda com os termos e condições aqui descritos. Se não concordar com algum destes termos, não utilize nossos serviços.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">2. Descrição dos Serviços</h2>
          <p>A StreamCartoon atua como intermediária na venda de códigos de acesso e assinaturas para serviços de streaming. Vendemos códigos de acesso gerados por parceiros autorizados.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">3. Pagamentos</h2>
          <p>Todos os pagamentos são processados através de gateways seguros (PIX e Mercado Pago). Os valores são cobrados no momento da compra e o código de acesso é liberado após a confirmação do pagamento.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">4. Entrega</h2>
          <p>Após a confirmação do pagamento, o código de acesso é disponibilizado automaticamente na página do pedido. O prazo de entrega pode variar de alguns segundos a até 24 horas em casos de verificação manual.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">5. Política de Troca e Devolução</h2>
          <p>Por se tratar de produtos digitais, não aceitamos devoluções após o código ser gerado e visualizado pelo cliente. Em caso de problemas com o código recebido, entre em contato com nosso suporte através da página de tickets.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">6. Responsabilidades</h2>
          <p>A StreamCartoon não se responsabiliza por bloqueios ou cancelamentos de contas causados por uso indevido dos códigos pelo comprador. O cliente é responsável por seguir os termos de uso de cada serviço de streaming.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">7. Privacidade</h2>
          <p>Seus dados pessoais são tratados de acordo com nossa Política de Privacidade. Não compartilhamos suas informações com terceiros sem seu consentimento.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">8. Alterações nos Termos</h2>
          <p>A StreamCartoon pode alterar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site.</p>
        </section>
      </div>
    </div>
  )
}
