/* ==========================================================================
   MODULE: REMEDY ESCALATION ENGINE (RED, GENERAL, IPTV, TELEFONÍA & EXPORT)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.remedy = {
        init(state, elements) {
    const btnOpenRemedyModal = document.getElementById('btnOpenRemedyModal');
    const remedyModal = document.getElementById('remedyModal');
    const remedyModalClose = document.getElementById('remedyModalClose');
    const remedyTabsContainer = document.getElementById('remedyTabsContainer');
    const btnRemedyNewTemplate = document.getElementById('btnRemedyNewTemplate');
    const remedyFormRed = document.getElementById('remedyFormRed');
    const remedyFormIptv = document.getElementById('remedyFormIptv');
    const remedyFormTelefonia = document.getElementById('remedyFormTelefonia');
    const remedyFormGeneral = document.getElementById('remedyFormGeneral');
    const remedyFormCustom = document.getElementById('remedyFormCustom');
    const remedyCustomDesc = document.getElementById('remedyCustomDesc');
    const remedyCustomFieldsContainer = document.getElementById('remedyCustomFieldsContainer');
    const btnEditCurrentRemedyView = document.getElementById('btnEditCurrentRemedyView');
    const btnDeleteCurrentRemedyView = document.getElementById('btnDeleteCurrentRemedyView');

    // Modal Diseñador de Vistas Custom
    const customRemedyViewModal = document.getElementById('customRemedyViewModal');
    const customRemedyModalClose = document.getElementById('customRemedyModalClose');
    const customRemedyModalTitle = document.getElementById('customRemedyModalTitle');
    const customRemedyEditId = document.getElementById('customRemedyEditId');
    const customRemedyIcon = document.getElementById('customRemedyIcon');
    const customRemedyName = document.getElementById('customRemedyName');
    const customRemedyFallaTitle = document.getElementById('customRemedyFallaTitle');
    const customRemedyDesc = document.getElementById('customRemedyDesc');
    const btnAddCustomRemedyField = document.getElementById('btnAddCustomRemedyField');
    const customRemedyFieldsContainer = document.getElementById('customRemedyFieldsContainer');
    const btnCancelCustomRemedyView = document.getElementById('btnCancelCustomRemedyView');
    const btnSaveCustomRemedyView = document.getElementById('btnSaveCustomRemedyView');

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

    let remedyActiveMode = 'red'; // 'red' | 'general' | 'custom_<id>'
    let remedyImagesList = [];

    const DEFAULT_REMEDY_PRESETS = {
        ocsi: {
            name: 'Desalineación OCSI',
            icon: '🔄',
            fallaTitle: 'BO ATC - DESALINEACION OCSI',
            desc: 'Escalamiento por falta de sincronización de perfil u orden en OCSI/SGA.',
            fields: [
                { id: 'f_id', label: 'Customer ID', type: 'text', autoFill: 'contactId', placeholder: 'Ej: 57200343' },
                { id: 'f_cliente', label: 'Cliente', type: 'text', autoFill: 'customer', placeholder: 'Nombre completo' },
                { id: 'f_dni', label: 'DNI / RUC', type: 'text', autoFill: 'dni', placeholder: 'Ej: 80593853' },
                { id: 'f_mac', label: 'MAC / SN Equipo', type: 'text', autoFill: 'none', placeholder: 'Ej: A0:B1:C2:D3:E4:F5' },
                { id: 'f_orden', label: 'N° Orden / SOT SGA', type: 'text', autoFill: 'none', placeholder: 'Ej: 12345678' },
                { id: 'f_descartes', label: 'Descartes Realizados', type: 'textarea', autoFill: 'descartes', placeholder: 'Detalla el error en OCSI...' }
            ]
        },
        amco: {
            name: 'AMCO / Suscripciones',
            icon: '📦',
            fallaTitle: 'SUSCRIPCIONES INCOMPLETAS / AMCO',
            desc: 'Escalamiento por cuentas o paquetes no aprovisionados en AMCO.',
            fields: [
                { id: 'f_id', label: 'Customer ID', type: 'text', autoFill: 'contactId', placeholder: 'Ej: 57200343' },
                { id: 'f_cliente', label: 'Cliente', type: 'text', autoFill: 'customer', placeholder: 'Nombre completo' },
                { id: 'f_dni', label: 'DNI / RUC', type: 'text', autoFill: 'dni', placeholder: 'Ej: 80593853' },
                { id: 'f_correo', label: 'Correo Claro Video / AMCO', type: 'text', autoFill: 'none', placeholder: 'Ej: cliente@correo.com' },
                { id: 'f_paquete', label: 'Paquete / Bono Afectado', type: 'text', autoFill: 'none', placeholder: 'Ej: Paquete HBO / Universal+' },
                { id: 'f_descartes', label: 'Descartes / Observaciones', type: 'textarea', autoFill: 'descartes', placeholder: 'Detalle de la validación en AMCO...' }
            ]
        },
        smarthome: {
            name: 'SmartHome / IoT',
            icon: '📱',
            fallaTitle: 'APP SMART HOME - ERROR AL CARGAR DISPOSITIVOS',
            desc: 'Escalamiento por error en sincronización de la app Smart Home.',
            fields: [
                { id: 'f_id', label: 'Customer ID', type: 'text', autoFill: 'contactId', placeholder: 'Ej: 57200343' },
                { id: 'f_cliente', label: 'Cliente', type: 'text', autoFill: 'customer', placeholder: 'Nombre completo' },
                { id: 'f_telefono', label: 'Número de Contacto', type: 'text', autoFill: 'phone', placeholder: 'Ej: 987654321' },
                { id: 'f_mac', label: 'MAC Módem', type: 'text', autoFill: 'none', placeholder: 'Ej: A0:B1:C2:D3:E4:F5' },
                { id: 'f_correo', label: 'Correo Registrado App', type: 'text', autoFill: 'none', placeholder: 'Ej: usuario@gmail.com' },
                { id: 'f_descartes', label: 'Descartes / Error Exacto', type: 'textarea', autoFill: 'descartes', placeholder: 'Mensaje de error que arroja la App...' }
            ]
        },
        cbio: {
            name: 'Migración CBIO',
            icon: '⚡',
            fallaTitle: 'BO ATC - MIGRACION A CBIO FALLO / ERROR SGA',
            desc: 'Escalamiento por fallo en la migración comercial/técnica a CBIO.',
            fields: [
                { id: 'f_id', label: 'Customer ID', type: 'text', autoFill: 'contactId', placeholder: 'Ej: 57200343' },
                { id: 'f_cliente', label: 'Cliente', type: 'text', autoFill: 'customer', placeholder: 'Nombre completo' },
                { id: 'f_dni', label: 'DNI / RUC', type: 'text', autoFill: 'dni', placeholder: 'Ej: 80593853' },
                { id: 'f_linea', label: 'Línea / Teléfono Fijo', type: 'text', autoFill: 'phone', placeholder: 'Ej: 01 7654321' },
                { id: 'f_error', label: 'Mensaje de Error en SGA/CBIO', type: 'text', autoFill: 'none', placeholder: 'Ej: Error al migrar contrato' },
                { id: 'f_descartes', label: 'Descartes Realizados', type: 'textarea', autoFill: 'descartes', placeholder: 'Detalle de la consulta en SGA y CBIO...' }
            ]
        }
    };

    const saveCustomRemedyViews = () => {
        localStorage.setItem('bo_custom_remedy_views', JSON.stringify(state.customRemedyViews));
    };

    const getActiveService = () => (elements.genServicio?.value || 'INTERNET').toUpperCase();
    const isIptvActive = () => getActiveService() === 'IPTV';
    const isTelefoniaActive = () => getActiveService() === 'TELEFONIA';

    const getAutoFillValue = (type) => {
        switch (type) {
            case 'contactId': return elements.genContactId?.value.trim() || '';
            case 'customer': return elements.genCustomer?.value.trim() || '';
            case 'dni': return elements.genDni?.value.trim() || '';
            case 'phone': return elements.genTelefono?.value.trim() || '';
            case 'descartes': return elements.genDescartes?.value.trim() || '';
            case 'problema': return elements.genProblema?.value.trim() || '';
            default: return '';
        }
    };

    const renderCustomRemedyFields = (view) => {
        if (!remedyCustomFieldsContainer || !view) return;
        remedyCustomFieldsContainer.innerHTML = '';
        if (remedyCustomDesc) remedyCustomDesc.textContent = view.desc || `Escalamiento personalizado: ${view.name}`;

        const gridContainer = document.createElement('div');
        gridContainer.className = 'form-grid';
        gridContainer.style.cssText = 'grid-template-columns: repeat(2, 1fr); gap: 0.6rem;';

        const textareasContainer = document.createElement('div');
        textareasContainer.style.cssText = 'display:flex; flex-direction:column; gap:0.6rem; margin-top:0.6rem;';

        (view.fields || []).forEach(f => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = f.label + ':';
            formGroup.appendChild(label);

            const initialVal = getAutoFillValue(f.autoFill);

            if (f.type === 'textarea') {
                const textarea = document.createElement('textarea');
                textarea.id = `remedy_custom_input_${f.id}`;
                textarea.className = 'form-textarea';
                textarea.style.minHeight = '55px';
                textarea.placeholder = f.placeholder || `Ingrese ${f.label.toLowerCase()}...`;
                textarea.value = initialVal;
                textarea.addEventListener('input', updateRemedyPreview);
                formGroup.appendChild(textarea);
                textareasContainer.appendChild(formGroup);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `remedy_custom_input_${f.id}`;
                input.className = 'form-input';
                input.placeholder = f.placeholder || `Ej: ${f.label}`;
                input.value = initialVal;
                input.addEventListener('input', updateRemedyPreview);
                formGroup.appendChild(input);
                gridContainer.appendChild(formGroup);
            }
        });

        if (gridContainer.children.length > 0) {
            remedyCustomFieldsContainer.appendChild(gridContainer);
        }
        if (textareasContainer.children.length > 0) {
            remedyCustomFieldsContainer.appendChild(textareasContainer);
        }
    };

    const renderRemedyTabs = () => {
        if (!remedyTabsContainer) return;
        remedyTabsContainer.innerHTML = '';

        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();
        let redLabel = '🌐 Páginas Web / Apps';
        if (isTelefonia) redLabel = '📞 Telefonía a RED';
        else if (isIptv) redLabel = '📺 Canales a RED';

        // Tab 1: RED
        const isRedActive = remedyActiveMode === 'red';
        const btnRed = document.createElement('button');
        btnRed.type = 'button';
        btnRed.id = 'btnRemedyTabRed';
        btnRed.className = isRedActive ? 'btn btn-sm btn-primary' : 'btn btn-sm';
        btnRed.style.cssText = `font-size:0.82rem; font-weight:bold; display:flex; align-items:center; gap:0.4rem; cursor:pointer; ${isRedActive ? 'background:var(--primary); color:#fff; border-color:var(--primary);' : 'background:transparent; border:1px solid var(--border-color); color:var(--text-muted);'}`;
        btnRed.innerHTML = redLabel;
        btnRed.addEventListener('click', () => setRemedyTab('red'));
        remedyTabsContainer.appendChild(btnRed);

        // Tab 2: General / Provisión
        const isGenActive = remedyActiveMode === 'general';
        const btnGen = document.createElement('button');
        btnGen.type = 'button';
        btnGen.id = 'btnRemedyTabGeneral';
        btnGen.className = isGenActive ? 'btn btn-sm btn-primary' : 'btn btn-sm';
        btnGen.style.cssText = `font-size:0.82rem; font-weight:bold; display:flex; align-items:center; gap:0.4rem; cursor:pointer; ${isGenActive ? 'background:var(--primary); color:#fff; border-color:var(--primary);' : 'background:transparent; border:1px solid var(--border-color); color:var(--text-muted);'}`;
        btnGen.innerHTML = '⚙️ Problemas de Provisión';
        btnGen.addEventListener('click', () => setRemedyTab('general'));
        remedyTabsContainer.appendChild(btnGen);

        // Custom Views Tabs
        (state.customRemedyViews || []).forEach(view => {
            const isCustomActive = remedyActiveMode === ('custom_' + view.id);
            const btnCustom = document.createElement('button');
            btnCustom.type = 'button';
            btnCustom.className = isCustomActive ? 'btn btn-sm btn-primary' : 'btn btn-sm';
            btnCustom.style.cssText = `font-size:0.82rem; font-weight:bold; display:flex; align-items:center; gap:0.4rem; cursor:pointer; ${isCustomActive ? 'background:var(--primary); color:#fff; border-color:var(--primary);' : 'background:transparent; border:1px solid var(--border-color); color:var(--text-muted);'}`;
            btnCustom.innerHTML = `${view.icon || '🛠️'} ${view.name}`;
            btnCustom.title = view.desc || view.name;
            btnCustom.addEventListener('click', () => setRemedyTab('custom_' + view.id));
            remedyTabsContainer.appendChild(btnCustom);
        });
    };

    const setRemedyTab = (mode) => {
        remedyActiveMode = mode;
        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();

        if (mode === 'red') {
            if (remedyFormRed) remedyFormRed.style.display = (!isIptv && !isTelefonia) ? 'block' : 'none';
            if (remedyFormIptv) remedyFormIptv.style.display = isIptv ? 'block' : 'none';
            if (remedyFormTelefonia) remedyFormTelefonia.style.display = isTelefonia ? 'block' : 'none';
            if (remedyFormGeneral) remedyFormGeneral.style.display = 'none';
            if (remedyFormCustom) remedyFormCustom.style.display = 'none';
        } else if (mode === 'general') {
            if (remedyFormRed) remedyFormRed.style.display = 'none';
            if (remedyFormIptv) remedyFormIptv.style.display = 'none';
            if (remedyFormTelefonia) remedyFormTelefonia.style.display = 'none';
            if (remedyFormGeneral) remedyFormGeneral.style.display = 'block';
            if (remedyFormCustom) remedyFormCustom.style.display = 'none';
        } else if (mode.startsWith('custom_')) {
            const viewId = mode.replace('custom_', '');
            const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
            if (remedyFormRed) remedyFormRed.style.display = 'none';
            if (remedyFormIptv) remedyFormIptv.style.display = 'none';
            if (remedyFormTelefonia) remedyFormTelefonia.style.display = 'none';
            if (remedyFormGeneral) remedyFormGeneral.style.display = 'none';
            if (remedyFormCustom) remedyFormCustom.style.display = 'block';
            if (customView) {
                renderCustomRemedyFields(customView);
            }
        }
        renderRemedyTabs();
        updateRemedyPreview();
    };

    const getRemedyPlainText = () => {
        const isIptv = isIptvActive();
        const isTelefonia = isTelefoniaActive();

        if (remedyActiveMode.startsWith('custom_')) {
            const viewId = remedyActiveMode.replace('custom_', '');
            const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
            if (customView) {
                const falla = customView.fallaTitle || customView.name || 'INCIDENCIA TÉCNICA';
                let text = `FALLA: ${falla}\n\n`;
                (customView.fields || []).forEach(f => {
                    const el = document.getElementById(`remedy_custom_input_${f.id}`);
                    const val = el?.value.trim() || `[${f.label}]`;
                    text += `   • ${f.label.toUpperCase()}: ${val}\n`;
                });
                if (remedyImagesList.length > 0) {
                    text += `\n[${remedyImagesList.length} imagen(es) adjunta(s)]`;
                }
                return text;
            }
        }

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

                let text = `FALLA: TELEFONÍA A RED\n\n`;
                text += `   • ID: ${customerId}\n`;
                text += `   • PERSONA DE CONTACTO: ${contacto}\n`;
                text += `   • NÚMERO DE CONTACTO: ${telefono}\n`;
                text += `   • NÚMERO TELEFÓNICO: ${numeroTel}\n`;
                text += `   • PLAN: ${plan}\n`;
                text += `   • MAC: ${mac}\n`;
                text += `   • PLANO: ${plano}\n`;
                text += `   • CMTS / OLT: ${cmtsOlt}\n`;
                text += `   • PROBLEMA: ${problema}\n`;
                text += `   • DESCARTES: ${descartes}\n`;
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

                let text = `FALLA: CANALES A RED / IPTV\n\n`;
                text += `   • ID: ${customerId}\n`;
                text += `   • PERSONA DE CONTACTO: ${contacto}\n`;
                text += `   • NÚMERO DE CONTACTO: ${telefono}\n`;
                text += `   • PLANO: ${plano}\n`;
                text += `   • CANTIDAD DE DECOS: ${cantDecos}\n`;
                text += `   • SERIE DECOS: ${serieDecos}\n`;
                text += `   • CANALES AFECTADOS: ${canales}\n`;
                text += `   • GRILLA ACTUALIZADA: ${grilla}\n`;
                text += `   • DESCARTES: ${descartes}\n`;
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

                let text = `FALLA: BLOQUEO DE PÁGINAS WEB / APPS\n\n`;
                text += `   • ID: ${customerId}\n`;
                text += `   • PERSONA DE CONTACTO: ${contacto}\n`;
                text += `   • NÚMERO DE CONTACTO: ${telefono}\n`;
                text += `   • MAC: ${mac}\n`;
                text += `   • IP PÚBLICA: ${ip}\n`;
                text += `   • PÁGINAS / APPS: ${paginas}\n`;
                text += `   • RED EXTERNA: ${redExterna}\n`;
                text += `   • CMTS / OLT: ${cmtsOlt}\n`;
                text += `   • PLANO: ${plano}\n`;
                text += `   • DESCARTES: ${descartes}\n`;
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

        const renderImagesHtml = () => {
            if (remedyImagesList.length === 0) return '';
            return `
                <div class="remedy-word-images">
                    <div class="remedy-word-section-title" style="margin-bottom:8px;">Capturas Adjuntas:</div>
                    ${remedyImagesList.map((img, i) => `
                        <div class="remedy-word-img-wrapper">
                            <div class="remedy-word-img-label">Captura #${i + 1} (Clic para ampliar):</div>
                            <img src="${img}" class="remedy-word-img" alt="Captura ${i + 1}" onclick="window.previewRemedyImageZoom && window.previewRemedyImageZoom('${img}')" />
                        </div>
                    `).join('')}
                </div>
            `;
        };

        if (remedyActiveMode.startsWith('custom_')) {
            const viewId = remedyActiveMode.replace('custom_', '');
            const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
            if (customView) {
                const falla = customView.fallaTitle || customView.name || 'INCIDENCIA TÉCNICA';
                let listItems = '';
                (customView.fields || []).forEach(f => {
                    const el = document.getElementById(`remedy_custom_input_${f.id}`);
                    const val = el?.value.trim() || '—';
                    listItems += `<li style="margin-bottom: 4px;"><strong>${f.label.toUpperCase()}:</strong> ${val}</li>`;
                });
                let html = `
                    <div class="remedy-word-page">
                        <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>FALLA:</strong> ${falla}</p>
                        <ul class="remedy-word-list" style="margin-left: 20px; font-size: 13px; color: #1f2937;">
                            ${listItems}
                        </ul>
                        ${renderImagesHtml()}
                    </div>
                `;
                remedyVisualSheet.innerHTML = html;
                return;
            }
        }

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
                        <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>FALLA:</strong> TELEFONÍA A RED</p>
                        <ul class="remedy-word-list" style="margin-left: 20px; font-size: 13px; color: #1f2937;">
                            <li style="margin-bottom: 4px;"><strong>ID:</strong> ${customerId}</li>
                            <li style="margin-bottom: 4px;"><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                            <li style="margin-bottom: 4px;"><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                            <li style="margin-bottom: 4px;"><strong>NÚMERO TELEFÓNICO:</strong> ${numeroTel}</li>
                            <li style="margin-bottom: 4px;"><strong>PLAN:</strong> ${plan}</li>
                            <li style="margin-bottom: 4px;"><strong>MAC:</strong> ${mac}</li>
                            <li style="margin-bottom: 4px;"><strong>PLANO:</strong> ${plano}</li>
                            <li style="margin-bottom: 4px;"><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>
                            <li style="margin-bottom: 4px;"><strong>PROBLEMA:</strong> ${problema}</li>
                            <li style="margin-bottom: 4px;"><strong>DESCARTES:</strong> ${descartes}</li>
                        </ul>
                        ${renderImagesHtml()}
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
                        <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>FALLA:</strong> CANALES A RED / IPTV</p>
                        <ul class="remedy-word-list" style="margin-left: 20px; font-size: 13px; color: #1f2937;">
                            <li style="margin-bottom: 4px;"><strong>ID:</strong> ${customerId}</li>
                            <li style="margin-bottom: 4px;"><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                            <li style="margin-bottom: 4px;"><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                            <li style="margin-bottom: 4px;"><strong>PLANO:</strong> ${plano}</li>
                            <li style="margin-bottom: 4px;"><strong>CANTIDAD DE DECOS:</strong> ${cantDecos}</li>
                            <li style="margin-bottom: 4px;"><strong>SERIE DECOS:</strong> ${serieDecos}</li>
                            <li style="margin-bottom: 4px;"><strong>CANALES AFECTADOS:</strong> ${canales}</li>
                            <li style="margin-bottom: 4px;"><strong>GRILLA ACTUALIZADA:</strong> ${grilla}</li>
                            <li style="margin-bottom: 4px;"><strong>DESCARTES:</strong> ${descartes}</li>
                        </ul>
                        ${renderImagesHtml()}
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
                    <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>FALLA:</strong> BLOQUEO DE PÁGINAS WEB / APPS</p>
                    <ul class="remedy-word-list" style="margin-left: 20px; font-size: 13px; color: #1f2937;">
                        <li style="margin-bottom: 4px;"><strong>ID:</strong> ${customerId}</li>
                        <li style="margin-bottom: 4px;"><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                        <li style="margin-bottom: 4px;"><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                        <li style="margin-bottom: 4px;"><strong>MAC:</strong> ${mac}</li>
                        <li style="margin-bottom: 4px;"><strong>IP PÚBLICA:</strong> ${ip}</li>
                        <li style="margin-bottom: 4px;"><strong>PÁGINAS / APPS:</strong> ${paginas}</li>
                        <li style="margin-bottom: 4px;"><strong>RED EXTERNA:</strong> ${redExterna}</li>
                        <li style="margin-bottom: 4px;"><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>
                        <li style="margin-bottom: 4px;"><strong>PLANO:</strong> ${plano}</li>
                        <li style="margin-bottom: 4px;"><strong>DESCARTES:</strong> ${descartes}</li>
                    </ul>
                    ${renderImagesHtml()}
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
                        ${detalle ? `<li style="margin-bottom: 4px;"><strong>DETALLE:</strong> ${detalle}</li>` : ''}
                    </ul>
                    ${renderImagesHtml()}
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
            renderRemedyTabs();
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

        // Reset custom fields if present
        if (remedyCustomFieldsContainer) {
            const customInputs = remedyCustomFieldsContainer.querySelectorAll('input, textarea');
            customInputs.forEach(ci => ci.value = '');
        }

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
            let logLabel = 'Incidencia / Escalamiento';
            if (remedyActiveMode.startsWith('custom_')) {
                const viewId = remedyActiveMode.replace('custom_', '');
                const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
                logLabel = customView ? `Escalamiento ${customView.name}` : 'Escalamiento Personalizado';
            } else if (isTelefoniaActive()) {
                logLabel = 'Escalamiento Telefonía a RED';
            } else if (isIptvActive()) {
                logLabel = 'Escalamiento IPTV Canales a RED';
            } else if (remedyActiveMode === 'red') {
                logLabel = 'Escalamiento a RED (Páginas/Apps)';
            }
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

            const renderImagesWordHtml = () => {
                if (remedyImagesList.length === 0) return '';
                let imgsHtml = '<div style="margin-top: 10pt;">';
                remedyImagesList.forEach((imgData, i) => {
                    imgsHtml += `<p style="margin: 0 0 12pt 0;"><strong style="font-size:10pt;">Captura #${i + 1}:</strong><br><img src="${imgData}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top:4px;" /></p>`;
                });
                imgsHtml += '</div>';
                return imgsHtml;
            };

            if (remedyActiveMode.startsWith('custom_')) {
                const viewId = remedyActiveMode.replace('custom_', '');
                const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
                if (customView) {
                    const falla = customView.fallaTitle || customView.name || 'INCIDENCIA TÉCNICA';
                    htmlContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.5;">`;
                    htmlContent += `<p style="margin: 0 0 8pt 0;"><strong>FALLA:</strong> ${falla}</p>`;
                    htmlContent += `<ul style="margin: 0 0 12pt 18pt; padding: 0;">`;
                    (customView.fields || []).forEach(f => {
                        const el = document.getElementById(`remedy_custom_input_${f.id}`);
                        const val = el?.value.trim() || `[${f.label}]`;
                        htmlContent += `<li><strong>${f.label.toUpperCase()}:</strong> ${val}</li>`;
                    });
                    htmlContent += `</ul>`;
                    htmlContent += renderImagesWordHtml();
                    htmlContent += `</div>`;
                }
            } else if (remedyActiveMode === 'red') {
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
                    htmlContent += `<p style="margin: 0 0 8pt 0;"><strong>FALLA:</strong> TELEFONÍA A RED</p>`;
                    htmlContent += `<ul style="margin: 0 0 12pt 18pt; padding: 0;">`;
                    htmlContent += `<li><strong>ID:</strong> ${customerId}</li>`;
                    htmlContent += `<li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>`;
                    htmlContent += `<li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>`;
                    htmlContent += `<li><strong>NÚMERO TELEFÓNICO:</strong> ${numeroTel}</li>`;
                    htmlContent += `<li><strong>PLAN:</strong> ${plan}</li>`;
                    htmlContent += `<li><strong>MAC:</strong> ${mac}</li>`;
                    htmlContent += `<li><strong>PLANO:</strong> ${plano}</li>`;
                    htmlContent += `<li><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>`;
                    htmlContent += `<li><strong>PROBLEMA:</strong> ${problema}</li>`;
                    htmlContent += `<li><strong>DESCARTES:</strong> ${descartes}</li>`;
                    htmlContent += `</ul>`;
                    htmlContent += renderImagesWordHtml();
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
                    htmlContent += `<p style="margin: 0 0 8pt 0;"><strong>FALLA:</strong> CANALES A RED / IPTV</p>`;
                    htmlContent += `<ul style="margin: 0 0 12pt 18pt; padding: 0;">`;
                    htmlContent += `<li><strong>ID:</strong> ${customerId}</li>`;
                    htmlContent += `<li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>`;
                    htmlContent += `<li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>`;
                    htmlContent += `<li><strong>PLANO:</strong> ${plano}</li>`;
                    htmlContent += `<li><strong>CANTIDAD DE DECOS:</strong> ${cantDecos}</li>`;
                    htmlContent += `<li><strong>SERIE DECOS:</strong> ${serieDecos}</li>`;
                    htmlContent += `<li><strong>CANALES AFECTADOS:</strong> ${canales}</li>`;
                    htmlContent += `<li><strong>GRILLA ACTUALIZADA:</strong> ${grilla}</li>`;
                    htmlContent += `<li><strong>DESCARTES:</strong> ${descartes}</li>`;
                    htmlContent += `</ul>`;
                    htmlContent += renderImagesWordHtml();
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
                    htmlContent += `<p style="margin: 0 0 8pt 0;"><strong>FALLA:</strong> BLOQUEO DE PÁGINAS WEB / APPS</p>`;
                    htmlContent += `<ul style="margin: 0 0 12pt 18pt; padding: 0;">`;
                    htmlContent += `<li><strong>ID:</strong> ${customerId}</li>`;
                    htmlContent += `<li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>`;
                    htmlContent += `<li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>`;
                    htmlContent += `<li><strong>MAC:</strong> ${mac}</li>`;
                    htmlContent += `<li><strong>IP PÚBLICA:</strong> ${ip}</li>`;
                    htmlContent += `<li><strong>PÁGINAS / APPS:</strong> ${paginas}</li>`;
                    htmlContent += `<li><strong>RED EXTERNA:</strong> ${redExterna}</li>`;
                    htmlContent += `<li><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>`;
                    htmlContent += `<li><strong>PLANO:</strong> ${plano}</li>`;
                    htmlContent += `<li><strong>DESCARTES:</strong> ${descartes}</li>`;
                    htmlContent += `</ul>`;
                    htmlContent += renderImagesWordHtml();
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
                    htmlContent += `<li><strong>DETALLE:</strong> ${detalle}</li>`;
                }
                htmlContent += `</ul>`;
                htmlContent += renderImagesWordHtml();
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
                    showToast('✓ Formato Word copiado con imágenes');
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

            const renderImagesPdfHtml = () => {
                if (remedyImagesList.length === 0) return '';
                return `
                    <div class="evidence-section">
                        ${remedyImagesList.map(img => `<p style="margin: 0 0 16px 0; text-align:center;"><img class="evidence-img" src="${img}" alt="Evidencia Remedy" /></p>`).join('')}
                    </div>
                `;
            };

            if (remedyActiveMode.startsWith('custom_')) {
                const viewId = remedyActiveMode.replace('custom_', '');
                const customView = (state.customRemedyViews || []).find(v => v.id === viewId);
                if (customView) {
                    const falla = customView.fallaTitle || customView.name || 'INCIDENCIA TÉCNICA';
                    docTitle = `Remedy_${(customView.name || 'Custom').replace(/\s+/g, '_')}`;
                    let listItems = '';
                    (customView.fields || []).forEach(f => {
                        const el = document.getElementById(`remedy_custom_input_${f.id}`);
                        const val = el?.value.trim() || 'N/A';
                        listItems += `<li><strong>${f.label.toUpperCase()}:</strong> ${val}</li>`;
                    });
                    bodyContent = `
                        <div class="falla-title"><strong>FALLA:</strong> ${falla}</div>
                        <ul class="meta-list">
                            ${listItems}
                        </ul>
                        ${renderImagesPdfHtml()}
                    `;
                }
            } else if (remedyActiveMode === 'red') {
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
                        <div class="falla-title"><strong>FALLA:</strong> TELEFONÍA A RED</div>
                        <ul class="meta-list">
                            <li><strong>ID:</strong> ${customerId}</li>
                            <li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                            <li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                            <li><strong>NÚMERO TELEFÓNICO:</strong> ${numeroTel}</li>
                            <li><strong>PLAN:</strong> ${plan}</li>
                            <li><strong>MAC:</strong> ${mac}</li>
                            <li><strong>PLANO:</strong> ${plano}</li>
                            <li><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>
                            <li><strong>PROBLEMA:</strong> ${problema}</li>
                            <li><strong>DESCARTES:</strong> ${descartes}</li>
                        </ul>
                        ${renderImagesPdfHtml()}
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
                        <div class="falla-title"><strong>FALLA:</strong> CANALES A RED / IPTV</div>
                        <ul class="meta-list">
                            <li><strong>ID:</strong> ${customerId}</li>
                            <li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                            <li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                            <li><strong>PLANO:</strong> ${plano}</li>
                            <li><strong>CANTIDAD DE DECOS:</strong> ${cantDecos}</li>
                            <li><strong>SERIE DECOS:</strong> ${serieDecos}</li>
                            <li><strong>CANALES AFECTADOS:</strong> ${canales}</li>
                            <li><strong>GRILLA ACTUALIZADA:</strong> ${grilla}</li>
                            <li><strong>DESCARTES:</strong> ${descartes}</li>
                        </ul>
                        ${renderImagesPdfHtml()}
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
                        <div class="falla-title"><strong>FALLA:</strong> BLOQUEO DE PÁGINAS WEB / APPS</div>
                        <ul class="meta-list">
                            <li><strong>ID:</strong> ${customerId}</li>
                            <li><strong>PERSONA DE CONTACTO:</strong> ${contacto}</li>
                            <li><strong>NÚMERO DE CONTACTO:</strong> ${telefono}</li>
                            <li><strong>MAC:</strong> ${mac}</li>
                            <li><strong>IP PÚBLICA:</strong> ${ip}</li>
                            <li><strong>PÁGINAS / APPS:</strong> ${paginas}</li>
                            <li><strong>RED EXTERNA:</strong> ${redExterna}</li>
                            <li><strong>CMTS / OLT:</strong> ${cmtsOlt}</li>
                            <li><strong>PLANO:</strong> ${plano}</li>
                            <li><strong>DESCARTES:</strong> ${descartes}</li>
                        </ul>
                        ${renderImagesPdfHtml()}
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
                        ${detalle ? `<li><strong>DETALLE:</strong> ${detalle}</li>` : ''}
                    </ul>
                    ${renderImagesPdfHtml()}
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

    // =========================================================================
    // DISEÑADOR DE VISTAS / PLANTILLAS REMEDY PERSONALIZADAS
    // =========================================================================

    const createDesignerFieldRow = (field = {}) => {
        const row = document.createElement('div');
        row.className = 'custom-field-row';
        row.style.cssText = 'display:grid; grid-template-columns: 1.8fr 1.2fr 1.3fr 32px; gap:0.45rem; align-items:center; background:var(--bg-card); padding:0.45rem; border-radius:6px; border:1px solid var(--border-color);';

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'form-input field-row-label';
        labelInput.placeholder = 'Nombre del Campo (ej: Customer ID)';
        labelInput.value = field.label || '';
        labelInput.style.cssText = 'font-size:0.8rem; padding:0.3rem 0.5rem;';

        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select field-row-type';
        typeSelect.style.cssText = 'font-size:0.8rem; padding:0.3rem 0.4rem;';
        typeSelect.innerHTML = `
            <option value="text" ${field.type === 'text' || !field.type ? 'selected' : ''}>Texto (Línea)</option>
            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Área (Párrafo)</option>
        `;

        const autoFillSelect = document.createElement('select');
        autoFillSelect.className = 'form-select field-row-autofill';
        autoFillSelect.style.cssText = 'font-size:0.8rem; padding:0.3rem 0.4rem;';
        autoFillSelect.innerHTML = `
            <option value="none" ${field.autoFill === 'none' || !field.autoFill ? 'selected' : ''}>Sin Auto-llenado</option>
            <option value="contactId" ${field.autoFill === 'contactId' ? 'selected' : ''}>🔗 Customer ID</option>
            <option value="customer" ${field.autoFill === 'customer' ? 'selected' : ''}>🔗 Nombre Cliente</option>
            <option value="dni" ${field.autoFill === 'dni' ? 'selected' : ''}>🔗 DNI / RUC</option>
            <option value="phone" ${field.autoFill === 'phone' ? 'selected' : ''}>🔗 Teléfono</option>
            <option value="descartes" ${field.autoFill === 'descartes' ? 'selected' : ''}>🔗 Descartes Form</option>
            <option value="problema" ${field.autoFill === 'problema' ? 'selected' : ''}>🔗 Problema Form</option>
        `;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-sm';
        delBtn.innerHTML = '🗑️';
        delBtn.title = 'Eliminar este campo';
        delBtn.style.cssText = 'padding:0.25rem 0.4rem; font-size:0.85rem; color:var(--danger); background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); cursor:pointer;';
        delBtn.addEventListener('click', () => {
            row.remove();
        });

        row.appendChild(labelInput);
        row.appendChild(typeSelect);
        row.appendChild(autoFillSelect);
        row.appendChild(delBtn);

        return row;
    };

    const openCustomRemedyModal = (viewToEdit = null) => {
        if (!customRemedyViewModal) return;

        if (customRemedyFieldsContainer) {
            customRemedyFieldsContainer.innerHTML = '';
        }

        if (viewToEdit) {
            if (customRemedyModalTitle) customRemedyModalTitle.textContent = `✏️ Editar Vista: ${viewToEdit.name}`;
            if (customRemedyEditId) customRemedyEditId.value = viewToEdit.id;
            if (customRemedyIcon) customRemedyIcon.value = viewToEdit.icon || '🛠️';
            if (customRemedyName) customRemedyName.value = viewToEdit.name || '';
            if (customRemedyFallaTitle) customRemedyFallaTitle.value = viewToEdit.fallaTitle || '';
            if (customRemedyDesc) customRemedyDesc.value = viewToEdit.desc || '';

            (viewToEdit.fields || []).forEach(f => {
                const row = createDesignerFieldRow(f);
                customRemedyFieldsContainer.appendChild(row);
            });
        } else {
            if (customRemedyModalTitle) customRemedyModalTitle.textContent = '⚙️ Diseñador de Vista Remedy Personalizada';
            if (customRemedyEditId) customRemedyEditId.value = '';
            if (customRemedyIcon) customRemedyIcon.value = '🛠️';
            if (customRemedyName) customRemedyName.value = '';
            if (customRemedyFallaTitle) customRemedyFallaTitle.value = '';
            if (customRemedyDesc) customRemedyDesc.value = '';

            // Campos por defecto recomendados
            const defaultFields = [
                { label: 'Customer ID', type: 'text', autoFill: 'contactId' },
                { label: 'DNI / RUC', type: 'text', autoFill: 'dni' },
                { label: 'Cliente', type: 'text', autoFill: 'customer' },
                { label: 'Detalle Técnico / Observación', type: 'text', autoFill: 'none' },
                { label: 'Descartes Realizados', type: 'textarea', autoFill: 'descartes' }
            ];
            defaultFields.forEach(f => {
                const row = createDesignerFieldRow(f);
                customRemedyFieldsContainer.appendChild(row);
            });
        }

        customRemedyViewModal.classList.add('active');
    };

    const closeCustomRemedyModal = () => {
        if (customRemedyViewModal) customRemedyViewModal.classList.remove('active');
    };

    if (customRemedyModalClose) customRemedyModalClose.addEventListener('click', closeCustomRemedyModal);
    if (btnCancelCustomRemedyView) btnCancelCustomRemedyView.addEventListener('click', closeCustomRemedyModal);
    if (customRemedyViewModal) {
        customRemedyViewModal.addEventListener('click', (e) => {
            if (e.target === customRemedyViewModal) closeCustomRemedyModal();
        });
    }

    if (btnRemedyNewTemplate) {
        btnRemedyNewTemplate.addEventListener('click', () => {
            openCustomRemedyModal(null);
        });
    }

    if (btnAddCustomRemedyField) {
        btnAddCustomRemedyField.addEventListener('click', () => {
            if (customRemedyFieldsContainer) {
                const row = createDesignerFieldRow({ label: '', type: 'text', autoFill: 'none' });
                customRemedyFieldsContainer.appendChild(row);
                const input = row.querySelector('.field-row-label');
                if (input) input.focus();
            }
        });
    }

    // Botones de presets en el diseñador
    document.querySelectorAll('.btn-preset-remedy').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            const preset = DEFAULT_REMEDY_PRESETS[presetKey];
            if (preset) {
                if (customRemedyIcon) customRemedyIcon.value = preset.icon || '🛠️';
                if (customRemedyName) customRemedyName.value = preset.name || '';
                if (customRemedyFallaTitle) customRemedyFallaTitle.value = preset.fallaTitle || '';
                if (customRemedyDesc) customRemedyDesc.value = preset.desc || '';

                if (customRemedyFieldsContainer) {
                    customRemedyFieldsContainer.innerHTML = '';
                    (preset.fields || []).forEach(f => {
                        const row = createDesignerFieldRow(f);
                        customRemedyFieldsContainer.appendChild(row);
                    });
                }
                showToast(`Plantilla "${preset.name}" cargada`);
            }
        });
    });

    // Guardar Vista Personalizada
    if (btnSaveCustomRemedyView) {
        btnSaveCustomRemedyView.addEventListener('click', () => {
            const name = (customRemedyName?.value || '').trim();
            const fallaTitle = (customRemedyFallaTitle?.value || '').trim();
            const icon = (customRemedyIcon?.value || '🛠️').trim() || '🛠️';
            const desc = (customRemedyDesc?.value || '').trim();
            const editId = customRemedyEditId?.value || '';

            if (!name) {
                showToast('⚠️ Ingresa un nombre para la pestaña', 'warning');
                if (customRemedyName) customRemedyName.focus();
                return;
            }
            if (!fallaTitle) {
                showToast('⚠️ Ingresa el título de la falla (cabecera)', 'warning');
                if (customRemedyFallaTitle) customRemedyFallaTitle.focus();
                return;
            }

            const fieldRows = customRemedyFieldsContainer ? customRemedyFieldsContainer.querySelectorAll('.custom-field-row') : [];
            const fields = [];
            fieldRows.forEach((row, idx) => {
                const label = (row.querySelector('.field-row-label')?.value || '').trim();
                const type = row.querySelector('.field-row-type')?.value || 'text';
                const autoFill = row.querySelector('.field-row-autofill')?.value || 'none';
                if (label) {
                    fields.push({
                        id: 'fld_' + idx + '_' + Date.now().toString(36),
                        label,
                        type,
                        autoFill,
                        placeholder: `Ej: ${label}`
                    });
                }
            });

            if (fields.length === 0) {
                showToast('⚠️ Añade al menos 1 campo con nombre para el formulario', 'warning');
                return;
            }

            let viewId = editId;
            if (editId) {
                const idx = (state.customRemedyViews || []).findIndex(v => v.id === editId);
                if (idx >= 0) {
                    state.customRemedyViews[idx] = { id: editId, name, icon, fallaTitle, desc, fields };
                } else {
                    state.customRemedyViews.push({ id: editId, name, icon, fallaTitle, desc, fields });
                }
            } else {
                viewId = 'view_' + Date.now();
                state.customRemedyViews.push({ id: viewId, name, icon, fallaTitle, desc, fields });
            }

            saveCustomRemedyViews();
            closeCustomRemedyModal();
            setRemedyTab('custom_' + viewId);
            showToast(`Vista "${name}" guardada correctamente`);
        });
    }

    // Botón Editar Vista Actual
    if (btnEditCurrentRemedyView) {
        btnEditCurrentRemedyView.addEventListener('click', () => {
            if (remedyActiveMode.startsWith('custom_')) {
                const viewId = remedyActiveMode.replace('custom_', '');
                const view = (state.customRemedyViews || []).find(v => v.id === viewId);
                if (view) {
                    openCustomRemedyModal(view);
                }
            }
        });
    }

    // Botón Eliminar Vista Actual
    if (btnDeleteCurrentRemedyView) {
        btnDeleteCurrentRemedyView.addEventListener('click', () => {
            if (remedyActiveMode.startsWith('custom_')) {
                const viewId = remedyActiveMode.replace('custom_', '');
                const view = (state.customRemedyViews || []).find(v => v.id === viewId);
                const viewName = view ? view.name : 'esta vista';
                if (confirm(`¿Estás seguro de eliminar la vista "${viewName}"?`)) {
                    state.customRemedyViews = (state.customRemedyViews || []).filter(v => v.id !== viewId);
                    saveCustomRemedyViews();
                    setRemedyTab('red');
                    showToast(`Vista "${viewName}" eliminada`);
                }
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
        }
    };
})();
