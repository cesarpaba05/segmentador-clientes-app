import React from 'react';
import { BusinessContext } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import { Sparkles, Briefcase, Target, HelpCircle } from 'lucide-react';

interface Step1ContextProps {
  context: BusinessContext;
  onChange: (updated: BusinessContext) => void;
  onNext: () => void;
  onLoadSampleData: () => void;
}

const SECTOR_PRESETS = [
  'Telecomunicaciones y Servicios Digitales',
  'Comercio Electrónico / Retail',
  'Banca, Seguros y Servicios Financieros',
  'Software / SaaS y Servicios B2B',
  'Salud, Bienestar y Farmacia',
  'Turismo, Hotelería y Viajes',
  'Educación y Formación Continua',
  'Consumo Masivo y Alimentos',
  'Otro sector empresarial',
];

const EXAMPLE_CONTEXTS = [
  {
    title: 'Telecomunicaciones & Datos',
    sector: 'Telecomunicaciones y Servicios Digitales',
    problem: 'Pérdida de clientes prepago y baja adopción de servicios digitales de mayor margen. La oferta actual es genérica y trata igual al cliente que solo llama y al que consume streaming intensivo.',
    objective: 'Identificar 3 a 5 grupos claros con patrones de consumo divergentes para diseñar planes comerciales diferenciados, reducir el churn en un 15% y aumentar el ARPU con ventas cruzadas.',
  },
  {
    title: 'Retail & Comercio',
    sector: 'Comercio Electrónico / Retail',
    problem: 'Descuentos masivos poco rentables. Gran base de compradores de una sola vez que no repiten compra, mientras que los compradores recurrentes reciben las mismas promociones básicas.',
    objective: 'Agrupar clientes por recencia, frecuencia y gasto monetario para enfocar presupuestos de fidelización en los más rentables y reactivar a los inactivos con bajo costo.',
  },
  {
    title: 'Banca & Finanzas',
    sector: 'Banca, Seguros y Servicios Financieros',
    problem: 'Baja colocación de productos de inversión y seguros en la cartera activa de cuentas corrientes y tarjetas.',
    objective: 'Segmentar la cartera según transaccionalidad y saldo para personalizar campañas de asesoría patrimonial y microcréditos.',
  },
];

export const Step1Context: React.FC<Step1ContextProps> = ({
  context,
  onChange,
  onNext,
  onLoadSampleData,
}) => {
  const isFormValid =
    context.sector.trim().length > 2 &&
    context.problem.trim().length > 5 &&
    context.objective.trim().length > 5;

  const handleApplyPreset = (item: typeof EXAMPLE_CONTEXTS[0]) => {
    onChange({
      sector: item.sector,
      problem: item.problem,
      objective: item.objective,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 1 de 10</span>
          <span>·</span>
          <span>Estrategia Inicial</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Contexto y Objetivos del Negocio
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Antes de mirar números o algoritmos, definamos el propósito comercial. La matemática debe servir a la toma de decisiones, no al revés.
        </p>
      </div>

      {/* Primary Business Principle Highlight */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300">
              Principio fundamental:
            </h3>
            <p className="mt-1 text-sm text-stone-200 font-medium">
              "El número de grupos lo decide el negocio, no solo la estadística."
            </p>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed">
              Un modelo matemático puede decirte que hay 8 grupos óptimos, pero si tu equipo comercial solo tiene capacidad para gestionar 4 campañas distintas, 8 grupos serán inútiles. La segmentación debe ser accionable para mercadeo, ventas y operaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Pickers */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Cargar ejemplo predeterminado para explorar rápido:
          </span>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Cargar datos de prueba de Telecomunicaciones
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {EXAMPLE_CONTEXTS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-lg border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-colors"
            >
              <div className="text-xs font-bold text-stone-900">{preset.title}</div>
              <div className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                {preset.problem}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 space-y-5 shadow-xs">
        {/* Sector */}
        <div>
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide mb-1.5">
            1. Sector Económico o Industria
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={SECTOR_PRESETS.includes(context.sector) ? context.sector : 'Otro sector empresarial'}
              onChange={(e) => {
                if (e.target.value !== 'Otro sector empresarial') {
                  onChange({ ...context, sector: e.target.value });
                }
              }}
              className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:bg-white focus:outline-none"
            >
              {SECTOR_PRESETS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="O escribe tu sector personalizado..."
              value={context.sector}
              onChange={(e) => onChange({ ...context, sector: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Problema de negocio */}
        <div>
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide mb-1.5">
            2. Problema de Negocio a Resolver
          </label>
          <p className="text-xs text-stone-500 mb-2">
            ¿Qué reto comercial, ineficiencia o fricción estás experimentando con tus clientes actualmente?
          </p>
          <textarea
            rows={3}
            placeholder="Ejemplo: Nuestras promociones son generales y tienen baja tasa de conversión; además tenemos fuga de clientes de alto valor sin previo aviso..."
            value={context.problem}
            onChange={(e) => onChange({ ...context, problem: e.target.value })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:outline-none"
          />
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide mb-1.5">
            3. Objetivo de la Segmentación
          </label>
          <p className="text-xs text-stone-500 mb-2">
            ¿Qué decisión comercial o acción concreta esperas tomar una vez descubras los grupos?
          </p>
          <textarea
            rows={3}
            placeholder="Ejemplo: Crear 3 a 5 paquetes de servicio personalizados, fijar presupuestos publicitarios según el valor del cliente y optimizar la retención..."
            value={context.objective}
            onChange={(e) => onChange({ ...context, objective: e.target.value })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Explainer Box */}
      <ConceptExplainer title="¿Por qué empezamos por el contexto del negocio?">
        <p>
          La analítica de datos sin contexto produce números sin sentido práctico. En los negocios, agrupar clientes (o segmentar) tiene un solo fin: <strong>tomar mejores decisiones de inversión, producto, precio y comunicación</strong>.
        </p>
        <p>
          Tener claros tu sector y objetivos desde el minuto cero nos permitirá generar recomendaciones de mercadeo (4P y Matriz de Oportunidad en el Paso 9) que hablen exactamente el idioma de tu negocio, no un texto genérico de manual escolar.
        </p>
      </ConceptExplainer>

      {/* Action button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!isFormValid}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
            isFormValid
              ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          Guardar y Continuar al Paso 2 (Cargar Datos) →
        </button>
      </div>
    </div>
  );
};
