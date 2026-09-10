// Dataset extraído de PLANTILLA BO FINAL.xlsm (Back Office Técnica HITSS)
const BO_DATASET = {
    problemsByService: {
    "INTERNET": [
        "INT - BAJA VELOCIDAD VIA CABLEADO (LENTITUD)",
        "INT - BAJA VELOCIDAD VIA WIFI (LENTITUD)",
        "INT - BAJA VELOCIDAD VIA CABLEADO Y WIFI (LENTITUD)",
        "INT - NAVEGACION LENTA EN TODAS LAS PAGINAS",
        "INT - INTERMITENCIA EN RANGOS HORARIOS CABLEADO",
        "INT - INTERMITENCIA EN RANGOS HORARIOS WIFI",
        "INT - DESCONEXIONES FRECUENTES",
        "INT - SIN SERVICIO",
        "INT - INTERNET NO FUNCIONA EN UN SOLO EQUIPO",
        "INT - COBERTURA WIFI",
        "INT - PROBLEMAS CON CONEXIONES CLARO",
        "INT - PROBLEMAS CON PAGINAS",
        "INT - REINICIOS CONSTANTES",
        "INT - NIVELES FUERA DE RANGO",
        "INT - WIFI NO LLEGA A DETERMINADAS ZONAS",
        "INT - PROBLEMAS CON WIFI 2.4 GHZ",
        "INT - PROBLEMAS CON  WIFI 5 GHZ",
        "INT - PROBLEMAS CON APLICACIONES",
        "INT - ERROR DNS",
        "INT - LATENCIA ALTA (PING ELEVADO)",
        "INT - PERDIDA DE PAQUETES",
        "INT - REPETIDOR MESH",
        "INT - PLUME DESALINEADO",
        "INT - PROBLEMAS CON PLUME",
        "INT - MODEM NO ENCIENDE",
        "INT - MODEM CON LUCES ANORMALES",
        "INT - FALLA EN PUERTOS LAN",
        "INT -  USO INADECUADO DE EQUIPOS",
        "INT - LENTITUD E INTERMITENCIA EN VIDEOJUEGOS",
        "INT - CORTES EN VIDEOLLAMADAS",
        "INT - BAJA CALIDAD DE VIDEO",
        "INT - CAMBIO DE CLAVE WIFI Y NOMBRE WIFI (SSID)",
        "INT - DISPOSITIVOS NO SE CONECTAN AL WIFI",
        "INT - LOS EN ROJO",
        "INT - INFORMACION DE USO"
    ],
    "TELEFONIA": [
        "TEL - SIN TONO",
        "TEL - NO PUEDE REALIZAR LLAMADAS",
        "TEL - NO PUEDE RECIBIR LLAMADAS",
        "TEL - RUIDO/INTERFERENCIA",
        "TEL - BOLSA DE MINUTOS DESCONFIGURADA",
        "TEL - NO PUEDE REALIZAR LLAMADAS INTERNACIONALES",
        "TEL - NO PUEDE RECIBIR LLAMADAS INTERNACIONALES",
        "TEL - INTERLOCUCION",
        "TEL - INFORMACION DE USO",
        "TEL - CONEXIONES",
        "TEL - NO REGISTRADO EN LA CBIO",
        "TEL - SERVICIO INTERMITENTE",
        "TEL - LINEA OCUPADA",
        "TEL - ECO EN LLAMADAS",
        "TEL - BAJO VOLUMEN",
        "TEL - CABLE TELEFONICO DAÑADO",
        "TEL - PROBLEMAS EN ROSETA TELEFONICA",
        "TEL - FALLA EN PUERTO TELEFONICO",
        "TEL - IDENTIFICADOR DE LLAMADAS",
        "TEL - BUZON DE VOZ",
        "TEL - PORTABILIDAD EN PROCESO",
        "TEL - SUSPENSION DEL SERVICIO"
    ],
    "IPTV": [
        "IPTV - SIN CANALES",
        "IPTV - NO VISUALIZA ALGUNOS CANALES",
        "IPTV - DESALINEADO EN SISTEMAS",
        "IPTV - PARAMETROS DESALINEADOS EN SKYWAY",
        "IPTV - RESOLUCION BAJA",
        "IPTV - SIN VOLUMEN",
        "IPTV - CONTROL DESINCRONIZADO",
        "IPTV - CONTROL REMOTO NO FUNCIONA",
        "IPTV - CALIDAD PROBLEMA CON CANALES",
        "IPTV - CANALES PIXELADOS",
        "IPTV - CANAL BLOQUEADO",
        "IPTV - PROBLEMAS FISICOS CON DECODIFICADOR",
        "IPTV - CONEXIONES/TOMACORRIENTE",
        "IPTV - HDMI DESCONFIGURADO",
        "IPTV - PANTALLA NEGRA",
        "IPTV - SERVICIO INTERMITENTE",
        "IPTV - CANALES FUERA DE LA GRILLA",
        "IPTV - DESFASE ENTRE AUDIO Y VIDEO",
        "IPTV - PANTALLA AZUL",
        "IPTV - PANTALLA VERDE",
        "IPTV - AUDIO DISTORSIONADO",
        "IPTV - AUDIO EN OTRO IDIOMA",
        "IPTV - REAPROVISIONAMIENTO DEL SERVICIO",
        "IPTV - YOUTUBE NO FUNCIONA",
        "IPTV - NETFLIX NO FUNCIONA",
        "IPTV - ERROR DE INICIO DE SESION",
        "IPTV - CANAL 2 Y 4 NO EXISTEN",
        "IPTV - RETORNA A CANAL 1",
        "IPTV - PROBLEMAS CON LA GUIA DE CANALES",
        "IPTV - SINCRONIZACION DE VOLUMEN"
    ],
    "CABLE": [
        "CABLE - PANTALLA DE CARGA",
        "CABLE - PANTALLA NEGRA",
        "CABLE - PROBLEMAS CON CONTROL REMOTO",
        "CABLE - SIN CANALES",
        "CABLE - CALIDAD PROBLEMAS CON CANALES",
        "CABLE - SIN VOLUMEN",
        "CABLE - RESOLUCION DE CANALES",
        "CABLE - CONEXIONES/TOMACORRIENTE",
        "CABLE - PROBLEMAS CON DECODIFICADOR",
        "CABLE - AV/HDMI DESCONFIGURADO",
        "CABLE - CANALES FUERA DE GRILLA",
        "CABLE - IMAGEN PIXELADA",
        "CABLE - PANTALLA AZUL",
        "CABLE - PANTALLA VERDE",
        "CABLE - DESFASE AUDIO/VIDEO",
        "CABLE - PROBLEMAS CON ADAPTADOR"
    ],
    "APPS": [
        "CLARO VIDEO - NO REGISTRADO",
        "CLARO VIDEO - NO PUEDE ACCEDER A CLARO VIDEO - DISPOSITIVO",
        "CLARO VIDEO - NO PUEDE ACCEDER A CLARO VIDEO - AMCO",
        "CLARO VIDEO - CORREO MAL ASOCIADO",
        "CLARO VIDEO - DESALINEADO EN BASE MEXICO",
        "CLARO VIDEO - DESALINEADO EN BASE PERU",
        "CLARO VIDEO - PROBLEMAS CON CORREO DEL CLIENTE",
        "CLARO VIDEO - L1 MAX NO ACTIVADO",
        "CLARO VIDEO - HBO NO ACTIVO/REGISTRADO",
        "CLARO VIDEO - TV EN VIVO:CANAL NO DISONIBLE",
        "CLARO VIDEO - PANTALLA NEGRA",
        "CLARO VIDEO - REGISTRO FALLIDO",
        "CLARO VIDEO - SUSCRIPCION NO REFLEJADA",
        "CLARO VIDEO - USUARIO O CONTRASEÑA INCORRECTOS",
        "CLARO VIDEO - OLVIDO DE CONTRASEÑA",
        "CLARO VIDEO - CUENTA BLOQUEADA",
        "CLARO VIDEO - ERROR DE INICIO DE SESION",
        "CLARO VIDEO - CORREO NO RECIBE RESTABLECIMIENTO DE CONTRASEÑA",
        "CLARO VIDEO - ERROR DE REPRODUCCION",
        "CLARO VIDEO - VIDEO NO CARGA",
        "CLARO VIDEO - CATALOGO INCOMPLETO",
        "CLARO VIDEO - CONTENIDO NO DISPONIBLE EN LA REGION",
        "CLARO VIDEO - LIMITE DE DISPOSITIVOS ALCANZADO",
        "CLARO VIDEO - DISPOSITIVO NO COMPATIBLE",
        "CLARO VIDEO - ERROR AL ACTUALIZAR APLICACION",
        "CLARO VIDEO - COBRO INCORRECTO",
        "CLARO VIDEO - BENEFICIO NO REFLEJADO",
        "SMARTHOME - NO PUEDE INICIAR SESION",
        "SMARTHOME - USUARIO NO REGISTRADO",
        "SMARTHOME - OLVIDO DE CONTRASEÑA",
        "SMARTHOME - CUENTA BLOQUEADA",
        "SMARTHOME - ERROR DE AUTENTICACION",
        "SMARTHOME - NO PUEDE DESCARGAR LA APLICACION",
        "SMARTHOME - ERROR AL INSTALAR LA APLICACION",
        "SMARTHOME - DISPOSITIVO NO COMPATIBLE",
        "SMARTHOME - NO PUEDE CAMBIAR NOMBRE WIFI",
        "SMARTHOME - NO PUEDE CAMBIAR CLAVE WIFI",
        "SMARTHOME - NO PUEDE APAGAR/ENCENDER WIFI",
        "SMARTHOME - NO VISUALIZA DISPOSITIVOS CONECTADOS",
        "SMARTHOME - NO PUEDE REINICIAR ROUTER",
        "SMARTHOME - NO FUNCIONAN LOS DESCARTES TECNICOS",
        "SMARTHOME - NO VISUALIZA LOS DECODIFICADORES",
        "SMARTHOME - NO PUEDE REINICIAR EL DECODIFICADOR",
        "SMARTHOME - NO PUEDE CAMBIAR EL NOMBRE DEL DECO",
        "SMARTHOME - NO CARGAN LOS DESCARTES DE TV",
        "SMARTHOME - GUIA DE CANALES NO DISPONIBLE",
        "SMARTHOME - CONTROL REMOTO NO DISPONIBLE",
        "SMARTHOME - NO CARGAN DESCARTES DE TELEFONIA",
        "SMARTHOME - NO VISUALIZA GUIA DE TELEFONIA",
        "SMARTHOME - NO MUESTRA CABLEADO TELEFONICO",
        "SMARTHOME - NO VISUALIZA VISITA TECNICA",
        "SMARTHOME - NO PUEDE REPROGRAMAR VISITA",
        "SMARTHOME - NO PUEDE CANCELAR VISITA",
        "SMARTHOME - TRACKING NO DISPONIBLE",
        "SMARTHOME - TECNICO NO FIGURA EN LA APLICACION",
        "SMARTHOME - SERVICIO FIGURA NO CONECTADO",
        "SMARTHOME - SERVICIO FIGURA SUSPENDIDO",
        "SMARTHOME - SERVICIO FIGURA CON AVERIA MASIVA",
        "SMARTHOME - ESTADO DEL SERVICIO NO ACTUALIZA",
        "SMARTHOME - NO PUEDE ESCANEAR SERIAL",
        "SMARTHOME - ERROR AL ESCANEAR CODIGO QR/SERIAL",
        "SMARTHOME - NO HABILITA OPCIONES DEL ROUTER",
        "SMARTHOME - SERVICIO DEGRADADO",
        "SMARTHOME - NO PUEDE CAMBIAR CLAVE WIFI DESDE APP",
        "SMARTHOME - APLICACION LENTA",
        "SMARTHOME - APLICACION SE CIERRA",
        "SMARTHOME - ERROR DE CARGA",
        "SMARTHOME - INFORMACION DESACTUALIZADA",
        "SMARTHOME - NOTIFICACIONES NO DISPONIBLES",
        "SMARTHOME - VIDEOS TUTORIALES NO CARGAN",
        "SMARTHOME - GUIA PDF NO DISPONIBLE",
        "MI CLARO WEB - NO PUEDE REGISTRARSE",
        "MI CLARO WEB - NO PUEDE INICIAR SESION",
        "MI CLARO WEB - OLVIDO DE CONTRASEÑA",
        "MI CLARO WEB - NO RECIBE CORREO DE RECUPERACION",
        "MI CLARO WEB - CUENTA BLOQUEADA",
        "MI CLARO WEB - ERROR DE AUTENTICACION",
        "MI CLARO WEB - NO RECONOCE DNI",
        "MI CLARO WEB - ERROR AL REGISTRAR CUENTA",
        "MI CLARO WEB - NO VISUALIZA SERVICIOS CONTRATADOS",
        "MI CLARO WEB - INFORMACION DESACTUALIZADA",
        "MI CLARO WEB - NO VISUALIZA DETALLE DEL PLAN",
        "MI CLARO WEB - NO MUESTRA ESTADO DEL SERVICIO",
        "MI CLARO WEB - NO VISUALIZA SALDOS",
        "MI CLARO WEB - NO VISUALIZA CONSUMOS",
        "MI CLARO WEB - NO VISUALIZA DETALLE DE CONSUMOS",
        "MI CLARO WEB - NO PUEDE DESCARGAR REPORTE",
        "MI CLARO WEB - NO PUEDE ENVIAR REPORTE POR CORREO",
        "MI CLARO WEB - NO VISUALIZA RECIBOS",
        "MI CLARO WEB - RECIBO NO DISPONIBLE",
        "MI CLARO WEB - ERROR AL PAGAR RECIBO",
        "MI CLARO WEB - NO PUEDE DESCARGAR RECIBO PDF",
        "MI CLARO WEB - NO VISUALIZA HISTORIAL DE PAGOS",
        "MI CLARO WEB - ERROR EN DEBITO AUTOMATICO",
        "MI CLARO WEB - NO PUEDE AFILIARSE A DEBITO AUTOMATICO",
        "MI CLARO WEB - NO PUEDE CAMBIAR DE PLAN",
        "MI CLARO WEB - PLANES NO DISPONIBLES",
        "MI CLARO WEB - ERROR AL SOLICITAR CAMBIO DE PLAN",
        "MI CLARO WEB - CAMBIO DE PLAN NO REFLEJADO",
        "MI CLARO WEB - NO PUEDE SOLICITAR DECO ADICIONAL",
        "MI CLARO WEB - NO PUEDE CONTRATAR PAQUETE TV",
        "MI CLARO WEB - NO PUEDE SUSPENDER TEMPORALMENTE",
        "MI CLARO WEB - NO PUEDE CAMBIAR NUMERO",
        "MI CLARO WEB - NO PUEDE REGISTRAR DIRECTORIO TELEFONICO",
        "MI CLARO WEB - NO VISUALIZA ESTADO DE SOLICITUDES",
        "MI CLARO WEB - OPERACION PENDIENTE",
        "MI CLARO WEB - NO PUEDE APROBAR OPERACION",
        "MI CLARO WEB - ERROR AL CONFIRMAR IDENTIDAD",
        "MI CLARO WEB - OPERACION NO FINALIZA",
        "MI CLARO WEB - TRANSACCION NO EXITOSA",
        "MI CLARO WEB - NO VISUALIZA CLARO PUNTOS",
        "MI CLARO WEB - ERROR AL CANJEAR PUNTOS",
        "MI CLARO WEB - NO PUEDE CONVERTIR A MILLAS",
        "MI CLARO WEB - PUNTOS NO ACTUALIZADOS"
    ]
},
    hashtags: [
        {
            "tag": "#MANTENIMIENTO+CAMBIO A DOCSIS 3.1",
            "description": "Mantenimiento + Cambio a DOCSIS 3.1"
        }
    ],
    solutions: [
    {
        "solucion": "DESCARTES_FISICOS_INTERNET",
        "tipificacion": "VALIDACION DE CONEXIONES"
    },
    {
        "solucion": "DESCARTES_FISICOS_INTERNET",
        "tipificacion": "REINICIO MANUAL"
    },
    {
        "solucion": "DESCARTES_FISICOS_INTERNET",
        "tipificacion": "VALIDACION TOMAS ELECTRICAS"
    },
    {
        "solucion": "DESCARTES_REMOTOS_INTERNET",
        "tipificacion": "BAJA Y ALTA"
    },
    {
        "solucion": "DESCARTES_REMOTOS_INTERNET",
        "tipificacion": "CAMBIO SSID"
    },
    {
        "solucion": "DESCARTES_REMOTOS_INTERNET",
        "tipificacion": "ACTUALIZACION FIRMWARE"
    },
    {
        "solucion": "DESCARTES_REMOTOS_IPTV",
        "tipificacion": "ACTUALIZACION CLARO TV"
    },
    {
        "solucion": "DESCARTES_REMOTOS_IPTV",
        "tipificacion": "RESET CONTROL REMOTO"
    }
],
    siacCategories: [
    {
        "id": "cat_4",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nSolucionado/Cliente brinda Conformidad\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Solucionado/Cliente brinda Conformidad",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "PROCEDENTE",
        "motivos": [
            "SOLUCIONADO ACCESO ACTIVAR BOUQUETS",
            "SOLUCIONADO ACCESO ALTA Y BAJA INCOGNITO > Instalar ONT/CM",
            "SOLUCIONADO ACCESO CAMBIO DE RESOLUCIÓN SKYWAY",
            "SOLUCIONADO ACCESO CLEAN DATA SKYWAY",
            "SOLUCIONADO ACCESO FIJACIÓN DE IP",
            "SOLUCIONADO ACCESO PREFERENCES SKYWAY",
            "SOLUCIONADO ACCESO PROVISIÓN FIJA + CLEAN DATA SKYWAY",
            "SOLUCIONADO ACCESO PROVISIÓN FIJA > ActivarGPONTV",
            "SOLUCIONADO ACCESO PROVISIÓN FIJA > Instalar serialNumber STB",
            "SOLUCIONADO ACCESO PROVISIÓN FIJA > REGENERAR IPTV",
            "SOLUCIONADO DESCARTES TÉCNICOS CAMBIO DE PILAS CONTROL REMOTO",
            "SOLUCIONADO DESCARTES TÉCNICOS CONEXIONES",
            "SOLUCIONADO DESCARTES TÉCNICOS PROBLEMAS EQUIPOS DEL CLIENTE",
            "SOLUCIONADO DESCARTES TÉCNICOS RESET FACTORY",
            "SOLUCIONADO DESCARTES TÉCNICOS RESET FACTORY + CLEAN DATA SKYWAY",
            "SOLUCIONADO DESCARTES TÉCNICOS VELOCIDAD MÍNIMA 70%",
            "SOLUCIONADO INFORMACIÓN PRODUCTO PLAN TV DIGITAL",
            "SOLUCIONADO INFORMACIÓN COMERCIAL SOLICITUD FAST TRACK",
            "SOLUCIONADO INFORMACIÓN GRILLA DE CANALES TV DIGITAL",
            "SOLUCIONADO INFORMACIÓN SIN SALDO PARA LLAMADAS",
            "SOLUCIONADO OK EN LÍNEA"
        ],
        "default_hashtag": "#SINSERVICIOPRIORIDADAM#",
        "descripcion": "SOTs generadas cuando el problema es sin servicio total. Se utiliza para que contrata lleve escalera.",
        "area": "BO-TECNICO-BO PREVENTIVA"
    },
    {
        "id": "cat_25",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCon Visita Técnica\nSot:\nFecha Confirmada:\nProblema:\nMotivo:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Con Visita Técnica",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "PROCEDENTE",
        "motivos": [
            "BO ATC - SOT DE MANTTO A SOLICITUD CLARO - CONMUTACIÓN",
            "BO ATC - SOT DE MANTTO A SOLICITUD CLARO - RED",
            "BO ATC - SOT DE MANTTO A SOLICITUD DEL CLIENTE",
            "BO ATC - SOT DE MANTTO NO FUNCIONA CONTROL REMOTO",
            "BO ATC - SOT DE MANTTO SIN SERVICIO GENERAL"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_36",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCiclo Cumplido/Sin Contacto\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nIntentos de Llamada:3\nBuzón de voz: ->OBLIGATORIO DEJAR MENSAJE DE VOZ\nID Llamada/Chat ID:\nAsesor:",
        "title": "Ciclo Cumplido/Sin Contacto",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "PROCEDENTE",
        "motivos": [
            "MENSAJE BUZÓN DE VOZ",
            "NO CONTACTO SIN CASILLA DE VOZ"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_46",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nInformativo/Avería Masiva\nPersona de Contacto:\nNumero de Contacto:\nContesta: SI/NO\nBuzón de voz: SI/NO\nID Llamada/Chat ID:\nAsesor:",
        "title": "Informativo/Avería Masiva",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - AVERÍA MASIVA EN EJECUCIÓN POST-CREACIÓN CASO",
            "BO ATC - AVERÍA MASIVA EN EJECUCIÓN PRE-CREACIÓN CASO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_55",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente con suspensión de servicios\nID Llamada/Chat ID: N/A\nAsesor:",
        "title": "Cliente con suspensión de servicios",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - SERVICIO SUSPENDIDO POST-CREACIÓN CASO",
            "BO ATC - SERVICIO SUSPENDIDO PRE-CREACIÓN CASO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_61",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente dara de baja el servicio\nID Llamada/Chat ID: N/A\nAsesor:",
        "title": "Cliente dara de baja el servicio",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - CLIENTE DARÁ DE BAJA SERVICIO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_66",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nNumero no existe/Numero errado/Mal creado\nContacto:\nN° Telefónico:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Numero no existe/Numero errado/Mal creado",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - DERIVACIÓN INCORRECTA                                                                                       BO ATC - EMTA/ONT NO HOMOLOGADO EN SMARTHOME                                                                                          BO ATC - DUPLICIDAD DE CASO                                                                                                                          BO ATC - TIPIFICACIÓN INCORRECTA                                                                                                           BO ATC - PÁGINAS WEB BLOQUEADAS POR INDECOPI"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_75",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente desiste de la atención\nPersona de Contacto:\nNumero de Contacto:\nMotivo:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Cliente desiste de la atención",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - CLIENTE NO BRINDA FACILIDADES TÉCNICAS",
            "BO ATC - SIN RECEPCIÓN PRUEBAS CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_82",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCiclo de llamada\nIntentos de Llamada:1/2/3\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nBuzón de voz: ->OBLIGATORIO DEJAR MENSAJE DE VOZ\nID Llamada/Chat ID:\nAsesor:",
        "title": "Ciclo de llamada",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - 1ER INTENTO COMUNICACIÓN SIN BUZÓN DE VOZ",
            "BO ATC - 1ER INTENTO COMUNICACIÓN MENSAJE EN EL BUZÓN DE VOZ",
            "BO ATC - 2DO INTENTO COMUNICACIÓN SIN BUZÓN DE VOZ",
            "BO ATC - 2DO INTENTO COMUNICACIÓN MENSAJE EN EL BUZÓN DE VOZ",
            "BO ATC - FALLA SOLUCIONADA / CONTACTO CLIENTE",
            "BO ATC - DIAGNÓSTICO PROVISIÓN TÉCNICA",
            "BO ATC - CASO DERIVADO CON SUPERVISIÓN BOT"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_91",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente solicita devolución de llamada\nFecha/Hora:\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Cliente solicita devolución de llamada",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - CLIENTE SOLICITA DEVOLUCIÓN DE LLAMADA                                                      BO ATC - LLAMADA PROGRAMADA POR DISPONIBILIDAD CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_100",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDerivado a conmutación-Correo                  (ADJUNTAR)\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Derivado a conmutación-Correo                  (ADJUNTAR)",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - DERIVADO A CONMUTACIÓN"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_108",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDerivado a TI-Remedy\nMotivo:\nRemedy:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Derivado a TI-Remedy",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "IPTV - PAQUETES NO PROVISIONADOS EN IOTDB",
            "IPTV - EQUIPOS NO PROVISIONADOS EN IOTDB",
            "BO ATC - MIGRACION A CBIO FALLO / SGA MUESTRA MENSAJE DE ERROR",
            "BO ATC - LÍNEA NO REGISTRADA EN CBIO",
            "BO ATC - DESALINEACION OCSI",
            "APP SMART HOME - DISPOSITIVOS CONECTADOS - ERROR AL CARGAR LOS DISPOSITIVOS CONECTADOS",
            "BO ATC - SUSCRIPCIONES INCOMPLETAS",
            "BO ATC - SIN E. INCOGNITO / ACTIVO SIAC (SGA TRANSLATOR)",
            "IPTV - EQUIPOS Y PAQUETES NO PROVISIONADOS EN IOTDB",
            "BO ATC - SUSCRIPCIONES INCORRECTAS",
            "BO ATC - ERROR CON ACTIVACIÓN DE BOUQUETS",
            "BO ATC - SERVICIO CON TECNOLOGIA ERRADA",
            "BO CN - INCOGNITO SUSPENDIDO / SGA ACTIVO",
            "BO ATC - LÍNEA CON BOLSA INCORRECTA EN CBIO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_116",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nPendiente de envió de pruebas\nProblema:\nMotivo: **Derivación en Curso**\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Pendiente de envió de pruebas",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - ENVÍO PRUEBAS CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_124",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDescarte cambio de IP\nProblema: Relance de Servicios - Validar en 10 minutos",
        "title": "Descarte cambio de IP",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - EJECUCIÓN BAJA Y ALTA INCOGNITO - INSTALAR                                          BO ATC - EJECUCIÓN BAJA Y ALTA INCOGNITO - DESACTIVAR"
        ],
        "descripcion": "SOTs generadas cuando el problema es sin servicio total. Se utiliza para que contrata lleve escalera.",
        "area": "BO-TECNICO-BO PREVENTIVA"
    },
    {
        "id": "cat_25",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCon Visita Técnica\nSot:\nFecha Confirmada:\nProblema:\nMotivo:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Con Visita Técnica",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "PROCEDENTE",
        "motivos": [
            "BO ATC - SOT DE MANTTO A SOLICITUD CLARO - CONMUTACIÓN",
            "BO ATC - SOT DE MANTTO A SOLICITUD CLARO - RED",
            "BO ATC - SOT DE MANTTO A SOLICITUD DEL CLIENTE",
            "BO ATC - SOT DE MANTTO NO FUNCIONA CONTROL REMOTO",
            "BO ATC - SOT DE MANTTO SIN SERVICIO GENERAL"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_36",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCiclo Cumplido/Sin Contacto\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nIntentos de Llamada:3\nBuzón de voz: ->OBLIGATORIO DEJAR MENSAJE DE VOZ\nID Llamada/Chat ID:\nAsesor:",
        "title": "Ciclo Cumplido/Sin Contacto",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "PROCEDENTE",
        "motivos": [
            "MENSAJE BUZÓN DE VOZ",
            "NO CONTACTO SIN CASILLA DE VOZ"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_46",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nInformativo/Avería Masiva\nPersona de Contacto:\nNumero de Contacto:\nContesta: SI/NO\nBuzón de voz: SI/NO\nID Llamada/Chat ID:\nAsesor:",
        "title": "Informativo/Avería Masiva",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - AVERÍA MASIVA EN EJECUCIÓN POST-CREACIÓN CASO",
            "BO ATC - AVERÍA MASIVA EN EJECUCIÓN PRE-CREACIÓN CASO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_55",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente con suspensión de servicios\nID Llamada/Chat ID: N/A\nAsesor:",
        "title": "Cliente con suspensión de servicios",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - SERVICIO SUSPENDIDO POST-CREACIÓN CASO",
            "BO ATC - SERVICIO SUSPENDIDO PRE-CREACIÓN CASO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_61",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente dara de baja el servicio\nID Llamada/Chat ID: N/A\nAsesor:",
        "title": "Cliente dara de baja el servicio",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - CLIENTE DARÁ DE BAJA SERVICIO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_66",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nNumero no existe/Numero errado/Mal creado\nContacto:\nN° Telefónico:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Numero no existe/Numero errado/Mal creado",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - DERIVACIÓN INCORRECTA                                                                                       BO ATC - EMTA/ONT NO HOMOLOGADO EN SMARTHOME                                                                                          BO ATC - DUPLICIDAD DE CASO                                                                                                                          BO ATC - TIPIFICACIÓN INCORRECTA                                                                                                           BO ATC - PÁGINAS WEB BLOQUEADAS POR INDECOPI"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_75",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente desiste de la atención\nPersona de Contacto:\nNumero de Contacto:\nMotivo:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Cliente desiste de la atención",
        "estado_siac": "CERRADO-NO APLICA-PROCEDENTE",
        "estado_form": "NO PROCEDENTE",
        "motivos": [
            "BO ATC - CLIENTE NO BRINDA FACILIDADES TÉCNICAS",
            "BO ATC - SIN RECEPCIÓN PRUEBAS CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_82",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCiclo de llamada\nIntentos de Llamada:1/2/3\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nBuzón de voz: ->OBLIGATORIO DEJAR MENSAJE DE VOZ\nID Llamada/Chat ID:\nAsesor:",
        "title": "Ciclo de llamada",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - 1ER INTENTO COMUNICACIÓN SIN BUZÓN DE VOZ",
            "BO ATC - 1ER INTENTO COMUNICACIÓN MENSAJE EN EL BUZÓN DE VOZ",
            "BO ATC - 2DO INTENTO COMUNICACIÓN SIN BUZÓN DE VOZ",
            "BO ATC - 2DO INTENTO COMUNICACIÓN MENSAJE EN EL BUZÓN DE VOZ",
            "BO ATC - FALLA SOLUCIONADA / CONTACTO CLIENTE",
            "BO ATC - DIAGNÓSTICO PROVISIÓN TÉCNICA",
            "BO ATC - CASO DERIVADO CON SUPERVISIÓN BOT"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_91",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nCliente solicita devolución de llamada\nFecha/Hora:\nProblema/Solución:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Cliente solicita devolución de llamada",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - CLIENTE SOLICITA DEVOLUCIÓN DE LLAMADA                                                      BO ATC - LLAMADA PROGRAMADA POR DISPONIBILIDAD CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_100",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDerivado a conmutación-Correo                  (ADJUNTAR)\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Derivado a conmutación-Correo                  (ADJUNTAR)",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - DERIVADO A CONMUTACIÓN"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_108",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDerivado a TI-Remedy\nMotivo:\nRemedy:\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Derivado a TI-Remedy",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "IPTV - PAQUETES NO PROVISIONADOS EN IOTDB",
            "IPTV - EQUIPOS NO PROVISIONADOS EN IOTDB",
            "BO ATC - MIGRACION A CBIO FALLO / SGA MUESTRA MENSAJE DE ERROR",
            "BO ATC - LÍNEA NO REGISTRADA EN CBIO",
            "BO ATC - DESALINEACION OCSI",
            "APP SMART HOME - DISPOSITIVOS CONECTADOS - ERROR AL CARGAR LOS DISPOSITIVOS CONECTADOS",
            "BO ATC - SUSCRIPCIONES INCOMPLETAS",
            "BO ATC - SIN E. INCOGNITO / ACTIVO SIAC (SGA TRANSLATOR)",
            "IPTV - EQUIPOS Y PAQUETES NO PROVISIONADOS EN IOTDB",
            "BO ATC - SUSCRIPCIONES INCORRECTAS",
            "BO ATC - ERROR CON ACTIVACIÓN DE BOUQUETS",
            "BO ATC - SERVICIO CON TECNOLOGIA ERRADA",
            "BO CN - INCOGNITO SUSPENDIDO / SGA ACTIVO",
            "BO ATC - LÍNEA CON BOLSA INCORRECTA EN CBIO"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_116",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nPendiente de envió de pruebas\nProblema:\nMotivo: **Derivación en Curso**\nPersona de Contacto:\nNumero de Contacto:\nID Llamada/Chat ID:\nAsesor:",
        "title": "Pendiente de envió de pruebas",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - ENVÍO PRUEBAS CLIENTE"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    },
    {
        "id": "cat_124",
        "raw_plantilla": "BACK OFFICE FIJA HITSS\nDescarte cambio de IP\nProblema: Relance de Servicios - Validar en 10 minutos",
        "title": "Descarte cambio de IP",
        "estado_siac": "RECUPERADO-EN TRAMITE",
        "estado_form": "EN TRAMITE",
        "motivos": [
            "BO ATC - EJECUCIÓN BAJA Y ALTA INCOGNITO - INSTALAR                                          BO ATC - EJECUCIÓN BAJA Y ALTA INCOGNITO - DESACTIVAR"
        ],
        "default_hashtag": "",
        "descripcion": "",
        "area": ""
    }
],
    quickDescartes: [
        "SE VALIDA SIN CONSUMO EN TRACER, DESCARTES FISICOS, REINICIO SIN EXITO",
        "SE REALIZA REINICIO MANUAL DE ONT/EMTA, SERVICIO OK EN LINEA",
        "VALIDACION DE TOMAS ELECTRICAS Y CABLEADO FISICO CONFORME",
        "BAJA Y ALTA EN SGA PROCESADO CORRECTAMENTE",
        "CAMBIO DE CANAL Y SSID WIFI REALIZADO",
        "ACTUALIZACION DE FIRMWARE Y REBOOT PROCESADO CON SKYWAY",
        "SE PROCESO CLEAR DATA Y ALINEACION DE FICHAS EN SGA",
        "ALINEACION DE BOLSA DE MINUTOS Y PORTADORAS CONFORME",
        "CLIENTE CONFIRMA SOLUCION Y BRINDA CONFORMIDAD"
    ]
};

const modelosData = {
    "DPC3926": { nombre:"CISCO DPC3926", img:"img/CISCO DPC3926.jpg", descripcion:"Soporta 30 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:30, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "DPQ3925": { nombre:"CISCO DPQ3925", img:"img/CISCO DPQ3925.jpg", descripcion:"Soporta 30 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:30, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "TG862": { nombre:"ARRIS TG862", img:"img/ARRIS TG862.jpg", descripcion:"Soporta 30 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:30, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "FAST3686V22": { nombre:"SAGEMCOM FAST3686V2.2", img:"img/SAGEMCOM FAST3686V2_2.jpg", descripcion:"Soporta 300 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:300, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "TG2482": { nombre:"ARRIS TG2482", img:"img/ARRIS TG2482.jpg", descripcion:"Soporta 300 Mbps / SI REPETIDOR", repetidor:"SI", velocidad:300, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "CGA2121": { nombre:"TECNICOLOR CGA2121", img:"img/TECNICOLOR CGA2121.jpg", descripcion:"Soporta 300 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:300, tipo:"Router HFC (Docsis 3.0)", homologado: true },
    "F3890V3": { nombre:"SAGEMCOM F3890 V3", img:"img/SAGEMCOM F3890 V3.jpg", descripcion:"Soporta 301-1000 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"Router HFC (Docsis 3.1)", homologado: true },
    "TG3442": { nombre:"ARRIS TG3442", img:"img/ARRIS TG3442.jpg", descripcion:"Soporta 301-1000 Mbps / SI REPETIDOR", repetidor:"SI", velocidad:1000, tipo:"Router HFC (Docsis 3.1)", homologado: true },
    "CGA4233": { nombre:"TECNICOLOR CGA4233 CLP2", img:"img/TECNICOLOR CGA4233 CLP2.jpg", descripcion:"Soporta 301-1000 Mbps / SI REPETIDOR", repetidor:"SI", velocidad:1000, tipo:"Router HFC (Docsis 3.1)", homologado: true },
    "HG8245Q2": { nombre:"HUAWEI HG8245Q2", img:"img/ONT_HUAWEI HG8245Q2.jpg", descripcion:"Soporta 1000 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"ONT FTTH (GPON)", homologado: true },
    "HG815V5": { nombre:"HUAWEI HG815V5", img:"img/ONT_HUAWEI HG815V5.jpg", descripcion:"Soporta 1000 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"ONT FTTH (GPON)", homologado: true },
    "ZXHNF680": { nombre:"ZTE ZXHNF680", img:"img/ONT_ZTE ZXHNF680.jpg", descripcion:"Soporta 1000 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"ONT FTTH (GPON)", homologado: true },
    "F6600P": { nombre:"ZTE F6600P v9.0.12", img:"img/ONT_ZTE_F6600P.jpg", descripcion:"Soporta 1000 Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"ONT FTTH (Wi-Fi 6)", homologado: true },
    "FAST5670V2": { nombre:"SAGEMCOM FAST5670 v2", img:"img/ONT_SAGEMCOM FAST5670 v2.jpg", descripcion:"Soporta 1GB A+ Mbps / NO REPETIDOR", repetidor:"NO", velocidad:1000, tipo:"ONT FTTH (Wi-Fi 6)", homologado: true }
};

const equiposClaro = Object.keys(modelosData).map(key => ({
    codigo: key,
    nombre: modelosData[key].nombre,
    tipo: modelosData[key].tipo || (modelosData[key].nombre.includes('ONT') || key.startsWith('HG') || key.startsWith('ZX') || key.startsWith('F6') || key.includes('5670') ? 'Router FTTH' : 'Router HFC'),
    homologado: modelosData[key].homologado !== false,
    imagen: modelosData[key].img,
    descripcion: modelosData[key].descripcion,
    repetidor: modelosData[key].repetidor,
    velocidad: modelosData[key].velocidad,
    credenciales: modelosData[key].credenciales || ''
}));

if (typeof window !== 'undefined') {
    window.modelosData = modelosData;
    window.equiposClaro = equiposClaro;
}
if (typeof global !== 'undefined') {
    global.modelosData = modelosData;
    global.equiposClaro = equiposClaro;
}
