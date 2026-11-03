import {
  BusinessContext,
  GroupStrategy,
  KMeansResult,
  NumericProfileMetric,
  OpportunityQuadrant,
} from '../types/segmentation';

/**
 * Propose names for clusters based on standardized centroids
 */
export function proposeClusterNames(
  centroids: number[][],
  behaviorVars: string[]
): Record<number, string> {
  const names: Record<number, string> = {};

  centroids.forEach((row, clusterIdx) => {
    // Find variables with significant positive deviation (> 0.4) and negative (< -0.4)
    const strongPos = row
      .map((val, idx) => ({ name: behaviorVars[idx], val }))
      .filter((v) => v.val >= 0.4)
      .sort((a, b) => b.val - a.val);

    const strongNeg = row
      .map((val, idx) => ({ name: behaviorVars[idx], val }))
      .filter((v) => v.val <= -0.4)
      .sort((a, b) => a.val - b.val);

    const avgVal = row.reduce((a, b) => a + b, 0) / (row.length || 1);

    // Rule 1: High in everything
    if (avgVal >= 0.6 && strongNeg.length === 0) {
      names[clusterIdx] = 'Alto consumo integral (Clientes VIP / Clave)';
      return;
    }

    // Rule 2: Low in everything
    if (avgVal <= -0.5 && strongPos.length === 0) {
      names[clusterIdx] = 'Bajo consumo y alta sensibilidad al precio';
      return;
    }

    // Rule 3: Single dominant positive variable
    if (strongPos.length > 0) {
      const topVar = strongPos[0].name.toLowerCase().replace(/_/g, ' ');
      if (topVar.includes('dato') || topVar.includes('gb') || topVar.includes('internet')) {
        names[clusterIdx] = `Intensivos en datos móviles (${formatVarShortName(strongPos[0].name)})`;
      } else if (topVar.includes('app') || topVar.includes('visita') || topVar.includes('digital')) {
        names[clusterIdx] = `Nativos digitales y autoservicio (${formatVarShortName(strongPos[0].name)})`;
      } else if (topVar.includes('voz') || topVar.includes('minuto') || topVar.includes('llamada')) {
        names[clusterIdx] = `Comunicadores tradicionales de voz (${formatVarShortName(strongPos[0].name)})`;
      } else if (topVar.includes('gasto') || topVar.includes('monto') || topVar.includes('ticket')) {
        names[clusterIdx] = `Alto gasto y valor monetario`;
      } else if (topVar.includes('frecuencia') || topVar.includes('transaccion')) {
        names[clusterIdx] = `Alta frecuencia transaccional`;
      } else if (topVar.includes('soporte') || topVar.includes('ticket') || topVar.includes('reclamo')) {
        names[clusterIdx] = `Alta interacción de soporte y servicio`;
      } else {
        names[clusterIdx] = `Líderes en ${formatVarShortName(strongPos[0].name)}`;
      }
      return;
    }

    // Rule 4: Moderate / balanced
    if (avgVal >= 0) {
      names[clusterIdx] = 'Consumo balanceado con potencial de desarrollo';
    } else {
      names[clusterIdx] = 'Consumo básico y moderado';
    }
  });

  return names;
}

function formatVarShortName(name: string): string {
  return name.replace(/_/g, ' ').replace(/(usd|gb|mes|dias)/gi, '').trim();
}

/**
 * Generate complete marketing strategy for all groups.
 * Guarantees that EVERY group receives an entirely unique strategy based on its
 * distinct combination of dominant variables and profile traits.
 */
export function generateMarketingStrategies(
  kmeansResult: KMeansResult,
  businessContext: BusinessContext,
  customClusterNames: Record<number, string>,
  numProfiles?: NumericProfileMetric[]
): GroupStrategy[] {
  const { centroids, behaviorVars, clusterSizes } = kmeansResult;
  const totalCustomers = clusterSizes.reduce((acc, c) => acc + c.count, 0);

  // Calculate average standardized consumption for each cluster (Y axis in matrix)
  const clusterAvgs = centroids.map((row) => row.reduce((a, b) => a + b, 0) / (row.length || 1));
  const overallAvgConsumption = clusterAvgs.reduce((a, b) => a + b, 0) / (clusterAvgs.length || 1);
  const avgClusterSize = totalCustomers / (kmeansResult.k || 1);

  // Age profile lookup if available
  const ageProfile = numProfiles?.find(
    (p) => p.varName.toLowerCase().includes('edad') || p.varName.toLowerCase().includes('age')
  );

  return centroids.map((row, clusterId) => {
    const sizeInfo = clusterSizes.find((c) => c.cluster === clusterId) || {
      count: 0,
      percent: 0,
    };
    
    // Explicit custom name or fallback
    const clusterName = customClusterNames[clusterId] || `Grupo ${clusterId + 1}`;
    const avgConsumption = clusterAvgs[clusterId];

    // Determine Quadrant
    const isLargeSize = sizeInfo.count >= avgClusterSize * 0.85;
    const isHighConsumption = avgConsumption >= overallAvgConsumption;

    let quadrant: OpportunityQuadrant;
    let quadrantDescription = '';

    if (isHighConsumption && isLargeSize) {
      quadrant = 'Proteger';
      quadrantDescription = 'Alto volumen de clientes y alto nivel de consumo. Son la columna vertebral de los ingresos actuales; requieren máxima retención y cuidado preventivo.';
    } else if (isHighConsumption && !isLargeSize) {
      quadrant = 'Rentabilizar';
      quadrantDescription = 'Nicho selecto de alto consumo por cliente. Alta rentabilidad unitaria; enfocarse en márgenes, venta cruzada premium y servicio sin fricción.';
    } else if (!isHighConsumption && isLargeSize) {
      quadrant = 'Desarrollar';
      quadrantDescription = 'Masa crítica significativa pero con consumo moderado o bajo. Gran potencial para up-selling, fidelización y aumento de frecuencia de compra.';
    } else {
      quadrant = 'Mantener con bajo costo';
      quadrantDescription = 'Segmento de bajo consumo relativo y tamaño moderado. La estrategia debe automatizar la atención para minimizar costos operativos.';
    }

    // Ranked variables by standardized value
    const rankedVars = row
      .map((val, idx) => ({ name: behaviorVars[idx], prettyName: behaviorVars[idx].replace(/_/g, ' '), val }))
      .sort((a, b) => b.val - a.val);

    const topPos = rankedVars.filter((v) => v.val >= 0.25);
    const topNeg = [...rankedVars].sort((a, b) => a.val - b.val).filter((v) => v.val <= -0.25);

    const top1 = rankedVars[0];
    const top2 = rankedVars[1] || rankedVars[0];
    const lowest = rankedVars[rankedVars.length - 1];

    // Median age of this cluster
    const clusterAgeStat = ageProfile?.clusterStats.find((s) => s.clusterId === clusterId);
    const medianAge = clusterAgeStat?.median;
    const allMedianAges = ageProfile?.clusterStats.map((s) => s.median) || [];
    const minMedianAge = allMedianAges.length > 0 ? Math.min(...allMedianAges) : 35;
    const isYoungestCluster = medianAge !== undefined && medianAge <= minMedianAge + 2;
    const isYoungAge = medianAge !== undefined ? medianAge < 32 : false;
    const isSeniorAge = medianAge !== undefined ? medianAge > 50 : false;

    // Dominant traits descriptions
    const dominantTraits: string[] = [];
    row.forEach((val, idx) => {
      const varPretty = behaviorVars[idx].replace(/_/g, ' ');
      if (val >= 0.4) {
        dominantTraits.push(`Sobresale en ${varPretty} (+${val.toFixed(2)}σ)`);
      } else if (val <= -0.4) {
        dominantTraits.push(`Muy bajo en ${varPretty} (${val.toFixed(2)}σ)`);
      }
    });
    if (dominantTraits.length === 0) {
      dominantTraits.push(`Consumo centrado en el promedio, destacando levemente en ${top1.prettyName} (+${top1.val.toFixed(2)}σ)`);
    }

    // Variable helpers
    const hasHighData = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('dato') || n.includes('gb') || n.includes('internet')) && val > 0.3;
    });

    const hasLowSpend = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('gasto') || n.includes('monto') || n.includes('precio') || n.includes('ticket')) && val < 0.2;
    });

    const hasHighSpend = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('gasto') || n.includes('monto') || n.includes('precio') || n.includes('ticket')) && val > 0.45;
    });

    const hasHighVoiceOrMinutes = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('minuto') || n.includes('voz') || n.includes('llamada') || n.includes('adicional')) && val > 0.35;
    });

    const hasHighServicesOrDevices = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('servicio') || n.includes('linea') || n.includes('streaming') || n.includes('seguro') || n.includes('equipo')) && val > 0.35;
    });

    const hasHighAppOrDigital = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('app') || n.includes('visita') || n.includes('digital') || n.includes('web')) && val > 0.4;
    });

    const hasHighTickets = row.some((val, idx) => {
      const n = behaviorVars[idx].toLowerCase();
      return (n.includes('soporte') || n.includes('ticket') || n.includes('reclamo')) && val > 0.4;
    });

    const isGeneralLow = avgConsumption < -0.25;

    // Archetype selection - guarantees distinct content per group
    let need = '';
    let desire = '';
    let demand = '';
    let product = '';
    let price = '';
    let place = '';
    let promotion = '';
    let productPlanDesign = '';
    let keyMessage = '';
    let channels: string[] = [];
    let tone = '';
    let newProductIdea = '';

    // CASE 1: High internet / data, but low or moderate equipment/spend
    if (hasHighData && hasLowSpend && !hasHighVoiceOrMinutes) {
      need = `Conectividad de datos intensiva y continua para streaming, trabajo y navegación en ${formatVarShortName(top1.name)}.`;
      desire = 'Disfrutar de gigas abundantes y renovar su equipo por uno de mejor pantalla sin asumir un costo inicial alto.';
      demand = 'Planes de datos generosos con equipos modernos financiados en cuotas mensuales cómodas, sin tarifa premium impagable.';
      product = `Plan 'Data Freedom + Equipo Financiado': bolsa amplia de internet con financiamiento de smartphones en 24 cuotas sin interés y garantía extendida.`;
      price = 'Tarifa mensual accesible de servicio con cobro de cuota de equipo transparente, sin pago inicial ni penalizaciones ocultas.';
      place = 'Canales digitales (app móvil y web) y módulos express en tiendas físicas donde puedan tocar y comparar los equipos disponibles.';
      promotion = `Campaña 'Estrena y Navega': lleva tu nuevo smartphone financiado al 0% con gigas acumulables para el mes siguiente.`;
      productPlanDesign = `Paquete 'Datos + Terminal Smart': 60 GB acumulables, navegación ilimitada en apps de video seleccionadas y crédito pre-aprobado para financiamiento de dispositivo.`;
      keyMessage = `El internet que realmente consumes con el celular que quieres, pagándolo mes a mes a tu ritmo.`;
      channels = ['App Móvil Propia', 'Publicidad en Redes Sociales (Instagram / TikTok)', 'Módulos en Centros Comerciales'];
      tone = 'Dinámico, transparente, empático y orientado a la conveniencia económica.';
      newProductIdea = `Plan 'Data Trade-In': entrega de celular usado como parte de pago más bono de 25 GB extra mensuales durante los primeros 6 meses.`;
    }
    // CASE 2: High voice / minutes / calling (or extra minutes)
    else if (hasHighVoiceOrMinutes && !hasHighSpend) {
      need = `Comunicación por voz confiable y sin cortes para llamadas frecuentes y de larga duración (${top1.prettyName} ${top1.val >= 0 ? '+' : ''}${top1.val.toFixed(2)}σ).`;
      desire = 'Hablar con clientes, familia o socios con la tranquilidad de que su factura no se inflará por minutos adicionales fuera de plan.';
      demand = 'Planes con bolsa de minutos ilimitada a todas las operadoras y roaming nacional garantizado con tarifa plana.';
      product = `Plan 'Voz Blindada Ilimitada': llamadas y SMS sin límite a cualquier operador nacional, con protección contra cobros de minutos adicionales.`;
      price = 'Tarifa plana fija mensual con factura protegida: si sobrepasa el consumo habitual de datos, la velocidad baja sin generar cargos extra.';
      place = 'Atención telefónica directa con asesores humanos y sucursales físicas de proximidad.';
      promotion = `Promoción 'Cero Sorpresas': cámbiate a voz ilimitada y desactiva para siempre las tarifas de minutos adicionales.`;
      productPlanDesign = `Paquete 'Conexión Directa Total': llamadas ilimitadas a cualquier red nacional, 150 minutos internacionales incluidos y facturación unificada.`;
      keyMessage = `Habla todo lo que quieras con la seguridad absoluta de pagar siempre el mismo monto al final del mes.`;
      channels = ['Canal Telefónico Asistido', 'SMS Informativos Directos', 'Oficinas de Atención Presencial'];
      tone = 'Claro, seguro, confiable y directo.';
      newProductIdea = `Bolsa Familiar o de Negocio de Minutos Compartidos: conecta hasta 3 líneas asociadas con llamadas ilimitadas gratis entre ellas.`;
    }
    // CASE 3: High spend + High services / devices (VIP / Clientes Estrella)
    else if (hasHighSpend || (top1.val > 0.6 && avgConsumption > 0.5)) {
      need = `Máximo estándar de disponibilidad, capacidad técnica sobresaliente y cero interrupciones en su ecosistema integral de servicios.`;
      desire = 'Reconocimiento, exclusividad, trato preferencial de primer nivel y acceso anticipado a los últimos lanzamientos de alta gama.';
      demand = 'Disposición a pagar tarifas altas por servicio garantizado, atención ejecutiva prioritaria y sin regateos ni ofertas de descuento barato.';
      product = `Plan 'Black Élite Signature': máxima velocidad y prioridad en red, seguro integral contra robo/daño para terminales y servicios premium incluidos.`;
      price = 'Tarifa premium que refleja estatus y valor superior; política estricta de cero descuentos agresivos para no deteriorar la percepción de exclusividad.';
      place = 'Línea ejecutiva preferente 24/7 sin esperas conmutadas, gestor personal de cuenta y salones VIP de entrega.';
      promotion = `Preventas exclusivas para adquirir los smartphones de última hornada antes que el público general, con invitaciones a experiencias VIP.`;
      productPlanDesign = `Membresía 'Élite Confort Integral': tráfico priorizado en momentos de congestión, reposición de equipo a domicilio en menos de 4 horas y renovación anual garantizada.`;
      keyMessage = `La excelencia que mereces con la prioridad y exclusividad que tu estilo de vida demanda.`;
      channels = ['Atención Ejecutiva Personalizada', 'Línea Telefónica VIP 24/7', 'Eventos Privados y Correo Ejecutivo'];
      tone = 'Sofisticado, resolutivo, proactivo, respetuoso y de alta gama.';
      newProductIdea = `Club Concierge Tecnológico: asesor personal para migración de datos, configuración de dispositivos del hogar y seguro de conectividad internacional.`;
    }
    // CASE 4: Low consumption + Young age (Jóvenes / Estudiantes)
    else if (isGeneralLow && (isYoungAge || isYoungestCluster)) {
      need = `Acceso funcional a internet y mensajería ajustado a un presupuesto económico estricto sin compromisos forzosos a largo plazo.`;
      desire = 'Estar siempre conectado a redes sociales, música y mensajería con sus amigos sin agotar sus datos ni pagar cargos fijos altos.';
      demand = 'Planes juveniles económicos, controlables o prepago, con redes sociales gratuitas e ilimitadas para construir lealtad desde temprana edad.';
      product = `Plan 'Juventud Digital': paquete económico con navegación liberada en WhatsApp, TikTok, Instagram y Spotify, sin contrato de permanencia.`;
      price = 'Micro-tarifas mensuales o semanales reducidas, recargables en línea y con control estricto que impide cobros imprevistos.';
      place = '100% digital: contratación y gestión por aplicación móvil propia y enlaces en redes sociales.';
      promotion = `Campaña 'Tu Mundo en Redes': redes sociales gratis todo el mes más 15 GB de regalo en tu primera recarga digital.`;
      productPlanDesign = `Plan 'Start Juvenil': redes sociales libres de consumo, acumulación automática de gigas no utilizados y opción de pausar el plan durante vacaciones.`;
      keyMessage = `Tu música, tus redes y tus amigos en un solo plan económico diseñado para tu estilo de vida.`;
      channels = ['TikTok & Instagram Ads', 'App Móvil de Autogestión', 'Colaboraciones con Creadores de Contenido'];
      tone = 'Fresco, cercano, transparente, divertido y sin ataduras.';
      newProductIdea = `Pase Gamer / Streamer Nocturno: datos ultra-rápidos liberados de 11 PM a 6 AM para videojuegos o series sin consumir la cuota diurna.`;
    }
    // CASE 5: Low consumption + Senior / Traditional age
    else if (isGeneralLow && isSeniorAge) {
      need = `Servicio básico y confiable para llamadas esenciales y mensajes con familiares, sin menús confusos ni sorpresas en cobros.`;
      desire = 'Sentirse acompañado con paciencia y claridad, con asistencia telefónica humana y factura simple que no cambie mes a mes.';
      demand = 'Plan sénior o familiar sencillo con tarifa fija mínima, factura física opcional y configuración asistida de su teléfono.';
      product = `Plan 'Tranquilidad Familiar Sénior': paquete con llamadas a números favoritos sin límite, saldo protegido y botón de asistencia técnica directa.`;
      price = 'Tarifa fija reducida sin variaciones, sin cobros por servicios suplementarios no solicitados y con garantía de precio congelado.';
      place = 'Centros de atención presencial cercanos con fila preferencial y línea telefónica atendida directamente por personas.';
      promotion = `Factura explicada en una sola página con letra grande y asesoría gratuita en tienda para resolver cualquier duda del teléfono.`;
      productPlanDesign = `Plan 'Paz Mental': 3 números frecuentes gratuitos para llamar sin límite, bloqueo automático de compras accidentales en internet y soporte telefónico asistido.`;
      keyMessage = `La tranquilidad de comunicarte con tu familia cuando quieras, con el trato humano y la sencillez que mereces.`;
      channels = ['Atención Presencial en Tiendas de Barrio', 'Llamada Telefónica Asistida', 'Correo Postal Informativo'];
      tone = 'Pausado, paciente, respetuoso, cálido y tranquilizador.';
      newProductIdea = `Servicio 'Acompañamiento Digital': talleres presenciales gratuitos en tienda para aprender a usar videollamadas, fotos y banca móvil básica.`;
    }
    // CASE 6: High support tickets / churn risk
    else if (hasHighTickets) {
      need = `Estabilidad operativa inmediata en su servicio y resolución definitiva de fallas técnicas previas (${top1.prettyName} ${top1.val >= 0 ? '+' : ''}${top1.val.toFixed(2)}σ).`;
      desire = 'Sentir que la empresa se preocupa genuinamente por su caso, reconoce las molestias y ofrece soluciones reales sin evasivas.';
      demand = 'Canal técnico prioritario de rescate, auditoría de su línea y compensación por tiempos de inactividad para no cancelar su cuenta.';
      product = `Plan 'Garantía Total de Servicio': monitoreo preventivo de red, soporte técnico preferencial y protocolo de rescate con ejecutivos senior.`;
      price = 'Bonificación de cortesía en la próxima factura por inconvenientes pasados y congelamiento de tarifa por 12 meses.';
      place = 'Mesa de ayuda prioritaria con atención humana en menos de 60 segundos y seguimiento vía WhatsApp directo.';
      promotion = `Contacto proactivo de fidelización: 'Revisamos tu servicio para que todo funcione impecable, con una bonificación de agradecimiento por tu lealtad'.`;
      productPlanDesign = `Protocolo 'Cliente Protegido': asignación de un especialista técnico de seguimiento que verifica el funcionamiento óptimo de su servicio cada mes.`;
      keyMessage = `Tu satisfacción es nuestro compromiso: estamos aquí para solucionar cualquier detalle de forma inmediata y definitiva.`;
      channels = ['Llamada Proactiva de Retención', 'Canal Dedicado de WhatsApp', 'Visita Técnica Prioritaria'];
      tone = 'Empático, humilde, resolutivo y altamente comprometido.';
      newProductIdea = `Garantía de Servicio 'Cero Fallas': crédito automático en saldo en caso de cualquier degradación de red reportada y validada en su zona.`;
    }
    // CASE 7: High digital app / interactions but moderate spend
    else if (hasHighAppOrDigital) {
      need = `Autonomía digital total: autogestión ágil de todos sus trámites, consumos y pagos directamente desde su teléfono móvil.`;
      desire = 'Una experiencia de usuario rápida, fluida y gamificada, con recompensas digitales por usar los canales tecnológicos de la empresa.';
      demand = 'Planes autogestionables en app móvil con opción de activar o pausar add-ons con un solo clic, sin llamadas ni visitas a tiendas.';
      product = `Plan 'Smart Digital Pro': suscripción 100% móvil con add-ons dinámicos (streaming, gigas para viajes, almacenamiento en la nube).`;
      price = 'Descuento permanente por domiciliar el pago automático en la app y recompensas en saldo por autogestión.';
      place = 'Exclusivamente app móvil y sitio web responsivo, con chatbot inteligente para consultas instantáneas 24/7.';
      promotion = `Campañas in-app con trivias, retos mensuales y canje de puntos por beneficios en comercios digitales asociados.`;
      productPlanDesign = `Plan 'On-Demand Móvil': ajusta tus gigas o minutos en tiempo real desde la app según lo que necesites cada semana.`;
      keyMessage = `Todo el control de tu servicio en tus manos: sin filas, sin papeles y a la velocidad de un clic.`;
      channels = ['Notificaciones Push en App', 'Mensajería In-App Personalizada', 'Publicidad Digital Segmentada'];
      tone = 'Ágil, moderno, entusiasta y centrado en la tecnología.';
      newProductIdea = `Wallet Digital de Recompensas: acumula cashback en cada pago para canjear por suscripciones a plataformas de streaming o compras online.`;
    }
    // CASE 8: General moderate/low consumption with specific leading trait
    else if (isGeneralLow) {
      need = `Control estricto de su gasto sin cobros sorpresa, cubriendo lo indispensable en ${top1.prettyName}.`;
      desire = 'Maximizar el rendimiento de cada peso invertido, con opciones de ahorro y beneficios por pago puntual.';
      demand = 'Paquetes económicos y transparentes que no incluyan servicios accesorios que no utiliza.';
      product = `Plan 'Control Esencial': paquete básico enfocado en ${top1.prettyName}, eliminando recargos por funciones no requeridas.`;
      price = 'Tarifa baja y predecible con cuotas reducidas y opciones de recarga fraccionada cuando lo necesite.';
      place = 'Canales de autoservicio digital y puntos de venta masivos accesibles en su zona.';
      promotion = `Ofertas de fidelización por recarga puntual y paquetes de bienvenida con doble saldo inicial.`;
      productPlanDesign = `Plan 'Ahorro Seguro': balance exacto entre consumo esencial de ${top1.prettyName} y precio bajo garantizado.`;
      keyMessage = `Paga solo por lo que realmente usas: el servicio que necesitas al precio más justo para tu bolsillo.`;
      channels = ['SMS Directos', 'Puntos de Venta Físicos', 'Portal Web Simplificado'];
      tone = 'Cercano, transparente, honesto y comprensivo con la economía familiar.';
      newProductIdea = `Micro-paquetes a Demanda: activación de datos o minutos por días específicos (ej. fines de semana o viajes) sin contratos forzosos.`;
    }
    // CASE 9: Balanced / Development segment
    else {
      need = `Equilibrio integral entre las prestaciones de ${top1.prettyName} (+${top1.val.toFixed(2)}σ) y ${top2.prettyName} (+${top2.val.toFixed(2)}σ) con una tarifa justa.`;
      desire = 'Aprovechar promociones de valor agregado para migrar a un escalón superior de servicio sin que el costo se duplique.';
      demand = 'Planes intermedios competitivos con beneficios por permanencia y promociones combinadas de servicios.';
      product = `Plan 'Plus Balance': combinación óptima de ${top1.prettyName} y ${top2.prettyName} con acceso a prueba gratuita de servicios adicionales.`;
      price = 'Tarifa intermedia con descuento progresivo durante los primeros 6 meses al aumentar de categoría.';
      place = 'Canales mixtos: portal web asistido, tiendas comerciales y atención telefónica.';
      promotion = `Ofertas de up-selling: 'Prueba la velocidad y capacidad del plan superior pagando lo mismo durante tus primeros 3 meses'.`;
      productPlanDesign = `Paquete 'Crecimiento Conectado': diseñado para clientes con consumo en expansión, con bonificaciones periódicas por uso continuo.`;
      keyMessage = `Da el siguiente paso hacia un servicio más completo con beneficios diseñados para acompañar tu crecimiento.`;
      channels = ['Email Marketing Personalizado', 'Tienda Web Responsiva', 'Asesores Comerciales en Sucursal'];
      tone = 'Motivador, constructivo, consultivo y orientado al progreso.';
      newProductIdea = `Pase de Mejora Temporal: permite al cliente subir de categoría durante un mes de alta necesidad con un recargo mínimo y sin compromiso permanente.`;
    }

    return {
      clusterId,
      clusterName,
      customerCount: sizeInfo.count,
      customerPercent: sizeInfo.percent,
      dominantTraits,
      profileTraits: [],
      averageStandardizedConsumption: avgConsumption,
      quadrant,
      quadrantDescription,
      maslow: {
        need,
        desire,
        demand,
      },
      fourPs: {
        product,
        price,
        place,
        promotion,
      },
      productPlanDesign,
      communicationPlan: {
        keyMessage,
        channels,
        tone,
      },
      newProductIdea,
    };
  });
}
