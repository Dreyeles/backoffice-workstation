/* ==========================================================================
   MODULE: VALIDADOR DE NIVELES DOCSIS INCOGNITO Y FTTH (FLYER N° 41-BO FIJA)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.niveles = {
        init(state, elements) {
        // Incognito Validator Logic (Alineado estrictamente al Flyer N° 41-BO FIJA del 30/09/2026)
        const runIncognitoValidation = () => {
            const parseNumbers = (text) => {
                if (!text || !text.trim()) return null;
                const matches = text.match(/-?\d+(\.\d+)?/g);
                if (!matches) return null;
                return matches.map(m => parseFloat(m));
            };

            const dsPot = parseNumbers(elements.incInputDwsPot.value);
            const usPot = parseNumbers(elements.incInputUsPot.value);
            const dsSnr = parseNumbers(elements.incInputDwsSnr.value);
            const usSnr = parseNumbers(elements.incInputUsSnr.value);

            // Umbrales técnicos HFC:
            // DS SNR >= 33.5 dB
            // DS Potencia: -15.0 a 20.9 dBmV
            // US SNR >= 28.0 dB
            // US Potencia: 36.1 a 52.9 dBmV
            const isDsSnrBad = (v) => v !== null && v !== undefined && v < 33.5;
            const isDsPotBad = (v) => v !== null && v !== undefined && (v < -15 || v > 20.9);
            const isUsSnrBad = (v) => v !== null && v !== undefined && v < 28;
            const isUsPotBad = (v) => v !== null && v !== undefined && (v < 36.1 || v > 52.9);

            const dsSnrHasBad = dsSnr ? dsSnr.some(isDsSnrBad) : false;
            const dsPotHasBad = dsPot ? dsPot.some(isDsPotBad) : false;
            const usSnrHasBad = usSnr ? usSnr.some(isUsSnrBad) : false;
            const usPotHasBad = usPot ? usPot.some(isUsPotBad) : false;

            // Análisis por fila / canal:
            // 1. Filas en Downstream (pares dsSnr[i], dsPot[i])
            let hasRowWithMultipleBad = false;
            const maxDsLen = Math.max(dsSnr ? dsSnr.length : 0, dsPot ? dsPot.length : 0);
            for (let i = 0; i < maxDsLen; i++) {
                let badInRow = 0;
                if (dsSnr && dsSnr[i] !== undefined && isDsSnrBad(dsSnr[i])) badInRow++;
                if (dsPot && dsPot[i] !== undefined && isDsPotBad(dsPot[i])) badInRow++;
                if (badInRow >= 2) {
                    hasRowWithMultipleBad = true;
                    break;
                }
            }

            // 2. Filas en Upstream (pares usSnr[j], usPot[j])
            const maxUsLen = Math.max(usSnr ? usSnr.length : 0, usPot ? usPot.length : 0);
            for (let j = 0; j < maxUsLen; j++) {
                let badInRow = 0;
                if (usSnr && usSnr[j] !== undefined && isUsSnrBad(usSnr[j])) badInRow++;
                if (usPot && usPot[j] !== undefined && isUsPotBad(usPot[j])) badInRow++;
                if (badInRow >= 2) {
                    hasRowWithMultipleBad = true;
                    break;
                }
            }

            // 3. Fila global alineada (si el asesor pega columnas alineadas por canal/fila)
            const maxGlobalLen = Math.max(maxDsLen, maxUsLen);
            for (let k = 0; k < maxGlobalLen; k++) {
                let badInRow = 0;
                if (dsSnr && dsSnr[k] !== undefined && isDsSnrBad(dsSnr[k])) badInRow++;
                if (dsPot && dsPot[k] !== undefined && isDsPotBad(dsPot[k])) badInRow++;
                if (usSnr && usSnr[k] !== undefined && isUsSnrBad(usSnr[k])) badInRow++;
                if (usPot && usPot[k] !== undefined && isUsPotBad(usPot[k])) badInRow++;
                if (badInRow >= 2) {
                    hasRowWithMultipleBad = true;
                    break;
                }
            }

            // =========================================================================
            // PAUTAS OFICIALES - FLYER N° 41-BO FIJA (30/09/2026)
            // =========================================================================
            // 1. GENERAR VISITA TÉCNICA (ROJO):
            //    - Potencia Upstream fuera de rango (Sin descartes).
            //    - AMBOS niveles Downstream (D/S SNR y Potencia Downstream) fuera de rango.
            //    - O fila con 2+ parámetros fuera de rango.
            // 2. CONTINUAR DESCARTES REGULARES (ÁMBAR):
            //    - Si solo UNO de los niveles Downstream está fuera de rango.
            //    - Si los niveles del SNR de Upstream (U/S SNR) están fuera de rango.
            //    - O si hay variación en bloque Downstream (Δ > 4.0 dB).
            // =========================================================================

            const bothDsBad = dsSnrHasBad && dsPotHasBad;
            const isUsPotCritical = usPotHasBad;
            const isDsCritical = bothDsBad || hasRowWithMultipleBad;
            const triggerVisitaTecnica = isUsPotCritical || isDsCritical;

            // Variación de niveles en el bloque Downstream (Máx - Mín <= 4)
            let dsDeltaInfo = '';
            let dsDeltaExceeded = false;
            if (dsSnr && dsSnr.length > 1) {
                const minVal = Math.min(...dsSnr);
                const maxVal = Math.max(...dsSnr);
                const delta = +(maxVal - minVal).toFixed(2);
                dsDeltaExceeded = delta > 4.0;
                dsDeltaInfo = ` [Δ: ${delta} dB]`;
            }

            const formatVals = (values, unit) => {
                if (!values || values.length === 0) return '';
                const display = values.length > 5 ? values.slice(0, 5).join(', ') + '...' : values.join(', ');
                return `${display} ${unit}`;
            };

            // 1. U/S SNR (Flyer: Si U/S SNR está fuera de rango -> NO se genera visita directa; continuar descartes regulares)
            let usSnrRes = { status: 'UNKNOWN', text: 'Esperando datos...' };
            if (usSnr && usSnr.length > 0) {
                if (usSnrHasBad) {
                    usSnrRes = {
                        status: 'WARNING',
                        text: `⚠️ Fuera de Rango (${formatVals(usSnr, 'dB')}) — 🔄 Continuar descartes regulares`
                    };
                } else {
                    usSnrRes = {
                        status: 'OK',
                        text: `Dentro del Rango (${formatVals(usSnr, 'dB')})`
                    };
                }
            }

            // 2. Potencia Upstream (Flyer: Si Potencia Upstream está fuera de rango -> Generar Visita Técnica sin descartes)
            let usPotRes = { status: 'UNKNOWN', text: 'Esperando datos...' };
            if (usPot && usPot.length > 0) {
                if (usPotHasBad) {
                    usPotRes = {
                        status: 'ERROR',
                        text: `❌ Fuera de Rango (${formatVals(usPot, 'dBmV')}) — 🚨 Generar Visita Técnica (Sin descartes)`
                    };
                } else {
                    usPotRes = {
                        status: 'OK',
                        text: `Dentro del Rango (${formatVals(usPot, 'dBmV')})`
                    };
                }
            }

            // 3. D/S SNR (Flyer: Visita solo si AMBOS DS están mal; si es solo 1 -> continuar descartes regulares)
            let dsSnrRes = { status: 'UNKNOWN', text: 'Esperando datos...' };
            if (dsSnr && dsSnr.length > 0) {
                if (dsSnrHasBad) {
                    if (isDsCritical) {
                        dsSnrRes = {
                            status: 'ERROR',
                            text: `❌ Fuera de Rango (${formatVals(dsSnr, 'dB')}${dsDeltaInfo}) — 🚨 Generar Visita Técnica (Ambos DS fuera de rango)`
                        };
                    } else {
                        dsSnrRes = {
                            status: 'WARNING',
                            text: `⚠️ Fuera de Rango (${formatVals(dsSnr, 'dB')}${dsDeltaInfo}) — 🔄 Continuar descartes regulares`
                        };
                    }
                } else if (dsDeltaExceeded) {
                    dsSnrRes = {
                        status: 'WARNING',
                        text: `⚠️ Observación - Variación en Bloque: Δ${dsDeltaInfo}`
                    };
                } else {
                    dsSnrRes = {
                        status: 'OK',
                        text: `Dentro del Rango (${formatVals(dsSnr, 'dB')}${dsDeltaInfo})`
                    };
                }
            }

            // 4. Potencia Downstream (Flyer: Visita solo si AMBOS DS están mal; si es solo 1 -> continuar descartes regulares)
            let dsPotRes = { status: 'UNKNOWN', text: 'Esperando datos...' };
            if (dsPot && dsPot.length > 0) {
                if (dsPotHasBad) {
                    if (isDsCritical) {
                        dsPotRes = {
                            status: 'ERROR',
                            text: `❌ Fuera de Rango (${formatVals(dsPot, 'dBmV')}) — 🚨 Generar Visita Técnica (Ambos DS fuera de rango)`
                        };
                    } else {
                        dsPotRes = {
                            status: 'WARNING',
                            text: `⚠️ Fuera de Rango (${formatVals(dsPot, 'dBmV')}) — 🔄 Continuar descartes regulares`
                        };
                    }
                } else {
                    dsPotRes = {
                        status: 'OK',
                        text: `Dentro del Rango (${formatVals(dsPot, 'dBmV')})`
                    };
                }
            }

            const setVisuals = (element, result, label) => {
                if (!element) return;
                element.textContent = `${label}: ${result.text}`;
                if (result.status === 'OK') {
                    element.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                    element.style.color = '#28a745';
                    element.style.border = '1px solid #28a745';
                } else if (result.status === 'WARNING' || result.status === 'WARN') {
                    element.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                    element.style.color = '#f59e0b';
                    element.style.border = '1px solid #f59e0b';
                } else if (result.status === 'ERROR') {
                    element.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    element.style.color = '#dc3545';
                    element.style.border = '1px solid #dc3545';
                } else {
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--text-color)';
                    element.style.border = '1px dashed var(--border-color)';
                }
            };

            setVisuals(elements.incResultUsSnr, usSnrRes, 'U/S SNR');
            setVisuals(elements.incResultDwsSnr, dsSnrRes, 'D/S SNR');
            setVisuals(elements.incResultDwsPot, dsPotRes, 'Potencia Downstream');
            setVisuals(elements.incResultUsPot, usPotRes, 'Potencia Upstream');

            // Actualizar Badge de Estado Global HFC según Flyer 41-BO FIJA
            if (elements.incGlobalBadge) {
                const hasAnyData = dsSnr || dsPot || usSnr || usPot;
                const anyBadParam = dsSnrHasBad || dsPotHasBad || usSnrHasBad || usPotHasBad || dsDeltaExceeded;

                if (!hasAnyData) {
                    elements.incGlobalBadge.textContent = 'Esperando datos...';
                    elements.incGlobalBadge.style.backgroundColor = 'transparent';
                    elements.incGlobalBadge.style.color = 'var(--text-muted)';
                    elements.incGlobalBadge.style.border = '1px dashed var(--border-color)';
                } else if (triggerVisitaTecnica) {
                    elements.incGlobalBadge.textContent = '🚨 GENERAR VISITA TÉCNICA';
                    elements.incGlobalBadge.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    elements.incGlobalBadge.style.color = '#dc3545';
                    elements.incGlobalBadge.style.border = '1px solid #dc3545';
                } else if (anyBadParam) {
                    elements.incGlobalBadge.textContent = '🔄 CONTINUAR DESCARTES REGULARES';
                    elements.incGlobalBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                    elements.incGlobalBadge.style.color = '#f59e0b';
                    elements.incGlobalBadge.style.border = '1px solid #f59e0b';
                } else {
                    elements.incGlobalBadge.textContent = '✅ NIVELES ÓPTIMOS';
                    elements.incGlobalBadge.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                    elements.incGlobalBadge.style.color = '#28a745';
                    elements.incGlobalBadge.style.border = '1px solid #28a745';
                }
            }
        };

        // Smart HFC Multi-Block Parser & Auto-Distributor
        const parseSmartHfcBlock = (text) => {
            if (!text || typeof text !== 'string') return null;
            const cleanText = text.trim();
            if (!cleanText) return null;

            const keywords = [
                /u\s*\/?\s*s\s*snr/i,
                /d\s*\/?\s*s\s*snr/i,
                /downstream\s*snr/i,
                /upstream\s*snr/i,
                /potencia\s*(?:downstream|d\s*\/\s*s|rx)/i,
                /potencia\s*(?:upstream|u\s*\/\s*s|tx)/i,
                /downstream\s*power/i,
                /upstream\s*power/i,
                /velocidad\s*[du]\s*\/\s*s/i,
                /versión\s*de\s*firmware/i,
                /modelo\s*:/i
            ];

            let matchesCount = 0;
            for (const kw of keywords) {
                if (kw.test(cleanText)) matchesCount++;
            }
            if (matchesCount === 0) return null;

            const extracted = {
                usSnr: null,
                dsSnr: null,
                dsPot: null,
                usPot: null,
                modelo: null
            };

            const labelDefinitions = [
                { type: 'usSnr', regex: /(?:u\s*\/\s*s\s*snr|upstream\s*snr|us\s*snr)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'dsSnr', regex: /(?:d\s*\/\s*s\s*snr|downstream\s*snr|ds\s*snr)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'dsPot', regex: /(?:potencia\s*(?:downstream|d\s*\/\s*s|rx)|downstream\s*power|rx\s*power)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'usPot', regex: /(?:potencia\s*(?:upstream|u\s*\/\s*s|tx)|upstream\s*power|tx\s*power)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'modelo', regex: /(?:modelo|model)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'ignore', regex: /(?:velocidad\s*[du]\s*\/\s*s|versión\s*de\s*firmware|compensación\s*de\s*tiempo|tiempo\s*de\s*actividad|datos\s*del\s*módem)\s*(?:\([^)]*\))?\s*[:\t]/gi }
            ];

            const occurrences = [];
            for (const def of labelDefinitions) {
                let match;
                const re = new RegExp(def.regex.source, 'gi');
                while ((match = re.exec(cleanText)) !== null) {
                    occurrences.push({
                        type: def.type,
                        startIndex: match.index,
                        contentStartIndex: match.index + match[0].length
                    });
                }
            }

            occurrences.sort((a, b) => a.startIndex - b.startIndex);

            if (occurrences.length > 0) {
                for (let i = 0; i < occurrences.length; i++) {
                    const current = occurrences[i];
                    const next = occurrences[i + 1];
                    const rawContent = cleanText.substring(
                        current.contentStartIndex,
                        next ? next.startIndex : cleanText.length
                    ).trim();

                    if (current.type === 'modelo') {
                        const firstLine = rawContent.split(/\r?\n/)[0].trim();
                        const modelMatch = firstLine.match(/^[a-zA-Z0-9@\-_. /()]+/);
                        if (modelMatch) {
                            extracted.modelo = modelMatch[0].trim();
                        } else {
                            const fallbackMatch = rawContent.match(/[a-zA-Z0-9@\-_.]+/);
                            if (fallbackMatch) extracted.modelo = fallbackMatch[0].trim();
                        }
                    } else if (current.type !== 'ignore') {
                        const numMatches = rawContent.match(/-?\d+(\.\d+)?/g);
                        if (numMatches && numMatches.length > 0) {
                            extracted[current.type] = numMatches.join(', ');
                        }
                    }
                }
            }

            // Fallback por escaneo línea a línea
            const lines = cleanText.split(/\r?\n/);
            for (const line of lines) {
                if (!extracted.usSnr && /u\s*\/\s*s\s*snr|upstream\s*snr|us\s*snr/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.usSnr = nums.join(', ');
                }
                if (!extracted.dsSnr && /d\s*\/\s*s\s*snr|downstream\s*snr|ds\s*snr/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.dsSnr = nums.join(', ');
                }
                if (!extracted.dsPot && /potencia\s*(?:downstream|d\s*\/\s*s|rx)|downstream\s*power/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.dsPot = nums.join(', ');
                }
                if (!extracted.usPot && /potencia\s*(?:upstream|u\s*\/\s*s|tx)|upstream\s*power/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.usPot = nums.join(', ');
                }
                if (!extracted.modelo && /modelo\s*:/i.test(line)) {
                    const parts = line.split(/modelo\s*:/i);
                    if (parts[1]) extracted.modelo = parts[1].trim();
                }
            }

            return extracted;
        };

        const applySmartHfcBlock = (rawText) => {
            const data = parseSmartHfcBlock(rawText);
            if (!data) return false;

            let count = 0;
            if (data.usSnr && elements.incInputUsSnr) {
                elements.incInputUsSnr.value = data.usSnr;
                count++;
            }
            if (data.dsSnr && elements.incInputDwsSnr) {
                elements.incInputDwsSnr.value = data.dsSnr;
                count++;
            }
            if (data.dsPot && elements.incInputDwsPot) {
                elements.incInputDwsPot.value = data.dsPot;
                count++;
            }
            if (data.usPot && elements.incInputUsPot) {
                elements.incInputUsPot.value = data.usPot;
                count++;
            }

            if (count > 0) {
                runIncognitoValidation();
                let statusMsg = `✨ ${count} parámetros asignados automáticamente`;
                if (data.modelo) {
                    statusMsg += ` · Modelo: <strong>${data.modelo}</strong>`;
                    if (elements.eqSearchInput) {
                        elements.eqSearchInput.value = data.modelo;
                        elements.eqSearchInput.dispatchEvent(new Event('input'));
                    }
                }
                if (elements.smartPasteStatus) {
                    elements.smartPasteStatus.innerHTML = statusMsg;
                    elements.smartPasteStatus.style.display = 'block';
                }
                showToast(`Auto-pegado: ${count} parámetros detectados`);
                return true;
            }
            return false;
        };

        // Toggle para desplegar / recoger campos manuales HFC
        if (elements.btnToggleHfcManual && elements.hfcManualFields) {
            elements.btnToggleHfcManual.addEventListener('click', () => {
                const isHidden = elements.hfcManualFields.style.display === 'none';
                elements.hfcManualFields.style.display = isHidden ? 'block' : 'none';
                if (elements.toggleManualArrow) {
                    elements.toggleManualArrow.textContent = isHidden ? '▲' : '▼';
                }
            });
        }

        // Listeners para Smart Paste
        if (elements.incSmartPaste) {
            const handleSmartPasteInput = (e) => {
                const text = e.target.value;
                if (applySmartHfcBlock(text)) {
                    // Mantener o limpiar tras breve delay
                }
            };
            elements.incSmartPaste.addEventListener('input', handleSmartPasteInput);
            elements.incSmartPaste.addEventListener('paste', (e) => {
                setTimeout(() => {
                    applySmartHfcBlock(elements.incSmartPaste.value);
                }, 50);
            });
        }

        if (elements.btnSmartPasteClip) {
            elements.btnSmartPasteClip.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                        if (elements.incSmartPaste) {
                            elements.incSmartPaste.value = text;
                        }
                        const recognized = applySmartHfcBlock(text);
                        if (!recognized) {
                            showToast('Texto pegado en el recuadro', 'info');
                        }
                    } else {
                        showToast('El portapapeles está vacío', 'info');
                    }
                } catch (err) {
                    if (elements.incSmartPaste) {
                        elements.incSmartPaste.focus();
                    }
                    showToast('Permite el acceso al portapapeles o presiona Ctrl+V', 'warning');
                }
            });
        }

        // Intercepción de pegado inteligente en cualquiera de los 4 textareas HFC individuales
        const individualHfcInputs = [elements.incInputUsSnr, elements.incInputDwsSnr, elements.incInputDwsPot, elements.incInputUsPot];
        individualHfcInputs.forEach(input => {
            if (!input) return;
            input.addEventListener('paste', (e) => {
                const pastedText = (e.clipboardData || window.clipboardData)?.getData('text');
                if (pastedText && parseSmartHfcBlock(pastedText)) {
                    e.preventDefault();
                    applySmartHfcBlock(pastedText);
                    if (elements.incSmartPaste) elements.incSmartPaste.value = pastedText;
                }
            });
        });

        // Smart FTTH Multi-Block Parser & Auto-Distributor
        const parseSmartFtthBlock = (text) => {
            if (!text || typeof text !== 'string') return null;
            const cleanText = text.trim();
            if (!cleanText) return null;

            const keywords = [
                /transmission\s*power/i,
                /receiving\s*power/i,
                /tx\s*power/i,
                /rx\s*power/i,
                /potencia\s*(?:de\s*)?(?:transmisi[oó]n|tx)/i,
                /potencia\s*(?:de\s*)?(?:recepci[oó]n|rx)/i,
                /ont\s*data/i,
                /hygeia\s*ont/i,
                /download\s*speed.*ftth/i
            ];

            let matchesCount = 0;
            for (const kw of keywords) {
                if (kw.test(cleanText)) matchesCount++;
            }
            if (matchesCount === 0) return null;

            const extracted = {
                tx: null,
                rx: null,
                hw: null
            };

            const labelDefinitions = [
                { type: 'tx', regex: /(?:transmission\s*power|tx\s*(?:optical\s*)?power|potencia\s*(?:de\s*)?(?:transmisi[oó]n|tx))\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'rx', regex: /(?:receiving\s*power|rx\s*(?:optical\s*)?power|potencia\s*(?:de\s*)?(?:recepci[oó]n|rx))\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'hw', regex: /(?:hardware\s*version|versi[oó]n\s*hardware)\s*(?:\([^)]*\))?\s*[:\t]/gi },
                { type: 'ignore', regex: /(?:download\s*speed|upload\s*speed|velocidad\s*[du]p?load|ont\s*data|device\s*hygeia)\s*(?:\([^)]*\))?\s*[:\t]/gi }
            ];

            const occurrences = [];
            for (const def of labelDefinitions) {
                let match;
                const re = new RegExp(def.regex.source, 'gi');
                while ((match = re.exec(cleanText)) !== null) {
                    occurrences.push({
                        type: def.type,
                        startIndex: match.index,
                        contentStartIndex: match.index + match[0].length
                    });
                }
            }

            occurrences.sort((a, b) => a.startIndex - b.startIndex);

            if (occurrences.length > 0) {
                for (let i = 0; i < occurrences.length; i++) {
                    const current = occurrences[i];
                    const next = occurrences[i + 1];
                    const rawContent = cleanText.substring(
                        current.contentStartIndex,
                        next ? next.startIndex : cleanText.length
                    ).trim();

                    if (current.type === 'hw') {
                        const hwMatch = rawContent.match(/[a-zA-Z0-9\-_.]+/);
                        if (hwMatch) extracted.hw = hwMatch[0];
                    } else if (current.type !== 'ignore') {
                        const numMatches = rawContent.match(/-?\d+(\.\d+)?/g);
                        if (numMatches && numMatches.length > 0) {
                            extracted[current.type] = numMatches.join(', ');
                        }
                    }
                }
            }

            // Fallback por escaneo línea a línea
            const lines = cleanText.split(/\r?\n/);
            for (const line of lines) {
                if (!extracted.tx && /transmission\s*power|tx\s*(?:optical\s*)?power|potencia\s*(?:de\s*)?(?:transmisi[oó]n|tx)/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.tx = nums.join(', ');
                }
                if (!extracted.rx && /receiving\s*power|rx\s*(?:optical\s*)?power|potencia\s*(?:de\s*)?(?:recepci[oó]n|rx)/i.test(line)) {
                    const nums = line.replace(/^[^\d-]*/, '').match(/-?\d+(\.\d+)?/g);
                    if (nums) extracted.rx = nums.join(', ');
                }
                if (!extracted.hw && /hardware\s*version/i.test(line)) {
                    const parts = line.split(/hardware\s*version\s*:/i);
                    if (parts[1]) extracted.hw = parts[1].trim();
                }
            }

            return extracted;
        };

        const applySmartFtthBlock = (rawText) => {
            const data = parseSmartFtthBlock(rawText);
            if (!data) return false;

            let count = 0;
            if (data.tx && elements.ftthInputTx) {
                elements.ftthInputTx.value = data.tx;
                count++;
            }
            if (data.rx && elements.ftthInputRx) {
                elements.ftthInputRx.value = data.rx;
                count++;
            }

            if (count > 0) {
                runFtthValidation();
                let statusMsg = `✨ ${count} niveles ópticos FTTH asignados`;
                if (data.hw) {
                    statusMsg += ` · Hardware: <strong>${data.hw}</strong>`;
                }
                if (elements.ftthSmartPasteStatus) {
                    elements.ftthSmartPasteStatus.innerHTML = statusMsg;
                    elements.ftthSmartPasteStatus.style.display = 'block';
                }
                showToast(`Auto-pegado FTTH: ${count} parámetros detectados`);
                return true;
            }
            return false;
        };

        // Toggle para desplegar / recoger campos manuales FTTH
        if (elements.btnToggleFtthManual && elements.ftthManualFields) {
            elements.btnToggleFtthManual.addEventListener('click', () => {
                const isHidden = elements.ftthManualFields.style.display === 'none';
                elements.ftthManualFields.style.display = isHidden ? 'block' : 'none';
                if (elements.toggleFtthManualArrow) {
                    elements.toggleFtthManualArrow.textContent = isHidden ? '▲' : '▼';
                }
            });
        }

        // Listeners para Smart Paste FTTH
        if (elements.ftthSmartPaste) {
            elements.ftthSmartPaste.addEventListener('input', (e) => {
                applySmartFtthBlock(e.target.value);
            });
            elements.ftthSmartPaste.addEventListener('paste', (e) => {
                setTimeout(() => {
                    applySmartFtthBlock(elements.ftthSmartPaste.value);
                }, 50);
            });
        }

        if (elements.btnFtthSmartPasteClip) {
            elements.btnFtthSmartPasteClip.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                        if (elements.ftthSmartPaste) {
                            elements.ftthSmartPaste.value = text;
                        }
                        const recognized = applySmartFtthBlock(text);
                        if (!recognized) {
                            showToast('Texto pegado en el recuadro', 'info');
                        }
                    } else {
                        showToast('El portapapeles está vacío', 'info');
                    }
                } catch (err) {
                    if (elements.ftthSmartPaste) {
                        elements.ftthSmartPaste.focus();
                    }
                    showToast('Permite el acceso al portapapeles o presiona Ctrl+V', 'warning');
                }
            });
        }

        // Intercepción de pegado inteligente en textareas FTTH individuales
        const individualFtthInputs = [elements.ftthInputTx, elements.ftthInputRx];
        individualFtthInputs.forEach(input => {
            if (!input) return;
            input.addEventListener('paste', (e) => {
                const pastedText = (e.clipboardData || window.clipboardData)?.getData('text');
                if (pastedText && parseSmartFtthBlock(pastedText)) {
                    e.preventDefault();
                    applySmartFtthBlock(pastedText);
                    if (elements.ftthSmartPaste) elements.ftthSmartPaste.value = pastedText;
                }
            });
        });

        const runFtthValidation = () => {
            if (!elements.ftthInputTx) return;
            const parseNumbers = (text) => {
                if (!text) return null;
                const matches = text.match(/-?\d+(\.\d+)?/g);
                if (!matches) return null;
                return matches.map(m => parseFloat(m));
            };

            const txVals = parseNumbers(elements.ftthInputTx.value);
            const rxVals = parseNumbers(elements.ftthInputRx.value);

            const validate = (values, min, max, unit = 'dBm') => {
                if (!values || values.length === 0) return { status: 'UNKNOWN', text: 'Esperando datos...' };
                let outOfRange = false;
                for (let v of values) {
                    if (v < min || (max !== null && v > max)) {
                        outOfRange = true;
                        break;
                    }
                }
                const displayVals = values.length > 5 ? values.slice(0, 5).join(', ') + '...' : values.join(', ');

                if (outOfRange) {
                    return { status: 'ERROR', text: `Fuera de Rango (${displayVals} ${unit}) [Óptimo: ${min} a ${max} ${unit}]` };
                }
                return { status: 'OK', text: `Dentro del Rango (${displayVals} ${unit})` };
            };

            const setVisuals = (element, result, label) => {
                if (!element) return;
                element.textContent = `${label}: ${result.text}`;
                if (result.status === 'OK') {
                    element.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                    element.style.color = '#28a745';
                    element.style.border = '1px solid #28a745';
                } else if (result.status === 'WARNING' || result.status === 'WARN') {
                    element.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                    element.style.color = '#f59e0b';
                    element.style.border = '1px solid #f59e0b';
                } else if (result.status === 'ERROR') {
                    element.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    element.style.color = '#dc3545';
                    element.style.border = '1px solid #dc3545';
                } else {
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--text-color)';
                    element.style.border = '1px dashed var(--border-color)';
                }
            };

            // Reglas FTTH: Tx: 0.5 a 5.0 dBm | Rx: -24.9 a -6.1 dBm
            const txRes = validate(txVals, 0.5, 5.0, 'dBm');
            const rxRes = validate(rxVals, -24.9, -6.1, 'dBm');

            setVisuals(elements.ftthResultTx, txRes, 'Transmission Power (Tx)');
            setVisuals(elements.ftthResultRx, rxRes, 'Receiving Power (Rx)');

            // Actualizar Badge Global FTTH
            if (elements.ftthGlobalBadge) {
                const hasAnyData = txVals || rxVals;
                if (!hasAnyData) {
                    elements.ftthGlobalBadge.textContent = 'Esperando datos...';
                    elements.ftthGlobalBadge.style.backgroundColor = 'transparent';
                    elements.ftthGlobalBadge.style.color = 'var(--text-muted)';
                    elements.ftthGlobalBadge.style.border = '1px dashed var(--border-color)';
                } else if (txRes.status === 'ERROR' || rxRes.status === 'ERROR') {
                    elements.ftthGlobalBadge.textContent = '🔴 FUERA DE RANGO';
                    elements.ftthGlobalBadge.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    elements.ftthGlobalBadge.style.color = '#dc3545';
                    elements.ftthGlobalBadge.style.border = '1px solid #dc3545';
                } else {
                    elements.ftthGlobalBadge.textContent = '✅ NIVELES ÓPTIMOS';
                    elements.ftthGlobalBadge.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                    elements.ftthGlobalBadge.style.color = '#28a745';
                    elements.ftthGlobalBadge.style.border = '1px solid #28a745';
                }
            }
        };

        // Switch HFC vs FTTH
        if (elements.btnTechHfc && elements.btnTechFtth) {
            elements.btnTechHfc.addEventListener('click', () => {
                elements.btnTechHfc.classList.add('active');
                elements.btnTechFtth.classList.remove('active');
                if (elements.hygeiaHfcPanel) elements.hygeiaHfcPanel.style.display = 'block';
                if (elements.hygeiaFtthPanel) elements.hygeiaFtthPanel.style.display = 'none';
            });

            elements.btnTechFtth.addEventListener('click', () => {
                elements.btnTechFtth.classList.add('active');
                elements.btnTechHfc.classList.remove('active');
                if (elements.hygeiaHfcPanel) elements.hygeiaHfcPanel.style.display = 'none';
                if (elements.hygeiaFtthPanel) elements.hygeiaFtthPanel.style.display = 'block';
            });
        }

        if (elements.incInputDwsPot) {
            elements.incInputDwsPot.addEventListener('input', runIncognitoValidation);
            elements.incInputUsPot.addEventListener('input', runIncognitoValidation);
            elements.incInputDwsSnr.addEventListener('input', runIncognitoValidation);
            elements.incInputUsSnr.addEventListener('input', runIncognitoValidation);
            runIncognitoValidation(); // initial state
        }

        if (elements.ftthInputTx) {
            elements.ftthInputTx.addEventListener('input', runFtthValidation);
            elements.ftthInputRx.addEventListener('input', runFtthValidation);
            runFtthValidation();
        }

        if (elements.btnClearHygeia) {
            elements.btnClearHygeia.addEventListener('click', () => {
                if (elements.incSmartPaste) elements.incSmartPaste.value = '';
                if (elements.smartPasteStatus) elements.smartPasteStatus.style.display = 'none';
                if (elements.hfcManualFields) {
                    elements.hfcManualFields.style.display = 'none';
                    if (elements.toggleManualArrow) elements.toggleManualArrow.textContent = '▼';
                }
                if (elements.ftthSmartPaste) elements.ftthSmartPaste.value = '';
                if (elements.ftthSmartPasteStatus) elements.ftthSmartPasteStatus.style.display = 'none';
                if (elements.ftthManualFields) {
                    elements.ftthManualFields.style.display = 'none';
                    if (elements.toggleFtthManualArrow) elements.toggleFtthManualArrow.textContent = '▼';
                }
                if (elements.incInputDwsPot) elements.incInputDwsPot.value = '';
                if (elements.incInputUsPot) elements.incInputUsPot.value = '';
                if (elements.incInputDwsSnr) elements.incInputDwsSnr.value = '';
                if (elements.incInputUsSnr) elements.incInputUsSnr.value = '';
                if (elements.ftthInputTx) elements.ftthInputTx.value = '';
                if (elements.ftthInputRx) elements.ftthInputRx.value = '';
                runIncognitoValidation();
                runFtthValidation();
                showToast('Validador de niveles limpiado');
            });
        }

        }
    };
})();
