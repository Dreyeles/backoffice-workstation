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
        customRemedyViews: JSON.parse(localStorage.getItem('bo_custom_remedy_views') || '[]'),
        history: JSON.parse(localStorage.getItem('bo_history') || '[]'),
        learnedPhrases: JSON.parse(localStorage.getItem('bo_learned_phrases') || '{"descartes":[],"soluciones":[],"problemas":[]}'),
        activeTab: 'tab-generator',
        siacTemplateMode: localStorage.getItem('bo_siac_template_mode') || 'wsp',
        cicloOverride: null,
        callIds: new Set(),
        chatIds: new Set()
    };

    // Auto-clean any legacy typos from learnedPhrases in localStorage
    if (state.learnedPhrases && typeof state.learnedPhrases === 'object') {
        let cleanedPhrases = false;
        if (!Array.isArray(state.learnedPhrases.problemas)) {
            state.learnedPhrases.problemas = [];
            cleanedPhrases = true;
        }
        ['descartes', 'soluciones', 'problemas'].forEach(cat => {
            if (Array.isArray(state.learnedPhrases[cat])) {
                const prev = state.learnedPhrases[cat].slice();
                state.learnedPhrases[cat] = state.learnedPhrases[cat]
                    .map(p => {
                        if (typeof p !== 'string') return '';
                        let s = p.replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
                        s = s.replace(/^Sse\b/i, 'Se').trim();
                        s = s.replace(/^Er\s+intento\b/i, '1er intento');
                        s = s.replace(/^Do\s+intento\b/i, '2do intento');
                        s = s.replace(/^33er\s+intento\b/i, '3er intento');
                        return s;
                    })
                    .filter(p => p && !/^sse\s+/i.test(p));

                // Deduplicate with respect to base dataset
                const seen = new Set();
                state.learnedPhrases[cat] = state.learnedPhrases[cat].filter(p => {
                    const norm = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    if (seen.has(norm)) return false;
                    seen.add(norm);
                    let inBase = false;
                    if (cat === 'problemas') {
                        const allBase = Object.values(BO_DATASET.problemsByService || {}).flat();
                        inBase = allBase.some(b => b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === norm);
                    } else {
                        inBase = ((BO_DATASET.predictiveCorpus && BO_DATASET.predictiveCorpus[cat]) || [])
                            .some(b => b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === norm);
                    }
                    return !inBase;
                });

                if (JSON.stringify(prev) !== JSON.stringify(state.learnedPhrases[cat])) {
                    cleanedPhrases = true;
                }
            }
        });
        if (cleanedPhrases) {
            try {
                localStorage.setItem('bo_learned_phrases', JSON.stringify(state.learnedPhrases));
            } catch (e) { }
        }
    }

    // Default sample custom template if empty
    if (state.customTemplates.length === 0) {
        state.customTemplates = [];
    }

    // Ensure default templates exist (WhatsApp & Visita Técnica con SOT dinámica)
    const defaultTemplates = [
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
        },
        {
            id: 'tmpl_visita_sot',
            title: 'CONFIRMACIÓN VISITA TÉCNICA (SOT)',
            category: 'WhatsApp',
            content: `Estimado(a) cliente 👋, le confirmamos que se ha generado la visita técnica con el Codigo: {sot} La atención se realizará en un plazo máximo de 48 horas 👨🔧🏠. El técnico se comunicará previamente con usted para coordinar el ingreso. ¡Muchas gracias por su tiempo y preferencia! 😊👍`
        }
    ];

    let templatesUpdated = false;

    // Remove legacy default templates if they exist
    const initialCount = state.customTemplates.length;
    state.customTemplates = state.customTemplates.filter(t => t.id !== 'tmpl_default_1' && t.id !== 'tmpl_default_2');
    if (state.customTemplates.length !== initialCount) {
        templatesUpdated = true;
    }

    defaultTemplates.forEach(defTmpl => {
        const existing = state.customTemplates.find(t => t.id === defTmpl.id);
        if (!existing) {
            state.customTemplates.push(defTmpl);
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
        btnPredictCategory: document.getElementById('btnPredictCategory'),

        titleSiacCard: document.getElementById('titleSiacCard'),
        btnToggleSiacMode: document.getElementById('btnToggleSiacMode'),
        labelSiacMode: document.getElementById('labelSiacMode'),
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
        incSmartPaste: document.getElementById('incSmartPaste'),
        btnSmartPasteClip: document.getElementById('btnSmartPasteClip'),
        smartPasteStatus: document.getElementById('smartPasteStatus'),
        hfcManualFields: document.getElementById('hfcManualFields'),
        btnToggleHfcManual: document.getElementById('btnToggleHfcManual'),
        toggleManualArrow: document.getElementById('toggleManualArrow'),
        incInputDwsPot: document.getElementById('incInputDwsPot'),
        incInputUsPot: document.getElementById('incInputUsPot'),
        incInputDwsSnr: document.getElementById('incInputDwsSnr'),
        incInputUsSnr: document.getElementById('incInputUsSnr'),
        incognitoResults: document.getElementById('incognitoResults'),
        incGlobalBadge: document.getElementById('incGlobalBadge'),
        incResultDwsSnr: document.getElementById('incResultDwsSnr'),
        incResultDwsPot: document.getElementById('incResultDwsPot'),
        incResultUsSnr: document.getElementById('incResultUsSnr'),
        incResultUsPot: document.getElementById('incResultUsPot'),
        ftthSmartPaste: document.getElementById('ftthSmartPaste'),
        btnFtthSmartPasteClip: document.getElementById('btnFtthSmartPasteClip'),
        ftthSmartPasteStatus: document.getElementById('ftthSmartPasteStatus'),
        ftthManualFields: document.getElementById('ftthManualFields'),
        btnToggleFtthManual: document.getElementById('btnToggleFtthManual'),
        toggleFtthManualArrow: document.getElementById('toggleFtthManualArrow'),
        ftthGlobalBadge: document.getElementById('ftthGlobalBadge'),
        ftthInputTx: document.getElementById('ftthInputTx'),
        ftthInputRx: document.getElementById('ftthInputRx'),
        ftthResultTx: document.getElementById('ftthResultTx'),
        ftthResultRx: document.getElementById('ftthResultRx'),

        // Equipment Identifier
        eqSearchInput: document.getElementById('eqSearchInput'),
        eqQuickChips: document.getElementById('eqQuickChips'),
        eqResultContainer: document.getElementById('eqResultContainer'),
        eqImageBox: document.getElementById('eqImageBox'),
        eqImage: document.getElementById('eqImage'),
        eqImagePlaceholder: document.getElementById('eqImagePlaceholder'),
        eqZoomHint: document.getElementById('eqZoomHint'),
        btnCardPrevImg: document.getElementById('btnCardPrevImg'),
        btnCardNextImg: document.getElementById('btnCardNextImg'),
        eqCardImgCounter: document.getElementById('eqCardImgCounter'),
        eqCardImgCounterText: document.getElementById('eqCardImgCounterText'),
        eqName: document.getElementById('eqName'),
        eqType: document.getElementById('eqType'),
        eqVersion: document.getElementById('eqVersion'),
        eqRed: document.getElementById('eqRed'),
        eqRepetidor: document.getElementById('eqRepetidor'),
        eqSpeed: document.getElementById('eqSpeed'),
        eqStatus: document.getElementById('eqStatus'),
        eqFirmware: document.getElementById('eqFirmware'),
        eqPlataformas: document.getElementById('eqPlataformas'),
        eqDesc: document.getElementById('eqDesc'),
        eqCredentials: document.getElementById('eqCredentials'),

        // Equipment Modal Viewer
        eqModalViewer: document.getElementById('eqModalViewer'),
        eqModalClose: document.getElementById('eqModalClose'),
        eqModalTitle: document.getElementById('eqModalTitle'),
        eqModalSubtitle: document.getElementById('eqModalSubtitle'),
        eqModalHomologadoBadge: document.getElementById('eqModalHomologadoBadge'),
        eqModalRedBadge: document.getElementById('eqModalRedBadge'),
        eqModalWifiBadge: document.getElementById('eqModalWifiBadge'),
        eqModalRepetidorBadge: document.getElementById('eqModalRepetidorBadge'),
        eqModalViewport: document.getElementById('eqModalViewport'),
        eqModalImage: document.getElementById('eqModalImage'),
        eqModalZoomBadge: document.getElementById('eqModalZoomBadge'),
        eqModalZoomText: document.getElementById('eqModalZoomText'),
        eqModalAngleBadge: document.getElementById('eqModalAngleBadge'),
        eqModalAngleText: document.getElementById('eqModalAngleText'),
        btnEqModalPrev: document.getElementById('btnEqModalPrev'),
        btnEqModalNext: document.getElementById('btnEqModalNext'),
        eqModalAngleDesc: document.getElementById('eqModalAngleDesc'),
        eqModalThumbnails: document.getElementById('eqModalThumbnails'),
        eqModalFw: document.getElementById('eqModalFw'),
        eqModalPlat: document.getElementById('eqModalPlat'),
        eqModalSpeed: document.getElementById('eqModalSpeed'),

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
    function switchTab(targetId) {
        document.querySelectorAll('.nav-tab-btn').forEach(b => {
            if (b.getAttribute('data-tab') === targetId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        document.querySelectorAll('.tab-pane').forEach(p => {
            if (p.id === targetId) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        state.activeTab = targetId;

        if (targetId === 'tab-custom') renderCustomTemplates();
        if (targetId === 'tab-history') {
            renderHistoryTable();
            renderLatestFullCases();
        }
    }

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });


    // ==========================================================================
    // UTILIDADES GLOBALES (ÁMBITO COMPARTIDO)
    // ==========================================================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    window.escapeHtml = escapeHtml;

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

    function showToast(message, type = 'success', action = null) {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'warning' ? 'toast-warning' : (type === 'danger' ? 'toast-danger' : (type === 'info' ? 'toast-info' : ''))}`;
        const icon = type === 'warning' ? '⚠️' : (type === 'danger' ? '❌' : (type === 'info' ? 'ℹ️' : '✅'));

        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.gap = '0.75rem';

        const contentSpan = document.createElement('div');
        contentSpan.style.display = 'flex';
        contentSpan.style.alignItems = 'center';
        contentSpan.style.gap = '0.4rem';
        contentSpan.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toast.appendChild(contentSpan);

        if (action && action.text && action.callback) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = action.text;
            btn.style.cssText = 'background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); color: #ffffff; border-radius: 5px; padding: 3px 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;';
            btn.onmouseover = () => { btn.style.background = 'rgba(255,255,255,0.38)'; btn.style.transform = 'scale(1.03)'; };
            btn.onmouseout = () => { btn.style.background = 'rgba(255,255,255,0.22)'; btn.style.transform = 'scale(1)'; };
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                action.callback();
                toast.remove();
            });
            toast.appendChild(btn);
        }

        if (elements.toastContainer) {
            elements.toastContainer.appendChild(toast);
            const duration = action ? 6000 : 2500;
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    window.copyToClipboard = copyToClipboard;
    window.showToast = showToast;

    // Cross-module function bridges with safe fallbacks
    const autoCorrectText = (text, preserve) => (window.autoCorrectText ? window.autoCorrectText(text, preserve) : text);
    const addHistoryRecord = (type, service, content) => (window.addHistoryRecord ? window.addHistoryRecord(type, service, content) : null);
    const renderHistoryTable = () => (window.renderHistoryTable ? window.renderHistoryTable() : null);
    const renderCustomTemplates = () => (window.renderCustomTemplates ? window.renderCustomTemplates() : null);
    const learnSinglePhrase = (cat, phrase) => (window.learnSinglePhrase ? window.learnSinglePhrase(cat, phrase) : null);
    const initPredictiveTextEngine = () => (window.initPredictiveTextEngine ? window.initPredictiveTextEngine() : null);

    function initGeneratorTab() {
        // 1. Populate Problems based on initial Service
        populateProblems(elements.genServicio.value);
        elements.genServicio.addEventListener('change', (e) => {
            populateProblems(e.target.value);
            renderQuickDescartes();
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

        // 4.1 Initialize Predictive Text Engine (Ghost Text & Dropdown)
        initPredictiveTextEngine();

        // 5. Input change listeners (Limpian resaltados de error al escribir)
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

        // Validación Inteligente: Número de Contacto (Permite dígitos y separadores para soportar múltiples teléfonos)
        if (elements.genTelefono) {
            const telefonoWarning = document.getElementById('genTelefonoWarning');
            let warningTimeout = null;

            const triggerPhoneWarning = (msg = '⚠️ Solo se permiten números y separadores') => {
                elements.genTelefono.classList.remove('input-invalid');
                void elements.genTelefono.offsetWidth; // Forzar reflow para reiniciar animación
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

            // 1. Bloquear teclas inválidas al tipear
            elements.genTelefono.addEventListener('keydown', (e) => {
                const allowedControlKeys = [
                    'Backspace', 'Tab', 'Enter', 'Delete', 'Escape',
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End'
                ];
                if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
                    return;
                }

                // Permitir dígitos 0-9 y separadores comunes: espacio, barra, guión, coma
                if (!/^[0-9\s/,-]$/.test(e.key)) {
                    e.preventDefault();
                    triggerPhoneWarning('⚠️ Solo se permiten números y separadores (/ - ,)');
                }
            });

            // 2. Filtrado y sanitizado inteligente al pegar texto (Paste)
            elements.genTelefono.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text') || '';
                if (!pastedText.trim()) return;

                // Verificar si el texto copiado proviene de Customer Service Cloud / AICC o contiene múltiples datos
                let extractedCallId = null;
                let extractedPhones = [];

                // A) Buscar ID de llamada (patrón 1789050624-2967456, UUID o etiqueta 'ID de llamada')
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

                // B) Buscar Teléfono / Número de cliente (Móviles y Fijos de casa)
                const clientNumMatch = pastedText.match(/(?:n[uú]mero\s*de\s*cliente|n[uú]mero\s*llamado|n[uú]mero\s*de\s*contacto|tel[eé]fono|contacto|celular|fijo|casa)\s*[:=\t\r\n]?\s*([0-9\s/,-]{6,40})/i);
                if (clientNumMatch) {
                    const nums = clientNumMatch[1].match(/\b\d{6,11}\b/g);
                    if (nums) {
                        extractedPhones = Array.from(new Set(nums));
                    }
                }

                // Si no encontró por etiqueta explícita, buscar números móviles (9 dígitos) o fijos (6-8 dígitos)
                if (extractedPhones.length === 0) {
                    let textWithoutCallId = pastedText;
                    if (extractedCallId) {
                        textWithoutCallId = textWithoutCallId.replace(extractedCallId, '');
                    }
                    const allNums = textWithoutCallId.match(/\b9\d{8}\b/g) || textWithoutCallId.match(/\b(?:01\d{7}|0[4-8]\d{7}|[2-8]\d{5,7})\b/g) || textWithoutCallId.match(/\b\d{6,11}\b/g);
                    if (allNums) {
                        extractedPhones = Array.from(new Set(allNums));
                    }
                }

                // Si se detectó ID de llamada o un bloque estructurado de Customer Service Cloud:
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

                // Pegado normal de número simple
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

            // 3. Listener reactivo para limpiar caracteres residuales
            elements.genTelefono.addEventListener('input', () => {
                const currentVal = elements.genTelefono.value;
                if (/[^0-9\s/,-]/.test(currentVal)) {
                    elements.genTelefono.value = currentVal.replace(/[^0-9\s/,-]/g, '');
                    triggerPhoneWarning('⚠️ Solo se permiten números y separadores');
                }
                renderGeneratorPreviews();
            });

            elements.genTelefono.addEventListener('change', () => {
                renderGeneratorPreviews();
            });
        }

        // Gestión Inteligente de ID Llamada y Chat ID (Pegar continuo sin borrar)
        if (elements.genContactId) {
            elements.genContactId.addEventListener('focus', () => {
                elements.genContactId.select();
            });

            elements.genContactId.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
                if (!pastedText) return;

                // Si viene del Customer Service Cloud y trae número de cliente, asignarlo a teléfono si está vacío
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

        // ======================================================================
        // ANALIZADOR Y FILTRO INTELIGENTE DE PLANTILLAS DE CASO (Smart Case Parser)
        // ======================================================================
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
            // A) Buscar en líneas con etiquetas explícitas (Teléfono, Contacto, Celular, Fijo, Casa, Tlf, etc.)
            const phoneLabelMatch = text.match(/(?:tel[eé]fono[s]?|contacto[s]?|celular(?:es)?|fijo[s]?|casa|tlf|cel)\s*[:=-]?\s*([0-9\s/,-]{6,40})/i);
            if (phoneLabelMatch) {
                const rawPhones = phoneLabelMatch[1];
                const nums = rawPhones.match(/\b\d{6,11}\b/g);
                if (nums && nums.length > 0) {
                    detected.phones = Array.from(new Set(nums)).slice(0, 2);
                    indicatorsCount++;
                }
            }

            // B) Si no encontró por etiqueta, buscar números móviles (9 dígitos) o fijos (6-8 dígitos o con prefijo 01/0XX)
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
            // A) Con etiqueta explícita (requiere límite de palabra y separador obligatorio para no confundir con INCOGNITO)
            const sotLabelMatch = text.match(/\b(?:sot\s*\/\s*remedy|sot|remedy|ticket|incidente|wo|orden|inc)\b\s*[:=-]\s*([a-zA-Z0-9\-_]{6,16})/i);
            if (sotLabelMatch) {
                const candidate = sotLabelMatch[1].trim();
                if (candidate.toUpperCase() !== 'N/A') {
                    detected.sot = candidate;
                    indicatorsCount++;
                }
            }

            // B) Sin etiqueta: SOT estándar peruano (8 dígitos que empiezan con 9, ej: 90718308)
            if (!detected.sot) {
                const sotNumMatches = text.match(/\b9\d{7}\b/g);
                if (sotNumMatches && sotNumMatches.length > 0) {
                    // Excluir si es prefijo o subcadena de un teléfono de 9 dígitos ya capturado
                    const validSots = sotNumMatches.filter(s => !detected.phones.some(p => p.includes(s)));
                    if (validSots.length > 0) {
                        detected.sot = validSots[0];
                        indicatorsCount++;
                    }
                }
            }

            // 4. Extraer ID Llamada / Chat ID
            const contactMatches = [];
            // UUIDs de Chat
            const uuidMatches = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi);
            if (uuidMatches) {
                uuidMatches.forEach(u => contactMatches.push(u));
            }
            // Patrón numérico común (ej: 1787747820-730926 o 1789136560-996120)
            const callPatternMatches = text.match(/\b\d{8,12}-\d{4,8}\b/g);
            if (callPatternMatches) {
                callPatternMatches.forEach(cp => contactMatches.push(cp));
            }
            // ID llamada explícito (si no coincidió con patrón numérico)
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

            // 5. Detectar Cabeceras / Banners de plantilla
            if (/BACK\s*OFFICE/i.test(text) || /\*{6,}/.test(text) || /Plantilla\s*SIAC/i.test(text) || /Plantilla\s*Mantenimiento/i.test(text)) {
                indicatorsCount++;
            }

            // 6. Extraer Problema si viene etiquetado
            const probMatch = text.match(/(?:problema|motivo|falla|inconveniente)\s*[:=-]\s*([^\n\r]+)/i);
            if (probMatch) {
                detected.problema = probMatch[1].trim();
                indicatorsCount++;
            }

            // 7. Extraer Solución si viene etiquetada
            const solMatch = text.match(/(?:soluci[oó]n|resoluci[oó]n)\s*[:=-]\s*([^\n\r]+)/i);
            if (solMatch) {
                const solCandidate = solMatch[1].trim();
                if (solCandidate.toUpperCase() !== 'N/A') {
                    detected.solucion = solCandidate;
                    indicatorsCount++;
                }
            }

            // 8. Condición de Activación: Al menos 2 datos clave
            if (indicatorsCount < 2) {
                return false; // Pegado de texto ordinario, no interceptar
            }

            // 9. Extraer y Limpiar Descartes
            const descartesLines = [];
            lines.forEach(line => {
                const clean = line.trim();
                if (!clean) return;

                // Omitir cabeceras o banners
                if (/^BACK\s*OFFICE/i.test(clean) || /^\*{3,}/.test(clean) || /^=+/.test(clean)) return;

                // Omitir líneas con etiquetas ya procesadas
                if (/^(?:tel[eé]fono|contacto|celular|tlf)\s*[:=-]/i.test(clean)) return;
                if (/^\b(?:sot\s*\/\s*remedy|sot|remedy|ticket|incidente|wo|orden|inc)\b\s*[:=-]/i.test(clean)) return;
                if (/^(?:id\s*(?:call\/live|call|live|livechat|llamada|chat)|chat\s*id)\s*[:=-]/i.test(clean)) return;
                if (/^(?:problema|motivo)\s*[:=-]/i.test(clean)) return;
                if (/^(?:soluci[oó]n|resoluci[oó]n)\s*[:=-]/i.test(clean)) return;
                if (/^#[^#]+#$/.test(clean) || /^#[A-Z0-9_+]+$/i.test(clean)) return;

                // Si la línea empieza con "Descartes:" o "Pruebas:"
                if (/^(?:descartes|pruebas|acciones)\s*[:=-]/i.test(clean)) {
                    const content = clean.replace(/^(?:descartes|pruebas|acciones)\s*[:=-]\s*/i, '').trim();
                    if (content) descartesLines.push(content);
                    return;
                }

                descartesLines.push(clean);
            });

            detected.descartes = descartesLines;

            // ==========================================
            // DISTRIBUIR VALORES EN LAS CASILLAS
            // ==========================================

            // A) Teléfono(s)
            if (detected.phones.length > 0) {
                elements.genTelefono.value = detected.phones.join(' / ');
                elements.genTelefono.classList.remove('input-invalid');
            }

            // B) SOT
            if (detected.sot) {
                elements.genSot.value = detected.sot;
                elements.genSot.classList.remove('input-invalid');
            } else {
                elements.genSot.value = '';
            }

            // C) Contact IDs (Llamadas / Chats)
            state.callIds.clear();
            state.chatIds.clear();
            if (detected.contactIds.length > 0) {
                detected.contactIds.forEach(c => processAndStoreContactText(c));
                updateContactInputField();
            } else {
                if (elements.genContactId) elements.genContactId.value = '';
            }

            // D) Problema
            if (detected.problema) {
                const probQuery = detected.problema.toLowerCase();
                const found = currentProblemList.find(p => p.toLowerCase().includes(probQuery) || probQuery.includes(p.toLowerCase()));
                if (found) {
                    setProblemValue(found);
                } else {
                    setProblemValue(detected.problema);
                }
            }

            // E) Solución
            if (detected.solucion) {
                elements.genSolucion.value = detected.solucion;
            }

            // F) Descartes
            if (detected.descartes.length > 0) {
                elements.genDescartes.value = detected.descartes.join('\n');
                elements.genDescartes.classList.remove('input-invalid');
            } else if (detected.isAgendamiento && detected.sot) {
                elements.genDescartes.value = `Se valida agendamiento y generación de SOT ${detected.sot}`;
            }

            // G) Limpiar y sincronizar hashtags de la plantilla si los tuviera
            state.selectedHashtags.clear();
            const tagMatches = text.match(/#([a-zA-Z0-9_+]+)#?/g);
            if (tagMatches && typeof BO_DATASET !== 'undefined' && BO_DATASET.hashtags) {
                tagMatches.forEach(tm => {
                    const cleanTag = tm.replace(/#/g, '').toUpperCase();
                    const found = BO_DATASET.hashtags.find(h => h.tag.replace(/#/g, '').toUpperCase() === cleanTag);
                    if (found) state.selectedHashtags.add(found.tag);
                });
            }
            if (typeof renderHashtagChips === 'function') {
                renderHashtagChips();
            }

            // H) Predecir categorías automáticamente si aplica
            if (elements.btnPredictCategory) {
                elements.btnPredictCategory.click();
            }

            // H) Re-renderizar Previews
            renderGeneratorPreviews();

            // I) Notificación descriptiva
            const summary = [];
            if (detected.phones.length > 0) summary.push(`📱 ${detected.phones.join(' / ')}`);
            if (detected.sot) summary.push(`🏷️ SOT: ${detected.sot}`);
            if (detected.isAgendamiento) summary.push(`📅 Agendamiento`);
            if (detected.contactIds.length > 0) summary.push(`📞 ID Contacto`);

            showToast(`⚡ ¡Plantilla detectada y distribuida! ${summary.join(' | ')}`, 'success');
            return true;
        }

        // Interceptar 'Pegar' (Ctrl+V) en Descartes: Capturas de Imagen o Filtrado Inteligente de Plantillas
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

                        e.preventDefault();
                        return;
                    }
                }

                // Detección y Distribución Inteligente al pegar texto completo
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                if (pastedText) {
                    const wasDistributed = parseAndDistributeCaseTemplate(pastedText);
                    if (wasDistributed) {
                        e.preventDefault(); // Evita que se duplique o sobreescriba con el bloque en bruto
                    }
                }
            });
        }



        const attachAutoCorrect = (inputEl, btnEl) => {
            if (!inputEl) return;

            // 1. Al presionar Espacio, Coma, Punto, Punto y Coma o Enter, autocorregir respetando diferencia de longitud del cursor
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

            // 2. Al pegar texto (paste)
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

            // 3. Al perder el foco (blur), autocorregir todo el texto
            inputEl.addEventListener('blur', () => {
                const original = inputEl.value;
                const corrected = autoCorrectText(original, false);
                if (original !== corrected) {
                    inputEl.value = corrected;
                    renderGeneratorPreviews();
                }
            });

            // 4. Botón 🪄 Auto-corregir manual
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

        // 6. Custom Combobox Dropdown Logic for Problema Detectado (Editable e Interactivo)
        const problemaDropdown = document.getElementById('problemaDropdown');
        const btnToggleProblema = document.getElementById('btnToggleProblemaDropdown');
        const problemaWrapper = document.getElementById('problemaWrapper');

        let currentFocus = -1;

        if (elements.genProblema) {
            // Permitir escribir directamente y filtrar sugerencias en tiempo real
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

            // Memorizar nuevo problema cuando el usuario escribe y cambia el campo
            elements.genProblema.addEventListener('change', () => {
                const val = (elements.genProblema.value || '').trim();
                if (val && val.length >= 4 && val.toUpperCase() !== 'N/A') {
                    learnSinglePhrase('problemas', val);
                    const currentService = (elements.genServicio?.value || 'INTERNET').toUpperCase();
                    populateProblems(currentService, true);
                }
            });

            // Abrir sugerencias al hacer foco o clic en el campo (y auto-seleccionar si tiene texto para sobreescribir al tipear)
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

            // Navegación por teclado (Flechas Arriba/Abajo, Enter, Escape)
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
                removeActive(options);
                if (currentFocus >= options.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = options.length - 1;
                options[currentFocus].classList.add('active');
                options[currentFocus].scrollIntoView({ block: 'nearest' });
            }

            function removeActive(options) {
                for (let i = 0; i < options.length; i++) {
                    options[i].classList.remove('active');
                }
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

        renderGeneratorPreviews();

        let lastClearedSnapshot = null;

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

        // Clear button for Case 1 (con soporte de snapshot para Deshacer / Undo)
        document.getElementById('btnClearForm').addEventListener('click', () => {
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

            // Limpiar resaltados de error por validación
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

        // Soporte de Atajo Global Ctrl+Z para restaurar formulario si fue limpiado por error
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

        // Autocompletar Categoría Logic
        if (elements.btnPredictCategory) {
            elements.btnPredictCategory.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                const rawDescartes = (elements.genDescartes ? elements.genDescartes.value : '') || '';
                const descartesNorm = rawDescartes.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const sot = (elements.genSot ? elements.genSot.value : '').trim();
                const solucionNorm = ((elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value : '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                let predictedCategory = '';

                const problemaNorm = ((elements.genProblema && elements.genProblema.value) ? elements.genProblema.value : '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
                else if (sot !== '' && sot.toUpperCase() !== 'N/A') {
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

                if (elements.genCatResolucion) {
                    elements.genCatResolucion.value = predictedCategory;
                    renderGeneratorPreviews();
                    showToast('Categoría autocompletada: ' + predictedCategory.split('>')[0].trim(), 'info');
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
                document.getElementById('problemaDropdown').classList.remove('open');
            });
            container.appendChild(div);
        });
    }

    function populateProblems(serviceKey, keepCurrentValue = false) {
        const base = BO_DATASET.problemsByService[serviceKey] || (serviceKey === 'CLARO VIDEO' ? BO_DATASET.problemsByService['APPS'] : []) || [];
        const learned = (state.learnedPhrases && state.learnedPhrases.problemas) || [];

        const seen = new Set();
        const combined = [];

        // Base problems
        base.forEach(p => {
            const clean = p.replace(/^(INT|TEL|IPTV|CABLE)\s*-\s*/i, '').trim();
            const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (!seen.has(norm)) {
                seen.add(norm);
                combined.push(clean);
            }
        });

        // Learned custom problems
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
            if (tooltipEl) {
                tooltipEl.classList.remove('active');
            }
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

                // Eventos para previsualización dinámica al pasar el mouse (hover)
                chip.addEventListener('mouseenter', (e) => showChipTooltip(e, item, s));
                chip.addEventListener('mousemove', (e) => positionTooltip(e));
                chip.addEventListener('mouseleave', hideChipTooltip);

                chip.addEventListener('click', (e) => {
                    const cur = state.selectedDescartes.get(item.label) || 0;
                    const next = (cur + 1) % (item.states.length + 1);

                    let currentVal = elements.genDescartes.value;

                    // Limpiar cualquier estado previo de este mismo chip para reemplazarlo limpiamente
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

                    // Actualizar el tooltip inmediatamente después de cambiar estado
                    const newS = state.selectedDescartes.get(item.label) || 0;
                    showChipTooltip(e, item, newS);
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
            remainder = remainder.replace(/^ID\s*(CALL\/LIVE|CALL|LIVE|LLAMADA)?\s*[:=-]?\s*/i, '').trim();
            remainder = remainder.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
            if (remainder && remainder.length >= 4) {
                state.callIds.add(remainder);
            }
            showToast(`💬 Chat ID sumado (${state.chatIds.size}): ${uuidMatches.join(' / ')}`, 'info');
            return;
        }

        // 2. Si contiene palabras explícitas de Chat
        if (/CHAT/i.test(raw)) {
            let cleanChat = raw.replace(/^CHAT\s*(ID)?\s*[:=-]?\s*/i, '').trim();
            cleanChat = cleanChat.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
            if (cleanChat) {
                state.chatIds.add(cleanChat);
                showToast(`💬 Chat ID sumado: ${cleanChat}`, 'info');
            }
            return;
        }

        // 3. De lo contrario, se guarda como ID de Llamada
        let cleanCall = raw.replace(/^ID\s*(CALL\/LIVE|CALL|LIVE|LLAMADA)?\s*[:=-]?\s*/i, '').trim();
        cleanCall = cleanCall.replace(/^[/\s|,-]+|[/\s|,-]+$/g, '').trim();
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

    function parseSmartInput(rawText) {
        if (!rawText || typeof rawText !== 'string') return false;
        if (!isFullTemplate(rawText)) return false;

        // 1. Teléfono / Celular / Contacto
        const telMatch = rawText.match(/(?:tel[ée]fono|celular|contacto)\s*:\s*([^\r\n]+)/i);
        if (telMatch && elements.genTelefono) {
            const cleanTel = telMatch[1].replace(/[^0-9]/g, '').trim();
            if (cleanTel) elements.genTelefono.value = cleanTel;
        }

        // 2. Problema / Falla
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

        // 4. SOT / Remedy
        const sotMatch = rawText.match(/(?:sot\s*\/\s*remedy|sot|remedy)\s*:\s*([^\r\n]+)/i);
        if (sotMatch && elements.genSot) {
            const cleanSot = sotMatch[1].trim();
            if (cleanSot && cleanSot.toUpperCase() !== 'N/A') {
                elements.genSot.value = cleanSot;
            }
        }

        // 5. Contact ID (Llamada / Chat)
        const contactMatch = rawText.match(/(?:id\s*call\/live|id\s*de\s*llamada|id\s*llamada|id\s*call)\s*[:=-]?\s*([^\r\n]+)/i);
        if (contactMatch && elements.genContactId) {
            processAndStoreContactText(contactMatch[1]);
            updateContactInputField();
        }

        // 6. Servicio (Detección por palabra clave o problema)
        const upper = rawText.toUpperCase();
        let detectedService = null;
        if (upper.includes('IPTV') || upper.includes('DECO')) detectedService = 'IPTV';
        else if (upper.includes('CLARO VIDEO') || upper.includes('APPS')) detectedService = 'CLARO VIDEO';
        else if (upper.includes('TELEFONIA') || upper.includes('TELEFONÍA') || upper.includes('LINEA') || upper.includes('LÍNEA')) detectedService = 'TELEFONÍA';
        else if (upper.includes('INTERNET') || upper.includes('HFC') || upper.includes('FTTH') || upper.includes('ONT') || upper.includes('ROUTER')) detectedService = 'INTERNET';

        if (detectedService && elements.genServicio) {
            elements.genServicio.value = detectedService;
            populateProblems(detectedService, true);
        }

        // 7. Descartes (Extraer bloque completo entre Descartes y el siguiente campo)
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

        // Si no se encontró bloque "Descartes:", pero es formato Mantenimiento (primeras líneas son descartes)
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

        renderGeneratorPreviews();
        showToast('✨ Plantilla detectada: campos autocompletados con éxito');
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

    // Configurar escucha inteligente de pegado de plantillas completas en los campos del generador
    setupSmartPasteListener(elements.genDescartes);
    setupSmartPasteListener(elements.genProblema);
    setupSmartPasteListener(elements.genTelefono);
    setupSmartPasteListener(elements.genSolucion);

    function formatDescartesLines(rawText) {
        if (!rawText || !rawText.trim()) return 'Descartes: N/A';

        // Separar tanto por saltos de línea como por comas y punto y coma
        const items = rawText.split(/[\r\n,;]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => {
                // Limpiar viñetas si las tuviera al inicio (- , * , • , 1. , 1) )
                let clean = s.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)/, '')
                    .replace(/^Er\s+intento\b/i, '1er intento')
                    .replace(/^Do\s+intento\b/i, '2do intento')
                    .replace(/^33er\s+intento\b/i, '3er intento')
                    .trim();
                if (!clean) return '';
                // Asegurar mayúscula inicial en cada elemento de descarte si no empieza por número
                return clean.charAt(0).toUpperCase() + clean.slice(1);
            })
            .filter(s => s.length > 0);

        if (items.length === 0) return 'Descartes: N/A';

        const prefix = 'Descartes: ';
        return prefix + items[0] + (items.length > 1 ? '\n' + items.slice(1).join('\n') : '');
    }

    function formatDescartesLinesWsp(rawText) {
        if (!rawText || !rawText.trim()) return 'DESCARTES REALIZADOS: N/A';

        // Separar tanto por saltos de línea como por comas y punto y coma
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
        const tagsStr = state.selectedHashtags.size > 0 ? Array.from(state.selectedHashtags).join(' ') : 'N/A';

        const contactLines = getFormattedContactLines();

        const isWsp = state.siacTemplateMode === 'wsp';
        const isAutoCiclo = rawDescartesInput ? checkIsCiclo(rawDescartesInput) : false;
        const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;

        // Actualizar UI del Switch de Plantilla (Estándar vs Oficial Cliente Claro)
        if (elements.btnToggleSiacMode && elements.labelSiacMode) {
            elements.labelSiacMode.textContent = isWsp ? 'Oficial Cliente Claro' : 'Estándar';
            if (isWsp) {
                elements.btnToggleSiacMode.classList.add('active');
            } else {
                elements.btnToggleSiacMode.classList.remove('active');
            }
        }

        // Actualizar UI del Switch / Badge de Ciclo (siempre disponible para alternar manualmente)
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

        // Manejo adaptativo del campo Solución según el protocolo de Ciclo 2x3 (3 ciclos en 2 días)
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
                // Deshabilitado discretamente en 1er ciclo
                elements.genSolucion.disabled = true;
                elements.genSolucion.style.opacity = '0.6';
                elements.genSolucion.style.cursor = 'not-allowed';
                elements.genSolucion.style.backgroundColor = 'var(--bg-secondary)';
            } else {
                // Habilitado normalmente
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

        // Template SIAC (Standard, Ciclo de Llamada, 1era LLAMADA + WSP, o Rellamadas Ciclo)
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

        // Template Mantenimiento (MANTO) - Formato de Plataforma para Técnicos
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

        // 1. Número de Contacto (Móvil 9 dígitos o Fijo mín. 6 dígitos)
        const telefono = (elements.genTelefono ? elements.genTelefono.value : '').trim();
        const digitsOnly = telefono.replace(/\D/g, '');
        if (!telefono || digitsOnly.length < 6 || telefono.toUpperCase() === 'N/A') {
            missingFieldNames.push('Número de Contacto (Móvil 9 dígitos o Fijo de casa mín. 6 dígitos)');
            if (elements.genTelefono) missingElements.push(elements.genTelefono);
        }

        // 2. Descripción / Problema del Cliente (Solo requerido en modo atención normal)
        if (!isCiclo) {
            const problema = (elements.genProblema ? elements.genProblema.value : '').trim();
            if (!problema || problema.toUpperCase() === 'N/A') {
                missingFieldNames.push('Descripción del Cliente / Problema');
                if (elements.genProblema) missingElements.push(elements.genProblema);
            }
        }

        // 3. Descartes Realizados / Intento de Ciclo
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
        // Auto-corregir campos de texto antes de la validación y del copiado
        if (elements.genSolucion && elements.genSolucion.value) {
            elements.genSolucion.value = autoCorrectText(elements.genSolucion.value, false);
        }
        if (elements.genDescartes && elements.genDescartes.value) {
            elements.genDescartes.value = autoCorrectText(elements.genDescartes.value, false);
        }
        renderGeneratorPreviews();

        const validation = validateTemplateRequirements();
        if (!validation.isValid) {
            // Animar campos faltantes con vibración roja
            validation.missingElements.forEach(el => {
                el.classList.remove('input-invalid');
                void el.offsetWidth;
                el.classList.add('input-invalid');
            });

            // Enfocar o hacer scroll al primer elemento que falta
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

    // Toggle entre Formatos de Plantilla (Estándar vs Oficial Cliente Claro)
    if (elements.btnToggleSiacMode) {
        elements.btnToggleSiacMode.addEventListener('click', () => {
            state.siacTemplateMode = state.siacTemplateMode === 'wsp' ? 'standard' : 'wsp';
            localStorage.setItem('bo_siac_template_mode', state.siacTemplateMode);
            showToast(state.siacTemplateMode === 'wsp' ? 'Formato cambiado a: Oficial Cliente Claro' : 'Formato cambiado a: SIAC Estándar', 'info');
            renderGeneratorPreviews();
        });
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

    // Copy Buttons for Generator con Validación Estricta
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
        elements.trackerCaseInput.addEventListener('input', function () {
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


    }
    const btnChangelog = document.getElementById('btnChangelog');
    const changelogModal = document.getElementById('changelogModal');
    const changelogModalClose = document.getElementById('changelogModalClose');
    const APP_VERSION = '2.8.1';

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
    if (changelogModal) {
        changelogModal.addEventListener('click', (e) => {
            if (e.target === changelogModal) {
                changelogModal.classList.remove('active');
            }
        });

        // Abrir automáticamente el modal de novedades solo una vez por versión en el navegador
        try {
            const seenVersion = localStorage.getItem('bo_seen_changelog_version');
            if (seenVersion !== APP_VERSION) {
                setTimeout(() => {
                    changelogModal.classList.add('active');
                    localStorage.setItem('bo_seen_changelog_version', APP_VERSION);
                }, 600);
            }
        } catch (e) {
            console.warn('No se pudo acceder a localStorage para changelog version', e);
        }
    }

    // Setup Remedy Modal & Logic (Soporte Multi-Servicio & Vistas Personalizadas)

    // ==========================================================================
    // INICIALIZACIÓN DE MÓDULOS DE APLICACIÓN
    // ==========================================================================
    if (window.BO_MODULES) {
        if (window.BO_MODULES.autocorrect?.init) window.BO_MODULES.autocorrect.init(state, elements);
        if (window.BO_MODULES.predictive?.init) window.BO_MODULES.predictive.init(state, elements);
        if (window.BO_MODULES.niveles?.init) window.BO_MODULES.niveles.init(state, elements);
        if (window.BO_MODULES.equipos?.init) window.BO_MODULES.equipos.init(state, elements);
        if (window.BO_MODULES.plantillasCustom?.init) window.BO_MODULES.plantillasCustom.init(state, elements);
        if (window.BO_MODULES.remedy?.init) window.BO_MODULES.remedy.init(state, elements);
        if (window.BO_MODULES.historial?.init) window.BO_MODULES.historial.init(state, elements);
        if (window.BO_MODULES.sidebars?.init) window.BO_MODULES.sidebars.init(state, elements);
    }

    // Inicializar pestañas principales
    initGeneratorTab();
    initTrackerTab();
});
