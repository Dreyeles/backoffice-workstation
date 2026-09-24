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
        eqImage: document.getElementById('eqImage'),
        eqImagePlaceholder: document.getElementById('eqImagePlaceholder'),
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
    // MOTOR DE AUTOCORRECCIÓN ORTOGRÁFICA & ABREVIATURAS TELECOM (Ámbito Global)
    // ==========================================================================
    function autoCorrectText(text, preserveTrailingSpaces = true) {
        if (!text) return '';

        // Capturar espacios o saltos de línea al final para preservarlos intactos durante el tipeo
        const trailingMatch = text.match(/\s*$/);
        const trailingWhitespace = preserveTrailingSpaces && trailingMatch ? trailingMatch[0] : '';

        let cleaned = text;

        // 1. Normalización de espacios y comas múltiples
        cleaned = cleaned.replace(/\s+,/g, ','); // Quitar espacios antes de la coma
        cleaned = cleaned.replace(/,([^\s,])/g, ', $1'); // Asegurar espacio tras la coma si le sigue un texto
        cleaned = cleaned.replace(/,{2,}/g, ','); // Limpiar comas duplicadas

        const corrections = [
            // Verbos y combinaciones contextuales comunes
            { regex: /\b(se reinicio)\b/gi, replacement: 'se reinició' },
            { regex: /\b(se cambio)\b/gi, replacement: 'se cambió' },
            { regex: /\b(se realizo)\b/gi, replacement: 'se realizó' },
            { regex: /\b(se valido)\b/gi, replacement: 'se validó' },
            { regex: /\b(se efectuo)\b/gi, replacement: 'se efectuó' },
            { regex: /\b(se configuro)\b/gi, replacement: 'se configuró' },
            { regex: /\b(se verifico)\b/gi, replacement: 'se verificó' },
            { regex: /\b(se apago)\b/gi, replacement: 'se apagó' },
            { regex: /\b(se encendio)\b/gi, replacement: 'se encendió' },
            { regex: /\b(se derivo)\b/gi, replacement: 'se derivó' },
            { regex: /\b(se conecto)\b/gi, replacement: 'se conectó' },
            { regex: /\b(se desconecto)\b/gi, replacement: 'se desconectó' },

            // Verbos comunes de atención en pasado (3ra persona singular con tilde)
            { regex: /\b(educo)\b/gi, replacement: 'educó' },
            { regex: /\b(informo)\b/gi, replacement: 'informó' },
            { regex: /\b(valido)\b/gi, replacement: 'validó' },
            { regex: /\b(realizo)\b/gi, replacement: 'realizó' },
            { regex: /\b(coordino)\b/gi, replacement: 'coordinó' },
            { regex: /\b(genero)\b/gi, replacement: 'generó' },
            { regex: /\b(soluciono)\b/gi, replacement: 'solucionó' },
            { regex: /\b(indico)\b/gi, replacement: 'indicó' },
            { regex: /\b(atendio)\b/gi, replacement: 'atendió' },
            { regex: /\b(comunico)\b/gi, replacement: 'comunicó' },
            { regex: /\b(confirmo)\b/gi, replacement: 'confirmó' },
            { regex: /\b(cancelo)\b/gi, replacement: 'canceló' },
            { regex: /\b(reporto)\b/gi, replacement: 'reportó' },
            { regex: /\b(envio)\b/gi, replacement: 'envió' },
            { regex: /\b(ingreso)\b/gi, replacement: 'ingresó' },
            { regex: /\b(verifico)\b/gi, replacement: 'verificó' },
            { regex: /\b(conecto)\b/gi, replacement: 'conectó' },
            { regex: /\b(desconecto)\b/gi, replacement: 'desconectó' },
            { regex: /\b(solicito)\b/gi, replacement: 'solicitó' },
            { regex: /\b(explico)\b/gi, replacement: 'explicó' },
            { regex: /\b(respondio)\b/gi, replacement: 'respondió' },
            { regex: /\b(apago)\b/gi, replacement: 'apagó' },
            { regex: /\b(encendio)\b/gi, replacement: 'encendió' },
            { regex: /\b(derivo)\b/gi, replacement: 'derivó' },
            { regex: /\b(probo)\b/gi, replacement: 'probó' },
            { regex: /\b(configuro)\b/gi, replacement: 'configuró' },

            // Acrónimos estándar en telecomunicaciones y redes
            { regex: /\b(ont|onts)\b/gi, replacement: 'ONT' },
            { regex: /\b(stb|stbs)\b/gi, replacement: 'STB' },
            { regex: /\b(gpon)\b/gi, replacement: 'GPON' },
            { regex: /\b(ftth)\b/gi, replacement: 'FTTH' },
            { regex: /\b(hfc)\b/gi, replacement: 'HFC' },
            { regex: /\b(cpe|cpes)\b/gi, replacement: 'CPE' },
            { regex: /\b(snr)\b/gi, replacement: 'SNR' },
            { regex: /\b(dns)\b/gi, replacement: 'DNS' },
            { regex: /\b(dhcp)\b/gi, replacement: 'DHCP' },
            { regex: /\b(sot)\b/gi, replacement: 'SOT' },
            { regex: /\b(ip|ips)\b/gi, replacement: 'IP' },
            { regex: /\b(mac)\b/gi, replacement: 'MAC' },
            { regex: /\b(tx)\b/gi, replacement: 'TX' },
            { regex: /\b(rx)\b/gi, replacement: 'RX' },
            { regex: /\b(dbm)\b/gi, replacement: 'dBm' },
            { regex: /\b(ssid)\b/gi, replacement: 'SSID' },
            { regex: /\b(wan)\b/gi, replacement: 'WAN' },
            { regex: /\b(lan)\b/gi, replacement: 'LAN' },
            { regex: /\b(catv)\b/gi, replacement: 'CATV' },
            { regex: /\b(iptv)\b/gi, replacement: 'IPTV' },
            { regex: /\b(voip)\b/gi, replacement: 'VoIP' },
            { regex: /\b(skyway)\b/gi, replacement: 'Skyway' },
            { regex: /\b(youbora)\b/gi, replacement: 'Youbora' },

            // Errores tipográficos por tipeo veloz y palabras técnicas
            { regex: /\b(deconectar|desconectar)\b/gi, replacement: 'desconectar' },
            { regex: /\b(deconecta|desconecta)\b/gi, replacement: 'desconecta' },
            { regex: /\b(deconectado|desconectado)\b/gi, replacement: 'desconectado' },
            { regex: /\b(nches|nche)\b/gi, replacement: 'noches' },
            { regex: /\b(ruter|rotuer)\b/gi, replacement: 'router' },
            { regex: /\b(modem|modems)\b/gi, replacement: 'módem' },
            { regex: /\b(cabledo|cablado|cabliado)\b/gi, replacement: 'cableado' },
            { regex: /\b(servcio|servico|servisios)\b/gi, replacement: 'servicio' },
            { regex: /\b(coneccion|conexiion|conecion)\b/gi, replacement: 'conexión' },
            { regex: /\b(conexion)\b/gi, replacement: 'conexión' },
            { regex: /\b(instalacion)\b/gi, replacement: 'instalación' },
            { regex: /\b(verificacion)\b/gi, replacement: 'verificación' },
            { regex: /\b(atencion)\b/gi, replacement: 'atención' },
            { regex: /\b(operacion)\b/gi, replacement: 'operación' },
            { regex: /\b(dia)\b/gi, replacement: 'día' },
            { regex: /\b(dias)\b/gi, replacement: 'días' },
            { regex: /\b(tecnico)\b/gi, replacement: 'técnico' },
            { regex: /\b(tecnicos)\b/gi, replacement: 'técnicos' },
            { regex: /\b(parametros)\b/gi, replacement: 'parámetros' },
            { regex: /\b(informacion)\b/gi, replacement: 'información' },
            { regex: /\b(comunicacion)\b/gi, replacement: 'comunicación' },
            { regex: /\b(numero)\b/gi, replacement: 'número' },
            { regex: /\b(numeros)\b/gi, replacement: 'números' },
            { regex: /\b(senial|senales)\b/gi, replacement: 'señal' },
            { regex: /\b(solucion)\b/gi, replacement: 'solución' },
            { regex: /\b(revision)\b/gi, replacement: 'revisión' },
            { regex: /\b(configuracion)\b/gi, replacement: 'configuración' },
            { regex: /\b(provision)\b/gi, replacement: 'provisión' },
            { regex: /\b(validacion)\b/gi, replacement: 'validación' },
            { regex: /\b(intermitencia)\b/gi, replacement: 'intermitencia' },
            { regex: /\b(degradacion)\b/gi, replacement: 'degradación' },
            { regex: /\b(perdida|perdidas)\b/gi, replacement: 'pérdida' },
            { regex: /\b(caida|caidas)\b/gi, replacement: 'caída' },
            { regex: /\b(atenuacion)\b/gi, replacement: 'atenuación' },
            { regex: /\b(telefonia)\b/gi, replacement: 'telefonía' },
            { regex: /\b(navegacion)\b/gi, replacement: 'navegación' },
            { regex: /\b(transmision)\b/gi, replacement: 'transmisión' },
            { regex: /\b(recepcion)\b/gi, replacement: 'recepción' },

            // Abreviaturas y errores comunes de asesores
            { regex: /\b(cli|clie)\b/gi, replacement: 'cliente' },
            { regex: /\b(serv|srv)\b/gi, replacement: 'servicio' },
            { regex: /\b(prov)\b/gi, replacement: 'provisión' },
            { regex: /\b(config)\b/gi, replacement: 'configuración' },
            { regex: /\b(verif)\b/gi, replacement: 'verificación' },
            { regex: /\b(reini)\b/gi, replacement: 'reinicio' },
            { regex: /\b(soluc)\b/gi, replacement: 'solución' },
            { regex: /\b(telef|tlf)\b/gi, replacement: 'teléfono' },
            { regex: /\b(buzon)\b/gi, replacement: 'buzón' },
            { regex: /\b(linea)\b/gi, replacement: 'línea' },
            { regex: /\b(veloc|velocid)\b/gi, replacement: 'velocidad' },
            { regex: /\b(descon)\b/gi, replacement: 'desconectado' },
            { regex: /\b(conect)\b/gi, replacement: 'conectado' },
            { regex: /\b(cablead)\b/gi, replacement: 'cableado' },
            { regex: /\b(equip|eq)\b/gi, replacement: 'equipo' },
            { regex: /\b(nocontesta)\b/gi, replacement: 'no contesta' },
            { regex: /\b(wsp|wa|wha)\b/gi, replacement: 'WhatsApp' },
            { regex: /\b(msj|msg)\b/gi, replacement: 'mensaje' },

            // Nombres de herramientas y plataformas
            { regex: /\b(incognito|incog)\b/gi, replacement: 'Incógnito' },
            { regex: /\b(schaman)\b/gi, replacement: 'Schaman' },
            { regex: /\b(tr069|tr69)\b/gi, replacement: 'TR69' },
            { regex: /\b(hygeia)\b/gi, replacement: 'Hygeia' },
            { regex: /\b(tracer)\b/gi, replacement: 'Tracer' },
            { regex: /\b(remedy)\b/gi, replacement: 'Remedy' },
            { regex: /\b(siac)\b/gi, replacement: 'SIAC' },
            { regex: /\b(sga)\b/gi, replacement: 'SGA' },
            { regex: /\b(skyway)\b/gi, replacement: 'Skyway' },
            { regex: /\b(youbora)\b/gi, replacement: 'Youbora' },
            { regex: /\b(cbio)\b/gi, replacement: 'CBIO' },
            { regex: /\b(ims)\b/gi, replacement: 'IMS' }
        ];

        corrections.forEach(c => {
            cleaned = cleaned.replace(c.regex, c.replacement);
        });

        // Asegurar mayúscula inicial en cada línea y tras viñetas (- , * , 1. ) o comas / punto y coma
        cleaned = cleaned.split('\n').map(line => {
            if (!line) return '';

            // 1. Capitalizar tras viñetas reales (- , * , • , 1. , 1) ) o inicio de línea
            let res = line.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)([a-záéíóúñ])/i, (m, prefix, char) => prefix + char.toUpperCase())
                .replace(/^(\s*)([a-záéíóúñ])/i, (m, prefix, char) => prefix + char.toUpperCase());

            // 2. Capitalizar la primera letra después de cada coma o punto y coma seguido de espacio
            res = res.replace(/(,\s*)([a-záéíóúñ])/g, (m, sep, char) => sep + char.toUpperCase());
            res = res.replace(/(;\s*)([a-záéíóúñ])/g, (m, sep, char) => sep + char.toUpperCase());

            return res;
        }).join('\n');

        if (preserveTrailingSpaces && trailingWhitespace && !cleaned.endsWith(trailingWhitespace)) {
            cleaned = cleaned.replace(/\s*$/, '') + trailingWhitespace;
        }

        return cleaned;
    }

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

    // =========================================================================
    // PREDICTIVE TEXT ENGINE (SMART GHOST TEXT + TAB AUTOCOMPLETE + DROPDOWN)
    // =========================================================================

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

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

            // Umbrales HFC
            // DS SNR >= 33.5 dB
            // DS Potencia: -15.0 a 20.9 dBmV
            // US SNR >= 28.0 dB
            // US Potencia: 35.0 a 57.0 dBmV
            const isDsSnrBad = (v) => v !== null && v !== undefined && v < 33.5;
            const isDsPotBad = (v) => v !== null && v !== undefined && (v < -15 || v > 20.9);
            const isUsSnrBad = (v) => v !== null && v !== undefined && v < 28;
            const isUsPotBad = (v) => v !== null && v !== undefined && (v < 35 || v > 57);

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

            const totalBadParams = (dsSnrHasBad ? 1 : 0) + (dsPotHasBad ? 1 : 0) + (usSnrHasBad ? 1 : 0) + (usPotHasBad ? 1 : 0);
            const bothDsBad = dsSnrHasBad && dsPotHasBad;

            // Regla solicitada:
            // "el rojo solo se debe activar cuando en ds snr y pontencia downstream están mal también se debe activar en rojo si en la misma fila hay 2 o mas fuera de rango"
            const triggerRed = bothDsBad || hasRowWithMultipleBad || totalBadParams >= 2;

            const validate = (values, checkBadFn, min, max, unit = 'dB', checkVariation = false) => {
                if (!values || values.length === 0) return { status: 'UNKNOWN', text: 'Esperando datos...' };
                const outOfRange = values.some(checkBadFn);
                const displayVals = values.length > 5 ? values.slice(0, 5).join(', ') + '...' : values.join(', ');

                // Variación de niveles en el bloque (Máx - Mín <= 4)
                let deltaInfo = '';
                let deltaExceeded = false;
                if (checkVariation && values.length > 1) {
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const delta = +(maxVal - minVal).toFixed(2);
                    deltaExceeded = delta > 4.0;
                    deltaInfo = ` [Δ: ${delta} ${unit}]`;
                }

                if (outOfRange) {
                    if (triggerRed) {
                        return {
                            status: 'ERROR',
                            text: `Fuera de Rango (${displayVals} ${unit})${deltaInfo}`
                        };
                    } else {
                        // Solo 1 parámetro / canal aislado fuera de rango sin cumplir condición roja -> Advertencia (Ámbar)
                        return {
                            status: 'WARNING',
                            text: `⚠️ Fuera de Rango (${displayVals} ${unit})${deltaInfo} [Alerta preventiva]`
                        };
                    }
                }

                if (deltaExceeded) {
                    return {
                        status: 'WARNING',
                        text: `⚠️ Observación - Variación en Bloque: Δ ${deltaInfo}`
                    };
                }

                return { status: 'OK', text: `Dentro del Rango (${displayVals} ${unit})${deltaInfo}` };
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

            const dsSnrRes = validate(dsSnr, isDsSnrBad, 33.5, null, 'dB', true);
            const dsPotRes = validate(dsPot, isDsPotBad, -15, 20.9, 'dBmV', false);
            const usSnrRes = validate(usSnr, isUsSnrBad, 28, null, 'dB', false);
            const usPotRes = validate(usPot, isUsPotBad, 35, 57, 'dBmV', false);

            setVisuals(elements.incResultUsSnr, usSnrRes, 'U/S SNR');
            setVisuals(elements.incResultDwsSnr, dsSnrRes, 'D/S SNR');
            setVisuals(elements.incResultDwsPot, dsPotRes, 'Potencia Downstream');
            setVisuals(elements.incResultUsPot, usPotRes, 'Potencia Upstream');

            // Actualizar Badge de Estado Global HFC
            if (elements.incGlobalBadge) {
                const hasAnyData = dsSnr || dsPot || usSnr || usPot;
                if (!hasAnyData) {
                    elements.incGlobalBadge.textContent = 'Esperando datos...';
                    elements.incGlobalBadge.style.backgroundColor = 'transparent';
                    elements.incGlobalBadge.style.color = 'var(--text-muted)';
                    elements.incGlobalBadge.style.border = '1px dashed var(--border-color)';
                } else if (triggerRed && (dsSnrHasBad || dsPotHasBad || usSnrHasBad || usPotHasBad)) {
                    elements.incGlobalBadge.textContent = '🔴 FALLA CRÍTICA (ROJO)';
                    elements.incGlobalBadge.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    elements.incGlobalBadge.style.color = '#dc3545';
                    elements.incGlobalBadge.style.border = '1px solid #dc3545';
                } else if (totalBadParams === 1 || dsSnrRes.status === 'WARNING' || dsPotRes.status === 'WARNING') {
                    elements.incGlobalBadge.textContent = '⚠️ OBSERVACIÓN (ÁMBAR)';
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
                    if (text && applySmartHfcBlock(text)) {
                        if (elements.incSmartPaste) elements.incSmartPaste.value = text;
                    } else {
                        showToast('No se reconocieron parámetros HFC en el portapapeles', 'warning');
                        if (elements.incSmartPaste) elements.incSmartPaste.focus();
                    }
                } catch (err) {
                    showToast('Pega el texto directamente en el cuadro de Pegado Inteligente', 'info');
                    if (elements.incSmartPaste) elements.incSmartPaste.focus();
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
                    if (text && applySmartFtthBlock(text)) {
                        if (elements.ftthSmartPaste) elements.ftthSmartPaste.value = text;
                    } else {
                        showToast('No se reconocieron niveles FTTH en el portapapeles', 'warning');
                        if (elements.ftthSmartPaste) elements.ftthSmartPaste.focus();
                    }
                } catch (err) {
                    showToast('Pega el reporte directamente en el cuadro de Pegado Inteligente FTTH', 'info');
                    if (elements.ftthSmartPaste) elements.ftthSmartPaste.focus();
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

        // Equipment Identifier Logic
        if (elements.eqSearchInput) {
            elements.eqSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toUpperCase();

                if (query.length < 2) {
                    elements.eqResultContainer.style.display = 'none';
                    return;
                }

                // Search in dataset (equiposClaro / modelosData)
                if (typeof equiposClaro !== 'undefined' || typeof modelosData !== 'undefined') {
                    const normalizeEquip = (str) => {
                        if (!str) return '';
                        return str.toString().toUpperCase()
                            .replace(/@/g, 'A')
                            .replace(/\bCM\b/g, '')
                            .replace(/[^A-Z0-9]/g, '');
                    };

                    const cleanQuery = query.replace(/[^A-Z0-9]/g, '');
                    const normQuery = normalizeEquip(query);

                    // Buscar en dataset normalizado
                    const dataset = typeof equiposClaro !== 'undefined' ? equiposClaro : Object.keys(modelosData).map(k => ({
                        codigo: k,
                        modelo: modelosData[k].modelo || k,
                        vendor: modelosData[k].vendor || '',
                        nombre: modelosData[k].nombre,
                        aliases: modelosData[k].aliases || [],
                        docsis: modelosData[k].docsis || '',
                        wifi: modelosData[k].wifi || '',
                        red: modelosData[k].red || (modelosData[k].nombre.includes('ONT') || k.startsWith('HG') || k.startsWith('ZX') || k.startsWith('F6') || k.includes('5670') ? 'FTTH' : 'HFC'),
                        firmware: modelosData[k].firmware || '',
                        plataformas: modelosData[k].plataformas || 'INCOGNITO / REMOTO',
                        tipo: modelosData[k].tipo || 'Router / ONT',
                        homologado: modelosData[k].homologado !== false,
                        imagen: modelosData[k].img,
                        descripcion: modelosData[k].descripcion,
                        repetidor: modelosData[k].repetidor,
                        velocidad: modelosData[k].velocidad
                    }));

                    const result = dataset.find(eq => {
                        const codeClean = (eq.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const codeNorm = normalizeEquip(eq.codigo);
                        const modelClean = (eq.modelo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const modelNorm = normalizeEquip(eq.modelo);
                        const nameClean = (eq.nombre || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const nameNorm = normalizeEquip(eq.nombre);
                        const vendorClean = (eq.vendor || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

                        // Verificación directa en lista de aliases
                        const aliases = Array.isArray(eq.aliases) ? eq.aliases : [];
                        const aliasMatch = aliases.some(alias => {
                            const aClean = alias.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            const aNorm = normalizeEquip(alias);
                            return aClean === cleanQuery ||
                                aNorm === normQuery ||
                                aClean === normQuery ||
                                aNorm === cleanQuery ||
                                ((cleanQuery.length >= 3 || normQuery.length >= 3) && (
                                    (cleanQuery && (aClean.includes(cleanQuery) || cleanQuery.includes(aClean))) ||
                                    (normQuery && (aNorm.includes(normQuery) || normQuery.includes(aNorm)))
                                ));
                        });

                        if (aliasMatch) return true;

                        return codeClean.includes(cleanQuery) ||
                            (normQuery && codeNorm.includes(normQuery)) ||
                            cleanQuery.includes(codeClean) ||
                            (normQuery && normQuery.includes(codeNorm)) ||
                            modelClean.includes(cleanQuery) ||
                            (normQuery && modelNorm.includes(normQuery)) ||
                            cleanQuery.includes(modelClean) ||
                            (normQuery && normQuery.includes(modelNorm)) ||
                            nameClean.includes(cleanQuery) ||
                            (normQuery && nameNorm.includes(normQuery)) ||
                            eq.nombre.toUpperCase().includes(query) ||
                            (eq.codigo || '').toUpperCase().includes(query) ||
                            ((cleanQuery.length >= 3 || normQuery.length >= 3) && vendorClean.includes(cleanQuery || normQuery));
                    });

                    if (result) {
                        elements.eqResultContainer.style.display = 'block';
                        elements.eqName.textContent = result.nombre;
                        elements.eqType.textContent = result.tipo || 'Equipo Homologado';

                        // Badge Red (HFC vs FTTH)
                        if (elements.eqRed) {
                            const isFtth = (result.red || '').toUpperCase() === 'FTTH' || (result.tipo || '').toUpperCase().includes('FTTH');
                            if (isFtth) {
                                elements.eqRed.textContent = '🌐 Red: FTTH (Fibra)';
                                elements.eqRed.style.backgroundColor = 'rgba(20, 184, 166, 0.15)';
                                elements.eqRed.style.color = '#0d9488';
                                elements.eqRed.style.border = '1px solid rgba(20, 184, 166, 0.3)';
                            } else {
                                elements.eqRed.textContent = '🌐 Red: HFC (Coaxial)';
                                elements.eqRed.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                                elements.eqRed.style.color = '#d97706';
                                elements.eqRed.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                            }
                            elements.eqRed.style.display = 'inline-block';
                        }

                        // Badge Versión / Wi-Fi & DOCSIS
                        if (elements.eqVersion) {
                            const wifiStr = result.wifi || '';
                            const docsisStr = result.docsis || (result.red === 'FTTH' ? 'GPON' : 'DOCSIS');
                            elements.eqVersion.textContent = `📶 ${wifiStr ? wifiStr + ' ' : ''}(${docsisStr})`;

                            if (wifiStr.toLowerCase().includes('wifi 6') || (result.tipo || '').toUpperCase().includes('WI-FI 6')) {
                                elements.eqVersion.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                                elements.eqVersion.style.color = '#7c3aed';
                                elements.eqVersion.style.border = '1px solid rgba(139, 92, 246, 0.3)';
                            } else if (wifiStr.toLowerCase().includes('wifi 5') || (result.tipo || '').toUpperCase().includes('WI-FI 5')) {
                                elements.eqVersion.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                                elements.eqVersion.style.color = '#2563eb';
                                elements.eqVersion.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                            } else {
                                elements.eqVersion.style.backgroundColor = 'rgba(100, 116, 139, 0.15)';
                                elements.eqVersion.style.color = '#64748b';
                                elements.eqVersion.style.border = '1px solid rgba(100, 116, 139, 0.3)';
                            }
                            elements.eqVersion.style.display = 'inline-block';
                        }

                        // Badge Repetidor
                        if (elements.eqRepetidor) {
                            if (result.repetidor === 'SI') {
                                elements.eqRepetidor.textContent = '🟢 Compatible con Repetidor';
                                elements.eqRepetidor.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
                                elements.eqRepetidor.style.color = '#28a745';
                                elements.eqRepetidor.style.border = '1px solid rgba(40, 167, 69, 0.3)';
                            } else {
                                elements.eqRepetidor.textContent = '🔴 Sin Soporte Repetidor';
                                elements.eqRepetidor.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
                                elements.eqRepetidor.style.color = '#dc3545';
                                elements.eqRepetidor.style.border = '1px solid rgba(220, 53, 69, 0.3)';
                            }
                            elements.eqRepetidor.style.display = 'inline-block';
                        }

                        // Badge Velocidad
                        if (elements.eqSpeed) {
                            if (result.velocidad) {
                                elements.eqSpeed.textContent = `⚡ Hasta ${result.velocidad >= 1000 ? '1 Gbps (1000M)' : result.velocidad + ' Mbps'}`;
                                elements.eqSpeed.style.display = 'inline-block';
                            } else {
                                elements.eqSpeed.style.display = 'none';
                            }
                        }

                        // Badge Homologación
                        if (result.homologado) {
                            elements.eqStatus.textContent = "Homologado";
                            elements.eqStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
                            elements.eqStatus.style.color = '#28a745';
                            elements.eqStatus.style.border = '1px solid rgba(40, 167, 69, 0.3)';
                        } else {
                            elements.eqStatus.textContent = "No Homologado";
                            elements.eqStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
                            elements.eqStatus.style.color = '#dc3545';
                            elements.eqStatus.style.border = '1px solid rgba(220, 53, 69, 0.3)';
                        }

                        // Firmware oficial
                        if (elements.eqFirmware) {
                            if (result.firmware) {
                                elements.eqFirmware.innerHTML = `<strong>💾 Versión de FW Oficial:</strong> <span style="color:#60a5fa; font-weight:bold; font-family:monospace; margin-left:4px;">${escapeHtml(result.firmware)}</span>`;
                                elements.eqFirmware.style.display = 'block';
                            } else {
                                elements.eqFirmware.style.display = 'none';
                            }
                        }

                        // Plataformas de revisión
                        if (elements.eqPlataformas) {
                            if (result.plataformas) {
                                elements.eqPlataformas.innerHTML = `<strong>🛠️ Plataforma de Revisión:</strong> <span style="color:#34d399; font-weight:600; margin-left:4px;">${escapeHtml(result.plataformas)}</span>`;
                                elements.eqPlataformas.style.display = 'block';
                            } else {
                                elements.eqPlataformas.style.display = 'none';
                            }
                        }

                        // Descripción técnica
                        if (elements.eqDesc) {
                            elements.eqDesc.innerHTML = `<strong>ℹ️ Características:</strong> ${result.descripcion || 'Sin descripción adicional'}`;
                            elements.eqDesc.style.display = 'block';
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
                            elements.eqImagePlaceholder.textContent = 'Falta imagen (' + result.imagen + ')';
                        };
                    } else {
                        elements.eqResultContainer.style.display = 'block';
                        elements.eqName.textContent = "Equipo no encontrado";
                        elements.eqType.textContent = "Asegúrate de escribir bien el modelo";
                        elements.eqStatus.textContent = "Desconocido";
                        elements.eqStatus.style.backgroundColor = 'transparent';
                        elements.eqStatus.style.color = 'var(--text-muted)';
                        elements.eqStatus.style.border = '1px dashed var(--border-color)';

                        if (elements.eqRed) elements.eqRed.style.display = 'none';
                        if (elements.eqVersion) elements.eqVersion.style.display = 'none';
                        if (elements.eqRepetidor) elements.eqRepetidor.style.display = 'none';
                        if (elements.eqSpeed) elements.eqSpeed.style.display = 'none';
                        if (elements.eqFirmware) elements.eqFirmware.style.display = 'none';
                        if (elements.eqPlataformas) elements.eqPlataformas.style.display = 'none';
                        if (elements.eqDesc) elements.eqDesc.style.display = 'none';
                        if (elements.eqCredentials) elements.eqCredentials.style.display = 'none';

                        elements.eqImage.style.display = 'none';
                        elements.eqImagePlaceholder.style.display = 'block';
                        elements.eqImagePlaceholder.textContent = 'Sin imagen';
                    }
                }
            });

            // Quick Chips Click Handler
            document.querySelectorAll('.eq-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const model = chip.getAttribute('data-model');
                    if (model && elements.eqSearchInput) {
                        elements.eqSearchInput.value = model;
                        elements.eqSearchInput.dispatchEvent(new Event('input'));
                    }
                });
            });
        }

        renderTrackerTimeline();
    }

    // ==========================================================================
    // TAB 3: MIS PLANTILLAS PERSONALIZADAS
    // ==========================================================================

    // Helper para sustitución dinámica de variables en plantillas personalizadas ({sot}, {telefono}, etc.)
    function resolveTemplateVariables(templateContent) {
        if (!templateContent) return '';
        const currentSot = (elements.genSot && elements.genSot.value) ? elements.genSot.value.trim() : '';
        const sotReplacement = currentSot || 'xxxxx';

        const currentTel = (elements.genTelefono && elements.genTelefono.value) ? elements.genTelefono.value.trim() : '';
        const telReplacement = currentTel || 'xxxxx';

        const currentServicio = (elements.genServicio && elements.genServicio.value) ? elements.genServicio.value : 'INTERNET';
        const currentProblema = (elements.genProblema && elements.genProblema.value) ? elements.genProblema.value.trim() : 'xxxxx';
        const currentSolucion = (elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value.trim() : 'xxxxx';

        let resolved = templateContent;

        // Reemplazar {sot}, {SOT}, {codigo}, {ticket}, etc.
        resolved = resolved.replace(/\{(?:sot|SOT|codigo|código|codigo_sot|ticket|orden)\}/gi, sotReplacement);

        // Reemplazar otros placeholders estándar
        resolved = resolved.replace(/\{(?:telefono|teléfono|contacto|celular)\}/gi, telReplacement);
        resolved = resolved.replace(/\{(?:servicio)\}/gi, currentServicio);
        resolved = resolved.replace(/\{(?:problema|motivo)\}/gi, currentProblema);
        resolved = resolved.replace(/\{(?:solucion|solución)\}/gi, currentSolucion);

        return resolved;
    }

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
            const resolvedContent = resolveTemplateVariables(tmpl.content);
            const hasDynamicVars = tmpl.content.includes('{');

            card.innerHTML = `
                <div class="template-card-header">
                    <div>
                        <div class="template-card-title">${tmpl.title}</div>
                        <div style="display:flex; gap:0.35rem; align-items:center; margin-top:0.3rem; flex-wrap:wrap;">
                            <span class="badge badge-info">${tmpl.category}</span>
                            ${hasDynamicVars ? '<span class="badge" style="background:rgba(16, 185, 129, 0.15); color:#10b981; font-size:0.7rem; border:1px solid rgba(16, 185, 129, 0.3);">⚡ Auto-Variables</span>' : ''}
                        </div>
                    </div>
                    <div style="display:flex; gap:0.3rem;">
                        <button class="btn btn-sm edit-tmpl-btn" data-id="${tmpl.id}" title="Editar plantilla">✏️</button>
                        <button class="btn btn-sm del-tmpl-btn" data-id="${tmpl.id}" style="color:var(--danger);" title="Eliminar plantilla">🗑️</button>
                    </div>
                </div>
                <div class="template-card-preview" style="white-space:pre-wrap; line-height:1.45;">${resolvedContent}</div>
                <button class="btn btn-sm btn-primary copy-tmpl-btn" data-id="${tmpl.id}" style="margin-top:0.5rem; width:100%;">📋 Copiar Plantilla</button>
            `;

            // Edit Event
            card.querySelector('.edit-tmpl-btn').addEventListener('click', () => openTemplateModal(tmpl.id));
            // Delete Event
            card.querySelector('.del-tmpl-btn').addEventListener('click', () => deleteTemplate(tmpl.id));
            // Direct 1-Click Copy Event
            card.querySelector('.copy-tmpl-btn').addEventListener('click', () => {
                const textToCopy = resolveTemplateVariables(tmpl.content);
                copyToClipboard(textToCopy, `Plantilla "${tmpl.title}" copiada`);
                addHistoryRecord('Personalizada', tmpl.category || 'Plantilla', textToCopy);
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
    const APP_VERSION = '2.6.5';

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

    // Setup Remedy Modal & Logic (Soporte Multi-Servicio: INTERNET vs IPTV / Falla General)
    const btnOpenRemedyModal = document.getElementById('btnOpenRemedyModal');
    const remedyModal = document.getElementById('remedyModal');
    const remedyModalClose = document.getElementById('remedyModalClose');
    const btnRemedyTabRed = document.getElementById('btnRemedyTabRed');
    const btnRemedyTabGeneral = document.getElementById('btnRemedyTabGeneral');
    const remedyFormRed = document.getElementById('remedyFormRed');
    const remedyFormIptv = document.getElementById('remedyFormIptv');
    const remedyFormGeneral = document.getElementById('remedyFormGeneral');

    // Campos RED - INTERNET
    const remedyRedContacto = document.getElementById('remedyRedContacto');
    const remedyRedTelefono = document.getElementById('remedyRedTelefono');
    const remedyRedCustomerId = document.getElementById('remedyRedCustomerId');
    const remedyRedMac = document.getElementById('remedyRedMac');
    const remedyRedIp = document.getElementById('remedyRedIp');
    const remedyRedCmtsOlt = document.getElementById('remedyRedCmtsOlt');
    const remedyRedPaginas = document.getElementById('remedyRedPaginas');
    const remedyRedRedExterna = document.getElementById('remedyRedRedExterna');
    const remedyRedPlano = document.getElementById('remedyRedPlano');
    const remedyRedDescartes = document.getElementById('remedyRedDescartes');

    // Campos RED - IPTV (CANALES A RED)
    const remedyIptvContacto = document.getElementById('remedyIptvContacto');
    const remedyIptvTelefono = document.getElementById('remedyIptvTelefono');
    const remedyIptvCustomerId = document.getElementById('remedyIptvCustomerId');
    const remedyIptvPlano = document.getElementById('remedyIptvPlano');
    const remedyIptvCantDecos = document.getElementById('remedyIptvCantDecos');
    const remedyIptvSerieDecos = document.getElementById('remedyIptvSerieDecos');
    const remedyIptvCanales = document.getElementById('remedyIptvCanales');
    const remedyIptvGrilla = document.getElementById('remedyIptvGrilla');
    const remedyIptvDescartes = document.getElementById('remedyIptvDescartes');

    // Campos RED - TELEFONÍA (TELEFONÍA A RED)
    const remedyTelContacto = document.getElementById('remedyTelContacto');
    const remedyTelTelefono = document.getElementById('remedyTelTelefono');
    const remedyTelCustomerId = document.getElementById('remedyTelCustomerId');
    const remedyTelMac = document.getElementById('remedyTelMac');
    const remedyTelPlano = document.getElementById('remedyTelPlano');
    const remedyTelCmtsOlt = document.getElementById('remedyTelCmtsOlt');
    const remedyTelNumeroTel = document.getElementById('remedyTelNumeroTel');
    const remedyTelPlan = document.getElementById('remedyTelPlan');
    const remedyTelProblema = document.getElementById('remedyTelProblema');
    const remedyTelDescartes = document.getElementById('remedyTelDescartes');

    // Campos General
    const remedyInputFalla = document.getElementById('remedyInputFalla');
    const remedyInputId = document.getElementById('remedyInputId');
    const remedyInputDni = document.getElementById('remedyInputDni');
    const remedyInputCliente = document.getElementById('remedyInputCliente');
    const remedyInputDetalle = document.getElementById('remedyInputDetalle');

    const remedyDropZone = document.getElementById('remedyDropZone');
    const remedyImagesContainer = document.getElementById('remedyImagesContainer');
    const btnClearRemedyImages = document.getElementById('btnClearRemedyImages');
    const remedyVisualSheet = document.getElementById('remedyVisualSheet');
    const btnClearRemedyAll = document.getElementById('btnClearRemedyAll');
    const btnExportRemedyPdf = document.getElementById('btnExportRemedyPdf');
    const btnCopyRemedyWord = document.getElementById('btnCopyRemedyWord');
    const btnCopyRemedyText = document.getElementById('btnCopyRemedyText');

    // Lightbox Zoom Modal
    const imageZoomModal = document.getElementById('imageZoomModal');
    const imageZoomImg = document.getElementById('imageZoomImg');
    const btnCloseImageZoom = document.getElementById('btnCloseImageZoom');

    window.previewRemedyImageZoom = (imgSrc) => {
        if (imageZoomModal && imageZoomImg) {
            imageZoomImg.src = imgSrc;
            imageZoomModal.classList.add('active');
        }
    };

    if (btnCloseImageZoom && imageZoomModal) {
        btnCloseImageZoom.addEventListener('click', () => imageZoomModal.classList.remove('active'));
    }
    if (imageZoomModal) {
        imageZoomModal.addEventListener('click', (e) => {
            if (e.target === imageZoomModal) imageZoomModal.classList.remove('active');
        });
    }

    let remedyActiveMode = 'red'; // 'red' | 'general'
    let remedyImagesList = [];

    const getActiveService = () => (elements.genServicio?.value || 'INTERNET').toUpperCase();
    const isIptvActive = () => getActiveService() === 'IPTV';
    const isTelefoniaActive = () => getActiveService() === 'TELEFONIA';

    const setRemedyTab = (mode) => {
        remedyActiveMode = mode;
        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();

        if (btnRemedyTabRed) {
            if (isTelefonia) {
                btnRemedyTabRed.innerHTML = '📞 Telefonía a RED';
            } else if (isIptv) {
                btnRemedyTabRed.innerHTML = '📺 Canales a RED';
            } else {
                btnRemedyTabRed.innerHTML = '🌐 Páginas Web / Apps';
            }
        }

        if (mode === 'red') {
            if (btnRemedyTabRed) {
                btnRemedyTabRed.className = 'btn btn-sm btn-primary';
                btnRemedyTabRed.style.background = 'var(--primary)';
                btnRemedyTabRed.style.color = '#fff';
                btnRemedyTabRed.style.borderColor = 'var(--primary)';
            }
            if (btnRemedyTabGeneral) {
                btnRemedyTabGeneral.className = 'btn btn-sm';
                btnRemedyTabGeneral.style.background = 'transparent';
                btnRemedyTabGeneral.style.color = 'var(--text-muted)';
                btnRemedyTabGeneral.style.borderColor = 'var(--border-color)';
            }
            if (remedyFormRed) remedyFormRed.style.display = (!isIptv && !isTelefonia) ? 'block' : 'none';
            if (remedyFormIptv) remedyFormIptv.style.display = isIptv ? 'block' : 'none';
            if (remedyFormTelefonia) remedyFormTelefonia.style.display = isTelefonia ? 'block' : 'none';
            if (remedyFormGeneral) remedyFormGeneral.style.display = 'none';
        } else {
            if (btnRemedyTabGeneral) {
                btnRemedyTabGeneral.className = 'btn btn-sm btn-primary';
                btnRemedyTabGeneral.style.background = 'var(--primary)';
                btnRemedyTabGeneral.style.color = '#fff';
                btnRemedyTabGeneral.style.borderColor = 'var(--primary)';
            }
            if (btnRemedyTabRed) {
                btnRemedyTabRed.className = 'btn btn-sm';
                btnRemedyTabRed.style.background = 'transparent';
                btnRemedyTabRed.style.color = 'var(--text-muted)';
                btnRemedyTabRed.style.borderColor = 'var(--border-color)';
            }
            if (remedyFormRed) remedyFormRed.style.display = 'none';
            if (remedyFormIptv) remedyFormIptv.style.display = 'none';
            if (remedyFormTelefonia) remedyFormTelefonia.style.display = 'none';
            if (remedyFormGeneral) remedyFormGeneral.style.display = 'block';
        }
        updateRemedyPreview();
    };

    if (btnRemedyTabRed) btnRemedyTabRed.addEventListener('click', () => setRemedyTab('red'));
    if (btnRemedyTabGeneral) btnRemedyTabGeneral.addEventListener('click', () => setRemedyTab('general'));

    const getRemedyPlainText = () => {
        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();

        if (remedyActiveMode === 'red') {
            if (isTelefonia) {
                const contacto = remedyTelContacto?.value.trim() || '[Persona de Contacto]';
                const telefono = remedyTelTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de contacto]');
                const customerId = remedyTelCustomerId?.value.trim() || '[Customer ID]';
                const mac = remedyTelMac?.value.trim() || '[Dirección MAC]';
                const plano = remedyTelPlano?.value.trim() || '[Plano]';
                const cmtsOlt = remedyTelCmtsOlt?.value.trim() || '[(CMTS/OLT)]';
                const numeroTel = remedyTelNumeroTel?.value.trim() || (elements.genTelefono?.value.trim() || '[Número telefónico]');
                const plan = remedyTelPlan?.value.trim() || '[Plan contratado]';
                const problema = remedyTelProblema?.value.trim() || (elements.genProblema?.value.trim() || '[Descripción detallada del problema]');
                const descartes = remedyTelDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descartes de primer nivel realizados]');

                let text = `TELEFONÍA A RED:\n`;
                text += `Persona de Contacto: ${contacto}\n`;
                text += `Número de contacto: ${telefono}\n`;
                text += `Customer ID: ${customerId}\n`;
                text += `Dirección MAC: ${mac}\n`;
                text += `Plano: ${plano}\n`;
                text += `(CMTS/OLT): ${cmtsOlt}\n`;
                text += `Número telefónico: ${numeroTel}\n`;
                text += `Plan contratado: ${plan}\n`;
                text += `Descripción detallada del problema: ${problema}\n`;
                text += `Descartes de primer nivel realizados: ${descartes}\n`;
                text += `Evidencias:`;
                if (remedyImagesList.length > 0) {
                    text += `\n[${remedyImagesList.length} imagen(es) adjunta(s)]`;
                }
                return text;
            } else if (isIptv) {
                const contacto = remedyIptvContacto?.value.trim() || '[Persona de Contacto]';
                const telefono = remedyIptvTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de Contacto]');
                const customerId = remedyIptvCustomerId?.value.trim() || '[Customer ID]';
                const plano = remedyIptvPlano?.value.trim() || '[Plano]';
                const cantDecos = remedyIptvCantDecos?.value.trim() || '[Cantidad de decodificador(es)]';
                const serieDecos = remedyIptvSerieDecos?.value.trim() || '[N° Serie decos afectados]';
                const canales = remedyIptvCanales?.value.trim() || '[Canales afectados (N° - Nombre de Canal)]';
                const grilla = remedyIptvGrilla?.value.trim() || '[Grilla Claro TV actualizada]';
                const descartes = remedyIptvDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descripción detallada de DESCARTES realizados]');

                let text = `4. CANALES A RED:\n`;
                text += `Persona de Contacto: ${contacto}\n`;
                text += `Número de Contacto: ${telefono}\n`;
                text += `Customer ID: ${customerId}\n`;
                text += `Plano: ${plano}\n`;
                text += `Cantidad de decodificador(es): ${cantDecos}\n`;
                text += `N° Serie decos afectados: ${serieDecos}\n`;
                text += `Canales afectados (N° - Nombre de Canal): ${canales}\n`;
                text += `Grilla Claro TV actualizada: ${grilla}\n`;
                text += `Descripción detallada de DESCARTES realizados: ${descartes}\n`;
                text += `Evidencias:`;
                if (remedyImagesList.length > 0) {
                    text += `\n[${remedyImagesList.length} imagen(es) adjunta(s)]`;
                }
                return text;
            } else {
                const contacto = remedyRedContacto?.value.trim() || '[Persona de Contacto]';
                const telefono = remedyRedTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de contacto]');
                const customerId = remedyRedCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '[Customer ID]');
                const mac = remedyRedMac?.value.trim() || '[Dirección MAC Cable Módem]';
                const ip = remedyRedIp?.value.trim() || '[IP Pública(Cuál es mi IP)]';
                const paginas = remedyRedPaginas?.value.trim() || '[Páginas/Apps que no accede]';
                const redExterna = remedyRedRedExterna?.value.trim() || '[Desde que red puede acceder]';
                const cmtsOlt = remedyRedCmtsOlt?.value.trim() || '[CMTS/OLT]';
                const plano = remedyRedPlano?.value.trim() || '[Plano]';
                const descartes = remedyRedDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descartes o descripción detallada]');

                let text = `Persona de Contacto: ${contacto}\n`;
                text += `Número de contacto: ${telefono}\n`;
                text += `Customer ID: ${customerId}\n`;
                text += `Dirección MAC Cable Módem: ${mac}\n`;
                text += `IP Pública(Cuál es mi IP): ${ip}\n`;
                text += `Páginas/Apps que no accede : ${paginas}\n`;
                text += `Desde que red puede acceder: ${redExterna}\n`;
                text += `CMTS/OLT: ${cmtsOlt}\n`;
                text += `Plano: ${plano}\n`;
                text += `Descartes o descripción detallada del problema: ${descartes}\n`;
                text += `Evidencias:\n`;
                text += `Imagen del error con red CLARO\n`;
                text += `Imagen sin error con red diferente a CLARO\n`;
                text += `Ping desde la red de Claro\n`;
                text += `TracerTR desde la red de Claro\n`;
                text += `TracerTR desde la red diferente a Claro`;
                if (remedyImagesList.length > 0) {
                    text += `\n[${remedyImagesList.length} imagen(es) adjunta(s)]`;
                }
                return text;
            }
        } else {
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
        }
    };

    const renderRemedyVisualSheet = () => {
        if (!remedyVisualSheet) return;
        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();

        if (remedyActiveMode === 'red') {
            if (isTelefonia) {
                const contacto = remedyTelContacto?.value.trim() || '—';
                const telefono = remedyTelTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '—');
                const customerId = remedyTelCustomerId?.value.trim() || '—';
                const mac = remedyTelMac?.value.trim() || '—';
                const plano = remedyTelPlano?.value.trim() || '—';
                const cmtsOlt = remedyTelCmtsOlt?.value.trim() || '—';
                const numeroTel = remedyTelNumeroTel?.value.trim() || (elements.genTelefono?.value.trim() || '—');
                const plan = remedyTelPlan?.value.trim() || '—';
                const problema = remedyTelProblema?.value.trim() || (elements.genProblema?.value.trim() || '—');
                const descartes = remedyTelDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '—');

                let html = `
                        <div class="remedy-word-page">
                            <div class="remedy-word-title">
                                TELEFONÍA A RED:
                            </div>

                            <table class="remedy-word-table">
                                <tr>
                                    <td class="label-cell">Persona de Contacto:</td>
                                    <td class="value-cell">${contacto}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Número de contacto:</td>
                                    <td class="value-cell">${telefono}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Customer ID:</td>
                                    <td class="value-cell" style="font-weight:bold;">${customerId}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Dirección MAC:</td>
                                    <td class="value-cell" style="font-family:monospace;">${mac}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Plano:</td>
                                    <td class="value-cell">${plano}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">(CMTS/OLT):</td>
                                    <td class="value-cell">${cmtsOlt}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Número telefónico:</td>
                                    <td class="value-cell" style="font-weight:bold; color:#0284c7;">${numeroTel}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Plan contratado:</td>
                                    <td class="value-cell">${plan}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Descripción del problema:</td>
                                    <td class="value-cell" style="white-space:pre-wrap;">${problema}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Descartes de 1er nivel:</td>
                                    <td class="value-cell" style="white-space:pre-wrap;">${descartes}</td>
                                </tr>
                            </table>

                            <div class="remedy-word-section-title">Evidencias:</div>

                            ${remedyImagesList.length > 0 ? `
                                <div class="remedy-word-images">
                                    <div class="remedy-word-section-title" style="margin-bottom:8px;">Capturas Adjuntas:</div>
                                    ${remedyImagesList.map((img, i) => `
                                        <div class="remedy-word-img-wrapper">
                                            <div class="remedy-word-img-label">Evidencia #${i + 1} (Clic para ampliar):</div>
                                            <img src="${img}" class="remedy-word-img" alt="Evidencia ${i + 1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div style="margin-top:0.4rem; font-size:11.5px; color:#64748b; font-style:italic;">
                                    (Sin capturas adjuntas aún. Puedes pegar fotos de error o registros con Ctrl+V).
                                </div>
                            `}
                        </div>
                    `;
                remedyVisualSheet.innerHTML = html;
                return;
            }

            if (isIptv) {
                const contacto = remedyIptvContacto?.value.trim() || '—';
                const telefono = remedyIptvTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '—');
                const customerId = remedyIptvCustomerId?.value.trim() || '—';
                const plano = remedyIptvPlano?.value.trim() || '—';
                const cantDecos = remedyIptvCantDecos?.value.trim() || '—';
                const serieDecos = remedyIptvSerieDecos?.value.trim() || '—';
                const canales = remedyIptvCanales?.value.trim() || '—';
                const grilla = remedyIptvGrilla?.value.trim() || '—';
                const descartes = remedyIptvDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '—');

                let html = `
                        <div class="remedy-word-page">
                            <div class="remedy-word-title">
                                4. CANALES A RED:
                            </div>

                            <table class="remedy-word-table">
                                <tr>
                                    <td class="label-cell">Persona de Contacto:</td>
                                    <td class="value-cell">${contacto}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Número de Contacto:</td>
                                    <td class="value-cell">${telefono}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Customer ID:</td>
                                    <td class="value-cell" style="font-weight:bold;">${customerId}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Plano:</td>
                                    <td class="value-cell">${plano}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Cantidad de decodificador(es):</td>
                                    <td class="value-cell">${cantDecos}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">N° Serie decos afectados:</td>
                                    <td class="value-cell" style="font-family:monospace;">${serieDecos}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Canales afectados (N° - Nombre):</td>
                                    <td class="value-cell" style="color:#b91c1c; font-weight:bold;">${canales}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Grilla Claro TV actualizada:</td>
                                    <td class="value-cell">${grilla}</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">Descripción de DESCARTES:</td>
                                    <td class="value-cell" style="white-space:pre-wrap;">${descartes}</td>
                                </tr>
                            </table>

                            <div class="remedy-word-section-title">Evidencias:</div>

                            ${remedyImagesList.length > 0 ? `
                                <div class="remedy-word-images">
                                    <div class="remedy-word-section-title" style="margin-bottom:8px;">Capturas Adjuntas:</div>
                                    ${remedyImagesList.map((img, i) => `
                                        <div class="remedy-word-img-wrapper">
                                            <div class="remedy-word-img-label">Evidencia #${i + 1} (Clic para ampliar):</div>
                                            <img src="${img}" class="remedy-word-img" alt="Evidencia ${i + 1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div style="margin-top:0.4rem; font-size:11.5px; color:#64748b; font-style:italic;">
                                    (Sin capturas adjuntas aún. Puedes pegar fotos de error de pantalla con Ctrl+V).
                                </div>
                            `}
                        </div>
                    `;
                remedyVisualSheet.innerHTML = html;
                return;
            }

            const contacto = remedyRedContacto?.value.trim() || '—';
            const telefono = remedyRedTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '—');
            const customerId = remedyRedCustomerId?.value.trim() || '—';
            const mac = remedyRedMac?.value.trim() || '—';
            const ip = remedyRedIp?.value.trim() || '—';
            const paginas = remedyRedPaginas?.value.trim() || '—';
            const redExterna = remedyRedRedExterna?.value.trim() || '—';
            const cmtsOlt = remedyRedCmtsOlt?.value.trim() || '—';
            const plano = remedyRedPlano?.value.trim() || '—';
            const descartes = remedyRedDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '—');

            let html = `
                    <div class="remedy-word-page">
                        <div class="remedy-word-title">
                            PAGINAS WEB a RED
                        </div>

                        <table class="remedy-word-table">
                            <tr>
                                <td class="label-cell">Persona de Contacto:</td>
                                <td class="value-cell">${contacto}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Número de contacto:</td>
                                <td class="value-cell">${telefono}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Customer ID:</td>
                                <td class="value-cell" style="font-weight:bold;">${customerId}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Dirección MAC Cable Módem:</td>
                                <td class="value-cell" style="font-family:monospace;">${mac}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">IP Pública(Cuál es mi IP):</td>
                                <td class="value-cell" style="font-family:monospace;">${ip}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Páginas/Apps que no accede:</td>
                                <td class="value-cell" style="color:#b91c1c; font-weight:bold;">${paginas}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Desde que red puede acceder:</td>
                                <td class="value-cell">${redExterna}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">CMTS/OLT:</td>
                                <td class="value-cell">${cmtsOlt}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Plano:</td>
                                <td class="value-cell">${plano}</td>
                            </tr>
                            <tr>
                                <td class="label-cell">Descartes o descripción detallada:</td>
                                <td class="value-cell" style="white-space:pre-wrap;">${descartes}</td>
                            </tr>
                        </table>

                        <div class="remedy-word-section-title">Evidencias:</div>
                        <ul class="remedy-word-list">
                            <li>Imagen del error con red CLARO</li>
                            <li>Imagen sin error con red diferente a CLARO</li>
                            <li>Ping desde la red de Claro</li>
                            <li>TracerTR desde la red de Claro</li>
                            <li>TracerTR desde la red diferente a Claro</li>
                        </ul>

                        ${remedyImagesList.length > 0 ? `
                            <div class="remedy-word-images">
                                <div class="remedy-word-section-title" style="margin-bottom:8px;">Capturas Adjuntas:</div>
                                ${remedyImagesList.map((img, i) => `
                                    <div class="remedy-word-img-wrapper">
                                        <div class="remedy-word-img-label">Evidencia #${i + 1} (Clic para ampliar):</div>
                                        <img src="${img}" class="remedy-word-img" alt="Evidencia ${i + 1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            remedyVisualSheet.innerHTML = html;
        } else {
            const falla = remedyInputFalla?.value.trim() || '—';
            const id = remedyInputId?.value.trim() || '—';
            const dni = remedyInputDni?.value.trim() || (elements.genDni?.value.trim() || '—');
            const cliente = remedyInputCliente?.value.trim() || (elements.genCustomer?.value.trim() || '—');
            const detalle = remedyInputDetalle?.value.trim() || '';

            let html = `
                    <div class="remedy-word-page">
                        <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>FALLA:</strong> ${falla}</p>
                        
                        <ul class="remedy-word-list" style="margin-left: 20px; font-size: 13px; color: #1f2937;">
                            <li style="margin-bottom: 4px;"><strong>ID:</strong> ${id}</li>
                            <li style="margin-bottom: 4px;"><strong>DNI:</strong> ${dni}</li>
                            <li style="margin-bottom: 4px;"><strong>CLIENTE:</strong> ${cliente}</li>
                            ${detalle ? `<li style="margin-bottom: 4px;">${detalle}</li>` : ''}
                        </ul>

                        ${remedyImagesList.length > 0 ? `
                            <div class="remedy-word-images">
                                <div class="remedy-word-section-title" style="margin-bottom:8px;">Capturas Adjuntas:</div>
                                ${remedyImagesList.map((img, i) => `
                                    <div class="remedy-word-img-wrapper">
                                        <div class="remedy-word-img-label">Captura #${i + 1} (Clic para ampliar):</div>
                                        <img src="${img}" class="remedy-word-img" alt="Captura ${i + 1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            remedyVisualSheet.innerHTML = html;
        }
    };

    const updateRemedyPreview = () => {
        renderRemedyVisualSheet();
    };

    const renderRemedyImages = () => {
        if (!remedyImagesContainer) return;
        remedyImagesContainer.innerHTML = '';
        remedyImagesList.forEach((imgData, idx) => {
            const thumbWrapper = document.createElement('div');
            thumbWrapper.style.cssText = 'position:relative; width:80px; height:60px; border-radius:6px; overflow:hidden; border:1px solid var(--border-color); background:#000; cursor:pointer;';
            thumbWrapper.title = 'Clic para ampliar';
            thumbWrapper.addEventListener('click', () => {
                window.previewRemedyImageZoom && window.previewRemedyImageZoom(imgData);
            });

            const img = document.createElement('img');
            img.src = imgData;
            img.style.cssText = 'width:100%; height:100%; object-fit:cover;';

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '✕';
            delBtn.style.cssText = 'position:absolute; top:2px; right:2px; background:rgba(220,53,69,0.9); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:2;';
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
            const mainTel = elements.genTelefono?.value.trim() || '';
            const mainContactId = elements.genContactId?.value.trim() || '';
            const mainDescartes = elements.genDescartes?.value.trim() || '';
            const mainProblema = elements.genProblema?.value.trim() || '';

            if (mainTel) {
                if (remedyRedTelefono && !remedyRedTelefono.value) remedyRedTelefono.value = mainTel;
                if (remedyIptvTelefono && !remedyIptvTelefono.value) remedyIptvTelefono.value = mainTel;
                if (remedyTelTelefono && !remedyTelTelefono.value) remedyTelTelefono.value = mainTel;
                if (remedyTelNumeroTel && !remedyTelNumeroTel.value) remedyTelNumeroTel.value = mainTel;
            }
            if (mainDescartes) {
                if (remedyRedDescartes && !remedyRedDescartes.value) remedyRedDescartes.value = mainDescartes;
                if (remedyIptvDescartes && !remedyIptvDescartes.value) remedyIptvDescartes.value = mainDescartes;
                if (remedyTelDescartes && !remedyTelDescartes.value) remedyTelDescartes.value = mainDescartes;
            }
            if (mainProblema) {
                if (remedyTelProblema && !remedyTelProblema.value) remedyTelProblema.value = mainProblema;
            }

            if (elements.genCustomer && elements.genCustomer.value.trim()) {
                const custName = elements.genCustomer.value.trim().toUpperCase();
                if (remedyRedContacto && !remedyRedContacto.value) remedyRedContacto.value = custName;
                if (remedyIptvContacto && !remedyIptvContacto.value) remedyIptvContacto.value = custName;
                if (remedyTelContacto && !remedyTelContacto.value) remedyTelContacto.value = custName;
                if (remedyInputCliente && !remedyInputCliente.value) remedyInputCliente.value = custName;
            }
            if (elements.genDni && elements.genDni.value.trim() && (!remedyInputDni.value || remedyInputDni.value === '')) {
                remedyInputDni.value = elements.genDni.value.trim();
            }

            remedyModal.classList.add('active');
            setRemedyTab(remedyActiveMode);
        }
    };

    const resetRemedyModal = () => {
        if (remedyRedContacto) remedyRedContacto.value = '';
        if (remedyRedTelefono) remedyRedTelefono.value = '';
        if (remedyRedCustomerId) remedyRedCustomerId.value = '';
        if (remedyRedMac) remedyRedMac.value = '';
        if (remedyRedIp) remedyRedIp.value = '';
        if (remedyRedCmtsOlt) remedyRedCmtsOlt.value = '';
        if (remedyRedPaginas) remedyRedPaginas.value = '';
        if (remedyRedRedExterna) remedyRedRedExterna.value = '';
        if (remedyRedPlano) remedyRedPlano.value = '';
        if (remedyRedDescartes) remedyRedDescartes.value = '';

        if (remedyIptvContacto) remedyIptvContacto.value = '';
        if (remedyIptvTelefono) remedyIptvTelefono.value = '';
        if (remedyIptvCustomerId) remedyIptvCustomerId.value = '';
        if (remedyIptvPlano) remedyIptvPlano.value = '';
        if (remedyIptvCantDecos) remedyIptvCantDecos.value = '';
        if (remedyIptvSerieDecos) remedyIptvSerieDecos.value = '';
        if (remedyIptvCanales) remedyIptvCanales.value = '';
        if (remedyIptvGrilla) remedyIptvGrilla.value = '';
        if (remedyIptvDescartes) remedyIptvDescartes.value = '';

        if (remedyTelContacto) remedyTelContacto.value = '';
        if (remedyTelTelefono) remedyTelTelefono.value = '';
        if (remedyTelCustomerId) remedyTelCustomerId.value = '';
        if (remedyTelMac) remedyTelMac.value = '';
        if (remedyTelPlano) remedyTelPlano.value = '';
        if (remedyTelCmtsOlt) remedyTelCmtsOlt.value = '';
        if (remedyTelNumeroTel) remedyTelNumeroTel.value = '';
        if (remedyTelPlan) remedyTelPlan.value = '';
        if (remedyTelProblema) remedyTelProblema.value = '';
        if (remedyTelDescartes) remedyTelDescartes.value = '';

        if (remedyInputFalla) remedyInputFalla.value = '';
        if (remedyInputId) remedyInputId.value = '';
        if (remedyInputDni) remedyInputDni.value = '';
        if (remedyInputCliente) remedyInputCliente.value = '';
        if (remedyInputDetalle) remedyInputDetalle.value = '';

        remedyImagesList = [];
        renderRemedyImages();
        updateRemedyPreview();
    };

    const closeRemedyModal = () => {
        if (remedyModal) remedyModal.classList.remove('active');
    };

    if (btnOpenRemedyModal) btnOpenRemedyModal.addEventListener('click', openRemedyModal);
    if (remedyModalClose) remedyModalClose.addEventListener('click', closeRemedyModal);
    if (remedyModal) {
        remedyModal.addEventListener('click', (e) => {
            if (e.target === remedyModal) closeRemedyModal();
        });
    }

    if (btnClearRemedyAll) {
        btnClearRemedyAll.addEventListener('click', () => {
            resetRemedyModal();
            showToast('Formulario de Remedy limpiado');
        });
    }

    // Listeners for all inputs to update live preview
    [
        remedyRedContacto, remedyRedTelefono, remedyRedCustomerId, remedyRedMac,
        remedyRedIp, remedyRedCmtsOlt, remedyRedPaginas, remedyRedRedExterna,
        remedyRedPlano, remedyRedDescartes,
        remedyIptvContacto, remedyIptvTelefono, remedyIptvCustomerId, remedyIptvPlano,
        remedyIptvCantDecos, remedyIptvSerieDecos, remedyIptvCanales, remedyIptvGrilla,
        remedyIptvDescartes,
        remedyTelContacto, remedyTelTelefono, remedyTelCustomerId, remedyTelMac,
        remedyTelPlano, remedyTelCmtsOlt, remedyTelNumeroTel, remedyTelPlan,
        remedyTelProblema, remedyTelDescartes,
        remedyInputFalla, remedyInputId, remedyInputDni, remedyInputCliente,
        remedyInputDetalle
    ].forEach(inp => {
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
            const logLabel = isTelefoniaActive() ? 'Escalamiento Telefonía a RED' : (isIptvActive() ? 'Escalamiento IPTV Canales a RED' : (remedyActiveMode === 'red' ? 'Escalamiento a RED (Páginas/Apps)' : 'Incidencia / Escalamiento'));
            copyToClipboard(text, 'Texto Remedy copiado');
            addHistoryRecord('Remedy', logLabel, text);
        });
    }

    // Action: Copy Rich Format for Word (With Embedded Images)
    if (btnCopyRemedyWord) {
        btnCopyRemedyWord.addEventListener('click', async () => {
            let htmlContent = '';
            const plainText = getRemedyPlainText();
            const isIptv = isIptvActive();
            const isTelefonia = isTelefoniaActive();

            if (remedyActiveMode === 'red') {
                if (isTelefonia) {
                    const contacto = remedyTelContacto?.value.trim() || '[Persona de Contacto]';
                    const telefono = remedyTelTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de contacto]');
                    const customerId = remedyTelCustomerId?.value.trim() || '[Customer ID]';
                    const mac = remedyTelMac?.value.trim() || '[Dirección MAC]';
                    const plano = remedyTelPlano?.value.trim() || '[Plano]';
                    const cmtsOlt = remedyTelCmtsOlt?.value.trim() || '[(CMTS/OLT)]';
                    const numeroTel = remedyTelNumeroTel?.value.trim() || (elements.genTelefono?.value.trim() || '[Número telefónico]');
                    const plan = remedyTelPlan?.value.trim() || '[Plan contratado]';
                    const problema = remedyTelProblema?.value.trim() || (elements.genProblema?.value.trim() || '[Descripción detallada del problema]');
                    const descartes = remedyTelDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descartes de primer nivel realizados]');

                    htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                    htmlContent += `<h3 style="color: #b91c1c; margin: 0 0 10pt 0;">TELEFONÍA A RED:</h3>`;
                    htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 10.5pt;">`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold; width: 35%;">Persona de Contacto:</td><td style="padding: 4px 8px;">${contacto}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Número de contacto:</td><td style="padding: 4px 8px;">${telefono}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Customer ID:</td><td style="padding: 4px 8px;">${customerId}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Dirección MAC:</td><td style="padding: 4px 8px; font-family:monospace;">${mac}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Plano:</td><td style="padding: 4px 8px;">${plano}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">(CMTS/OLT):</td><td style="padding: 4px 8px;">${cmtsOlt}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Número telefónico:</td><td style="padding: 4px 8px; font-weight:bold; color:#0284c7;">${numeroTel}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Plan contratado:</td><td style="padding: 4px 8px;">${plan}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Descripción detallada del problema:</td><td style="padding: 4px 8px;">${problema}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Descartes de primer nivel realizados:</td><td style="padding: 4px 8px;">${descartes}</td></tr>`;
                    htmlContent += `</table>`;

                    htmlContent += `<p style="font-weight: bold; margin: 10pt 0 4pt 0;">Evidencias:</p>`;

                    if (remedyImagesList.length > 0) {
                        htmlContent += `<div style="margin-top: 10pt;">`;
                        remedyImagesList.forEach((imgData, i) => {
                            htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i + 1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                        });
                        htmlContent += `</div>`;
                    }
                    htmlContent += `</div>`;
                } else if (isIptv) {
                    const contacto = remedyIptvContacto?.value.trim() || '[Persona de Contacto]';
                    const telefono = remedyIptvTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de Contacto]');
                    const customerId = remedyIptvCustomerId?.value.trim() || '[Customer ID]';
                    const plano = remedyIptvPlano?.value.trim() || '[Plano]';
                    const cantDecos = remedyIptvCantDecos?.value.trim() || '[Cantidad de decodificador(es)]';
                    const serieDecos = remedyIptvSerieDecos?.value.trim() || '[N° Serie decos afectados]';
                    const canales = remedyIptvCanales?.value.trim() || '[Canales afectados (N° - Nombre de Canal)]';
                    const grilla = remedyIptvGrilla?.value.trim() || '[Grilla Claro TV actualizada]';
                    const descartes = remedyIptvDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descripción detallada de DESCARTES realizados]');

                    htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                    htmlContent += `<h3 style="color: #b91c1c; margin: 0 0 10pt 0;">4. CANALES A RED:</h3>`;
                    htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 10.5pt;">`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold; width: 40%;">Persona de Contacto:</td><td style="padding: 4px 8px;">${contacto}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Número de Contacto:</td><td style="padding: 4px 8px;">${telefono}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Customer ID:</td><td style="padding: 4px 8px;">${customerId}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Plano:</td><td style="padding: 4px 8px;">${plano}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Cantidad de decodificador(es):</td><td style="padding: 4px 8px;">${cantDecos}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">N° Serie decos afectados:</td><td style="padding: 4px 8px; font-family:monospace;">${serieDecos}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Canales afectados (N° - Nombre de Canal):</td><td style="padding: 4px 8px; color:#b91c1c; font-weight:bold;">${canales}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Grilla Claro TV actualizada:</td><td style="padding: 4px 8px;">${grilla}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Descripción detallada de DESCARTES realizados:</td><td style="padding: 4px 8px;">${descartes}</td></tr>`;
                    htmlContent += `</table>`;

                    htmlContent += `<p style="font-weight: bold; margin: 10pt 0 4pt 0;">Evidencias:</p>`;

                    if (remedyImagesList.length > 0) {
                        htmlContent += `<div style="margin-top: 10pt;">`;
                        remedyImagesList.forEach((imgData, i) => {
                            htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i + 1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                        });
                        htmlContent += `</div>`;
                    }
                    htmlContent += `</div>`;
                } else {
                    const contacto = remedyRedContacto?.value.trim() || '[Persona de Contacto]';
                    const telefono = remedyRedTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de contacto]');
                    const customerId = remedyRedCustomerId?.value.trim() || '[Customer ID]';
                    const mac = remedyRedMac?.value.trim() || '[Dirección MAC Cable Módem]';
                    const ip = remedyRedIp?.value.trim() || '[IP Pública(Cuál es mi IP)]';
                    const paginas = remedyRedPaginas?.value.trim() || '[Páginas/Apps que no accede]';
                    const redExterna = remedyRedRedExterna?.value.trim() || '[Desde que red puede acceder]';
                    const cmtsOlt = remedyRedCmtsOlt?.value.trim() || '[CMTS/OLT]';
                    const plano = remedyRedPlano?.value.trim() || '[Plano]';
                    const descartes = remedyRedDescartes?.value.trim() || (elements.genDescartes?.value.trim() || '[Descartes técnicos]');

                    htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                    htmlContent += `<h3 style="color: #b91c1c; margin: 0 0 10pt 0;">ESCALAMIENTO A RED - PÁGINAS WEB / APPS BLOQUEADAS</h3>`;
                    htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 10.5pt;">`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold; width: 35%;">Persona de Contacto:</td><td style="padding: 4px 8px;">${contacto}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Número de contacto:</td><td style="padding: 4px 8px;">${telefono}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Customer ID:</td><td style="padding: 4px 8px;">${customerId}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Dirección MAC Cable Módem:</td><td style="padding: 4px 8px;">${mac}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">IP Pública(Cuál es mi IP):</td><td style="padding: 4px 8px;">${ip}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Páginas/Apps que no accede:</td><td style="padding: 4px 8px; color:#b91c1c; font-weight:bold;">${paginas}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Desde que red puede acceder:</td><td style="padding: 4px 8px;">${redExterna}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">CMTS/OLT:</td><td style="padding: 4px 8px;">${cmtsOlt}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Plano:</td><td style="padding: 4px 8px;">${plano}</td></tr>`;
                    htmlContent += `<tr><td style="padding: 4px 8px; font-weight: bold;">Descartes del problema:</td><td style="padding: 4px 8px;">${descartes}</td></tr>`;
                    htmlContent += `</table>`;

                    htmlContent += `<p style="font-weight: bold; margin: 10pt 0 4pt 0;">Evidencias requeridas:</p>`;
                    htmlContent += `<ul style="margin: 0 0 10pt 18pt; padding: 0;">`;
                    htmlContent += `<li>Imagen del error con red CLARO</li>`;
                    htmlContent += `<li>Imagen sin error con red diferente a CLARO</li>`;
                    htmlContent += `<li>Ping desde la red de Claro</li>`;
                    htmlContent += `<li>TracerTR desde la red de Claro</li>`;
                    htmlContent += `<li>TracerTR desde la red diferente a Claro</li>`;
                    htmlContent += `</ul>`;

                    if (remedyImagesList.length > 0) {
                        htmlContent += `<div style="margin-top: 10pt;">`;
                        remedyImagesList.forEach((imgData, i) => {
                            htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i + 1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                        });
                        htmlContent += `</div>`;
                    }
                    htmlContent += `</div>`;
                }
            } else {
                const falla = remedyInputFalla?.value.trim() || '[Descripción de la falla]';
                const id = remedyInputId?.value.trim() || '[Customer ID]';
                const dni = remedyInputDni?.value.trim() || '[DNI/RUC]';
                const cliente = remedyInputCliente?.value.trim() || '[Nombre del Cliente]';
                const detalle = remedyInputDetalle?.value.trim() || '';

                htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                htmlContent += `<p style="margin: 0 0 8pt 0;"><strong>FALLA:</strong> ${falla}</p>`;
                htmlContent += `<ul style="margin: 0 0 12pt 18pt; padding: 0;">`;
                htmlContent += `<li><strong>ID:</strong> ${id}</li>`;
                htmlContent += `<li><strong>DNI:</strong> ${dni}</li>`;
                htmlContent += `<li><strong>CLIENTE:</strong> ${cliente}</li>`;
                if (detalle) {
                    htmlContent += `<li>${detalle}</li>`;
                }
                htmlContent += `</ul>`;

                if (remedyImagesList.length > 0) {
                    htmlContent += `<div style="margin-top: 10pt;">`;
                    remedyImagesList.forEach((imgData, i) => {
                        htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura #${i + 1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                    });
                    htmlContent += `</div>`;
                }
                htmlContent += `</div>`;
            }

            try {
                if (navigator.clipboard && window.ClipboardItem) {
                    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
                    const blobPlain = new Blob([plainText], { type: 'text/plain' });
                    const item = new ClipboardItem({
                        'text/html': blobHtml,
                        'text/plain': blobPlain
                    });
                    await navigator.clipboard.write([item]);
                    showToast('✓ Formato Word copiado con tablas e imágenes');
                    addHistoryRecord('Remedy (Word)', 'Plantilla con Formato Word enriquecido', plainText);
                } else {
                    copyToClipboard(plainText, 'Texto copiado (El navegador no soporta HTML enriquecido)');
                }
            } catch (err) {
                console.error('Error copying rich text:', err);
                copyToClipboard(plainText, 'Texto copiado (Fallback)');
            }
        });
    }

    // Action: Export to PDF with Printable Layout
    if (btnExportRemedyPdf) {
        btnExportRemedyPdf.addEventListener('click', () => {
            let docTitle = 'Remedy_Incidencia';
            let bodyContent = '';
            const isIptv = isIptvActive();
            const isTelefonia = isTelefoniaActive();

            if (remedyActiveMode === 'red') {
                if (isTelefonia) {
                    const contacto = remedyTelContacto?.value.trim() || 'N/A';
                    const telefono = remedyTelTelefono?.value.trim() || (elements.genTelefono?.value.trim() || 'N/A');
                    const customerId = remedyTelCustomerId?.value.trim() || 'N/A';
                    const mac = remedyTelMac?.value.trim() || 'N/A';
                    const plano = remedyTelPlano?.value.trim() || 'N/A';
                    const cmtsOlt = remedyTelCmtsOlt?.value.trim() || 'N/A';
                    const numeroTel = remedyTelNumeroTel?.value.trim() || (elements.genTelefono?.value.trim() || 'N/A');
                    const plan = remedyTelPlan?.value.trim() || 'N/A';
                    const problema = remedyTelProblema?.value.trim() || (elements.genProblema?.value.trim() || 'N/A');
                    const descartes = remedyTelDescartes?.value.trim() || (elements.genDescartes?.value.trim() || 'N/A');

                    docTitle = `Remedy_TELEFONIA_RED_${customerId}_${contacto.replace(/\s+/g, '_')}`;

                    bodyContent = `
                            <div style="border-bottom: 2px solid #b91c1c; padding-bottom: 8px; margin-bottom: 16px;">
                                <h2 style="color: #b91c1c; margin: 0; font-size: 14pt;">TELEFONÍA A RED</h2>
                                <p style="margin: 4px 0 0 0; font-size: 9pt; color: #6b7280;">Informe Técnico de Escalamiento de Telefonía Fija &bull; Back Office 2N</p>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt;">
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; width: 35%; border: 1px solid #e5e7eb;">Persona de Contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${contacto}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Número de contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${telefono}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Customer ID:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${customerId}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Dirección MAC:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-family: monospace;">${mac}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Plano:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${plano}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">(CMTS/OLT):</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${cmtsOlt}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb; color:#0284c7;">Número telefónico:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-weight:bold; color:#0284c7;">${numeroTel}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Plan contratado:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${plan}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Descripción detallada del problema:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${problema}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Descartes de primer nivel realizados:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${descartes}</td></tr>
                            </table>

                            <div style="margin-top: 10px; margin-bottom: 6px; font-weight: bold; font-size: 10pt;">Evidencias:</div>

                            <div class="evidence-section">
                                ${remedyImagesList.map((img, idx) => `
                                    <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center;">
                                        <p style="font-weight: bold; font-size: 10pt; margin: 0 0 6px 0; text-align: left;">Captura / Evidencia #${idx + 1}:</p>
                                        <img class="evidence-img" src="${img}" alt="Evidencia Remedy Telefonía" />
                                    </div>
                                `).join('')}
                            </div>
                        `;
                } else if (isIptv) {
                    const contacto = remedyIptvContacto?.value.trim() || 'N/A';
                    const telefono = remedyIptvTelefono?.value.trim() || (elements.genTelefono?.value.trim() || 'N/A');
                    const customerId = remedyIptvCustomerId?.value.trim() || 'N/A';
                    const plano = remedyIptvPlano?.value.trim() || 'N/A';
                    const cantDecos = remedyIptvCantDecos?.value.trim() || 'N/A';
                    const serieDecos = remedyIptvSerieDecos?.value.trim() || 'N/A';
                    const canales = remedyIptvCanales?.value.trim() || 'N/A';
                    const grilla = remedyIptvGrilla?.value.trim() || 'N/A';
                    const descartes = remedyIptvDescartes?.value.trim() || (elements.genDescartes?.value.trim() || 'N/A');

                    docTitle = `Remedy_IPTV_Canales_${customerId}_${contacto.replace(/\s+/g, '_')}`;

                    bodyContent = `
                            <div style="border-bottom: 2px solid #b91c1c; padding-bottom: 8px; margin-bottom: 16px;">
                                <h2 style="color: #b91c1c; margin: 0; font-size: 14pt;">4. CANALES A RED</h2>
                                <p style="margin: 4px 0 0 0; font-size: 9pt; color: #6b7280;">Informe Técnico de Escalamiento IPTV / Plataforma TV &bull; Back Office 2N</p>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt;">
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; width: 40%; border: 1px solid #e5e7eb;">Persona de Contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${contacto}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Número de Contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${telefono}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Customer ID:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${customerId}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Plano:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${plano}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Cantidad de decodificador(es):</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${cantDecos}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">N° Serie decos afectados:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-family: monospace;">${serieDecos}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb; color:#b91c1c;">Canales afectados (N° - Nombre de Canal):</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-weight:bold; color:#b91c1c;">${canales}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Grilla Claro TV actualizada:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${grilla}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Descripción detallada de DESCARTES realizados:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${descartes}</td></tr>
                            </table>

                            <div style="margin-top: 10px; margin-bottom: 6px; font-weight: bold; font-size: 10pt;">Evidencias:</div>

                            <div class="evidence-section">
                                ${remedyImagesList.map((img, idx) => `
                                    <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center;">
                                        <p style="font-weight: bold; font-size: 10pt; margin: 0 0 6px 0; text-align: left;">Captura / Evidencia #${idx + 1}:</p>
                                        <img class="evidence-img" src="${img}" alt="Evidencia Remedy IPTV" />
                                    </div>
                                `).join('')}
                            </div>
                        `;
                } else {
                    const contacto = remedyRedContacto?.value.trim() || 'N/A';
                    const telefono = remedyRedTelefono?.value.trim() || (elements.genTelefono?.value.trim() || 'N/A');
                    const customerId = remedyRedCustomerId?.value.trim() || 'N/A';
                    const mac = remedyRedMac?.value.trim() || 'N/A';
                    const ip = remedyRedIp?.value.trim() || 'N/A';
                    const paginas = remedyRedPaginas?.value.trim() || 'N/A';
                    const redExterna = remedyRedRedExterna?.value.trim() || 'N/A';
                    const cmtsOlt = remedyRedCmtsOlt?.value.trim() || 'N/A';
                    const plano = remedyRedPlano?.value.trim() || 'N/A';
                    const descartes = remedyRedDescartes?.value.trim() || (elements.genDescartes?.value.trim() || 'N/A');

                    docTitle = `Remedy_RED_${customerId}_${contacto.replace(/\s+/g, '_')}`;

                    bodyContent = `
                            <div style="border-bottom: 2px solid #b91c1c; padding-bottom: 8px; margin-bottom: 16px;">
                                <h2 style="color: #b91c1c; margin: 0; font-size: 14pt;">ESCALAMIENTO A RED - PÁGINAS WEB / APPS BLOQUEADAS</h2>
                                <p style="margin: 4px 0 0 0; font-size: 9pt; color: #6b7280;">Informe de Auditoría y Pruebas Técnicas &bull; Back Office 2N</p>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt;">
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; width: 35%; border: 1px solid #e5e7eb;">Persona de Contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${contacto}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Número de contacto:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${telefono}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Customer ID:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${customerId}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Dirección MAC Cable Módem / ONT:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-family: monospace;">${mac}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb; font-family: monospace;">${ip}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb; color:#b91c1c;">Páginas/Apps que no accede:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-weight:bold; color:#b91c1c;">${paginas}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Desde qué red puede acceder:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${redExterna}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">CMTS / OLT:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${cmtsOlt}</td></tr>
                                <tr style="background:#f3f4f6;"><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Plano:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${plano}</td></tr>
                                <tr><td style="padding: 6px 8px; font-weight: bold; border: 1px solid #e5e7eb;">Descartes técnicos detallados:</td><td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${descartes}</td></tr>
                            </table>

                            <div style="background:#fef2f2; border: 1px solid #fecaca; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 9pt;">
                                <strong>Evidencias requeridas incluidas:</strong>
                                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin-top: 4px; color:#4b5563;">
                                    <div>• Imagen del error con red CLARO</div>
                                    <div>• Imagen sin error con red externa</div>
                                    <div>• Ping desde la red de Claro</div>
                                    <div>• TracerTR desde la red de Claro</div>
                                    <div>• TracerTR desde la red externa</div>
                                </div>
                            </div>

                            <div class="evidence-section">
                                ${remedyImagesList.map((img, idx) => `
                                    <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center;">
                                        <p style="font-weight: bold; font-size: 10pt; margin: 0 0 6px 0; text-align: left;">Captura / Evidencia #${idx + 1}:</p>
                                        <img class="evidence-img" src="${img}" alt="Evidencia Remedy" />
                                    </div>
                                `).join('')}
                            </div>
                        `;
                }
            } else {
                const falla = remedyInputFalla?.value.trim() || 'Sin especificar';
                const id = remedyInputId?.value.trim() || 'N/A';
                const dni = remedyInputDni?.value.trim() || 'N/A';
                const cliente = remedyInputCliente?.value.trim() || 'N/A';
                const detalle = remedyInputDetalle?.value.trim() || '';

                docTitle = `Remedy_${id}_${cliente.replace(/\s+/g, '_')}`;

                bodyContent = `
                        <div class="falla-title"><strong>FALLA:</strong> ${falla}</div>
                        
                        <ul class="meta-list">
                            <li><strong>ID:</strong> ${id}</li>
                            <li><strong>DNI:</strong> ${dni}</li>
                            <li><strong>CLIENTE:</strong> ${cliente}</li>
                            ${detalle ? `<li>${detalle}</li>` : ''}
                        </ul>

                        <div class="evidence-section">
                            ${remedyImagesList.map(img => `<p style="margin: 0 0 16px 0; text-align:center;"><img class="evidence-img" src="${img}" alt="Evidencia Remedy" /></p>`).join('')}
                        </div>
                    `;
            }

            const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${docTitle}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 18mm 16mm 18mm 16mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            font-size: 10.5pt;
            color: #1f2937;
            margin: 0;
            padding: 0;
            font-size: 10.5pt;
            line-height: 1.45;
        }
        .falla-title {
            font-size: 11.5pt;
            margin-bottom: 16px;
            line-height: 1.45;
        }
        .meta-list {
            margin: 0 0 24px 20px;
            padding: 0;
            font-size: 10.5pt;
        }
        .meta-list li {
            margin-bottom: 5px;
        }
        .evidence-section {
            margin-top: 16px;
        }
        .evidence-img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
            border: 1px solid #9ca3af;
            border-radius: 4px;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    ${bodyContent}
</body>
</html>`;

            // Generar mediante un iframe invisible para evitar abrir ventanas/pestañas adicionales en blanco
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '0';
            printIframe.style.height = '0';
            printIframe.style.border = '0';
            printIframe.style.visibility = 'hidden';
            document.body.appendChild(printIframe);

            const iframeDoc = printIframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();

            setTimeout(() => {
                printIframe.contentWindow.focus();
                printIframe.contentWindow.print();
                setTimeout(() => {
                    if (printIframe.parentNode) {
                        document.body.removeChild(printIframe);
                    }
                }, 2000);
            }, 350);

            showToast('Generando vista de impresión PDF...');
            addHistoryRecord('Remedy', remedyActiveMode === 'red' ? 'PDF Escalamiento RED' : 'PDF Escalamiento General', `Doc: ${docTitle}`);
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
            betaInfoPopover.classList.toggle('active');
        });
    }
    if (btnCloseBetaInfoPopover && betaInfoPopover) {
        btnCloseBetaInfoPopover.addEventListener('click', (e) => {
            e.stopPropagation();
            betaInfoPopover.classList.remove('active');
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
        const currentFields = {
            telefono: elements.genTelefono?.value || '',
            problema: elements.genProblema?.value || '',
            solucion: elements.genSolucion?.value || '',
            descartes: elements.genDescartes?.value || '',
            sot: elements.genSot?.value || '',
            contactId: elements.genContactId?.value || '',
            servicio: elements.genServicio?.value || 'INTERNET'
        };

        const record = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            dateStr: new Date().toLocaleDateString(),
            type: type,
            service: service,
            summary: (content.split('\n')[0] || 'Caso BackOffice').substring(0, 80),
            content: content,
            fields: currentFields
        };

        state.history.unshift(record);
        if (state.history.length > 30) state.history.pop();
        localStorage.setItem('bo_history', JSON.stringify(state.history));

        // Aprender automáticamente frases usadas en este caso
        learnFromActiveForm();
    }

    // Modal de Detalle Completo de Caso
    const caseDetailModal = document.getElementById('caseDetailModal');
    const caseDetailModalClose = document.getElementById('caseDetailModalClose');
    const btnCaseDetailClose = document.getElementById('btnCaseDetailClose');
    const btnCaseDetailCopy = document.getElementById('btnCaseDetailCopy');
    const btnCaseDetailLoad = document.getElementById('btnCaseDetailLoad');
    const caseDetailContent = document.getElementById('caseDetailContent');
    const caseDetailBadges = document.getElementById('caseDetailBadges');
    const caseDetailTimestamp = document.getElementById('caseDetailTimestamp');
    const caseDetailModalTitle = document.getElementById('caseDetailModalTitle');

    let currentSelectedCase = null;

    function openCaseDetailModal(item) {
        if (!caseDetailModal || !item) return;
        currentSelectedCase = item;

        if (caseDetailModalTitle) {
            caseDetailModalTitle.textContent = `📋 Detalle: ${item.type || 'Plantilla Generada'}`;
        }

        if (caseDetailBadges) {
            caseDetailBadges.innerHTML = `
                <span class="badge badge-info">${escapeHtml(item.type || 'Plantilla')}</span>
                <span class="badge badge-success">${escapeHtml(item.service || 'INTERNET')}</span>
            `;
        }

        if (caseDetailTimestamp) {
            caseDetailTimestamp.innerHTML = `🕒 ${escapeHtml(item.timestamp || '')} ${item.dateStr ? `<span style="opacity:0.7;">(${escapeHtml(item.dateStr)})</span>` : ''}`;
        }

        if (caseDetailContent) {
            caseDetailContent.textContent = item.content || '';
        }

        caseDetailModal.classList.add('active');
    }

    function closeCaseDetailModal() {
        if (caseDetailModal) {
            caseDetailModal.classList.remove('active');
            currentSelectedCase = null;
        }
    }

    if (caseDetailModalClose) caseDetailModalClose.addEventListener('click', closeCaseDetailModal);
    if (btnCaseDetailClose) btnCaseDetailClose.addEventListener('click', closeCaseDetailModal);

    if (caseDetailModal) {
        caseDetailModal.addEventListener('click', (e) => {
            if (e.target === caseDetailModal) closeCaseDetailModal();
        });
    }

    if (btnCaseDetailCopy) {
        btnCaseDetailCopy.addEventListener('click', () => {
            if (currentSelectedCase && currentSelectedCase.content) {
                copyToClipboard(currentSelectedCase.content, 'Plantilla completa copiada al portapapeles');
            }
        });
    }

    if (btnCaseDetailLoad) {
        btnCaseDetailLoad.addEventListener('click', () => {
            if (!currentSelectedCase) return;

            if (currentSelectedCase.fields) {
                if (elements.genTelefono) elements.genTelefono.value = currentSelectedCase.fields.telefono || '';
                if (elements.genProblema) elements.genProblema.value = currentSelectedCase.fields.problema || '';
                if (elements.genSolucion) elements.genSolucion.value = currentSelectedCase.fields.solucion || '';
                if (elements.genDescartes) elements.genDescartes.value = currentSelectedCase.fields.descartes || '';
                if (elements.genSot) elements.genSot.value = currentSelectedCase.fields.sot || '';
                if (elements.genContactId) elements.genContactId.value = currentSelectedCase.fields.contactId || '';
                if (elements.genServicio) {
                    elements.genServicio.value = currentSelectedCase.fields.servicio || 'INTERNET';
                    populateProblems(elements.genServicio.value, true);
                }
            } else if (currentSelectedCase.content) {
                parseSmartInput(currentSelectedCase.content);
            }

            closeCaseDetailModal();
            switchTab('tab-generator');
            renderGeneratorPreviews();
            showToast('✅ Caso restaurado en el Generador de Plantillas');
        });
    }

    function renderHistoryTable() {
        elements.historyTableBody.innerHTML = '';
        if (state.history.length === 0) {
            elements.historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem 1rem;">Sin historial de casos generados aún. Cuando copies una plantilla, se registrará aquí.</td></tr>';
            return;
        }

        state.history.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = 'history-row';
            tr.title = 'Haz clic para ver la plantilla completa de este caso';
            tr.innerHTML = `
                <td style="padding:0.65rem 0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem; white-space:nowrap;">
                    ${index === 0 ? '🔥 ' : ''}${item.timestamp}
                </td>
                <td style="padding:0.65rem 0.6rem; border-bottom:1px solid var(--border-color);"><span class="badge badge-info">${escapeHtml(item.type)}</span></td>
                <td style="padding:0.65rem 0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem; font-weight:600;">${escapeHtml(item.service)}</td>
                <td style="padding:0.65rem 0.6rem; border-bottom:1px solid var(--border-color); font-size:0.85rem; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted);">
                    ${escapeHtml(item.summary)}
                </td>
                <td style="padding:0.65rem 0.6rem; border-bottom:1px solid var(--border-color); text-align:right; white-space:nowrap;">
                    <button class="btn btn-sm view-hist-btn" data-id="${item.id}" style="display:inline-flex; align-items:center; gap:0.35rem; background:rgba(59,130,246,0.15); color:var(--primary); margin-right:0.3rem;" title="Ver plantilla completa en ventana modal">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ver
                    </button>
                    <button class="btn btn-sm copy-hist-btn" data-id="${item.id}" title="Copiar plantilla rápida">📋 Copiar</button>
                </td>
            `;

            // Click en la fila abre el modal con la plantilla completa
            tr.addEventListener('click', (e) => {
                if (e.target.closest('.copy-hist-btn')) return; // No abrir modal si se presionó Copiar
                openCaseDetailModal(item);
            });

            tr.querySelector('.copy-hist-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(item.content, 'Plantilla copiada al portapapeles');
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

    // Export / Import Backup JSON (incluye plantillas, historial y frases aprendidas)
    elements.btnExportJson.addEventListener('click', () => {
        const backupData = {
            version: '2.6.5',
            exportDate: new Date().toISOString(),
            advisorName: state.advisorName,
            advisorCode: state.advisorCode,
            customTemplates: state.customTemplates,
            history: state.history,
            learnedPhrases: state.learnedPhrases || { descartes: [], soluciones: [], problemas: [] }
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

        showToast('Respaldo completo descargado como .txt');
    });

    // Botón para Copiar Frases Aprendidas (JSON)
    const btnCopyLearnedPhrases = document.getElementById('btnCopyLearnedPhrases');
    if (btnCopyLearnedPhrases) {
        btnCopyLearnedPhrases.addEventListener('click', () => {
            const dataToCopy = JSON.stringify(state.learnedPhrases || { descartes: [], soluciones: [], problemas: [] }, null, 2);
            copyToClipboard(dataToCopy, '📋 Diccionario de frases predictivas copiado al portapapeles');
        });
    }

    // Botón para Limpiar Frases Aprendidas
    const btnClearLearnedPhrases = document.getElementById('btnClearLearnedPhrases');
    if (btnClearLearnedPhrases) {
        btnClearLearnedPhrases.addEventListener('click', () => {
            if (confirm('¿Deseas restablecer el diccionario de frases aprendidas al estado inicial?')) {
                state.learnedPhrases = { descartes: [], soluciones: [], problemas: [] };
                localStorage.setItem('bo_learned_phrases', JSON.stringify(state.learnedPhrases));
                showToast('Diccionario de frases restablecido');
            }
        });
    }

    elements.importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                let countMsgs = [];
                if (data.customTemplates && Array.isArray(data.customTemplates)) {
                    state.customTemplates = data.customTemplates;
                    localStorage.setItem('bo_custom_templates', JSON.stringify(state.customTemplates));
                    countMsgs.push(`${state.customTemplates.length} plantillas`);
                    if (state.activeTab === 'tab-custom') renderCustomTemplates();
                }
                if (data.history && Array.isArray(data.history)) {
                    state.history = data.history;
                    localStorage.setItem('bo_history', JSON.stringify(state.history));
                    renderHistoryTable();
                }
                if (data.learnedPhrases) {
                    state.learnedPhrases = {
                        descartes: Array.from(new Set([...(state.learnedPhrases?.descartes || []), ...(data.learnedPhrases.descartes || [])])),
                        soluciones: Array.from(new Set([...(state.learnedPhrases?.soluciones || []), ...(data.learnedPhrases.soluciones || [])])),
                        problemas: Array.from(new Set([...(state.learnedPhrases?.problemas || []), ...(data.learnedPhrases.problemas || [])]))
                    };
                    localStorage.setItem('bo_learned_phrases', JSON.stringify(state.learnedPhrases));
                    countMsgs.push(`frases predictivas`);
                }
                showToast(`Respaldo importado (${countMsgs.join(', ') || 'OK'})`);
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

    // ==========================================================================
    // MODULE: PLATAFORMAS & LINKS DE TRABAJO (SIDEBAR OFF-CANVAS)
    // ==========================================================================
    // 16. SIDEBAR HUB DE ENLACES & HERRAMIENTAS (ALT + L)
    // ==========================================================================
    function initLinksSidebar() {
        const defaultWorkLinks = [
            { id: 'lnk_incognito', name: 'Incógnito', url: 'http://prov.incognito.claro.com.pe/sac/Login_input', category: 'Internet & Diagnóstico', icon: '<img src="img/incognito_logo.svg" class="link-custom-img-icon" alt="Incógnito SAC">', isQuick: true },
            { id: 'lnk_dashboard', name: 'Dashboard ZT', url: 'http://172.19.196.16:8080/acs/index.xhtml', category: 'Internet & Diagnóstico', icon: '<img src="img/dashboard_logo.svg" class="link-custom-img-icon" alt="Dashboard ZT">', isQuick: true },
            { id: 'lnk_tr69', name: 'TR69', url: 'http://172.17.27.238:8080/auth/login', category: 'Internet & Diagnóstico', icon: '<img src="img/tr69_logo.svg" class="link-custom-img-icon" alt="TR69 ACS">', isQuick: true },
            { id: 'lnk_schaman', name: 'Schaman', url: 'https://atc-clperu.schaman.com/schaman-sso/login?callback=AAAADDfLhTpFXbSJETw3QhDILl0NLOiLN0QoI8dU3SWwSKTvrjlJU4lSPMmuHTIXFb5Ctr09Tz2H8Se6pOTmA6e2Qww%3D&app=AAAADGMbhcwoHsi4O778tEhNo5SvofJD%2FIcQCFAyhlXeSZE6Mg5jbA%3D%3D&customer=AAAADAcU2Ikxs028MO8BAUqzICiPfU1bCdWstG2p6BMKi4wqtw%3D%3D', category: 'Internet & Diagnóstico', icon: '<img src="img/schaman_logo.svg" class="link-custom-img-icon" alt="Schaman">', isQuick: true },
            { id: 'lnk_plume', name: 'Plume', url: 'https://gamma.central.plume.com/', category: 'Internet & Diagnóstico', icon: '<img src="img/plume_logo.svg" class="link-custom-img-icon" alt="Plume">', isQuick: true },
            { id: 'lnk_remotedesktop', name: 'Escritorio Remoto', url: '172.29.0.101', category: 'Internet & Diagnóstico', icon: '🖥️', isQuick: true, isRdpInfo: true },
            { id: 'lnk_tracer', name: 'Tracer', url: 'http://172.19.112.62/generador/', category: 'Internet & Diagnóstico', icon: '<img src="img/claro_logo.svg" class="link-custom-img-icon" alt="Tracer">', isQuick: true },
            { id: 'lnk_tracerplano', name: 'Tracer - Cliente por Plano', url: 'http://172.19.112.62/generador/hfc/ConexionesPlano', category: 'Internet & Diagnóstico', icon: '<img src="img/claro_logo.svg" class="link-custom-img-icon" alt="Tracer">', isQuick: true },
            { id: 'lnk_youbora', name: 'Youbora', url: 'https://suite.npaw.com/login?redirect=/v/clarovideo_peru/analytics/tracking/video', category: 'Internet & Diagnóstico', icon: '<img src="img/youbora_logo.svg" class="link-custom-img-icon" alt="Youbora">', isQuick: true },
            { id: 'lnk_skyway', name: 'Skyway', url: 'https://www.skywayplatform.com/skyway-platform/login?tenantCode=1086&backUrl=%252Ftms%252Fmanagement%252Fdevice', category: 'Internet & Diagnóstico', icon: '<img src="img/skyway_logo.svg" class="link-custom-img-icon" alt="Skyway">', isQuick: true },

            { id: 'lnk_remedy_helix', name: 'BMC Helix', url: 'https://clarop-smartit.claro.pe/smartit/app/#/ticket-consoleStudio', category: 'Sistemas & Gestión', icon: '<img src="img/helix_logo.svg" class="link-custom-img-icon" alt="BMC Helix">', isQuick: true },
            { id: 'lnk_remedy_dwp', name: 'Remedy', url: 'https://clarop-dwp.claro.pe/dwp/app/#/activity/events/details', category: 'Sistemas & Gestión', icon: '<img src="img/remedy_dwp_logo.svg" class="link-custom-img-icon" alt="Remedy DWP">', isQuick: true },
            { id: 'lnk_ces', name: 'CES', url: 'http://intranetces.tim.com.pe/', category: 'Sistemas & Gestión', icon: '<img src="img/claro_logo.svg" class="link-custom-img-icon" alt="CES">', isQuick: true },
            { id: 'lnk_portal_apps', name: 'Portal de Aplicaciones', url: 'http://intranetwebapp/aplicaciones/inicio.aspx', category: 'Sistemas & Gestión', icon: '<img src="img/claro_logo.svg" class="link-custom-img-icon" alt="Portal de Aplicaciones">', isQuick: true },
            { id: 'lnk_linktrabajo', name: 'Link de Trabajo', url: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=CkbVXyW03kmb0PzSYnDTDItamkezRqRIvBJVVnC0d0pUQkEyRTRHM1dWOFNTMTAzUEI0ODQySThXVi4u&route=shorturl', category: 'Sistemas & Gestión', icon: '📝', isQuick: true },
            { id: 'lnk_powerbi', name: 'Microsoft Power BI', url: 'https://app.powerbi.com/view?r=eyJrIjoiZThhMzY4MjEtZTU5MS00YzFjLWE4OGMtYmI1NWFiOWJlMzgyIiwidCI6IjVmZDU0NjBhLWI0MjUtNDlkZS05YmQwLWZjZDI2MjcwZDMwYyIsImMiOjR9', category: 'Sistemas & Gestión', icon: '<img src="img/powerbi_logo.svg" class="link-custom-img-icon" alt="Power BI">', isQuick: true },
            { id: 'lnk_livechat', name: 'LiveChat (Aivo)', url: 'https://live-us.aivo.co/chat', category: 'Canales & Comunicación', icon: '<img src="img/livechat_logo.svg" class="link-custom-img-icon" alt="LiveChat">', isQuick: true },
            { id: 'lnk_aicc', name: 'AICC', url: 'https://10.189.8.188:28090/service-cloud/aicc-web/index/index.html#/ManualAppointWorkbenchDetails?taskId=1061244585&orgId=1752727161880235604&appointId=175435461525835224677465120200&eventType=AgentEvent_Customer_Release&updateCallId=1754354624-11840&isFirst=true&AgentEvent_Call_Out_Fail=true', category: 'Canales & Comunicación', icon: '<img src="img/huawei_icc.svg" class="link-custom-img-icon" alt="AICC">', isQuick: true },
            { id: 'lnk_siac', name: 'SIAC Único', url: 'https://siacunico.claro.com.pe/', category: 'Sistemas & Gestión', icon: '<img src="img/claro_logo.svg" class="link-custom-img-icon" alt="SIAC Único">', isQuick: false }
        ];

        const stripAccents = str => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        let workLinks = JSON.parse(localStorage.getItem('bo_work_links') || 'null');
        if (!workLinks || !Array.isArray(workLinks) || workLinks.length === 0) {
            workLinks = defaultWorkLinks;
        } else {
            // Eliminar enlaces obsoletos o retirados (Hygeia, SGA, WhatsApp, Incognito Provision mock, Tracer Consumo mock/duplicado)
            const removedIds = ['lnk_hygeia', 'lnk_sga', 'lnk_wsp', 'lnk_incognito_prov', 'lnk_incognito_provision', 'lnk_prov_incognito', 'lnk_tracer_consumo', 'lnk_tracerconsumo'];
            workLinks = workLinks.filter(l => {
                const normName = stripAccents(l.name);
                const normUrl = (l.url || '').toLowerCase();
                if (removedIds.includes(l.id)) return false;
                if (normName.includes('hygeia') || normName.includes('sga') || normName.includes('whatsapp')) return false;
                if (normName.includes('incognito') && (normName.includes('provisi') || normName.includes('prov')) && !normName.includes('sac')) return false;
                if (normUrl.includes('incognito.claro.com.pe') && !normUrl.includes('/sac/')) return false;
                if (normName.includes('tracer') && normName.includes('consumo')) return false;
                return true;
            });

            // Desduplicar enlaces asegurando que solo exista 1 registro único de Schaman y de cada plataforma
            const seenKeys = new Set();
            workLinks = workLinks.filter(l => {
                const normName = stripAccents(l.name);
                const key = (l.id === 'lnk_schaman' || normName.includes('schaman')) ? 'schaman_uniq' :
                    (l.id === 'lnk_incognito' || normName.includes('incognito')) ? 'incognito_uniq' :
                        (l.id === 'lnk_dashboard' || normName.includes('dashboard')) ? 'dashboard_uniq' :
                            (l.id === 'lnk_plume' || normName.includes('plume')) ? 'plume_uniq' :
                                (l.id === 'lnk_tr69' || normName.includes('tr69') || normName.includes('tr-69')) ? 'tr69_uniq' :
                                    (l.id === 'lnk_tracerplano' || normName.includes('plano')) ? 'tracerplano_uniq' :
                                        (l.id === 'lnk_tracer' || normName === 'tracer') ? 'tracer_uniq' :
                                            (l.id === 'lnk_youbora' || normName.includes('youbora') || normName.includes('npaw')) ? 'youbora_uniq' :
                                                (l.id === 'lnk_skyway' || normName.includes('skyway')) ? 'skyway_uniq' :
                                                    (l.id === 'lnk_ces' || normName === 'ces' || normName.includes('intranetces') || (l.url && l.url.includes('intranetces'))) ? 'ces_uniq' :
                                                        (l.id === 'lnk_portal_apps' || normName.includes('portal de aplicaciones') || normName.includes('intranetwebapp') || (l.url && l.url.includes('intranetwebapp'))) ? 'portalapps_uniq' :
                                                            (l.id === 'lnk_siac' || normName.includes('siac')) ? 'siac_uniq' :
                                                                (l.id === 'lnk_powerbi' || normName.includes('powerbi') || normName.includes('power bi')) ? 'powerbi_uniq' :
                                                                    (l.id === 'lnk_livechat' || normName.includes('livechat')) ? 'livechat_uniq' :
                                                                        (l.id === 'lnk_aicc' || normName.includes('aicc') || normName === 'icc') ? 'aicc_uniq' :
                                                                            (l.id === 'lnk_remedy_helix' || (normName.includes('helix') && !normName.includes('dwp'))) ? 'helix_uniq' :
                                                                                (l.id === 'lnk_remedy_dwp' || (normName.includes('dwp') || (normName.includes('remedy') && !normName.includes('helix')))) ? 'dwp_uniq' :
                                                                                    (l.id === 'lnk_remotedesktop' || normName.includes('escritorio') || normName.includes('rdp')) ? 'rdp_uniq' :
                                                                                        (l.id === 'lnk_linktrabajo' || normName.includes('trabajo')) ? 'trabajo_uniq' :
                                                                                            l.id || normName;
                if (seenKeys.has(key)) return false;
                seenKeys.add(key);
                return true;
            });

            // Fusión y actualización inteligente de URLs e iconos por defecto
            defaultWorkLinks.forEach(defLnk => {
                const defNorm = stripAccents(defLnk.name);
                const existing = workLinks.find(l => {
                    const lNorm = stripAccents(l.name);
                    return l.id === defLnk.id || lNorm === defNorm ||
                        (defLnk.id === 'lnk_incognito' && lNorm.includes('incognito')) ||
                        (defLnk.id === 'lnk_dashboard' && lNorm.includes('dashboard')) ||
                        (defLnk.id === 'lnk_linktrabajo' && lNorm.includes('trabajo')) ||
                        (defLnk.id === 'lnk_portal_apps' && (lNorm.includes('portal de aplicaciones') || lNorm.includes('intranetwebapp') || (l.url && l.url.includes('intranetwebapp')))) ||
                        (defLnk.id === 'lnk_powerbi' && (lNorm.includes('powerbi') || lNorm.includes('power bi'))) ||
                        (defLnk.id === 'lnk_youbora' && (lNorm.includes('youbora') || lNorm.includes('npaw') || (l.url && l.url.includes('npaw.com')))) ||
                        (defLnk.id === 'lnk_skyway' && (lNorm.includes('skyway') || (l.url && l.url.includes('skywayplatform.com')))) ||
                        (defLnk.id === 'lnk_livechat' && lNorm.includes('livechat')) ||
                        (defLnk.id === 'lnk_aicc' && (lNorm.includes('aicc') || lNorm === 'icc')) ||
                        (defLnk.id === 'lnk_remedy_helix' && (lNorm.includes('helix') || l.id === 'lnk_remedy')) ||
                        (defLnk.id === 'lnk_remedy_dwp' && (lNorm.includes('dwp') || (lNorm.includes('remedy') && !lNorm.includes('helix')))) ||
                        (defLnk.id === 'lnk_ces' && (lNorm === 'ces' || lNorm.includes('ces') || (l.url && l.url.includes('intranetces')))) ||
                        (defLnk.id === 'lnk_schaman' && lNorm.includes('schaman')) ||
                        (defLnk.id === 'lnk_plume' && lNorm.includes('plume')) ||
                        (defLnk.id === 'lnk_tr69' && (lNorm.includes('tr69') || lNorm.includes('tr-69'))) ||
                        (defLnk.id === 'lnk_tracer' && lNorm === 'tracer') ||
                        (defLnk.id === 'lnk_tracerplano' && lNorm.includes('plano')) ||
                        (defLnk.id === 'lnk_siac' && lNorm.includes('siac')) ||
                        (defLnk.id === 'lnk_remotedesktop' && lNorm.includes('escritorio'));
                });
                if (existing) {
                    existing.id = defLnk.id;
                    existing.url = defLnk.url;
                    existing.name = defLnk.name;
                    existing.icon = defLnk.icon;
                    if (defLnk.isRdpInfo) existing.isRdpInfo = true;
                } else if (!workLinks.some(l => l.id === defLnk.id)) {
                    workLinks.push(defLnk);
                }
            });

            // Pase final de desduplicación garantizada
            const finalSeen = new Set();
            workLinks = workLinks.filter(l => {
                const norm = stripAccents(l.name);
                const key = (l.id === 'lnk_schaman' || norm.includes('schaman')) ? 'schaman_uniq' :
                    (l.id === 'lnk_incognito' || norm.includes('incognito')) ? 'incognito_uniq' :
                        (l.id === 'lnk_ces' || norm === 'ces' || norm.includes('intranetces') || (l.url && l.url.includes('intranetces'))) ? 'ces_uniq' :
                            (l.id === 'lnk_portal_apps' || norm.includes('portal de aplicaciones') || norm.includes('intranetwebapp')) ? 'portalapps_uniq' :
                                (l.id === 'lnk_youbora' || norm.includes('youbora') || norm.includes('npaw')) ? 'youbora_uniq' :
                                    (l.id === 'lnk_skyway' || norm.includes('skyway')) ? 'skyway_uniq' :
                                        (l.id === 'lnk_powerbi' || norm.includes('powerbi') || norm.includes('power bi')) ? 'powerbi_uniq' :
                                            (l.id || norm);
                if (finalSeen.has(key)) return false;
                finalSeen.add(key);
                return true;
            });
        }
        localStorage.setItem('bo_work_links', JSON.stringify(workLinks));

        const sidebar = document.getElementById('linksSidebar');
        const overlay = document.getElementById('linksSidebarOverlay');
        const openBtn = document.getElementById('btnOpenLinksSidebar');
        const closeBtn = document.getElementById('btnCloseLinksSidebar');
        const searchInput = document.getElementById('sidebarLinkSearch');

        const quickGrid = document.getElementById('sidebarQuickLinks');
        const fullContainer = document.getElementById('sidebarFullLinksContainer');

        const addBtn = document.getElementById('btnAddCustomLinkBtn');
        const addForm = document.getElementById('addCustomLinkForm');
        const cancelAddBtn = document.getElementById('btnCancelAddLink');
        const saveAddBtn = document.getElementById('btnSaveCustomLink');

        const newNameInput = document.getElementById('newLinkName');
        const newUrlInput = document.getElementById('newLinkUrl');
        const newCatSelect = document.getElementById('newLinkCategory');

        const rdpInfoModal = document.getElementById('rdpInfoModal');
        const rdpInfoModalClose = document.getElementById('rdpInfoModalClose');
        const rdpInfoModalCancel = document.getElementById('rdpInfoModalCancel');
        const btnModalCopyRdpIp = document.getElementById('btnModalCopyRdpIp');
        const btnModalCopyRdpDomain = document.getElementById('btnModalCopyRdpDomain');
        const rdpModalDisplayIp = document.getElementById('rdpModalDisplayIp');

        function openRdpInfoModal(ip = '172.29.0.101') {
            if (rdpModalDisplayIp) rdpModalDisplayIp.textContent = ip;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ip).catch(() => { });
            }
            if (rdpInfoModal) rdpInfoModal.classList.add('active');
            showToast(`🖥️ IP ${ip} copiada al portapapeles`, 'info');
        }

        function closeRdpInfoModal() {
            if (rdpInfoModal) rdpInfoModal.classList.remove('active');
        }

        if (rdpInfoModalClose) rdpInfoModalClose.addEventListener('click', closeRdpInfoModal);
        if (rdpInfoModalCancel) rdpInfoModalCancel.addEventListener('click', closeRdpInfoModal);
        if (rdpInfoModal) {
            rdpInfoModal.addEventListener('click', (e) => {
                if (e.target === rdpInfoModal) closeRdpInfoModal();
            });
        }

        if (btnModalCopyRdpIp) {
            btnModalCopyRdpIp.addEventListener('click', () => {
                const ip = rdpModalDisplayIp ? rdpModalDisplayIp.textContent : '172.29.0.101';
                copyToClipboard(ip, `📋 IP ${ip} copiada al portapapeles`);
            });
        }

        if (btnModalCopyRdpDomain) {
            btnModalCopyRdpDomain.addEventListener('click', () => {
                copyToClipboard('TIM\\', '📋 Prefijo TIM\\ copiado al portapapeles');
            });
        }

        function openSidebar() {
            const manualsSidebar = document.getElementById('manualsSidebar');
            const manualsOverlay = document.getElementById('manualsSidebarOverlay');
            if (manualsSidebar) manualsSidebar.classList.remove('open');
            if (manualsOverlay) manualsOverlay.classList.remove('active');

            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            if (searchInput) {
                searchInput.value = '';
                renderSidebarLinks();
                setTimeout(() => searchInput.focus(), 150);
            }
        }

        function closeSidebar() {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            if (addForm) addForm.style.display = 'none';
        }

        if (openBtn) openBtn.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        // Atajo global: Alt + L para abrir/cerrar sidebar
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'l' || e.key === 'L')) {
                e.preventDefault();
                if (sidebar && sidebar.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            } else if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        // Búsqueda en tiempo real
        if (searchInput) {
            searchInput.addEventListener('input', renderSidebarLinks);
        }

        // Agregar Link Form Toggle
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (addForm) {
                    const isHidden = addForm.style.display === 'none';
                    addForm.style.display = isHidden ? 'block' : 'none';
                    if (isHidden && newNameInput) newNameInput.focus();
                }
            });
        }

        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', () => {
                if (addForm) addForm.style.display = 'none';
            });
        }

        if (saveAddBtn) {
            saveAddBtn.addEventListener('click', () => {
                const name = (newNameInput.value || '').trim();
                let url = (newUrlInput.value || '').trim();
                const category = newCatSelect.value;

                if (!name || !url) {
                    showToast('⚠️ Ingresa un nombre y URL válidos', 'warning');
                    return;
                }

                if (!/^https?:\/\//i.test(url) && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
                    url = 'https://' + url;
                }

                const newLink = {
                    id: 'lnk_' + Date.now(),
                    name,
                    url,
                    category,
                    icon: '🔗',
                    isQuick: true,
                    isCustom: true
                };

                workLinks.push(newLink);
                localStorage.setItem('bo_work_links', JSON.stringify(workLinks));

                newNameInput.value = '';
                newUrlInput.value = '';
                if (addForm) addForm.style.display = 'none';

                renderSidebarLinks();
                showToast(`🔗 Enlace "${name}" guardado`);
            });
        }

        function toggleQuickStatus(id) {
            const index = workLinks.findIndex(l => l.id === id);
            if (index >= 0) {
                workLinks[index].isQuick = !workLinks[index].isQuick;
                localStorage.setItem('bo_work_links', JSON.stringify(workLinks));
                renderSidebarLinks();
            }
        }

        function deleteCustomLink(id) {
            if (confirm('¿Desea eliminar este enlace personalizado?')) {
                workLinks = workLinks.filter(l => l.id !== id);
                localStorage.setItem('bo_work_links', JSON.stringify(workLinks));
                renderSidebarLinks();
                showToast('Enlace eliminado');
            }
        }

        function renderSidebarLinks() {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            const filtered = workLinks.filter(l =>
                l.name.toLowerCase().includes(query) ||
                l.category.toLowerCase().includes(query) ||
                l.url.toLowerCase().includes(query)
            );

            // 1. Render Accesos Rápidos
            if (quickGrid) {
                quickGrid.innerHTML = '';
                const quickList = filtered.filter(l => l.isQuick);

                if (quickList.length === 0) {
                    quickGrid.innerHTML = '<div style="font-size:0.78rem; color:var(--text-muted); grid-column:1/-1;">No hay accesos rápidos marcados.</div>';
                } else {
                    quickList.forEach(lnk => {
                        const card = document.createElement('a');
                        card.className = 'quick-link-card';

                        if (lnk.isRdpInfo) {
                            card.href = '#';
                            card.title = `Escritorio Remoto (${lnk.url})\nClic para ver datos de acceso y copiar`;
                            card.innerHTML = `
                                <span>${lnk.icon || '🖥️'} ${lnk.name}</span>
                                <span style="font-size:0.75rem; color:var(--primary);">📋</span>
                            `;
                            card.addEventListener('click', (e) => {
                                e.preventDefault();
                                openRdpInfoModal(lnk.url);
                            });
                        } else {
                            card.href = lnk.url;
                            card.target = '_blank';
                            card.rel = 'noopener noreferrer';
                            card.title = `Abrir ${lnk.name}\n${lnk.url}`;
                            card.innerHTML = `
                                <span>${lnk.icon || '🔗'} ${lnk.name}</span>
                                <span style="font-size:0.75rem; color:var(--primary);">↗</span>
                            `;
                        }
                        quickGrid.appendChild(card);
                    });
                }
            }

            // 2. Render Catálogo Completo por Categorías
            if (fullContainer) {
                fullContainer.innerHTML = '';

                if (filtered.length === 0) {
                    fullContainer.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:1rem 0;">No se encontraron enlaces con ese término.</div>';
                    return;
                }

                // Agrupar por Categorías
                const categoriesMap = {};
                filtered.forEach(lnk => {
                    const cat = lnk.category || 'Otros Enlaces';
                    if (!categoriesMap[cat]) categoriesMap[cat] = [];
                    categoriesMap[cat].push(lnk);
                });

                Object.keys(categoriesMap).forEach(catName => {
                    const groupDiv = document.createElement('div');
                    groupDiv.style.marginBottom = '1.1rem';

                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'sidebar-section-title';
                    groupTitle.style.cssText = 'color:var(--primary); margin-bottom:0.4rem; font-size:0.78rem;';
                    groupTitle.textContent = catName;
                    groupDiv.appendChild(groupTitle);

                    categoriesMap[catName].forEach(lnk => {
                        const row = document.createElement('div');
                        row.className = 'link-item-row';

                        const starIcon = lnk.isQuick ? '⭐' : '☆';
                        const starTitle = lnk.isQuick ? 'Quitar de accesos rápidos' : 'Marcar como acceso rápido';

                        let deleteBtnHtml = '';
                        if (lnk.isCustom) {
                            deleteBtnHtml = `<button class="btn-link-action btn-del-link" title="Eliminar enlace personalizado" style="color:var(--danger);">🗑️</button>`;
                        }

                        let openActionHtml = '';
                        if (lnk.isRdpInfo) {
                            openActionHtml = `<button class="btn-link-action btn-open-rdp-info" title="Ver datos de conexión" style="font-weight:bold; color:var(--primary);">Ver datos 📋</button>`;
                        } else {
                            openActionHtml = `<a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="btn-link-action" title="Abrir portal en nueva pestaña" style="font-weight:bold; color:var(--primary);">Abrir ↗</a>`;
                        }

                        row.innerHTML = `
                            <div class="link-item-info" style="${lnk.isRdpInfo ? 'cursor:pointer;' : ''}">
                                <div class="link-item-name">${lnk.icon || '🔗'} ${lnk.name}</div>
                                <div class="link-item-url">${lnk.isRdpInfo ? `IP: ${lnk.url} • Dominio: TIM\\` : lnk.url}</div>
                            </div>
                            <div class="link-actions">
                                <button class="btn-link-action btn-star-link" title="${starTitle}">${starIcon}</button>
                                <button class="btn-link-action btn-copy-url" title="${lnk.isRdpInfo ? 'Copiar IP' : 'Copiar URL'}">📋</button>
                                ${openActionHtml}
                                ${deleteBtnHtml}
                            </div>
                        `;

                        // Event Listeners para las acciones de cada fila
                        const btnStar = row.querySelector('.btn-star-link');
                        if (btnStar) {
                            btnStar.addEventListener('click', (e) => {
                                e.stopPropagation();
                                toggleQuickStatus(lnk.id);
                            });
                        }

                        const btnCopy = row.querySelector('.btn-copy-url');
                        if (btnCopy) {
                            btnCopy.addEventListener('click', (e) => {
                                e.stopPropagation();
                                copyToClipboard(lnk.url, lnk.isRdpInfo ? `IP copiada: ${lnk.url}` : `URL copiada: ${lnk.name}`);
                            });
                        }

                        const btnOpenRdp = row.querySelector('.btn-open-rdp-info');
                        if (btnOpenRdp) {
                            btnOpenRdp.addEventListener('click', (e) => {
                                e.stopPropagation();
                                openRdpInfoModal(lnk.url);
                            });
                        }

                        if (lnk.isRdpInfo) {
                            const infoDiv = row.querySelector('.link-item-info');
                            if (infoDiv) {
                                infoDiv.addEventListener('click', () => {
                                    openRdpInfoModal(lnk.url);
                                });
                            }
                        }

                        const btnDel = row.querySelector('.btn-del-link');
                        if (btnDel) {
                            btnDel.addEventListener('click', (e) => {
                                e.stopPropagation();
                                deleteCustomLink(lnk.id);
                            });
                        }

                        groupDiv.appendChild(row);
                    });

                    fullContainer.appendChild(groupDiv);
                });
            }
        }

        renderSidebarLinks();
    }

    // =========================================================================
    // MANUALS & TECHNICAL GUIDES SIDEBAR MODULE
    // =========================================================================
    function initManualsSidebar() {
        const sidebar = document.getElementById('manualsSidebar');
        const overlay = document.getElementById('manualsSidebarOverlay');
        const openBtn = document.getElementById('btnOpenManualsSidebar');
        const closeBtn = document.getElementById('btnCloseManualsSidebar');
        const searchInput = document.getElementById('sidebarManualSearch');
        const filterBar = document.getElementById('manualsCategoryFilter');
        const listContainer = document.getElementById('manualsListContainer');
        const countBadge = document.getElementById('manualsCountBadge');
        const headerBadge = document.getElementById('headerManualsBadge');

        // Modal de Visualización de PDF
        const viewerModal = document.getElementById('manualViewerModal');
        const viewerContainer = document.getElementById('manualViewerContainer');
        const viewerTitle = document.getElementById('manualViewerTitle');
        const viewerCategory = document.getElementById('manualViewerCategory');
        const viewerIcon = document.getElementById('manualViewerIcon');
        const viewerFrame = document.getElementById('manualViewerFrame');
        const btnCloseViewer = document.getElementById('btnCloseManualViewer');
        const btnViewerDownload = document.getElementById('btnManualViewerDownload');
        const btnViewerExternal = document.getElementById('btnManualViewerExternal');
        const btnViewerFullscreen = document.getElementById('btnManualViewerFullscreen');

        const manuals = (typeof manualesData !== 'undefined') ? manualesData : (window.manualesData || []);
        if (countBadge) countBadge.textContent = manuals.length;
        if (headerBadge) headerBadge.textContent = manuals.length;

        let activeCategory = 'Todos';

        function openManualViewer(manual) {
            if (!viewerModal) return;
            const fileUrl = `manuales/${encodeURIComponent(manual.filename)}`;

            if (viewerTitle) viewerTitle.textContent = manual.title;
            if (viewerCategory) viewerCategory.textContent = `${manual.category} • ${manual.size} • Guía Técnica`;
            if (btnViewerDownload) {
                btnViewerDownload.href = fileUrl;
                btnViewerDownload.download = manual.filename;
            }
            if (btnViewerExternal) {
                btnViewerExternal.href = fileUrl;
            }
            if (viewerFrame) {
                viewerFrame.src = fileUrl;
            }

            viewerModal.classList.add('active');
            closeSidebar();
        }

        function closeManualViewer() {
            if (!viewerModal) return;
            viewerModal.classList.remove('active');
            if (viewerContainer) viewerContainer.classList.remove('fullscreen');
            if (viewerFrame) viewerFrame.src = 'about:blank';
        }

        function toggleViewerFullscreen() {
            if (viewerContainer) {
                viewerContainer.classList.toggle('fullscreen');
                if (btnViewerFullscreen) {
                    btnViewerFullscreen.textContent = viewerContainer.classList.contains('fullscreen') ? '🗗' : '⛶';
                }
            }
        }

        if (btnCloseViewer) btnCloseViewer.addEventListener('click', closeManualViewer);
        if (btnViewerFullscreen) btnViewerFullscreen.addEventListener('click', toggleViewerFullscreen);
        if (viewerModal) {
            viewerModal.addEventListener('click', (e) => {
                if (e.target === viewerModal) closeManualViewer();
            });
        }

        function openSidebar() {
            // Cerrar sidebar de links si estuviese abierto
            const linksSidebar = document.getElementById('linksSidebar');
            const linksOverlay = document.getElementById('linksSidebarOverlay');
            if (linksSidebar) linksSidebar.classList.remove('open');
            if (linksOverlay) linksOverlay.classList.remove('active');

            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            if (searchInput) {
                searchInput.value = '';
                renderManuals();
                setTimeout(() => searchInput.focus(), 150);
            }
        }

        function closeSidebar() {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        }

        if (openBtn) openBtn.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        // Atajo global: Alt + M para abrir/cerrar sidebar de manuales y Esc para cerrar modal/sidebar
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
                e.preventDefault();
                if (viewerModal && viewerModal.classList.contains('active')) {
                    closeManualViewer();
                } else if (sidebar && sidebar.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            } else if (e.key === 'Escape') {
                if (viewerModal && viewerModal.classList.contains('active')) {
                    closeManualViewer();
                } else if (sidebar && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', renderManuals);
        }

        function renderCategoryFilterBar() {
            if (!filterBar) return;
            filterBar.innerHTML = '';

            const categories = ['Todos', ...new Set(manuals.map(m => m.category))];

            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `manual-filter-chip ${cat === activeCategory ? 'active' : ''}`;
                btn.textContent = cat;
                btn.addEventListener('click', () => {
                    activeCategory = cat;
                    renderCategoryFilterBar();
                    renderManuals();
                });
                filterBar.appendChild(btn);
            });
        }

        function renderManuals() {
            if (!listContainer) return;
            listContainer.innerHTML = '';

            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            const filtered = manuals.filter(m => {
                const matchesCategory = (activeCategory === 'Todos' || m.category === activeCategory);
                if (!matchesCategory) return false;

                if (!query) return true;

                const searchTarget = [
                    m.title,
                    m.description,
                    m.category,
                    m.filename,
                    ...(m.tags || [])
                ].join(' ').toLowerCase();

                const searchTerms = query.split(/\s+/).filter(Boolean);
                return searchTerms.every(term => searchTarget.includes(term));
            });

            if (filtered.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted);">
                        <div style="font-size:2rem; margin-bottom:0.5rem;">🔍</div>
                        <div style="font-weight:600; font-size:0.9rem; color:var(--text-main);">No se encontraron manuales</div>
                        <div style="font-size:0.78rem; margin-top:0.3rem;">Intenta buscar por palabra clave (ej. <em>Lentitud</em>, <em>TR69</em>, <em>Niveles</em>) o selecciona otra categoría.</div>
                    </div>
                `;
                return;
            }

            filtered.forEach(m => {
                const card = document.createElement('div');
                card.className = 'manual-card';

                const encodedFile = encodeURIComponent(m.filename);
                const fileUrl = `manuales/${encodedFile}`;

                const tagsHtml = (m.tags || []).map(t => `<span class="manual-tag-pill">#${t}</span>`).join('');

                card.innerHTML = `
                    <div class="manual-card-header" style="cursor:pointer;" title="Clic para ver en pantalla">
                        <div class="manual-card-title-box">
                            <div class="manual-card-title">${m.title}</div>
                            <div class="manual-card-meta">
                                <span class="manual-cat-badge">${m.category}</span>
                                <span class="manual-size-badge">${m.size}</span>
                                <span class="manual-size-badge">PDF</span>
                            </div>
                        </div>
                    </div>
                    <div class="manual-card-desc">${m.description}</div>
                    <div class="manual-card-tags">${tagsHtml}</div>
                    <div class="manual-card-actions">
                        <a href="${fileUrl}" download="${m.filename}" class="btn-manual-download" title="Descargar archivo en tu equipo">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Descargar
                        </a>
                        <button type="button" class="btn-manual-open btn-view-manual-modal" title="Abrir visor en modal">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; flex-shrink:0;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            Ver Manual
                        </button>
                    </div>
                `;

                // Clic en Header de la tarjeta para abrir modal
                const headerBox = card.querySelector('.manual-card-header');
                if (headerBox) {
                    headerBox.addEventListener('click', () => openManualViewer(m));
                }

                // Clic en botón "Ver Manual"
                const btnViewModal = card.querySelector('.btn-view-manual-modal');
                if (btnViewModal) {
                    btnViewModal.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openManualViewer(m);
                    });
                }

                listContainer.appendChild(card);
            });
        }

        renderCategoryFilterBar();
        renderManuals();
    }

    // Initialize all modules
    initLinksSidebar();
    initManualsSidebar();
    initGeneratorTab();
    initTrackerTab();
});
