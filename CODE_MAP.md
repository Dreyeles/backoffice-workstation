# 🗺️ Mapa de Arquitectura y Módulos - BackOffice Plantilleitor

Este documento describe la estructura modular del sistema para facilitar el mantenimiento y acelerar cualquier modificación futura.

---

## 📁 Estructura del Código

```text
d:\repositorio local\backoffice\
│── index.html                  # Estructura visual HTML y carga de scripts
│── dataset.js                  # Catálogo de motivos, equipos Claro (19 modelos) y manuales
│── styles.css                  # Estilos visuales, temas oscuro/claro y modales
│── app.js                      # Orquestador principal, estado central y Tab 1 (Generador)
│
└── 📁 js/
    ├── autocorrect.js          # Motor y diccionario de autocorrección ortográfica telecom
    ├── predictive.js           # Motor de autocompletado inteligente (Ghost text, Tab, Dropdown)
    ├── niveles.js              # Validador de niveles Incógnito DOCSIS 3.0/3.1 y FTTH (Flyer N° 41)
    ├── equipos.js              # Identificador de equipos, galería multi-ángulo y modal grande
    ├── plantillas-custom.js    # Mis Plantillas Personalizadas y sustitución dinámica ({sot}, etc.)
    ├── remedy.js               # Formularios Remedy (Red, General, IPTV, Tel), exportador PDF y Word
    ├── historial.js            # Historial de casos generados, filtros y respaldo JSON
    └── sidebars.js             # Sidebars off-canvas (Enlaces & Plataformas, Manuales técnicos)
```

---

## 🧩 Detalle por Módulo

### 1. [`js/autocorrect.js`](file:///d:/repositorio%20local/backoffice/js/autocorrect.js)
- Diccionario de abreviaturas telecom (`cli`, `sot`, `hfc`, `ftth`, `ont`, `cga`, `tg3442`, etc.).
- Función global: `window.autoCorrectText(text, preserveTrailingSpaces)`.
- Eventos de corrección en `blur` y tras espacio.

### 2. [`js/predictive.js`](file:///d:/repositorio%20local/backoffice/js/predictive.js)
- Motor de texto fantasma (`ghost text`) en campos de Problema, Solución y Descartes.
- Aceptación con tecla `Tab` o `Flecha Derecha`.
- Menú desplegable flotante con ranking y aprendizaje automático (`window.learnSinglePhrase`).

### 3. [`js/niveles.js`](file:///d:/repositorio%20local/backoffice/js/niveles.js)
- Pautas del **Flyer N° 41-BO FIJA (30/09/2026)**.
- Diagnóstico automático de:
  - Potencia Upstream (US Pot)
  - Potencia Downstream (DS Pot)
  - Relación Señal/Ruido (DS SNR / US SNR)
  - Variación de bloque (Δ > 4.0 dB)
  - Niveles ópticos FTTH (Tx / Rx dBm)

### 4. [`js/equipos.js`](file:///d:/repositorio%20local/backoffice/js/equipos.js)
- Identificador y buscador con sistema de puntuación exacta (ranking).
- Galería adaptable con contador dinámico flotante (`📷 1 / 3`) y flechas de navegación directa sobre la tarjeta.
- Previsualizador grande Lightbox (`#eqModalViewer`) accesible al hacer clic sobre la imagen, con miniaturas visuales y atajos de teclado (`Esc`, `←`, `→`).

### 5. [`js/plantillas-custom.js`](file:///d:/repositorio%20local/backoffice/js/plantillas-custom.js)
- Gestión CRUD de plantillas de usuario guardadas en `localStorage`.
- Sustitución dinámica de variables: `{sot}`, `{telefono}`, `{servicio}`, `{problema}`, `{solucion}`.
- Modal de creación y edición.

### 6. [`js/remedy.js`](file:///d:/repositorio%20local/backoffice/js/remedy.js)
- 4 Formularios de escalamiento:
  1. HFC a RED (Páginas, CGNAT, DNS, lentitud, caídas)
  2. Fallas Generales / Provisión (SGA, CBIO, etc.)
  3. IPTV a RED (Canales afectados, decodificadores)
  4. Telefonía a RED (Sin tono, llamadas salientes/entrantes)
- Drag & Drop y pegado de capturas con visor zoom (`window.previewRemedyImageZoom`).
- Exportación a PDF con formato imprimible y hoja visual estilo Word.

### 7. [`js/historial.js`](file:///d:/repositorio%20local/backoffice/js/historial.js)
- Registro automático de cada plantilla copiada (`window.addHistoryRecord`).
- Búsqueda, filtrado por fecha/tipo/servicio.
- Modal de detalle de caso y exportación/importación en formato JSON.

### 8. [`js/sidebars.js`](file:///d:/repositorio%20local/backoffice/js/sidebars.js)
- Hub de Enlaces Rápidos y Plataformas de Trabajo (`Alt + L`).
- Manuales y Guías Técnicas con visor de PDF integrado.

### 9. [`app.js`](file:///d:/repositorio%20local/backoffice/app.js) (Núcleo)
- Objeto de estado global `state` y referencias de elementos DOM `elements`.
- Alternancia de tema Claro / Oscuro.
- Pestañas principales de navegación (`Tab 1` a `Tab 4`).
- Analizador inteligente de casos pegados (`parseAndDistributeCaseTemplate`).
- Generador de plantilla SIAC oficial (Estándar vs. WhatsApp vs. Ciclo de llamada).
- Orquestación y arranque de todos los módulos vía `window.BO_MODULES.*.init(state, elements)`.
