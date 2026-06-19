import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade - StreamCartoon',
  description: 'Política de privacidade da StreamCartoon. Saiba como tratamos seus dados.',
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-green-neon hover:underline text-sm mb-8 inline-block">← Voltar para Loja</Link>
      <h1 className="title-cartoon text-4xl text-white mb-8">Política de Privacidade</h1>

      <div className="card-cartoon p-8 space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">1. Coleta de Dados</h2>
          <p>Coletamos apenas os dados necessários para processar seu pedido: nome, email, WhatsApp (opcional) e informações de login (usuário e senha criptografada).</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">2. Uso dos Dados</h2>
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Processar e entregar seus pedidos</li>
            <li>Fornecer suporte através de tickets</li>
            <li>Melhorar nossos serviços</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">3. Compartilhamento</h2>
          <p>Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para processamento de pagamentos (gateways PIX/Mercado Pago) ou por requisição judicial.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">4. Segurança</h2>
          <p>Utilizamos criptografia (bcrypt) para senhas e tokens JWT para autenticação. Todas as comunicações são feitas via HTTPS.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">5. Seus Direitos</h2>
          <p>Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco. Seus dados serão removidos em até 30 dias.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">6. Cookies</h2>
          <p>Utilizamos cookies apenas para autenticação (token JWT armazenado localmente). Não usamos cookies de rastreamento ou publicidade.</p>
        </section>

        <section>
          <h2 className="font-cartoon text-xl text-white mb-3">7. Contato</h2>
          <p>Para questões sobre privacidade, entre em contato através dos nossos tickets de suporte na área do cliente.</p>
        </section>
      </div>
    </div>
  )
}