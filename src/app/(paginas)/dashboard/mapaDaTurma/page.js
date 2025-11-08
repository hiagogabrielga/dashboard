// src/app/dashboard/mapaDaTurma/page.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";

import { getAlunos } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  annotationPlugin
);

const MEDIA_CORTE = 60;

// Helpers
const toNum = (x) => {
  if (x === null || x === undefined) return null;
  const s = String(x).replace(",", ".").trim();
  if (s === "" || s === "-") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const round0 = (v) => (Number.isFinite(v) ? Math.round(v) : 0);

// label 1–2 linhas
function wrapLabel(str, maxLen = 14) {
  const s = String(str || "Disciplina").trim();
  if (s.length <= maxLen) return s;
  const words = s.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxLen && line) {
      lines.push(line);
      line = w;
      if (lines.length === 1) break;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  if (lines.length === 1 && s.length > maxLen)
    return [lines[0].slice(0, maxLen - 1) + "…"];
  if (lines.length > 2) {
    lines[1] = lines[1].slice(0, maxLen - 1) + "…";
    return lines.slice(0, 2);
  }
  return lines;
}

// cor estável por nome (HSL)
function colorFromName(name, sat = 70, light = 45) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

/**
 * Média final pelas NOTAS LANÇADAS, respeitando filtros:
 * - Se 4 bimestres selecionados:
 *    sem1 = média(ME1,ME2) só do que existir (arredonda)
 *    sem2 = média(ME3,ME4) só do que existir (arredonda)
 *    final = média(sem1,sem2) se ambos existem; se só um existe, usa o existente;
 *    se nenhum existe => retorna NULL (não contabiliza)
 * - Se 1–3 bimestres selecionados:
 *    média convencional apenas dos bimestres selecionados e existentes;
 *    se não existir nenhuma nota => NULL (não contabiliza)
 */
function mediaFinalNotasLancadas(disc, bimIndices) {
  const m1 = toNum(disc.ME1);
  const m2 = toNum(disc.ME2);
  const m3 = toNum(disc.ME3);
  const m4 = toNum(disc.ME4);

  const usandoQuatro =
    Array.isArray(bimIndices) &&
    bimIndices.length === 4 &&
    [1, 2, 3, 4].every((b) => bimIndices.includes(b));

  if (usandoQuatro) {
    const s1vals = [m1, m2].filter((x) => Number.isFinite(x));
    const s2vals = [m3, m4].filter((x) => Number.isFinite(x));
    const sem1 = s1vals.length ? Math.round(avg(s1vals)) : null;
    const sem2 = s2vals.length ? Math.round(avg(s2vals)) : null;

    if (sem1 !== null && sem2 !== null) return Math.round((sem1 + sem2) / 2);
    if (sem1 !== null) return sem1;
    if (sem2 !== null) return sem2;
    return null; // <<< mudança: sem nota lançada no ano => não contabiliza
  }

  // média convencional dos bimestres selecionados e existentes
  const map = { 1: m1, 2: m2, 3: m3, 4: m4 };
  const arrSel = (bimIndices || [1, 2, 3, 4])
    .map((i) => map[i])
    .filter((x) => Number.isFinite(x));

  return arrSel.length ? Math.round(avg(arrSel)) : null; // <<< mudança
}

export default function MapaDaTurma() {
  const pathname = usePathname();
  const { filtros, setQtdEstudantes } = useDashboard();

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");

  const barChartRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const data = await getAlunos(filtros);
        if (!cancelled) setAlunos(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErro(e.message || "Falha ao carregar turma");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filtros)]);

  // Bimestres selecionados (respeita os filtros)
  const bimIndices = useMemo(() => {
    const b = filtros?.bimestres || {};
    const map = { b1: 1, b2: 2, b3: 3, b4: 4 };
    const list = Object.entries(map)
      .filter(([k]) => b[k])
      .map(([, i]) => i);
    return list; // 👈 sem fallback [1,2,3,4]
  }, [filtros?.bimestres]);

  useEffect(() => {
    setQtdEstudantes(alunos.length);
  }, [alunos.length, setQtdEstudantes]);

  // ===== Flatten bruto =====
  const todasDisciplinas = useMemo(() => {
    return (alunos || []).flatMap((aluno) => {
      const discs = aluno?.Disciplinas || [];
      return discs.map((d) => ({
        nome: d.NomeDisciplina || d.Nome || d.Disciplina || "Disciplina",
        ME1: d.ME1,
        ME2: d.ME2,
        ME3: d.ME3,
        ME4: d.ME4,
      }));
    });
  }, [alunos]);

  // ===== BAR: média por disciplina (ordenado asc) =====
  const barConfig = useMemo(() => {
    if (!bimIndices || bimIndices.length === 0) return null;
    const mapa = new Map(); // nome -> [mediaFinal por aluno]
    for (const d of todasDisciplinas) {
      const md = mediaFinalNotasLancadas(d, bimIndices);
      if (md === null) continue; // <<< não empilha quem não tem nota no período
      if (!mapa.has(d.nome)) mapa.set(d.nome, []);
      mapa.get(d.nome).push(md);
    }

    // Se alguma disciplina não tiver nenhuma nota no período filtrado, fica de fora
    const pares = Array.from(mapa.entries()).map(([nome, arr]) => [
      nome,
      round0(avg(arr)),
    ]);
    pares.sort((a, b) => a[1] - b[1]);

    const labelsRaw = pares.map(([n]) => n);
    const labels = labelsRaw.map((n) => wrapLabel(n, 26));
    const medias = pares.map(([, m]) => m);

    const backgroundColor = medias.map((m) =>
      m >= MEDIA_CORTE ? "#A8D09C99" : "#FF9a9a99"
    );
    const borderColor = medias.map((m) =>
      m >= MEDIA_CORTE ? "rgba(0,184,122,0.9)" : "rgba(179,35,19,0.9)"
    );

    const PER_LABEL_PX = 90;
    const minWidth = Math.max(900, labelsRaw.length * PER_LABEL_PX);

    return {
      labelsRaw,
      minWidth,
      data: {
        labels,
        datasets: [
          {
            label: "Média por disciplina",
            data: medias,
            backgroundColor,
            borderColor,
            borderWidth: 1,
            borderRadius: 10,
            categoryPercentage: 0.9,
            barPercentage: 0.9,
            maxBarThickness: 52,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },

          annotation: {
            annotations: {
              mediaLinha: {
                type: "line",
                yMin: 60,
                yMax: 60,
                borderColor: "rgba(0, 0, 0, 0.7)",
                borderWidth: 2,
                borderDash: [6, 6], // ← pontilhado
                label: {
                  display: true,
                  content: "Média 60",
                  position: "end",
                  backgroundColor: "rgba(0, 0, 0, 1)",
                  color: "#ffffffff",
                  font: { size: 12, weight: "bold" },
                },
              },
            },
          },
        },
        onHover: (event, chartElement) => {
          if (event?.native?.target) {
            event.native.target.style.cursor = chartElement[0]
              ? "pointer"
              : "default";
          }
        },
        onClick: (evt, elements) => {
          if (!elements?.length) return;
          const idx = elements[0].index;
          const label = labelsRaw[idx];
          setDisciplinaSelecionada(label);
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { autoSkip: false, maxRotation: 45, minRotation: 25 },
          },
          y: { beginAtZero: true, max: 100 },
        },
      },
    };
  }, [todasDisciplinas, bimIndices]);

  // ===== LINE: evolução bimestral (apenas selecionada) com cor =====
  const lineConfig = useMemo(() => {
    if (!bimIndices || bimIndices.length === 0) return null;
    const map = new Map(); // nome -> {b1:[],b2:[],b3:[],b4:[]}
    for (const d of todasDisciplinas) {
      if (!map.has(d.nome)) map.set(d.nome, { b1: [], b2: [], b3: [], b4: [] });
      const b = map.get(d.nome);
      const v1 = toNum(d.ME1);
      const v2 = toNum(d.ME2);
      const v3 = toNum(d.ME3);
      const v4 = toNum(d.ME4);
      if (Number.isFinite(v1)) b.b1.push(v1);
      if (Number.isFinite(v2)) b.b2.push(v2);
      if (Number.isFinite(v3)) b.b3.push(v3);
      if (Number.isFinite(v4)) b.b4.push(v4);
    }

    const nomes = Array.from(map.keys()).sort();
    const sel =
      disciplinaSelecionada && map.has(disciplinaSelecionada)
        ? disciplinaSelecionada
        : "";

    const datasets = [];
    if (sel) {
      const buckets = map.get(sel);
      const serie = [
        round0(avg(buckets.b1) || 0),
        round0(avg(buckets.b2) || 0),
        round0(avg(buckets.b3) || 0),
        round0(avg(buckets.b4) || 0),
      ];

      const serieFiltrada = [1, 2, 3, 4].map((i, idx) => {
        const hasNotes = (buckets[`b${i}`] || []).length > 0;
        if (!bimIndices.includes(i) || !hasNotes) return null; // <<< bimestre sem nota vira null
        return serie[idx];
      });

      const color = colorFromName(sel, 70, 45);
      datasets.push({
        label: sel,
        data: serieFiltrada,
        tension: 0.35,
        fill: false,
        borderColor: color,
        pointBackgroundColor: color,
        pointBorderColor: color,
        pointRadius: (ctx) => (ctx.raw === 0 || ctx.raw === null ? 0 : 4),
        pointHoverRadius: (ctx) => (ctx.raw === 0 || ctx.raw === null ? 0 : 6),
      });
    }

    return {
      nomesDisciplinas: nomes,
      data: {
        labels: ["1º bimestre", "2º bimestre", "3º bimestre", "4º bimestre"],
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          annotation: {
            annotations: {
              mediaLinha: {
                type: "line",
                yMin: 60,
                yMax: 60,
                borderColor: "rgba(0, 0, 0, 0.7)",
                borderWidth: 2,
                borderDash: [6, 6], // ← pontilhado
                label: {
                  display: true,
                  content: "Média 60",
                  position: "end",
                  backgroundColor: "rgba(0, 0, 0, 1)",
                  color: "#ffffffff",
                  font: { size: 12, weight: "bold" },
                },
              },
            },
          },
          tooltip: { intersect: false },
        },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    };
  }, [todasDisciplinas, disciplinaSelecionada, bimIndices]);

  // ===== BAR: alunos abaixo da média (desc) com notas lançadas =====
  const acimaAbaixoConfig = useMemo(() => {
    if (!bimIndices || bimIndices.length === 0) return null;

    // nome -> { acima: number, abaixo: number, total: number }
    const contagem = new Map();

    for (const d of todasDisciplinas) {
      const mdFinal = mediaFinalNotasLancadas(d, bimIndices);
      if (mdFinal === null) continue; // NÃO conta aluno sem nota no(s) bimestre(s) filtrado(s)

      if (!contagem.has(d.nome))
        contagem.set(d.nome, { acima: 0, abaixo: 0, total: 0 });
      const c = contagem.get(d.nome);
      c.total += 1;
      if (mdFinal >= MEDIA_CORTE) c.acima += 1;
      else c.abaixo += 1;
    }

    // Ordenação (opcional): por “abaixo” desc, depois por “acima” desc e nome
    const pares = Array.from(contagem.entries())
      .map(([nome, { acima, abaixo, total }]) => ({
        nome,
        acima,
        abaixo,
        total,
      }))
      .sort(
        (a, b) =>
          b.abaixo - a.abaixo ||
          b.total - a.total ||
          a.nome.localeCompare(b.nome)
      );

    const labelsRaw = pares.map((p) => p.nome);
    const labels = labelsRaw.map((n) => wrapLabel(n, 26));
    const valoresAcima = pares.map((p) => p.acima);
    const valoresAbaixo = pares.map((p) => p.abaixo);

    const PER_LABEL_PX = 90;
    const minWidth = Math.max(900, labelsRaw.length * PER_LABEL_PX);

    return {
      labelsRaw,
      minWidth,
      data: {
        labels,
        datasets: [
          {
            label: "Alunos acima da média",
            data: valoresAcima,
            backgroundColor: "#bbdefb93", // (2) Azul Bebê Pastel
            borderWidth: 1,
            borderRadius: 10,
            stack: "stack1",
            categoryPercentage: 0.9,
            barPercentage: 0.9,
            maxBarThickness: 52,
          },
          {
            label: "Alunos abaixo da média",
            data: valoresAbaixo,
            backgroundColor: "#64b4f685", // (4) Azul Meio-Claro
            borderWidth: 1,
            borderRadius: 10,
            stack: "stack1",
            categoryPercentage: 0.9,
            barPercentage: 0.9,
            maxBarThickness: 52,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        onClick: (evt, elements) => {
          if (!elements?.length) return;
          const idx = elements[0].index;
          const label = labelsRaw[idx];
          setDisciplinaSelecionada(label);
        },
        onHover: (event, chartElement) => {
          if (event?.native?.target) {
            event.native.target.style.cursor = chartElement[0]
              ? "pointer"
              : "default";
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { autoSkip: false, maxRotation: 45, minRotation: 25 },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    };
  }, [todasDisciplinas, bimIndices]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Abas */}
        <nav
          className={styles.tabs}
          role="tablist"
          aria-label="Navegação do dashboard"
        >
          <Link
            href="/dashboard/mapaDaTurma"
            className={`${styles.tab} ${
              pathname?.startsWith("/dashboard/mapaDaTurma")
                ? styles.tabActive
                : ""
            }`}
          >
            Mapa da turma
          </Link>
          <Link
            href="/dashboard/rendimentoDaTurma"
            className={`${styles.tab} ${
              pathname?.startsWith("/dashboard/rendimentoDaTurma")
                ? styles.tabActive
                : ""
            }`}
          >
            Rendimento da turma
          </Link>
          <Link
            href="/dashboard/situacaoDoAluno"
            className={`${styles.tab} ${
              pathname?.startsWith("/dashboard/situacaoDoAluno")
                ? styles.tabActive
                : ""
            }`}
          >
            Situação do estudante
          </Link>
        </nav>

        {loading && <div style={{ padding: 12 }}>Carregando turma…</div>}
        {erro && <div style={{ padding: 12, color: "red" }}>Erro: {erro}</div>}
        {!loading && !erro && alunos.length === 0 && (
          <div style={{ padding: 12 }}>
            Nenhum dado para a turma selecionada.
          </div>
        )}

        {!loading && !erro && alunos.length > 0 && (
          <>
            {!bimIndices.length ? (
              <div style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                Nenhum bimestre selecionado — selecione ao menos um para exibir
                dados.
              </div>
            ) : (
              <section className={styles.chartsGrid}>
                {/* BAR ocupa a linha inteira */}
                <div
                  className={styles.chartCard}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <h3>Alunos acima e abaixo da média por disciplina</h3>
                  <div className={styles.scrollContainer}>
                    <div
                      className={styles.chartInner}
                      style={{
                        minWidth: acimaAbaixoConfig.minWidth,
                        height: 520,
                      }}
                    >
                      <Bar
                        data={acimaAbaixoConfig.data}
                        options={acimaAbaixoConfig.options}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={styles.chartCard}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <h3>Média por disciplina</h3>
                  <div className={styles.scrollContainer}>
                    <div
                      className={styles.chartInner}
                      style={{ minWidth: barConfig.minWidth, height: 560 }}
                    >
                      <Bar data={barConfig.data} options={barConfig.options} />
                    </div>
                  </div>
                </div>

                <div
                  className={styles.chartCard}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: '100%',
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      Evolução bimestral por disciplina
                    </h3>
                    <label
                      className={styles.selecDiscplinas}
                    >
                      
                      <select
                        value={disciplinaSelecionada}
                        onChange={(e) =>
                          setDisciplinaSelecionada(e.target.value)
                        }
                        style={{ padding: "6px 8px" }}
                        className={styles.dropBoxEvoluDis}
                      >
                        <option value="" >Selecione…</option>
                        {lineConfig.nomesDisciplinas?.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: 14 }}>Disciplina:</span>
                    </label>
                  </div>
                  {disciplinaSelecionada ? (
                    <Line data={lineConfig.data} options={lineConfig.options} />
                  ) : (
                    <div style={{ padding: 12, opacity: 0.7 }}>
                      Selecione uma disciplina (pelo dropdown ou clicando em uma
                      barra nos gráficos) para ver a evolução bimestral.
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
