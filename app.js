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
            
            // 1. Capitalizar inicio de línea o tras viñetas (- , * , • , 1. , 1) )
            let res = line.replace(/^(\s*[-*•\d.)\]]\s*)([a-záéíóúñ])/i, (m, prefix, char) => prefix + char.toUpperCase())
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

        // 5. Input change listeners (Limpian resaltados de error al escribir)
        [
            elements.genProblema, elements.genTelefono, elements.genSot,
            elements.genDescartes, elements.genCatResolucion,
            elements.genCatCausa
        ].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    e.target.classList.remove('input-invalid');
                    renderGeneratorPreviews();
                });
                input.addEventListener('change', renderGeneratorPreviews);
            }
        });

        // Validación Inteligente: Número de Contacto (Solo dígitos numéricos)
        if (elements.genTelefono) {
            const telefonoWarning = document.getElementById('genTelefonoWarning');
            let warningTimeout = null;

            const triggerPhoneWarning = (msg = '⚠️ Solo se permiten números en el teléfono') => {
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

            // 1. Bloquear teclas no numéricas al tipear
            elements.genTelefono.addEventListener('keydown', (e) => {
                // Permitir teclas de control y navegación
                const allowedControlKeys = [
                    'Backspace', 'Tab', 'Enter', 'Delete', 'Escape',
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End'
                ];
                if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
                    return;
                }

                // Si no es un dígito entre 0 y 9, cancelar y avisar
                if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                    triggerPhoneWarning('⚠️ Solo se permiten números en el teléfono');
                }
            });

            // 2. Filtrado y sanitizado al pegar texto (Paste)
            elements.genTelefono.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text') || '';
                const digitsOnly = pastedText.replace(/\D/g, '');

                if (!digitsOnly) {
                    triggerPhoneWarning('⚠️ El texto pegado no contiene números válidos');
                    return;
                }

                if (digitsOnly !== pastedText.trim()) {
                    triggerPhoneWarning('⚠️ Solo números: Se eliminaron letras y caracteres especiales');
                }

                elements.genTelefono.value = digitsOnly;
                renderGeneratorPreviews();
            });

            // 3. Listener reactivo para limpiar caracteres residuales y actualizar vista previa
            elements.genTelefono.addEventListener('input', () => {
                const currentVal = elements.genTelefono.value;
                if (/\D/.test(currentVal)) {
                    elements.genTelefono.value = currentVal.replace(/\D/g, '');
                    triggerPhoneWarning('⚠️ Solo se permiten números en este campo');
                }
                renderGeneratorPreviews();
            });

            elements.genTelefono.addEventListener('change', renderGeneratorPreviews);
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

            // Limpiar resaltados de error por validación
            document.querySelectorAll('.input-invalid').forEach(el => el.classList.remove('input-invalid'));
            const telefonoWarning = document.getElementById('genTelefonoWarning');
            if (telefonoWarning) telefonoWarning.style.display = 'none';

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

        const currentService = (elements.genServicio?.value || 'INTERNET').toUpperCase();

        const quickDescartesByService = {
            "INTERNET": [
                { label: "Consumo Tracer",       states: ["Se valida consumo en Tracer", "Sin consumo en Tracer"] },
                { label: "Provisión e Incógnito", states: ["Se valida provisión y online en Incógnito", "Sin provisión / no carga en Incógnito"] },
                { label: "Dashboard OK",          states: ["Se valida Dashboard OK", "Dashboard con avería"] },
                { label: "TR69 Todo OK",           states: ["Se valida TR69 todo OK", "TR69 con errores"] },
                { label: "Schaman OK",             states: ["Se valida Schaman OK", "Schaman con avería"] },
                { label: "Plume",                  states: ["Se valida cliente Plume", "Se valida cliente Plume desalineado con alertas"] },
                { label: "Escritorio Remoto",      states: ["Se hace reinicio de fábrica desde Escritorio Remoto", "Sin acceso al Escritorio Remoto"] },
                { label: "SGA OK",                 states: ["Se valida datos de SOT e historial en SGA", "Se valida provisión incorrecta en SGA"] },
                { label: "Ciclo de Llamada",       states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
            ],
            "IPTV": [
                { label: "Provisión e Incógnito", states: ["Se valida provisión y online en Incógnito", "Sin provisión / no carga en Incógnito"] },
                { label: "Skyway",                 states: ["Se valida parámetros y estado OK en Skyway", "Parámetros desalineados en Skyway"] },
                { label: "Youbora",                states: ["Se valida métricas y reproducción OK en Youbora", "Youbora con alertas de buffering / errores de reproducción"] },
                { label: "Ciclo de Llamada",       states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
            ],
            "TELEFONIA": [
                { label: "Provisión e Incógnito", states: ["Se valida provisión y estado de telefonía en Incógnito", "Línea telefónica sin provisión en Incógnito"] },
                { label: "IMS / CBIO",             states: ["Se valida registro en IMS / CBIO OK", "Falla de autenticación en IMS / CBIO"] },
                { label: "Tono y Llamadas",        states: ["Se valida tono de discado y tráfico de llamadas OK", "Sin tono de discado / no salen ni entran llamadas"] },
                { label: "SGA OK",                 states: ["Se valida datos de SOT e historial de telefonía en SGA", "Datos desalineados en SGA"] },
                { label: "Ciclo de Llamada",       states: ["1er intento de contacto: Cliente no contesta, se envía mensaje por LiveChat y se deja mensaje en buzón de voz (1er ciclo)", "2do intento de contacto: Cliente no contesta (2do ciclo)", "Se cumple ciclo de llamada 2x3 (3 intentos sin contacto), cliente nunca respondió, se procede con el cierre del caso"], icon: '📞 ' }
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

    function formatDescartesLines(rawText) {
        if (!rawText || !rawText.trim()) return 'Descartes: N/A';
        
        // Separar tanto por saltos de línea como por comas y punto y coma
        const items = rawText.split(/[\r\n,;]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => {
                // Limpiar viñetas si las tuviera al inicio (- , * , • , 1. )
                let clean = s.replace(/^[-*•\d.)\]]\s*/, '').trim();
                if (!clean) return '';
                // Asegurar mayúscula inicial en cada elemento de descarte
                return clean.charAt(0).toUpperCase() + clean.slice(1);
            })
            .filter(s => s.length > 0);
        
        if (items.length === 0) return 'Descartes: N/A';
        
        const prefix = 'Descartes: ';
        const indent = '           '; // 11 espacios para alinear bajo el primer descarte
        
        return prefix + items[0] + (items.length > 1 ? '\n' + items.slice(1).map(l => indent + l).join('\n') : '');
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
        const rawProblema = (elements.genProblema.value || 'INT - BAJA VELOCIDAD VIA CABLEADO').trim();
        let cleanProblema = rawProblema.replace(/^(INT|TEL|IPTV|CABLE|APPS)\s*-\s*/i, '').trim();
        if (!cleanProblema) cleanProblema = rawProblema;

        const telefono = (elements.genTelefono.value || 'N/A').trim();
        const sot = (elements.genSot.value || 'N/A').trim();
        
        const rawSolucion = ((elements.genSolucion && elements.genSolucion.value) ? elements.genSolucion.value.trim() : 'N/A');
        const solucion = rawSolucion !== 'N/A' ? autoCorrectText(rawSolucion, false) : 'N/A';

        const rawDescartesInput = (elements.genDescartes ? elements.genDescartes.value : '');
        const rawDescartes = (rawDescartesInput || 'Se realizan descartes de protocolo').trim();
        const correctedDescartes = autoCorrectText(rawDescartes, false);
        const descartesFormatted = formatDescartesLines(correctedDescartes);
        const tagsStr = state.selectedHashtags.size > 0 ? Array.from(state.selectedHashtags).join(' ') : 'N/A';

        const contactLines = getFormattedContactLines();

        const isAutoCiclo = checkIsCiclo(rawDescartes);
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

        // Manejo adaptativo del campo Solución según el protocolo de Ciclo 2x3 (3 ciclos en 2 días)
        const descartesLower = (rawDescartes || '').toLowerCase();
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
        const sotSiacLine = (sotRaw && sotRaw.toUpperCase() !== 'N/A') ? `\nSOT / REMEDY: ${sotRaw}` : '';

        // Template SIAC (Standard or Ciclo de Llamada)
        let siacText = '';
        if (isCiclo) {
            const solucionCicloLine = (solucion && solucion !== 'N/A' && solucion.trim() !== '') ? `\nSolución: ${solucion}` : '';
            siacText = `BACK OFFICE 2N HITSS - CICLO DE LLAMADA:
************************
Teléfono: ${telefono}
${descartesFormatted}${solucionCicloLine}${sotSiacLine}
${contactLines}`;
        } else {
            siacText = `BACK OFFICE 2N HITSS:
************************
Teléfono: ${telefono}
Problema: ${cleanProblema}
${descartesFormatted}
Solución: ${solucion}${sotSiacLine}
${contactLines}`;
        }

        // Template Mantenimiento (MANTO) - Formato de Plataforma para Técnicos
        const rawDescartesManto = autoCorrectText((elements.genDescartes.value || 'Se realizan descartes de protocolo').trim(), false);
        const contactIdVal = (Array.from(state.callIds).concat(Array.from(state.chatIds)).join(' / ') || (elements.genContactId ? elements.genContactId.value.trim() : '') || 'N/A');
        
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

        if (elements.previewSiac) elements.previewSiac.textContent = siacText;
        if (elements.previewManto) elements.previewManto.textContent = mantoText;
    }

    function validateTemplateRequirements() {
        const rawDescartes = (elements.genDescartes ? elements.genDescartes.value : '');
        const isAutoCiclo = checkIsCiclo(rawDescartes);
        const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;

        const missingFieldNames = [];
        const missingElements = [];

        // 1. Número de Contacto
        const telefono = (elements.genTelefono ? elements.genTelefono.value : '').trim();
        if (!telefono || telefono.length < 6 || telefono.toUpperCase() === 'N/A') {
            missingFieldNames.push('Número de Contacto');
            if (elements.genTelefono) missingElements.push(elements.genTelefono);
        }

        // 2. Descripción / Problema del Cliente (Solo requerido en modo atención normal)
        if (!isCiclo) {
            const problema = (elements.genProblema ? elements.genProblema.value : '').trim();
            if (!problema || problema.toUpperCase() === 'N/A') {
                missingFieldNames.push('Descripción del Cliente / Problema');
                const trigger = document.getElementById('genProblemaTrigger');
                if (trigger) missingElements.push(trigger);
            }
        }

        // 3. Descartes Realizados / Intento de Ciclo
        const descartes = (elements.genDescartes ? elements.genDescartes.value : '').trim();
        if (!descartes || descartes.toUpperCase() === 'N/A' || descartes.length < 3) {
            missingFieldNames.push(isCiclo ? 'Intento de Ciclo de Llamada' : 'Descartes Realizados (Mín. 1)');
            if (elements.genDescartes) missingElements.push(elements.genDescartes);
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

        copyToClipboard(previewElement.textContent, successMsg);
        addHistoryRecord(logType, elements.genServicio.value, previewElement.textContent);
        return true;
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
            const isAutoCiclo = checkIsCiclo(elements.genDescartes.value || '');
            const isCiclo = state.cicloOverride !== null ? state.cicloOverride : isAutoCiclo;
            const msg = isCiclo ? 'Plantilla Ciclo de Llamada copiada' : 'Plantilla SIAC/SGA copiada';
            const logType = isCiclo ? 'Generador Ciclo' : 'Generador SIAC';

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
                            status: 'WARNING', 
                            text: `⚠️ Observación - Variación en Bloque: Δ ${delta} ${unit} (Máx: ${maxVal}, Mín: ${minVal} - Diferencia > 4.0 ${unit})` 
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
                    const customerId = remedyTelCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '[Customer ID]');
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
                    const customerId = remedyIptvCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '[Customer ID]');
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
                    const customerId = remedyTelCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '—');
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
                                            <div class="remedy-word-img-label">Evidencia #${i+1} (Clic para ampliar):</div>
                                            <img src="${img}" class="remedy-word-img" alt="Evidencia ${i+1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
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
                    const customerId = remedyIptvCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '—');
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
                                            <div class="remedy-word-img-label">Evidencia #${i+1} (Clic para ampliar):</div>
                                            <img src="${img}" class="remedy-word-img" alt="Evidencia ${i+1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
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
                const customerId = remedyRedCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '—');
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
                                        <div class="remedy-word-img-label">Evidencia #${i+1} (Clic para ampliar):</div>
                                        <img src="${img}" class="remedy-word-img" alt="Evidencia ${i+1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                remedyVisualSheet.innerHTML = html;
            } else {
                const falla = remedyInputFalla?.value.trim() || '—';
                const id = remedyInputId?.value.trim() || (elements.genContactId?.value.trim() || '—');
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
                                        <div class="remedy-word-img-label">Captura #${i+1} (Clic para ampliar):</div>
                                        <img src="${img}" class="remedy-word-img" alt="Captura ${i+1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
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
                if (mainContactId) {
                    if (remedyRedCustomerId && !remedyRedCustomerId.value) remedyRedCustomerId.value = mainContactId;
                    if (remedyIptvCustomerId && !remedyIptvCustomerId.value) remedyIptvCustomerId.value = mainContactId;
                    if (remedyTelCustomerId && !remedyTelCustomerId.value) remedyTelCustomerId.value = mainContactId;
                    if (remedyInputId && !remedyInputId.value) remedyInputId.value = mainContactId;
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
                        const customerId = remedyTelCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '[Customer ID]');
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
                                htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i+1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                            });
                            htmlContent += `</div>`;
                        }
                        htmlContent += `</div>`;
                    } else if (isIptv) {
                        const contacto = remedyIptvContacto?.value.trim() || '[Persona de Contacto]';
                        const telefono = remedyIptvTelefono?.value.trim() || (elements.genTelefono?.value.trim() || '[Número de Contacto]');
                        const customerId = remedyIptvCustomerId?.value.trim() || (elements.genContactId?.value.trim() || '[Customer ID]');
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
                                htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i+1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                            });
                            htmlContent += `</div>`;
                        }
                        htmlContent += `</div>`;
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
                                htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura / Evidencia #${i+1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
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
                            htmlContent += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura #${i+1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
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
                        const customerId = remedyTelCustomerId?.value.trim() || (elements.genContactId?.value.trim() || 'N/A');
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
                        const customerId = remedyIptvCustomerId?.value.trim() || (elements.genContactId?.value.trim() || 'N/A');
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
                        const customerId = remedyRedCustomerId?.value.trim() || (elements.genContactId?.value.trim() || 'N/A');
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
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
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

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'warning' ? 'toast-warning' : (type === 'danger' ? 'toast-danger' : '')}`;
        const icon = type === 'warning' ? '⚠️' : (type === 'danger' ? '❌' : (type === 'info' ? 'ℹ️' : '✅'));
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        if (elements.toastContainer) {
            elements.toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        }
    }

    // ==========================================================================
    // MODULE: PLATAFORMAS & LINKS DE TRABAJO (SIDEBAR OFF-CANVAS)
    // ==========================================================================
    function initLinksSidebar() {
        const defaultWorkLinks = [
            { id: 'lnk_incognito', name: 'Incógnito (SAC)', url: 'http://prov.incognito.claro.com.pe/sac/Login_input', category: 'Internet & Diagnóstico', icon: '🌐', isQuick: true },
            { id: 'lnk_dashboard', name: 'Dashboard', url: 'https://dashboard.claro.com.pe/', category: 'Internet & Diagnóstico', icon: '📊', isQuick: true },
            { id: 'lnk_tr69', name: 'TR69 (ACS)', url: 'http://172.17.27.238:8080/auth/login', category: 'Internet & Diagnóstico', icon: '📡', isQuick: true },
            { id: 'lnk_schaman', name: 'Schaman', url: 'https://atc-clperu.schaman.com/schaman-sso/login?callback=AAAADDfLhTpFXbSJETw3QhDILl0NLOiLN0QoI8dU3SWwSKTvrjlJU4lSPMmuHTIXFb5Ctr09Tz2H8Se6pOTmA6e2Qww%3D&app=AAAADGMbhcwoHsi4O778tEhNo5SvofJD%2FIcQCFAyhlXeSZE6Mg5jbA%3D%3D&customer=AAAADAcU2Ikxs028MO8BAUqzICiPfU1bCdWstG2p6BMKi4wqtw%3D%3D', category: 'Internet & Diagnóstico', icon: '🔍', isQuick: true },
            { id: 'lnk_plume', name: 'Plume (Frontline Tier 1)', url: 'https://gamma.central.plume.com/', category: 'Internet & Diagnóstico', icon: '📶', isQuick: true },
            { id: 'lnk_remotedesktop', name: 'Escritorio Remoto (172.29.0.101)', url: '172.29.0.101', category: 'Internet & Diagnóstico', icon: '🖥️', isQuick: true, isRdp: true },
            { id: 'lnk_tracer', name: 'Tracer', url: 'https://tracer.claro.com.pe/', category: 'Internet & Diagnóstico', icon: '📈', isQuick: true },
            { id: 'lnk_tracerplano', name: 'Tracer por Plano', url: 'https://tracerplano.claro.com.pe/', category: 'Internet & Diagnóstico', icon: '🗺️', isQuick: true },
            
            { id: 'lnk_remedy', name: 'BMC Helix / Remedy', url: 'https://clarop-rsso.claro.pe/rsso/start', category: 'Sistemas & Gestión', icon: '🛠️', isQuick: true },
            { id: 'lnk_livechat', name: 'LiveChat (Aivo)', url: 'https://live-us.aivo.co/chat', category: 'Canales & Comunicación', icon: '💬', isQuick: true },
            { id: 'lnk_hygeia', name: 'Hygeia (Niveles HFC/FTTH)', url: 'https://hygeia.claro.com.pe/', category: 'Internet & Diagnóstico', icon: '⚡', isQuick: false },
            { id: 'lnk_siac', name: 'SIAC Único', url: 'https://siacunico.claro.com.pe/', category: 'Sistemas & Gestión', icon: '💻', isQuick: false },
            { id: 'lnk_sga', name: 'SGA Operativo', url: 'https://sga.claro.com.pe/', category: 'Sistemas & Gestión', icon: '📋', isQuick: false },
            { id: 'lnk_wsp', name: 'WhatsApp Web', url: 'https://web.whatsapp.com/', category: 'Canales & Comunicación', icon: '📱', isQuick: false }
        ];

        let workLinks = JSON.parse(localStorage.getItem('bo_work_links') || 'null');
        if (!workLinks || !Array.isArray(workLinks) || workLinks.length === 0) {
            workLinks = defaultWorkLinks;
        } else {
            // Fusión y actualización inteligente de URLs por defecto
            defaultWorkLinks.forEach(defLnk => {
                const existing = workLinks.find(l => l.id === defLnk.id || l.name.toLowerCase() === defLnk.name.toLowerCase() || (defLnk.id === 'lnk_livechat' && l.name.toLowerCase().includes('livechat')) || (defLnk.id === 'lnk_remedy' && (l.name.toLowerCase().includes('remedy') || l.name.toLowerCase().includes('helix'))) || (defLnk.id === 'lnk_schaman' && l.name.toLowerCase().includes('schaman')) || (defLnk.id === 'lnk_plume' && l.name.toLowerCase().includes('plume')) || (defLnk.id === 'lnk_tr69' && (l.name.toLowerCase().includes('tr69') || l.name.toLowerCase().includes('tr-69'))) || (defLnk.id === 'lnk_remotedesktop' && l.name.toLowerCase().includes('escritorio')));
                if (existing) {
                    if (defLnk.id === 'lnk_incognito' || defLnk.id === 'lnk_livechat' || defLnk.id === 'lnk_remedy' || defLnk.id === 'lnk_schaman' || defLnk.id === 'lnk_plume' || defLnk.id === 'lnk_tr69' || defLnk.id === 'lnk_remotedesktop') {
                        existing.url = defLnk.url;
                        existing.name = defLnk.name;
                        existing.isQuick = defLnk.isQuick;
                        if (defLnk.isRdp) existing.isRdp = true;
                    }
                } else if (!workLinks.some(l => l.id === defLnk.id)) {
                    workLinks.push(defLnk);
                }
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

        function triggerRdpConnection(targetIp = '172.29.0.101') {
            // 1. Copiar IP automáticamente al portapapeles
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(targetIp).catch(() => {});
            }

            // 2. Generar archivo oficial de conexión RDP (Microsoft Remote Desktop nativo)
            const rdpContent = [
                `full address:s:${targetIp}`,
                'prompt for credentials:i:1',
                'screen mode id:i:2',
                'use multimon:i:0',
                'desktopwidth:i:1920',
                'desktopheight:i:1080',
                'session bpp:i:32',
                'compression:i:1',
                'keyboardhook:i:2',
                'audiomode:i:0',
                'redirectclipboard:i:1',
                'displayconnectionbar:i:1',
                'autoreconnection enabled:i:1',
                'authentication level:i:2'
            ].join('\r\n') + '\r\n';

            const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `Escritorio_Remoto_${targetIp.replace(/\./g, '_')}.rdp`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 1000);

            showToast(`🖥️ Abriendo Escritorio Remoto (${targetIp}) • IP copiada al portapapeles`, 'info');
        }

        function openSidebar() {
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
                        
                        if (lnk.isRdp) {
                            card.href = '#';
                            card.title = `Conectar a Escritorio Remoto (${lnk.url})\nClic para iniciar sesión mstsc`;
                            card.innerHTML = `
                                <span>${lnk.icon || '🖥️'} ${lnk.name}</span>
                                <span style="font-size:0.75rem; color:#10b981; font-weight:bold;">⚡ RDP</span>
                            `;
                            card.addEventListener('click', (e) => {
                                e.preventDefault();
                                triggerRdpConnection(lnk.url);
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
                        if (lnk.isRdp) {
                            openActionHtml = `<button class="btn-link-action btn-open-rdp" title="Conectar por Escritorio Remoto (mstsc)" style="font-weight:bold; color:#10b981; border-color:#10b981;">Conectar ⚡</button>`;
                        } else {
                            openActionHtml = `<a href="${lnk.url}" target="_blank" rel="noopener noreferrer" class="btn-link-action" title="Abrir portal en nueva pestaña" style="font-weight:bold; color:var(--primary);">Abrir ↗</a>`;
                        }

                        row.innerHTML = `
                            <div class="link-item-info" style="cursor:${lnk.isRdp ? 'pointer' : 'default'};">
                                <div class="link-item-name">${lnk.icon || '🔗'} ${lnk.name}</div>
                                <div class="link-item-url">${lnk.isRdp ? `IP RDP: ${lnk.url}` : lnk.url}</div>
                            </div>
                            <div class="link-actions">
                                <button class="btn-link-action btn-star-link" title="${starTitle}">${starIcon}</button>
                                <button class="btn-link-action btn-copy-url" title="Copiar">${lnk.isRdp ? 'Copiar IP' : '📋'}</button>
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
                                copyToClipboard(lnk.url, lnk.isRdp ? `IP copiada: ${lnk.url}` : `URL copiada: ${lnk.name}`);
                            });
                        }

                        const btnRdp = row.querySelector('.btn-open-rdp');
                        if (btnRdp) {
                            btnRdp.addEventListener('click', (e) => {
                                e.stopPropagation();
                                triggerRdpConnection(lnk.url);
                            });
                        }

                        if (lnk.isRdp) {
                            const infoDiv = row.querySelector('.link-item-info');
                            if (infoDiv) {
                                infoDiv.addEventListener('click', () => {
                                    triggerRdpConnection(lnk.url);
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

    // Initialize all modules
    initLinksSidebar();
    initGeneratorTab();
    initTrackerTab();
});
