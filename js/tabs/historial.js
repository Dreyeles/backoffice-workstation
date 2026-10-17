/* ==========================================================================
   MODULE: HISTORIAL Y RESPALDO DE CASOS GENERADOS
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.historial = {
        init(state, elements) {
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


            window.addHistoryRecord = addHistoryRecord;
            window.renderHistoryTable = renderHistoryTable;
        }
    };
})();
