"use client";

import { BookOpen, Store, MessageCircle, Zap, HelpCircle } from "lucide-react";

function Secao({ icon: Icon, titulo, children }: { icon: any; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-orange-500" />
        <h2 className="font-semibold text-foreground">{titulo}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <BookOpen className="h-6 w-6 text-orange-500" />
          Documentos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manual de uso do Catálogo Viral Inteligente
        </p>
      </div>

      <Secao icon={HelpCircle} titulo="Como o sistema funciona">
        <p>O Catálogo Viral monitora produtos em marketplaces, identifica ofertas com desconto real e publica automaticamente (ou manualmente, dependendo da loja) nos seus grupos de WhatsApp.</p>
        <p>Para a Shopee, tudo acontece sozinho: busca, geração de oferta e publicação. Para as demais lojas, você cadastra o produto e decide quando publicar.</p>
      </Secao>

      <Secao icon={Store} titulo="Como conectar marketplaces">
        <p>Vá em <strong>Marketplaces</strong>. Lá existem dois tipos de loja:</p>
        <p><strong>Com API</strong> (Shopee, Amazon, Mercado Livre, AliExpress, Awin/Lomadee): cole o App ID e Secret Key nos campos correspondentes e clique em salvar.</p>
        <p><strong>Só link</strong> (TikTok Shop, Temu, Shein): cole o link de afiliado do produto no campo "Link de afiliado". O produto será criado e aparecerá em Produtos e no Catálogo Viral.</p>
      </Secao>

      <Secao icon={MessageCircle} titulo="Como configurar o WhatsApp">
        <p>Vá em <strong>Grupos de WhatsApp</strong>. Clique em "Buscar grupos reais do WhatsApp" para listar os grupos disponíveis na conexão atual, e salve os que você quer usar.</p>
        <p>Só grupos marcados como "Ativo" recebem publicações automáticas. Use o botão de lixeira para remover um grupo salvo por engano.</p>
      </Secao>

      <Secao icon={Zap} titulo="Como funciona a Automação">
        <p>Vá em <strong>Automação</strong> para ver o robô que busca ofertas na Shopee a cada hora.</p>
        <p>Você pode pausar, ativar ou clicar em "Executar agora" para forçar uma busca imediata, sem esperar o próximo ciclo.</p>
        <p>O sistema publica no máximo 5 ofertas por dia, com 3 horas de intervalo entre cada uma, entre 8h e 22h — e nunca repete o mesmo produto em menos de 24 horas.</p>
      </Secao>

      <Secao icon={HelpCircle} titulo="Como interpretar os Relatórios">
        <p>Em <strong>Relatórios</strong> e no <strong>Dashboard</strong>, os números mostrados são reais, tirados direto do banco de dados: produtos monitorados, ofertas geradas, publicações enviadas e grupos ativos.</p>
        <p>O gráfico "Ofertas por Status" mostra quantas ofertas estão pendentes, aprovadas ou rejeitadas.</p>
      </Secao>
    </div>
  );
}
