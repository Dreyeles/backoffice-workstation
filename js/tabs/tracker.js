/* ==========================================================================
   MODULE: TAB 2 - AYUDA Y SEGUIMIENTO DIARIO (TRACKER)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.tracker = {
        init(state, elements) {
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
                            if (window.showToast) window.showToast('Caso eliminado');
                        });
                        itemsDiv.appendChild(item);
                    });

                    groupDiv.appendChild(itemsDiv);
                    elements.trackerTimeline.appendChild(groupDiv);
                });
            }

            if (!elements.btnTrackerAdd) return;

            // Validación de solo números
            elements.trackerCaseInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
            });

            // Add Case
            elements.btnTrackerAdd.addEventListener('click', () => {
                const code = elements.trackerCaseInput.value.trim();
                if (!code) {
                    if (window.showToast) window.showToast('Ingresa un código de caso válido');
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
                if (window.showToast) window.showToast('Caso registrado');
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
                    if (window.showToast) window.showToast('Registro diario limpiado');
                }
            });

            // Renderizado inicial al cargar
            renderTrackerTimeline();
        }
    };
})();
