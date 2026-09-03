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

# Build HTML
html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Matriz Operativa y de Tipificación - WorkStation BackOffice</title>
    <style>
        @page {{
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
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
            font-size: 9.5pt;
            line-height: 1.45;
        }}

        /* Header / Hero */
        .doc-header {{
            border-bottom: 3px solid #dc2626;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }}

        .doc-header .title-area h1 {{
            margin: 0;
            font-size: 18pt;
            color: #0f172a;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }}

        .doc-header .title-area h2 {{
            margin: 3px 0 0 0;
            font-size: 10.5pt;
            color: #dc2626;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}

        .doc-header .meta-area {{
            text-align: right;
            font-size: 8pt;
            color: #64748b;
        }}

        .badge {{
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-red {{ background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }}
        .badge-blue {{ background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }}
        .badge-green {{ background: #dcfce7; color: #166534; border: 1px solid #86efac; }}
        .badge-amber {{ background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }}
        .badge-purple {{ background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }}
        .badge-slate {{ background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }}

        /* Stats bar */
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 22px;
        }}
        .stat-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
        }}
        .stat-val {{
            font-size: 15pt;
            font-weight: 800;
            color: #0f172a;
        }}
        .stat-label {{
            font-size: 7.5pt;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }}

        /* Section Headings */
        .section-title {{
            font-size: 12pt;
            font-weight: 800;
            color: #0f172a;
            border-left: 4px solid #dc2626;
            padding-left: 8px;
            margin: 22px 0 10px 0;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}

        .section-desc {{
            font-size: 8.5pt;
            color: #475569;
            margin-bottom: 12px;
        }}

        /* Tables */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 8.5pt;
        }}

        th {{
            background: #0f172a;
            color: #ffffff;
            text-align: left;
            padding: 6px 9px;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }}

        td {{
            padding: 5px 9px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }}

        tr:nth-child(even) td {{
            background: #f8fafc;
        }}

        .service-badge {{
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            display: inline-block;
        }}

        /* Category Card Grid */
        .cat-card {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #0284c7;
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 12px;
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
            margin-bottom: 6px;
        }}

        .cat-title {{
            font-size: 10pt;
            font-weight: 800;
            color: #0f172a;
        }}

        .motivos-list {{
            margin: 6px 0 0 0;
            padding-left: 18px;
            font-size: 8pt;
            color: #334155;
            column-count: 2;
            column-gap: 15px;
        }}

        .motivos-list li {{
            margin-bottom: 3px;
            break-inside: avoid;
        }}

        .plantilla-box {{
            background: #f1f5f9;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            padding: 6px 9px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 7.5pt;
            color: #1e293b;
            white-space: pre-wrap;
            margin-top: 6px;
        }}

        .page-break {{
            page-break-before: always;
        }}

        .chip-grid {{
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 4px;
        }}

        .chip {{
            background: #e2e8f0;
            color: #1e293b;
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 7.5pt;
            font-weight: 500;
        }}

        /* Footer */
        .doc-footer {{
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
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
            <div><strong>Documento:</strong> Especificación de Comboboxes & Variantes</div>
            <div><strong>Fecha:</strong> Septiembre 2026</div>
        </div>
    </div>

    <!-- RESUMEN EJECUTIVO / STATS -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-val">5</div>
            <div class="stat-label">Servicios Principales</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{sum(len(v) for v in problems.values())}</div>
            <div class="stat-label">Problemas / Tipificaciones</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{len(categories)}</div>
            <div class="stat-label">Categorías SIAC / Helix</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">{sum(len(c.get('motivos', [])) for c in categories)}</div>
            <div class="stat-label">Motivos de Cierre Mapeados</div>
        </div>
    </div>

    <!-- SECCIÓN 1: COMBOBOX SERVICIOS Y PROBLEMAS DETECTADOS -->
    <div class="section-title">
        <span>1. Matriz de Combobox: Servicios y Problemas Detectados</span>
        <span class="badge badge-red">Combobox Principal + Búsqueda</span>
    </div>
    <div class="section-desc">
        Relación completa de los 5 servicios integrados y los problemas técnicos asociados seleccionables en el menú desplegable principal con búsqueda en tiempo real:
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 18%;">Servicio</th>
                <th style="width: 12%;">Cant. Fallas</th>
                <th style="width: 70%;">Problemas Tipificados Disponibles (Variantes)</th>
            </tr>
        </thead>
        <tbody>
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
            <tr>
                <td><span class="badge {badge_cls}">{srv}</span></td>
                <td><strong>{len(items)}</strong> problemas</td>
                <td>
                    <div class="chip-grid">
    """
    for it in items:
        html += f'<span class="chip">{it}</span>'
    html += """
                    </div>
                </td>
            </tr>
    """

html += """
        </tbody>
    </table>

    <div class="page-break"></div>

    <!-- SECCIÓN 2: DESCARTES RÁPIDOS Y SOLUCIONES -->
    <div class="section-title">
        <span>2. Matriz de Descartes Técnicos y Acciones Rápidas</span>
        <span class="badge badge-blue">Chips Dinámicos</span>
    </div>
    <div class="section-desc">
        Descartes preconfigurados de 1-clic para inyección inmediata en el campo de descarte técnico de la plantilla:
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 35%;">Tipo de Descarte / Solución</th>
                <th style="width: 65%;">Tipificación / Detalle Técnico</th>
            </tr>
        </thead>
        <tbody>
"""

for sol in solutions:
    html += f"""
            <tr>
                <td><strong>{sol.get('solucion')}</strong></td>
                <td><span class="chip">{sol.get('tipificacion')}</span></td>
            </tr>
    """

for q in quick_descartes:
    html += f"""
            <tr>
                <td><span class="badge badge-slate">Acción Rápida</span></td>
                <td>{q}</td>
            </tr>
    """

html += """
        </tbody>
    </table>

    <!-- SECCIÓN 3: CATEGORÍAS SIAC, ESTADOS Y MOTIVOS DE CIERRE -->
    <div class="section-title">
        <span>3. Matriz de Categorías SIAC / Helix & Motivos de Cierre</span>
        <span class="badge badge-green">Motor de Cierre</span>
    </div>
    <div class="section-desc">
        Estructura de categorización de cierre de casos, estado del formulario (Procedente, No Procedente, En Trámite), estado SIAC, y sus motivos asociados:
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
        
        <div><strong>Motivos de Cierre Asociados ({len(motivos)}):</strong></div>
        <ul class="motivos-list">
    """
    for m in motivos:
        html += f"<li>{m}</li>"
    html += """
        </ul>
        
        <div style="margin-top: 6px;"><strong>Plantilla Estándar:</strong></div>
        <div class="plantilla-box">""" + raw_plantilla.strip() + """</div>
    </div>
    """

# Section 4: Equipos Homologados y Niveles
html += f"""
    <div class="page-break"></div>

    <div class="section-title">
        <span>4. Parámetros Técnicos & Equipos Homologados</span>
        <span class="badge badge-purple">Validador Hygeia</span>
    </div>
    <div class="section-desc">
        Límites operativos de niveles RF (HFC) y potencia óptica (FTTH) implementados en el validador automático:
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 25%;">Tecnología</th>
                <th style="width: 30%;">Parámetro</th>
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
                <td>Mínimo: <strong>33.5 dB</strong></td>
            </tr>
            <tr>
                <td>Potencia Downstream (Rx)</td>
                <td>Rango: <strong>-15.0 dBmV a +20.9 dBmV</strong></td>
            </tr>
            <tr>
                <td>Potencia Upstream (Tx)</td>
                <td>Rango: <strong>+35.0 dBmV a +57.0 dBmV</strong></td>
            </tr>
            <tr>
                <td><strong>FTTH (Fibra Óptica)</strong></td>
                <td>Rx Optical Power</td>
                <td>Rango Óptimo: <strong>-8.0 dBm a -27.0 dBm</strong></td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top:14px;"><strong>Equipos / Modelos Registrados:</strong></div>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Nombre del Equipo</th>
                <th>Tecnología</th>
                <th>Estado Homologación</th>
                <th>Notas / Accesos</th>
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
        <div>Generado automáticamente para auditoría y validación de matriz</div>
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
