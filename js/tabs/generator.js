/* ==========================================================================
   MODULE: TAB 1 - GENERADOR OFICIAL DE PLANTILLAS SIAC, MANTO Y WHATSAPP
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.generator = {
        init(state, elements) {
            const autoCorrectText = (text, preserve) => (window.autoCorrectText ? window.autoCorrectText(text, preserve) : text);
            const addHistoryRecord = (type, service, content) => (window.addHistoryRecord ? window.addHistoryRecord(type, service, content) : null);
            const learnSinglePhrase = (cat, phrase) => (window.learnSinglePhrase ? window.learnSinglePhrase(cat, phrase) : null);
            const initPredictiveTextEngine = () => (window.initPredictiveTextEngine ? window.initPredictiveTextEngine() : null);
            const showToast = (msg, type, action) => (window.showToast ? window.showToast(msg, type, action) : null);
            const copyToClipboard = (text, msg) => (window.copyToClipboard ? window.copyToClipboard(text, msg) : null);
            const processAndStoreContactText = (txt) => (window.processAndStoreContactText ? window.processAndStoreContactText(txt) : null);
            const updateContactInputField = () => (window.updateContactInputField ? window.updateContactInputField() : null);
            const parseAndDistributeCaseTemplate = (raw) => (window.parseAndDistributeCaseTemplate ? window.parseAndDistributeCaseTemplate(raw) : false);

            let currentProblemList = [];
            let lastClearedSnapshot = null;

            function setProblemValue(val) {
                if (elements.genProblema) {
                    const cleanVal = (val || '').replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
                    elements.genProblema.value = cleanVal;
                    elements.genProblema.classList.remove('input-invalid');
                }
                renderGeneratorPreviews();
            }

            function renderProblemOptions(list) {
                const container = document.getElementById('genProblemaOptions');
                if (!container) return;
                container.innerHTML = '';
                list.forEach(prob => {
                    const div = document.createElement('div');
                    div.className = 'custom-option';
                    div.textContent = prob;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setProblemValue(prob);
                        const problemaDropdown = document.getElementById('problemaDropdown');
                        if (problemaDropdown) problemaDropdown.classList.remove('open');
                    });
                    container.appendChild(div);
                });
            }

            function populateProblems(serviceKey, keepCurrentValue = false) {
                const base = (typeof BO_DATASET !== 'undefined' && BO_DATASET.problemsByService && BO_DATASET.problemsByService[serviceKey]) ||
                    (serviceKey === 'CLARO VIDEO' && BO_DATASET?.problemsByService ? BO_DATASET.problemsByService['APPS'] : []) || [];
                const learned = (state.learnedPhrases && state.learnedPhrases.problemas) || [];

                const seen = new Set();
                const combined = [];

                base.forEach(p => {
                    const clean = p.replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
                    const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    if (!seen.has(norm)) {
                        seen.add(norm);
                        combined.push(clean);
                    }
                });

                learned.forEach(p => {
                    const clean = p.replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
                    const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    if (!seen.has(norm) && norm.length >= 4) {
                        seen.add(norm);
                        combined.push(clean);
                    }
                });

                currentProblemList = combined;
                renderProblemOptions(currentProblemList);

                if (!keepCurrentValue) {
                    setProblemValue('');
                }
            }

            function renderQuickDescartes() {
                if (!elements.quickDescartesContainer) return;

                const currentService = (elements.genServicio?.value || 'INTERNET').toUpperCase();

                const quickDescartesByService = {
                    "INTERNET": [
                        { label: "Consumo Tracer", states: ["Se valida consumo en Tracer y sin flags alarmados", "Se valida sin consumo en tracer y con flag alarmado"] },
                        { label: "Provisión e Incógnito", states: ["Se valida provisión y online en Incógnito", "Se valida sin provisión / offline en Incógnito"] },
                        { label: "Dashboard OK", states: ["Se valida Dashboard OK", "Se valida dashboard con online en naranja "] },
                        { label: "TR69 Todo OK", states: ["Se valida TR69 todo OK", "Se valida TR69 con canales saturados"] },
                        { label: "Schaman OK", states: ["Se valida Schaman sin alertas", "Se valida Schaman con alerta de"] },
                        { label: "Plume", states: ["Se valida cliente Plume", "Plume con extensores desconectados y firmware desactualizado"] },
                        { label: "Escritorio Remoto", states: ["Se hace reinicio de fábrica desde Escritorio Remoto", "Sin acceso al Escritorio Remoto"] },
                        { label: "SGA OK", states: ["Se valida datos de SOT e historial en SGA", "Se valida provisión incorrecta en SGA"] },
                        { label: "Ciclo de Llamada", states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
                    ],
                    "IPTV": [
                        { label: "Provisión e Incógnito", states: ["Se valida provisión y online en Incógnito", "Sin provisión / no carga en Incógnito"] },
                        { label: "Skyway", states: ["Se valida parámetros y estado OK en Skyway", "Parámetros desalineados en Skyway"] },
                        { label: "Youbora", states: ["Se valida métricas y reproducción OK en Youbora", "Youbora con alertas de buffering / errores de reproducción"] },
                        { label: "Ciclo de Llamada", states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
                    ],
                    "TELEFONIA": [
                        { label: "Provisión e Incógnito", states: ["Se valida provisión y estado de telefonía en Incógnito", "Línea telefónica sin provisión en Incógnito"] },
                        { label: "IMS / CBIO", states: ["Se valida registro en IMS / CBIO OK", "Falla de autenticación en IMS / CBIO"] },
                        { label: "Tono y Llamadas", states: ["Se valida tono de discado y tráfico de llamadas OK", "Sin tono de discado / no salen ni entran llamadas"] },
                        { label: "SGA OK", states: ["Se valida datos de SOT e historial de telefonía en SGA", "Datos desalineados en SGA"] },
                        { label: "Ciclo de Llamada", states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
                    ],
                    "APPS": [
                        { label: "Base Datos Claro Video", states: ["Se valida usuario y suscripción activa en Base Perú / México", "Desalineado en Base Perú / México, se gestiona corrección"] },
                        { label: "AMCO / Incógnito", states: ["Se valida provisión y cuenta activa en AMCO", "Usuario no registrado / falla de aprovisionamiento en AMCO"] },
                        { label: "Reinicio / App", states: ["Se indica al cliente borrado de datos/caché y reinicio de app OK", "Falla persiste tras borrado de caché y reinstalación"] },
                        { label: "Ciclo de Llamada", states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
                    ],
                    "CLARO VIDEO": [
                        { label: "Base Datos Claro Video", states: ["Se valida usuario y suscripción activa en Base Perú / México", "Desalineado en Base Perú / México, se gestiona corrección"] },
                        { label: "AMCO / Incógnito", states: ["Se valida provisión y cuenta activa en AMCO", "Usuario no registrado / falla de aprovisionamiento en AMCO"] },
                        { label: "Reinicio / App", states: ["Se indica al cliente borrado de datos/caché y reinicio de app OK", "Falla persiste tras borrado de caché y reinstalación"] },
                        { label: "Ciclo de Llamada", states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
                    ]
                };

                const quickDescartesList = quickDescartesByService[currentService] || quickDescartesByService["INTERNET"];
                const tooltipEl = document.getElementById('chipPreviewTooltip');

                const showChipTooltip = (e, item, currentState) => {
                    if (!tooltipEl) return;
                    const nextState = (currentState + 1) % (item.states.length + 1);

                    let nextTextHTML = '';
                    let nextBoxClass = '';

                    if (nextState === 0) {
                        nextTextHTML = `<strong>⚪ Próximo Clic:</strong> Desactivar / Quitar descarte`;
                        nextBoxClass = 'tooltip-next-box is-reset';
                    } else {
                        const targetText = item.states[nextState - 1];
                        let icon = '🔄';
                        if (nextState === 1) icon = '📞';
                        else if (nextState === item.states.length) icon = '🏁';
                        nextTextHTML = `<strong>${icon} Próximo Clic (Paso ${nextState}):</strong><br>"${targetText}"`;
                        nextBoxClass = nextState === 1 ? 'tooltip-next-box is-ok' : (nextState === item.states.length ? 'tooltip-next-box is-fail' : 'tooltip-next-box');
                    }

                    let statesHTML = '';
                    item.states.forEach((st, idx) => {
                        const stepNum = idx + 1;
                        const isCurrent = currentState === stepNum;
                        const isNext = nextState === stepNum;
                        const icon = idx === 0 ? '✅' : '❌';
                        statesHTML += `
                            <div class="tooltip-state-item ${isCurrent ? 'is-current' : ''} ${isNext ? 'is-next-target' : ''}">
                                <span>${icon} Clic ${stepNum}:</span>
                                <span>"${st}"</span>
                            </div>
                        `;
                    });

                    statesHTML += `
                        <div class="tooltip-state-item ${currentState === 0 ? 'is-current' : ''} ${nextState === 0 ? 'is-next-target' : ''}">
                            <span>⚪ Clic ${item.states.length + 1}:</span>
                            <span>Quitar descarte</span>
                        </div>
                    `;

                    tooltipEl.innerHTML = `
                        <div class="tooltip-header">
                            <span>${item.icon || '⚡'} ${item.label}</span>
                            <span style="font-size:0.7rem; opacity:0.8;">${currentState > 0 ? `Estado ${currentState}/${item.states.length}` : 'Inactivo'}</span>
                        </div>
                        <div class="${nextBoxClass}">${nextTextHTML}</div>
                        <div class="tooltip-variants-title">Ciclo completo de variantes:</div>
                        <div class="tooltip-states-list">${statesHTML}</div>
                    `;

                    tooltipEl.classList.add('active');
                    positionTooltip(e);
                };

                const positionTooltip = (e) => {
                    if (!tooltipEl || !e) return;
                    const mouseX = e.clientX || 0;
                    const mouseY = e.clientY || 0;

                    let posX = mouseX + 14;
                    let posY = mouseY + 14;

                    const rect = tooltipEl.getBoundingClientRect();
                    const tooltipWidth = rect.width || 310;
                    const tooltipHeight = rect.height || 180;

                    if (posX + tooltipWidth > window.innerWidth - 10) {
                        posX = mouseX - tooltipWidth - 10;
                    }
                    if (posY + tooltipHeight > window.innerHeight - 10) {
                        posY = mouseY - tooltipHeight - 10;
                    }

                    tooltipEl.style.left = `${Math.max(10, posX)}px`;
                    tooltipEl.style.top = `${Math.max(10, posY)}px`;
                };

                const hideChipTooltip = () => {
                    if (tooltipEl) tooltipEl.classList.remove('active');
                };

                if (!state.selectedDescartes) state.selectedDescartes = new Map();

                if (!elements.genDescartes.dataset.syncBound) {
                    elements.genDescartes.addEventListener('input', () => {
                        const currentText = elements.genDescartes.value;
                        let changed = false;
                        quickDescartesList.forEach(item => {
                            const curState = state.selectedDescartes.get(item.label) || 0;
                            if (curState > 0) {
                                const expectedText = item.states[curState - 1];
                                if (!currentText.toLowerCase().includes(expectedText.toLowerCase())) {
                                    state.selectedDescartes.set(item.label, 0);
                                    changed = true;
                                }
                            }
                        });
                        if (changed) rebuild();
                    });
                    elements.genDescartes.dataset.syncBound = 'true';
                }

                function rebuild() {
                    elements.quickDescartesContainer.innerHTML = '';
                    quickDescartesList.forEach(item => {
                        const s = state.selectedDescartes.get(item.label) || 0;
                        const chip = document.createElement('div');
                        let chipIcon = item.icon || '';

                        if (s === 0) {
                            chip.className = 'chip';
                        } else if (s === 1) {
                            chip.className = 'chip selected';
                            chipIcon = item.icon ? chipIcon : '✅ ';
                        } else {
                            chip.className = item.states.length === 2 ? 'chip chip-fail' : 'chip selected';
                            chipIcon = item.icon ? chipIcon : '❌ ';
                        }

                        let labelText = item.label;
                        chip.innerHTML = `${chipIcon}${labelText}`;

                        chip.addEventListener('mouseenter', (e) => showChipTooltip(e, item, s));
                        chip.addEventListener('mousemove', (e) => positionTooltip(e));
                        chip.addEventListener('mouseleave', hideChipTooltip);

                        chip.addEventListener('click', (e) => {
                            const cur = state.selectedDescartes.get(item.label) || 0;
                            const next = (cur + 1) % (item.states.length + 1);

                            let currentVal = elements.genDescartes.value;

                            item.states.forEach(st => {
                                const escaped = st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                currentVal = currentVal.replace(new RegExp(`,\\s*${escaped}`, 'gi'), '');
                                currentVal = currentVal.replace(new RegExp(`${escaped}\\s*,?`, 'gi'), '');
                            });

                            currentVal = currentVal.trim();
                            if (next > 0) {
                                const toAdd = item.states[next - 1];
                                currentVal = currentVal ? `${currentVal}, ${toAdd}` : toAdd;
                            }

                            currentVal = currentVal.replace(/,+/g, ',').replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, '').trim();
                            elements.genDescartes.value = autoCorrectText(currentVal, false);

                            state.selectedDescartes.set(item.label, next);
                            renderGeneratorPreviews();
                            rebuild();

                            const newS = state.selectedDescartes.get(item.label) || 0;
                            showChipTooltip(e, item, newS);
                        });
                        elements.quickDescartesContainer.appendChild(chip);
                    });
                }
                rebuild();
            }

            function renderHashtagChips() {
                if (!elements.hashtagsContainer) return;
                elements.hashtagsContainer.innerHTML = '';
                if (typeof BO_DATASET !== 'undefined' && BO_DATASET.hashtags) {
                    BO_DATASET.hashtags.forEach(h => {
                        const chip = document.createElement('div');
                        chip.className = `chip ${state.selectedHashtags.has(h.tag) ? 'selected' : ''}`;
                        chip.textContent = h.tag;
                        chip.title = h.description || h.tag;
                        chip.addEventListener('click', () => {
                            if (state.selectedHashtags.has(h.tag)) {
                                state.selectedHashtags.delete(h.tag);
                                chip.classList.remove('selected');
                            } else {
                                state.selectedHashtags.add(h.tag);
                                chip.classList.add('selected');
                            }
                            renderGeneratorPreviews();
                        });
                        elements.hashtagsContainer.appendChild(chip);
                    });
                }
            }

            function checkIsCiclo(descartesText) {
                const text = (descartesText || '').toUpperCase();
                if (text.includes('CICLO') ||
                    text.includes('NO CONTESTA') ||
                    text.includes('BUZON DE VOZ') ||
                    text.includes('BUZÓN DE VOZ')) {
                    return true;
                }
                if (state.selectedDescartes && (state.selectedDescartes.get("Ciclo de Llamada") > 0 || state.selectedDescartes.get("Ciclos de Llamada") > 0)) {
                    return true;
                }
                return false;
            }

            function formatDescartesLines(rawText) {
                if (!rawText || !rawText.trim()) return 'Descartes: N/A';

                const items = rawText.split(/[\r\n,;]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map(s => {
                        let clean = s.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)/, '')
                            .replace(/^Er\s+intento\b/i, '1er intento')
                            .replace(/^Do\s+intento\b/i, '2do intento')
                            .replace(/^33er\s+intento\b/i, '3er intento')
                            .trim();
                        if (!clean) return '';
                        return clean.charAt(0).toUpperCase() + clean.slice(1);
                    })
                    .filter(s => s.length > 0);

                if (items.length === 0) return 'Descartes: N/A';

                const prefix = 'Descartes: ';
                return prefix + items[0] + (items.length > 1 ? '\n' + items.slice(1).join('\n') : '');
            }

            function formatDescartesLinesWsp(rawText) {
                if (!rawText || !rawText.trim()) return 'DESCARTES REALIZADOS: N/A';

                const items = rawText.split(/[\r\n,;]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map(s => {
                        let clean = s.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)/, '')
                            .replace(/^Er\s+intento\b/i, '1er intento')
                            .replace(/^Do\s+intento\b/i, '2do intento')
                            .replace(/^33er\s+intento\b/i, '3er intento')
                            .trim();
                        if (!clean) return '';
                        return clean.charAt(0).toUpperCase() + clean.slice(1);
                    })
                    .filter(s => s.length > 0);

                if (items.length === 0) return 'DESCARTES REALIZADOS: N/A';

                const prefix = 'DESCARTES REALIZADOS: ';
                return prefix + items[0] + (items.length > 1 ? '\n' + items.slice(1).join('\n') : '');
            }

            function formatDescarteWspCiclo(rawText) {
                if (!rawText || !rawText.trim() || rawText.trim().toUpperCase() === 'N/A') {
                    return 'DECARTE: NO RESPONDE N°XX DE LLAMADA';
                }
                let clean = rawText.replace(/^(DECARTE|DESCARTE|DESCARTES REALIZADOS)\s*:\s*/i, '').trim();
                const items = clean.split(/[\r\n,;]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map(s => s.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)/, '')
                        .replace(/^Er\s+intento\b/i, '1er intento')
                        .replace(/^Do\s+intento\b/i, '2do intento')
                        .replace(/^33er\s+intento\b/i, '3er intento')
                        .trim())
                    .filter(s => s.length > 0);
                if (items.length === 0) return 'DECARTE: NO RESPONDE N°XX DE LLAMADA';
                const prefix = 'DECARTE: ';
                return prefix + items[0] + (items.length > 1 ? '\n' + items.slice(1).join('\n') : '');
            }

            function getFormattedContactLines() {
                const all = [];
                if (state.callIds.size > 0) {
                    all.push(...Array.from(state.callIds));
                }
                if (state.chatIds.size > 0) {
                    all.push(...Array.from(state.chatIds));
                }
                if (all.length === 0) {
                    const manual = (elements.genContactId && elements.genContactId.value) ? elements.genContactId.value.trim() : '';
                    if (manual && manual.toUpperCase() !== 'N/A') return `ID call/live: ${manual}`;
                    return 'ID call/live: N/A';
                }
                return `ID call/live: ${all.join(' / ')}`;
            }

            function renderGeneratorPreviews() {
                const rawProblema = (elements.genProblema && elements.genProblema.value ? elements.genProblema.value : '').trim();
                let cleanProblema = rawProblema.replace(/^(INT|TEL|IPTV|CABLE|APPS)\s*-\s*/i, '').trim();
                if (!cleanProblema) cleanProblema = rawProblema || 'N/A';

                const telefono = (elements.genTelefono.value || 'N/A').trim();
                const sot = (elements.genSot.value || 'N/A').trim();

                const rawSolucion = ((elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value.trim() : 'N/A');
                const solucion = rawSolucion !== 'N/A' ? autoCorrectText(rawSolucion, false) : 'N/A';

                const rawDescartesInput = (elements.genDescartes ? elements.genDescartes.value : '').trim();
                const correctedDescartes = rawDescartesInput ? autoCorrectText(rawDescartesInput, false) : '';
                const descartesFormatted = formatDescartesLines(correctedDescartes);
                const descartesFormattedWsp = formatDescartesLinesWsp(correctedDescartes);

                const contactLines = getFormattedContactLines();

                const isWsp = state.siacTemplateMode === 'wsp';
                const isAutoCiclo = rawDescartesInput ? checkIsCiclo(rawDescartesInput) : false;
                const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;

                if (elements.btnToggleSiacMode && elements.labelSiacMode) {
                    elements.labelSiacMode.textContent = isWsp ? 'Oficial Cliente Claro' : 'Estándar';
                    if (isWsp) {
                        elements.btnToggleSiacMode.classList.add('active');
                    } else {
                        elements.btnToggleSiacMode.classList.remove('active');
                    }
                }

                if (elements.btnToggleCiclo && elements.labelCicloToggle) {
                    elements.btnToggleCiclo.style.display = 'inline-flex';
                    if (state.cicloOverride !== null) {
                        elements.labelCicloToggle.textContent = state.cicloOverride ? 'Ciclo: Manual ON' : 'Ciclo: Manual OFF';
                    } else {
                        elements.labelCicloToggle.textContent = isAutoCiclo ? 'Ciclo: Auto (ON)' : 'Ciclo: Auto';
                    }
                    if (isCiclo) {
                        elements.btnToggleCiclo.classList.add('active');
                    } else {
                        elements.btnToggleCiclo.classList.remove('active');
                    }
                }

                const descartesLower = (rawDescartesInput || '').toLowerCase();
                const isAdvancedCiclo = descartesLower.includes('2do') ||
                    descartesLower.includes('segundo') ||
                    descartesLower.includes('3er') ||
                    descartesLower.includes('tercer') ||
                    descartesLower.includes('3 intentos') ||
                    descartesLower.includes('cumple ciclo') ||
                    descartesLower.includes('fin de ciclo') ||
                    descartesLower.includes('cumplido') ||
                    descartesLower.includes('cierre') ||
                    descartesLower.includes('nunca respondió') ||
                    descartesLower.includes('nunca respondio') ||
                    descartesLower.includes('ciclo 2') ||
                    descartesLower.includes('ciclo 3');
                const isPrimerCiclo = isCiclo && !isAdvancedCiclo;

                if (elements.genSolucion) {
                    const labelSolucion = document.querySelector('label[for="genSolucion"]');
                    if (labelSolucion) {
                        labelSolucion.textContent = 'Solución del Caso';
                    }
                    elements.genSolucion.placeholder = 'Describe la solución aplicada...';

                    if (isPrimerCiclo) {
                        elements.genSolucion.disabled = true;
                        elements.genSolucion.style.opacity = '0.6';
                        elements.genSolucion.style.cursor = 'not-allowed';
                        elements.genSolucion.style.backgroundColor = 'var(--bg-secondary)';
                    } else {
                        elements.genSolucion.disabled = false;
                        elements.genSolucion.style.opacity = '1';
                        elements.genSolucion.style.cursor = 'text';
                        elements.genSolucion.style.backgroundColor = '';
                    }
                }

                if (elements.titleSiacCard) {
                    elements.titleSiacCard.innerHTML = isCiclo
                        ? (isWsp ? 'Plantilla Oficial Claro <span style="font-size:0.75rem; color:#00ACC1; font-weight:bold; margin-left:0.3rem;">(📞 Ciclo de Llamada)</span>' : 'Plantilla SIAC / SGA <span style="font-size:0.75rem; color:#00ACC1; font-weight:bold; margin-left:0.3rem;">(📞 Ciclo de Llamada)</span>')
                        : (isWsp ? 'Plantilla Oficial Cliente Claro' : 'Plantilla SIAC / Helix');
                }

                if (elements.previewSiac) {
                    if (isCiclo) {
                        elements.previewSiac.classList.add('ciclo-mode');
                    } else {
                        elements.previewSiac.classList.remove('ciclo-mode');
                    }
                }

                const sotRaw = (elements.genSot.value || '').trim();
                const sotSiacLine = (sotRaw && sotRaw.toUpperCase() !== 'N/A') ? `\nSOT / REMEDY: ${sotRaw}` : '';
                const contactIdVal = (Array.from(state.callIds).concat(Array.from(state.chatIds)).join(' / ') || (elements.genContactId ? elements.genContactId.value.trim() : '') || 'N/A');

                let siacTextDisplay = '';
                let siacTextCopy = '';

                if (isWsp) {
                    if (isCiclo) {
                        const descarteWspCiclo = formatDescarteWspCiclo(correctedDescartes);
                        const baseBody = `BACKOFFICE HITSS - CICLO DE LLAMADA
CELULAR: ${telefono}
${descarteWspCiclo}${sotSiacLine}
ID DE LLAMADA: ${contactIdVal}`;

                        siacTextDisplay = `RELLAMADAS CADA 2 HORAS\n${baseBody}`;
                        siacTextCopy = baseBody;
                    } else {
                        const baseBody = `BACKOFFICE HITSS
CELULAR: ${telefono}
PROBLEMA DETECTADO: ${cleanProblema}
${descartesFormattedWsp}
SOLUCION: ${solucion}${sotSiacLine}
ID DE LLAMADA: ${contactIdVal}`;

                        siacTextDisplay = `1era LLAMADA + WSP\n${baseBody}`;
                        siacTextCopy = baseBody;
                    }
                } else if (isCiclo) {
                    const solucionCicloLine = (solucion && solucion !== 'N/A' && solucion.trim() !== '') ? `\nSolución: ${solucion}` : '';
                    siacTextDisplay = `BACK OFFICE 2N HITSS - CICLO DE LLAMADA:
************************
Teléfono: ${telefono}
${descartesFormatted}${solucionCicloLine}${sotSiacLine}
${contactLines}`;
                    siacTextCopy = siacTextDisplay;
                } else {
                    siacTextDisplay = `BACK OFFICE 2N HITSS:
************************
Teléfono: ${telefono}
Problema: ${cleanProblema}
${descartesFormatted}
Solución: ${solucion}${sotSiacLine}
${contactLines}`;
                    siacTextCopy = siacTextDisplay;
                }

                const rawDescartesManto = rawDescartesInput ? autoCorrectText(rawDescartesInput, false) : 'N/A';

                let tagManto = '';
                if (state.selectedHashtags.size > 0) {
                    tagManto = Array.from(state.selectedHashtags).map(t => {
                        const clean = t.replace(/^#+/, '').replace(/#+$/, '');
                        return `#${clean}#`;
                    }).join(' ');
                }

                const mantoLines = [
                    rawDescartesManto,
                    `contacto: ${telefono}`,
                    `ID llamada ${contactIdVal}`
                ];
                if (tagManto) {
                    mantoLines.push(tagManto);
                }

                const mantoText = mantoLines.join('\n');

                if (elements.previewSiac) {
                    elements.previewSiac.textContent = siacTextDisplay;
                    elements.previewSiac.dataset.copyText = siacTextCopy;
                }
                if (elements.previewManto) {
                    elements.previewManto.textContent = mantoText;
                    elements.previewManto.dataset.copyText = mantoText;
                }
            }

            function validateTemplateRequirements() {
                const rawDescartes = (elements.genDescartes ? elements.genDescartes.value : '');
                const isAutoCiclo = checkIsCiclo(rawDescartes);
                const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;
                const isWsp = state.siacTemplateMode === 'wsp';

                const missingFieldNames = [];
                const missingElements = [];

                const telefono = (elements.genTelefono ? elements.genTelefono.value : '').trim();
                const digitsOnly = telefono.replace(/\D/g, '');
                if (!telefono || digitsOnly.length < 6 || telefono.toUpperCase() === 'N/A') {
                    missingFieldNames.push('Número de Contacto (Móvil 9 dígitos o Fijo de casa mín. 6 dígitos)');
                    if (elements.genTelefono) missingElements.push(elements.genTelefono);
                }

                if (!isCiclo) {
                    const problema = (elements.genProblema ? elements.genProblema.value : '').trim();
                    if (!problema || problema.toUpperCase() === 'N/A') {
                        missingFieldNames.push('Descripción del Cliente / Problema');
                        if (elements.genProblema) missingElements.push(elements.genProblema);
                    }
                }

                if (!(isWsp && isCiclo)) {
                    const descartes = (elements.genDescartes ? elements.genDescartes.value : '').trim();
                    if (!descartes || descartes.toUpperCase() === 'N/A' || descartes.length < 3) {
                        missingFieldNames.push(isCiclo ? 'Intento de Ciclo de Llamada' : 'Descartes Realizados (Mín. 1)');
                        if (elements.genDescartes) missingElements.push(elements.genDescartes);
                    }
                }

                return {
                    isValid: missingFieldNames.length === 0,
                    missingFieldNames,
                    missingElements
                };
            }

            function executeCopyTemplate(previewElement, successMsg, logType) {
                if (elements.genSolucion && elements.genSolucion.value) {
                    elements.genSolucion.value = autoCorrectText(elements.genSolucion.value, false);
                }
                if (elements.genDescartes && elements.genDescartes.value) {
                    elements.genDescartes.value = autoCorrectText(elements.genDescartes.value, false);
                }
                renderGeneratorPreviews();

                const validation = validateTemplateRequirements();
                if (!validation.isValid) {
                    validation.missingElements.forEach(el => {
                        el.classList.remove('input-invalid');
                        void el.offsetWidth;
                        el.classList.add('input-invalid');
                    });

                    if (validation.missingElements.length > 0) {
                        const firstEl = validation.missingElements[0];
                        if (typeof firstEl.focus === 'function') {
                            firstEl.focus();
                        } else if (firstEl.scrollIntoView) {
                            firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }

                    showToast(`❌ Error: Plantilla incompleta.\nDebes completar:\n• ${validation.missingFieldNames.join('\n• ')}`, 'danger');
                    return false;
                }

                const textToCopy = previewElement.dataset.copyText || previewElement.textContent;
                copyToClipboard(textToCopy, successMsg);
                addHistoryRecord(logType, elements.genServicio.value, textToCopy);
                return true;
            }

            function restoreClearedFormSnapshot() {
                if (!lastClearedSnapshot) return false;
                const snap = lastClearedSnapshot;
                if (elements.genTelefono) elements.genTelefono.value = snap.telefono || '';
                if (elements.genProblema) elements.genProblema.value = snap.problema || '';
                if (elements.genSolucion) elements.genSolucion.value = snap.solucion || '';
                if (elements.genDescartes) elements.genDescartes.value = snap.descartes || '';
                if (elements.genSot) elements.genSot.value = snap.sot || '';
                if (elements.genContactId) elements.genContactId.value = snap.contactId || '';
                if (elements.genCatResolucion) elements.genCatResolucion.value = snap.catResolucion || '';
                if (elements.genServicio) {
                    elements.genServicio.value = snap.servicio || 'INTERNET';
                    populateProblems(snap.servicio || 'INTERNET', true);
                }
                state.selectedHashtags = new Set(snap.hashtags || []);
                renderHashtagChips();
                state.selectedDescartes = new Map(snap.selectedDescartes || []);
                renderQuickDescartes();
                state.cicloOverride = snap.cicloOverride;
                state.callIds = new Set(snap.callIds || []);
                state.chatIds = new Set(snap.chatIds || []);

                renderGeneratorPreviews();
                showToast('↩️ ¡Datos restaurados exitosamente!', 'success');
                lastClearedSnapshot = null;
                return true;
            }

            // Exponer globalmente para otros módulos
            window.renderGeneratorPreviews = renderGeneratorPreviews;
            window.populateProblems = populateProblems;
            window.setProblemValue = setProblemValue;
            window.renderHashtagChips = renderHashtagChips;

            // Inicializar eventos del Generador
            populateProblems(elements.genServicio.value);
            elements.genServicio.addEventListener('change', (e) => {
                populateProblems(e.target.value);
                renderQuickDescartes();
                renderGeneratorPreviews();
            });

            if (elements.genSolucion) {
                elements.genSolucion.addEventListener('input', renderGeneratorPreviews);
                elements.genSolucion.addEventListener('change', renderGeneratorPreviews);
            }

            renderQuickDescartes();
            renderHashtagChips();
            initPredictiveTextEngine();

            [
                elements.genProblema, elements.genTelefono, elements.genSot,
                elements.genDescartes, elements.genCatResolucion
            ].forEach(input => {
                if (input) {
                    input.addEventListener('input', (e) => {
                        e.target.classList.remove('input-invalid');
                        renderGeneratorPreviews();
                    });
                    input.addEventListener('change', renderGeneratorPreviews);
                }
            });

            // Validación Teléfono
            if (elements.genTelefono) {
                const telefonoWarning = document.getElementById('genTelefonoWarning');
                let warningTimeout = null;

                const triggerPhoneWarning = (msg = '⚠️ Solo se permiten números y separadores') => {
                    elements.genTelefono.classList.remove('input-invalid');
                    void elements.genTelefono.offsetWidth;
                    elements.genTelefono.classList.add('input-invalid');

                    if (telefonoWarning) {
                        telefonoWarning.textContent = msg;
                        telefonoWarning.style.display = 'flex';
                    }

                    if (warningTimeout) clearTimeout(warningTimeout);
                    warningTimeout = setTimeout(() => {
                        elements.genTelefono.classList.remove('input-invalid');
                        if (telefonoWarning) telefonoWarning.style.display = 'none';
                    }, 2000);

                    showToast(msg, 'warning');
                };

                elements.genTelefono.addEventListener('keydown', (e) => {
                    const allowedControlKeys = [
                        'Backspace', 'Tab', 'Enter', 'Delete', 'Escape',
                        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                        'Home', 'End'
                    ];
                    if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
                        return;
                    }
                    if (!/^[0-9\s/,-]$/.test(e.key)) {
                        e.preventDefault();
                        triggerPhoneWarning('⚠️ Solo se permiten números y separadores (/ - ,)');
                    }
                });

                elements.genTelefono.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text') || '';
                    if (!pastedText.trim()) return;

                    let extractedCallId = null;
                    let extractedPhones = [];

                    const callPatternMatch = pastedText.match(/\b\d{8,12}-\d{4,8}\b/);
                    if (callPatternMatch) {
                        extractedCallId = callPatternMatch[0];
                    } else {
                        const callLabelMatch = pastedText.match(/(?:id\s*de\s*llamada|id\s*call|call\s*id)\s*[:=\t\r\n]?\s*([^\r\n]+)/i);
                        if (callLabelMatch) {
                            const candidate = callLabelMatch[1].trim();
                            if (candidate && candidate.toUpperCase() !== 'N/A') {
                                extractedCallId = candidate;
                            }
                        }
                    }

                    const clientNumMatch = pastedText.match(/(?:n[uú]mero\s*de\s*cliente|n[uú]mero\s*llamado|n[uú]mero\s*de\s*contacto|tel[eé]fono|contacto|celular|fijo|casa)\s*[:=\t\r\n]?\s*([0-9\s/,-]{6,40})/i);
                    if (clientNumMatch) {
                        const nums = clientNumMatch[1].match(/\b\d{6,11}\b/g);
                        if (nums) extractedPhones = Array.from(new Set(nums));
                    }

                    if (extractedPhones.length === 0) {
                        let textWithoutCallId = pastedText;
                        if (extractedCallId) {
                            textWithoutCallId = textWithoutCallId.replace(extractedCallId, '');
                        }
                        const allNums = textWithoutCallId.match(/\b9\d{8}\b/g) || textWithoutCallId.match(/\b(?:01\d{7}|0[4-8]\d{7}|[2-8]\d{5,7})\b/g) || textWithoutCallId.match(/\b\d{6,11}\b/g);
                        if (allNums) extractedPhones = Array.from(new Set(allNums));
                    }

                    if (extractedCallId || (extractedPhones.length > 0 && pastedText.length > 20)) {
                        if (extractedCallId) {
                            processAndStoreContactText(extractedCallId);
                            updateContactInputField();
                        }

                        if (extractedPhones.length > 0) {
                            elements.genTelefono.value = extractedPhones.slice(0, 2).join(' / ');
                            elements.genTelefono.classList.remove('input-invalid');
                        } else {
                            const cleanPhone = pastedText.replace(/[^0-9\s/,-]/g, '').trim();
                            if (cleanPhone) elements.genTelefono.value = cleanPhone;
                        }

                        renderGeneratorPreviews();
                        const toastMsg = extractedCallId
                            ? `📞 Teléfono (${elements.genTelefono.value}) e ID Llamada (${extractedCallId}) asignados`
                            : `📞 Teléfono detectado: ${elements.genTelefono.value}`;
                        showToast(toastMsg, 'success');
                        return;
                    }

                    const cleanPhone = pastedText.replace(/[^0-9\s/,-]/g, '').trim();
                    if (!cleanPhone) {
                        triggerPhoneWarning('⚠️ El texto pegado no contiene números válidos');
                        return;
                    }
                    if (cleanPhone !== pastedText.trim()) {
                        triggerPhoneWarning('⚠️ Solo números y separadores: Se eliminaron caracteres especiales');
                    }
                    elements.genTelefono.value = cleanPhone;
                    renderGeneratorPreviews();
                });

                elements.genTelefono.addEventListener('input', () => {
                    const currentVal = elements.genTelefono.value;
                    if (/[^0-9\s/,-]/.test(currentVal)) {
                        elements.genTelefono.value = currentVal.replace(/[^0-9\s/,-]/g, '');
                        triggerPhoneWarning('⚠️ Solo se permiten números y separadores');
                    }
                    renderGeneratorPreviews();
                });

                elements.genTelefono.addEventListener('change', renderGeneratorPreviews);
            }

            // Contact ID
            if (elements.genContactId) {
                elements.genContactId.addEventListener('focus', () => {
                    elements.genContactId.select();
                });

                elements.genContactId.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
                    if (!pastedText) return;

                    const clientNumMatch = pastedText.match(/(?:n[uú]mero\s*de\s*cliente|n[uú]mero\s*llamado)\s*[:=\t\r\n]?\s*(\d{7,11})/i);
                    if (clientNumMatch && elements.genTelefono && !elements.genTelefono.value) {
                        elements.genTelefono.value = clientNumMatch[1];
                        elements.genTelefono.classList.remove('input-invalid');
                    }

                    processAndStoreContactText(pastedText);
                    updateContactInputField();
                    renderGeneratorPreviews();
                });

                elements.genContactId.addEventListener('input', () => {
                    const val = elements.genContactId.value.trim();
                    if (!val) {
                        state.callIds.clear();
                        state.chatIds.clear();
                    } else {
                        processAndStoreContactText(val);
                    }
                    renderGeneratorPreviews();
                });
            }

            // Auto-correct en inputs
            const attachAutoCorrect = (inputEl, btnEl) => {
                if (!inputEl) return;
                inputEl.addEventListener('keyup', (e) => {
                    if ([' ', ',', '.', ';', 'Enter'].includes(e.key)) {
                        const original = inputEl.value;
                        const startPos = inputEl.selectionStart;
                        const corrected = autoCorrectText(original, true);
                        if (original !== corrected) {
                            const lenDiff = corrected.length - original.length;
                            inputEl.value = corrected;
                            if (typeof startPos === 'number') {
                                const newPos = Math.max(0, startPos + lenDiff);
                                inputEl.setSelectionRange(newPos, newPos);
                            }
                            renderGeneratorPreviews();
                        }
                    }
                });

                inputEl.addEventListener('paste', () => {
                    setTimeout(() => {
                        const original = inputEl.value;
                        const corrected = autoCorrectText(original, false);
                        if (original !== corrected) {
                            inputEl.value = corrected;
                            renderGeneratorPreviews();
                        }
                    }, 20);
                });

                inputEl.addEventListener('blur', () => {
                    const original = inputEl.value;
                    const corrected = autoCorrectText(original, false);
                    if (original !== corrected) {
                        inputEl.value = corrected;
                        renderGeneratorPreviews();
                    }
                });

                if (btnEl) {
                    btnEl.addEventListener('click', () => {
                        const original = inputEl.value;
                        const corrected = autoCorrectText(original, false);
                        inputEl.value = corrected;
                        renderGeneratorPreviews();
                        if (original && original.trim() !== corrected.trim()) {
                            showToast('🪄 Ortografía y abreviaturas corregidas', 'info');
                        } else if (original.trim()) {
                            showToast('✓ Texto sin errores corregido', 'info');
                        } else {
                            showToast('⚠️ Ingresa texto primero para corregir', 'warning');
                        }
                    });
                }
            };

            attachAutoCorrect(elements.genSolucion, document.getElementById('btnAutoCorrectSolucion'));
            attachAutoCorrect(elements.genDescartes, document.getElementById('btnAutoCorrectDescartes'));

            // Problema Combobox Dropdown
            const problemaDropdown = document.getElementById('problemaDropdown');
            const btnToggleProblema = document.getElementById('btnToggleProblemaDropdown');
            const problemaWrapper = document.getElementById('problemaWrapper');
            let currentFocus = -1;

            if (elements.genProblema) {
                elements.genProblema.addEventListener('input', (e) => {
                    e.target.classList.remove('input-invalid');
                    const query = (e.target.value || '').toLowerCase().trim();
                    const filtered = query
                        ? currentProblemList.filter(p => p.toLowerCase().includes(query))
                        : currentProblemList;

                    renderProblemOptions(filtered);
                    currentFocus = -1;
                    if (problemaDropdown) {
                        if (filtered.length > 0) {
                            problemaDropdown.classList.add('open');
                        } else {
                            problemaDropdown.classList.remove('open');
                        }
                    }
                    renderGeneratorPreviews();
                });

                elements.genProblema.addEventListener('change', () => {
                    const val = (elements.genProblema.value || '').trim();
                    if (val && val.length >= 4 && val.toUpperCase() !== 'N/A') {
                        learnSinglePhrase('problemas', val);
                        const currentService = (elements.genServicio?.value || 'INTERNET').toUpperCase();
                        populateProblems(currentService, true);
                    }
                });

                elements.genProblema.addEventListener('focus', () => {
                    const query = (elements.genProblema.value || '').toLowerCase().trim();
                    const filtered = query
                        ? currentProblemList.filter(p => p.toLowerCase().includes(query))
                        : currentProblemList;
                    renderProblemOptions(filtered.length > 0 ? filtered : currentProblemList);
                    currentFocus = -1;
                    if (problemaDropdown) problemaDropdown.classList.add('open');
                    if (elements.genProblema.value) {
                        setTimeout(() => {
                            elements.genProblema.select();
                        }, 10);
                    }
                });

                elements.genProblema.addEventListener('keydown', (e) => {
                    const options = document.getElementById('genProblemaOptions')?.getElementsByClassName('custom-option');
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (problemaDropdown && !problemaDropdown.classList.contains('open')) {
                            problemaDropdown.classList.add('open');
                        }
                        if (options && options.length > 0) {
                            currentFocus++;
                            addActive(options);
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (options && options.length > 0) {
                            currentFocus--;
                            addActive(options);
                        }
                    } else if (e.key === 'Enter') {
                        if (currentFocus > -1 && options && options[currentFocus]) {
                            e.preventDefault();
                            options[currentFocus].click();
                        } else if (problemaDropdown) {
                            problemaDropdown.classList.remove('open');
                        }
                    } else if (e.key === 'Escape') {
                        if (problemaDropdown) problemaDropdown.classList.remove('open');
                    }
                });

                function addActive(options) {
                    if (!options) return false;
                    for (let i = 0; i < options.length; i++) options[i].classList.remove('active');
                    if (currentFocus >= options.length) currentFocus = 0;
                    if (currentFocus < 0) currentFocus = options.length - 1;
                    options[currentFocus].classList.add('active');
                    options[currentFocus].scrollIntoView({ block: 'nearest' });
                }
            }

            if (btnToggleProblema) {
                btnToggleProblema.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!problemaDropdown) return;
                    const isOpen = problemaDropdown.classList.contains('open');
                    if (!isOpen) {
                        renderProblemOptions(currentProblemList);
                        currentFocus = -1;
                        problemaDropdown.classList.add('open');
                        elements.genProblema?.focus();
                    } else {
                        problemaDropdown.classList.remove('open');
                    }
                });
            }

            document.addEventListener('click', (e) => {
                if (problemaWrapper && !problemaWrapper.contains(e.target)) {
                    if (problemaDropdown) problemaDropdown.classList.remove('open');
                }
            });

            // Botón Limpiar Formulario con Soporte Undo
            const btnClearForm = document.getElementById('btnClearForm');
            if (btnClearForm) {
                btnClearForm.addEventListener('click', () => {
                    const hasContent = (elements.genTelefono?.value || '').trim() ||
                        (elements.genProblema?.value || '').trim() ||
                        (elements.genSolucion?.value || '').trim() ||
                        (elements.genDescartes?.value || '').trim() ||
                        (elements.genSot?.value || '').trim() ||
                        (elements.genContactId?.value || '').trim() ||
                        (elements.genCatResolucion?.value || '').trim() ||
                        state.selectedHashtags.size > 0 ||
                        state.callIds.size > 0;

                    if (hasContent) {
                        lastClearedSnapshot = {
                            telefono: elements.genTelefono?.value || '',
                            problema: elements.genProblema?.value || '',
                            solucion: elements.genSolucion?.value || '',
                            descartes: elements.genDescartes?.value || '',
                            sot: elements.genSot?.value || '',
                            contactId: elements.genContactId?.value || '',
                            servicio: elements.genServicio?.value || 'INTERNET',
                            catResolucion: elements.genCatResolucion?.value || '',
                            hashtags: new Set(state.selectedHashtags),
                            selectedDescartes: state.selectedDescartes ? new Map(state.selectedDescartes) : new Map(),
                            cicloOverride: state.cicloOverride,
                            callIds: new Set(state.callIds),
                            chatIds: new Set(state.chatIds)
                        };
                    }

                    elements.genTelefono.value = '';
                    elements.genSot.value = '';
                    elements.genContactId.value = '';
                    elements.genSolucion.value = '';
                    elements.genDescartes.value = '';
                    if (elements.genCatResolucion) elements.genCatResolucion.value = '';
                    elements.genServicio.value = 'INTERNET';
                    populateProblems('INTERNET');
                    state.selectedHashtags.clear();
                    renderHashtagChips();
                    if (state.selectedDescartes) state.selectedDescartes.clear();
                    renderQuickDescartes();

                    state.cicloOverride = null;
                    state.callIds.clear();
                    state.chatIds.clear();

                    document.querySelectorAll('.input-invalid').forEach(el => el.classList.remove('input-invalid'));
                    const telefonoWarning = document.getElementById('genTelefonoWarning');
                    if (telefonoWarning) telefonoWarning.style.display = 'none';

                    renderGeneratorPreviews();

                    if (hasContent) {
                        showToast('Campos limpiados', 'info', {
                            text: '↩️ Deshacer (Ctrl+Z)',
                            callback: restoreClearedFormSnapshot
                        });
                    } else {
                        showToast('Campos limpiados');
                    }
                });
            }

            // Atajo Ctrl+Z para deshacer limpieza
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                    if (lastClearedSnapshot) {
                        const active = document.activeElement;
                        const isFormInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
                        if (!isFormInput || !active.value.trim()) {
                            e.preventDefault();
                            restoreClearedFormSnapshot();
                        }
                    }
                }
            });

            // Toggles de Modo Plantilla y Modo Ciclo
            if (elements.btnToggleSiacMode) {
                elements.btnToggleSiacMode.addEventListener('click', () => {
                    state.siacTemplateMode = state.siacTemplateMode === 'wsp' ? 'standard' : 'wsp';
                    localStorage.setItem('bo_siac_template_mode', state.siacTemplateMode);
                    showToast(state.siacTemplateMode === 'wsp' ? 'Formato cambiado a: Oficial Cliente Claro' : 'Formato cambiado a: SIAC Estándar', 'info');
                    renderGeneratorPreviews();
                });
            }

            if (elements.btnToggleCiclo) {
                elements.btnToggleCiclo.addEventListener('click', () => {
                    const isAutoCiclo = checkIsCiclo(elements.genDescartes.value || '');
                    if (state.cicloOverride === null) {
                        state.cicloOverride = !isAutoCiclo;
                        showToast(state.cicloOverride ? 'Modo Ciclo de Llamada forzado' : 'Modo Estándar forzado', 'info');
                    } else {
                        state.cicloOverride = null;
                        showToast('Modo Ciclo restablecido a detección automática', 'info');
                    }
                    renderGeneratorPreviews();
                });
            }

            if (elements.btnCopySiac) {
                elements.btnCopySiac.addEventListener('click', () => {
                    const isWsp = state.siacTemplateMode === 'wsp';
                    const isAutoCiclo = checkIsCiclo(elements.genDescartes.value || '');
                    const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;

                    let msg = 'Plantilla SIAC/SGA copiada';
                    let logType = 'Generador SIAC';

                    if (isWsp) {
                        if (isCiclo) {
                            msg = 'Plantilla Oficial Claro (Rellamadas) copiada';
                            logType = 'Generador Oficial Ciclo';
                        } else {
                            msg = 'Plantilla Oficial Cliente Claro copiada';
                            logType = 'Generador Oficial Claro';
                        }
                    } else if (isCiclo) {
                        msg = 'Plantilla Ciclo de Llamada copiada';
                        logType = 'Generador Ciclo';
                    }

                    executeCopyTemplate(elements.previewSiac, msg, logType);
                });
            }

            if (elements.btnCopyManto) {
                elements.btnCopyManto.addEventListener('click', () => {
                    executeCopyTemplate(elements.previewManto, 'Plantilla Mantenimiento copiada', 'Generador Manto');
                });
            }

            renderGeneratorPreviews();
        }
    };
})();
