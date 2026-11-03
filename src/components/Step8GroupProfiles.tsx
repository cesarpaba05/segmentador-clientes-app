import React from 'react';
import { CategoricalProfileMetric, NumericProfileMetric } from '../types/segmentation';
import { BoxPlotChart } from '../components/BoxPlotChart';
import { ConceptExplainer } from '../components/ConceptExplainer';
import { CheckCircle2, XCircle, Users, BarChart3, HelpCircle } from 'lucide-react';

interface Step8GroupProfilesProps {
  catProfiles: CategoricalProfileMetric[];
  numProfiles: NumericProfileMetric[];
  onNext: () => void;
  onPrev: () => void;
}

export const Step8GroupProfiles: React.FC<Step8GroupProfilesProps> = ({
  catProfiles,
  numProfiles,
  onNext,
  onPrev,
}) => {
  const hasProfiles = catProfiles.length > 0 || numProfiles.length > 0;

  // Formatting helpers for consistency
  const fmtPValue = (p: number) => (p < 0.001 ? '< 0,001' : p.toFixed(3).replace('.', ','));
  const fmtStat = (val: number) => val.toFixed(2).replace('.', ',');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 8 de 10</span>
          <span>·</span>
          <span>Perfil Demográfico y Validación Estadística</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Perfil de los Grupos: ¿Quiénes son?
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Cruzamos los grupos formados con todas las <strong>variables de perfil seleccionadas</strong> (categóricas y numéricas). Validamos si las diferencias son estadísticamente significativas mediante las pruebas <strong>Chi-cuadrado</strong> (para categorías) y <strong>Kruskal-Wallis</strong> (para métricas numéricas).
        </p>
      </div>

      {!hasProfiles && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-600">
          No seleccionaste variables de perfil en el Paso 4. Puedes continuar directamente a la Estrategia de Marketing o volver al Paso 4 si deseas incluir atributos descriptivos (edad, género, región, etc.).
        </div>
      )}

      {/* Categorical Profiles with Cross-Tables and Chi-Square */}
      {catProfiles.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            Variables de Perfil Categóricas (Tablas Cruzadas y Prueba Chi-Cuadrado)
          </h3>

          {catProfiles.map((prof) => (
            <div
              key={prof.varName}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Variable: <span className="text-amber-900 font-mono">{prof.varName.replace(/_/g, ' ')}</span>
                  </h4>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Prueba Chi-cuadrado: <span className="font-mono">χ² = {fmtStat(prof.chiSquare)}</span>, gl = {prof.degreesOfFreedom}, p-value = <span className="font-mono font-semibold text-stone-800">{fmtPValue(prof.pValue)}</span>
                  </div>
                </div>

                {/* Significance badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    prof.isSignificant
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {prof.isSignificant ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Sí diferencia los grupos (p &lt; 0,05)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-stone-500" />
                      <span>No diferencia los grupos (p &ge; 0,05)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Cross Table */}
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-semibold">
                      <th className="py-2.5 px-3">Grupo</th>
                      {prof.contingencyTable.categories.map((cat) => (
                        <th key={cat} className="py-2.5 px-3 text-right">
                          {cat}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-right bg-stone-200/50">Total Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {prof.contingencyTable.groups.map((g) => (
                      <tr key={g.clusterId} className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 font-semibold text-stone-900">
                          {g.clusterName}
                        </td>
                        {g.counts.map((cnt, idx) => (
                          <td key={idx} className="py-2 px-3 text-right">
                            <span className="font-mono text-stone-900 font-medium">{cnt}</span>
                            <span className="text-[10px] text-stone-500 ml-1.5">
                              ({g.rowPercents[idx].toFixed(1).replace('.', ',')}%)
                            </span>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-mono font-bold bg-stone-50 text-stone-900">
                          {g.total}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-stone-100/90 font-bold border-t border-stone-200 text-stone-900">
                      <td className="py-2 px-3">Total General</td>
                      {prof.contingencyTable.totalPerCategory.map((tot, idx) => (
                        <td key={idx} className="py-2 px-3 text-right font-mono">
                          {tot}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right font-mono bg-stone-200/60">
                        {prof.contingencyTable.grandTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Numeric Profiles with Medians, BoxPlots and Kruskal-Wallis Test */}
      {numProfiles.length > 0 && (
        <div className="space-y-5 pt-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-600" />
            Variables de Perfil Numéricas (Medianas, Diagramas de Caja y Prueba Kruskal-Wallis)
          </h3>

          {numProfiles.map((prof) => (
            <div
              key={prof.varName}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Variable: <span className="text-amber-900 font-mono">{prof.varName.replace(/_/g, ' ')}</span>
                  </h4>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Prueba Kruskal-Wallis: <span className="font-mono">H = {fmtStat(prof.hStatistic)}</span>, gl = {prof.degreesOfFreedom}, p-value = <span className="font-mono font-semibold text-stone-800">{fmtPValue(prof.pValue)}</span>
                  </div>
                </div>

                {/* Kruskal-Wallis significance badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    prof.isSignificant
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}
                >
                  {prof.isSignificant ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Sí diferencia los grupos (p &lt; 0,05)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-stone-500" />
                      <span>No diferencia los grupos (p &ge; 0,05)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Medians summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {prof.clusterStats.map((st) => (
                  <div
                    key={st.clusterId}
                    className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/70 text-xs"
                  >
                    <div className="text-stone-700 text-[11px] font-semibold truncate">
                      {st.clusterName}
                    </div>
                    <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                      {st.median.toFixed(1).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Mediana · IQR: [{st.q1.toFixed(1).replace('.', ',')} - {st.q3.toFixed(1).replace('.', ',')}]
                    </div>
                  </div>
                ))}
              </div>

              {/* Box plot SVG component */}
              <BoxPlotChart stats={prof.clusterStats} varName={prof.varName} />
            </div>
          ))}
        </div>
      )}

      {/* Explainer */}
      <ConceptExplainer title="¿Cómo interpretar las pruebas estadísticas Chi-cuadrado y Kruskal-Wallis?">
        <p>
          Las variables de perfil (edad, género, región, canal) no se usaron para armar los grupos, pero ahora queremos saber si caracterizan a los grupos o si dan lo mismo.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Prueba Chi-cuadrado (variables categóricas):</strong> Compara si la proporción de una categoría varía de forma genuina entre grupos o si es simple fluctuación aleatoria.
          </li>
          <li>
            <strong>Prueba Kruskal-Wallis (variables numéricas):</strong> Es la prueba estadística no paramétrica estándar para verificar si las medianas de una métrica continua difieren significativamente entre 3 o más grupos independientes.
          </li>
          <li>
            <strong>La regla del p-value (&lt; 0,05):</strong> Si el p-value es menor a 0,05, se concluye con 95% de confianza estadística que <em>"Sí diferencia los grupos"</em>. Ese atributo demográfico es real y puedes usarlo para enfocar campañas, mensajes o canales comerciales. Si el p-value es mayor o igual a 0,05, la variable está distribuida de forma homogénea en toda la base.
          </li>
        </ul>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Resultados K-Means
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-all shadow-xs"
        >
          Continuar al Paso 9 (Estrategia de Marketing) →
        </button>
      </div>
    </div>
  );
};
