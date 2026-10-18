/* ==========================================================================
   GLOBAL HITSS - BACK OFFICE PLANTILLEITOR ORCHESTRATOR (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Override hashtags to only keep #MANTENIMIENTO+CAMBIO A DOCSIS 3.1
    if (typeof BO_DATASET !== 'undefined') {
        BO_DATASET.hashtags = [
            { tag: '#MANTENIMIENTO+CAMBIO A DOCSIS 3.1', description: 'Mantenimiento + Cambio a DOCSIS 3.1' }
        ];
    }

    // 1. Estado Centralizado de la Aplicación
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

    // Auto-limpieza de frases aprendidas en localStorage
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

                const seen = new Set();
                state.learnedPhrases[cat] = state.learnedPhrases[cat].filter(p => {
                    const norm = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    if (seen.has(norm)) return false;
                    seen.add(norm);
                    let inBase = false;
                    if (cat === 'problemas') {
                        const allBase = Object.values(BO_DATASET?.problemsByService || {}).flat();
                        inBase = allBase.some(b => b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === norm);
                    } else {
                        inBase = ((BO_DATASET?.predictiveCorpus && BO_DATASET.predictiveCorpus[cat]) || [])
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

    // Plantillas personalizadas por defecto si está vacío
    if (state.customTemplates.length === 0) {
        state.customTemplates = [];
    }

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

    // 2. Aplicar Tema (Oscuro / Claro)
    document.documentElement.setAttribute('data-theme', state.theme);

    // 3. Mapeo Centralizado de Elementos DOM
    const elements = {
        themeBtn: document.getElementById('themeToggleBtn'),

        // Tab 1: Generador
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

        // Tab 2: Tracker
        trackerCaseInput: document.getElementById('trackerCaseInput'),
        btnTrackerAdd: document.getElementById('btnTrackerAdd'),
        trackerTimeline: document.getElementById('trackerTimeline'),
        btnClearTracker: document.getElementById('btnClearTracker'),
        trackerCount: document.getElementById('trackerCount'),
        navTrackerCount: document.getElementById('navTrackerCount'),

        // Tab 4: Equipos Modal Viewer
        eqSearch: document.getElementById('eqSearch'),
        eqCard: document.getElementById('eqCard'),
        eqEmpty: document.getElementById('eqEmpty'),
        eqCardImg: document.getElementById('eqCardImg'),
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

    // 4. Alternancia de Tema (Modo Claro / Oscuro)
    if (elements.themeBtn) {
        elements.themeBtn.addEventListener('click', () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', state.theme);
            localStorage.setItem('bo_theme', state.theme);
            elements.themeBtn.innerHTML = state.theme === 'dark' ? '🌙' : '☀️';
        });
        elements.themeBtn.innerHTML = state.theme === 'dark' ? '🌙' : '☀️';
    }

    // 5. Navegación entre Pestañas Principales
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

        if (targetId === 'tab-custom' && window.renderCustomTemplates) window.renderCustomTemplates();
        if (targetId === 'tab-history') {
            if (window.renderHistoryTable) window.renderHistoryTable();
            if (window.renderLatestFullCases) window.renderLatestFullCases();
        }
    }

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    // 6. Modal de Novedades / Changelog
    const btnChangelog = document.getElementById('btnChangelog');
    const changelogModal = document.getElementById('changelogModal');
    const changelogModalClose = document.getElementById('changelogModalClose');
    const APP_VERSION = '2.8.2';

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

    // ==========================================================================
    // 7. ARRANQUE MODULAR AUTOMÁTICO (INICIALIZACIÓN DE MÓDULOS)
    // ==========================================================================
    if (window.BO_MODULES) {
        // Motores (Engines)
        if (window.BO_MODULES.autocorrect?.init) window.BO_MODULES.autocorrect.init(state, elements);
        if (window.BO_MODULES.predictive?.init) window.BO_MODULES.predictive.init(state, elements);
        if (window.BO_MODULES.caseParser?.init) window.BO_MODULES.caseParser.init(state, elements);
        if (window.BO_MODULES.categoryPredictor?.init) window.BO_MODULES.categoryPredictor.init(state, elements);
        if (window.BO_MODULES.sidebars?.init) window.BO_MODULES.sidebars.init(state, elements);

        // Pestañas (Tabs)
        if (window.BO_MODULES.generator?.init) window.BO_MODULES.generator.init(state, elements);
        if (window.BO_MODULES.tracker?.init) window.BO_MODULES.tracker.init(state, elements);
        if (window.BO_MODULES.niveles?.init) window.BO_MODULES.niveles.init(state, elements);
        if (window.BO_MODULES.equipos?.init) window.BO_MODULES.equipos.init(state, elements);
        if (window.BO_MODULES.plantillasCustom?.init) window.BO_MODULES.plantillasCustom.init(state, elements);
        if (window.BO_MODULES.remedy?.init) window.BO_MODULES.remedy.init(state, elements);
        if (window.BO_MODULES.historial?.init) window.BO_MODULES.historial.init(state, elements);
    }
});
