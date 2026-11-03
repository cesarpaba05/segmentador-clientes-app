import React, { useState } from 'react';
import { BusinessContext, GroupStrategy, KMeansResult } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Cpu,
  Target,
  Megaphone,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface Step9MarketingStrategyProps {
  strategies: GroupStrategy[];
  businessContext: BusinessContext;
  kmeansResult: KMeansResult;
  onNext: () => void;
  onPrev: () => void;
}

const QUADRANT_COLORS = {
  Proteger: {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dot: 'bg-emerald-500',
    title: 'text-emerald-950',
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-300',
    icon: ShieldCheck,
  },
  Rentabilizar: {
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
    title: 'text-amber-950',
    bg: 'bg-amber-50/50',
    border: 'border-amber-300',
    icon: Coins,
  },
  Desarrollar: {
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    dot: 'bg-indigo-500',
    title: 'text-indigo-950',
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-300',
    icon: TrendingUp,
  },
  'Mantener con bajo costo': {
    badge: 'bg-stone-100 text-stone-800 border-stone-300',
    dot: 'bg-stone-500',
    title: 'text-stone-900',
    bg: 'bg-stone-50/60',
    border: 'border-stone-300',
    icon: Cpu,
  },
};

export const Step9MarketingStrategy: React.FC<Step9MarketingStrategyProps> = ({
  strategies,
  businessContext,
  kmeansResult,
  onNext,
  onPrev,
}) => {
  const [activeCluster, setActiveCluster] = useState<number>(0);

  const selectedStrategy = strategies.find((s) => s.clusterId === activeCluster) || strategies[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 9 de 10</span>
          <span>·</span>
          <span>Estrategia de Mercadeo y Matriz de Decisión</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Estrategia de Marketing por Segmento
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Transformamos los centroides matemáticos y el contexto de <strong>{businessContext.sector || 'tu negocio'}</strong> en un plan de acción concreto: motivación de compra (Maslow), propuesta 4P, diseño de producto y prioridad comercial.
        </p>
      </div>

      {/* Opportunity Matrix (Matriz de Prioridad Comercial) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" />
              Matriz de Oportunidad Estratégica (Tamaño vs. Nivel de Consumo)
            </h3>
            <p className="text-xs text-stone-500">
              Ubicación de cada segmento según el volumen de clientes (eje horizontal) y su intensidad de consumo promedio (eje vertical).
            </p>
          </div>
        </div>

        {/* 2x2 Grid Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Top Left: Rentabilizar */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 min-h-[130px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-700" />
                  Rentabilizar (Alto consumo · Nicho selecto)
                </span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  Margen unitario alto
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1">
                Clientes de alto valor pero en menor cantidad. Enfocarse en exclusividad y rentabilidad.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strategies
                .filter((s) => s.quadrant === 'Rentabilizar')
                .map((s) => (
                  <button
                    key={s.clusterId}
                    type="button"
                    onClick={() => setActiveCluster(s.clusterId)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                      activeCluster === s.clusterId
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-stone-800 border-amber-300 hover:bg-amber-100/60'
                    }`}
                  >
                    {s.clusterName} ({s.customerPercent.toFixed(1).replace('.', ',')}%)
                  </button>
                ))}
              {strategies.filter((s) => s.quadrant === 'Rentabilizar').length === 0 && (
                <span className="text-xs text-stone-400 italic">Sin grupos en este cuadrante</span>
              )}
            </div>
          </div>

          {/* Top Right: Proteger */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 min-h-[130px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Proteger (Alto consumo · Gran volumen)
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  Clientes Clave / Estrella
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1">
                Sostienen la mayor parte del flujo de caja. Cero tolerancia a fallos; atención preferencial.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strategies
                .filter((s) => s.quadrant === 'Proteger')
                .map((s) => (
                  <button
                    key={s.clusterId}
                    type="button"
                    onClick={() => setActiveCluster(s.clusterId)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                      activeCluster === s.clusterId
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-800 border-emerald-300 hover:bg-emerald-100/60'
                    }`}
                  >
                    {s.clusterName} ({s.customerPercent.toFixed(1).replace('.', ',')}%)
                  </button>
                ))}
              {strategies.filter((s) => s.quadrant === 'Proteger').length === 0 && (
                <span className="text-xs text-stone-400 italic">Sin grupos en este cuadrante</span>
              )}
            </div>
          </div>

          {/* Bottom Left: Mantener con bajo costo */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 min-h-[130px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-stone-600" />
                  Mantener con bajo costo (Bajo consumo · Volumen bajo/medio)
                </span>
                <span className="text-[10px] text-stone-600 font-semibold bg-stone-200 px-2 py-0.5 rounded">
                  Autoservicio Digital
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1">
                Sensibles al precio y bajo margen. Automatizar procesos para no quemar recursos operativos.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strategies
                .filter((s) => s.quadrant === 'Mantener con bajo costo')
                .map((s) => (
                  <button
                    key={s.clusterId}
                    type="button"
                    onClick={() => setActiveCluster(s.clusterId)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                      activeCluster === s.clusterId
                        ? 'bg-stone-800 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {s.clusterName} ({s.customerPercent.toFixed(1).replace('.', ',')}%)
                  </button>
                ))}
              {strategies.filter((s) => s.quadrant === 'Mantener con bajo costo').length === 0 && (
                <span className="text-xs text-stone-400 italic">Sin grupos en este cuadrante</span>
              )}
            </div>
          </div>

          {/* Bottom Right: Desarrollar */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 min-h-[130px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-700" />
                  Desarrollar (Consumo moderado · Gran masa de clientes)
                </span>
                <span className="text-[10px] text-indigo-800 font-semibold bg-indigo-100 px-2 py-0.5 rounded">
                  Potencial de Crecimiento
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1">
                Gran base de clientes con oportunidad de migrar a planes superiores (cross-selling y up-selling).
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strategies
                .filter((s) => s.quadrant === 'Desarrollar')
                .map((s) => (
                  <button
                    key={s.clusterId}
                    type="button"
                    onClick={() => setActiveCluster(s.clusterId)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                      activeCluster === s.clusterId
                        ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                        : 'bg-white text-stone-800 border-indigo-300 hover:bg-indigo-100/60'
                    }`}
                  >
                    {s.clusterName} ({s.customerPercent.toFixed(1).replace('.', ',')}%)
                  </button>
                ))}
              {strategies.filter((s) => s.quadrant === 'Desarrollar').length === 0 && (
                <span className="text-xs text-stone-400 italic">Sin grupos en este cuadrante</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Tabs Navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {strategies.map((strat) => {
          const isActive = strat.clusterId === activeCluster;
          return (
            <button
              key={strat.clusterId}
              type="button"
              onClick={() => setActiveCluster(strat.clusterId)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="font-mono text-[10px] mr-1 opacity-70">G{strat.clusterId + 1}:</span>
              {strat.clusterName}
            </button>
          );
        })}
      </div>

      {/* Detail Strategy Card for Active Cluster */}
      {selectedStrategy && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
          {/* Card Title & Quadrant Banner */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Ficha Comercial · Grupo {selectedStrategy.clusterId + 1}
                </span>
                <span>·</span>
                <span className="text-xs text-stone-500">
                  {selectedStrategy.customerCount} clientes ({selectedStrategy.customerPercent.toFixed(1)}% del total)
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mt-1">
                {selectedStrategy.clusterName}
              </h3>
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                QUADRANT_COLORS[selectedStrategy.quadrant].badge
              }`}
            >
              <span>Prioridad: {selectedStrategy.quadrant}</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 italic">
            {selectedStrategy.quadrantDescription}
          </p>

          {/* Distinctive Traits */}
          <div className="rounded-lg bg-stone-50 p-3.5 border border-stone-200 text-xs">
            <span className="font-bold text-stone-800 block mb-1">
              Rasgos y Variables Dominantes del Grupo:
            </span>
            <ul className="list-disc pl-5 space-y-0.5 text-stone-700">
              {selectedStrategy.dominantTraits.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Maslow / Consumer Psychology Grid */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2.5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Motivación del Consumidor (Pirámide de Maslow)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <div className="font-bold text-stone-500 uppercase tracking-wider text-[10px] mb-1">
                  1. Necesidad Básica
                </div>
                <p className="text-stone-800 leading-relaxed font-medium">
                  {selectedStrategy.maslow.need}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <div className="font-bold text-stone-500 uppercase tracking-wider text-[10px] mb-1">
                  2. Deseo
                </div>
                <p className="text-stone-800 leading-relaxed font-medium">
                  {selectedStrategy.maslow.desire}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200">
                <div className="font-bold text-stone-500 uppercase tracking-wider text-[10px] mb-1">
                  3. Demanda Concreta
                </div>
                <p className="text-stone-800 leading-relaxed font-medium">
                  {selectedStrategy.maslow.demand}
                </p>
              </div>
            </div>
          </div>

          {/* The 4Ps Strategy Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2.5 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-600" />
              Estrategia Comercial de las 4P
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <div className="font-bold text-sky-800 uppercase tracking-wider text-[11px] mb-1">
                  Producto
                </div>
                <p className="text-stone-700 leading-relaxed">
                  {selectedStrategy.fourPs.product}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <div className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] mb-1">
                  Precio
                </div>
                <p className="text-stone-700 leading-relaxed">
                  {selectedStrategy.fourPs.price}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <div className="font-bold text-purple-800 uppercase tracking-wider text-[11px] mb-1">
                  Plaza (Canales)
                </div>
                <p className="text-stone-700 leading-relaxed">
                  {selectedStrategy.fourPs.place}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <div className="font-bold text-amber-800 uppercase tracking-wider text-[11px] mb-1">
                  Promoción
                </div>
                <p className="text-stone-700 leading-relaxed">
                  {selectedStrategy.fourPs.promotion}
                </p>
              </div>
            </div>
          </div>

          {/* Communication Plan & New Product Idea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Communication */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-amber-600" />
                Plan de Comunicación
              </h4>
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div>
                  <span className="font-bold text-stone-500 text-[10px] uppercase">Mensaje Clave:</span>
                  <p className="font-semibold text-stone-900 italic mt-0.5">
                    "{selectedStrategy.communicationPlan.keyMessage}"
                  </p>
                </div>
                <div className="pt-1">
                  <span className="font-bold text-stone-500 text-[10px] uppercase">Canales Prioritarios:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedStrategy.communicationPlan.channels.map((ch, i) => (
                      <span key={i} className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-1">
                  <span className="font-bold text-stone-500 text-[10px] uppercase">Tono de Comunicación:</span>
                  <p className="text-stone-700 mt-0.5">{selectedStrategy.communicationPlan.tone}</p>
                </div>
              </div>
            </div>

            {/* Product Design & Innovation Idea */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Diseño de Oferta e Idea de Innovación
              </h4>
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2">
                <div>
                  <span className="font-bold text-stone-500 text-[10px] uppercase">Diseño del Plan / Paquete Sugerido:</span>
                  <p className="text-stone-800 font-medium mt-0.5 leading-relaxed">
                    {selectedStrategy.productPlanDesign}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="font-bold text-amber-800 text-[10px] uppercase">Idea de Nuevo Producto / Servicio:</span>
                  <p className="text-amber-950 font-medium mt-0.5 leading-relaxed">
                    💡 {selectedStrategy.newProductIdea}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explainer */}
      <ConceptExplainer title="¿Por qué nunca debes ofrecer descuentos masivos a los clientes de alto consumo?">
        <p>
          Un error comercial muy común es lanzar promociones de descuento generalizadas. A un cliente del segmento <strong>"Proteger / VIP"</strong> que ya gasta el triple del promedio, darle un 30% de descuento no aumentará su lealtad; simplemente reducirá tu margen de ganancia en una venta que ya tenías asegurada.
        </p>
        <p>
          Los clientes de alto valor buscan <strong>reconocimiento, prioridad, exclusividad y ausencia de fricciones</strong>. Reserva los descuentos y promociones de precio exclusivamente para segmentos sensibles o para activar a clientes en riesgo del cuadrante <em>"Desarrollar"</em>.
        </p>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Perfil de Grupos
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 10 (Exportar Resultados) →
        </button>
      </div>
    </div>
  );
};
