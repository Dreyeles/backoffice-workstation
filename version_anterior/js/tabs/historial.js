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
            version: '2.8.4',
            exportDate: new Date().toISOString(),
            advisorName: state.advisorName,
            advisorCode: state.advisorCode,
            customTemplates: state.customTemplates,
            history: state.history,
            fieldHistory: state.fieldHistory || { descartes: [], soluciones: [], problemas: [], telefonos: [], sots: [] },
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
                if (data.fieldHistory && typeof data.fieldHistory === 'object') {
                    state.fieldHistory = data.fieldHistory;
                    localStorage.setItem('bo_field_history', JSON.stringify(state.fieldHistory));
                    countMsgs.push('borradores de campos');
                    renderFieldHistoryView();
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


    // ==========================================================================
    // RECUPERADOR DE CAMPOS INDIVIDUALES (BORRADORES RECIENTES)
    // ==========================================================================
    let activeFieldCategory = 'descartes';
    const fieldHistoryPills = document.getElementById('fieldHistoryPills');
    const fieldHistoryList = document.getElementById('fieldHistoryList');
    const btnClearFieldHistory = document.getElementById('btnClearFieldHistory');

    const countFieldDescartes = document.getElementById('countFieldDescartes');
    const countFieldSoluciones = document.getElementById('countFieldSoluciones');
    const countFieldProblemas = document.getElementById('countFieldProblemas');
    const countFieldTelefonos = document.getElementById('countFieldTelefonos');
    const countFieldSots = document.getElementById('countFieldSots');

    function renderFieldHistoryView() {
        if (!state.fieldHistory) {
            state.fieldHistory = { descartes: [], soluciones: [], problemas: [], telefonos: [], sots: [] };
        }

        if (countFieldDescartes) countFieldDescartes.textContent = state.fieldHistory.descartes?.length || 0;
        if (countFieldSoluciones) countFieldSoluciones.textContent = state.fieldHistory.soluciones?.length || 0;
        if (countFieldProblemas) countFieldProblemas.textContent = state.fieldHistory.problemas?.length || 0;
        if (countFieldTelefonos) countFieldTelefonos.textContent = state.fieldHistory.telefonos?.length || 0;
        if (countFieldSots) countFieldSots.textContent = state.fieldHistory.sots?.length || 0;

        if (!fieldHistoryList) return;
        fieldHistoryList.innerHTML = '';

        const items = state.fieldHistory[activeFieldCategory] || [];

        if (items.length === 0) {
            fieldHistoryList.innerHTML = `
                <div style="text-align:center; padding:1.75rem 1rem; color:var(--text-muted); background:rgba(0,0,0,0.1); border-radius:6px; border:1px dashed var(--border-color); font-size:0.85rem;">
                    📭 No hay textos recientes guardados en esta categoría.<br>
                    <span style="font-size:0.75rem; opacity:0.75;">Conforme redactes en el generador o si borras un campo por error, se respaldarán aquí automáticamente.</span>
                </div>
            `;
            return;
        }

        const categoryLabels = {
            descartes: '📋 Descartes Realizados',
            soluciones: '💡 Solución del Caso',
            problemas: '⚠️ Problema Detectado',
            telefonos: '📱 Teléfono',
            sots: '🏷️ SOT'
        };

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:0.75rem 1rem; display:flex; flex-direction:column; gap:0.5rem; transition:border-color 0.2s;';
            card.onmouseover = () => { card.style.borderColor = 'var(--primary)'; };
            card.onmouseout = () => { card.style.borderColor = 'var(--border-color)'; };

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.35rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="background:rgba(59,130,246,0.15); color:#60a5fa; font-weight:700; padding:1px 6px; border-radius:4px;">${categoryLabels[activeFieldCategory] || activeFieldCategory} #${index + 1}</span>
                        <span style="color:var(--text-muted);">🕒 ${escapeHtml(item.timestamp || 'Reciente')}</span>
                    </div>
                    <button type="button" class="btn btn-xs btn-delete-field-item" data-id="${item.id}" style="color:var(--danger); background:transparent; border:none; cursor:pointer; font-size:0.8rem; padding:1px 5px;" title="Eliminar este borrador">✕</button>
                </div>
                <div style="white-space:pre-wrap; word-break:break-word; font-family:inherit; font-size:0.85rem; color:var(--text-main); line-height:1.45; background:rgba(0,0,0,0.15); padding:0.5rem 0.75rem; border-radius:6px; max-height:160px; overflow-y:auto;">${escapeHtml(item.text)}</div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; align-items:center;">
                    <button type="button" class="btn btn-xs btn-copy-field-item" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer;">📋 Copiar</button>
                    <button type="button" class="btn btn-xs btn-primary btn-restore-field-item" style="padding:4px 12px; font-size:0.75rem; font-weight:bold; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:4px;">↩️ Restaurar en Generador</button>
                </div>
            `;

            card.querySelector('.btn-copy-field-item').addEventListener('click', () => {
                copyToClipboard(item.text, 'Texto copiado al portapapeles');
            });

            card.querySelector('.btn-delete-field-item').addEventListener('click', () => {
                const idx = state.fieldHistory[activeFieldCategory].findIndex(x => x.id === item.id);
                if (idx !== -1) {
                    state.fieldHistory[activeFieldCategory].splice(idx, 1);
                    localStorage.setItem('bo_field_history', JSON.stringify(state.fieldHistory));
                    renderFieldHistoryView();
                    showToast('Borrador eliminado');
                }
            });

            card.querySelector('.btn-restore-field-item').addEventListener('click', () => {
                let restored = false;
                if (activeFieldCategory === 'descartes' && elements.genDescartes) {
                    elements.genDescartes.value = item.text;
                    elements.genDescartes.classList.remove('input-invalid');
                    restored = true;
                } else if (activeFieldCategory === 'soluciones' && elements.genSolucion) {
                    elements.genSolucion.value = item.text;
                    elements.genSolucion.classList.remove('input-invalid');
                    restored = true;
                } else if (activeFieldCategory === 'problemas' && elements.genProblema) {
                    if (window.setProblemValue) {
                        window.setProblemValue(item.text);
                    } else {
                        elements.genProblema.value = item.text;
                    }
                    elements.genProblema.classList.remove('input-invalid');
                    restored = true;
                } else if (activeFieldCategory === 'telefonos' && elements.genTelefono) {
                    elements.genTelefono.value = item.text;
                    elements.genTelefono.classList.remove('input-invalid');
                    restored = true;
                } else if (activeFieldCategory === 'sots' && elements.genSot) {
                    elements.genSot.value = item.text;
                    elements.genSot.classList.remove('input-invalid');
                    restored = true;
                }

                if (restored) {
                    if (window.renderGeneratorPreviews) window.renderGeneratorPreviews();
                    showToast(`✓ ${categoryLabels[activeFieldCategory]} restaurado en el Generador`, 'success');
                    if (window.switchTab) {
                        window.switchTab('tab-generator');
                    }
                }
            });

            fieldHistoryList.appendChild(card);
        });
    }

    if (fieldHistoryPills) {
        fieldHistoryPills.querySelectorAll('.chip').forEach(pill => {
            pill.addEventListener('click', () => {
                fieldHistoryPills.querySelectorAll('.chip').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFieldCategory = pill.getAttribute('data-field') || 'descartes';
                renderFieldHistoryView();
            });
        });
    }

    if (btnClearFieldHistory) {
        btnClearFieldHistory.addEventListener('click', () => {
            if (!state.fieldHistory || !state.fieldHistory[activeFieldCategory]?.length) return;
            if (confirm(`¿Limpiar el historial de borradores de este campo?`)) {
                state.fieldHistory[activeFieldCategory] = [];
                localStorage.setItem('bo_field_history', JSON.stringify(state.fieldHistory));
                renderFieldHistoryView();
                showToast('Historial del campo vaciado');
            }
        });
    }

    renderFieldHistoryView();
    window.renderFieldHistoryView = renderFieldHistoryView;
    window.addHistoryRecord = addHistoryRecord;
    window.renderHistoryTable = renderHistoryTable;
        }
    };
})();
