import { data } from "../../data";

const parametros = {
  curso: ["Todos", "Informática"],
  ano: ["Todos", "3º Ano"],
  turma: ["Todos", "3A"],
  turno: ["Todos", "Matutino"],
  situacao: ["Todos", "Cursando", "Aprovado", "Retido", "Exame Final"],
};

export async function getParametros() {
  return parametros;
}

export async function getAlunos(params = {}) {
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFreq(faltas, aulas) {
    const freq = ((1 - faltas / aulas) * 100).toFixed(2);
    return `${freq}%`;
  }

  // Percorre todos os alunos e disciplinas
  data.forEach((aluno) => {
    aluno.Disciplinas.forEach((disc) => {
      // Quantidade total de aulas
      const totalAulas = disc.Aulas || 60;

      // Faltas aleatórias
      const faltas = randomInt(0, Math.min(10, totalAulas));

      disc.Faltas = faltas;
      disc.Freq = randomFreq(faltas, totalAulas);

      // Notas aleatórias (0–100 ou "-" caso antes fosse vazio)
      const camposNotas = ["N1", "N2", "N3", "N4"];

      camposNotas.forEach((campo) => {
        if (disc[campo] === "" || disc[campo] === "-") {
          disc[campo] = randomInt(0, 100);
        } else {
          disc[campo] = randomInt(0, 100);
        }
      });

      // Reposições
      ["RE1", "RE2", "RE3", "RE4"].forEach((campo) => {
        disc[campo] = "-";
      });

      // Médias por módulo
      disc.ME1 = Math.round((disc.N1 + disc.N2) / 2);
      disc.ME2 = Math.round((disc.N3 + disc.N4) / 2);

      disc.MD1 = disc.ME1;
      disc.MD2 = disc.ME2;

      disc.MD = Math.round((disc.MD1 + disc.MD2) / 2);

      disc.NAF = "-";
      disc.MFD = disc.MD >= 60 ? disc.MD : "-";
    });
  });

  return data;
}

export async function uploadPlanilha(formData) {
  const resp = await fetch(apiBase + "/upload-planilha", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: formData,
    credentials: "include",
  });
  if (!resp.ok) throw new Error("Falha no upload");
  return resp.json();
}
