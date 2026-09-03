# 🚀 BackOffice WorkStation Suite

Plataforma web integral de productividad, diagnóstico técnico y automatización operativa diseñada para asesores de **BackOffice Telecom** (HFC / FTTH / SIAC / Manto / Helix).

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📌 Características Principales

### 1. 📝 Generador Inteligente de Tipificaciones (Plantillas SIAC / Manto)
- Selección en cascada de **Problema / Motivo** con categorización automática en **SIAC Único** y **Mantenimiento**.
- Autocompletado asistido de categorías de cierre con aviso contextual predictivo.
- Botones de selección rápida de descartes técnicos (*Ciclo de Llamada, Cliente Conforme, etc.*).
- Etiquetas dinámicas (*Hashtags*) para clasificación rápida de casos.
- Copiado en un solo clic formateado para sistemas de gestión de tickets.

### 2. ⚡ Validador de Niveles Técnicos (Hygeia / HFC & FTTH)
- **HFC (Coaxial):** Validación en tiempo real de *Upstream SNR*, *Downstream SNR*, *Potencia Rx* y *Potencia Tx*.
- **FTTH (Fibra Óptica):** Validación instantánea de niveles ópticos *Tx* y *Rx* con rangos de tolerancia homologados.
- Diagnóstico visual por colores (*En Rango*, *Fuera de Rango*).

### 3. 📡 Identificador de Equipos y Credenciales
- Catálogo de routers, cablemódems y ONTs (ZTE, Technicolor, Huawei, Plume, Sagemcom, etc.).
- Verificación de estado de homologación y credenciales técnicas de acceso.

### 4. ⏱️ Tracker Operativo y Registro Diario
- Registro cronológico de casos atendidos por turno con contador en vivo.
- Cálculo automático de horas y resumen de atención.
- Persistencia local mediante `localStorage` para proteger la información ante cierres accidentales.

### 5. 📚 Biblioteca de Plantillas Personalizadas
- Gestor ágil de snippets y notas operativas.
- Expansión visual inteligente al pasar el cursor (*Hover preview*).
- Copiado directo con registro en historial.

### 6. 📊 Matriz Ejecutiva de Tipificación
- Exportador de matriz completa a formato **PDF** y **HTML** estructurado para supervisión y capacitación.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend Core:** HTML5 Semántico, Vanilla JavaScript (ES6+), CSS3 Moderno (Variables CSS, Flexbox, Grid, Glassmorphism, Micro-animaciones).
- **Almacenamiento Local:** Web Storage API (`localStorage`).
- **Generador de Reportes:** Python 3 + Playwright / Chromium Headless.

---

## 🚀 Instalación y Uso

No requiere instalación de servidores ni dependencias complejas.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Dreyeles/backoffice-workstation.git
   ```
2. **Abrir la aplicación:**
   - Simplemente abre `index.html` en cualquier navegador web moderno (Edge, Chrome, Firefox).

---

## 👨‍💻 Autor

Desarrollado con dedicación para optimizar la eficiencia y tiempos de atención operativa en entornos BackOffice.
