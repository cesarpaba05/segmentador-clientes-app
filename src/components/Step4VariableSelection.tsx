import React, { useState } from 'react';
import { ColumnSummary, CombinedIndex, VariableSelection } from '../types/segmentation';
import { ConceptExplainer } from '../components/ConceptExplainer';
import { Layers, Plus, Trash2, CheckSquare, Square, Info } from 'lucide-react';

interface Step4VariableSelectionProps {
  summaries: ColumnSummary[];
  selection: VariableSelection;
  onChange: (updated: VariableSelection) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4VariableSelection: React.FC<Step4VariableSelectionProps> = ({
  summaries,
  selection,
  onChange,
  onNext,
  onPrev,
}) => {
  // New index form state
  const [indexName, setIndexName] = useState('');
  const [selectedBinaryVars, setSelectedBinaryVars] = useState<string[]>([]);
  const [showIndexCreator, setShowIndexCreator] = useState(false);

  // Available binary variables
  const binaryVariables = summaries.filter((s) => s.type === 'binary');

  // Toggle behavior var
  const toggleBehaviorVar = (varName: string) => {
    const exists = selection.behaviorVars.includes(varName);
    const updated = exists
      ? selection.behaviorVars.filter((v) => v !== varName)
      : [...selection.behaviorVars, varName];

    // Ensure it's not simultaneously in profile
    const updatedProfile = selection.profileVars.filter((v) => v !== varName);

    onChange({
      ...selection,
      behaviorVars: updated,
      profileVars: updatedProfile,
    });
  };

  // Toggle profile var
  const toggleProfileVar = (varName: string) => {
    const exists = selection.profileVars.includes(varName);
    const updated = exists
      ? selection.profileVars.filter((v) => v !== varName)
      : [...selection.profileVars, varName];

    // Ensure it's not simultaneously in behavior
    const updatedBehavior = selection.behaviorVars.filter((v) => v !== varName);

    onChange({
      ...selection,
      profileVars: updated,
      behaviorVars: updatedBehavior,
    });
  };

  // Add combined index
  const handleCreateCombinedIndex = () => {
    if (!indexName.trim() || selectedBinaryVars.length < 2) return;
    const newIndex: CombinedIndex = {
      id: `idx_${Date.now()}`,
      name: indexName.trim().replace(/\s+/g, '_').toLowerCase(),
      sourceVars: [...selectedBinaryVars],
    };

    // By default, add the new combined index as a behavior variable
    onChange({
      ...selection,
      combinedIndices: [...selection.combinedIndices, newIndex],
      behaviorVars: [...selection.behaviorVars, newIndex.name],
    });

    setIndexName('');
    setSelectedBinaryVars([]);
    setShowIndexCreator(false);
  };

  // Remove combined index
  const handleRemoveCombinedIndex = (id: string, name: string) => {
    onChange({
      ...selection,
      combinedIndices: selection.combinedIndices.filter((idx) => idx.id !== id),
      behaviorVars: selection.behaviorVars.filter((v) => v !== name),
      profileVars: selection.profileVars.filter((v) => v !== name),
    });
  };

  const isValid = selection.behaviorVars.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <span>Paso 4 de 10</span>
          <span>·</span>
          <span>Arquitectura de Variables</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Elegir Variables: Comportamiento vs. Perfil
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Separa las variables que definen <strong>cómo actúa el cliente</strong> (las que crearán los grupos) de aquellas que describen <strong>quién es el cliente</strong> (las que caracterizarán a los grupos después).
        </p>
      </div>

      {/* Grid of Two Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bucket 1: Variables de Comportamiento */}
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/20 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-600 text-white font-bold text-xs">
                  1
                </span>
                <h3 className="font-bold text-sm text-amber-950">
                  Variables de Comportamiento
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {selection.behaviorVars.length} seleccionadas
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-2 mb-3">
              Métricas activas que entrarán a k-means (gasto, frecuencia, datos, visitas app, etc.).
              <span className="block text-[11px] text-amber-800 font-medium mt-0.5">
                * Se requieren al menos 2 variables de comportamiento.
              </span>
            </p>

            {/* List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {summaries.map((col) => {
                const isSelected = selection.behaviorVars.includes(col.name);
                const isProfile = selection.profileVars.includes(col.name);

                return (
                  <div
                    key={col.name}
                    onClick={() => toggleBehaviorVar(col.name)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-100/60 font-semibold text-amber-950'
                        : isProfile
                        ? 'border-stone-200 bg-stone-100 text-stone-400 opacity-60'
                        : 'border-stone-200 bg-white hover:border-amber-300 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-amber-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-stone-400 shrink-0" />
                      )}
                      <span>{col.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {col.type === 'numeric' ? 'Numérica' : col.type === 'binary' ? 'Binaria' : 'Categórica'}
                    </span>
                  </div>
                );
              })}

              {/* Combined indices shown as behavior vars */}
              {selection.combinedIndices.map((idx) => {
                const isSelected = selection.behaviorVars.includes(idx.name);
                return (
                  <div
                    key={idx.id}
                    onClick={() => toggleBehaviorVar(idx.name)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-950'
                        : 'border-stone-200 bg-white text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-stone-400 shrink-0" />
                      )}
                      <span>{idx.name} (Índice Combinado)</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Suma de {idx.sourceVars.length} variables
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bucket 2: Variables de Perfil */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-700 text-white font-bold text-xs">
                  2
                </span>
                <h3 className="font-bold text-sm text-stone-900">
                  Variables de Perfil
                </h3>
              </div>
              <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">
                {selection.profileVars.length} seleccionadas
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-2 mb-3">
              Atributos descriptivos o sociodemográficos (edad, género, región, canal). NO entran a k-means; se cruzan en el <strong>Paso 8</strong> para describir quiénes componen cada grupo.
            </p>

            {/* List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {summaries.map((col) => {
                const isSelected = selection.profileVars.includes(col.name);
                const isBehavior = selection.behaviorVars.includes(col.name);

                return (
                  <div
                    key={col.name}
                    onClick={() => toggleProfileVar(col.name)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-stone-700 bg-stone-200/80 font-semibold text-stone-950'
                        : isBehavior
                        ? 'border-stone-200 bg-stone-100 text-stone-400 opacity-60'
                        : 'border-stone-200 bg-white hover:border-stone-400 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-stone-700 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-stone-400 shrink-0" />
                      )}
                      <span>{col.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {col.type === 'numeric' ? 'Numérica' : col.type === 'binary' ? 'Binaria' : 'Categórica'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Feature: Combined Index from 0/1 Binaries */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Herramienta Especial: Combinar Variables Binarias (0/1) en un Índice Sumatorio
              </h4>
              <p className="text-xs text-indigo-900/80 mt-0.5">
                Por ejemplo, si tienes 4 variables binarias (streaming, seguro, línea adicional, factura digital), puedes sumarlas en un índice llamado <strong>"servicios_totales"</strong> (valores de 0 a 4).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIndexCreator(!showIndexCreator)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0"
          >
            {showIndexCreator ? 'Cerrar' : '+ Crear Índice Sumatorio'}
          </button>
        </div>

        {/* Index Creator Panel */}
        {showIndexCreator && (
          <div className="mt-4 pt-4 border-t border-indigo-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Nombre del nuevo índice sumatorio:
              </label>
              <input
                type="text"
                placeholder="ej: total_servicios_digitales"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                className="w-full sm:w-80 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Selecciona las variables binarias a sumar:
              </label>
              {binaryVariables.length === 0 ? (
                <p className="text-xs text-stone-500 italic">
                  No se detectaron variables binarias (0/1) en esta base de datos.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {binaryVariables.map((bin) => {
                    const isChecked = selectedBinaryVars.includes(bin.name);
                    return (
                      <button
                        key={bin.name}
                        type="button"
                        onClick={() => {
                          setSelectedBinaryVars(
                            isChecked
                              ? selectedBinaryVars.filter((v) => v !== bin.name)
                              : [...selectedBinaryVars, bin.name]
                          );
                        }}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors flex items-center gap-2 ${
                          isChecked
                            ? 'border-indigo-600 bg-white text-indigo-950 font-semibold'
                            : 'border-indigo-200 bg-indigo-50/60 text-indigo-800'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-stone-400" />
                        )}
                        <span className="truncate">{bin.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={!indexName.trim() || selectedBinaryVars.length < 2}
                onClick={handleCreateCombinedIndex}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
                  indexName.trim() && selectedBinaryVars.length >= 2
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                Crear Índice y Agregar a Comportamiento
              </button>
            </div>
          </div>
        )}

        {/* Existing indices list */}
        {selection.combinedIndices.length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
              Índices creados:
            </span>
            {selection.combinedIndices.map((idx) => (
              <div
                key={idx.id}
                className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-900">{idx.name}</span>
                  <span className="text-stone-500 text-[11px]">
                    = suma de: [{idx.sourceVars.join(' + ')}]
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCombinedIndex(idx.id, idx.name)}
                  className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                  title="Eliminar índice"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explainer */}
      <ConceptExplainer title="La regla de oro del marketing: ¿Por qué no mezclar perfil con comportamiento en el algoritmo?">
        <p>
          Si incluyes variables sociodemográficas (como <strong>género, edad o ciudad</strong>) dentro de k-means junto con el gasto, el algoritmo creará grupos como "mujeres mayores en el norte" o "hombres jóvenes en el sur".
        </p>
        <p>
          Pero una mujer de 60 años y un joven de 22 pueden tener <strong>exactamente la misma necesidad y el mismo alto consumo de datos</strong>. Lo que verdaderamente importa en los negocios es agrupar por necesidades y comportamiento (cuánto consumen, qué compran, cómo interactúan), y <em>luego</em> describir qué edad o perfil tienen los miembros de cada grupo.
        </p>
      </ConceptExplainer>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          ← Volver a Entender Variables
        </button>

        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
            isValid
              ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          Continuar al Paso 5 (Preparar Datos) →
        </button>
      </div>
    </div>
  );
};
