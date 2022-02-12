// VARIABLES

let intervalo; // Para el setInterval que funciona de generador de pulsos
let punteroGlobal = 0; // Para el cursor que muestra el pulso actual
let tempoGlobal = 120; // Para el tempo :p
let contadorSecuencias = 0; // Para llevar cuenta del id de las secuencias
let playing = false; // Para determinar si está reproduciendo o no
let secuenciaActual; // Para redefinir más adelante y cambiar dinámicamente para modificar la
// secuencia en pantalla

const pulsosGlobal = 4;
const pokeApiUrl = "https://pokeapi.co/api/v2/berry/";

class Secuencia {
    constructor(idSecuencia) {
        this.secuencia = [
            //cada fila representa un pulso y cada columna una altura, es como si vieras
            //el secuenciador de costado, por eso las coordenadas son j-i (pulso-altura) en vez
            //de i-j (altura-pulso)
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
        ];
        this.id = idSecuencia;
        this.instrumento = new Instrumento();
        this.muted = false;
    }

    limpiarSecuencia() {
        // Iterá sobre la secuencia y cambiá todo a falso, también la apariencia de la misma
        for (let pulso = 0; pulso < this.secuencia.length; pulso++) {
            for (let altura = 0; altura < 8; altura++) {
                this.secuencia[altura][pulso] = false;
                let celula = document.getElementById(`cell${altura}${pulso}-${this.id}`);
                celula.setAttribute("class", "cell");
                celula.setAttribute("onclick", `celulaPresionada(${altura},${pulso},${this.id})`);
            }
        }
    }

    cambiarCelula(pulso, altura) {
        // Si la celula elegida es verdadera, cambiala a falso y viceversa
        if (this.secuencia[altura][pulso]) {
            this.secuencia[altura][pulso] = false;
        } else {
            this.secuencia[altura][pulso] = true;
            this.instrumento.reproducir([altura]);
        }
    }

    chequearPulso(puntero) {
        // Iterá sobre los elementos del array correspondiente al pulso y devolvé un array con
        // los elementos que den verdadero
        let arrayPulso = [];
        for (let altura = 0; altura < 8; altura++) {
            if (this.secuencia[altura][puntero]) {
                arrayPulso.push(altura);
            }
        }
        return arrayPulso;
    }

    togglearMute() {
        // Si el atributo muted == true, convertilo a false, desmuteando la secuencia.
        if (this.muted) {
            this.muted = false;
        } else {
            // En caso contrario, volvelo a true y muteala
            this.muted = true;
        }
    }

    guardarSecuencia = (pulsos, accion) => {
        // Por cada célula verdadera agrega un 1 al string, por cada célula falsa, un 0. Cada nuevo pulso
        // es representado por un "-"
        let secuenciaBin = "";
        for (let altura = 0; altura < pulsos * 4; altura++) {
            for (let pulso = 0; pulso < 8; pulso++) {
                if (this.secuencia[pulso][altura]) {
                    secuenciaBin += 1;
                } else {
                    secuenciaBin += 0;
                }
            }
            secuenciaBin += "-";
        }
        // Dependiendo de la variable acción, se define qué se hace con la secuencia
        if (accion == "localStorage") {
            // Agregale el tempo al final
            secuenciaBin += tempoGlobal;
            // Guardala en el localStorage con el ID de la secuencia en la que la guardaste
            localStorage.setItem(`secuencia${this.id}`, secuenciaBin);
        } else if (accion == "return") {
            // No es necesario agregarle el tempo ya que se guarda en otro lado
            // Devolvela a quien te la pidió
            return secuenciaBin;
        }
    };

    recuperarSecuencia = () => {
        const secuenciaBin = localStorage.getItem(`secuencia${this.id}`);
        let puntero = 0;
        // Contá cuántos guiones hay para entender cuántos pulsos hay
        // (Técnicamente por ahora no es necesario, pero la idea es hacer
        // secuencias con cantidad de pulsos variables, 3, 4, 5 pulsos,
        // entonces programé esto para que sea expandible)
        for (let i = 0; i < secuenciaBin.length; i++) {
            if (secuenciaBin[i] == "-") {
                puntero++;
            }
        }
        const nroPulsos = puntero;
        // Reutilizamos la variable puntero
        puntero = 0;
        // Iteramos sobre la secuencia guardada
        for (let pulso = 0; pulso < nroPulsos; pulso++) {
            for (let altura = 0; altura < 8; altura++) {
                let celula = document.getElementById(`cell${altura}${pulso}-${this.id}`);
                //Desactivala por default
                celula.setAttribute("class", "cell");
                celula.setAttribute("onclick", `celulaPresionada(${altura},${pulso},${this.id})`);
                this.secuencia[altura][pulso] = false;
                //Si es 1, activala
                if (secuenciaBin[puntero] == 1) {
                    celula.classList.add("selected");
                    this.secuencia[altura][pulso] = true;
                }
                puntero++;
            }
            puntero++; //para compensar por los guiones
        }
        // Recortá la secuencia guardada por donde quedó el puntero para dejar solamente
        // la info de tempo
        const tempoGuardado = secuenciaBin.substring(puntero);
        tempoGlobal = parseInt(tempoGuardado);
        // Cambiá la apariencia del slider
        $("#sliderTempo").val(tempoGuardado);
        $("#sliderTempo").trigger("change");
    };
}

class Instrumento {
    constructor() {
        // Cargá los archivos de audio del instrumento por default: 00
        this.g = new Audio("./res/audio/00-1.wav");
        this.a = new Audio("./res/audio/00-2.wav");
        this.c = new Audio("./res/audio/00-3.wav");
        this.d = new Audio("./res/audio/00-4.wav");
        this.e = new Audio("./res/audio/00-5.wav");
        this.f = new Audio("./res/audio/00-6.wav");
        this.gu = new Audio("./res/audio/00-7.wav");
        this.au = new Audio("./res/audio/00-8.wav");
        this.numeroInstrumento = 0;
        this.tipoInstrumento = 0;
        this.volumen = 100;
    }

    cambiarInstrumento(nroInstr, tipoInstr) {
        // Cargá los nuevos archivos de audio
        this.g = new Audio(`./res/audio/${tipoInstr}${nroInstr}-1.wav`);
        this.a = new Audio(`./res/audio/${tipoInstr}${nroInstr}-2.wav`);
        this.c = new Audio(`./res/audio/${tipoInstr}${nroInstr}-3.wav`);
        this.d = new Audio(`./res/audio/${tipoInstr}${nroInstr}-4.wav`);
        this.e = new Audio(`./res/audio/${tipoInstr}${nroInstr}-5.wav`);
        this.f = new Audio(`./res/audio/${tipoInstr}${nroInstr}-6.wav`);
        this.gu = new Audio(`./res/audio/${tipoInstr}${nroInstr}-7.wav`);
        this.au = new Audio(`./res/audio/${tipoInstr}${nroInstr}-8.wav`);
        // Actualizá los valores del instrumento
        this.numeroInstrumento = nroInstr;
        this.tipoInstrumento = tipoInstr;
        // Ajustá el volumen
        this.cambiarVolumen(this.volumen);
    }

    reproducir(arrayPulso) {
        // Iterá sobre el array y según los datos que te traiga,
        // reproducí las notas correspondientes
        for (let i = 0; i < arrayPulso.length; i++) {
            if (arrayPulso[i] == 7) {
                // Este sistema recarga el audio si necesita ser reproducido antes
                // de haber terminado de reproducirse, sí, se generan clicks,
                // pero para hacer que eso no pase tendría que crear nuevos
                // objetos de audio o poder controlarlo más a fondo (como fade ins y fade outs)
                // cosa que no sé y probablemente consumiría muchos recursos en esta
                // app que ya está bastante cargada jajaja
                // Funciona así: los archivos ya están cargados, y si el currentTime,
                // o sea por dónde está el puntero que lee el archivo, es distinto
                // a 0, se reproduce el archivo. Ahora, si es distinto, quiere decir que
                // se está reproduciendo, entonces lo recarga antes de reproducirlo
                // Sin este mecanismo si tratas de volver a reproducir un archivo
                // antes de que termine, no se reproduce.
                if (this.g.currentTime != 0) {
                    this.g.load();
                }
                this.g.play();
            }
            if (arrayPulso[i] == 6) {
                if (this.a.currentTime != 0) {
                    this.a.load();
                }
                this.a.play();
            }
            if (arrayPulso[i] == 5) {
                if (this.c.currentTime != 0) {
                    this.c.load();
                }
                this.c.play();
            }
            if (arrayPulso[i] == 4) {
                if (this.d.currentTime != 0) {
                    this.d.load();
                }
                this.d.play();
            }
            if (arrayPulso[i] == 3) {
                if (this.e.currentTime != 0) {
                    this.e.load();
                }
                this.e.play();
            }
            if (arrayPulso[i] == 2) {
                if (this.f.currentTime != 0) {
                    this.f.load();
                }
                this.f.play();
            }
            if (arrayPulso[i] == 1) {
                if (this.gu.currentTime != 0) {
                    this.gu.load();
                }
                this.gu.play();
            }
            if (arrayPulso[i] == 0) {
                if (this.au.currentTime != 0) {
                    this.au.load();
                }
                this.au.play();
            }
        }
    }

    cambiarVolumen(nuevoVolumen) {
        this.volumen = nuevoVolumen;
        const volumen = nuevoVolumen / 100;
        this.g.volume = volumen;
        this.a.volume = volumen;
        this.c.volume = volumen;
        this.d.volume = volumen;
        this.e.volume = volumen;
        this.f.volume = volumen;
        this.gu.volume = volumen;
        this.au.volume = volumen;
    }
}

const playGlobal = (ms) => {
    // Limpiá el intervalo
    clearInterval(intervalo);
    // Si la variable global playing es verdadera, o sea, está reproduciendo,
    // cambiala a false, y no hagas nada más ya que ya limpiaste el intervalo
    if (playing) {
        playing = false;
    } else {
        // De caso contrario, o sea, no se está reproduciendo,
        // creá un nuevo intervalo con los milisegundos provistos
        // y marcá playing como true
        intervalo = setInterval(playCursor, ms);
        playing = true;
    }
};

const playCursor = () => {
    // Recuperá el id del elemento puntero que está siendo mostrado
    let punteroId = `cellPuntero${punteroGlobal}`;
    // Agregale la clase "active"
    document.getElementById(punteroId).classList.add("active");
    if (punteroGlobal == 0) {
        // Si el puntero global es 0, entonces el anterior es el último sub-pulso
        // de la secuencia, si cada pulso tiene 4 sub-pulsos hay que multiplicar
        // la cantidad de pulsos por 4 y restarle 1 ya que el puntero arranca en 0
        punteroId = `cellPuntero${punteroGlobal + pulsosGlobal * 4 - 1}`;
        // Sacale la clase "active" para volver esa célula a su estado original
        document.getElementById(punteroId).classList.remove("active");
    } else {
        // En caso contrario, simplemente restale 1 al puntero global para
        // sacarle la clase "active" a la célula anterior a la actual
        punteroId = `cellPuntero${punteroGlobal - 1}`;
        document.getElementById(punteroId).classList.remove("active");
    }
    // Iterá sobre las secuencias para reproducirlas
    for (let i = 0; i < secuencias.length; i++) {
        // Sólo si la secuencia no está muteada reproducí su contenido
        if (!secuencias[i].muted) {
            // Recuperá qué notas tocar
            let arrayPulso = secuencias[i].chequearPulso(punteroGlobal);
            // Reproducí esas notas
            secuencias[i].instrumento.reproducir(arrayPulso);
        }
    }
    // Incrementá el puntero
    punteroGlobal++;
    if (punteroGlobal >= pulsosGlobal * 4) {
        // Si es mayor o igual a la cantidad de pulsos por 4
        // entonces volvela a 0 para volver a empezar la secuencia
        punteroGlobal = 0;
    }
};

const mostrarSeq = (pulsos, secuencia, secuenciasArray) => {
    // Mostrá la tabla
    crearTabla(pulsos, secuencia);
    // Actualizá las flechas
    actualizarFlechas(secuencia);
    // Actualizá el visor de instrumentos
    actualizarVisorInstrumento();
    // Actualizá el volumen
    actualizarSliderVolumen();
    // Ahora actualizá el botón de mute
    cambiarAparienciaBotonMute();
    // Actualizá el contador de puntitos debajo de la secuencia
    actualizarPuntitos(secuencia, secuenciasArray);
};

const crearTabla = (pulsos, secuencia) => {
    // Si bien por ahora es innecesario crear la tabla html cada vez
    // que se visualiza, esto es de nuevo una implementación para que
    // la app sea expandible a distintas cantidades de pulsos
    let visor = document.getElementById("secuencia");
    // Obtené el elemento donde se va a visualizar la secuencia y limpialo
    visor.innerHTML = "";
    // Ahora creá una tabla html con la clase e id tabla
    let tabla = document.createElement("table");
    tabla.setAttribute("class", "tabla");
    tabla.setAttribute("id", "tabla");
    // Creá estas variables cuyo contenido va a cambiar, para seguir
    // creando el html
    let fila;
    let celula;
    let circulito;
    // Secuencia principal
    // Iterá 8 veces (cantidad de filas)
    for (let i = 0; i < 8; i++) {
        // Creá un table row con clase fila e id row + número de fila
        fila = document.createElement("tr");
        fila.setAttribute("class", "fila");
        fila.setAttribute("id", `row${i}`);
        // Iterá la cantidad de pulsos * 4 (sub-pulsos) para crearlos
        for (let j = 0; j < pulsos * 4; j++) {
            // Creá un div que la célula va a contener
            circulito = document.createElement("div");
            circulito.classList.add("circulito");
            // Creá la célula contenedora
            celula = document.createElement("td");
            celula.setAttribute("class", "cell");
            // Y ponele el id con las coordenadas correspondientes y secuencia a la que pertenece
            celula.setAttribute("id", `cell${i}${j}-${secuencia.id}`);
            // Agergale el método para que cuando la clickees cambie de estado
            celula.setAttribute("onclick", `celulaPresionada(${i},${j},${secuencia.id})`);
            // Si la célula debería estar seleccionada según la secuencia,
            // seleccionala.
            if (secuencia.secuencia[i][j]) {
                celula.classList.add("selected");
            }
            // Concatená los elementos y andá agregándolos al html
            celula.appendChild(circulito);
            fila.appendChild(celula);
        }
        tabla.appendChild(fila);
    }
    visor.appendChild(tabla);

    //Barra de puntero
    // Reutilizá la variable tabla
    tabla = "";
    // Vaciala y creá una nueva, ahora para la barra del puntero
    tabla = document.createElement("table");
    tabla.setAttribute("class", "tabla");
    tabla.setAttribute("id", "puntero");
    fila = "";
    // Como tiene una sola fila hay que crear solamente un table row
    fila = document.createElement("tr");
    fila.setAttribute("class", "fila puntero");
    fila.setAttribute("id", "rowPuntero");
    // Ahora creá un table data por cada sub-pulso (pulsoGlobal*4)
    for (let i = 0; i < pulsos * 4; i++) {
        celula = document.createElement("td");
        celula.setAttribute("class", "cell row");
        celula.setAttribute("id", `cellPuntero${i}`);
        // Este método es para resetear el puntero manualmente al cliquear la
        // célula puntero que se quiera
        celula.setAttribute("onclick", `cambiarPuntero(${i})`);
        // Agregalo al table row
        fila.appendChild(celula);
    }
    // Insertá el table row en la tabla
    tabla.appendChild(fila);
    // Concatená la tabla en el visor
    visor.appendChild(tabla);
};

const actualizarFlechas = (secuencia) => {
    // Para controlar la apariencia de las flechas que seleccionan las secuencias
    if (secuencia.id == 0) {
        // Si la id es 0 quiere decir que es la primera y no hay más
        // secuencias hacia la izquierda. Activá la flecha derecha,
        $("#flechaDer").addClass("activa");
        // Y desactivá la flecha izquierda
        $("#flechaIzq").removeClass("activa");
        $("#flechaIzq").attr("disabled", "disabled");
    } else if (secuencia.id == secuencias.length - 1) {
        // Si la id es el largo del array de secuencias - 1 quiere decir
        // que es la última y no hay más hacia la derecha. Activá la flecha izquierda,
        $("#flechaIzq").addClass("activa");
        // Y desactivá la derecha
        $("#flechaDer").removeClass("activa");
        $("#flechaDer").attr("disabled", "disabled");
    } else {
        // En caso contrario, es una de la(s) secuencia(s) del medio
        // Activá ambas flechas a través de su clase
        $(".flecha").addClass("activa");
        $(".flecha").removeAttr("disabled");
    }
};

const actualizarVisorInstrumento = () => {
    // Refrescá el visor del instrumento
    $("#imgInstr").attr(
        "src",
        `res/img/i${secuenciaActual.instrumento.tipoInstrumento}${secuenciaActual.instrumento.numeroInstrumento}.png`
    );
};

const cambiarAparienciaBotonMute = () => {
    // Si la secuencia está muteada hacé que el botón diga sonar y tenga un ícono
    if (secuenciaActual.muted) {
        $("#btnMute").children().text("Sonar");
        $("#btnMute").children().attr("class", "bi bi-volume-up");
    } else {
        // De lo contrario (no está muteada) hacé que diga silenciar y tenga otro ícono
        $("#btnMute").children().text("Silenciar");
        $("#btnMute").children().attr("class", "bi bi-volume-mute");
    }
};

// Esta función se encarga de mostrar correctamente los puntitos debajo de las secuencias
const actualizarPuntitos = (secuenciaActual, secuenciasArray) => {
    console.log("cambiando puntitos...");
    // Primero borrá los puntitos que haya
    $("#puntitos").html("");
    // Luego contá cuántas secuencias hay
    for (let i = 0; i < secuenciasArray.length; i++) {
        // Por cada secuencia agregá un puntito
        $("#puntitos").append(`<small><i class="punto bi bi-dot"></i><small>`);
        // Si la id de la secuencia iterada coincide con la que se está visualizando,
        // hacé que lo marque, cambiándole el estilo al ícono dentro del último small
        // en el div
        if (secuenciaActual.id == i) {
            $("#puntitos small:last-child").children("i").addClass("activo");
        }
    }
};

const actualizarSliderVolumen = () => {
    // Actualizá el valor del slider
    $("#sliderVolume").val(secuenciaActual.instrumento.volumen);
    // Y luego del número al lado
    $("#sliderVolume").next().text(secuenciaActual.instrumento.volumen);
};

const celulaPresionada = (i, j, id) => {
    // Recuperá la célula presionada por sus coordenadas
    let celula = document.getElementById(`cell${i}${j}-${id}`);
    if (secuenciaActual.secuencia[i][j]) {
        //Si está seleccionada, desactivala
        celula.setAttribute("class", "cell");
    } else {
        //Si no está seleccionada, activala
        celula.classList.add("selected");
    }
    celula.setAttribute("onclick", `celulaPresionada(${i},${j},${id})`);
    // Cambiá el valor en el array
    secuenciaActual.cambiarCelula(j, i);
};

// Esta función guarda la info de instrumento de la secuencia que está
// siendo visualizada, puede ser recuperada luego ya que se guarda en el
// localStorage
const guardarInstrumento = () => {
    // Meté los datos de instrumento en un array y convertilo en JSON
    let instrumentoJson = [
        secuenciaActual.instrumento.numeroInstrumento,
        secuenciaActual.instrumento.tipoInstrumento,
    ];
    instrumentoJson = JSON.stringify(instrumentoJson);
    // Guardalo en el localStorage
    localStorage.setItem(`instrumento${secuenciaActual.id}`, instrumentoJson);
};

const cargarInstrumento = () => {
    // Recuperá la info del instrumento actual del localStorage
    let instrumentoJson = localStorage.getItem(`instrumento${secuenciaActual.id}`);
    instrumentoJson = JSON.parse(instrumentoJson);
    // Como es un array con dos datos, cambiá el instrumento actual según dichos datos
    secuenciaActual.instrumento.cambiarInstrumento(instrumentoJson[0], instrumentoJson[1]);
};

const guardarPreset = (nombrePreset) => {
    let secuenciasConcatenadas = "";
    let instrumentosConcatenados = "";
    for (let i = 0; i < secuencias.length; i++) {
        // Iterá por cada secuencia y agregá la secuencia convertida a "binario"
        // Luego poné un "!" para indicar que finalizó esa secuencia
        let secuenciaAGuardar = secuencias[i].guardarSecuencia(pulsosGlobal, "return");
        secuenciasConcatenadas += secuenciaAGuardar;
        secuenciasConcatenadas += "!";
        // Concatená los números de instrumento y tipo de instrumento junto al volumen, 
        // con un guión en el medio y un "!" al final para indicar
        //  que hay que cambiar de instrumento
        instrumentosConcatenados += secuencias[i].instrumento.numeroInstrumento;
        instrumentosConcatenados += "-";
        instrumentosConcatenados += secuencias[i].instrumento.tipoInstrumento;
        instrumentosConcatenados += "-";
        instrumentosConcatenados += secuencias[i].instrumento.volumen;
        instrumentosConcatenados += "!";
    }
    let tempo = tempoGlobal;
    // Creá un objeto con los datos almacenados
    let preset = {
        secuencias: secuenciasConcatenadas,
        instrumentos: instrumentosConcatenados,
        tempo: tempo,
    };
    // Guardalo en el localStorage como un JSON con el prefijo seqpreset- para diferenciarlo
    // de otras cosas almacenadas
    localStorage.setItem("seqpreset-" + nombrePreset, JSON.stringify(preset));
};

const cargarPreset = (presetKey, secuenciaActual) => {
    // Recuperá el JSON del localStorage
    const preset = JSON.parse(localStorage.getItem(presetKey));
    const secuenciasConcatenadas = preset.secuencias;
    const instrumentosConcatenados = preset.instrumentos;
    // Pasá el tempo del preset a la app, cambiá el valor del slider y
    // dispará el cambio del visor
    tempoGlobal = preset.tempo;
    $("#sliderTempo").val(tempoGlobal);
    $("#sliderTempo").trigger("change");
    // Recuperamos la secuencias e instrumentos iterando los strings, hacemos dos punteros para leerlos
    let punteroSecuencias = 0;
    let punteroInstrumentos = 0;
    for (let i = 0; i < secuencias.length; i++) {
        let pulso = 0;
        // Cada secuencia indica su finalización con un "!", entonces se mantiene i, el número
        // de secuencia siendo modificada del array, hasta que aparezca un "!"
        while (secuenciasConcatenadas[punteroSecuencias] != "!") {
            let altura = 0;
            for (let j = 0; j < 8; j++) {
                if (secuenciasConcatenadas[punteroSecuencias] == 1) {
                    // Si es 1, hace que sea positiva
                    secuencias[i].secuencia[altura][pulso] = true;
                } else {
                    // Si no, o sea si es 0, hacé que sea negativa
                    secuencias[i].secuencia[altura][pulso] = false;
                }
                // Avanzamos a la siguiente altura
                altura++;
                punteroSecuencias++;
            }
            // Avanzamos un pulso (el "-" en el string)
            pulso++;
            punteroSecuencias++;
        }
        punteroSecuencias++;
        // Ahora recuperamos la info de instrumentos
        let nroInstr = parseInt(instrumentosConcatenados[punteroInstrumentos]);
        // Para compensar el número y el guión, probablemente saque esto en un futuro
        punteroInstrumentos += 2;
        let tipoInstr = parseInt(instrumentosConcatenados[punteroInstrumentos]);
        // Confirmá el cambio de instrumento
        secuencias[i].instrumento.cambiarInstrumento(nroInstr, tipoInstr);
        // Para compensar el número y el guión
        punteroInstrumentos += 2;
        let volumenInstr = "";
        // Ahora leé la info de volumen de cada instrumento.
        while (instrumentosConcatenados[punteroInstrumentos] != "!") {
            volumenInstr += instrumentosConcatenados[punteroInstrumentos];
            punteroInstrumentos++;
        }
        // Confirmá el cambio de volumen
        secuencias[i].instrumento.cambiarVolumen(parseInt(volumenInstr));
        // Para compensar el "!"
        punteroInstrumentos++;
    }
    // Refrescá la secuencia actual así se visualizan los cambios
    mostrarSeq(pulsosGlobal, secuenciaActual, secuencias);
};

const cambiarPuntero = (nuevoPuntero) => {
    // Cambiá el puntero global al puntero dado
    punteroGlobal = nuevoPuntero;
    // Sacale la clase active a todos los elementos de clase cell
    // o sea, las células de la grilla. Esto es para que no quede seleccionada
    // la célula donde estaba antes el puntero
    $(".cell").removeClass("active");
    // Agregale la clase activa a la célula que tiene le nuevo valor de puntero
    $(`#cellPuntero${nuevoPuntero}`).addClass("active");
}

// Creá el array de secuencias y agregale tres secuencias
const secuencias = [];
secuencias.push(new Secuencia(contadorSecuencias));
contadorSecuencias++;
secuencias.push(new Secuencia(contadorSecuencias));
contadorSecuencias++;
secuencias.push(new Secuencia(contadorSecuencias));
// Hacé que la secuencia actual sea la primera del array
secuenciaActual = secuencias[0];

// El método ready está recién acá porque si lo pongo antes choca con otras partes del código y lo rompe

$(() => {
    // PARA CAMBIAR LA SECUENCIA
    $("#flechaDer").click(function () {
        // Si el id de la secuencia actual es menor a la cantidad de secuencias - 1, es decir,
        // no es la última, tomá su id, incrementalo, y hacé que la secuencia actual sea la del
        // nuevo id.
        if (secuenciaActual.id < secuencias.length - 1) {
            let nuevoIdSeq = secuenciaActual.id;
            nuevoIdSeq++;
            secuenciaActual = secuencias[nuevoIdSeq];
        }
        // Ahora refrescá la vista
        mostrarSeq(pulsosGlobal, secuenciaActual, secuencias);
    });

    $("#flechaIzq").click(function () {
        // Si el id de la secuencia actual es mayor a cero, es decir, no es la primera, tomá su id,
        // decrementalo, y hacé que la secuencia actual sea la del nuevo id.
        if (secuenciaActual.id > 0) {
            let nuevoIdSeq = secuenciaActual.id;
            nuevoIdSeq--;
            secuenciaActual = secuencias[nuevoIdSeq];
        }
        // Ahora refrescá la vista
        mostrarSeq(pulsosGlobal, secuenciaActual, secuencias);
    });

    // BOTON PLAY

    $("#btnPlay").click(function () {
        // Ejecutá la función playGlobal dándole como parámetro la cantidad de milisegundos correspondiente
        // al tempoGlobal y dividilo por cuatro para obtener la subdivisión de semicorchea
        playGlobal(60000 / tempoGlobal / 4);
    });

    //PARA CAMBIAR EL INSTRUMENTO

    $("#btnInstrument").click(function () {
        // Si el número de instrumento del instrumento actual es menor a 3, incrementalo,
        if (secuenciaActual.instrumento.numeroInstrumento < 3) {
            secuenciaActual.instrumento.numeroInstrumento++;
            // luego ejecutá la función para volver a cargar los sonidos
            secuenciaActual.instrumento.cambiarInstrumento(
                secuenciaActual.instrumento.numeroInstrumento,
                secuenciaActual.instrumento.tipoInstrumento
            );
        } else {
            // Si el número no es menor a 3 (o sea 3), cambialo a 0 para resetear el loop
            secuenciaActual.instrumento.numeroInstrumento = 0;
            // Ejecutá la función para volver a cargar los sonidos.
            secuenciaActual.instrumento.cambiarInstrumento(
                secuenciaActual.instrumento.numeroInstrumento,
                secuenciaActual.instrumento.tipoInstrumento
            );
        }
        // Actualizá el visor de instrumentos
        actualizarVisorInstrumento();
    });

    // La función de tipo de instrumento funciona exactamente igual que la anterior
    // pero en vez de cambiar el instrumento cambia el tipo de instrumento, pensé en
    // unificarlas pero no encontré cómo unificarlas dejando la simplicidad del código

    $("#btnInstrumentType").click(function () {
        if (secuenciaActual.instrumento.tipoInstrumento < 3) {
            secuenciaActual.instrumento.tipoInstrumento++;
            secuenciaActual.instrumento.cambiarInstrumento(
                secuenciaActual.instrumento.numeroInstrumento,
                secuenciaActual.instrumento.tipoInstrumento
            );
        } else {
            secuenciaActual.instrumento.tipoInstrumento = 0;
            secuenciaActual.instrumento.cambiarInstrumento(
                secuenciaActual.instrumento.numeroInstrumento,
                secuenciaActual.instrumento.tipoInstrumento
            );
        }
        // Actualizá el visor de instrumentos
        actualizarVisorInstrumento();
    });

    $("#btnSaveInstr").click(function () {
        guardarInstrumento();
    });

    $("#btnLoadInstr").click(function () {
        cargarInstrumento();
        actualizarVisorInstrumento();
    });

    // BOTONES CONTROLADORES DE LA SECUENCIA

    $("#btnMute").click(function () {
        secuenciaActual.togglearMute();
        cambiarAparienciaBotonMute();
    });

    $("#btnClean").click(function () {
        secuenciaActual.limpiarSecuencia();
    });

    $("#btnSave").click(function () {
        secuenciaActual.guardarSecuencia(pulsosGlobal, "localStorage");
    });

    $("#btnLoad").click(function () {
        secuenciaActual.recuperarSecuencia();
    });

    //SLIDER DE TEMPO

    $("#sliderTempo").on("change", function () {
        // Actualizá el tempoGlobal con el valor introducido
        // por el usuario
        tempoGlobal = this.value;
        // Actualizá el visor del tempo
        $(this).next().text(tempoGlobal);
        // Si la app está reproduciendo, reseteá el intervalo disparando el boton de click
        // para actualizar el tempo
        if (playing) {
            playing = false;
            $("#btnPlay").trigger("click");
        }
    });

    // Esta función es para detectar TODOS los cambios hechos al slider
    // así se representa dinámicamente y no sólo cuando lo soltamos
    $(document).on("input", "#sliderTempo", function () {
        $(this).next().text(this.value);
    });

    // SLIDER DE VOLUMEN

    $("#sliderVolume").on("change", function () {
        // Cambiá el volumen del instrumento actual por el valor
        // provisto
        secuenciaActual.instrumento.cambiarVolumen(this.value);
        // Actualizá el número visto por el usuario
        $(this).next().text(this.value);
    });

    // Esta función es para detectar TODOS los cambios hechos al slider
    // así se representa dinámicamente y no sólo cuando lo soltamos
    $(document).on("input", "#sliderVolume", function () {
        secuenciaActual.instrumento.cambiarVolumen(this.value);
        $(this).next().text(this.value);
    });

    //SIDEBAR

    $("#btnMenu").click(function () {
        if (!$("#menuSidebar").is(":animated")) {
            // Si el ancho de la barra lateral es 70px significa que está cerrada, si esto es cierto,
            // desplegala agregándole 200px en 200 milisegundos.
            if ($("#menuSidebar").css("width") == "70px") {
                $("#menuSidebar").animate(
                    {
                        width: "+=200",
                    },
                    200,
                    // Luego, en el callback de la animación, desplegá los botones de la barra
                    function () {
                        $(".btn2").toggle(200);
                        $(".menuTitle").toggle(200);
                    }
                );
            } else {
                // Si la barra está abierta, cerrala
                $("#menuSidebar").animate(
                    {
                        width: "-=200",
                    },
                    200,
                    // Y cerrá los botones
                    function () {
                        $(".btn2").toggle(200);
                        $(".menuTitle").toggle(200);
                    }
                );
                // Si el input de presets está abierto cuando cerrás la barra, cerralo también
                if ($("#presetInputDiv").css("display") != "none") {
                    $("#presetInputDiv").hide(200);
                }
                // Lo mismo con el visor de presets, además vacialo así no se acumulan cada vez que lo abrís,
                // ya que se carga dinámicamente del localStorage
                if ($("#presetLoadDiv").css("display") != "none") {
                    $("#presetLoadDiv").hide(200);
                    $("#selectPreset").empty();
                }
            }
        }
    });

    $("#btnSavePreset").click(function () {
        // Si el div donde se va a ver el texto no es visible,
        // conseguí un nuevo nombre de la api, si es visible no busques nada
        if ($("#presetInputDiv").css("display") == "none") {
            getBerryFromApi();
        }
        // Toggleá el div
        $("#presetInputDiv").toggle(200);
    });

    $("#btnCycleName").click(function (e) {
        // Prevent Default para que no se recargue la página
        e.preventDefault();
        // Sacá un nuevo nombre de la api
        getBerryFromApi();
    });

    $("#btnSaveName").click(function (e) {
        // Prevent default para que no se recargue la página
        e.preventDefault();
        // Guardá el preset con el valor de la entrada de texto
        guardarPreset($("#presetNameInput").val());
        // Cerrá el menú "haciendo click" en el botón
        $("#btnMenu").trigger("clcik");
    });

    // COMUNICACION CON LA API

    const getBerryFromApi = () => {
        // Generá un número random entre 0 y 20 para el nombre de la baya
        const berryId = parseInt(Math.random() * 20);
        // Generá otro número entre 0 y 5 para el sabor de la baya
        const flavorId = parseInt(Math.random() * 5);
        // Le agregamos la id al final siguiendo la documentacion de la API
        const url = pokeApiUrl + berryId;
        $.ajax({
            dataType: "json",
            url: url,
            type: "GET",
            success: function (data) {
                // Hacé que el valor del input sea la baya cuyo id random generamos antes, seguido por un guión
                // y el sabor, con su id también generado aleatoriamente recién
                $("#presetNameInput").val(`${data.name}-${data.flavors[flavorId].flavor.name}`);
                // Ponemos el cursor sobre el campo de texto, para dar a entender que se puede
                // modificar
                $("#presetNameInput").focus();
            },
        });
    };

    // CARGADO DE PRESETS

    $("#btnLoadPreset").click(function () {
        // Si el visor de opciones es visible
        if ($("#presetLoadDiv").css("display") != "none") {
            // Vaciá las opciones
            $("#selectPreset").empty();
        } else {
            // Si no, cargá las opciones
            for (let i = 0; i < localStorage.length; i++) {
                // Iterá por el localStorage, si los primeros 10 caracteres son iguales a
                // "seqpreset-", entonces es un preset y hay que agregarlo a la lista
                if (localStorage.key(i).substring(0, 10) === "seqpreset-") {
                    // Agregá la opción del preset y sacale los primeros diez caracteres, así
                    // no se muestra el "seqpreset-"
                    $("#selectPreset").append(`<option>${localStorage.key(i).substring(10)}</option>`);
                }
            }
        }
        // Mostrá las opciones
        $("#presetLoadDiv").toggle(200);
    });

    $("#btnLoadPresetFromStorage").click(function (e) {
        // Prevent default para que no se recargue la página
        e.preventDefault();
        // Agregale "seqpreset-" al principio del valor del select para que el método
        // cargarPreset encuentre el preset en el localStorage
        cargarPreset("seqpreset-" + $("#selectPreset").val(), secuenciaActual);
    });

    // Función para inputs del teclado
    $(window).keydown(function (e) {
        // Si el keyCode == 32 (espacio), clickeá el botón de play
        if (e.keyCode == 32) {
            // Prevent default para que no scrollee al apretar espacio
            e.preventDefault();
            $("#btnPlay").trigger("click");
        }
    });
});

// Para inicializar la APP
mostrarSeq(pulsosGlobal, secuenciaActual, secuencias);
console.log(secuencias);
