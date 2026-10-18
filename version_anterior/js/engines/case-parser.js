/* ==========================================================================
   MODULE: ANALIZADOR Y FILTRO INTELIGENTE DE PLANTILLAS DE CASO (SMART CASE PARSER)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.caseParser = {
        init(state, elements) {

            function isFullTemplate(text) {
                if (!text || typeof text !== 'string') return false;
                const lower = text.toLowerCase();
                const markers = [
                    /(?:tel[ée]fono|contacto)\s*:/i,
                    /(?:problema|problema detectado|falla)\s*:/i,
                    /(?:descartes|descartes realizados|decarte)\s*:/i,
                    /(?:soluci[óo]n)\s*:/i,
                    /(?:sot|remedy)\s*:/i,
                    /id\s*(?:call\/live|de llamada|llamada)\s*[:=-]?/i,
                    /back\s*office\s*2n\s*hitss/i,
                    /backoffice\s*hitss/i
                ];
                let matchCount = 0;
                markers.forEach(m => {
                    if (m.test(text)) matchCount++;
                });
                return matchCount >= 2 || (matchCount >= 1 && (lower.includes('back office') || lower.includes('backoffice') || lower.includes('hitss')));
            }

            function processAndStoreContactText(text) {
                if (!text) return;
                const raw = text.trim();
                if (raw.toUpperCase() === 'N/A') {
                    state.callIds.clear();
                    state.chatIds.clear();
                    return;
                }

                // 1. Extraer todos los GUID / Chat IDs en el texto
                const uuidMatches = raw.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi);
                if (uuidMatches && uuidMatches.length > 0) {
                    uuidMatches.forEach(u => state.chatIds.add(u.trim()));

                    // Verificar si en el resto del texto venía algún ID de llamada adicional
                    let remainder = raw;
                    uuidMatches.forEach(u => { remainder = remainder.replace(u, ''); });
                    remainder = remainder.replace(/\||,|;|chat\s*id:?/gi, '').trim();
                    remainder = remainder.replace(/^ID\s*(CALL\/LIVE|CALL|LIVE|LLAMADA)?\s*[:=-]?\s*/i, '').trim();
                    remainder = remainder.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
                    if (remainder && remainder.length >= 4) {
                        state.callIds.add(remainder);
                    }
                    if (window.showToast) window.showToast(`💬 Chat ID sumado (${state.chatIds.size}): ${uuidMatches.join(' / ')}`, 'info');
                    return;
                }

                // 2. Si contiene palabras explícitas de Chat
                if (/CHAT/i.test(raw)) {
                    let cleanChat = raw.replace(/^CHAT\s*(ID)?\s*[:=-]?\s*/i, '').trim();
                    cleanChat = cleanChat.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
                    if (cleanChat) {
                        state.chatIds.add(cleanChat);
                        if (window.showToast) window.showToast(`💬 Chat ID sumado: ${cleanChat}`, 'info');
                    }
                    return;
                }

                // 3. De lo contrario, se guarda como ID de Llamada
                let cleanCall = raw.replace(/^ID\s*(CALL\/LIVE|CALL|LIVE|LLAMADA)?\s*[:=-]?\s*/i, '').trim();
                cleanCall = cleanCall.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
                if (cleanCall) {
                    state.callIds.add(cleanCall);
                    if (window.showToast) window.showToast(`📞 ID Llamada sumado: ${cleanCall}`, 'info');
                }
            }

            function updateContactInputField() {
                if (!elements.genContactId) return;
                const callsArr = Array.from(state.callIds);
                const chatsArr = Array.from(state.chatIds);

                const parts = [];
                if (callsArr.length > 0) parts.push(callsArr.join(' / '));
                if (chatsArr.length > 0) parts.push(chatsArr.join(' / '));

                elements.genContactId.value = parts.join(' | ');

                // Auto-seleccionar para que el próximo Ctrl+V pegue encima sumando sin fricción
                setTimeout(() => {
                    if (document.activeElement === elements.genContactId) {
                        elements.genContactId.select();
                    }
                }, 10);
            }

            function parseAndDistributeCaseTemplate(rawText) {
                if (!rawText || typeof rawText !== 'string') return false;
                const text = rawText.trim();
                if (!text || text.length < 8) return false;

                let indicatorsCount = 0;
                const detected = {
                    phones: [],
                    sot: null,
                    contactIds: [],
                    servicio: null,
                    problema: null,
                    solucion: null,
                    descartes: [],
                    isAgendamiento: false
                };

                const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

                // 1. Detectar Agendamiento
                if (/\b(agendamiento|agendar|agenda|agendado|agendada)\b/i.test(text)) {
                    detected.isAgendamiento = true;
                    indicatorsCount++;
                }

                // 2. Extraer Teléfonos (Móviles y Fijos de Casa)
                const phoneLabelMatch = text.match(/(?:tel[eé]fono[s]?|contacto[s]?|celular(?:es)?|fijo[s]?|casa|tlf|cel)\s*[:=-]?\s*([0-9\s/,-]{6,40})/i);
                if (phoneLabelMatch) {
                    const rawPhones = phoneLabelMatch[1];
                    const nums = rawPhones.match(/\b\d{6,11}\b/g);
                    if (nums && nums.length > 0) {
                        detected.phones = Array.from(new Set(nums)).slice(0, 2);
                        indicatorsCount++;
                    }
                }

                if (detected.phones.length === 0) {
                    const mobileMatches = text.match(/\b9\d{8}\b/g) || [];
                    const fixedMatches = text.match(/\b(?:01\d{7}|0[4-8]\d{7}|[2-8]\d{5,7})\b/g) || [];
                    const combined = mobileMatches.concat(fixedMatches);
                    if (combined.length > 0) {
                        const uniquePhones = Array.from(new Set(combined));
                        detected.phones = uniquePhones.slice(0, 2);
                        indicatorsCount++;
                    }
                }

                // 3. Extraer SOT / REMEDY
                const sotLabelMatch = text.match(/\b(?:sot\s*\/\s*remedy|sot|remedy|ticket|incidente|wo|orden|inc)\b\s*[:=-]\s*([a-zA-Z0-9\-_]{6,16})/i);
                if (sotLabelMatch) {
                    const candidate = sotLabelMatch[1].trim();
                    if (candidate.toUpperCase() !== 'N/A') {
                        detected.sot = candidate;
                        indicatorsCount++;
                    }
                }

                if (!detected.sot) {
                    const sotNumMatches = text.match(/\b9\d{7}\b/g);
                    if (sotNumMatches && sotNumMatches.length > 0) {
                        const validSots = sotNumMatches.filter(s => !detected.phones.some(p => p.includes(s)));
                        if (validSots.length > 0) {
                            detected.sot = validSots[0];
                            indicatorsCount++;
                        }
                    }
                }

                // 4. Extraer ID Llamada / Chat ID
                const contactMatches = [];
                const uuidMatches = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi);
                if (uuidMatches) {
                    uuidMatches.forEach(u => contactMatches.push(u));
                }
                const callPatternMatches = text.match(/\b\d{8,12}-\d{4,8}\b/g);
                if (callPatternMatches) {
                    callPatternMatches.forEach(cp => contactMatches.push(cp));
                }
                const callLabelMatch = text.match(/(?:id\s*(?:call\/live|call|live|livechat|llamada|chat)|chat\s*id)\s*[:=-]\s*([^\n\r]+)/i);
                if (callLabelMatch) {
                    let rawCall = callLabelMatch[1].trim();
                    if (rawCall.toUpperCase() !== 'N/A') {
                        if (uuidMatches) {
                            uuidMatches.forEach(u => { rawCall = rawCall.replace(u, ''); });
                        }
                        if (callPatternMatches) {
                            callPatternMatches.forEach(cp => { rawCall = rawCall.replace(cp, ''); });
                        }
                        rawCall = rawCall.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
                        if (rawCall.length >= 4) {
                            contactMatches.push(rawCall);
                        }
                    }
                }

                if (contactMatches.length > 0) {
                    detected.contactIds = Array.from(new Set(contactMatches));
                    indicatorsCount++;
                }

                // 5. Detectar Cabeceras / Banners
                if (/BACK\s*OFFICE/i.test(text) || /\*{6,}/.test(text) || /Plantilla\s*SIAC/i.test(text) || /Plantilla\s*Mantenimiento/i.test(text)) {
                    indicatorsCount++;
                }

                // 6. Extraer Problema
                const probMatch = text.match(/(?:problema|motivo|falla|inconveniente)\s*[:=-]\s*([^\n\r]+)/i);
                if (probMatch) {
                    detected.problema = probMatch[1].trim();
                    indicatorsCount++;
                }

                // 7. Extraer Solución
                const solMatch = text.match(/(?:soluci[oó]n|resoluci[oó]n)\s*[:=-]\s*([^\n\r]+)/i);
                if (solMatch) {
                    const solCandidate = solMatch[1].trim();
                    if (solCandidate.toUpperCase() !== 'N/A') {
                        detected.solucion = solCandidate;
                        indicatorsCount++;
                    }
                }

                // 8. Condición de Activación
                if (indicatorsCount < 2) {
                    return false;
                }

                // 9. Extraer Descartes
                const descartesLines = [];
                lines.forEach(line => {
                    const clean = line.trim();
                    if (!clean) return;

                    if (/^BACK\s*OFFICE/i.test(clean) || /^\*{3,}/.test(clean) || /^=+/.test(clean)) return;
                    if (/^(?:tel[eé]fono|contacto|celular|tlf)\s*[:=-]/i.test(clean)) return;
                    if (/^\b(?:sot\s*\/\s*remedy|sot|remedy|ticket|incidente|wo|orden|inc)\b\s*[:=-]/i.test(clean)) return;
                    if (/^(?:id\s*(?:call\/live|call|live|livechat|llamada|chat)|chat\s*id)\s*[:=-]/i.test(clean)) return;
                    if (/^(?:problema|motivo)\s*[:=-]/i.test(clean)) return;
                    if (/^(?:soluci[oó]n|resoluci[oó]n)\s*[:=-]/i.test(clean)) return;
                    if (/^#[^#]+#$/.test(clean) || /^#[A-Z0-9_+]+$/i.test(clean)) return;

                    if (/^(?:descartes|pruebas|acciones)\s*[:=-]/i.test(clean)) {
                        const content = clean.replace(/^(?:descartes|pruebas|acciones)\s*[:=-]\s*/i, '').trim();
                        if (content) descartesLines.push(content);
                        return;
                    }

                    descartesLines.push(clean);
                });

                detected.descartes = descartesLines;

                // DISTRIBUIR VALORES
                if (detected.phones.length > 0 && elements.genTelefono) {
                    elements.genTelefono.value = detected.phones.join(' / ');
                    elements.genTelefono.classList.remove('input-invalid');
                }

                if (detected.sot && elements.genSot) {
                    elements.genSot.value = detected.sot;
                    elements.genSot.classList.remove('input-invalid');
                } else if (elements.genSot) {
                    elements.genSot.value = '';
                }

                state.callIds.clear();
                state.chatIds.clear();
                if (detected.contactIds.length > 0) {
                    detected.contactIds.forEach(c => processAndStoreContactText(c));
                    updateContactInputField();
                } else {
                    if (elements.genContactId) elements.genContactId.value = '';
                }

                if (detected.problema && elements.genProblema) {
                    const probQuery = detected.problema.toLowerCase();
                    if (window.setProblemValue) {
                        window.setProblemValue(detected.problema);
                    } else {
                        elements.genProblema.value = detected.problema;
                    }
                }

                if (detected.solucion && elements.genSolucion) {
                    elements.genSolucion.value = detected.solucion;
                }

                if (detected.descartes.length > 0 && elements.genDescartes) {
                    elements.genDescartes.value = detected.descartes.join('\n');
                    elements.genDescartes.classList.remove('input-invalid');
                } else if (detected.isAgendamiento && detected.sot && elements.genDescartes) {
                    elements.genDescartes.value = `Se valida agendamiento y generación de SOT ${detected.sot}`;
                }

                // Sincronizar hashtags
                state.selectedHashtags.clear();
                const tagMatches = text.match(/#([a-zA-Z0-9_+]+)#?/g);
                if (tagMatches && typeof BO_DATASET !== 'undefined' && BO_DATASET.hashtags) {
                    tagMatches.forEach(tm => {
                        const cleanTag = tm.replace(/#/g, '').toUpperCase();
                        const found = BO_DATASET.hashtags.find(h => h.tag.replace(/#/g, '').toUpperCase() === cleanTag);
                        if (found) state.selectedHashtags.add(found.tag);
                    });
                }
                if (window.renderHashtagChips) window.renderHashtagChips();

                // Predecir categoría si aplica
                if (elements.btnPredictCategory) elements.btnPredictCategory.click();

                if (window.renderGeneratorPreviews) window.renderGeneratorPreviews();

                const summary = [];
                if (detected.phones.length > 0) summary.push(`📱 ${detected.phones.join(' / ')}`);
                if (detected.sot) summary.push(`🏷️ SOT: ${detected.sot}`);
                if (detected.isAgendamiento) summary.push(`📅 Agendamiento`);
                if (detected.contactIds.length > 0) summary.push(`📞 ID Contacto`);

                if (window.showToast) window.showToast(`⚡ ¡Plantilla detectada y distribuida! ${summary.join(' | ')}`, 'success');
                return true;
            }

            function parseSmartInput(rawText) {
                if (!rawText || typeof rawText !== 'string') return false;
                if (!isFullTemplate(rawText)) return false;

                // 1. Teléfono
                const telMatch = rawText.match(/(?:tel[ée]fono|celular|contacto)\s*:\s*([^\r\n]+)/i);
                if (telMatch && elements.genTelefono) {
                    const cleanTel = telMatch[1].replace(/[^0-9]/g, '').trim();
                    if (cleanTel) elements.genTelefono.value = cleanTel;
                }

                // 2. Problema
                const probMatch = rawText.match(/(?:problema detectado|problema|falla)\s*:\s*([^\r\n]+)/i);
                if (probMatch && elements.genProblema) {
                    let cleanProb = probMatch[1].replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
                    if (cleanProb && cleanProb.toUpperCase() !== 'N/A') {
                        elements.genProblema.value = cleanProb;
                    }
                }

                // 3. Solución
                const solMatch = rawText.match(/(?:soluci[óo]n|solucion)\s*:\s*([^\r\n]+)/i);
                if (solMatch && elements.genSolucion) {
                    const cleanSol = solMatch[1].trim();
                    if (cleanSol && cleanSol.toUpperCase() !== 'N/A') {
                        elements.genSolucion.value = cleanSol;
                    }
                }

                // 4. SOT
                const sotMatch = rawText.match(/(?:sot\s*\/\s*remedy|sot|remedy)\s*:\s*([^\r\n]+)/i);
                if (sotMatch && elements.genSot) {
                    const cleanSot = sotMatch[1].trim();
                    if (cleanSot && cleanSot.toUpperCase() !== 'N/A') {
                        elements.genSot.value = cleanSot;
                    }
                }

                // 5. Contact ID
                const contactMatch = rawText.match(/(?:id\s*call\/live|id\s*de\s*llamada|id\s*llamada|id\s*call)\s*[:=-]?\s*([^\r\n]+)/i);
                if (contactMatch && elements.genContactId) {
                    processAndStoreContactText(contactMatch[1]);
                    updateContactInputField();
                }

                // 6. Servicio
                const upper = rawText.toUpperCase();
                let detectedService = null;
                if (upper.includes('IPTV') || upper.includes('DECO')) detectedService = 'IPTV';
                else if (upper.includes('CLARO VIDEO') || upper.includes('APPS')) detectedService = 'CLARO VIDEO';
                else if (upper.includes('TELEFONIA') || upper.includes('TELEFONÍA') || upper.includes('LINEA') || upper.includes('LÍNEA')) detectedService = 'TELEFONÍA';
                else if (upper.includes('INTERNET') || upper.includes('HFC') || upper.includes('FTTH') || upper.includes('ONT') || upper.includes('ROUTER')) detectedService = 'INTERNET';

                if (detectedService && elements.genServicio) {
                    elements.genServicio.value = detectedService;
                    if (window.populateProblems) window.populateProblems(detectedService, true);
                }

                // 7. Descartes
                const lines = rawText.split(/\r?\n/);
                let inDescartes = false;
                const descartesLines = [];

                for (let line of lines) {
                    const trimmed = line.trim();
                    if (/^(?:descartes\s*:|descartes realizados\s*:|decarte\s*:)/i.test(trimmed)) {
                        inDescartes = true;
                        const first = trimmed.replace(/^(?:descartes\s*:|descartes realizados\s*:|decarte\s*:)\s*/i, '').trim();
                        if (first && first.toUpperCase() !== 'N/A') {
                            descartesLines.push(first);
                        }
                        continue;
                    }

                    if (inDescartes) {
                        if (/^(?:soluci[óo]n\s*:|sot|remedy|id\s*(?:call|live|de llamada|llamada)|contacto\s*:|tel[ée]fono\s*:)/i.test(trimmed)) {
                            inDescartes = false;
                            continue;
                        }
                        if (trimmed.length > 0 && !trimmed.startsWith('***') && !trimmed.startsWith('===')) {
                            descartesLines.push(trimmed);
                        }
                    }
                }

                if (descartesLines.length === 0) {
                    for (let line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('***') || trimmed.startsWith('BACK')) continue;
                        if (/^(?:contacto\s*:|tel[ée]fono\s*:|id\s*llamada|#)/i.test(trimmed)) break;
                        descartesLines.push(trimmed);
                    }
                }

                if (descartesLines.length > 0 && elements.genDescartes) {
                    elements.genDescartes.value = descartesLines.join('\n');
                }

                if (window.renderGeneratorPreviews) window.renderGeneratorPreviews();
                if (window.showToast) window.showToast('✨ Plantilla detectada: campos autocompletados con éxito');
                return true;
            }

            function setupSmartPasteListener(inputEl) {
                if (!inputEl) return;
                inputEl.addEventListener('paste', (e) => {
                    const pastedText = (e.clipboardData || window.clipboardData)?.getData('text');
                    if (pastedText && isFullTemplate(pastedText)) {
                        e.preventDefault();
                        parseSmartInput(pastedText);
                    }
                });
            }

            // Exponer globalmente
            window.parseAndDistributeCaseTemplate = parseAndDistributeCaseTemplate;
            window.processAndStoreContactText = processAndStoreContactText;
            window.updateContactInputField = updateContactInputField;
            window.isFullTemplate = isFullTemplate;
            window.parseSmartInput = parseSmartInput;

            // Interceptar pegado de capturas o plantillas completas en Descartes
            if (elements.genDescartes) {
                elements.genDescartes.addEventListener('paste', (e) => {
                    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
                    if (items) {
                        for (let index in items) {
                            const item = items[index];
                            if (item.kind === 'file' && item.type.startsWith('image/')) {
                                const blob = item.getAsFile();
                                const now = new Date();
                                const dateStr = now.getFullYear().toString() +
                                    String(now.getMonth() + 1).padStart(2, '0') +
                                    String(now.getDate()).padStart(2, '0') + '_' +
                                    String(now.getHours()).padStart(2, '0') +
                                    String(now.getMinutes()).padStart(2, '0') +
                                    String(now.getSeconds()).padStart(2, '0');

                                const fileName = `evidencia_${dateStr}.png`;
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = fileName;
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                }, 100);

                                if (window.showToast) window.showToast(`📷 Captura guardada: ${fileName}`);
                                e.preventDefault();
                                return;
                            }
                        }
                    }

                    const pastedText = (e.clipboardData || window.clipboardData)?.getData('text');
                    if (pastedText) {
                        const wasDistributed = parseAndDistributeCaseTemplate(pastedText);
                        if (wasDistributed) {
                            e.preventDefault();
                        }
                    }
                });
            }

            // Configurar escucha inteligente en otros campos
            setupSmartPasteListener(elements.genProblema);
            setupSmartPasteListener(elements.genTelefono);
            setupSmartPasteListener(elements.genSolucion);
        }
    };
})();
