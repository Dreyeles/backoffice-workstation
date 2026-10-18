/**
 * SCRIPT DE SINCRONIZACIÓN DE VERSIÓN DE SEGURIDAD (RESPALDO ANTERIOR)
 * 
 * Este script copia los archivos esenciales del proyecto a la carpeta 'version_anterior/'
 * para que siempre exista una versión funcional previa accesible desde el navegador.
 *
 * Puede ejecutarse:
 * 1. Automáticamente vía Git Hook (.git/hooks/pre-commit) con --from-head
 * 2. Manualmente con doble clic en actualizar_version_seguridad.bat con --from-current
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT_DIR, 'version_anterior');

const isFromCurrent = process.argv.includes('--from-current');
const isFromHead = process.argv.includes('--from-head') || !isFromCurrent;

function getHeadCommitSha() {
    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    } catch (e) {
        return null;
    }
}

function getHeadFile(relPath) {
    try {
        return execFileSync('git', ['show', `HEAD:${relPath.replace(/\\/g, '/')}`], { cwd: ROOT_DIR, encoding: 'utf8' });
    } catch (e) {
        // Fallback al disco si no existe en HEAD
        const full = path.join(ROOT_DIR, relPath);
        return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    }
}

function getJsFilesFromHead() {
    try {
        const out = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', 'js'], { cwd: ROOT_DIR, encoding: 'utf8' });
        return out.trim().split(/\r?\n/).filter(f => f.endsWith('.js'));
    } catch (e) {
        return getAllJsFilesDisk(path.join(ROOT_DIR, 'js'));
    }
}

function getAllJsFilesDisk(dir, base = 'js') {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const rel = path.join(base, file).replace(/\\/g, '/');
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            results = results.concat(getAllJsFilesDisk(full, rel));
        } else if (file.endsWith('.js')) {
            results.push(rel);
        }
    });
    return results;
}

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function adjustRelativePaths(content, isHtml = false) {
    if (!content) return content;
    // Ajustar referencias a img/ y manuales/ para que apunten a la raíz ../
    let adjusted = content
        .replace(/["']img\//g, (m) => m[0] + '../img/')
        .replace(/["']manuales\//g, (m) => m[0] + '../manuales/');

    if (isHtml) {
        // Inyectar banner de seguridad en la parte superior del <body>
        const safetyBanner = `
    <!-- BANNER INFORMATIVO: VERSIÓN DE SEGURIDAD (RESPALDO ANTERIOR) -->
    <div id="safetyBanner" style="background: linear-gradient(90deg, #1e3a8a, #2563eb); color: #ffffff; padding: 0.28rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.25); position: sticky; top: 0; z-index: 99999; border-bottom: 1px solid rgba(59, 130, 246, 0.4); flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span><strong>MODO RESPALDO:</strong> Estás utilizando la <em>Versión de Seguridad Anterior</em>. Todos los módulos y configuraciones funcionan de forma estable e independiente.</span>
        </div>
        <a href="../index.html" style="background: #ffffff; color: #1e40af; padding: 0.2rem 0.75rem; border-radius: 5px; text-decoration: none; font-weight: 700; font-size: 0.75rem; box-shadow: 0 1px 4px rgba(0,0,0,0.2); white-space: nowrap; transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
            Volver a Versión Principal
        </a>
    </div>
`;
        if (adjusted.includes('<body') && !adjusted.includes('id="safetyBanner"')) {
            adjusted = adjusted.replace(/<body[^>]*>/i, (match) => match + '\n' + safetyBanner);
        }

        // Si tiene la caja y botón de cambiar a versión anterior en el modal, ajustarlo para volver a la principal
        adjusted = adjusted.replace(
            /<a[^>]*id="btnVersionSeguridad"[^>]*>[\s\S]*?<\/a>/i,
            `<a href="../index.html" id="btnVersionSeguridad" class="btn btn-sm" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; font-weight: 700; text-decoration: none; padding: 0.45rem 1rem; border-radius: 6px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35); display: inline-flex; align-items: center; gap: 0.4rem; border: none; white-space: nowrap; transition: transform 0.15s ease;" title="⚡ Volver a la versión principal más reciente" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                ⚡ Volver a Versión Principal
            </a>`
        );
        adjusted = adjusted.replace(
            /🛡️ Versión de Seguridad[^\n<]*/g,
            '⚡ Versión Principal (Más Reciente)'
        );
        adjusted = adjusted.replace(
            'background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.4);',
            'background: rgba(59, 130, 246, 0.08); border: 1px dashed rgba(59, 130, 246, 0.4);'
        );
        adjusted = adjusted.replace(
            'color: #f59e0b; font-size: 0.88rem;',
            'color: #3b82f6; font-size: 0.88rem;'
        );
        adjusted = adjusted.replace(
            'color: #3b82f6; font-size: 0.88rem;',
            'color: #2563eb; font-size: 0.88rem;'
        );
        adjusted = adjusted.replace(
            /¿Presentas fallos imprevistos con esta versión\?[^\n<]*/g,
            '¿Deseas regresar a la versión principal más reciente con todas las actualizaciones?'
        );
        adjusted = adjusted.replace(
            /¿Click aqui para accedder a la version anterior\?[^\n<]*/g,
            '¿Deseas regresar a la versión principal más reciente con todas las actualizaciones?'
        );
        adjusted = adjusted.replace(
            /¿Experimentas algún fallo o necesitas urgentemente la versión previa probada\?[^\n<]*/g,
            '¿Deseas regresar a la versión principal más reciente con todas las actualizaciones?'
        );
    }

    return adjusted;
}

function run() {
    console.log(`[Version Seguridad] Iniciando sincronización (${isFromHead ? 'desde HEAD git' : 'desde archivos locales'})...`);

    const headSha = getHeadCommitSha();
    if (isFromHead && !headSha) {
        console.log('[Version Seguridad] No se encontró commit HEAD previo. Omitiendo.');
        return;
    }

    // Lista de archivos a sincronizar
    const rootFiles = ['index.html', 'styles.css', 'app.js', 'dataset.js'];
    const jsFiles = isFromHead ? getJsFilesFromHead() : getAllJsFilesDisk(path.join(ROOT_DIR, 'js'));

    const allFiles = [...rootFiles, ...jsFiles];

    let copiedCount = 0;
    allFiles.forEach(relPath => {
        let content;
        if (isFromHead) {
            content = getHeadFile(relPath);
        } else {
            const fullPath = path.join(ROOT_DIR, relPath);
            content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
        }

        if (content === null || content === undefined) return;

        const isHtml = relPath === 'index.html';
        const isJs = relPath.endsWith('.js');
        let finalContent = content;

        if (isHtml || isJs) {
            finalContent = adjustRelativePaths(content, isHtml);
        }

        const targetFile = path.join(TARGET_DIR, relPath);
        ensureDir(targetFile);
        fs.writeFileSync(targetFile, finalContent, 'utf8');
        copiedCount++;
    });

    // Guardar metadata de versión
    const meta = {
        fechaSincronizacion: new Date().toISOString(),
        origen: isFromHead ? `git commit HEAD (${headSha ? headSha.slice(0, 7) : 'desconocido'})` : 'archivos de trabajo locales',
        archivosCopiados: copiedCount
    };
    fs.writeFileSync(path.join(TARGET_DIR, 'version_meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    console.log(`[Version Seguridad] ✅ Sincronizados con éxito ${copiedCount} archivos en ${TARGET_DIR}`);
}

run();
