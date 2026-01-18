const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Carpetas de asignaturas (puedes añadir más)
const SUBJECTS = [
  "gestion-organizaciones",
  "seguridad-privada",
  "metodologia-investigacion",
  "proteccion-civil"
];

const indexPath = path.join(__dirname, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");

SUBJECTS.forEach(folder => {
  const dataPath = path.join(__dirname, folder, "data.js");
  if (!fs.existsSync(dataPath)) {
    console.warn(`⚠️ ${folder}: data.js no encontrado`);
    return;
  }

  const code = fs.readFileSync(dataPath, "utf8");

// Ejecutar data.js en un contexto aislado
const context = {};
vm.createContext(context); // 👈 ESTA LÍNEA ES LA CLAVE

vm.runInContext(
  code + '\n;globalThis.__RAW__ = (typeof RAW !== "undefined") ? RAW : null;',
  context
);

if (!Array.isArray(context.__RAW__)) {
  console.error(`❌ ${folder}: RAW no es un array`);
  return;
}

const count = context.__RAW__.length;


// Actualizar index.html
indexHtml = indexHtml.replace(
  new RegExp(
    `(href="${folder}\/"[^>]*data-questions=")\\d+(")`,
    "g"
  ),
  `$1${count}$2`
);


  // Actualizar data-questions
  indexHtml = indexHtml.replace(
    new RegExp(
      `(href="${folder}\\/".*?data-questions=")\\d+(")`,
      "s"
    ),
    `$1${count}$2`
  );

  // Actualizar badge
  indexHtml = indexHtml.replace(
    new RegExp(
      `(href="${folder}\\/".*?<span class="badge">)\\d+(<\\/span>)`,
      "s"
    ),
    `$1${count}$2`
  );

  console.log(`✔ ${folder}: ${count} preguntas`);
});

fs.writeFileSync(indexPath, indexHtml, "utf8");
console.log("\n✅ Menú actualizado correctamente");


