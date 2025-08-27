// === Estado global ===
const poolRestantes = {};
let nivelActual = "";
let preguntasSeleccionadas = [];
let indicePregunta = 0;
let respuestasUsuario = [];
const LIMITE_PREGUNTAS = 5;

// === Utils ===
function mezclarArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normaliza(t) {
  return (t ?? "").toString().trim().replace(/\s+/g, " ");
}

function getTextoCorrecto(preg) {
  if (typeof preg.answer === "number") return preg.options[preg.answer];
  return preg.answer;
}

function pronunciarTexto(texto) {
  if (!texto) return;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "en-US";
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// === Iniciar test ===
function iniciarTest(nivel) {
  nivelActual = nivel;
  reiniciarVistaTest();
  if (!preguntas || !preguntas[nivel] || preguntas[nivel].length === 0) {
    alert("No hay preguntas para el nivel " + nivel);
    return;
  }
  if (!poolRestantes[nivel] || poolRestantes[nivel].length === 0) {
    poolRestantes[nivel] = [...preguntas[nivel]];
  }

  seleccionarPreguntas();
  mostrarPregunta();
}

// === Seleccionar 5 preguntas aleatorias ===
function seleccionarPreguntas() {
  preguntasSeleccionadas = [];
  for (let i = 0; i < LIMITE_PREGUNTAS && poolRestantes[nivelActual].length > 0; i++) {
    const idx = Math.floor(Math.random() * poolRestantes[nivelActual].length);
    preguntasSeleccionadas.push(poolRestantes[nivelActual].splice(idx, 1)[0]);
  }
  indicePregunta = 0;
  respuestasUsuario = [];
}

// === Mostrar pregunta ===
function mostrarPregunta() {
  const preg = preguntasSeleccionadas[indicePregunta];
  document.getElementById("nivelTitulo").innerText = "Nivel " + nivelActual;
  document.getElementById("pregunta").innerText = preg.question;

  const cont = document.getElementById("opciones");
  cont.innerHTML = ""; // Limpiar opciones anteriores

  mezclarArray(preg.options).forEach(opcionTexto => {
    const div = document.createElement("div");
    div.className = "opcion-container";

    const btn = document.createElement("button");
    btn.className = "opcion";
    btn.textContent = opcionTexto;
    btn.onclick = () => seleccionarOpcion(opcionTexto, btn);

    const btnAudio = document.createElement("button");
    btnAudio.className = "btn-audio";
    btnAudio.textContent = "🔊";
    btnAudio.onclick = (e) => {
      e.stopPropagation();
      pronunciarTexto(opcionTexto);
    };

    div.appendChild(btn);
    div.appendChild(btnAudio);
    cont.appendChild(div);
  });

  // Restaurar selección previa
  if (respuestasUsuario[indicePregunta]) {
    const botones = cont.querySelectorAll(".opcion");
    botones.forEach(b => {
      if (normaliza(b.textContent) === normaliza(respuestasUsuario[indicePregunta])) {
        b.classList.add("seleccionado");
      }
    });
  }
}

// === Selección de opción ===
function seleccionarOpcion(texto, boton) {
  respuestasUsuario[indicePregunta] = texto;
  document.querySelectorAll("#opciones .opcion").forEach(b => b.classList.remove("seleccionado"));
  boton.classList.add("seleccionado");
}

// === Siguiente pregunta ===
function siguientePregunta() {
  if (!respuestasUsuario[indicePregunta]) {
    alert("Selecciona una opción antes de continuar.");
    return;
  }
  indicePregunta++;
  if (indicePregunta < preguntasSeleccionadas.length) {
    mostrarPregunta();
  } else {
    // Mostrar resultados del test actual
    mostrarResultados();
  }
}

// === Mostrar resultados ===
function mostrarResultados() {
  // Limpiar vista de preguntas para que no queden en pantalla
  document.getElementById("pregunta").innerText = "";
  document.getElementById("opciones").innerHTML = "";

  const detalles = document.getElementById("detalles");
  detalles.innerHTML = ""; // Limpiar resultados anteriores

  let correctas = 0;
  preguntasSeleccionadas.forEach((preg, i) => {
    const correcto = getTextoCorrecto(preg);
    const elegido = respuestasUsuario[i] || "No respondida";
    const esOK = normaliza(elegido) === normaliza(correcto);
    if (esOK) correctas++;

    const card = document.createElement("div");
    card.className = esOK ? "correcta" : "incorrecta";
    card.innerHTML = `
      <p><b>Pregunta:</b> ${preg.question}</p>
      <p><b>Tu respuesta:</b> ${elegido} 
        <button onclick="pronunciarTexto('${elegido}')">🔊</button>
      </p>
      <p><b>Respuesta correcta:</b> ${correcto} 
        <button onclick="pronunciarTexto('${correcto}')">🔊</button>
      </p>
    `;
    detalles.appendChild(card);
  });

  document.getElementById("score").innerText = 
    `Tu puntuación: ${correctas} / ${preguntasSeleccionadas.length}`;

  // Mostrar solo resultados, ocultar preguntas
  document.getElementById("test").classList.add("hidden");
  document.getElementById("resultado").classList.remove("hidden");
}

// === Botón Nuevo Test ===
function nuevoTest() {
  if (!poolRestantes[nivelActual] || poolRestantes[nivelActual].length < LIMITE_PREGUNTAS) {
    poolRestantes[nivelActual] = [...preguntas[nivelActual]]; // recargar pool si se agotó
  }
  reiniciarVistaTest();
  seleccionarPreguntas();
  mostrarPregunta();
}

// === Botón Siguiente Test (mismo nivel) ===
function siguienteTest() {
  if (!poolRestantes[nivelActual] || poolRestantes[nivelActual].length < LIMITE_PREGUNTAS) {
    poolRestantes[nivelActual] = [...preguntas[nivelActual]]; // recargar pool si se agotó
  }
  reiniciarVistaTest();
  seleccionarPreguntas();
  mostrarPregunta();
}

// === Reiniciar vista test ===
function reiniciarVistaTest() {
  document.getElementById("resultado").classList.add("hidden");
  document.getElementById("test").classList.remove("hidden");
  
  // Limpiar todo para empezar fresco
  document.getElementById("detalles").innerHTML = "";
  document.getElementById("score").innerText = "";
  document.getElementById("pregunta").innerText = "";
  document.getElementById("opciones").innerHTML = "";

  respuestasUsuario = [];
  indicePregunta = 0;

  // Ocultar botones de niveles cuando empieza un test
  document.querySelector(".niveles").classList.add("hidden");
}

