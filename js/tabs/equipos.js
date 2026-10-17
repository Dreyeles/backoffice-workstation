/* ==========================================================================
   MODULE: IDENTIFICADOR DE EQUIPOS, GALERÍA MULTI-ÁNGULO & PREVISUALIZADOR
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    window.BO_MODULES.equipos = {
        init(state, elements) {
        // Equipment Identifier Logic
        let currentSelectedEq = null;
        let currentEqAngleIndex = 0;
        let modalActiveIndex = 0;

        function getEqImages(eq) {
            if (!eq) return [];
            if (Array.isArray(eq.imagenes) && eq.imagenes.length > 0) {
                return eq.imagenes;
            }
            if (eq.imagen) {
                return [{ label: "Foto 1", src: eq.imagen, desc: "Vista del equipo" }];
            }
            return [];
        }

        function syncCardImage() {
            if (!elements.eqImage) return;
            if (!currentSelectedEq) {
                if (elements.btnCardPrevImg) elements.btnCardPrevImg.style.display = 'none';
                if (elements.btnCardNextImg) elements.btnCardNextImg.style.display = 'none';
                if (elements.eqCardImgCounter) elements.eqCardImgCounter.style.display = 'none';
                elements.eqImage.style.display = 'none';
                if (elements.eqImagePlaceholder) {
                    elements.eqImagePlaceholder.style.display = 'block';
                    elements.eqImagePlaceholder.textContent = 'Sin imagen';
                }
                return;
            }

            const images = getEqImages(currentSelectedEq);
            const multi = images.length > 1;

            if (elements.btnCardPrevImg) elements.btnCardPrevImg.style.display = multi ? 'flex' : 'none';
            if (elements.btnCardNextImg) elements.btnCardNextImg.style.display = multi ? 'flex' : 'none';
            if (elements.eqCardImgCounter) {
                elements.eqCardImgCounter.style.display = multi ? 'inline-flex' : 'none';
                if (elements.eqCardImgCounterText) {
                    elements.eqCardImgCounterText.textContent = `${currentEqAngleIndex + 1} / ${images.length}`;
                }
            }

            delete elements.eqImage.dataset.fallbackTried;
            const currentSrc = (images.length > 0 && images[currentEqAngleIndex]) ? images[currentEqAngleIndex].src : (currentSelectedEq.imagen || '');
            if (currentSrc) {
                elements.eqImage.src = currentSrc;
                elements.eqImage.style.display = 'block';
                if (elements.eqImagePlaceholder) elements.eqImagePlaceholder.style.display = 'none';
            } else {
                elements.eqImage.style.display = 'none';
                if (elements.eqImagePlaceholder) {
                    elements.eqImagePlaceholder.style.display = 'block';
                    elements.eqImagePlaceholder.textContent = 'Sin imagen';
                }
            }
        }

        // Navegación rápida de fotos en la tarjeta principal
        if (elements.btnCardPrevImg) {
            elements.btnCardPrevImg.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentSelectedEq) return;
                const images = getEqImages(currentSelectedEq);
                if (images.length <= 1) return;
                currentEqAngleIndex = (currentEqAngleIndex - 1 + images.length) % images.length;
                modalActiveIndex = currentEqAngleIndex;
                syncCardImage();
            });
        }

        if (elements.btnCardNextImg) {
            elements.btnCardNextImg.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentSelectedEq) return;
                const images = getEqImages(currentSelectedEq);
                if (images.length <= 1) return;
                currentEqAngleIndex = (currentEqAngleIndex + 1) % images.length;
                modalActiveIndex = currentEqAngleIndex;
                syncCardImage();
            });
        }

        if (elements.eqSearchInput) {
            elements.eqSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toUpperCase();

                if (query.length < 2) {
                    elements.eqResultContainer.style.display = 'none';
                    currentSelectedEq = null;
                    currentEqAngleIndex = 0;
                    syncCardImage();
                    if (elements.eqAngleSelector) elements.eqAngleSelector.style.display = 'none';
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
                    const dataset = typeof equiposClaro !== 'undefined' ? equiposClaro : Object.keys(modelosData).map(k => {
                        const p = (modelosData[k].plataformas || '').toUpperCase();
                        const hasTR069 = p.includes('TR069') || p.includes('TR-069') || p.includes('TR 069');
                        return {
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
                            homologado: hasTR069,
                            imagen: modelosData[k].img,
                            imagenes: modelosData[k].imagenes || (modelosData[k].img ? [{ label: "Frontal", src: modelosData[k].img, desc: "Vista frontal del equipo" }] : []),
                            descripcion: modelosData[k].descripcion,
                            repetidor: modelosData[k].repetidor,
                            velocidad: modelosData[k].velocidad
                        };
                    });

                    const scoreMatch = (eq) => {
                        const codeClean = (eq.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const codeNorm = normalizeEquip(eq.codigo);
                        const modelClean = (eq.modelo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const modelNorm = normalizeEquip(eq.modelo);
                        const nameClean = (eq.nombre || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const vendorClean = (eq.vendor || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const aliases = (Array.isArray(eq.aliases) ? eq.aliases : []).map(a => a.toUpperCase().replace(/[^A-Z0-9]/g, ''));

                        // Exact matches
                        if (codeClean === cleanQuery || modelClean === cleanQuery) return 1000;
                        if (aliases.some(a => a === cleanQuery || a === normQuery)) return 950;
                        if (nameClean === cleanQuery || nameClean === normQuery) return 900;

                        // Starts with
                        if (codeClean.startsWith(cleanQuery) || modelClean.startsWith(cleanQuery)) return 800;
                        if (aliases.some(a => a.startsWith(cleanQuery) || a.startsWith(normQuery))) return 750;

                        // Contains query
                        if (codeClean.includes(cleanQuery) || modelClean.includes(cleanQuery)) return 600;
                        if (aliases.some(a => a.includes(cleanQuery) || a.includes(normQuery))) return 550;
                        if (nameClean.includes(cleanQuery) || nameClean.includes(normQuery)) return 500;

                        // Query contains code or model
                        if (codeClean.length >= 3 && cleanQuery.includes(codeClean)) return 300 + codeClean.length;
                        if (modelClean.length >= 3 && cleanQuery.includes(modelClean)) return 300 + modelClean.length;

                        // Query contains alias
                        let bestAlias = 0;
                        for (const a of aliases) {
                            if (a.length >= 3 && (cleanQuery.includes(a) || normQuery.includes(a))) {
                                bestAlias = Math.max(bestAlias, 200 + a.length);
                            }
                        }
                        if (bestAlias > 0) return bestAlias;

                        // Vendor match
                        if ((cleanQuery.length >= 3 || normQuery.length >= 3) && vendorClean.includes(cleanQuery || normQuery)) {
                            return 150;
                        }

                        return 0;
                    };

                    const matches = dataset
                        .map(eq => ({ eq, score: scoreMatch(eq) }))
                        .filter(item => item.score > 0)
                        .sort((a, b) => b.score - a.score)
                        .map(item => item.eq);

                    // Si hay múltiples resultados, mostrar sugerencias interactivas
                    let suggestionsEl = document.getElementById('eqSuggestions');
                    if (!suggestionsEl && elements.eqSearchInput.parentNode) {
                        suggestionsEl = document.createElement('div');
                        suggestionsEl.id = 'eqSuggestions';
                        suggestionsEl.style.cssText = 'display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.6rem; font-size:0.75rem; align-items:center;';
                        elements.eqSearchInput.parentNode.after(suggestionsEl);
                    }

                    if (matches.length > 1 && suggestionsEl) {
                        suggestionsEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.7rem; margin-right:4px;">Coincidencias (${matches.length}):</span>` +
                            matches.slice(0, 8).map(m => {
                                const mPlat = (m.plataformas || '').toUpperCase();
                                const mHasTR = mPlat.includes('TR069') || mPlat.includes('TR-069') || mPlat.includes('TR 069');
                                const dotColor = mHasTR ? '#10b981' : '#f87171';
                                return `<button type="button" class="btn-xs eq-match-btn" data-model="${m.codigo}" style="font-size:0.7rem; padding:2px 7px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px; cursor:pointer; color:var(--text-color); display:inline-flex; align-items:center; gap:4px;">
                                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${dotColor};"></span>
                                    ${escapeHtml(m.modelo || m.codigo)}
                                </button>`;
                            }).join('');
                        suggestionsEl.style.display = 'flex';
                        suggestionsEl.querySelectorAll('.eq-match-btn').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const mKey = btn.getAttribute('data-model');
                                elements.eqSearchInput.value = mKey;
                                elements.eqSearchInput.dispatchEvent(new Event('input'));
                            });
                        });
                    } else if (suggestionsEl) {
                        suggestionsEl.style.display = 'none';
                    }

                    const result = matches.length > 0 ? matches[0] : null;

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

                        // Badge Homologación - REGLA ESTRICTA: Solo homologados con TR-069 en plataforma de revisión
                        const platUpper = (result.plataformas || '').toUpperCase();
                        const hasTR069 = platUpper.includes('TR069') || platUpper.includes('TR-069') || platUpper.includes('TR 069');
                        const isHomologado = (result.homologado !== false) && hasTR069;

                        if (isHomologado) {
                            elements.eqStatus.textContent = "✅ Homologado (TR-069)";
                            elements.eqStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
                            elements.eqStatus.style.color = '#28a745';
                            elements.eqStatus.style.border = '1px solid rgba(40, 167, 69, 0.3)';
                            elements.eqStatus.title = 'Equipo Homologado: cuenta con soporte TR-069 en plataforma de revisión';
                        } else {
                            elements.eqStatus.textContent = "❌ No Homologado (Sin TR-069)";
                            elements.eqStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
                            elements.eqStatus.style.color = '#dc3545';
                            elements.eqStatus.style.border = '1px solid rgba(220, 53, 69, 0.3)';
                            elements.eqStatus.title = 'Equipo No Homologado: la plataforma de revisión no cuenta con TR-069';
                        }

                        // Firmware oficial
                        if (elements.eqFirmware) {
                            if (result.firmware) {
                                elements.eqFirmware.innerHTML = `<strong>💾 Firmware:</strong> <span style="color:#60a5fa; font-weight:bold; font-family:monospace; margin-left:4px;">${escapeHtml(result.firmware)}</span>`;
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

                        // Handle equipment and gallery
                        currentSelectedEq = result;
                        currentEqAngleIndex = 0;
                        modalActiveIndex = 0;
                        syncCardImage();

                        // Fallback si la imagen no carga
                        elements.eqImage.onerror = () => {
                            if (!elements.eqImage.dataset.fallbackTried) {
                                elements.eqImage.dataset.fallbackTried = '1';
                                const images = getEqImages(currentSelectedEq);
                                if (images.length > 1) {
                                    const nextIdx = (currentEqAngleIndex + 1) % images.length;
                                    if (nextIdx !== currentEqAngleIndex && images[nextIdx]?.src) {
                                        currentEqAngleIndex = nextIdx;
                                        elements.eqImage.src = images[nextIdx].src;
                                        return;
                                    }
                                }
                            }
                            elements.eqImage.style.display = 'none';
                            elements.eqImagePlaceholder.style.display = 'block';
                            elements.eqImagePlaceholder.textContent = '📷 Imagen no disponible';
                        };
                    } else {
                        currentSelectedEq = null;
                        currentEqAngleIndex = 0;
                        syncCardImage();
                        if (elements.eqAngleSelector) elements.eqAngleSelector.style.display = 'none';
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


            // Abrir Previsualizador Grande (Lightbox Modal) al hacer clic en la imagen
            if (elements.eqImageBox) {
                elements.eqImageBox.addEventListener('click', () => {
                    if (!currentSelectedEq) return;
                    openEqModalViewer(currentSelectedEq, currentEqAngleIndex);
                });
            }

            // Modal Previsualizador Grande - Funciones y Eventos (Con Zoom Tipo Amazon)
            let currentModalZoom = 2.4;
            let isModalZooming = false;

            function resetModalZoom() {
                isModalZooming = false;
                if (elements.eqModalViewport) {
                    elements.eqModalViewport.classList.remove('is-zooming');
                }
                if (elements.eqModalImage) {
                    elements.eqModalImage.style.transformOrigin = 'center center';
                    elements.eqModalImage.style.transform = 'scale(1)';
                }
                if (elements.eqModalZoomText) {
                    elements.eqModalZoomText.textContent = 'Clic para Zoom';
                }
            }

            if (elements.eqModalViewport && elements.eqModalImage) {
                // Alternar zoom haciendo clic sobre el visor/imagen
                elements.eqModalViewport.addEventListener('click', (e) => {
                    // Si se hizo clic en las flechas de navegación, no intervenir
                    if (e.target.closest('#btnEqModalPrev') || e.target.closest('#btnEqModalNext')) {
                        return;
                    }
                    if (!elements.eqModalImage.src || elements.eqModalImage.style.display === 'none') {
                        return;
                    }

                    if (isModalZooming) {
                        resetModalZoom();
                    } else {
                        // Iniciar zoom centrado en las coordenadas donde el usuario hizo clic
                        const rect = elements.eqModalViewport.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                            const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                            elements.eqModalImage.style.transformOrigin = `${xPercent.toFixed(2)}% ${yPercent.toFixed(2)}%`;
                        }
                        isModalZooming = true;
                        elements.eqModalViewport.classList.add('is-zooming');
                        elements.eqModalImage.style.transform = `scale(${currentModalZoom})`;
                        if (elements.eqModalZoomText) {
                            elements.eqModalZoomText.textContent = `Zoom ${currentModalZoom.toFixed(1)}x (Clic para alejar · Rueda ±)`;
                        }
                    }
                });

                // Mover el mouse con zoom activo desplaza la imagen suavemente
                elements.eqModalViewport.addEventListener('mousemove', (e) => {
                    if (!isModalZooming || !elements.eqModalImage.src) return;
                    const rect = elements.eqModalViewport.getBoundingClientRect();
                    if (rect.width <= 0 || rect.height <= 0) return;

                    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

                    elements.eqModalImage.style.transformOrigin = `${xPercent.toFixed(2)}% ${yPercent.toFixed(2)}%`;
                    elements.eqModalImage.style.transform = `scale(${currentModalZoom})`;
                });

                // Permite regular el aumento con la rueda del ratón (1.5x a 4.5x)
                elements.eqModalViewport.addEventListener('wheel', (e) => {
                    if (!isModalZooming || !elements.eqModalImage.src) return;
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        currentModalZoom = Math.min(4.5, currentModalZoom + 0.3);
                    } else {
                        currentModalZoom = Math.max(1.5, currentModalZoom - 0.3);
                    }
                    elements.eqModalImage.style.transform = `scale(${currentModalZoom})`;
                    if (elements.eqModalZoomText) {
                        elements.eqModalZoomText.textContent = `Zoom ${currentModalZoom.toFixed(1)}x (Clic para alejar · Rueda ±)`;
                    }
                }, { passive: false });

                // Clic fuera del visor desactiva el zoom
                document.addEventListener('click', (e) => {
                    if (isModalZooming && elements.eqModalViewport && !elements.eqModalViewport.contains(e.target)) {
                        resetModalZoom();
                    }
                });
            }

            function openEqModalViewer(eq, initialIdx = 0) {
                if (!elements.eqModalViewer || !eq) return;

                resetModalZoom();
                currentModalZoom = 2.4;

                const platUpper = (eq.plataformas || '').toUpperCase();
                const hasTR069 = platUpper.includes('TR069') || platUpper.includes('TR-069') || platUpper.includes('TR 069');
                const isHomologado = (eq.homologado !== false) && hasTR069;
                const images = getEqImages(eq);

                modalActiveIndex = (initialIdx >= 0 && initialIdx < images.length) ? initialIdx : 0;

                // Título y Subtítulo limpio (Fabricante y tipo de equipo)
                if (elements.eqModalTitle) {
                    elements.eqModalTitle.textContent = eq.nombre || eq.modelo;
                }
                if (elements.eqModalSubtitle) {
                    const vendorText = eq.vendor ? `Fabricante: ${eq.vendor}` : 'Equipo Residencial Claro';
                    const tipoText = eq.red === 'FTTH' ? 'Terminal Óptica ONT (FTTH)' : 'Cablemódem eMTA Router (HFC)';
                    elements.eqModalSubtitle.innerHTML = `<span>🏢 ${escapeHtml(vendorText)}</span> <span>·</span> <span>🏷️ ${escapeHtml(tipoText)}</span>`;
                }

                // Badges de cabecera (Directos, sin duplicar en el cuerpo)
                // 1. Red & Tecnología (Combina Red + DOCSIS/GPON en 1 solo badge limpio)
                if (elements.eqModalRedBadge) {
                    const redLabel = eq.red === 'FTTH' 
                        ? (eq.docsis ? `FTTH · ${eq.docsis}` : 'FTTH · GPON')
                        : (eq.docsis ? `HFC · ${eq.docsis}` : 'HFC');
                    elements.eqModalRedBadge.textContent = redLabel;
                    if (eq.red === 'FTTH') {
                        elements.eqModalRedBadge.style.backgroundColor = 'rgba(139, 92, 246, 0.18)';
                        elements.eqModalRedBadge.style.color = '#a78bfa';
                        elements.eqModalRedBadge.style.border = '1px solid rgba(139, 92, 246, 0.35)';
                    } else {
                        elements.eqModalRedBadge.style.backgroundColor = 'rgba(234, 88, 12, 0.18)';
                        elements.eqModalRedBadge.style.color = '#fb923c';
                        elements.eqModalRedBadge.style.border = '1px solid rgba(234, 88, 12, 0.35)';
                    }
                }

                // 2. Wi-Fi
                if (elements.eqModalWifiBadge) {
                    elements.eqModalWifiBadge.textContent = eq.wifi || 'Wi-Fi Estándar';
                    elements.eqModalWifiBadge.style.backgroundColor = 'rgba(59, 130, 246, 0.18)';
                    elements.eqModalWifiBadge.style.color = '#60a5fa';
                    elements.eqModalWifiBadge.style.border = '1px solid rgba(59, 130, 246, 0.35)';
                }

                // 3. Homologación TR-069
                if (elements.eqModalHomologadoBadge) {
                    if (isHomologado) {
                        elements.eqModalHomologadoBadge.textContent = '✅ Homologado (TR-069)';
                        elements.eqModalHomologadoBadge.style.backgroundColor = 'rgba(40, 167, 69, 0.18)';
                        elements.eqModalHomologadoBadge.style.color = '#28a745';
                        elements.eqModalHomologadoBadge.style.border = '1px solid rgba(40, 167, 69, 0.4)';
                    } else {
                        elements.eqModalHomologadoBadge.textContent = '❌ Sin TR-069 (No Homol.)';
                        elements.eqModalHomologadoBadge.style.backgroundColor = 'rgba(220, 53, 69, 0.18)';
                        elements.eqModalHomologadoBadge.style.color = '#dc3545';
                        elements.eqModalHomologadoBadge.style.border = '1px solid rgba(220, 53, 69, 0.4)';
                    }
                }

                // 4. Soporte Repetidor MESH
                if (elements.eqModalRepetidorBadge) {
                    const hasMesh = (eq.repetidor === 'SI');
                    elements.eqModalRepetidorBadge.textContent = hasMesh ? '🟢 Soporte MESH' : '🔴 Sin MESH';
                    if (hasMesh) {
                        elements.eqModalRepetidorBadge.style.backgroundColor = 'rgba(34, 197, 94, 0.18)';
                        elements.eqModalRepetidorBadge.style.color = '#22c55e';
                        elements.eqModalRepetidorBadge.style.border = '1px solid rgba(34, 197, 94, 0.4)';
                    } else {
                        elements.eqModalRepetidorBadge.style.backgroundColor = 'rgba(107, 114, 128, 0.18)';
                        elements.eqModalRepetidorBadge.style.color = 'var(--text-muted)';
                        elements.eqModalRepetidorBadge.style.border = '1px solid rgba(107, 114, 128, 0.35)';
                    }
                }

                // Ficha Técnica de Operaciones (Key-Value limpio y funcional)
                if (elements.eqModalSpeed) {
                    elements.eqModalSpeed.textContent = eq.velocidad 
                        ? (eq.velocidad >= 1000 ? 'Hasta 1 Gbps (1000M)' : `Hasta ${eq.velocidad} Mbps`) 
                        : 'Perfil estándar de red';
                }
                if (elements.eqModalPlat) {
                    elements.eqModalPlat.textContent = eq.plataformas || 'INCOGNITO / REMOTO';
                }
                if (elements.eqModalFw) {
                    elements.eqModalFw.textContent = eq.firmware || 'No especificado';
                }


                    if (elements.eqModalThumbnails) {
                        elements.eqModalThumbnails.innerHTML = '';
                        if (images.length > 1) {
                            images.forEach((imgObj, idx) => {
                                const thumbBtn = document.createElement('button');
                                thumbBtn.type = 'button';
                                thumbBtn.className = `eq-thumb-btn ${idx === modalActiveIndex ? 'active' : ''}`;
                                thumbBtn.title = `Foto ${idx + 1} de ${images.length}${imgObj.desc ? ': ' + imgObj.desc : ''}`;
                                thumbBtn.innerHTML = `<img src="${escapeHtml(imgObj.src)}" alt="Foto ${idx + 1}" style="max-height:100%; max-width:100%; object-fit:contain;">`;
                                thumbBtn.addEventListener('click', () => {
                                    modalActiveIndex = idx;
                                    updateModalGallery();
                                });
                                elements.eqModalThumbnails.appendChild(thumbBtn);
                            });
                            elements.eqModalThumbnails.style.display = 'flex';
                        } else {
                            elements.eqModalThumbnails.style.display = 'none';
                        }
                    }

                    updateModalGallery();

                    elements.eqModalViewer.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }

                // Render Galería Modal (en ámbito accesible para las flechas de navegación y teclado)
                function updateModalGallery() {
                    resetModalZoom();
                    if (!currentSelectedEq) return;
                    const images = getEqImages(currentSelectedEq);
                    if (images.length === 0) {
                        if (elements.eqModalImage) elements.eqModalImage.src = '';
                        if (elements.eqModalAngleText) elements.eqModalAngleText.textContent = 'Sin imagen';
                        if (elements.eqModalAngleDesc) elements.eqModalAngleDesc.textContent = '';
                        if (elements.btnEqModalPrev) elements.btnEqModalPrev.style.display = 'none';
                        if (elements.btnEqModalNext) elements.btnEqModalNext.style.display = 'none';
                        return;
                    }

                    if (modalActiveIndex < 0) modalActiveIndex = images.length - 1;
                    if (modalActiveIndex >= images.length) modalActiveIndex = 0;

                    const currentImg = images[modalActiveIndex];
                    if (elements.eqModalImage) {
                        delete elements.eqModalImage.dataset.fallbackTried;
                        elements.eqModalImage.src = currentImg.src;
                        elements.eqModalImage.alt = `Foto ${modalActiveIndex + 1}`;
                    }
                    if (elements.eqModalAngleText) {
                        elements.eqModalAngleText.textContent = `Foto ${modalActiveIndex + 1} de ${images.length}`;
                    }
                    if (elements.eqModalAngleDesc) {
                        elements.eqModalAngleDesc.textContent = currentImg.desc || '';
                    }

                    const multi = images.length > 1;
                    if (elements.btnEqModalPrev) elements.btnEqModalPrev.style.display = multi ? 'flex' : 'none';
                    if (elements.btnEqModalNext) elements.btnEqModalNext.style.display = multi ? 'flex' : 'none';

                    if (elements.eqModalThumbnails) {
                        elements.eqModalThumbnails.querySelectorAll('.eq-thumb-btn').forEach((btn, idx) => {
                            btn.classList.toggle('active', idx === modalActiveIndex);
                        });
                    }

                    // Sincronizar selección con la tarjeta principal
                    currentEqAngleIndex = modalActiveIndex;
                    syncCardImage();
                }

            function closeEqModalViewer() {
                resetModalZoom();
                currentModalZoom = 2.4;
                if (!elements.eqModalViewer) return;
                elements.eqModalViewer.classList.remove('active');
                document.body.style.overflow = '';
            }

            if (elements.btnEqModalPrev) {
                elements.btnEqModalPrev.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!currentSelectedEq) return;
                    const images = getEqImages(currentSelectedEq);
                    if (images.length <= 1) return;
                    modalActiveIndex = (modalActiveIndex - 1 + images.length) % images.length;
                    updateModalGallery();
                });
            }

            if (elements.btnEqModalNext) {
                elements.btnEqModalNext.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!currentSelectedEq) return;
                    const images = getEqImages(currentSelectedEq);
                    if (images.length <= 1) return;
                    modalActiveIndex = (modalActiveIndex + 1) % images.length;
                    updateModalGallery();
                });
            }

            if (elements.eqModalClose) {
                elements.eqModalClose.addEventListener('click', closeEqModalViewer);
            }

            if (elements.eqModalViewer) {
                elements.eqModalViewer.addEventListener('click', (e) => {
                    if (e.target === elements.eqModalViewer) {
                        closeEqModalViewer();
                    }
                });
            }

            document.addEventListener('keydown', (e) => {
                if (elements.eqModalViewer && elements.eqModalViewer.classList.contains('active')) {
                    if (e.key === 'Escape') {
                        if (isModalZooming) {
                            resetModalZoom();
                        } else {
                            closeEqModalViewer();
                        }
                    } else if (e.key === 'ArrowLeft' && elements.btnEqModalPrev) {
                        elements.btnEqModalPrev.click();
                    } else if (e.key === 'ArrowRight' && elements.btnEqModalNext) {
                        elements.btnEqModalNext.click();
                    }
                }
            });
        }
        }
    };
})();
