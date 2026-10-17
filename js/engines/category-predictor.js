/* ==========================================================================
   MODULE: MOTOR DE PREDICCIÓN DE CATEGORÍAS (BO.TEC)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    function predictCategoryFromInputs(params) {
        const { rawDescartes, sot, rawSolucion, rawProblema } = params;

        const descartesNorm = (rawDescartes || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanSot = (sot || '').trim();
        const solucionNorm = (rawSolucion || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const problemaNorm = (rawProblema || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const contextNorm = `${descartesNorm} ${solucionNorm} ${problemaNorm}`;

        // Detección de SOT creada/generada luego o después del caso (SOT post-caso)
        const isSotPostCaso = /SOT\s+(?:CREADA|GENERADA|EMITIDA|REGISTRADA|EN\s+EJECUCION)?\s*(?:LUEGO|DESPUES|POSTERIOR)\s+(?:DEL?|AL)\s+CASO/i.test(descartesNorm) ||
            /SE\s+VALIDA\s+SOT\s+(?:CREADA|GENERADA|EMITIDA|REGISTRADA)?\s*(?:LUEGO|DESPUES|POSTERIOR)/i.test(descartesNorm) ||
            /SOT\s+(?:CREADA|GENERADA|EMITIDA)\s+(?:LUEGO|DESPUES|POSTERIOR)/i.test(descartesNorm) ||
            /(?:LUEGO|DESPUES|POSTERIOR)\s+DEL?\s+CASO/i.test(descartesNorm) ||
            /(?:LUEGO|DESPUES|POSTERIOR)\s+DE\s+CASO/i.test(descartesNorm) ||
            /SOT\s+GENERADA\s+DESPUES\s+DE\s+CASO/i.test(descartesNorm) ||
            /SOT\s+CREADA\s+LUEGO\s+DEL\s+CASO/i.test(descartesNorm);

        // Detección de SOT generada en el mismo lapso del caso o antes/previa al caso / Con SOT en ejecución preexistente
        const isSotPreCasoOrMismoLapso = !isSotPostCaso && (
            /(?:MISMO\s+LAPSO|LAPSO\s+DE\s+GENERACION|MISMO\s+TIEMPO)/i.test(descartesNorm) ||
            /SOT\s+(?:CREADA|GENERADA|EMITIDA|REGISTRADA)?\s*(?:ANTES|PREVIA|PREVIO|ANTERIOR)\s+(?:DEL?|AL)\s+CASO/i.test(descartesNorm) ||
            /(?:ANTES|PREVIA|PREVIO|ANTERIOR)\s+(?:DEL?|AL)\s+CASO/i.test(descartesNorm) ||
            /(?:ANTES|PREVIA|PREVIO|ANTERIOR)\s+DE\s+CASO/i.test(descartesNorm) ||
            /SOT\s+(?:CREADA|GENERADA|REGISTRADA)\s+(?:ANTES|PREVIA|ANTERIOR)/i.test(descartesNorm) ||
            /CON\s+SOT\s+EN\s+EJECUCI?ON/i.test(descartesNorm) ||
            /CIERRA\s+CASO\s+SOT\s+EN\s+EJECUCI?ON/i.test(descartesNorm) ||
            /CUENTA\s+CON\s+SOT\s+EN\s+EJECUCI?ON/i.test(descartesNorm) ||
            /SOT\s+EN\s+EJECUCI?ON\s+PREVIA/i.test(descartesNorm) ||
            /ERROR\s+OPERATIVO/i.test(descartesNorm) ||
            /ERROR\s+OPERATIVO/i.test(solucionNorm) ||
            /CON\s+SOT\s+EN\s+EJECUCI?ON/i.test(solucionNorm)
        );

        // Detección de Falta de Contacto, Cierre de Ciclo, Número Errado, No Titular o Corta Llamada
        const isNoContactoOrCicloOrTitular = (
            // Titularidad / Número ajeno / No reconoce
            /NO\s+(?:ES|ERA|SER)\s+(?:EL\s+)?TITULAR/i.test(contextNorm) ||
            /NO\s+(?:ES|ERA|SER)\s+(?:SU\s+)?(?:NUMERO|LINEA|TELEFONO|SERVICIO|CUENTA)/i.test(contextNorm) ||
            /NO\s+(?:CORRESPONDE|PERTENECE|RECONOCE)\s+(?:AL?\s+)?(?:TITULAR|NUMERO|LINEA|SERVICIO|CLIENTE)/i.test(contextNorm) ||
            /DESCONOCE\s+(?:LA\s+LINEA|EL\s+NUMERO|EL\s+SERVICIO|AL?\s+TITULAR)/i.test(contextNorm) ||
            // Número errado / no existe / mal creado
            /(?:NUMERO|TELEFONO|LINEA)\s+(?:ERRAD[OA]|NO\s+EXISTE|INCORRECT[OA]|EQUIVOCAD[OA]|INVALID[OA]|NO\s+CORRESPONDE)/i.test(contextNorm) ||
            // Falta de contacto / No contesta / Buzón / Casilla
            /CLIENTE\s+NO\s+CONTESTA/i.test(contextNorm) ||
            /NO\s+CONTESTA/i.test(contextNorm) ||
            /NUNCA\s+(?:RESPONDIO|CONTESTO)/i.test(contextNorm) ||
            /NO\s+RESPONDE/i.test(contextNorm) ||
            /SIN\s+(?:RESPUESTA|CONTACTO)/i.test(contextNorm) ||
            /NO\s+(?:HUBO|SE\s+LOGRA|SE\s+LOGRO|SE\s+PUDO)\s+CONTACT(?:O|AR)/i.test(contextNorm) ||
            /BUZON(?:\s+DE\s+VOZ)?/i.test(contextNorm) ||
            /CASILLA(?:\s+DE\s+VOZ)?/i.test(contextNorm) ||
            // Corte de llamada / Cuelga
            /(?:CORTE|CORTADA)\s+DE\s+LLAMADA/i.test(contextNorm) ||
            /LLAMADA\s+CORTADA/i.test(contextNorm) ||
            /(?:CLIENTE\s+)?(?:CORTA|COLGO|CORTO|CUELGA)\s*(?:LA\s+)?LLAMADA/i.test(contextNorm) ||
            /CLIENTE\s+(?:CORTA|COLGO|CORTO|CUELGA)/i.test(contextNorm) ||
            /(?:CORTA|CUELGA)\s+EN\s+CADA\s+LLAMADA/i.test(contextNorm) ||
            // Cierre de ciclo / 3 intentos
            /(?:CIERRE|FIN|CUMPLE|CUMPLIDO)\s+(?:DE\s+)?CICLO/i.test(contextNorm) ||
            /CICLO\s+CUMPLIDO/i.test(contextNorm) ||
            /(?:3|TRES|3ER|TERCER)\s+INTENTO(?:S)?/i.test(contextNorm) ||
            /INTENTOS?\s*(?:DE\s+LLAMADA)?\s*:\s*3/i.test(contextNorm)
        );

        let predictedCategory = '';

        // Prioridad Alta: Remedy / Bloqueo Web
        if (descartesNorm.includes('REMEDY') || descartesNorm.includes('INCIDENCIA WEB') || descartesNorm.includes('INACCESIBILIDAD') || solucionNorm.includes('REMEDY')) {
            predictedCategory = 'BO.TEC SOLUCIONADO > REMEDY > NO ACCEDE A PAGINA WEB';
        }
        // Regla 1A: SOT creada luego/después del caso -> No contesta / Nunca respondió
        else if (isSotPostCaso) {
            predictedCategory = 'BO.TEC NO CONTESTA > NO CONTESTA > NUNCA RESPONDIO';
        }
        // Regla 1B: SOT generada en el mismo lapso del caso, antes del caso o con SOT en ejecución -> Error Operativo / Con SOT en ejecución
        else if (isSotPreCasoOrMismoLapso) {
            predictedCategory = 'BO.TEC ERROR OPERATIVO > ADMINISTRATIVO > CON SOT EN EJECUCION';
        }
        // Regla 2: Sin Contacto / Cierre de Ciclo / Número Errado / No es el Titular / Corta Llamada / Buzón / Nunca Respondió
        else if (isNoContactoOrCicloOrTitular) {
            predictedCategory = 'BO.TEC NO CONTESTA > NO CONTESTA > NUNCA RESPONDIO';
        }
        // Regla 3: SOT Generada durante la gestión técnica
        else if (cleanSot !== '' && cleanSot.toUpperCase() !== 'N/A') {
            if (descartesNorm.includes('A SOLICITUD') || descartesNorm.includes('SOLICITUD DEL CLIENTE')) {
                predictedCategory = 'BO.TEC SOT GENERADA > A SOLICITUD > USO DE SERVICIO';
            } else if (descartesNorm.includes('SIN DESCARTES') || descartesNorm.length <= 20) {
                predictedCategory = 'BO.TEC SOT GENERADA > A SOLICITUD > SIN DESCARTES';
            } else {
                // Falla física asumiendo que sí hubo descartes técnicos
                predictedCategory = 'BO.TEC SOT GENERADA > EQUIPOS CLARO > EQUIPO/CABLEADO AVERIADO';
            }
        }
        // Regla 4: Solucionado en línea / Provisión
        else if (solucionNorm !== '') {
            if (descartesNorm.includes('PROVISION') || descartesNorm.includes('INCOGNITO') || descartesNorm.includes('ALTA Y BAJA')) {
                predictedCategory = 'BO.TEC SOLUCIONADO > PROVISIÓN > INCOGNITO-EQUIPOS';
            } else {
                predictedCategory = 'BO.TEC SOLUCIONADO > EQUIPOS CLARO > REINICIO DE FABRICA';
            }
        }
        // Default fallback
        else {
            predictedCategory = 'BO.TEC NO CONFIRMADO > OK EN SISTEMAS > NO QUIERE DESCARTES';
        }

        return predictedCategory;
    }

    window.predictCategoryFromInputs = predictCategoryFromInputs;

    window.BO_MODULES.categoryPredictor = {
        init(state, elements) {
            if (!elements.btnPredictCategory) return;

            elements.btnPredictCategory.addEventListener('click', (e) => {
                if (e) e.stopPropagation();

                const category = predictCategoryFromInputs({
                    rawDescartes: elements.genDescartes?.value || '',
                    sot: elements.genSot?.value || '',
                    rawSolucion: elements.genSolucion?.value || '',
                    rawProblema: elements.genProblema?.value || ''
                });

                if (elements.genCatResolucion) {
                    elements.genCatResolucion.value = category;
                    if (window.renderGeneratorPreviews) window.renderGeneratorPreviews();
                    if (window.showToast) window.showToast('Categoría autocompletada: ' + category.split('>')[0].trim(), 'info');
                }

                // Mostrar globo informativo BETA
                const betaInfoPopover = document.getElementById('betaInfoPopover');
                if (betaInfoPopover) {
                    betaInfoPopover.classList.add('active');
                }
            });
        }
    };
})();
