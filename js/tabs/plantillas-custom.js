/* ==========================================================================
   MODULE: MIS PLANTILLAS PERSONALIZADAS & VARIABLES DINÁMICAS
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.plantillasCustom = {
        init(state, elements) {
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

            window.resolveTemplateVariables = resolveTemplateVariables;
            window.renderCustomTemplates = renderCustomTemplates;
            renderCustomTemplates();
        }
    };
})();
