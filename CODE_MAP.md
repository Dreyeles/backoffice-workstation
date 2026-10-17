# 🗺️ Mapa de Arquitectura y Módulos - BackOffice Plantilleitor

Este documento describe la estructura modular del sistema para facilitar el mantenimiento y acelerar cualquier modificación futura.

---

## 📁 Estructura del Código Organizada por Capas

```text
d:\repositorio local\backoffice\
│── index.html                  # Estructura visual HTML y carga de scripts ordenados
│── dataset.js                  # Catálogo de motivos, equipos Claro (22 modelos) y manuales
│── styles.css                  # Estilos visuales, temas oscuro/claro y modales
│── app.js                      # Orquestador principal, estado central y arranque de módulos (~260 líneas)
│
└── 📁 js/
    ├── 📁 core/                # Utilidades base del sistema
    │   └── utils.js            # Portapapeles, toasts visuales, escapeHtml
    │
    ├── 📁 engines/             # Motores inteligentes auxiliares
    │   ├── autocorrect.js      # Diccionario y autocorrección de términos telecom
    │   ├── predictive.js       # Autocompletado inteligente (Ghost text, Tab, Dropdown)
    │   ├── case-parser.js      # Smart Case Parser (detección y distribución automática al pegar plantillas)
    │   ├── category-predictor.js # Motor de predicción de categorías de resolución (BO.TEC)
    │   └── sidebars.js         # Hub de Enlaces Rápidos (Alt+L) y Visor de Manuales técnicos
    │
    └── 📁 tabs/                # Lógica funcional de cada pestaña
        ├── generator.js        # Tab 1: Generador oficial SIAC, Manto, WhatsApp y Ciclo 2x3
        ├── tracker.js          # Tab 2: Seguimiento diario y línea de tiempo por hora
        ├── niveles.js          # Tab 3: Validador de niveles Incógnito DOCSIS 3.0/3.1 y FTTH (Flyer N° 41)
        ├── equipos.js          # Tab 4: Identificador de equipos, galería multi-ángulo y modal grande
        ├── plantillas-custom.js# Tab 5: Mis Plantillas Personalizadas y sustitución dinámica ({sot}, etc.)
        ├── remedy.js           # Tab 6: Formularios Remedy (Red, General, IPTV, Tel), exportador PDF/Word
        └── historial.js        # Tab 7: Historial de casos generados, filtros y respaldo JSON
```

---

## 🧩 Detalle por Capa y Módulo

### 1. Capa Core (`js/core/`)
* **[`js/core/utils.js`](file:///d:/repositorio%20local/backoffice/js/core/utils.js):** Funciones globales de interfaz compartidas: `window.showToast()`, `window.copyToClipboard()`, `window.escapeHtml()`.

### 2. Capa Engines (`js/engines/`)
* **[`js/engines/autocorrect.js`](file:///d:/repositorio%20local/backoffice/js/engines/autocorrect.js):** Diccionario ortográfico técnico (`cli`, `sot`, `hfc`, `cga`, `tg3442`, etc.) con autocorrección en `blur` y espacio.
* **[`js/engines/predictive.js`](file:///d:/repositorio%20local/backoffice/js/engines/predictive.js):** Motor predictivo de texto fantasma (`ghost text`) con tecla `Tab` y aprendizaje dinámico.
* **[`js/engines/case-parser.js`](file:///d:/repositorio%20local/backoffice/js/engines/case-parser.js):** Analizador inteligente de texto pegado: extrae automáticamente teléfonos móviles/fijos, SOT, IDs de llamada/chat, problemas y descartes.
* **[`js/engines/category-predictor.js`](file:///d:/repositorio%20local/backoffice/js/engines/category-predictor.js):** Matriz de decisiones técnicas para predecir la categoría `BO.TEC` según estado de SOT (pre/post caso), falta de contacto, titularidad o descartes.
* **[`js/engines/sidebars.js`](file:///d:/repositorio%20local/backoffice/js/engines/sidebars.js):** Control de paneles laterales (Enlaces rápidos `Alt + L` y visor de PDFs técnicos).

### 3. Capa Tabs (`js/tabs/`)
* **[`js/tabs/generator.js`](file:///d:/repositorio%20local/backoffice/js/tabs/generator.js):** Tab 1. Generador de plantillas SIAC (Estándar vs. WhatsApp vs. Ciclo de llamada), plantilla de Mantenimiento (`#MANTENIMIENTO...`), chips interactivos de descartes con ciclo de variantes y validación estricta antes de copiar.
* **[`js/tabs/tracker.js`](file:///d:/repositorio%20local/backoffice/js/tabs/tracker.js):** Tab 2. Registro y línea de tiempo por hora de casos gestionados en el turno, almacenamiento en `localStorage`.
* **[`js/tabs/niveles.js`](file:///d:/repositorio%20local/backoffice/js/tabs/niveles.js):** Tab 3. Diagnóstico de potencia Upstream/Downstream, SNR, variación de bloque (Δ > 4.0 dB) y niveles ópticos FTTH según el Flyer N° 41.
* **[`js/tabs/equipos.js`](file:///d:/repositorio%20local/backoffice/js/tabs/equipos.js):** Tab 4. Buscador con ranking, galería fotográfica adaptable y lightbox con zoom profundo.
* **[`js/tabs/plantillas-custom.js`](file:///d:/repositorio%20local/backoffice/js/tabs/plantillas-custom.js):** Tab 5. CRUD de plantillas de usuario con sustitución dinámica `{sot}`, `{telefono}`, `{servicio}`, etc.
* **[`js/tabs/remedy.js`](file:///d:/repositorio%20local/backoffice/js/tabs/remedy.js):** Tab 6. Formularios de escalamiento técnico con drag & drop de evidencias y exportación a PDF/Word.
* **[`js/tabs/historial.js`](file:///d:/repositorio%20local/backoffice/js/tabs/historial.js):** Tab 7. Historial de plantillas copiadas, búsqueda, filtros y exportación/importación JSON.

### 4. Orquestador (`app.js`)
* **[`app.js`](file:///d:/repositorio%20local/backoffice/app.js):** Inicializa el estado reactivo `state`, mapea el DOM `elements`, maneja el tema visual y la navegación de pestañas, y arranca de manera segura cada submódulo vía `window.BO_MODULES.*.init(state, elements)`.
