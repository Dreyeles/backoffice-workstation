/* ==========================================================================
   MODULE: SIDEBARS OFF-CANVAS (PLATAFORMAS/LINKS & MANUALES/GUÍAS TÉCNICAS)
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.sidebars = {
        init(state, elements) {
    function initLinksSidebar() {
        const defaultWorkLinks = [
            { id: 'lnk_incognito', name: 'Incógnito', url: 'http://prov.incognito.claro.com.pe/sac/Login_input', category: 'Internet & Diagnóstico', icon: '<img src="../img/incognito_logo.svg" class="link-custom-img-icon" alt="Incógnito SAC">', isQuick: true },
            { id: 'lnk_dashboard', name: 'Dashboard ZT', url: 'http://172.19.196.16:8080/acs/index.xhtml', category: 'Internet & Diagnóstico', icon: '<img src="../img/dashboard_logo.svg" class="link-custom-img-icon" alt="Dashboard ZT">', isQuick: true },
            { id: 'lnk_tr69', name: 'TR69', url: 'http://172.17.27.238:8080/auth/login', category: 'Internet & Diagnóstico', icon: '<img src="../img/tr69_logo.svg" class="link-custom-img-icon" alt="TR69 ACS">', isQuick: true },
            { id: 'lnk_schaman', name: 'Schaman', url: 'https://atc-clperu.schaman.com/schaman-sso/login?callback=AAAADDfLhTpFXbSJETw3QhDILl0NLOiLN0QoI8dU3SWwSKTvrjlJU4lSPMmuHTIXFb5Ctr09Tz2H8Se6pOTmA6e2Qww%3D&app=AAAADGMbhcwoHsi4O778tEhNo5SvofJD%2FIcQCFAyhlXeSZE6Mg5jbA%3D%3D&customer=AAAADAcU2Ikxs028MO8BAUqzICiPfU1bCdWstG2p6BMKi4wqtw%3D%3D', category: 'Internet & Diagnóstico', icon: '<img src="../img/schaman_logo.svg" class="link-custom-img-icon" alt="Schaman">', isQuick: true },
            { id: 'lnk_plume', name: 'Plume', url: 'https://gamma.central.plume.com/', category: 'Internet & Diagnóstico', icon: '<img src="../img/plume_logo.svg" class="link-custom-img-icon" alt="Plume">', isQuick: true },
            { id: 'lnk_remotedesktop', name: 'Escritorio Remoto', url: '172.29.0.101', category: 'Internet & Diagnóstico', icon: '🖥️', isQuick: true, isRdpInfo: true },
            { id: 'lnk_tracer', name: 'Tracer', url: 'http://172.19.112.62/generador/', category: 'Internet & Diagnóstico', icon: '<img src="../img/claro_logo.svg" class="link-custom-img-icon" alt="Tracer">', isQuick: true },
            { id: 'lnk_tracerplano', name: 'Tracer - Cliente por Plano', url: 'http://172.19.112.62/generador/hfc/ConexionesPlano', category: 'Internet & Diagnóstico', icon: '<img src="../img/claro_logo.svg" class="link-custom-img-icon" alt="Tracer">', isQuick: true },
            { id: 'lnk_youbora', name: 'Youbora', url: 'https://suite.npaw.com/login?redirect=/v/clarovideo_peru/analytics/tracking/video', category: 'Internet & Diagnóstico', icon: '<img src="../img/youbora_logo.svg" class="link-custom-img-icon" alt="Youbora">', isQuick: true },
            { id: 'lnk_skyway', name: 'Skyway', url: 'https://www.skywayplatform.com/skyway-platform/login?tenantCode=1086&backUrl=%252Ftms%252Fmanagement%252Fdevice', category: 'Internet & Diagnóstico', icon: '<img src="../img/skyway_logo.svg" class="link-custom-img-icon" alt="Skyway">', isQuick: true },

            { id: 'lnk_remedy_helix', name: 'BMC Helix', url: 'https://clarop-smartit.claro.pe/smartit/app/#/ticket-consoleStudio', category: 'Sistemas & Gestión', icon: '<img src="../img/helix_logo.svg" class="link-custom-img-icon" alt="BMC Helix">', isQuick: true },
            { id: 'lnk_remedy_dwp', name: 'Remedy', url: 'https://clarop-dwp.claro.pe/dwp/app/#/activity/events/details', category: 'Sistemas & Gestión', icon: '<img src="../img/remedy_dwp_logo.svg" class="link-custom-img-icon" alt="Remedy DWP">', isQuick: true },
            { id: 'lnk_ces', name: 'CES', url: 'http://intranetces.tim.com.pe/', category: 'Sistemas & Gestión', icon: '<img src="../img/claro_logo.svg" class="link-custom-img-icon" alt="CES">', isQuick: true },
            { id: 'lnk_portal_apps', name: 'Portal de Aplicaciones', url: 'http://intranetwebapp/aplicaciones/inicio.aspx', category: 'Sistemas & Gestión', icon: '<img src="../img/claro_logo.svg" class="link-custom-img-icon" alt="Portal de Aplicaciones">', isQuick: true },
            { id: 'lnk_linktrabajo', name: 'Link de Trabajo', url: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=CkbVXyW03kmb0PzSYnDTDItamkezRqRIvBJVVnC0d0pUQkEyRTRHM1dWOFNTMTAzUEI0ODQySThXVi4u&route=shorturl', category: 'Sistemas & Gestión', icon: '📝', isQuick: true },
            { id: 'lnk_powerbi', name: 'Microsoft Power BI', url: 'https://app.powerbi.com/view?r=eyJrIjoiZThhMzY4MjEtZTU5MS00YzFjLWE4OGMtYmI1NWFiOWJlMzgyIiwidCI6IjVmZDU0NjBhLWI0MjUtNDlkZS05YmQwLWZjZDI2MjcwZDMwYyIsImMiOjR9', category: 'Sistemas & Gestión', icon: '<img src="../img/powerbi_logo.svg" class="link-custom-img-icon" alt="Power BI">', isQuick: true },
            { id: 'lnk_livechat', name: 'LiveChat (Aivo)', url: 'https://live-us.aivo.co/chat', category: 'Canales & Comunicación', icon: '<img src="../img/livechat_logo.svg" class="link-custom-img-icon" alt="LiveChat">', isQuick: true },
            { id: 'lnk_aicc', name: 'AICC', url: 'https://10.189.8.188:28090/service-cloud/aicc-web/index/index.html#/ManualAppointWorkbenchDetails?taskId=1061244585&orgId=1752727161880235604&appointId=175435461525835224677465120200&eventType=AgentEvent_Customer_Release&updateCallId=1754354624-11840&isFirst=true&AgentEvent_Call_Out_Fail=true', category: 'Canales & Comunicación', icon: '<img src="../img/huawei_icc.svg" class="link-custom-img-icon" alt="AICC">', isQuick: true },
            { id: 'lnk_siac', name: 'SIAC Único', url: 'https://siacunico.claro.com.pe/', category: 'Sistemas & Gestión', icon: '<img src="../img/claro_logo.svg" class="link-custom-img-icon" alt="SIAC Único">', isQuick: false }
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


            initLinksSidebar();
            initManualsSidebar();
        }
    };
})();
