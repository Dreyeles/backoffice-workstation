/* ==========================================================================
   GLOBAL HITSS - BACK OFFICE PLANTILLEITOR SYSTEM APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Override hashtags to only keep #MANTENIMIENTO+CAMBIO A DOCSIS 3.1
    BO_DATASET.hashtags = [
        { tag: '#MANTENIMIENTO+CAMBIO A DOCSIS 3.1', description: 'Mantenimiento + Cambio a DOCSIS 3.1' }
    ];

    const state = {
        theme: localStorage.getItem('bo_theme') || 'dark',
        selectedHashtags: new Set(),
        selectedHashtags2: new Set(),
        customTemplates: JSON.parse(localStorage.getItem('bo_custom_templates') || '[]'),
        history: JSON.parse(localStorage.getItem('bo_history') || '[]'),
        activeTab: 'tab-generator',
        cicloOverride: null,
        callIds: new Set(),
        chatIds: new Set()
    };

    // Default sample custom template if empty
    if (state.customTemplates.length === 0) {
        state.customTemplates = [];
    }

    // Ensure WhatsApp default templates exist
    const whatsappTemplates = [
        {
            id: 'tmpl_wsp_1',
            title: 'CLIENTE CONTESTA WHATSAPP',
            category: 'WhatsApp',
            content: `¡Perfecto! 👍 Lo estaremos llamando en estos momentos 📞, por favor conteste la llamada. 😉✨`
        },
        {
            id: 'tmpl_wsp_2',
            title: 'CLIENTE NO CONTESTA LLAMADA',
            category: 'WhatsApp',
            content: `Estimado cliente 👋, estuvimos llamando a su número celular 📱, pero no tuvimos respuesta. Procedemos a finalizar esta conversación. Lo estaremos llamando en el transcurso del día o mañana. 🕒📞 ¡Que tenga un excelente día! 😊`
        }
    ];

    let templatesUpdated = false;

    // Remove legacy default templates if they exist
    const initialCount = state.customTemplates.length;
    state.customTemplates = state.customTemplates.filter(t => t.id !== 'tmpl_default_1' && t.id !== 'tmpl_default_2');
    if (state.customTemplates.length !== initialCount) {
        templatesUpdated = true;
    }

    whatsappTemplates.forEach(wspTmpl => {
        if (!state.customTemplates.find(t => t.id === wspTmpl.id)) {
            state.customTemplates.push(wspTmpl);
            templatesUpdated = true;
        }
    });

    if (templatesUpdated) {
        localStorage.setItem('bo_custom_templates', JSON.stringify(state.customTemplates));
    }

    // Apply Theme
    document.documentElement.setAttribute('data-theme', state.theme);

    // Initialize UI Component References
    const elements = {
        themeBtn: document.getElementById('themeToggleBtn'),
        
        // Generator Tab
        genServicio: document.getElementById('genServicio'),
        genProblema: document.getElementById('genProblema'),
        genTelefono: document.getElementById('genTelefono'),
        genSot: document.getElementById('genSot'),
        genContactId: document.getElementById('genContactId'),
        genSolucion: document.getElementById('genSolucion'),
        genSolucionDetalle: document.getElementById('genSolucionDetalle'),
        quickSolutionsContainer: document.getElementById('quickSolutionsContainer'),
        genDescartes: document.getElementById('genDescartes'),
        quickDescartesContainer: document.getElementById('quickDescartesContainer'),
        hashtagsContainer: document.getElementById('hashtagsContainer'),
        genCatResolucion: document.getElementById('genCatResolucion'),
        genCatCausa: document.getElementById('genCatCausa'),
        btnPredictCategory: document.getElementById('btnPredictCategory'),
        
        titleSiacCard: document.getElementById('titleSiacCard'),
        btnToggleCiclo: document.getElementById('btnToggleCiclo'),
        labelCicloToggle: document.getElementById('labelCicloToggle'),
        previewSiac: document.getElementById('previewSiac'),
        previewManto: document.getElementById('previewManto'),
        btnCopySiac: document.getElementById('btnCopySiac'),
        btnCopyManto: document.getElementById('btnCopyManto'),

        // Tracker Tab (Ayuda y Seguimiento)
        trackerCaseInput: document.getElementById('trackerCaseInput'),
        btnTrackerAdd: document.getElementById('btnTrackerAdd'),
        trackerTimeline: document.getElementById('trackerTimeline'),
        btnClearTracker: document.getElementById('btnClearTracker'),
        trackerCount: document.getElementById('trackerCount'),
        navTrackerCount: document.getElementById('navTrackerCount'),

        // Custom Templates Tab
        customTemplatesList: document.getElementById('customTemplatesList'),
        customSearch: document.getElementById('customSearch'),
        btnNewTemplate: document.getElementById('btnNewTemplate'),
        templateModal: document.getElementById('templateModal'),
        modalClose: document.getElementById('modalClose'),
        modalCancel: document.getElementById('modalCancel'),
        modalSave: document.getElementById('modalSave'),
        modalTitle: document.getElementById('modalTitle'),
        templateIdInput: document.getElementById('templateIdInput'),
        tmplTitleInput: document.getElementById('tmplTitleInput'),
        tmplCategoryInput: document.getElementById('tmplCategoryInput'),
        tmplContentInput: document.getElementById('tmplContentInput'),
        customFillContainer: document.getElementById('customFillContainer'),
        previewCustom: document.getElementById('previewCustom'),
        btnCopyCustom: document.getElementById('btnCopyCustom'),

        // History & Backup Tab
        historyTableBody: document.getElementById('historyTableBody'),
        btnClearHistory: document.getElementById('btnClearHistory'),
        btnExportJson: document.getElementById('btnExportJson'),
        importJsonInput: document.getElementById('importJsonInput'),

        // Incognito / Hygeia Validator (HFC / FTTH)
        btnTechHfc: document.getElementById('btnTechHfc'),
        btnTechFtth: document.getElementById('btnTechFtth'),
        hygeiaHfcPanel: document.getElementById('hygeiaHfcPanel'),
        hygeiaFtthPanel: document.getElementById('hygeiaFtthPanel'),
        btnClearHygeia: document.getElementById('btnClearHygeia'),
        incInputDwsPot: document.getElementById('incInputDwsPot'),
        incInputUsPot: document.getElementById('incInputUsPot'),
        incInputDwsSnr: document.getElementById('incInputDwsSnr'),
        incInputUsSnr: document.getElementById('incInputUsSnr'),
        incognitoResults: document.getElementById('incognitoResults'),
        incResultDwsSnr: document.getElementById('incResultDwsSnr'),
        incResultDwsPot: document.getElementById('incResultDwsPot'),
        incResultUsSnr: document.getElementById('incResultUsSnr'),
        incResultUsPot: document.getElementById('incResultUsPot'),
        ftthInputTx: document.getElementById('ftthInputTx'),
        ftthInputRx: document.getElementById('ftthInputRx'),
        ftthResultTx: document.getElementById('ftthResultTx'),
        ftthResultRx: document.getElementById('ftthResultRx'),

        // Equipment Identifier
        eqSearchInput: document.getElementById('eqSearchInput'),
        eqResultContainer: document.getElementById('eqResultContainer'),
        eqImage: document.getElementById('eqImage'),
        eqImagePlaceholder: document.getElementById('eqImagePlaceholder'),
        eqName: document.getElementById('eqName'),
        eqType: document.getElementById('eqType'),
        eqStatus: document.getElementById('eqStatus'),
        eqCredentials: document.getElementById('eqCredentials'),

        // Toast Container
        toastContainer: document.getElementById('toastContainer')
    };

    // Theme Toggle
    elements.themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('bo_theme', state.theme);
        elements.themeBtn.innerHTML = state.theme === 'dark' ? '🌙' : '☀️';
    });
    elements.themeBtn.innerHTML = state.theme === 'dark' ? '🌙' : '☀️';

    // Navigation Tabs Toggle
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
            state.activeTab = targetId;

            if (targetId === 'tab-custom') renderCustomTemplates();
            if (targetId === 'tab-history') renderHistoryTable();
        });
    });

    // ==========================================================================
    // TAB 1: GENERADOR RÁPIDO (PLANTILLEITOR)
    // ==========================================================================

    function initGeneratorTab() {
        // 1. Populate Problems based on initial Service
        populateProblems(elements.genServicio.value);
        elements.genServicio.addEventListener('change', (e) => {
            populateProblems(e.target.value);
            renderGeneratorPreviews();
        });

        // 2. Event Listener for Solución
        if (elements.genSolucion) {
            elements.genSolucion.addEventListener('input', renderGeneratorPreviews);
            elements.genSolucion.addEventListener('change', renderGeneratorPreviews);
        }

        // 3. Render Quick Descartes Chips
        renderQuickDescartes();

        // 4. Render Hashtags Chips
        renderHashtagChips();

        // 5. Input change listeners
        [
            elements.genProblema, elements.genTelefono, elements.genSot,
            elements.genDescartes, elements.genCatResolucion,
            elements.genCatCausa
        ].forEach(input => {
            if (input) {
                input.addEventListener('input', renderGeneratorPreviews);
                input.addEventListener('change', renderGeneratorPreviews);
            }
        });

        // Gestión Inteligente de ID Llamada y Chat ID (Pegar continuo sin borrar)
        if (elements.genContactId) {
            elements.genContactId.addEventListener('focus', () => {
                elements.genContactId.select();
            });

            elements.genContactId.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
                if (!pastedText) return;

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

        // Interceptar 'Pegar' (Ctrl+V) en Descartes para guardar capturas de pantalla
        if (elements.genDescartes) {
            elements.genDescartes.addEventListener('paste', (e) => {
                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
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
                        
                        if (typeof showToast === 'function') {
                            showToast(`📷 Captura guardada: ${fileName}`);
                        }
                        
                        e.preventDefault(); // Evita que pegue texto raro en la caja
                    }
                }
            });
        }

        // 6. Custom Select Dropdown Logic for Problema Detectado
        const problemaTrigger = document.getElementById('genProblemaTrigger');
        const problemaDropdown = document.getElementById('problemaDropdown');
        const problemaSearch = document.getElementById('genProblemaSearch');

        let currentFocus = -1;

        if (problemaTrigger) {
            problemaTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = problemaDropdown.classList.contains('open');
                if (!isOpen) {
                    problemaDropdown.classList.add('open');
                    problemaSearch.value = '';
                    renderProblemOptions(currentProblemList);
                    currentFocus = -1;
                    problemaSearch.focus();
                } else {
                    problemaDropdown.classList.remove('open');
                }
            });
        }

        if (problemaSearch) {
            problemaSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = currentProblemList.filter(p => p.toLowerCase().includes(query));
                renderProblemOptions(filtered);
                currentFocus = -1;
            });
            problemaSearch.addEventListener('click', (e) => e.stopPropagation());
            problemaSearch.addEventListener('keydown', (e) => {
                const options = document.getElementById('genProblemaOptions').getElementsByClassName('custom-option');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    currentFocus++;
                    addActive(options);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    currentFocus--;
                    addActive(options);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentFocus > -1) {
                        if (options) options[currentFocus].click();
                    }
                }
            });

            function addActive(options) {
                if (!options) return false;
                removeActive(options);
                if (currentFocus >= options.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = (options.length - 1);
                options[currentFocus].classList.add('active');
                options[currentFocus].scrollIntoView({ block: 'nearest' });
            }
            function removeActive(options) {
                for (let i = 0; i < options.length; i++) {
                    options[i].classList.remove('active');
                }
            }
        }

        document.addEventListener('click', (e) => {
            if (problemaDropdown && problemaDropdown.classList.contains('open')) {
                problemaDropdown.classList.remove('open');
            }
        });

        renderGeneratorPreviews();

        // Clear button for Case 1
        document.getElementById('btnClearForm').addEventListener('click', () => {
            elements.genTelefono.value = '';
            elements.genSot.value = '';
            elements.genContactId.value = '';
            elements.genSolucion.value = '';
            elements.genDescartes.value = '';
            if (elements.genCatResolucion) elements.genCatResolucion.value = '';
            if (elements.genCatCausa) elements.genCatCausa.value = '';
            // Reset service to INTERNET and repopulate problems
            elements.genServicio.value = 'INTERNET';
            populateProblems('INTERNET');
            // Clear hashtags
            state.selectedHashtags.clear();
            renderHashtagChips();
            // Clear quick descartes
            if (state.selectedDescartes) state.selectedDescartes.clear();
            renderQuickDescartes();
            
            // Reset ciclo override & contact IDs
            state.cicloOverride = null;
            state.callIds.clear();
            state.chatIds.clear();

            renderGeneratorPreviews();
            showToast('Campos del Caso 1 limpiados');
        });

        // Autocompletar Categoría Logic
        if (elements.btnPredictCategory) {
            elements.btnPredictCategory.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                const descartes = (elements.genDescartes.value || '').toUpperCase();
                const sot = (elements.genSot.value || '').trim();
                const solucion = (elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value.toUpperCase() : '';
                
                let predictedCategory = '';

                // Prioridad Alta: Remedy
                if (descartes.includes('REMEDY')) {
                    predictedCategory = 'BO.TEC SOLUCIONADO > REMEDY > NO ACCEDE A PAGINA WEB';
                }
                // Regla 1: No contesta
                else if (descartes.includes('CLIENTE NO CONTESTA') || descartes.includes('BUZON')) {
                    predictedCategory = 'BO.TEC NO CONTESTA > NO CONTESTA > NUNCA RESPONDIO';
                }
                // Regla 2: SOT Generada
                else if (sot !== '') {
                    if (descartes.includes('A SOLICITUD')) {
                        predictedCategory = 'BO.TEC SOT GENERADA > A SOLICITUD > USO DE SERVICIO';
                    } else if (descartes.includes('SIN DESCARTES') || descartes.length <= 20) {
                        predictedCategory = 'BO.TEC SOT GENERADA > A SOLICITUD > SIN DESCARTES';
                    } else {
                        // Falla física asumiendo que sí hubo descartes y no fue a solicitud
                        predictedCategory = 'BO.TEC SOT GENERADA > EQUIPOS CLARO > EQUIPO/CABLEADO AVERIADO';
                    }
                }
                // Regla 3: Solucionado en línea / Provisión
                else if (solucion !== '') {
                     if (descartes.includes('PROVISIÓN') || descartes.includes('INCÓGNITO')) {
                         predictedCategory = 'BO.TEC SOLUCIONADO > PROVISIÓN > INCOGNITO-EQUIPOS';
                     } else {
                         predictedCategory = 'BO.TEC SOLUCIONADO > EQUIPOS CLARO > REINICIO DE FABRICA';
                     }
                }
                // Default fallback
                else {
                    predictedCategory = 'BO.TEC NO CONFIRMADO > OK EN SISTEMAS > NO QUIERE DESCARTES';
                }

                if (elements.genCatResolucion) {
                    elements.genCatResolucion.value = predictedCategory;
                    renderGeneratorPreviews();
                    showToast('Categoría autocompletada (Fase BETA)', 'info');
                }

                // Mostrar globo informativo BETA
                const betaInfoPopover = document.getElementById('betaInfoPopover');
                if (betaInfoPopover) {
                    betaInfoPopover.classList.add('active');
                }
            });
        }
    }

    function renderQuickSolutions() {
        if (!elements.quickSolutionsContainer) return;
        const quickSols = [
            { label: "📊 Consumo Tracer", text: "Se valida consumo en Tracer" },
            { label: "🌐 Provisión e Incógnito", text: "Se valida provisión y online en Incógnito" },
            { label: "📈 Dashboard OK", text: "Se valida Dashboard OK" },
            { label: "🔌 TR69 Todo OK", text: "Se valida TR69 todo OK" },
            { label: "⚙️ Schaman OK", text: "Se valida Schaman OK" }
        ];

        elements.quickSolutionsContainer.innerHTML = '';
        quickSols.forEach(item => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.textContent = item.label;
            chip.title = item.text;
            chip.addEventListener('click', () => {
                const current = elements.genSolucionDetalle ? elements.genSolucionDetalle.value.trim() : '';
                if (elements.genSolucionDetalle) {
                    elements.genSolucionDetalle.value = current ? `${current}. ${item.text}` : item.text;
                }
                renderGeneratorPreviews();
                showToast('Atajo de solución agregado');
            });
            elements.quickSolutionsContainer.appendChild(chip);
        });
    }

    let currentProblemList = [];
    
    function setProblemValue(val) {
        if (elements.genProblema) {
            elements.genProblema.value = val;
            elements.genProblema.dispatchEvent(new Event('input'));
        }
        const trigger = document.getElementById('genProblemaTrigger');
        if (trigger) trigger.textContent = val || 'Seleccionar problema...';
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
                document.getElementById('problemaDropdown').classList.remove('open');
            });
            container.appendChild(div);
        });
    }

    function populateProblems(serviceKey) {
        currentProblemList = BO_DATASET.problemsByService[serviceKey] || [];
        renderProblemOptions(currentProblemList);
        
        if (currentProblemList.length > 0) {
            setProblemValue(currentProblemList[0]);
        } else {
            setProblemValue('');
        }
    }

    function renderQuickDescartes() {
        if (!elements.quickDescartesContainer) return;
        const quickDescartesList = [
            { label: "Consumo Tracer",       states: ["SE VALIDA CONSUMO EN TRACER", "SIN CONSUMO EN TRACER"] },
            { label: "Provisión e Incógnito", states: ["SE VALIDA PROVISIÓN Y ONLINE EN INCÓGNITO", "SIN PROVISIÓN / NO CARGA EN INCÓGNITO"] },
            { label: "Dashboard OK",          states: ["SE VALIDA DASHBOARD OK", "DASHBOARD CON AVERÍA"] },
            { label: "TR69 Todo OK",           states: ["SE VALIDA TR69 TODO OK", "TR69 CON ERRORES"] },
            { label: "Schaman OK",             states: ["SE VALIDA SCHAMAN OK", "SCHAMAN CON AVERÍA"] },
            { label: "Plume",                  states: ["SE VALIDA CLIENTE PLUME", "SE VALIDA CLIENTE PLUME DESALINEADO CON ALERTAS"] },
            { label: "Escritorio Remoto",      states: ["SE HACE REINICIO DE FABRICA DESDE ESCRITORIO REMOTO", "SIN ACCESO AL ESCRITORIO REMOTO"] },
            { label: "SGA OK",                 states: ["SE VALIDA DATOS DE SOT E HISTORIAL EN SGA", "SE VALIDA PROVISION INCORRECTA EN SGA"] },
            { label: "SGA SOT",                states: ["SE VALIDA DATOS DE SOT E HISTORIAL OK", "SE VALIDA SIN SOT Y SIN NOTAS EN SGA"] },
            { label: "Ciclo de Llamada",       states: ["CLIENTE NO CONTESTA, SE ENVIA MENSAJE POR LIVE CHAT Y SE DEJA MENSAJE EN BUZON DE VOZ, SE GENERA CICLO"], icon: '📞 ' }
        ];

        if (!state.selectedDescartes) state.selectedDescartes = new Map();

        if (!elements.genDescartes.dataset.syncBound) {
            elements.genDescartes.addEventListener('input', () => {
                const currentText = elements.genDescartes.value;
                let changed = false;
                quickDescartesList.forEach(item => {
                    const curState = state.selectedDescartes.get(item.label) || 0;
                    if (curState > 0) {
                        const expectedText = item.states[curState - 1];
                        if (!currentText.includes(expectedText)) {
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
                chip.title = s > 0 ? item.states[s - 1] : item.states[0];
                chip.addEventListener('click', () => {
                    const cur = state.selectedDescartes.get(item.label) || 0;
                    const next = (cur + 1) % (item.states.length + 1);
                    
                    let currentVal = elements.genDescartes.value;
                    if (cur > 0) {
                        const toRemove = item.states[cur - 1];
                        currentVal = currentVal.replace(new RegExp(`, \\b${toRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), '');
                        currentVal = currentVal.replace(new RegExp(`\\b${toRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b, ?`, 'g'), '');
                        currentVal = currentVal.replace(new RegExp(`\\b${toRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), '');
                    }
                    
                    currentVal = currentVal.trim();
                    if (next > 0) {
                        const toAdd = item.states[next - 1];
                        currentVal = currentVal ? `${currentVal}, ${toAdd}` : toAdd;
                    }
                    
                    currentVal = currentVal.replace(/,+/g, ',').replace(/, ,/g, ',').replace(/^, /, '').trim();
                    elements.genDescartes.value = currentVal;
                    
                    state.selectedDescartes.set(item.label, next);
                    renderGeneratorPreviews();
                    rebuild();
                });
                elements.quickDescartesContainer.appendChild(chip);
            });
        }
        rebuild();
    }

    function renderHashtagChips() {
        elements.hashtagsContainer.innerHTML = '';
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
            if (remainder && remainder.length >= 4) {
                const cleanCall = remainder.replace(/^ID\s*(LLAMADA)?\s*[:=-]?\s*/i, '').trim();
                if (cleanCall) state.callIds.add(cleanCall);
            }
            showToast(`💬 Chat ID sumado (${state.chatIds.size}): ${uuidMatches.join(' / ')}`, 'info');
            return;
        }

        // 2. Si contiene palabras explícitas de Chat
        if (/CHAT/i.test(raw)) {
            const cleanChat = raw.replace(/^CHAT\s*(ID)?\s*[:=-]?\s*/i, '').trim();
            if (cleanChat) {
                state.chatIds.add(cleanChat);
                showToast(`💬 Chat ID sumado: ${cleanChat}`, 'info');
            }
            return;
        }

        // 3. De lo contrario, se guarda como ID de Llamada
        const cleanCall = raw.replace(/^ID\s*(LLAMADA)?\s*[:=-]?\s*/i, '').trim();
        if (cleanCall) {
            state.callIds.add(cleanCall);
            showToast(`📞 ID Llamada sumado: ${cleanCall}`, 'info');
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

    function getFormattedContactLines() {
        const lines = [];
        if (state.callIds.size > 0) {
            lines.push(`ID LLAMADA: ${Array.from(state.callIds).join(' / ').toUpperCase()}`);
        }
        if (state.chatIds.size > 0) {
            lines.push(`CHAT ID: ${Array.from(state.chatIds).join(' / ').toUpperCase()}`);
        }
        if (lines.length === 0) {
            return 'ID LLAMADA: N/A';
        }
        return lines.join('\n');
    }

    function renderGeneratorPreviews() {
        const servicio = (elements.genServicio.value || 'INTERNET').toUpperCase();
        const problema = (elements.genProblema.value || 'INT - BAJA VELOCIDAD VIA CABLEADO').toUpperCase();
        const telefono = (elements.genTelefono.value || 'N/A').toUpperCase();
        const sot = (elements.genSot.value || 'N/A').toUpperCase();
        
        const solucion = ((elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value : 'N/A').toUpperCase();
        const descartes = (elements.genDescartes.value || 'SE REALIZAN DESCARTES DE PROTOCOLO').toUpperCase();
        const tagsStr = state.selectedHashtags.size > 0 ? Array.from(state.selectedHashtags).join(' ').toUpperCase() : 'N/A';

        const contactLines = getFormattedContactLines();

        const isAutoCiclo = checkIsCiclo(descartes);
        const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;

        // Actualizar UI del Switch / Badge de Ciclo
        if (elements.btnToggleCiclo && elements.labelCicloToggle) {
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

        if (elements.titleSiacCard) {
            elements.titleSiacCard.innerHTML = isCiclo 
                ? 'Plantilla SIAC / SGA <span style="font-size:0.75rem; color:#00ACC1; font-weight:bold; margin-left:0.3rem;">(📞 Ciclo de Llamada)</span>' 
                : 'Plantilla SIAC / Helix';
        }

        if (elements.previewSiac) {
            if (isCiclo) {
                elements.previewSiac.classList.add('ciclo-mode');
            } else {
                elements.previewSiac.classList.remove('ciclo-mode');
            }
        }

        const sotRaw = (elements.genSot.value || '').trim();
        const sotSiacLine = sotRaw ? `\nSOT / REMEDY: ${sotRaw.toUpperCase()}` : '';

        // Template SIAC (Standard or Ciclo de Llamada)
        let siacText = '';
        if (isCiclo) {
            siacText = `BACKOFFICE HITSS - CICLO DE LLAMADA
TELEFONO: ${telefono}
DESCARTES REALIZADOS: ${descartes}${sotSiacLine}
${contactLines}`.toUpperCase();
        } else {
            siacText = `BACKOFFICE HITSS
TELEFONO: ${telefono}
PROBLEMA DETECTADO: ${servicio} - ${problema}
DESCARTES REALIZADOS: ${descartes}
SOLUCION: ${solucion}${sotSiacLine}
${contactLines}`.toUpperCase();
        }

        // Template Mantenimiento (MANTO)
        const mantoText = `BACKOFFICE HITSS
TELEFONO: ${telefono}
PROBLEMA DETECTADO: ${servicio} - ${problema}
DESCARTES REALIZADOS: ${descartes}
SOLUCION: ${solucion}
SOT / REMEDY: ${sot}
${contactLines}
HASHTAGS: ${tagsStr}`.toUpperCase();

        if (elements.previewSiac) elements.previewSiac.textContent = siacText;
        if (elements.previewManto) elements.previewManto.textContent = mantoText;
    }

    // Toggle manual para Modo Ciclo
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

    // Copy Buttons for Generator
    if (elements.btnCopySiac) {
        elements.btnCopySiac.addEventListener('click', () => {
            const isAutoCiclo = checkIsCiclo(elements.genDescartes.value || '');
            const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;
            const msg = isCiclo ? 'Plantilla Ciclo de Llamada copiada' : 'Plantilla SIAC/SGA copiada';
            const logType = isCiclo ? 'Generador Ciclo' : 'Generador SIAC';

            copyToClipboard(elements.previewSiac.textContent, msg);
            addHistoryRecord(logType, elements.genServicio.value, elements.previewSiac.textContent);
        });
    }

    if (elements.btnCopyManto) {
        elements.btnCopyManto.addEventListener('click', () => {
            copyToClipboard(elements.previewManto.textContent, 'Plantilla Mantenimiento copiada');
            addHistoryRecord('Generador Manto', elements.genServicio.value, elements.previewManto.textContent);
        });
    }



    // ==========================================================================
    // TAB 2: FORMULARIO SIAC OFICIAL
    // ==========================================================================

    // ==========================================================================
    // TAB 2: AYUDA Y SEGUIMIENTO (TRACKER)
    // ==========================================================================

    let dailyCases = JSON.parse(localStorage.getItem('bo_daily_tracker') || '[]');

    function renderTrackerTimeline() {
        if (!elements.trackerTimeline) return;
        elements.trackerTimeline.innerHTML = '';
        
        if (elements.trackerCount) {
            elements.trackerCount.textContent = dailyCases.length;
        }
        if (elements.navTrackerCount) {
            elements.navTrackerCount.textContent = dailyCases.length;
        }

        if (dailyCases.length === 0) {
            elements.trackerTimeline.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem; padding: 1rem;">No hay casos registrados hoy.</div>';
            return;
        }

        // Group by hour
        const grouped = {};
        dailyCases.forEach(c => {
            if (!grouped[c.hourStr]) grouped[c.hourStr] = [];
            grouped[c.hourStr].push(c);
        });

        // Sort hours descending by numeric value of hour (assuming 12h format PM > AM)
        const sortedHours = Object.keys(grouped).sort((a, b) => {
            const getVal = (timeStr) => {
                let [h, ampm] = timeStr.split(' ');
                h = parseInt(h);
                if (h === 12 && ampm === 'AM') h = 0;
                else if (ampm === 'PM' && h < 12) h += 12;
                return h;
            };
            return getVal(b) - getVal(a);
        });

        sortedHours.forEach(hour => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'timeline-group';
            
            const hourLabel = document.createElement('div');
            hourLabel.className = 'timeline-hour';
            hourLabel.textContent = hour;
            groupDiv.appendChild(hourLabel);
            
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'timeline-items';
            
            // Sort cases within the hour by time descending
            const cases = grouped[hour].sort((a, b) => b.timestamp - a.timestamp);
            
            cases.forEach(c => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.innerHTML = `
                    <span>${c.caseCode}</span>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span class="timeline-item-time" style="font-size:0.8rem; color:var(--text-muted);">${c.time}</span>
                        <button class="btn btn-sm del-case-btn" style="color:var(--danger); padding:0 0.4rem; border:none; background:transparent; font-size:0.8rem; cursor:pointer;" title="Eliminar caso">✕</button>
                    </div>
                `;
                item.querySelector('.del-case-btn').addEventListener('click', () => {
                    dailyCases = dailyCases.filter(dc => dc.timestamp !== c.timestamp);
                    localStorage.setItem('bo_daily_tracker', JSON.stringify(dailyCases));
                    renderTrackerTimeline();
                    showToast('Caso eliminado');
                });
                itemsDiv.appendChild(item);
            });
            
            groupDiv.appendChild(itemsDiv);
            elements.trackerTimeline.appendChild(groupDiv);
        });
    }

    function initTrackerTab() {
        if (!elements.btnTrackerAdd) return;

        // Validación de solo números
        elements.trackerCaseInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Add Case
        elements.btnTrackerAdd.addEventListener('click', () => {
            const code = elements.trackerCaseInput.value.trim();
            if (!code) {
                showToast('Ingresa un código de caso válido');
                return;
            }
            
            const now = new Date();
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const hourStr = `${hours} ${ampm}`;
            
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            dailyCases.unshift({
                caseCode: code.toUpperCase(),
                hourStr: hourStr,
                time: timeStr,
                timestamp: now.getTime()
            });
            
            localStorage.setItem('bo_daily_tracker', JSON.stringify(dailyCases));
            elements.trackerCaseInput.value = '';
            renderTrackerTimeline();
            showToast('Caso registrado');
        });

        // Allow Enter key
        elements.trackerCaseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.btnTrackerAdd.click();
            }
        });

        // Clear Tracker
        elements.btnClearTracker.addEventListener('click', () => {
            if (confirm('¿Estás seguro de limpiar todos los casos de hoy?')) {
                dailyCases = [];
                localStorage.removeItem('bo_daily_tracker');
                renderTrackerTimeline();
                showToast('Registro diario limpiado');
            }
        });

        // Init Speech Buttons
        document.querySelectorAll('.copy-speech-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speechCard = e.target.closest('.speech-card');
                const text = speechCard.querySelector('.speech-text').textContent;
                copyToClipboard(text, 'Speech copiado');
            });
        });

        // Incognito Validator Logic
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

            const validate = (values, min, max, unit = 'dB', checkVariation = false) => {
                if (!values || values.length === 0) return { status: 'UNKNOWN', text: 'Esperando datos...' };
                let outOfRange = false;
                for (let v of values) {
                    if (v < min || (max !== null && v > max)) {
                        outOfRange = true;
                        break;
                    }
                }
                const displayVals = values.length > 5 ? values.slice(0, 5).join(', ') + '...' : values.join(', ');

                // Variación de niveles en el bloque (Máx - Mín <= 4)
                if (checkVariation && values.length > 1) {
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const delta = +(maxVal - minVal).toFixed(2);
                    const deltaExceeded = delta > 4.0;

                    if (outOfRange) {
                        if (deltaExceeded) {
                            return { 
                                status: 'ERROR', 
                                text: `Fuera de Rango y Variación Excesiva (Δ: ${delta} ${unit} [Máx: ${maxVal}, Mín: ${minVal}] > 4.0 ${unit})` 
                            };
                        }
                        return { 
                            status: 'ERROR', 
                            text: `Fuera de Rango (${displayVals} ${unit}) [Δ: ${delta} ${unit}]` 
                        };
                    }

                    if (deltaExceeded) {
                        return { 
                            status: 'ERROR', 
                            text: `⚠️ Variación Excesiva en Bloque: Δ ${delta} ${unit} (Máx: ${maxVal}, Mín: ${minVal} - Supera límite de 4.0 ${unit})` 
                        };
                    }

                    return { 
                        status: 'OK', 
                        text: `Dentro del Rango (${displayVals} ${unit})` 
                    };
                }

                if (outOfRange) {
                    return { status: 'ERROR', text: `Fuera de Rango (${displayVals} ${unit})` };
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

            const dsSnrRes = validate(dsSnr, 33.5, null, 'dB', true);
            const dsPotRes = validate(dsPot, -15, 20.9, 'dBmV', true);
            const usSnrRes = validate(usSnr, 28, null, 'dB', false);
            const usPotRes = validate(usPot, 35, 57, 'dBmV', false);

            setVisuals(elements.incResultUsSnr, usSnrRes, 'U/S SNR');
            setVisuals(elements.incResultDwsSnr, dsSnrRes, 'D/S SNR');
            setVisuals(elements.incResultDwsPot, dsPotRes, 'Potencia Downstream');
            setVisuals(elements.incResultUsPot, usPotRes, 'Potencia Upstream');
        };

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

        // Equipment Identifier Logic
        if (elements.eqSearchInput) {
            elements.eqSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toUpperCase();
                
                if (query.length < 2) {
                    elements.eqResultContainer.style.display = 'none';
                    return;
                }

                // Mostrar aviso flotante BETA
                const betaEquiposPopover = document.getElementById('betaEquiposPopover');
                if (betaEquiposPopover) {
                    betaEquiposPopover.classList.add('active');
                }

                // Search in dataset (equiposClaro)
                if (typeof equiposClaro !== 'undefined') {
                    const result = equiposClaro.find(eq => 
                        eq.codigo.toUpperCase().includes(query) || 
                        eq.nombre.toUpperCase().includes(query)
                    );

                    if (result) {
                        elements.eqResultContainer.style.display = 'block';
                        elements.eqName.textContent = result.nombre;
                        elements.eqType.textContent = result.tipo;
                        
                        if (result.homologado) {
                            elements.eqStatus.textContent = "Homologado por Claro";
                            elements.eqStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
                            elements.eqStatus.style.color = '#28a745';
                        } else {
                            elements.eqStatus.textContent = "No Homologado";
                            elements.eqStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                            elements.eqStatus.style.color = '#dc3545';
                        }

                        // Handle credentials
                        if (result.credenciales) {
                            elements.eqCredentials.innerHTML = result.credenciales.replace(/\|/g, '<br>');
                            elements.eqCredentials.style.display = 'block';
                        } else {
                            elements.eqCredentials.style.display = 'none';
                        }

                        // Handle image
                        elements.eqImage.src = result.imagen;
                        elements.eqImage.style.display = 'block';
                        elements.eqImagePlaceholder.style.display = 'none';

                        // Fallback if image fails to load
                        elements.eqImage.onerror = () => {
                            elements.eqImage.style.display = 'none';
                            elements.eqImagePlaceholder.style.display = 'block';
                            elements.eqImagePlaceholder.textContent = 'Falta imagen en carpeta';
                        };
                    } else {
                        elements.eqResultContainer.style.display = 'block';
                        elements.eqName.textContent = "Equipo no encontrado";
                        elements.eqType.textContent = "Asegúrate de escribir bien el modelo";
                        elements.eqStatus.textContent = "Desconocido";
                        elements.eqStatus.style.backgroundColor = 'transparent';
                        elements.eqStatus.style.color = 'var(--text-muted)';
                        
                        elements.eqImage.style.display = 'none';
                        elements.eqImagePlaceholder.style.display = 'block';
                        elements.eqImagePlaceholder.textContent = 'Sin imagen';
                    }
                }
            });
        }

        renderTrackerTimeline();
    }

    // ==========================================================================
    // TAB 3: MIS PLANTILLAS PERSONALIZADAS
    // ==========================================================================

    function renderCustomTemplates() {
        const query = elements.customSearch.value.toLowerCase().trim();
        elements.customTemplatesList.innerHTML = '';

        const filtered = state.customTemplates.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.category.toLowerCase().includes(query) ||
            t.content.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            elements.customTemplatesList.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem;">No se encontraron plantillas. ¡Crea una nueva!</div>';
            return;
        }

        filtered.forEach(tmpl => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-card-header">
                    <div>
                        <div class="template-card-title">${tmpl.title}</div>
                        <span class="badge badge-info" style="margin-top:0.3rem;">${tmpl.category}</span>
                    </div>
                    <div style="display:flex; gap:0.3rem;">
                        <button class="btn btn-sm edit-tmpl-btn" data-id="${tmpl.id}" title="Editar plantilla">✏️</button>
                        <button class="btn btn-sm del-tmpl-btn" data-id="${tmpl.id}" style="color:var(--danger);" title="Eliminar plantilla">🗑️</button>
                    </div>
                </div>
                <div class="template-card-preview">${tmpl.content}</div>
                <button class="btn btn-sm btn-primary copy-tmpl-btn" data-id="${tmpl.id}" style="margin-top:0.5rem; width:100%;">📋 Copiar Plantilla</button>
            `;

            // Edit Event
            card.querySelector('.edit-tmpl-btn').addEventListener('click', () => openTemplateModal(tmpl.id));
            // Delete Event
            card.querySelector('.del-tmpl-btn').addEventListener('click', () => deleteTemplate(tmpl.id));
            // Direct 1-Click Copy Event
            card.querySelector('.copy-tmpl-btn').addEventListener('click', () => {
                copyToClipboard(tmpl.content, `Plantilla "${tmpl.title}" copiada`);
                addHistoryRecord('Personalizada', tmpl.category || 'Plantilla', tmpl.content);
            });

            elements.customTemplatesList.appendChild(card);
        });
    }

    elements.customSearch.addEventListener('input', renderCustomTemplates);

    // Modal controls
    elements.btnNewTemplate.addEventListener('click', () => openTemplateModal());
        if (elements.modalClose) elements.modalClose.addEventListener('click', closeModal);
        if (elements.modalCancel) elements.modalCancel.addEventListener('click', closeModal);

        // Setup Changelog Modal
        const btnChangelog = document.getElementById('btnChangelog');
        const changelogModal = document.getElementById('changelogModal');
        const changelogModalClose = document.getElementById('changelogModalClose');
        
        if (btnChangelog && changelogModal) {
            btnChangelog.addEventListener('click', () => {
                changelogModal.classList.add('active');
            });
        }
        if (changelogModalClose && changelogModal) {
            changelogModalClose.addEventListener('click', () => {
                changelogModal.classList.remove('active');
            });
        }

        // Setup Remedy Modal & Logic
        const btnOpenRemedyModal = document.getElementById('btnOpenRemedyModal');
        const remedyModal = document.getElementById('remedyModal');
        const remedyModalClose = document.getElementById('remedyModalClose');
        const remedyModalCancel = document.getElementById('remedyModalCancel');
        const remedyInputFalla = document.getElementById('remedyInputFalla');
        const remedyInputId = document.getElementById('remedyInputId');
        const remedyInputDni = document.getElementById('remedyInputDni');
        const remedyInputCliente = document.getElementById('remedyInputCliente');
        const remedyInputDetalle = document.getElementById('remedyInputDetalle');
        const remedyDropZone = document.getElementById('remedyDropZone');
        const remedyImagesContainer = document.getElementById('remedyImagesContainer');
        const btnClearRemedyImages = document.getElementById('btnClearRemedyImages');
        const remedyPreviewBox = document.getElementById('remedyPreviewBox');
        const btnCopyRemedyWord = document.getElementById('btnCopyRemedyWord');
        const btnCopyRemedyText = document.getElementById('btnCopyRemedyText');

        let remedyImagesList = [];

        const getRemedyPlainText = () => {
            const falla = remedyInputFalla?.value.trim() || '[Descripción de la falla]';
            const id = remedyInputId?.value.trim() || '[Customer ID]';
            const dni = remedyInputDni?.value.trim() || '[DNI/RUC]';
            const cliente = remedyInputCliente?.value.trim() || '[Nombre del Cliente]';
            const detalle = remedyInputDetalle?.value.trim() || '';

            let text = `FALLA: ${falla}\n\n`;
            text += `   • ID: ${id}\n`;
            text += `   • DNI: ${dni}\n`;
            text += `   • CLIENTE: ${cliente}\n`;
            if (detalle) {
                text += `   • ${detalle}\n`;
            }
            if (remedyImagesList.length > 0) {
                text += `\n[${remedyImagesList.length} imagen(es) adjunta(s)]`;
            }
            return text;
        };

        const updateRemedyPreview = () => {
            if (remedyPreviewBox) {
                remedyPreviewBox.textContent = getRemedyPlainText();
            }
        };

        const renderRemedyImages = () => {
            if (!remedyImagesContainer) return;
            remedyImagesContainer.innerHTML = '';
            remedyImagesList.forEach((imgData, idx) => {
                const thumbWrapper = document.createElement('div');
                thumbWrapper.style.cssText = 'position:relative; width:90px; height:70px; border-radius:6px; overflow:hidden; border:1px solid var(--border-color); background:#000;';
                
                const img = document.createElement('img');
                img.src = imgData;
                img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                
                const delBtn = document.createElement('button');
                delBtn.innerHTML = '✕';
                delBtn.style.cssText = 'position:absolute; top:2px; right:2px; background:rgba(220,53,69,0.85); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;';
                delBtn.title = 'Eliminar imagen';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    remedyImagesList.splice(idx, 1);
                    renderRemedyImages();
                    updateRemedyPreview();
                });

                thumbWrapper.appendChild(img);
                thumbWrapper.appendChild(delBtn);
                remedyImagesContainer.appendChild(thumbWrapper);
            });
            updateRemedyPreview();
        };

        const handleImageFile = (file) => {
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                remedyImagesList.push(e.target.result);
                renderRemedyImages();
                showToast('Captura añadida a Remedy');
            };
            reader.readAsDataURL(file);
        };

        const openRemedyModal = () => {
            if (remedyModal) {
                // Auto-fill from main form if available
                if (elements.genCustomer && elements.genCustomer.value.trim() && (!remedyInputCliente.value || remedyInputCliente.value === '')) {
                    remedyInputCliente.value = elements.genCustomer.value.trim().toUpperCase();
                }
                if (elements.genDni && elements.genDni.value.trim() && (!remedyInputDni.value || remedyInputDni.value === '')) {
                    remedyInputDni.value = elements.genDni.value.trim();
                }
                if (elements.genIdLlamada && elements.genIdLlamada.value.trim() && (!remedyInputId.value || remedyInputId.value === '')) {
                    remedyInputId.value = elements.genIdLlamada.value.trim();
                }
                remedyModal.classList.add('active');
                updateRemedyPreview();
            }
        };

        const closeRemedyModal = () => {
            if (remedyModal) remedyModal.classList.remove('active');
        };

        if (btnOpenRemedyModal) btnOpenRemedyModal.addEventListener('click', openRemedyModal);
        if (remedyModalClose) remedyModalClose.addEventListener('click', closeRemedyModal);
        if (remedyModalCancel) remedyModalCancel.addEventListener('click', closeRemedyModal);
        if (remedyModal) {
            remedyModal.addEventListener('click', (e) => {
                if (e.target === remedyModal) closeRemedyModal();
            });
        }

        [remedyInputFalla, remedyInputId, remedyInputDni, remedyInputCliente, remedyInputDetalle].forEach(inp => {
            if (inp) inp.addEventListener('input', updateRemedyPreview);
        });

        if (btnClearRemedyImages) {
            btnClearRemedyImages.addEventListener('click', () => {
                remedyImagesList = [];
                renderRemedyImages();
                showToast('Imágenes eliminadas');
            });
        }

        // Paste event support (Ctrl+V)
        window.addEventListener('paste', (e) => {
            if (!remedyModal || !remedyModal.classList.contains('active')) return;
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    handleImageFile(blob);
                }
            }
        });

        // Drag and Drop support
        if (remedyDropZone) {
            remedyDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                remedyDropZone.style.borderColor = 'var(--primary)';
                remedyDropZone.style.background = 'rgba(2, 132, 199, 0.15)';
            });
            remedyDropZone.addEventListener('dragleave', () => {
                remedyDropZone.style.borderColor = 'var(--border-color)';
                remedyDropZone.style.background = 'rgba(0,0,0,0.15)';
            });
            remedyDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                remedyDropZone.style.borderColor = 'var(--border-color)';
                remedyDropZone.style.background = 'rgba(0,0,0,0.15)';
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    for (let file of e.dataTransfer.files) {
                        handleImageFile(file);
                    }
                }
            });
        }

        // Action: Copy Plain Text
        if (btnCopyRemedyText) {
            btnCopyRemedyText.addEventListener('click', () => {
                const text = getRemedyPlainText();
                copyToClipboard(text, 'Texto Remedy copiado');
                addHistoryRecord('Remedy', 'Incidencia / Escalamiento', text);
            });
        }

        // Action: Copy Rich Format for Word (With Embedded Images)
        if (btnCopyRemedyWord) {
            btnCopyRemedyWord.addEventListener('click', async () => {
                const falla = remedyInputFalla?.value.trim() || '[Descripción de la falla]';
                const id = remedyInputId?.value.trim() || '[Customer ID]';
                const dni = remedyInputDni?.value.trim() || '[DNI/RUC]';
                const cliente = remedyInputCliente?.value.trim() || '[Nombre del Cliente]';
                const detalle = remedyInputDetalle?.value.trim() || '';

                let htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                htmlContent += `<p style="margin: 0 0 10pt 0;"><strong>FALLA:</strong> ${falla}</p>`;
                htmlContent += `<ul style="margin: 0 0 14pt 20pt; padding: 0;">`;
                htmlContent += `<li style="margin-bottom: 3pt;"><strong>ID:</strong> ${id}</li>`;
                htmlContent += `<li style="margin-bottom: 3pt;"><strong>DNI:</strong> ${dni}</li>`;
                htmlContent += `<li style="margin-bottom: 3pt;"><strong>CLIENTE:</strong> ${cliente}</li>`;
                if (detalle) {
                    htmlContent += `<li style="margin-bottom: 3pt;">${detalle}</li>`;
                }
                htmlContent += `</ul>`;

                if (remedyImagesList.length > 0) {
                    htmlContent += `<div style="margin-top: 15pt;">`;
                    remedyImagesList.forEach(imgData => {
                        htmlContent += `<p style="margin: 0 0 12pt 0;"><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px;" /></p>`;
                    });
                    htmlContent += `</div>`;
                }
                htmlContent += `</div>`;

                const plainText = getRemedyPlainText();

                try {
                    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
                    const blobText = new Blob([plainText], { type: 'text/plain' });
                    const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
                    await navigator.clipboard.write(data);
                    showToast('📋 ¡Formato completo con fotos copiado! Listo para pegar en Word (Ctrl+V)');
                    addHistoryRecord('Remedy', 'Incidencia Word / Escalamiento', plainText);
                } catch (err) {
                    // Fallback to text copy
                    copyToClipboard(plainText, 'Texto Remedy copiado');
                }
            });
        }

        // Setup Beta Info Popover
        const btnBetaInfo = document.getElementById('btnBetaInfo');
        const betaInfoPopover = document.getElementById('betaInfoPopover');
        const btnCloseBetaInfoPopover = document.getElementById('btnCloseBetaInfoPopover');

        if (btnBetaInfo && betaInfoPopover) {
            btnBetaInfo.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (betaEquiposPopover) betaEquiposPopover.classList.remove('active');
                betaInfoPopover.classList.toggle('active');
            });
        }
        if (btnCloseBetaInfoPopover && betaInfoPopover) {
            btnCloseBetaInfoPopover.addEventListener('click', (e) => {
                e.stopPropagation();
                betaInfoPopover.classList.remove('active');
            });
        }

        // Setup Beta Equipos Popover
        const btnBetaEquipos = document.getElementById('btnBetaEquipos');
        const betaEquiposPopover = document.getElementById('betaEquiposPopover');
        const btnCloseBetaEquiposPopover = document.getElementById('btnCloseBetaEquiposPopover');

        if (btnBetaEquipos && betaEquiposPopover) {
            btnBetaEquipos.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (betaInfoPopover) betaInfoPopover.classList.remove('active');
                betaEquiposPopover.classList.toggle('active');
            });
        }
        if (btnCloseBetaEquiposPopover && betaEquiposPopover) {
            btnCloseBetaEquiposPopover.addEventListener('click', (e) => {
                e.stopPropagation();
                betaEquiposPopover.classList.remove('active');
            });
        }

        // Click outside listener for Popovers
        document.addEventListener('click', (e) => {
            if (betaInfoPopover && betaInfoPopover.classList.contains('active')) {
                const isInsideBetaInfo = e.target.closest('#betaInfoPopover') || 
                                         e.target.closest('#btnBetaInfo') || 
                                         e.target.closest('#btnPredictCategory');
                if (!isInsideBetaInfo) {
                    betaInfoPopover.classList.remove('active');
                }
            }

            if (betaEquiposPopover && betaEquiposPopover.classList.contains('active')) {
                const isInsideBetaEquipos = e.target.closest('#betaEquiposPopover') || 
                                            e.target.closest('#btnBetaEquipos') || 
                                            e.target.closest('#eqSearchInput');
                if (!isInsideBetaEquipos) {
                    betaEquiposPopover.classList.remove('active');
                }
            }
        });

    function openTemplateModal(tmplId = null) {
        if (tmplId) {
            const tmpl = state.customTemplates.find(t => t.id === tmplId);
            if (tmpl) {
                elements.modalTitle.textContent = 'Editar Plantilla Personalizada';
                elements.templateIdInput.value = tmpl.id;
                elements.tmplTitleInput.value = tmpl.title;
                elements.tmplCategoryInput.value = tmpl.category;
                elements.tmplContentInput.value = tmpl.content;
            }
        } else {
            elements.modalTitle.textContent = 'Nueva Plantilla Personalizada';
            elements.templateIdInput.value = '';
            elements.tmplTitleInput.value = '';
            elements.tmplCategoryInput.value = 'General';
            elements.tmplContentInput.value = 'DETALLE: \nMOTIVO: \nOBSERVACIÓN: ';
        }
        elements.templateModal.classList.add('active');
    }

    function closeModal() {
        elements.templateModal.classList.remove('active');
    }

    elements.modalSave.addEventListener('click', () => {
        const id = elements.templateIdInput.value || 'tmpl_' + Date.now();
        const title = elements.tmplTitleInput.value.trim();
        const category = elements.tmplCategoryInput.value.trim() || 'General';
        const content = elements.tmplContentInput.value.trim();

        if (!title || !content) {
            alert('Por favor ingrese un título y contenido para la plantilla.');
            return;
        }

        const index = state.customTemplates.findIndex(t => t.id === id);
        if (index >= 0) {
            state.customTemplates[index] = { id, title, category, content };
        } else {
            state.customTemplates.push({ id, title, category, content });
        }

        localStorage.setItem('bo_custom_templates', JSON.stringify(state.customTemplates));
        closeModal();
        renderCustomTemplates();
        showToast('Plantilla guardada correctamente');
    });

    function deleteTemplate(id) {
        if (confirm('¿Desea eliminar esta plantilla personalizada?')) {
            state.customTemplates = state.customTemplates.filter(t => t.id !== id);
            localStorage.setItem('bo_custom_templates', JSON.stringify(state.customTemplates));
            renderCustomTemplates();
            showToast('Plantilla eliminada');
        }
    }

    // ==========================================================================
    // TAB 4: HISTORIAL Y RESPALDO
    // ==========================================================================

    function addHistoryRecord(type, service, content) {
        const record = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: type,
            service: service,
            summary: content.split('\n')[0] || 'Caso BackOffice',
            content: content
        };

        state.history.unshift(record);
        if (state.history.length > 25) state.history.pop();
        localStorage.setItem('bo_history', JSON.stringify(state.history));
    }

    function renderHistoryTable() {
        elements.historyTableBody.innerHTML = '';
        if (state.history.length === 0) {
            elements.historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">Sin historial de casos generados aún.</td></tr>';
            return;
        }

        state.history.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem;">${item.timestamp}</td>
                <td style="padding:0.6rem; border-bottom:1px solid var(--border-color);"><span class="badge badge-info">${item.type}</span></td>
                <td style="padding:0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem;">${item.service}</td>
                <td style="padding:0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.summary}</td>
                <td style="padding:0.6rem; border-bottom:1px solid var(--border-color);">
                    <button class="btn btn-sm copy-hist-btn" data-id="${item.id}">📋 Copiar</button>
                </td>
            `;
            tr.querySelector('.copy-hist-btn').addEventListener('click', () => {
                copyToClipboard(item.content, 'Caso vuelto a copiar');
            });
            elements.historyTableBody.appendChild(tr);
        });
    }

    elements.btnClearHistory.addEventListener('click', () => {
        if (confirm('¿Limpiar todo el historial de casos?')) {
            state.history = [];
            localStorage.setItem('bo_history', JSON.stringify(state.history));
            renderHistoryTable();
            showToast('Historial limpiado');
        }
    });

    // Export / Import Backup JSON
    elements.btnExportJson.addEventListener('click', () => {
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            advisorName: state.advisorName,
            advisorCode: state.advisorCode,
            customTemplates: state.customTemplates,
            history: state.history
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(jsonString);
        
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `plantillas_bo_backup_${new Date().toISOString().split('T')[0]}.txt`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast('Respaldo descargado como .txt');
    });

    elements.importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.customTemplates && Array.isArray(data.customTemplates)) {
                    state.customTemplates = data.customTemplates;
                    localStorage.setItem('bo_custom_templates', JSON.stringify(state.customTemplates));
                    showToast(`Importadas ${state.customTemplates.length} plantillas personalizadas`);
                    if (state.activeTab === 'tab-custom') renderCustomTemplates();
                } else {
                    alert('El archivo no contiene un formato de respaldo válido.');
                }
            } catch (err) {
                alert('Error al leer el archivo JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    // Utility: Copy to Clipboard & Toast
    function copyToClipboard(text, successMsg) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
        } else {
            fallbackCopy(text, successMsg);
        }
    }

    function fallbackCopy(text, successMsg) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast(successMsg);
        } catch (err) {
            alert('No se pudo copiar automáticamente: ' + err);
        }
        document.body.removeChild(textarea);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>✅</span> <span>${message}</span>`;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Initialize all modules
    initGeneratorTab();
    initTrackerTab();
});
