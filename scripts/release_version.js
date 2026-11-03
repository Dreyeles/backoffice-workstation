/**
 * WORKSTATION BACKOFFICE - PUBLICADOR DE VERSIONES AUTOMÁTICO
 * 
 * Este script automatiza:
 * 1. Preguntar interactivamente la nueva versión numérica (ej. 2.8.4).
 * 2. Solicitar el título y los puntos destacados de la actualización.
 * 3. Actualizar index.html:
 *    - Badge de versión en el header
 *    - Título del modal de novedades
 *    - Inserción de la nueva sección en la lista de novedades (#changelogModal)
 *    - Actualización del cache-busting en las etiquetas <script src="*?v=...">
 * 4. Ejecutar git add, git commit y git push a origin/main.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

// Paleta de colores ANSI
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

function getNextPatch(version) {
    const parts = version.split('.');
    if (parts.length === 3 && !isNaN(parts[2])) {
        return `${parts[0]}.${parts[1]}.${parseInt(parts[2], 10) + 1}`;
    }
    return version;
}

async function main() {
    console.log(`\n${c.cyan}${c.bright}================================================================${c.reset}`);
    console.log(`${c.cyan}${c.bright}   🚀 WORKSTATION BACKOFFICE - PUBLICADOR DE NUEVA VERSIÓN       ${c.reset}`);
    console.log(`${c.cyan}${c.bright}================================================================${c.reset}\n`);

    if (!fs.existsSync(INDEX_PATH)) {
        console.error(`${c.red}❌ Error: No se encontró index.html en ${INDEX_PATH}${c.reset}`);
        rl.close();
        return;
    }

    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    // 1. Detectar versión actual
    let currentVersion = '2.8.3';
    const headerMatch = html.match(/style="background:\s*var\(--primary\);\s*color:\s*white;\s*padding:\s*0\.15rem\s*0\.5rem;\s*font-weight:\s*bold;\s*-webkit-text-fill-color:\s*white;">([^<]+)<\/span>/i);
    if (headerMatch && headerMatch[1]) {
        currentVersion = headerMatch[1].trim();
    } else {
        const titleMatch = html.match(/Novedades de la Versi[óo]n\s+([0-9\.]+)/i);
        if (titleMatch && titleMatch[1]) {
            currentVersion = titleMatch[1].trim();
        }
    }

    console.log(`${c.yellow}📌 Versión actual detectada:${c.reset} ${c.bright}${currentVersion}${c.reset}`);
    const suggestedVersion = getNextPatch(currentVersion);

    // 2. Pedir nueva versión
    let newVersion = await ask(`\n${c.bright}¿Cuál es la nueva versión numérica?${c.reset} [Sugerida: ${c.green}${suggestedVersion}${c.reset}]: `);
    newVersion = newVersion.trim() || suggestedVersion;

    if (!/^[0-9]+(\.[0-9]+)+$/.test(newVersion)) {
        console.log(`${c.yellow}⚠️ Advertencia: '${newVersion}' no sigue el formato habitual X.Y.Z, pero se continuará.${c.reset}`);
    }

    // 3. Pedir título o tema principal
    let title = await ask(`\n${c.bright}Título o tema principal de la versión ${newVersion}:${c.reset}\n> `);
    title = title.trim() || 'Mejoras de estabilidad y optimizaciones';

    // 4. Pedir ítems o cambios detallados
    console.log(`\n${c.bright}Ingresa los cambios para el modal de novedades.${c.reset}`);
    console.log(`${c.cyan}(Escribe cada punto y pulsa Enter. Deja una línea vacía y pulsa Enter para terminar):${c.reset}`);

    const items = [];
    let itemIndex = 1;
    while (true) {
        const item = await ask(`  ${c.yellow}• Punto ${itemIndex}:${c.reset} `);
        const trimmed = item.trim();
        if (!trimmed) {
            if (items.length === 0) {
                items.push(title);
            }
            break;
        }
        items.push(trimmed);
        itemIndex++;
    }

    // 5. Mensaje de commit
    const defaultCommitMsg = `release: v${newVersion} - ${title}`;
    let commitMsg = await ask(`\n${c.bright}Mensaje para el commit de Git${c.reset} [Por defecto: ${c.green}"${defaultCommitMsg}"${c.reset}]: `);
    commitMsg = commitMsg.trim() || defaultCommitMsg;

    // Resumen de acciones
    console.log(`\n${c.magenta}${c.bright}--- RESUMEN DE CAMBIOS A APLICAR ---${c.reset}`);
    console.log(`  ${c.cyan}Versión:${c.reset}       ${currentVersion} ➔ ${c.green}${newVersion}${c.reset}`);
    console.log(`  ${c.cyan}Título Modal:${c.reset}  🚀 Novedades v${newVersion} — ${title}`);
    console.log(`  ${c.cyan}Puntos (${items.length}):${c.reset}`);
    items.forEach(it => console.log(`    - ${it}`));
    console.log(`  ${c.cyan}Git Commit:${c.reset}    "${commitMsg}"`);
    console.log(`  ${c.cyan}Git Push:${c.reset}      origin/main\n`);

    const confirm = await ask(`${c.bright}¿Deseas aplicar estos cambios y hacer Push ahora? (S/n):${c.reset} `);
    if (confirm.trim().toLowerCase() === 'n') {
        console.log(`\n${c.yellow}Operación cancelada por el usuario. No se modificó ningún archivo.${c.reset}\n`);
        rl.close();
        return;
    }

    // 6. Aplicar cambios en index.html
    console.log(`\n${c.cyan}Modificando index.html...${c.reset}`);

    // a) Header badge
    html = html.replace(
        /(style="background:\s*var\(--primary\);\s*color:\s*white;\s*padding:\s*0\.15rem\s*0\.5rem;\s*font-weight:\s*bold;\s*-webkit-text-fill-color:\s*white;">)[^<]+(<\/span>)/i,
        `$1${newVersion}$2`
    );

    // b) Modal title
    html = html.replace(
        /(<div class="card-title-text">\s*🚀\s*Novedades de la Versi[óo]n\s+)[^<]+(<\/div>)/i,
        `$1${newVersion}$2`
    );

    // c) Construir el nuevo bloque HTML para el modal de novedades
    const colorBorder = '#10b981'; // Verde esmeralda moderno
    const bgBadge = 'rgba(16, 185, 129, 0.08)';

    const listHtml = items.map(it => {
        let strongPart = '';
        let restPart = it;
        if (it.includes(':')) {
            const splitIdx = it.indexOf(':');
            strongPart = it.substring(0, splitIdx + 1);
            restPart = it.substring(splitIdx + 1);
        } else if (it.includes('—')) {
            const splitIdx = it.indexOf('—');
            strongPart = it.substring(0, splitIdx + 1);
            restPart = it.substring(splitIdx + 1);
        }
        if (strongPart) {
            return `                            <li><strong>${strongPart}</strong>${restPart}</li>`;
        }
        return `                            <li>${it}</li>`;
    }).join('\n');

    const newLiBlock = `                    <li
                        style="border-left: 3px solid ${colorBorder}; padding-left: 0.5rem; background: ${bgBadge}; border-radius: 0 4px 4px 0; padding-top: 0.35rem; padding-bottom: 0.35rem;">
                        <strong>🚀 Novedades v${newVersion} — ${title}:</strong>
                        <ul
                            style="margin-top: 0.35rem; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.3rem;">
${listHtml}
                        </ul>
                    </li>\n`;

    // Insertar al inicio de la lista de novedades del modal
    const changelogListMarker = /(<div id="changelogModal"[\s\S]*?<ul[^>]*>)/i;
    if (changelogListMarker.test(html)) {
        html = html.replace(changelogListMarker, `$1\n${newLiBlock}`);
    } else {
        console.warn(`${c.yellow}⚠️ No se encontró la lista del modal #changelogModal. Se continuará con los demás cambios.${c.reset}`);
    }

    // d) Actualizar cache-busting en scripts: ?v=currentVersion -> ?v=newVersion
    html = html.replace(/(src="[^"]+?\?v=)[0-9a-zA-Z\.\-]+(")/g, `$1${newVersion}$2`);

    // Guardar index.html
    fs.writeFileSync(INDEX_PATH, html, 'utf8');
    console.log(`${c.green}✓ index.html actualizado con la versión ${newVersion}.${c.reset}`);

    // 7. Ejecutar Git
    try {
        console.log(`\n${c.cyan}Ejecutando Git Add...${c.reset}`);
        execSync('git add .', { cwd: ROOT_DIR, stdio: 'inherit' });

        console.log(`\n${c.cyan}Ejecutando Git Commit...${c.reset}`);
        execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: ROOT_DIR, stdio: 'inherit' });

        console.log(`\n${c.cyan}Ejecutando Git Push a origin/main...${c.reset}`);
        execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'inherit' });

        console.log(`\n${c.green}${c.bright}================================================================${c.reset}`);
        console.log(`${c.green}${c.bright}  🎉 ¡VERSIÓN ${newVersion} PUBLICADA Y SUBIDA A GITHUB CON ÉXITO! ${c.reset}`);
        console.log(`${c.green}${c.bright}================================================================${c.reset}\n`);
    } catch (err) {
        console.error(`\n${c.red}❌ Error durante la ejecución de Git:${c.reset}`, err.message);
        console.log(`${c.yellow}Los cambios en index.html ya fueron guardados. Puedes ejecutar git commit / push manualmente.${c.reset}`);
    }

    rl.close();
}

main().catch(err => {
    console.error(`\n${c.red}Error inesperado:${c.reset}`, err);
    rl.close();
});

