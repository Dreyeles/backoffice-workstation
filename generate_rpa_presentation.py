import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette - Executive Modern Tech
    COLOR_BG_DARK = RGBColor(15, 23, 42)      # Deep Slate #0f172a
    COLOR_CARD_DARK = RGBColor(30, 41, 59)    # Slate Card #1e293b
    COLOR_CARD_BORDER = RGBColor(51, 65, 85)  # Border #334155
    COLOR_PRIMARY = RGBColor(14, 165, 233)    # Bright Cyan #0ea5e9
    COLOR_ACCENT = RGBColor(99, 102, 241)     # Indigo #6366f1
    COLOR_SUCCESS = RGBColor(34, 197, 94)     # Emerald #22c55e
    COLOR_TEXT_MAIN = RGBColor(248, 250, 252) # White-slate #f8fafc
    COLOR_TEXT_MUTED = RGBColor(148, 163, 184)# Gray-blue #94a3b8
    COLOR_TEXT_DARK = RGBColor(15, 23, 42)
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_LIGHT_BG = RGBColor(241, 245, 249) # Light Slate
    COLOR_CARD_LIGHT = RGBColor(255, 255, 255)
    COLOR_BORDER_LIGHT = RGBColor(226, 232, 240)

    blank_layout = prs.slide_layouts[6]

    def set_bg_dark(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG_DARK
        bg.line.fill.background()
        return bg

    def set_bg_light(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_LIGHT_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="PROPUESTA DE AUTOMATIZACIÓN RPA • HITSS", is_dark=False):
        # Category / Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_PRIMARY if is_dark else RGBColor(2, 132, 199)
        
        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_MAIN if is_dark else COLOR_TEXT_DARK

    def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.5)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: PORTADA (Cover Slide)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg_dark(s1)

    # Accent decorative bar
    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(1.2), Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = COLOR_PRIMARY
    bar.line.fill.background()

    # Badge HITSS
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.2), Inches(3.2), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = COLOR_CARD_DARK
    badge.line.color.rgb = COLOR_PRIMARY
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = "PROYECTO DE INNOVACIÓN Y RPA"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_PRIMARY

    # Title
    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(2.8), Inches(11.5), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "Automatización Inteligente de Flujo Word & Correo"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TEXT_MAIN

    p2 = tf.add_paragraph()
    p2.text = "Optimización operativa mediante RPA: generación automática de documentos HITSS y despacho instantáneo por correo."
    p2.font.size = Pt(18)
    p2.font.color.rgb = COLOR_TEXT_MUTED
    p2.space_before = Pt(14)

    # Info card footer
    info_card = add_card(s1, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.2), COLOR_CARD_DARK, COLOR_CARD_BORDER)
    itbox = s1.shapes.add_textbox(Inches(1.1), Inches(5.65), Inches(11.1), Inches(0.9))
    itf = itbox.text_frame
    itf.word_wrap = True
    ip = itf.paragraphs[0]
    ip.text = "🎯 Objetivo Ejecutivo: "
    ip.font.bold = True
    ip.font.size = Pt(14)
    ip.font.color.rgb = COLOR_PRIMARY
    run = ip.add_run()
    run.text = "Eliminar el 100% de la carga manual en la edición de documentos y despacho de correos, reduciendo tiempos de 20 minutos a menos de 5 segundos con cero margen de error."
    run.font.bold = False
    run.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 2: DIAGNÓSTICO ACTUAL (El Problema)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg_light(s2)
    add_header(s2, "Situación Actual vs. Retos Operativos")

    # Subtitle description
    sub_box = s2.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.7), Inches(0.5))
    stf = sub_box.text_frame
    sp = stf.paragraphs[0]
    sp.text = "El proceso manual actual genera fricción operativa, consumo innecesario de horas-hombre y riesgo de errores."
    sp.font.size = Pt(14)
    sp.font.color.rgb = RGBColor(100, 116, 139)

    cards_data = [
        {
            "num": "01",
            "title": "Llenado Manual de Word",
            "desc": "El colaborador debe abrir la plantilla, buscar campos, transcribir información y ajustar tablas a mano.",
            "impact": "⚠️ 15 a 25 min por documento"
        },
        {
            "num": "02",
            "title": "Riesgo de Errores Tipográficos",
            "desc": "Copia manual de datos (nombres, importes, fechas) propenso a inconsistencias o errores de formato.",
            "impact": "⚠️ Retrabajo y fallas de calidad"
        },
        {
            "num": "03",
            "title": "Despacho Manual de Correo",
            "desc": "Redactar el correo individualmente, adjuntar el archivo correcto y verificar destinatarios uno a uno.",
            "impact": "⚠️ Demoras y falta de trazabilidad"
        }
    ]

    for i, item in enumerate(cards_data):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(2.3)
        c_width = Inches(3.7)
        c_height = Inches(4.5)

        add_card(s2, c_left, c_top, c_width, c_height, COLOR_CARD_LIGHT, COLOR_BORDER_LIGHT)

        # Number circle badge
        badge_shape = s2.shapes.add_shape(MSO_SHAPE.OVAL, c_left + Inches(0.3), c_top + Inches(0.3), Inches(0.6), Inches(0.6))
        badge_shape.fill.solid()
        badge_shape.fill.fore_color.rgb = RGBColor(239, 68, 68) # Red alert
        badge_shape.line.fill.background()
        btf = badge_shape.text_frame
        bp = btf.paragraphs[0]
        bp.alignment = PP_ALIGN.CENTER
        bp.text = item["num"]
        bp.font.size = Pt(12)
        bp.font.bold = True
        bp.font.color.rgb = COLOR_WHITE

        # Card Title
        tbox_c = s2.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(1.1), Inches(3.1), Inches(0.8))
        ctf = tbox_c.text_frame
        ctf.word_wrap = True
        cp = ctf.paragraphs[0]
        cp.text = item["title"]
        cp.font.size = Pt(17)
        cp.font.bold = True
        cp.font.color.rgb = COLOR_TEXT_DARK

        # Card Desc
        dbox_c = s2.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(1.9), Inches(3.1), Inches(1.5))
        dtf = dbox_c.text_frame
        dtf.word_wrap = True
        dp = dtf.paragraphs[0]
        dp.text = item["desc"]
        dp.font.size = Pt(13)
        dp.font.color.rgb = RGBColor(71, 85, 105)

        # Impact pill
        imp_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left + Inches(0.3), c_top + Inches(3.6), Inches(3.1), Inches(0.55))
        imp_box.fill.solid()
        imp_box.fill.fore_color.rgb = RGBColor(254, 242, 242)
        imp_box.line.color.rgb = RGBColor(254, 202, 202)
        itf = imp_box.text_frame
        itfp = itf.paragraphs[0]
        itfp.alignment = PP_ALIGN.CENTER
        itfp.text = item["impact"]
        itfp.font.size = Pt(11)
        itfp.font.bold = True
        itfp.font.color.rgb = RGBColor(185, 28, 28)

    # ==========================================
    # SLIDE 3: LA SOLUCIÓN PROPUESTA (Flujo RPA)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg_light(s3)
    add_header(s3, "La Solución: Flujo de Automatización Extremo a Extremo")

    sub_box = s3.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(0.5))
    stf = sub_box.text_frame
    sp = stf.paragraphs[0]
    sp.text = "Un bot RPA que orquesta todo el proceso en 3 etapas automáticas, sin intervención manual."
    sp.font.size = Pt(14)
    sp.font.color.rgb = RGBColor(100, 116, 139)

    steps_data = [
        {
            "step": "PASO 1",
            "title": "Entrada de Datos",
            "color": RGBColor(14, 165, 233),
            "points": [
                "Los datos se leen directamente desde un Excel, Formulario Web o Backoffice.",
                "Validación automática de campos obligatorios.",
                "Preparación de variables sin tecleo manual."
            ]
        },
        {
            "step": "PASO 2",
            "title": "Generación del Word",
            "color": RGBColor(99, 102, 241),
            "points": [
                "Uso de plantilla oficial .docx de HITSS.",
                "Inyección dinámica de textos, tablas, fechas y montos.",
                "Conserva formato, tipografías y logos exactos.",
                "Guardado estructurado con nombre estándar."
            ]
        },
        {
            "step": "PASO 3",
            "title": "Despacho por Correo",
            "color": RGBColor(34, 197, 94),
            "points": [
                "Integración con Outlook / Office 365.",
                "Cuerpo y asunto del correo personalizados.",
                "Adjunta el Word (o PDF) generado al instante.",
                "Envío y registro de confirmación (Log)."
            ]
        }
    ]

    for i, step in enumerate(steps_data):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(2.2)
        c_width = Inches(3.7)
        c_height = Inches(4.7)

        add_card(s3, c_left, c_top, c_width, c_height, COLOR_CARD_LIGHT, COLOR_BORDER_LIGHT)

        # Top tag banner
        tag_box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left + Inches(0.3), c_top + Inches(0.3), Inches(1.2), Inches(0.35))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = step["color"]
        tag_box.line.fill.background()
        ttf = tag_box.text_frame
        tp = ttf.paragraphs[0]
        tp.alignment = PP_ALIGN.CENTER
        tp.text = step["step"]
        tp.font.size = Pt(10)
        tp.font.bold = True
        tp.font.color.rgb = COLOR_WHITE

        # Step Title
        tbox = s3.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.8), Inches(3.1), Inches(0.6))
        tf = tbox.text_frame
        p = tf.paragraphs[0]
        p.text = step["title"]
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_DARK

        # Bullets
        bbox = s3.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(1.5), Inches(3.1), Inches(3.0))
        btf = bbox.text_frame
        btf.word_wrap = True
        for pt_idx, pt_text in enumerate(step["points"]):
            bp = btf.add_paragraph() if pt_idx > 0 else btf.paragraphs[0]
            bp.text = f"• {pt_text}"
            bp.font.size = Pt(12)
            bp.font.color.rgb = RGBColor(71, 85, 105)
            bp.space_after = Pt(8)

    # ==========================================
    # SLIDE 4: ARQUITECTURA TÉCNICA E INTEGRACIÓN
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg_dark(s4)
    add_header(s4, "¿Cómo se Integra Técnicamente en HITSS?", is_dark=True)

    # Left Card: Componentes
    left_card = add_card(s4, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0), COLOR_CARD_DARK, COLOR_CARD_BORDER)
    lbox = s4.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.1), Inches(4.6))
    ltf = lbox.text_frame
    ltf.word_wrap = True

    p = ltf.paragraphs[0]
    p.text = "🔧 Componentes de la Solución"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_PRIMARY

    components = [
        ("Motor RPA (Python)", "Script ligero y modular que orquesta la lectura, procesamiento y despacho sin requerir licencias costosas."),
        ("Librería de Plantillas (docxtpl / python-docx)", "Mantiene intacto el diseño institucional de HITSS, reemplazando únicamente las etiquetas deseadas."),
        ("Conector de Correo (Outlook / MAPI / SMTP)", "Usa la cuenta institucional para despachar el correo de forma transparente y segura."),
        ("Almacenamiento y Logs", "Guarda copias organizadas por fecha/cliente y genera bitácora de auditoría.")
    ]

    for title, desc in components:
        cp1 = ltf.add_paragraph()
        cp1.text = f"✔ {title}"
        cp1.font.bold = True
        cp1.font.size = Pt(13)
        cp1.font.color.rgb = COLOR_TEXT_MAIN
        cp1.space_before = Pt(8)

        cp2 = ltf.add_paragraph()
        cp2.text = desc
        cp2.font.size = Pt(11)
        cp2.font.color.rgb = COLOR_TEXT_MUTED

    # Right Card: Métodos de Ejecución
    right_card = add_card(s4, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0), COLOR_CARD_DARK, COLOR_CARD_BORDER)
    rbox = s4.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.6))
    rtf = rbox.text_frame
    rtf.word_wrap = True

    p = rtf.paragraphs[0]
    p.text = "⚡ Opciones de Despliegue para el Usuario"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT

    options = [
        ("Opción 1: 1-Clic desde el Backoffice / Web", "El usuario llena o revisa datos en la web y presiona 'Generar y Enviar'. El RPA hace el resto al instante."),
        ("Opción 2: Monitoreo Automático de Carpeta / Excel", "El usuario solo guarda una fila en un Excel o un archivo en una carpeta, y el bot se dispara automáticamente."),
        ("Opción 3: Ejecución Programada (Batch)", "El bot procesa una lista masiva de 50 o 100 documentos en lote a una hora programada del día.")
    ]

    for title, desc in options:
        op1 = rtf.add_paragraph()
        op1.text = f"📌 {title}"
        op1.font.bold = True
        op1.font.size = Pt(13)
        op1.font.color.rgb = COLOR_TEXT_MAIN
        op1.space_before = Pt(12)

        op2 = rtf.add_paragraph()
        op2.text = desc
        op2.font.size = Pt(11)
        op2.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 5: BENEFICIOS Y ROI (Métricas Clave)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg_light(s5)
    add_header(s5, "Impacto de Negocio y Beneficios Esperados (ROI)")

    metrics_data = [
        {"metric": "98%", "label": "Reducción de Tiempo", "sub": "De 20 minutos manuales a menos de 5 segundos por documento.", "color": RGBColor(14, 165, 233)},
        {"metric": "0%", "label": "Margen de Error", "sub": "Cero errores tipográficos, omisiones de campos o fallas de formato.", "color": RGBColor(34, 197, 94)},
        {"metric": "100%", "label": "Trazabilidad Total", "sub": "Registro y confirmación de cada archivo generado y correo enviado.", "color": RGBColor(99, 102, 241)},
        {"metric": "$0", "label": "Costo de Licencias", "sub": "Desarrollado con tecnologías estándar de Python e integraciones directas.", "color": RGBColor(245, 158, 11)}
    ]

    for i, m in enumerate(metrics_data):
        c_left = Inches(0.8 + i * 3.0)
        c_top = Inches(1.8)
        c_width = Inches(2.7)
        c_height = Inches(2.5)

        add_card(s5, c_left, c_top, c_width, c_height, COLOR_CARD_LIGHT, COLOR_BORDER_LIGHT)

        mbox = s5.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.2), Inches(2.3), Inches(0.9))
        mtf = mbox.text_frame
        mp = mtf.paragraphs[0]
        mp.text = m["metric"]
        mp.font.size = Pt(36)
        mp.font.bold = True
        mp.font.color.rgb = m["color"]

        lbox = s5.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(1.0), Inches(2.3), Inches(1.4))
        ltf = lbox.text_frame
        ltf.word_wrap = True
        lp = ltf.paragraphs[0]
        lp.text = m["label"]
        lp.font.size = Pt(14)
        lp.font.bold = True
        lp.font.color.rgb = COLOR_TEXT_DARK

        lp2 = ltf.add_paragraph()
        lp2.text = m["sub"]
        lp2.font.size = Pt(11)
        lp2.font.color.rgb = RGBColor(100, 116, 139)
        lp2.space_before = Pt(4)

    # Comparative Table / Highlights card below
    comp_card = add_card(s5, Inches(0.8), Inches(4.6), Inches(11.7), Inches(2.3), COLOR_CARD_LIGHT, COLOR_BORDER_LIGHT)
    cbox = s5.shapes.add_textbox(Inches(1.1), Inches(4.8), Inches(11.1), Inches(1.9))
    ctf = cbox.text_frame
    ctf.word_wrap = True
    
    cp = ctf.paragraphs[0]
    cp.text = "📊 Comparativa Operativa: Antes vs. Después del RPA"
    cp.font.size = Pt(15)
    cp.font.bold = True
    cp.font.color.rgb = COLOR_TEXT_DARK

    rows = [
        ("Antes (Proceso Manual):", "Dependencia de memoria humana, edición artesanal de archivos Word, riesgo de olvidar adjuntos en el correo."),
        ("Después (Con RPA):", "Proceso automatizado en 1 clic o desatendido, plantilla institucional estandarizada, envío inmediato y respaldo en nube.")
    ]
    for r_title, r_desc in rows:
        rp = ctf.add_paragraph()
        rp.text = f"• {r_title} "
        rp.font.bold = True
        rp.font.size = Pt(12)
        rp.font.color.rgb = RGBColor(239, 68, 68) if "Antes" in r_title else RGBColor(22, 163, 74)
        r_run = rp.add_run()
        r_run.text = r_desc
        r_run.font.bold = False
        r_run.font.color.rgb = COLOR_TEXT_DARK
        rp.space_before = Pt(4)

    # ==========================================
    # SLIDE 6: PLAN DE IMPLEMENTACIÓN (Roadmap)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg_light(s6)
    add_header(s6, "Plan de Trabajo y Tiempos de Implementación")

    phases = [
        {
            "phase": "Fase 1",
            "time": "1 - 2 Días",
            "title": "Levantamiento y Plantilla",
            "tasks": [
                "Definición de campos dinámicos.",
                "Estandarización de la plantilla .docx de HITSS.",
                "Identificación de destinatarios y formato de correo."
            ]
        },
        {
            "phase": "Fase 2",
            "time": "3 - 4 Días",
            "title": "Desarrollo y Conexión RPA",
            "tasks": [
                "Programación del motor de inyección en Word.",
                "Configuración del conector de correo (Outlook/SMTP).",
                "Pruebas unitarias de calidad y casos borde."
            ]
        },
        {
            "phase": "Fase 3",
            "time": "1 - 2 Días",
            "title": "Prueba Piloto y Salida a Producción",
            "tasks": [
                "Demo con el equipo y validación del jefe.",
                "Ajustes finales de estilo y feedback.",
                "Puesta en marcha y documentación de uso."
            ]
        }
    ]

    for i, ph in enumerate(phases):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(2.0)
        c_width = Inches(3.7)
        c_height = Inches(4.8)

        add_card(s6, c_left, c_top, c_width, c_height, COLOR_CARD_LIGHT, COLOR_BORDER_LIGHT)

        # Header Pill
        ph_pill = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left + Inches(0.3), c_top + Inches(0.3), Inches(3.1), Inches(0.5))
        ph_pill.fill.solid()
        ph_pill.fill.fore_color.rgb = RGBColor(241, 245, 249)
        ph_pill.line.color.rgb = COLOR_BORDER_LIGHT
        ptf = ph_pill.text_frame
        pp = ptf.paragraphs[0]
        pp.alignment = PP_ALIGN.CENTER
        pp.text = f"{ph['phase']} • {ph['time']}"
        pp.font.size = Pt(11)
        pp.font.bold = True
        pp.font.color.rgb = COLOR_PRIMARY

        # Phase Title
        tbox = s6.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.9), Inches(3.1), Inches(0.8))
        tf = tbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = ph["title"]
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_DARK

        # Tasks
        task_box = s6.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(1.8), Inches(3.1), Inches(2.8))
        ttf = task_box.text_frame
        ttf.word_wrap = True
        for t_idx, task in enumerate(ph["tasks"]):
            tp = ttf.add_paragraph() if t_idx > 0 else ttf.paragraphs[0]
            tp.text = f"✔ {task}"
            tp.font.size = Pt(12)
            tp.font.color.rgb = RGBColor(71, 85, 105)
            tp.space_after = Pt(8)

    # ==========================================
    # SLIDE 7: PRÓXIMOS PASOS & CIERRE (Call to Action)
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg_dark(s7)
    add_header(s7, "Propuesta de Próximos Pasos (PoC / Demo Rápido)", is_dark=True)

    cta_card = add_card(s7, Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.8), COLOR_CARD_DARK, COLOR_CARD_BORDER)
    cbox = s7.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(10.9), Inches(4.2))
    ctf = cbox.text_frame
    ctf.word_wrap = True

    p = ctf.paragraphs[0]
    p.text = "🚀 ¿Cómo podemos iniciar hoy mismo?"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_PRIMARY

    steps = [
        ("Paso 1: Probar una Prueba de Concepto (PoC)", "Podemos preparar un demo funcional con la plantilla Word real de HITSS en menos de 48 horas."),
        ("Paso 2: Validación con el usuario final", "Revisar que los datos y el correo cumplan con los estándares requeridos por la jefatura."),
        ("Paso 3: Despliegue productivo", "Integrarlo en la rutina diaria para empezar a ahorrar tiempo de inmediato.")
    ]

    for title, desc in steps:
        sp1 = ctf.add_paragraph()
        sp1.text = title
        sp1.font.bold = True
        sp1.font.size = Pt(15)
        sp1.font.color.rgb = COLOR_TEXT_MAIN
        sp1.space_before = Pt(14)

        sp2 = ctf.add_paragraph()
        sp2.text = desc
        sp2.font.size = Pt(12)
        sp2.font.color.rgb = COLOR_TEXT_MUTED

    # Bottom Contact/Q&A note
    qp = ctf.add_paragraph()
    qp.text = "💬 ¿Preguntas o comentarios? ¡Muchas gracias!"
    qp.font.bold = True
    qp.font.size = Pt(16)
    qp.font.color.rgb = COLOR_SUCCESS
    qp.space_before = Pt(22)

    # Save
    output_path = r"c:\Users\User\Desktop\backoffice\Automatizacion_RPA_HITSS.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully at: {output_path}")

if __name__ == "__main__":
    build_presentation()
