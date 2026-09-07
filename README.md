# 🚀 BackOffice WorkStation Suite (v8.0)

Plataforma web integral de productividad, diagnóstico técnico y automatización operativa diseñada para asesores de **BackOffice Telecom** (HFC / FTTH / SIAC / Manto / Helix / Remedy).

![Versión](https://img.shields.io/badge/Versi%C3%B3n-8.0-brightgreen?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌟 Novedades de la Versión 8.0

- **👁️ Popover Flotante de Previsualización en Vivo:** Previsualización instantánea con estilo *glassmorphism* al pasar el cursor sobre los botones de descartes rápidos, mostrando con exactitud el texto que se insertará antes de hacer clic.
- **🔤 Motor de Autocorrección y Abreviaturas en Tiempo Real:** Corrección inteligente de ortografía, tildes y términos técnicos en tiempo real durante la escritura o el pegado (`Ctrl+V`), preservando el cursor y espacios naturales.
- **🌐 Sidebar de Accesos Directos & Plataformas (`Alt+L`):** Panel lateral retráctil con accesos directos rápidos a las herramientas de Internet y plataformas de gestión operativas.
- **📋 Formato Estandarizado de Plantilla Mantenimiento:** Alineación completa con el estándar de plataforma para técnicos en Mantenimiento y SIAC.
- **✨ Ergonomía y Formato Tipo Oración:** Botones de descarte rápido estilizados en minúsculas con inicial mayúscula para una lectura más cómoda.
- **🛠️ Estructurador Remedy & Diagnóstico HFC:** Generador de reportes con captura vía `Ctrl+V`, exportación a PDF en 1-clic y validación de variación en bloque ($\Delta \le 4.0\text{ dB}$).

---

## 📌 Características Principales

### 1. 📝 Generador Inteligente de Tipificaciones (Plantillas SIAC / Manto)
- Selección en cascada de **Problema / Motivo** con categorización automática en **SIAC Único** y **Mantenimiento**.
- Autocompletado asistido de categorías de cierre con aviso contextual predictivo.
- Botones de selección rápida de descartes técnicos (*Ciclo de Llamada, Cliente Conforme, etc.*).
- Etiquetas dinámicas (*Hashtags*) para clasificación rápida de casos.
- Copiado en un solo clic formateado para sistemas de gestión de tickets.

### 2. ⚡ Validador de Niveles Técnicos (Hygeia / HFC & FTTH)
- **HFC (Coaxial):** Validación en tiempo real de *Upstream SNR*, *Downstream SNR*, *Potencia Rx*, *Potencia Tx* y *Variación en Bloque ($\Delta \le 4$)*.
- **FTTH (Fibra Óptica):** Validación instantánea de niveles ópticos *Tx* y *Rx* con rangos de tolerancia homologados.
- Diagnóstico visual por colores (*En Rango*, *Fuera de Rango*, *Variación Excesiva*).

### 3. 🛠️ Generador de Plantillas Remedy (Escalamiento)
- Estructura estándar con campos de Falla, ID, DNI, Cliente y Detalle.
- Zona interactiva para adjuntar evidencias y capturas vía `Ctrl+V` o arrastrar y soltar.
- Exportación instantánea a **PDF** listo para subir a la plataforma.

### 4. 📡 Identificador de Equipos y Credenciales
- Catálogo de routers, cablemódems y ONTs (ZTE, Technicolor, Huawei, Plume, Sagemcom, etc.).
- Verificación de estado de homologación y credenciales técnicas de acceso.

### 5. ⏱️ Tracker Operativo y Registro Diario
- Registro cronológico de casos atendidos por turno con contador en vivo.
- Cálculo automático de horas y resumen de atención con persistencia local (`localStorage`).

### 6. 📚 Biblioteca de Plantillas Personalizadas
- Gestor ágil de snippets y notas operativas con copiado directo.
- Expansión visual inteligente al pasar el cursor (*Hover preview*).

### 7. 📊 Matriz Ejecutiva de Tipificación
- Exportador de matriz completa a formato **PDF** y **HTML** estructurado para supervisión y capacitación.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend Core:** HTML5 Semántico, Vanilla JavaScript (ES6+), CSS3 Moderno (Variables CSS, Flexbox, Grid, Glassmorphism, Micro-animaciones).
- **Almacenamiento Local:** Web Storage API (`localStorage`).
- **Generador de Reportes:** Python 3 + Chromium Headless.

---

## 🚀 Instalación y Uso

No requiere instalación de servidores ni dependencias complejas.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Dreyeles/backoffice-workstation.git
   ```
2. **Abrir la aplicación:**
   - Abre `index.html` en cualquier navegador web moderno (Edge, Chrome, Firefox) o accede directamente a [https://dreyeles.github.io/backoffice-workstation/](https://dreyeles.github.io/backoffice-workstation/).

---

## 👨‍💻 Autor

Desarrollado por **Drey E. Aymituma** para optimizar la eficiencia y tiempos de atención operativa en entornos BackOffice.
