function shuffle(array){
  const a = array.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Construir preguntas (barajando preguntas y, salvo lock:true, también opciones)
function buildQuestionsFrom(rawArray){
  return shuffle(rawArray).map(q => {
    if (q.lock) {
      return {
        q: q.q,
        options: q.options.slice(),
        correct: q.correct,
        answer: null,
        lock: true
      };
    } else {
      const idxs = shuffle(q.options.map((_, i) => i));
      const newOptions = idxs.map(i => q.options[i]);
      const newCorrect = idxs.indexOf(q.correct);
      return {
        q: q.q,
        options: newOptions,
        correct: newCorrect,
        answer: null,
        lock: false
      };
    }
  });
}

// Estado inicial
let questions = [];

let current = 0;
let correctCount = 0;
let wrongCount = 0;
let penaltyCount = 0;
let failStreak = 0;
let testFinished = false;
let currentMode = "ALL"; // ALL | EXAM2026


const qTextEl = document.getElementById("qText");
const qNumberEl = document.getElementById("qNumber");
const optionsBox = document.getElementById("optionsBox");
const statCorrectEl = document.getElementById("statCorrect");
const statWrongEl = document.getElementById("statWrong");
const statPenaltyEl = document.getElementById("statPenalty");
const statIndexEl = document.getElementById("statIndex");
const feedbackEl = document.getElementById("feedback");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const retryWrongBtn = document.getElementById("retryWrongBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const cardEl = document.getElementById("card");
const finalBox = document.getElementById("finalBox");

function allAnswered(){
  return questions.every(q => q.answer !== null);
}

function renderQuestion(){
  const q = questions[current];

  qNumberEl.textContent = "Pregunta " + (current + 1);
  qTextEl.textContent = q.q;
  statIndexEl.textContent = (current + 1) + " / " + questions.length;

  optionsBox.innerHTML = "";

  const keys = ["A","B","C","D","E"];

  q.options.forEach((opt, idx) => {
    if (typeof opt === "undefined") return; // 🔑 CLAVE

    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.dataset.index = idx;

    btn.innerHTML = `
      <span class="key">${keys[idx]}</span>
      <span class="label">${opt}</span>
    `;

    if (q.answer !== null) {
      btn.classList.add("disabled");
      if (idx === q.correct) btn.classList.add("correct");
      if (idx === q.answer && q.answer !== q.correct) btn.classList.add("wrong");
    }

    btn.addEventListener("click", () => handleAnswer(idx));
    optionsBox.appendChild(btn);
  });

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === questions.length - 1;

  feedbackEl.textContent =
    q.answer === null
      ? "Elige una opción. Cada 3 fallos se resta 1 acierto."
      : (q.answer === q.correct
          ? "Respuesta ya contestada: correcta."
          : "Respuesta ya contestada: incorrecta.");

  feedbackEl.className = "neutral";
}

function triggerExplosion(){
  const ex = document.createElement("div");
  ex.className = "explosion";

  const core = document.createElement("div");
  core.className = "explosion-core";
  const label = document.createElement("div");
  label.className = "explosion-label";
  label.textContent = "💥 ¡BOOM!";
  core.appendChild(label);
  ex.appendChild(core);

  // trocitos que saltan alrededor
  const pieces = 16;
  for(let i=0;i<pieces;i++){
    const piece = document.createElement("div");
    piece.className = "explosion-piece";
    const angle = Math.random()*2*Math.PI;
    const dist = 80 + Math.random()*80;
    const dx = Math.cos(angle)*dist;
    const dy = Math.sin(angle)*dist;
    piece.style.setProperty("--dx", dx + "px");
    piece.style.setProperty("--dy", dy + "px");
    ex.appendChild(piece);
  }

  cardEl.appendChild(ex);
  setTimeout(()=> {
    if (ex.parentNode) ex.parentNode.removeChild(ex);
  }, 800);
}

function triggerConfetti(){
  const container = document.createElement("div");
  container.className = "confetti-container";
  const emojis = ["🥳","🎉","🎊","🎈","🎉","🥳","🎊"];
  const pieces = 48;
  for(let i=0;i<pieces;i++){
    const span = document.createElement("span");
    span.className = "confetti-emoji";
    span.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    span.style.left = Math.random()*100 + "%";
    span.style.fontSize = (18 + Math.random()*10) + "px";
    span.style.animationDelay = (Math.random()*0.7) + "s";
    container.appendChild(span);
  }
  cardEl.appendChild(container);
  setTimeout(()=>{
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 2600);
}

function maybeFinishTest(){
  if (!testFinished && allAnswered()){
    testFinished = true;
    showResult();
  }
}

function handleAnswer(idx){
  const q = questions[current];
  if(q.answer !== null) return;

  q.answer = idx;

  const btns = optionsBox.querySelectorAll(".btn-option");
  btns.forEach(b=>{
    b.classList.add("disabled");
    const i = parseInt(b.dataset.index,10);
    if(i === q.correct) b.classList.add("correct");
    if(i === idx && idx !== q.correct) b.classList.add("wrong");
  });

  if(idx === q.correct){
    correctCount++;
    failStreak = 0;
    statCorrectEl.textContent = correctCount;
    feedbackEl.textContent = "✅ ¡Correcto!";
    feedbackEl.className = "ok";
    pulseCard(true);
    triggerConfetti();
  }else{
    wrongCount++;
    failStreak++;
    statWrongEl.textContent = wrongCount;
    let msg = "❌ Incorrecto.";
    if(failStreak >= 3 && correctCount > 0){
      correctCount--;
      penaltyCount++;
      failStreak = 0;
      statCorrectEl.textContent = correctCount;
      statPenaltyEl.textContent = penaltyCount;
      msg += " Has acumulado 3 fallos: se resta 1 acierto.";
    }else{
      const remain = 3 - failStreak;
      msg += " Cuando acumules " + remain + " fallo(s) más se restará 1 acierto.";
    }
    feedbackEl.textContent = msg;
    feedbackEl.className = "bad";
    pulseCard(false);
    triggerExplosion();
  }

  maybeFinishTest();
}

function pulseCard(ok){
  const cls = ok ? "flash-correct" : "flash-wrong shake";
  cardEl.classList.add(...cls.split(" "));
  setTimeout(()=> {
    cardEl.classList.remove("flash-correct","flash-wrong","shake");
  }, 500);
}

prevBtn.addEventListener("click", ()=>{
  if(current>0){
    current--;
    renderQuestion();
  }
});
nextBtn.addEventListener("click", ()=>{
  if(current<questions.length-1){
    current++;
    renderQuestion();
  }
});

// Resultado final (se muestra automáticamente al completar todas las preguntas)
function showResult(){
  const total = questions.length;
  const answered = questions.filter(q=>q.answer!==null).length;
  const score = correctCount - penaltyCount;
  const pct = total>0 ? Math.round((score/total)*100) : 0;

  let txt = "";
  txt += "<strong>Resultado final:</strong><br>";
  txt += "Preguntas respondidas: " + answered + " de " + total + "<br>";
  txt += "Aciertos netos: " + correctCount + "<br>";
  txt += "Fallos: " + wrongCount + "<br>";
  txt += "Penalizaciones aplicadas (cada 3 fallos): " + penaltyCount + "<br>";
  txt += "Puntuación (aciertos - penalizaciones): <strong>" + score + "</strong> (" + pct + "% aproximado).<br>";
  txt += "Recuerda contrastar siempre con temario, jurisprudencia y normativa oficial.";

  finalBox.innerHTML = txt;
}

// Reiniciar test solo con las preguntas falladas
function restartWithWrong(){

  if(!allAnswered()){
    finalBox.innerHTML =
      "<strong>Para repetir solo los errores, primero contesta todas las preguntas.</strong>";
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }

  const wrongQs = questions.filter(
    q => q.answer !== null && q.answer !== q.correct
  );

  if(wrongQs.length === 0){
    finalBox.innerHTML =
      "<strong>No tienes preguntas falladas para repetir.</strong>";
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }

  // 🔒 Clonamos SIN volver a barajar opciones
  questions = wrongQs.map(q => ({
    q: q.q,
    options: q.options.slice(),
    correct: q.correct,
    answer: null,
    lock: true
  }));

  current = 0;
  correctCount = 0;
  wrongCount = 0;
  penaltyCount = 0;
  failStreak = 0;
  testFinished = false;

  statCorrectEl.textContent = "0";
  statWrongEl.textContent = "0";
  statPenaltyEl.textContent = "0";

  finalBox.innerHTML =
    "<strong>Nuevo test iniciado solo con las preguntas falladas.</strong>";

  renderQuestion();
  window.scrollTo({top:0,behavior:"smooth"});
}

function restartAll(){
  if(currentMode === "EXAM2026"){
    questions = buildQuestionsFrom(RAW_EXAMEN_2026);
  }else{
    questions = buildQuestionsFrom(RAW);
  }

  current = 0;
  correctCount = 0;
  wrongCount = 0;
  penaltyCount = 0;
  failStreak = 0;
  testFinished = false;

  statCorrectEl.textContent = "0";
  statWrongEl.textContent = "0";
  statPenaltyEl.textContent = "0";

  finalBox.innerHTML =
    currentMode === "EXAM2026"
      ? "<strong>Simulacro: Examen Seguridad Privada · Enero 2026</strong>"
      : "<strong>Nuevo test iniciado con todas las preguntas.</strong>";

  renderQuestion();
}
function startExam2026(){
  questions = buildQuestionsFrom(RAW_EXAMEN_2026);
  currentMode = "EXAM2026";

  current = 0;
  correctCount = 0;
  wrongCount = 0;
  penaltyCount = 0;
  failStreak = 0;
  testFinished = false;

  statCorrectEl.textContent = "0";
  statWrongEl.textContent = "0";
  statPenaltyEl.textContent = "0";

  finalBox.innerHTML =
    "<strong>Simulacro: Examen Seguridad Privada · Enero 2026</strong>";

  cardEl.classList.add("exam-2026");
  document.getElementById("examBadge").style.display = "inline-flex";

  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


retryWrongBtn.addEventListener("click", restartWithWrong);
shuffleBtn.addEventListener("click", restartAll);

// Inicio

const examBtn = document.getElementById("exam2026Btn");
if (examBtn) {
  examBtn.addEventListener("click", startExam2026);
}

function initTest(config){
  questions = buildQuestionsFrom(config.questions);

  current = 0;
  correctCount = 0;
  wrongCount = 0;
  penaltyCount = 0;
  failStreak = 0;
  testFinished = false;
  currentMode = "ALL";

  statCorrectEl.textContent = "0";
  statWrongEl.textContent = "0";
  statPenaltyEl.textContent = "0";
  finalBox.innerHTML = "";

  renderQuestion();
}
window.initTest = initTest;
