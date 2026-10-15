/* ==========================================================================
   MODULE: AUTOCORRECCIÓN ORTOGRÁFICA & ABREVIATURAS TELECOM
   ========================================================================== */
window.BO_MODULES = window.BO_MODULES || {};

(function() {
    // ==========================================================================
    // MOTOR DE AUTOCORRECCIÓN ORTOGRÁFICA & ABREVIATURAS TELECOM (Ámbito Global)
    // ==========================================================================
    function autoCorrectText(text, preserveTrailingSpaces = true) {
        if (!text) return '';

        // Capturar espacios o saltos de línea al final para preservarlos intactos durante el tipeo
        const trailingMatch = text.match(/\s*$/);
        const trailingWhitespace = preserveTrailingSpaces && trailingMatch ? trailingMatch[0] : '';

        let cleaned = text;

        // 1. Normalización de espacios y comas múltiples
        cleaned = cleaned.replace(/\s+,/g, ','); // Quitar espacios antes de la coma
        cleaned = cleaned.replace(/,([^\s,])/g, ', $1'); // Asegurar espacio tras la coma si le sigue un texto
        cleaned = cleaned.replace(/,{2,}/g, ','); // Limpiar comas duplicadas

        const corrections = [
            // Verbos y combinaciones contextuales comunes
            { regex: /\b(se reinicio)\b/gi, replacement: 'se reinició' },
            { regex: /\b(se cambio)\b/gi, replacement: 'se cambió' },
            { regex: /\b(se realizo)\b/gi, replacement: 'se realizó' },
            { regex: /\b(se valido)\b/gi, replacement: 'se validó' },
            { regex: /\b(se efectuo)\b/gi, replacement: 'se efectuó' },
            { regex: /\b(se configuro)\b/gi, replacement: 'se configuró' },
            { regex: /\b(se verifico)\b/gi, replacement: 'se verificó' },
            { regex: /\b(se apago)\b/gi, replacement: 'se apagó' },
            { regex: /\b(se encendio)\b/gi, replacement: 'se encendió' },
            { regex: /\b(se derivo)\b/gi, replacement: 'se derivó' },
            { regex: /\b(se conecto)\b/gi, replacement: 'se conectó' },
            { regex: /\b(se desconecto)\b/gi, replacement: 'se desconectó' },

            // Verbos comunes de atención en pasado (3ra persona singular con tilde)
            { regex: /\b(educo)\b/gi, replacement: 'educó' },
            { regex: /\b(informo)\b/gi, replacement: 'informó' },
            { regex: /\b(valido)\b/gi, replacement: 'validó' },
            { regex: /\b(realizo)\b/gi, replacement: 'realizó' },
            { regex: /\b(coordino)\b/gi, replacement: 'coordinó' },
            { regex: /\b(genero)\b/gi, replacement: 'generó' },
            { regex: /\b(soluciono)\b/gi, replacement: 'solucionó' },
            { regex: /\b(indico)\b/gi, replacement: 'indicó' },
            { regex: /\b(atendio)\b/gi, replacement: 'atendió' },
            { regex: /\b(comunico)\b/gi, replacement: 'comunicó' },
            { regex: /\b(confirmo)\b/gi, replacement: 'confirmó' },
            { regex: /\b(cancelo)\b/gi, replacement: 'canceló' },
            { regex: /\b(reporto)\b/gi, replacement: 'reportó' },
            { regex: /\b(envio)\b/gi, replacement: 'envió' },
            { regex: /\b(ingreso)\b/gi, replacement: 'ingresó' },
            { regex: /\b(verifico)\b/gi, replacement: 'verificó' },
            { regex: /\b(conecto)\b/gi, replacement: 'conectó' },
            { regex: /\b(desconecto)\b/gi, replacement: 'desconectó' },
            { regex: /\b(solicito)\b/gi, replacement: 'solicitó' },
            { regex: /\b(explico)\b/gi, replacement: 'explicó' },
            { regex: /\b(respondio)\b/gi, replacement: 'respondió' },
            { regex: /\b(apago)\b/gi, replacement: 'apagó' },
            { regex: /\b(encendio)\b/gi, replacement: 'encendió' },
            { regex: /\b(derivo)\b/gi, replacement: 'derivó' },
            { regex: /\b(probo)\b/gi, replacement: 'probó' },
            { regex: /\b(configuro)\b/gi, replacement: 'configuró' },

            // Acrónimos estándar en telecomunicaciones y redes
            { regex: /\b(ont|onts)\b/gi, replacement: 'ONT' },
            { regex: /\b(stb|stbs)\b/gi, replacement: 'STB' },
            { regex: /\b(gpon)\b/gi, replacement: 'GPON' },
            { regex: /\b(ftth)\b/gi, replacement: 'FTTH' },
            { regex: /\b(hfc)\b/gi, replacement: 'HFC' },
            { regex: /\b(cpe|cpes)\b/gi, replacement: 'CPE' },
            { regex: /\b(snr)\b/gi, replacement: 'SNR' },
            { regex: /\b(dns)\b/gi, replacement: 'DNS' },
            { regex: /\b(dhcp)\b/gi, replacement: 'DHCP' },
            { regex: /\b(sot)\b/gi, replacement: 'SOT' },
            { regex: /\b(ip|ips)\b/gi, replacement: 'IP' },
            { regex: /\b(mac)\b/gi, replacement: 'MAC' },
            { regex: /\b(tx)\b/gi, replacement: 'TX' },
            { regex: /\b(rx)\b/gi, replacement: 'RX' },
            { regex: /\b(dbm)\b/gi, replacement: 'dBm' },
            { regex: /\b(ssid)\b/gi, replacement: 'SSID' },
            { regex: /\b(wan)\b/gi, replacement: 'WAN' },
            { regex: /\b(lan)\b/gi, replacement: 'LAN' },
            { regex: /\b(catv)\b/gi, replacement: 'CATV' },
            { regex: /\b(iptv)\b/gi, replacement: 'IPTV' },
            { regex: /\b(voip)\b/gi, replacement: 'VoIP' },
            { regex: /\b(skyway)\b/gi, replacement: 'Skyway' },
            { regex: /\b(youbora)\b/gi, replacement: 'Youbora' },

            // Errores tipográficos por tipeo veloz y palabras técnicas
            { regex: /\b(deconectar|desconectar)\b/gi, replacement: 'desconectar' },
            { regex: /\b(deconecta|desconecta)\b/gi, replacement: 'desconecta' },
            { regex: /\b(deconectado|desconectado)\b/gi, replacement: 'desconectado' },
            { regex: /\b(nches|nche)\b/gi, replacement: 'noches' },
            { regex: /\b(ruter|rotuer)\b/gi, replacement: 'router' },
            { regex: /\b(modem|modems)\b/gi, replacement: 'módem' },
            { regex: /\b(cabledo|cablado|cabliado)\b/gi, replacement: 'cableado' },
            { regex: /\b(servcio|servico|servisios)\b/gi, replacement: 'servicio' },
            { regex: /\b(coneccion|conexiion|conecion)\b/gi, replacement: 'conexión' },
            { regex: /\b(conexion)\b/gi, replacement: 'conexión' },
            { regex: /\b(instalacion)\b/gi, replacement: 'instalación' },
            { regex: /\b(verificacion)\b/gi, replacement: 'verificación' },
            { regex: /\b(atencion)\b/gi, replacement: 'atención' },
            { regex: /\b(operacion)\b/gi, replacement: 'operación' },
            { regex: /\b(dia)\b/gi, replacement: 'día' },
            { regex: /\b(dias)\b/gi, replacement: 'días' },
            { regex: /\b(tecnico)\b/gi, replacement: 'técnico' },
            { regex: /\b(tecnicos)\b/gi, replacement: 'técnicos' },
            { regex: /\b(parametros)\b/gi, replacement: 'parámetros' },
            { regex: /\b(informacion)\b/gi, replacement: 'información' },
            { regex: /\b(comunicacion)\b/gi, replacement: 'comunicación' },
            { regex: /\b(numero)\b/gi, replacement: 'número' },
            { regex: /\b(numeros)\b/gi, replacement: 'números' },
            { regex: /\b(senial|senales)\b/gi, replacement: 'señal' },
            { regex: /\b(solucion)\b/gi, replacement: 'solución' },
            { regex: /\b(revision)\b/gi, replacement: 'revisión' },
            { regex: /\b(configuracion)\b/gi, replacement: 'configuración' },
            { regex: /\b(provision)\b/gi, replacement: 'provisión' },
            { regex: /\b(validacion)\b/gi, replacement: 'validación' },
            { regex: /\b(intermitencia)\b/gi, replacement: 'intermitencia' },
            { regex: /\b(degradacion)\b/gi, replacement: 'degradación' },
            { regex: /\b(perdida|perdidas)\b/gi, replacement: 'pérdida' },
            { regex: /\b(caida|caidas)\b/gi, replacement: 'caída' },
            { regex: /\b(atenuacion)\b/gi, replacement: 'atenuación' },
            { regex: /\b(telefonia)\b/gi, replacement: 'telefonía' },
            { regex: /\b(navegacion)\b/gi, replacement: 'navegación' },
            { regex: /\b(transmision)\b/gi, replacement: 'transmisión' },
            { regex: /\b(recepcion)\b/gi, replacement: 'recepción' },

            // Abreviaturas y errores comunes de asesores
            { regex: /\b(cli|clie)\b/gi, replacement: 'cliente' },
            { regex: /\b(serv|srv)\b/gi, replacement: 'servicio' },
            { regex: /\b(prov)\b/gi, replacement: 'provisión' },
            { regex: /\b(config)\b/gi, replacement: 'configuración' },
            { regex: /\b(verif)\b/gi, replacement: 'verificación' },
            { regex: /\b(reini)\b/gi, replacement: 'reinicio' },
            { regex: /\b(soluc)\b/gi, replacement: 'solución' },
            { regex: /\b(telef|tlf)\b/gi, replacement: 'teléfono' },
            { regex: /\b(buzon)\b/gi, replacement: 'buzón' },
            { regex: /\b(linea)\b/gi, replacement: 'línea' },
            { regex: /\b(veloc|velocid)\b/gi, replacement: 'velocidad' },
            { regex: /\b(descon)\b/gi, replacement: 'desconectado' },
            { regex: /\b(conect)\b/gi, replacement: 'conectado' },
            { regex: /\b(cablead)\b/gi, replacement: 'cableado' },
            { regex: /\b(equip|eq)\b/gi, replacement: 'equipo' },
            { regex: /\b(nocontesta)\b/gi, replacement: 'no contesta' },
            { regex: /\b(wsp|wa|wha)\b/gi, replacement: 'WhatsApp' },
            { regex: /\b(msj|msg)\b/gi, replacement: 'mensaje' },

            // Nombres de herramientas y plataformas
            { regex: /\b(incognito|incog)\b/gi, replacement: 'Incógnito' },
            { regex: /\b(schaman)\b/gi, replacement: 'Schaman' },
            { regex: /\b(plume)\b/gi, replacement: 'Plume' },
            { regex: /\b(tr069|tr69)\b/gi, replacement: 'TR69' },
            { regex: /\b(hygeia)\b/gi, replacement: 'Hygeia' },
            { regex: /\b(tracer)\b/gi, replacement: 'Tracer' },
            { regex: /\b(remedy)\b/gi, replacement: 'Remedy' },
            { regex: /\b(siac)\b/gi, replacement: 'SIAC' },
            { regex: /\b(sga)\b/gi, replacement: 'SGA' },
            { regex: /\b(skyway)\b/gi, replacement: 'Skyway' },
            { regex: /\b(youbora)\b/gi, replacement: 'Youbora' },
            { regex: /\b(cbio)\b/gi, replacement: 'CBIO' },
            { regex: /\b(ims)\b/gi, replacement: 'IMS' },
            { regex: /\b(live\s*chat|livechat)\b/gi, replacement: 'LiveChat' },
            { regex: /\b(autoselect)\b/gi, replacement: 'AutoSelect' },

            // Errores tipográficos adicionales
            { regex: /\b(targeta|targetas)\b/gi, replacement: 'tarjeta' },
            { regex: /\b(inhalambrico|inhalambricos|inhalambrica|inhalambricas|inalambrico|inalambricos|inalambrica|inalambricas)\b/gi, replacement: 'inalámbrico' },
            { regex: /\b(inhalambricamente|inalambricamente)\b/gi, replacement: 'inalámbricamente' },
            { regex: /\b(presioanrlo|presionarllo)\b/gi, replacement: 'presionarlo' },
            { regex: /\b(disponiblidad|diosponibilidad|diosponiblidad)\b/gi, replacement: 'disponibilidad' },
            { regex: /\b(acttiva)\b/gi, replacement: 'activa' },
            { regex: /\b(reealiza)\b/gi, replacement: 'realiza' },
            { regex: /\b(opticos)\b/gi, replacement: 'ópticos' },
            { regex: /\b(optico)\b/gi, replacement: 'óptico' },
            { regex: /\b(optica|opticas)\b/gi, replacement: 'óptica' }
        ];

        corrections.forEach(c => {
            cleaned = cleaned.replace(c.regex, c.replacement);
        });

        // Asegurar mayúscula inicial en cada línea y tras viñetas (- , * , 1. ) o comas / punto y coma
        cleaned = cleaned.split('\n').map(line => {
            if (!line) return '';

            // 1. Capitalizar tras viñetas reales (- , * , • , 1. , 1) ) o inicio de línea
            let res = line.replace(/^(\s*[-*•]\s*|\s*\d+[\.\)\]]\s+|\s*\d+\s*[-–]\s+)([a-záéíóúñ])/i, (m, prefix, char) => prefix + char.toUpperCase())
                .replace(/^(\s*)([a-záéíóúñ])/i, (m, prefix, char) => prefix + char.toUpperCase());

            // 2. Capitalizar la primera letra después de cada coma o punto y coma seguido de espacio
            res = res.replace(/(,\s*)([a-záéíóúñ])/g, (m, sep, char) => sep + char.toUpperCase());
            res = res.replace(/(;\s*)([a-záéíóúñ])/g, (m, sep, char) => sep + char.toUpperCase());

            return res;
        }).join('\n');

        if (preserveTrailingSpaces && trailingWhitespace && !cleaned.endsWith(trailingWhitespace)) {
            cleaned = cleaned.replace(/\s*$/, '') + trailingWhitespace;
        }

        return cleaned;
    }


    window.autoCorrectText = autoCorrectText;
    window.BO_MODULES.autocorrect = {
        autoCorrectText,
        init(state, elements) {
            // Autocorrect module ready
        }
    };
})();
