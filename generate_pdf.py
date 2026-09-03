import os
import re
import json
import subprocess

# 1. Read dataset.js
with open('dataset.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Execute JS object extraction via node to ensure exact JS parsing
node_script = """
const fs = require('fs');
let code = fs.readFileSync('dataset.js', 'utf8');
code = code.replace(/const\\s+/g, 'global.');
eval(code);
console.log(JSON.stringify({ dataset: global.BO_DATASET, equipos: global.equiposClaro }));
"""

with open('scratch_extract.js', 'w', encoding='utf-8') as f:
    f.write(node_script)

result = subprocess.run(['node', 'scratch_extract.js'], capture_output=True, text=True, encoding='utf-8')
if result.returncode != 0:
    print("Node eval error:", result.stderr)
    exit(1)

extracted = json.loads(result.stdout)
BO_DATASET = extracted['dataset']
equiposClaro = extracted.get('equipos', [])

# Remove scratch
if os.path.exists('scratch_extract.js'):
    os.remove('scratch_extract.js')

problems = BO_DATASET.get('problemsByService', {})
categories = BO_DATASET.get('siacCategories', [])
solutions = BO_DATASET.get('solutions', [])
quick_descartes = BO_DATASET.get('quickDescartes', [])
hashtags = BO_DATASET.get('hashtags', [])

# Build HTML with rich styling and deep focus on Comboboxes & Categorías de Cierre
html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Matriz Operativa y de Tipificación - BackOffice WorkStation</title>
    <style>
        @page {{
            size: A4;
            margin: 12mm 10mm 12mm 10mm;
            @bottom-right {{
                content: "Página " counter(page);
                font-size: 8pt;
                color: #64748b;
            }}
        }}
        
        * {{
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 8.5pt;
            line-height: 1.4;
        }}

        /* Header / Hero */
        .doc-header {{
            border-bottom: 3px solid #dc2626;
            padding-bottom: 10px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }}

        .doc-header .title-area h1 {{
            margin: 0;
            font-size: 16pt;
            color: #0f172a;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }}

        .doc-header .title-area h2 {{
            margin: 2px 0 0 0;
            font-size: 9.5pt;
            color: #dc2626;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}

        .meta-area {{
            text-align: right;
            font-size: 7.5pt;
            color: #64748b;
            line-height: 1.35;
        }}

        /* Summary Stats Cards */
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 16px;
        }}

        .stat-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
        }}

        .stat-val {{
            font-size: 14pt;
            font-weight: 800;
            color: #0284c7;
        }}

        .stat-label {{
            font-size: 7.5pt;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
        }}

        /* Section Headings */
        .section-title {{
            background: #0f172a;
            color: #ffffff;
            font-size: 9.5pt;
            font-weight: 800;
            padding: 5px 10px;
            border-radius: 4px;
            margin-top: 16px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            page-break-after: avoid;
        }}

        .section-desc {{
            font-size: 8pt;
            color: #475569;
            margin-bottom: 8px;
            line-height: 1.35;
        }}

        /* Tables */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 8pt;
        }}

        th {{
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            font-size: 7.5pt;
            text-transform: uppercase;
        }}

        td {{
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }}

        tr:nth-child(even) {{
            background-color: #f8fafc;
        }}

        /* Badges */
        .badge {{
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: 700;
            display: inline-block;
            text-transform: uppercase;
            white-space: nowrap;
        }}

        .badge-blue {{ background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }}
        .badge-purple {{ background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }}
        .badge-green {{ background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }}
        .badge-amber {{ background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }}
        .badge-red {{ background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }}
        .badge-slate {{ background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }}
        .badge-indigo {{ background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }}

        /* Category Card */
        .cat-card {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #0284c7;
            border-radius: 4px;
            padding: 8px 10px;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }}

        .cat-card.procedente {{
            border-left-color: #16a34a;
        }}

        .cat-card.no-procedente {{
            border-left-color: #dc2626;
        }}

        .cat-card.en-tramite {{
            border-left-color: #d97706;
        }}

        .cat-header {{
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
        }}

        .cat-title {{
            font-size: 9pt;
            font-weight: 800;
            color: #0f172a;
        }}

        .motivos-list {{
            margin: 4px 0 0 0;
            padding-left: 16px;
            font-size: 7.5pt;
            color: #334155;
            column-count: 2;
            column-gap: 12px;
        }}

        .motivos-list li {{
            margin-bottom: 2px;
            break-inside: avoid;
        }}

        .plantilla-box {{
            background: #f1f5f9;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            padding: 5px 8px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 7pt;
            color: #1e293b;
            white-space: pre-wrap;
            margin-top: 5px;
            line-height: 1.35;
        }}

        .page-break {{
            page-break-before: always;
        }}

        .chip-grid {{
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 2px;
        }}

        .chip {{
            background: #e2e8f0;
            color: #1e293b;
            border-radius: 3px;
            padding: 2px 5px;
            font-size: 7pt;
            font-weight: 500;
        }}

        /* Footer */
        .doc-footer {{
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            color: #94a3b8;
        }}
    </style>
</head>
<body>

    <!-- PORTADA / ENCABEZADO PRINCIPAL -->
    <div class="doc-header">
        <div class="title-area">
            <h1>Matriz Operativa & de Tipificación</h1>
            <h2>Back Office Técnica Fija · HITSS / América Móvil Perú</h2>
        </div>
        <div class="meta-area">
            <div><strong>Plataforma:</strong> WorkStation BackOffice v6.0</div>
            <div><strong>Especialidad:</strong> Comboboxes de Fallas & Categorías de Cierre</div>
            <div><strong>Actualización:</strong> Septiembre 2026</div>
        </div>
    </div>

    <!-- RESUMEN EJECUTIVO / STATS -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-val">{len(problems)}</div>
            <div class="stat-label">Servicios Analizados</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{sum(len(v) for v in problems.values())}</div>
            <div class="stat-label">Problemas Tipificados</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{len(categories)}</div>
            <div class="stat-label">Categorías SIAC / Helix</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{sum(len(c.get('motivos', [])) for c in categories)}</div>
            <div class="stat-label">Motivos de Cierre</div>
        </div>
    </div>

    <!-- SECCIÓN 1: COMBOBOX DE SERVICIOS Y VARIANTES DE PROBLEMA DETECTADO -->
    <div class="section-title">
        <span>1. Matriz de Combobox: Problemas Detectados por Servicio</span>
        <span class="badge badge-red">Combobox Principal</span>
    </div>
    <div class="section-desc">
        Detalle de todas las opciones seleccionables en el combobox de <strong>Problema Detectado</strong> organizadas por tipo de servicio técnico y su prefijo operativo:
    </div>
"""

service_badges = {
    "INTERNET": "badge-blue",
    "TELEFONIA": "badge-purple",
    "IPTV": "badge-green",
    "CABLE": "badge-amber",
    "APPS": "badge-red"
}

for srv, items in problems.items():
    badge_cls = service_badges.get(srv, "badge-slate")
    html += f"""
    <div style="margin-top: 10px; margin-bottom: 4px;">
        <span class="badge {badge_cls}" style="font-size:8pt; padding:3px 8px;">Servicio: {srv} ({len(items)} problemas)</span>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width: 8%; text-align:center;">#</th>
                <th style="width: 22%;">Código / Prefijo</th>
                <th style="width: 70%;">Problema Detectado (Texto del Combobox)</th>
            </tr>
        </thead>
        <tbody>
    """
    for idx, it in enumerate(items, 1):
        prefix_match = re.match(r'^([A-Z0-9]+)\s*-\s*(.+)$', it)
        if prefix_match:
            prefix, desc = prefix_match.groups()
        else:
            prefix, desc = srv[:3], it
        
        html += f"""
            <tr>
                <td style="text-align:center; font-weight:bold; color:#64748b;">{idx}</td>
                <td><span class="badge {badge_cls}">{prefix}</span></td>
                <td><strong>{it}</strong></td>
            </tr>
        """
    html += """
        </tbody>
    </table>
    """

html += """
    <div class="page-break"></div>

    <!-- SECCIÓN 2: DESCARTES RÁPIDOS, CICLO DE LLAMADA Y ACCIONES -->
    <div class="section-title">
        <span>2. Matriz de Descartes Técnicos & Ciclo de Llamada</span>
        <span class="badge badge-blue">Descartes Rápidos</span>
    </div>
    <div class="section-desc">
        Descartes preconfigurados de 1-clic y soluciones técnicas implementadas para agilizar el llenado de la plantilla técnica:
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 30%;">Acción / Descarte Rápido</th>
                <th style="width: 70%;">Texto Exacto Inyectado en Plantilla</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background:#fef2f2;">
                <td><span class="badge badge-red">Ciclo de Llamada (Actualizado)</span></td>
                <td><strong>CLIENTE NO CONTESTA, SE ENVIA MENSAJE POR LIVE CHAT Y SE DEJA MENSAJE EN BUZON DE VOZ, SE GENERA CICLO</strong></td>
            </tr>
"""

for sol in solutions:
    html += f"""
            <tr>
                <td><strong>{sol.get('solucion')}</strong></td>
                <td>{sol.get('tipificacion')}</td>
            </tr>
    """

for q in quick_descartes:
    if "CICLO" not in q.upper():
        html += f"""
            <tr>
                <td><span class="badge badge-slate">Descarte Rápido</span></td>
                <td>{q}</td>
            </tr>
        """

html += """
        </tbody>
    </table>

    <!-- SECCIÓN 3: MATRIZ DE CATEGORÍAS DE CIERRE SIAC / HELIX -->
    <div class="section-title">
        <span>3. Matriz Exhaustiva de Categorías de Cierre & Motivos</span>
        <span class="badge badge-green">Categorías SIAC / Helix</span>
    </div>
    <div class="section-desc">
        Mapeo completo de las categorías de cierre, estado del formulario (Procedente, No Procedente, En Trámite), estado SIAC, etiquetas y su desglose de motivos:
    </div>
"""

for cat in categories:
    title = cat.get('title', 'Sin título')
    estado_siac = cat.get('estado_siac', 'N/A')
    estado_form = cat.get('estado_form', 'N/A')
    motivos = cat.get('motivos', [])
    raw_plantilla = cat.get('raw_plantilla', '')
    hashtag = cat.get('default_hashtag', '')

    card_cls = "en-tramite"
    form_badge = "badge-amber"
    if "PROCEDENTE" in estado_form and "NO PROCEDENTE" not in estado_form:
        card_cls = "procedente"
        form_badge = "badge-green"
    elif "NO PROCEDENTE" in estado_form:
        card_cls = "no-procedente"
        form_badge = "badge-red"

    html += f"""
    <div class="cat-card {card_cls}">
        <div class="cat-header">
            <span class="cat-title">{title}</span>
            <div>
                <span class="badge {form_badge}">Form: {estado_form}</span>
                <span class="badge badge-slate">SIAC: {estado_siac}</span>
                {f'<span class="badge badge-red">{hashtag}</span>' if hashtag else ''}
            </div>
        </div>
        
        <div style="margin-top:3px;"><strong>Motivos de Cierre Mapeados ({len(motivos)}):</strong></div>
        <ul class="motivos-list">
    """
    for m in motivos:
        html += f"<li>{m}</li>"
    html += """
        </ul>
        
        <div style="margin-top: 5px;"><strong>Plantilla Estándar Asociada:</strong></div>
        <div class="plantilla-box">""" + raw_plantilla.strip() + """</div>
    </div>
    """

# Section 4: Equipos Homologados y Niveles Hygeia
html += f"""
    <div class="page-break"></div>

    <div class="section-title">
        <span>4. Parámetros Técnicos (Hygeia) & Catálogo de Hardware</span>
        <span class="badge badge-purple">Validador Técnico</span>
    </div>
    <div class="section-desc">
        Rangos de tolerancia para el validador automático de niveles y catálogo de equipos homologados por Claro:
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 25%;">Tecnología</th>
                <th style="width: 30%;">Parámetro Técnico</th>
                <th style="width: 45%;">Rango Aceptable / Umbral</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td rowspan="4"><strong>HFC (Coaxial)</strong></td>
                <td>U/S SNR (Upstream SNR)</td>
                <td>Mínimo: <strong>28.0 dB</strong></td>
            </tr>
            <tr>
                <td>D/S SNR (Downstream SNR)</td>
                <td>Mínimo: <strong>33.5 dB</strong> · <span class="badge badge-amber">Var. Bloque: Δ ≤ 4.0 dB</span><br><small style="color:#64748b;">(Diferencia Máx - Mín en el bloque no debe superar 4.0 dB)</small></td>
            </tr>
            <tr>
                <td>Potencia Downstream (Rx)</td>
                <td>Rango: <strong>-15.0 dBmV a +20.9 dBmV</strong> · <span class="badge badge-amber">Var. Bloque: Δ ≤ 4.0 dBmV</span><br><small style="color:#64748b;">(Diferencia Máx - Mín en el bloque no debe superar 4.0 dBmV)</small></td>
            </tr>
            <tr>
                <td>Potencia Upstream (Tx)</td>
                <td>Rango: <strong>+35.0 dBmV a +57.0 dBmV</strong></td>
            </tr>
            <tr>
                <td rowspan="2"><strong>FTTH (Fibra Óptica)</strong></td>
                <td>Tx Optical Power (Transmisión)</td>
                <td>Rango: <strong>+0.5 dBm a +5.0 dBm</strong></td>
            </tr>
            <tr>
                <td>Rx Optical Power (Recepción)</td>
                <td>Rango: <strong>-24.9 dBm a -6.1 dBm</strong></td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top:12px; margin-bottom:4px;"><strong>Catálogo de Equipos y Credenciales Registradas:</strong></div>
    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Código</th>
                <th style="width: 25%;">Nombre del Equipo</th>
                <th style="width: 15%;">Tecnología</th>
                <th style="width: 15%;">Estado Homologación</th>
                <th style="width: 30%;">Notas / Accesos Técnicos</th>
            </tr>
        </thead>
        <tbody>
"""

for eq in equiposClaro:
    homol = '<span class="badge badge-green">Homologado</span>' if eq.get('homologado') else '<span class="badge badge-red">No Homologado</span>'
    creds = eq.get('credenciales', '-')
    html += f"""
            <tr>
                <td><strong>{eq.get('codigo')}</strong></td>
                <td>{eq.get('nombre')}</td>
                <td>{eq.get('tipo')}</td>
                <td>{homol}</td>
                <td><small>{creds}</small></td>
            </tr>
    """

html += """
        </tbody>
    </table>

    <div class="doc-footer">
        <div>WorkStation BackOffice v6.0 · Plataforma de Soporte Técnico HITSS / Claro</div>
        <div>Generado automáticamente para auditoría, supervisión y validación operativa</div>
    </div>

</body>
</html>
"""

with open('Matriz_Tipificacion_BackOffice.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Matriz_Tipificacion_BackOffice.html generated successfully!")

# Now run headless Chrome / Edge to produce PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

browser_bin = chrome_path if os.path.exists(chrome_path) else edge_path

cmd = [
    browser_bin,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={os.path.abspath('Matriz_Tipificacion_BackOffice_HITSS.pdf')}",
    os.path.abspath('Matriz_Tipificacion_BackOffice.html')
]

print("Running command:", " ".join(cmd))
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists('Matriz_Tipificacion_BackOffice_HITSS.pdf'):
    size = os.path.getsize('Matriz_Tipificacion_BackOffice_HITSS.pdf')
    print(f"PDF successfully created: Matriz_Tipificacion_BackOffice_HITSS.pdf ({size} bytes)")
else:
    print("PDF was not created. Stderr:", res.stderr)
