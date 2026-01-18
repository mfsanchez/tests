// ==========================
// CONFIGURACIÓN DE ASIGNATURA
// ==========================

const SUBJECT_CONFIG = {

  // Título visible del test
  title: "Seguridad Privada",

  // Reglas del test (sobrescriben las globales)
  rules: {
    penaltyEvery: 3,        // cada X fallos
    penaltyValue: 1,        // resta Y aciertos
    allowNegative: false    // nunca puntuación negativa
  },

  // Modos de ejecución (opcional)
  modes: {
    practice: {
      label: "Modo Práctica",
      showFeedback: true,
      shuffleQuestions: true,
      shuffleOptions: true
    },

    exam: {
      label: "Modo Examen",
      showFeedback: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      timeLimitMinutes: 120
    }
  },

  // Modo por defecto
  defaultMode: "practice"
};

