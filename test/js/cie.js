/***
 Funciones y utilidades para CIE/IEC.

 NOTA: En la medida de lo posible NO utilizar código con dependencias de alguna librería externa.

 TODO: → Añadir un pequeño div con opciones en la zona de consola: 
         → Un pequeño botón para maximizar/restaurar la zona de consola,
           por si se está trabajando únicamente con la consola y el
           iframe estorba.
         → También podría estudiarse el implementar a mano alguna forma de tiradores de forma 
           que se puedan redimensionar las secciones
       → Probar la opción de diseño del payo (simulando una consola Firebug):
          _______
         |   |   | <-- Zona frame html
         |___|___|
         |_____|_|
           |    |
           |  Línea de comandos y área de edición
         Output consola

       → Permitir definir los estilos de cada mensaje en las opciones del constructor

 R. Galacho v1.0.1 © 22-04-2010
 ***/

CIE = {
    __librerias__: { mochikit: { cargada: false, uri: "js/mochiKit-1.4.2/MochiKit.js", id: "mochikit" },
                     mootools: { cargada: false, uri: "http://ajax.googleapis.com/ajax/libs/mootools/1.4.5/mootools-yui-compressed.js", id: "mootools" },
                     prototype: { cargada: false, uri: "http://ajax.googleapis.com/ajax/libs/prototype/1.7.1.0/prototype.js", id: "prototype" },
                     jquery: { cargada: false, uri: "http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js", id: "jquery" }
    },

    __teclas__: {
        TAB:           9,
        ENTER:         13,
        CURSOR_ARRIBA: 38,
        CURSOR_ABAJO:  40
    },

    /***
      Operaciones de inicialización de la instancia de consola y la página
     ***/
    initPage: function(opciones) {
        this.datos = { prompt: "CIE > ",
                       seccionIFrame: document.getElementById('seccionIFrame'),
                       seccionTexto: document.getElementById('textoHtml'), 
                       seccionHtml: document.getElementById('vistaHtml'),
                       outputConsola: document.getElementById('salidaInterprete'),
                       formInterprete: document.getElementById('formInterprete'),
                       lineaComando: document.getElementById('lineaInterprete'),
                       areaComando: document.getElementById('areaTextoInterprete'),
                       inspectMaxProf: 3 };

        if (opciones && (typeof(opciones) === "array"))
            this.extenderArray(this.datos, opciones); 
        this.historial = [];
        this.posHistorial = -1;
        this.cmdActual = "";
        this.addEventListener(this.datos.lineaComando, 'keyup', this.lineaKeyUp);
        this.addEventListener(this.datos.areaComando, 'keydown', this.areaKeyDown);
        this.addEventListener(this.datos.formInterprete, 'submit', this.formSubmit);
        this.actualizarResultado();
        this.datos.lineaComando.focus();
    },

    extenderArray: function(original, extension) {
        for (var clave in extension)
            original[clave] = extension[clave];
    },

    esIndefinidoONulo: function(valor) { return (valor === undefined) && (valor === null); },

    esDefinidoNoNulo: function(valor) { return !this.esIndefinidoONulo(valor); },

    tieneModificador: function(evento) { return (evento.altKey || evento.ctrlKey || evento.shiftKey); },

    log: function () { 
        var elemento = document.createElement('SPAN');
        var mensaje = "LOG: ";
       
        for (var i=0; i < arguments.length; i++) {
	    mensaje += arguments[i] + " ";
	}
        elemento.setAttribute("class", "logMsg");
        elemento.innerHTML = mensaje + "<br />";
        if (console.log)
            console.log(mensaje);
        this.datos.outputConsola.appendChild(elemento);
        this.scrollSalida();
    },

    addEventListener: function(nodo, tipoEvento, funcion) {
        if (typeof(nodo) === 'string')
            nodo = document.getElementById(nodo);
        if (typeof(tipoEvento) !== 'string')
            throw new Error("'tipoEvento' debe ser una cadena");
        if (/^on.*/.test(tipoEvento))
            tipoEvento = tipoEvento.substr(2);

        this.removeEventListener(nodo, tipoEvento, funcion);
        if (nodo.addEventListener)
            nodo.addEventListener(tipoEvento, funcion, false);
        else if (nodo.attachEvent)
            nodo.attachEvent('on' + tipoEvento, funcion);
    },

    removeEventListener: function(nodo, tipoEvento, funcion) {
        if (typeof(nodo) === 'string')
            nodo = document.getElementById(nodo);
        if (typeof(tipoEvento) !== 'string')
            throw new Error("'tipoEvento' debe ser una cadena");
        if (/^on.*/.test(tipoEvento))
            tipoEvento = tipoEvento.substr(2);

        if (nodo.removeEventListener)
            nodo.removeEventListener(tipoEvento, funcion, false);
        else
            if (nodo.detachEvent)
                nodo.detachEvent('on' + tipoEvento, funcion);
    },

    pararEvento: function(evento) {
        evento.preventDefault();
        if (evento.stop)
            evento.stop();
        else
            if (evento.stopPropagation)
                evento.stopPropagation();
    },

    /***
      Funciones auxiliares de visualización de secciones
     ***/
    /***
      Actualiza el resultado del frame de codigo utilizando el área de texto
     ***/
    actualizarResultado: function() {
        var htmlEscape = this.datos.seccionTexto.value.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        var doc = this.datos.seccionHtml.contentDocument;

        if (doc === undefined || doc === null)
            doc = testFrame.contentWindow.document;
        doc.open();
        doc.write(htmlEscape);
        doc.close();        
    },

    /***
      Carga/descarga la librería seleccionada
     ***/
    cargarLibreria: function(nombre) {
        if (this.esIndefinidoONulo(this.__librerias__[nombre]))
            throw("ExcepciónCIE: La librería <" + nombre + "> no está definida");

        if (!this.__librerias__[nombre].cargada)
            this.__cargarLibreria__(this.__librerias__[nombre]);
        /* FIXME: Pendiente de decisión: ¿se descargarán los scripts?
        else {
                   this.log("descargando " + nombre);
                   this.__descargarLibreria__(this.__librerias__[nombre]);
            }
        */
    },

    /***
      Carga una librería dinámicamente añadiendo un nodo <script> como hijo de <head>
     ***/
    __cargarLibreria__: function(libreria) {
        var e = document.createElement("script");

        e.src = libreria.uri;
        e.id = libreria.id;
        e.type="text/javascript";
        document.getElementsByTagName("head")[0].appendChild(e);
        libreria.cargada = true;
    },

    /***
      Aunque se elimine el nodo <script> de la cabecera, el código
       interpretado sigue vivo.  Una solución meramente demostrativa
       es anular las variables que alojan las clases Base de las
       librerías.  Otra posibilidad: recorrer las variables y
       funciones de la máquina virtual y eliminar/inicializar aquellas
       que no sean del navegador o la consola (pero eso es, cuando
       menos, terrorismo).  Por ahora, únicamente es posible cargar
       librerías, para inicializar se debe recargar.
       FIXME: Pendiente de decisión: ¿se descargarán los scripts?
     ***/
    /*    __descargarLibreria__: function(libreria) {
        var script = document.getElementById(libreria.id);
        document.getElementsByTagName('head')[0].removeChild(script);
        //eval(libreria.claseBase + "= null");
        }, */
    lineaKeyUp: function(evento) {
        var tecla = evento.keyCode || evento.which;
        var self = CIE;

        if (self.tieneModificador(evento))
            return;
        switch (tecla) {
            case self.__teclas__.CURSOR_ARRIBA: self.moverHistorial(-1); break;
            case self.__teclas__.CURSOR_ABAJO : self.moverHistorial(1); break;
            default: return;
        }
        self.pararEvento(evento);
    }, 

    areaKeyDown: function(evento) {
        var tecla = evento.keyCode || evento.wich;
        var self = CIE;

        if (self.tieneModificador(evento) && (tecla === self.__teclas__.ENTER)) {
            self.prepararEjecucionTexto();
            self.pararEvento(evento);
        }
        return;
    },

    moverHistorial: function(offset) {
        if (this.posHistorial === -1) {
            this.cmdActual = this.datos.lineaComando.value;
            if (offset < 0)
                this.posHistorial = (this.historial.length === 0)? 0 : this.historial.length -1;
            else
                this.posHistorial = 0;
        }
        else
            if (((this.posHistorial === this.historial.length -1) && (offset > 0)) ||
                (this.posHistorial === 0) && (offset < 0)) {
                this.datos.lineaComando.value = this.cmdActual;
                this.posHistorial = -1;
                return;
            }
            else
                if ((offset < 0) && (this.posHistorial <= 0))
                    this.posHistorial = this.historial.length;
                else
                    this.posHistorial = Math.abs((this.posHistorial + offset) % this.historial.length);

        this.datos.lineaComando.value = (this.historial.length > 0)? this.historial[this.posHistorial] : this.cmdActual;
    },

    mostrar: function (result, estilo) {
        var salida = document.createElement('SPAN');

        salida.setAttribute("class", estilo);
        salida.innerHTML = result + "<br />";
        this.datos.outputConsola.appendChild(salida);
        this.scrollSalida();
    },

    mostrarComandos: function(result) {
        this.mostrar(this.datos.prompt + result, "comandos");
    },

    mostrarResultado: function(result) {
        this.mostrar(result, "resultado");
    },

    mostrarError: function(e) {
        // Elaborar mensajes de error
        if (typeof(e) !== "object")
            e = new Error(e);

        var html = "<table class='error'><tbody>";
        html += "<tr><th>Excepción</th><td>" + e.message  + "</td></tr>" +
                "<tr><th>Traza de pila</th><td>" + e.stack  + "</td></tr>";
        /*for (var clave in e) {
            var valor = e[clave];

            if (typeof(valor) === "object")
                valor = valor.toString();
            else
                if (typeof(valor) === "function")
                    valor = "Function";
            html += "<tr><th>" + clave + "</th><td>" + valor + "</td></tr>";
        }*/
        html += "</table>";
        this.mostrar(html, "error");
    },

    scrollSalida: function() {
        var e = this.datos.outputConsola.lastChild;

        // FIXME: ¿Es necesario este control?
        if (this.esDefinidoNoNulo(e))
            this.datos.outputConsola.scrollTop += this.datos.outputConsola.scrollHeight;
    },

    formSubmit: function(evento) {
        var self = CIE;

        self.prepararEjecucionLinea();
        self.pararEvento(evento);
    },

    prepararEjecucionLinea: function() {
        var codigo = this.datos.lineaComando.value;

        this.datos.lineaComando.value = "";
        this.mostrarComandos(codigo);
        this.historial.push(codigo);
        this.posHistorial = -1;
        this.cmdActual = "";
        this.mostrarResultado(this.ejecutar(codigo, false));
        return;
    },

    prepararEjecucionTexto: function() {
        var codigo = this.datos.areaComando.value;

        this.mostrarComandos(codigo.replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;"));
        this.mostrarResultado(this.ejecutar(codigo, false));
        this.scrollSalida();
        return;
    },

    /***
        Ejecuta el código recibido. El parámetro indica si debe evaluarse en el contexto window global o interno al iFrame
    ***/
    ejecutar: function(codigo, iFrameCtxt) {
        var result = "";

        if (iFrameCtxt)
            try {
                var iFrame = this.datos.seccionHtml.contentWindow;
                var iFEval = (iFrame.execScript)? iFrame.execScript : iFrame.eval;
                result = iFEval(codigo);
            } catch(e) {
                this.mostrarError(e);
            }
        else
            try {
                result = eval.call(window, codigo);
            } catch(e) {
                this.mostrarError(e);
            }
        return result;
    }
}


/***
    Conjunto de comandos de consola empotrados
***/
window.inspect = function(obj) {
    function __generarIdSeccion__() {
        var idSeccion = "idSeccionInspect-" + Math.round(Math.random()*1000);

        while (document.getElementById(idSeccion))
            idSeccion = "idSeccionInspect-" + Math.round(Math.random()*1000);
        return idSeccion;
    }

    function __inspect__(obj, n) {
        var html = "<table class='inspect'><tbody>";
        var self = CIE;
        var estilo = 'objeto';

        if (obj !== null)
            if (typeof(obj) === "object")
                if (('splice' in obj) && ('join' in obj)) {
                    var idSeccion = __generarIdSeccion__();
                    estilo = 'array';

                    if (n === 1)
                        html+= "<tr><th>&nbsp;</th><td>";

                    html += "[Array]" + "<a class='tirador' onclick=\"var elem = document.getElementById('" +
                            idSeccion + "'); elem.style.display = (elem.style.display === 'none')? 'block' : 'none';" +
                            "this.innerHTML = (elem.style.display === 'none')? '+' : '-'; return false;\">+</a>\n" +
                            "<div id='" + idSeccion + "' style='display: none'>[" + obj + "]</div></td>";
                    if (n === 1)
                        html+= "</td></tr>";
                }
                else {
                    for (var clave in obj) {
                        var valor = obj[clave];
                        var idSeccion = __generarIdSeccion__();

                        if ((typeof(valor) === "object")) {
                            valor = "[Object]" + "<a class='tirador' onclick=\"var elem = document.getElementById('" +
                                    idSeccion + "'); elem.style.display = (elem.style.display === 'none')? 'block' : 'none';" +
                                    "this.innerHTML = (elem.style.display === 'none')? '+' : '-'; return false;\">+</a>\n" +
                                    "<div id='" + idSeccion + "' style='display: none'>" + 
                                    ((n < self.datos.inspectMaxProf)? __inspect__(valor, n + 1) : valor) + "</div>" ;
                        }
                        else
                            if (typeof(valor) === "function") {
                                estilo = 'funcion';
                                valor = "[Function]" + "<a class='tirador' onclick=\"var elem = document.getElementById('" +
                                        idSeccion + "'); elem.style.display = (elem.style.display === 'none')? 'block' : 'none';" +
                                        "this.innerHTML = (elem.style.display === 'none')? '+' : '-'; return false;\">+</a>\n" +
                                        "<div id='" + idSeccion + "' style='display: none'><pre>" + valor.toString() + "</pre></div>";
                            }
                            else {
                                valor = valor;
                            }
                        html += "<tr><th class='" + estilo + "'>" + clave + ": </th><td>" + valor + "</td></tr>";
                    }
                }
            else
                if (typeof(obj) === "function") {
                    estilo = 'funcion';
                    var idSeccion = __generarIdSeccion__();

                    html += "<tr><td class='" + estilo + "'>[Function]" + "<a class='tirador' onclick=\"var elem = document.getElementById('" +
                            idSeccion + "'); elem.style.display = (elem.style.display === 'none')? 'block' : 'none';" +
                            "this.innerHTML = (elem.style.display === 'none')? '+' : '-'; return false;\">+</a>\n" +
                            "<div id='" + idSeccion + "' style='display: none'><pre>" + obj.toString() + "</pre></div></td></tr>";
                }
                else
                    html+= "<tr><td>" + obj + "<td></tr>";
        html += "</tbody></table>";
        return html;
    }
    var self = CIE;
    self.mostrar(__inspect__(obj, 1), "");
}

/***
   Muestra el mensaje <msg> en la consola
 ***/
window.println = function(msg) {
    CIE.mostrar(msg);
}

/***
   Limpia la consola
 ***/
window.clear = function() {
    var obj = CIE.datos.outputConsola;
    var ultimo = obj.lastChild;
    var actual = obj.firstChild;

    while (ultimo !== actual) {
      obj.removeChild(actual);
      actual = obj.firstChild;
    }
}

/***
   Fuerza la ejecución de código dentro del contexto del iFrame
 ***/
window.withIframe = function(codigo) {
    var self = CIE;
    var result = self.ejecutar(codigo, true);

    self.mostrar(result);
}
