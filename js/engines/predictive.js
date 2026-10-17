/* ==========================================================================
   MODULE: MOTOR DE TEXTO PREDICTIVO (GHOST TEXT + AUTOCOMPLETE + LEARNING)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.predictive = {
        init(state, elements) {
    function learnSinglePhrase(category, phrase) {
        if (!phrase) return;
        const clean = phrase.trim()
            .replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '')
            .replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)/, '')
            .replace(/^Sse\b/i, 'Se')
            .replace(/^Er\s+intento\b/i, '1er intento')
            .replace(/^Do\s+intento\b/i, '2do intento')
            .replace(/^33er\s+intento\b/i, '3er intento')
            .trim();
        const minLen = category === 'problemas' ? 4 : 6;
        if (clean.length < minLen || clean.toUpperCase() === 'N/A' || clean.startsWith('#')) return;

        if (!state.learnedPhrases) {
            state.learnedPhrases = { descartes: [], soluciones: [], problemas: [] };
        }
        if (!state.learnedPhrases[category]) {
            state.learnedPhrases[category] = [];
        }

        const normClean = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const exists = state.learnedPhrases[category].some(p => p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normClean);
        
        let inBase = false;
        if (category === 'problemas') {
            const allBase = Object.values(BO_DATASET.problemsByService || {}).flat();
            inBase = allBase.some(b => b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === normClean);
        } else {
            inBase = ((BO_DATASET.predictiveCorpus && BO_DATASET.predictiveCorpus[category]) || []).some(p => p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normClean);
        }

        if (!exists && !inBase) {
            state.learnedPhrases[category].unshift(clean);
            if (state.learnedPhrases[category].length > 500) {
                state.learnedPhrases[category].pop();
            }
            try {
                localStorage.setItem('bo_learned_phrases', JSON.stringify(state.learnedPhrases));
            } catch (e) {
                console.warn('Storage limit reached for learned phrases', e);
            }
        }
    }

    function learnFromActiveForm() {
        if (elements.genProblema && elements.genProblema.value) {
            learnSinglePhrase('problemas', elements.genProblema.value);
        }
        if (elements.genSolucion && elements.genSolucion.value) {
            const parts = elements.genSolucion.value.split(/[\n,;|]+/);
            parts.forEach(p => learnSinglePhrase('soluciones', p));
        }
        if (elements.genDescartes && elements.genDescartes.value) {
            const lines = elements.genDescartes.value.split(/[\n,;|]+/);
            lines.forEach(line => {
                learnSinglePhrase('descartes', line);
            });
        }
    }

    function initPredictiveTextEngine() {
        const normalize = (str) => {
            return (str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const getAllCorpus = (category) => {
            const base = (BO_DATASET.predictiveCorpus && BO_DATASET.predictiveCorpus[category]) || [];
            const learned = (state.learnedPhrases && state.learnedPhrases[category]) || [];
            const seen = new Set();
            const result = [];
            [...learned, ...base].forEach(item => {
                const norm = normalize(item);
                if (norm && !seen.has(norm) && norm.length >= 4) {
                    seen.add(norm);
                    result.push(item.trim());
                }
            });
            return result;
        };

        // Smart keyword & tool alias dictionary
        const KEYWORD_ALIASES = {
            'incog': ['incognito'],
            'incogni': ['incognito'],
            'incognito': ['incognito'],
            'dash': ['dashboard'],
            'das': ['dashboard'],
            'dashboard': ['dashboard'],
            'tr': ['tr69'],
            'tr69': ['tr69'],
            'tr-69': ['tr69'],
            'shaman': ['schaman'],
            'schaman': ['schaman'],
            'rdp': ['escritorio', 'remoto'],
            'remoto': ['escritorio', 'remoto'],
            'escritorio': ['escritorio', 'remoto'],
            'plume': ['plume', 'extensores'],
            'live': ['livechat', 'chat'],
            'chat': ['livechat', 'chat'],
            'livechat': ['livechat'],
            'wsp': ['whatsapp', 'livechat'],
            'buzon': ['buzon', 'ciclo'],
            'llamada': ['llamada', 'ciclo'],
            'ciclo': ['ciclo', 'intento'],
            'sot': ['sot', 'visita', 'mtto', 'migracion'],
            'remedy': ['remedy', 'ticket'],
            'wifi': ['wifi', 'bandas', 'ssid', 'canales'],
            'vel': ['velocidad', '100', 'red'],
            'velocidad': ['velocidad', '100', 'red'],
            'speed': ['velocidad', 'red'],
            'fisico': ['fisicos', 'fisico', 'conectado', 'los'],
            'fisicos': ['fisicos', 'fisico', 'conectado', 'los'],
            'sga': ['sga', 'alta', 'baja', 'provision'],
            'plano': ['plano', 'averia', 'masiva'],
            'averia': ['plano', 'averia', 'masiva'],
            'cable': ['cable', 'cat5', 'cat6', 'ethernet'],
            'cat5': ['cable', 'cat5', 'cat6', 'ethernet'],
            'cat6': ['cable', 'cat5', 'cat6', 'ethernet'],
            'clave': ['clave', 'contrasena', 'nombre', 'ssid'],
            'contra': ['contrasena', 'clave'],
            'contrasena': ['contrasena', 'clave'],
            'repetidor': ['repetidor', 'mesh', 'plume', 'cobertura'],
            'mesh': ['repetidor', 'mesh', 'cobertura'],
            'cobertura': ['cobertura', 'repetidor', 'mesh', 'senal'],
            'migracion': ['migracion', 'tecnologica', 'sot'],
            'migra': ['migracion', 'tecnologica', 'sot']
        };

        const getPhraseTag = (phrase) => {
            const p = normalize(phrase);
            if (p.includes('tracer')) return 'Tracer';
            if (p.includes('incognito')) return 'Incógnito';
            if (p.includes('dashboard')) return 'Dashboard';
            if (p.includes('tr69')) return 'TR69';
            if (p.includes('schaman')) return 'Schaman';
            if (p.includes('plume')) return 'Plume';
            if (p.includes('sga')) return 'SGA';
            if (p.includes('plano') || p.includes('averia')) return 'Plano';
            if (p.includes('remoto') || p.includes('escritorio')) return 'Remoto';
            if (p.includes('livechat') || p.includes('chat')) return 'LiveChat';
            if (p.includes('ciclo') || p.includes('intento') || p.includes('buzon')) return 'Ciclo';
            if (p.includes('remedy')) return 'Remedy';
            if (p.includes('sot') || p.includes('migracion')) return 'SOT';
            if (p.includes('velocidad') || p.includes('tarjeta')) return 'Velocidad';
            if (p.includes('cable') || p.includes('cat5') || p.includes('cat6')) return 'Cable';
            if (p.includes('repetidor') || p.includes('mesh')) return 'Repetidor';
            if (p.includes('wifi') || p.includes('bandas') || p.includes('ssid') || p.includes('clave')) return 'Wi-Fi';
            if (p.includes('fisico') || p.includes('red') || p.includes('los')) return 'Físico';
            return '';
        };

        const highlightPhraseMatches = (phrase, query) => {
            if (!phrase || !query) return escapeHtml(phrase);
            const normP = normalize(phrase);
            const normQ = normalize(query);
            const words = normQ.split(/\s+/).filter(w => w.length >= 2);

            const intervals = [];
            words.forEach(w => {
                const aliases = KEYWORD_ALIASES[w] || [];
                const searchTerms = [w, ...aliases].filter(t => t.length >= 3 || t === 'tr');
                searchTerms.forEach(term => {
                    let start = 0;
                    while (start < normP.length) {
                        const idx = normP.indexOf(term, start);
                        if (idx === -1) break;
                        intervals.push([idx, idx + term.length]);
                        start = idx + term.length;
                    }
                });
            });

            if (intervals.length === 0) {
                return escapeHtml(phrase);
            }

            intervals.sort((a, b) => a[0] - b[0]);
            const merged = [];
            let cur = intervals[0];
            for (let i = 1; i < intervals.length; i++) {
                if (intervals[i][0] <= cur[1]) {
                    cur[1] = Math.max(cur[1], intervals[i][1]);
                } else {
                    merged.push(cur);
                    cur = intervals[i];
                }
            }
            merged.push(cur);

            let result = '';
            let lastIdx = 0;
            merged.forEach(([start, end]) => {
                if (start > lastIdx) {
                    result += escapeHtml(phrase.substring(lastIdx, start));
                }
                result += `<span class="predictive-item-match">${escapeHtml(phrase.substring(start, end))}</span>`;
                lastIdx = end;
            });
            if (lastIdx < phrase.length) {
                result += escapeHtml(phrase.substring(lastIdx));
            }
            return result;
        };

        function getMatches(category, query) {
            const normQ = normalize(query);
            if (!normQ || normQ.length < 2) return [];

            const queryWords = normQ.split(/\s+/).filter(w => w.length > 0);
            const expandedWords = queryWords.map(w => {
                const aliases = KEYWORD_ALIASES[w] || [];
                return [w, ...aliases];
            });

            const corpus = getAllCorpus(category);
            const scored = [];

            corpus.forEach(phrase => {
                const normP = normalize(phrase);
                let score = 0;

                // Exact phrase prefix
                if (normP.startsWith(normQ)) {
                    score += 150;
                } else if (normP.includes(normQ)) {
                    score += 70;
                }

                // Multi-word & alias checking
                const allWordsMatch = expandedWords.every(wordOptions => {
                    return wordOptions.some(w => {
                        if (w.length <= 3) {
                            const reg = new RegExp('\\b' + w, 'i');
                            return reg.test(normP);
                        } else {
                            return normP.includes(w);
                        }
                    });
                });

                if (allWordsMatch) {
                    score += 45;
                }

                // Word boundary bonus
                queryWords.forEach(w => {
                    const regex = new RegExp('\\b' + w, 'i');
                    if (regex.test(normP)) {
                        score += 20;
                    }
                });

                if (score > 0) {
                    scored.push({ phrase, score });
                }
            });

            scored.sort((a, b) => b.score - a.score || a.phrase.length - b.phrase.length);
            return scored.slice(0, 8).map(s => s.phrase);
        }

        function setupInputPredictor(inputEl, ghostEl, dropdownEl, category, isMultiline = false) {
            if (!inputEl || !ghostEl || !dropdownEl) return;

            let activeIndex = -1;
            let currentMatches = [];
            let currentGhostSuffix = '';

            const syncGhostStyles = () => {
                const computed = window.getComputedStyle(inputEl);
                ghostEl.style.fontSize = computed.fontSize;
                ghostEl.style.fontFamily = computed.fontFamily;
                ghostEl.style.fontWeight = computed.fontWeight;
                ghostEl.style.lineHeight = computed.lineHeight;
                ghostEl.style.letterSpacing = computed.letterSpacing;
                ghostEl.style.paddingTop = computed.paddingTop;
                ghostEl.style.paddingRight = computed.paddingRight;
                ghostEl.style.paddingBottom = computed.paddingBottom;
                ghostEl.style.paddingLeft = computed.paddingLeft;
                ghostEl.style.borderTopWidth = computed.borderTopWidth;
                ghostEl.style.borderRightWidth = computed.borderRightWidth;
                ghostEl.style.borderBottomWidth = computed.borderBottomWidth;
                ghostEl.style.borderLeftWidth = computed.borderLeftWidth;
                ghostEl.style.borderStyle = computed.borderStyle;
                ghostEl.style.boxSizing = computed.boxSizing;
                ghostEl.style.textAlign = computed.textAlign;
            };

            const syncScroll = () => {
                ghostEl.scrollTop = inputEl.scrollTop;
                ghostEl.scrollLeft = inputEl.scrollLeft;
            };

            inputEl.addEventListener('scroll', syncScroll);
            window.addEventListener('resize', syncGhostStyles);
            if (window.ResizeObserver) {
                new ResizeObserver(syncGhostStyles).observe(inputEl);
            }
            syncGhostStyles();

            const closeDropdown = () => {
                dropdownEl.classList.remove('is-open');
                dropdownEl.innerHTML = '';
                activeIndex = -1;
                currentMatches = [];
            };

            const clearGhost = () => {
                ghostEl.innerHTML = '';
                currentGhostSuffix = '';
            };

            // Segment boundary resolver supporting \n, commas (,), semicolons (;), pipes (|) and bullet symbols
            const getSegmentContext = () => {
                const val = inputEl.value || '';
                const cursor = (typeof inputEl.selectionStart === 'number') ? inputEl.selectionStart : val.length;
                const textBefore = val.substring(0, cursor);
                const textAfter = val.substring(cursor);

                // Search backwards for the nearest separator (\n, comma, semicolon, pipe)
                let lastSepIdx = -1;
                for (let i = textBefore.length - 1; i >= 0; i--) {
                    const ch = textBefore[i];
                    if (ch === '\n' || ch === ',' || ch === ';' || ch === '|') {
                        lastSepIdx = i;
                        break;
                    }
                }

                const beforeSegment = lastSepIdx === -1 ? '' : textBefore.substring(0, lastSepIdx + 1);
                const rawSegment = lastSepIdx === -1 ? textBefore : textBefore.substring(lastSepIdx + 1);

                // Detect leading whitespace or bullet marks (- , * , • )
                const matchLeading = rawSegment.match(/^([\s\-\*•\d.)]*)/);
                const leadingPrefix = matchLeading ? matchLeading[0] : '';
                const prefix = rawSegment.substring(leadingPrefix.length).trimStart();

                // Search forwards for next separator after cursor
                let nextSepIdx = -1;
                for (let i = 0; i < textAfter.length; i++) {
                    const ch = textAfter[i];
                    if (ch === '\n' || ch === ',' || ch === ';' || ch === '|') {
                        nextSepIdx = i;
                        break;
                    }
                }

                const afterSegment = nextSepIdx === -1 ? '' : textAfter.substring(nextSepIdx);

                return {
                    val,
                    cursor,
                    textBefore,
                    textAfter,
                    beforeSegment,
                    rawSegment,
                    leadingPrefix,
                    prefix,
                    afterSegment
                };
            };

            const renderDropdown = (matches, query) => {
                if (matches.length === 0) {
                    closeDropdown();
                    return;
                }
                currentMatches = matches;
                activeIndex = 0;

                dropdownEl.innerHTML = `
                    <div class="predictive-dropdown-header">
                        <span>⚡ Sugerencias Predictivas</span>
                        <span>Tab ↹ o Enter ↵</span>
                    </div>
                `;

                matches.forEach((phrase, idx) => {
                    const item = document.createElement('div');
                    item.className = `predictive-item ${idx === 0 ? 'is-selected' : ''}`;

                    const displayHtml = highlightPhraseMatches(phrase, query);
                    const tag = getPhraseTag(phrase);
                    const tagHtml = tag ? `<span class="predictive-item-tag">${escapeHtml(tag)}</span>` : '';

                    item.innerHTML = `
                        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:6px;">
                            ${tagHtml}
                            <span style="overflow:hidden; text-overflow:ellipsis;">${displayHtml}</span>
                        </div>
                        <span class="predictive-item-badge">${idx === 0 ? 'Tab ↹' : `↵`}</span>
                    `;

                    item.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        applySuggestion(phrase);
                    });

                    dropdownEl.appendChild(item);
                });

                dropdownEl.classList.add('is-open');
            };

            const updateSelection = () => {
                const items = dropdownEl.querySelectorAll('.predictive-item');
                items.forEach((it, idx) => {
                    if (idx === activeIndex) {
                        it.classList.add('is-selected');
                        it.scrollIntoView({ block: 'nearest' });
                    } else {
                        it.classList.remove('is-selected');
                    }
                });
            };

            const applySuggestion = (fullPhrase) => {
                if (!fullPhrase) return;

                const ctx = getSegmentContext();
                let leading = ctx.leadingPrefix;

                // If previous separator was a comma, semicolon or pipe and has no space, add a single clean space
                if (ctx.beforeSegment && /[,\;\|]$/.test(ctx.beforeSegment) && !leading) {
                    leading = ' ';
                }

                const newSegment = leading + fullPhrase;
                inputEl.value = ctx.beforeSegment + newSegment + ctx.afterSegment;

                const newCursorPos = ctx.beforeSegment.length + newSegment.length;
                inputEl.focus();
                inputEl.setSelectionRange(newCursorPos, newCursorPos);

                learnSinglePhrase(category, fullPhrase);
                clearGhost();
                closeDropdown();
                renderGeneratorPreviews();
            };

            const handleInputEvent = () => {
                syncGhostStyles();
                const ctx = getSegmentContext();
                const prefix = ctx.prefix;

                if (prefix.length < 2) {
                    clearGhost();
                    closeDropdown();
                    return;
                }

                const matches = getMatches(category, prefix);
                if (matches.length === 0) {
                    clearGhost();
                    closeDropdown();
                    return;
                }

                const topMatch = matches[0];
                const normTop = normalize(topMatch);
                const normPrefix = normalize(prefix);

                if (normTop.startsWith(normPrefix)) {
                    const matchedLen = prefix.length;
                    const suffix = topMatch.substring(matchedLen);
                    currentGhostSuffix = suffix;

                    const textBeforeGhost = ctx.textBefore;
                    ghostEl.innerHTML = `<span style="visibility:hidden;">${escapeHtml(textBeforeGhost)}</span><span>${escapeHtml(suffix)}</span>`;
                } else {
                    clearGhost();
                }

                renderDropdown(matches, prefix);
                syncScroll();
            };

            inputEl.addEventListener('input', handleInputEvent);

            inputEl.addEventListener('keydown', (e) => {
                const isOpen = dropdownEl.classList.contains('is-open');

                // Tab or ArrowRight to accept ghost text or top match
                if ((e.key === 'Tab' || (e.key === 'ArrowRight' && inputEl.selectionStart === inputEl.value.length)) && (currentGhostSuffix || (isOpen && currentMatches.length > 0))) {
                    e.preventDefault();
                    const targetPhrase = (activeIndex >= 0 && currentMatches[activeIndex]) ? currentMatches[activeIndex] : currentMatches[0];
                    if (targetPhrase) {
                        applySuggestion(targetPhrase);
                    }
                    return;
                }

                // Keyboard navigation in dropdown
                if (isOpen) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        activeIndex = (activeIndex + 1) % currentMatches.length;
                        updateSelection();
                        return;
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        activeIndex = (activeIndex - 1 + currentMatches.length) % currentMatches.length;
                        updateSelection();
                        return;
                    } else if (e.key === 'Enter') {
                        if (activeIndex >= 0 && currentMatches[activeIndex]) {
                            e.preventDefault();
                            applySuggestion(currentMatches[activeIndex]);
                            return;
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        closeDropdown();
                        clearGhost();
                        return;
                    }
                }
            });

            inputEl.addEventListener('blur', () => {
                setTimeout(() => {
                    closeDropdown();
                    clearGhost();
                }, 200);
            });

            inputEl.addEventListener('click', () => {
                syncScroll();
            });
        }

        // Initialize predictors for genSolucion and genDescartes
        setupInputPredictor(
            elements.genSolucion,
            document.getElementById('ghostGenSolucion'),
            document.getElementById('dropdownGenSolucion'),
            'soluciones',
            false
        );

        setupInputPredictor(
            elements.genDescartes,
            document.getElementById('ghostGenDescartes'),
            document.getElementById('dropdownGenDescartes'),
            'descartes',
            true
        );
    }

            window.learnSinglePhrase = learnSinglePhrase;
            window.initPredictiveTextEngine = initPredictiveTextEngine;
        }
    };
})();
