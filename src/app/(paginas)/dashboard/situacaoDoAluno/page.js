"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";

import { getAlunos } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const MEDIA_CORTE = 60;

/* ======================= Helpers ======================= */
const toNum = (x) => {
  if (x === null || x === undefined) return null;
  const s = String(x).replace(",", ".").trim();
  if (s === "" || s === "-") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const fmtInt = (v) => (Number.isFinite(v) ? Math.round(v) : "-");
const fmt1 = (v) => (Number.isFinite(v) ? (+v).toFixed(1) : "-");

const trimLabel = (s, max = 22) => {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
};

/* =========== Turma + Curso (ex.: 3ºA Informática) =========== */
function normalizeTurma(turmaStr) {
  if (!turmaStr || typeof turmaStr !== "string") return null;
  const s = turmaStr.trim();
  let m = s.match(/^(\d+)\s*[º°o]?\s*([A-Za-z])$/i);
  if (m) return `${m[1]}º${m[2].toUpperCase()}`;
  m = s.match(/^(\d+)\s*(?:º|°|o)?\s*(?:ano|série|serie)?\s*([A-Za-z])$/i);
  if (m) return `${m[1]}º${m[2].toUpperCase()}`;
  if (/[º°]/.test(s)) return s.replace(/\s+/g, " ").trim().toUpperCase();
  m = s.match(/^(\d+)\s*([A-Za-z])$/);
  if (m) return `${m[1]}º${m[2].toUpperCase()}`;
  return null;
}

function turmaCurso(aluno) {
  const curso = aluno.Curso_Novo || aluno.curso || aluno.Curso || "";
  const siglaRaw =
    aluno.Sigla ??
    aluno.sigla ??
    aluno.TurmaLetra ??
    aluno.turma_letra ??
    aluno.Letra ??
    aluno.letra ??
    null;
  const ano =
    aluno.Série ?? aluno.Serie ?? aluno.serie ?? aluno.Ano ?? aluno.ano ?? null;

  if (ano && siglaRaw) {
    const letra = (String(siglaRaw).match(/[A-Za-z]/)?.[0] || "").toUpperCase();
    const num = String(ano).match(/\d+/)?.[0] || String(ano);
    const turmaFmt = letra ? `${num}º${letra}` : `${num}º`;
    return curso ? `${turmaFmt} ${curso}` : turmaFmt;
  }

  const turmaBruta = aluno.Turma || aluno.turma || "";
  if (typeof turmaBruta === "string" && turmaBruta.trim()) {
    const t = normalizeTurma(turmaBruta);
    if (t) return curso ? `${t} ${curso}` : t;
  }

  return curso || "-";
}

/* ============================================================ */
function SituacaoDoAlunoInner() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { filtros, setQtdEstudantes } = useDashboard();

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErro("");
        const data = await getAlunos(filtros);
        if (!cancelled) setAlunos(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErro(e?.message || "Falha ao carregar alunos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filtros)]);

  const [alunoId, setAlunoId] = useState(null);

  useEffect(() => {
    const fromUrl = params.get("alunoId");
    if (!alunos || alunos.length === 0) return;
    if (
      fromUrl &&
      alunos.some((a) => String(a.Matricula || a.id) === String(fromUrl))
    ) {
      setAlunoId(String(fromUrl));
      return;
    }
    setAlunoId((prev) => {
      if (
        prev &&
        alunos.some((a) => String(a.Matricula || a.id) === String(prev))
      )
        return prev;
      return String(alunos[0].Matricula || alunos[0].id);
    });
  }, [alunos, params]);

  const aluno = useMemo(() => {
    if (!alunoId) return null;
    return (
      alunos.find((a) => String(a.Matricula || a.id) === String(alunoId)) ||
      null
    );
  }, [alunoId, alunos]);

  const curIndex = useMemo(() => {
    if (!alunoId) return -1;
    return alunos.findIndex(
      (a) => String(a.Matricula || a.id) === String(alunoId)
    );
  }, [alunos, alunoId]);

  useEffect(() => {
    setQtdEstudantes(alunos.length);
  }, [alunos.length, setQtdEstudantes]);

  const bimIndices = useMemo(() => {
    const b = (filtros || {}).bimestres || {};
    const map = { b1: 1, b2: 2, b3: 3, b4: 4 };
    const list = Object.entries(map)
      .filter(([k]) => b[k])
      .map(([, i]) => i);
    return list.length ? list : [1, 2, 3, 4];
  }, [(filtros || {}).bimestres]);

  /* ========== DISCIPLINAS ========== 
     Agora a média SEMPRE vem do campo MD da API.
  */
  const disciplinas = useMemo(() => {
    if (!aluno) return [];
    return (aluno.Disciplinas || []).map((d) => {
      const me = [1, 2, 3, 4].map((i) => toNum(d[`ME${i}`]));
      const f = [1, 2, 3, 4].map((i) => toNum(d[`F${i}`]));
      const Freq = Number(d.Freq.replace("%", "").replace(",", "."));
      // média diretamente da API (MD)
      const mediaApi = toNum(d.MD); // <- pega "MD": "53" etc.

      const validF = f.filter((v) => v !== null);
      const faltasFromF =
        validF.length > 0 ? sum(validF) : toNum(d.Faltas ?? d.faltas ?? 0) ?? 0;

      const statusBackend = d.Situacao || d.status;
      const norm = (statusBackend || "").toString().trim();
      const statusNorm = /exame/i.test(norm)
        ? "Exame Final"
        : /retid/i.test(norm)
        ? "Retido"
        : norm;

      return {
        nome: d.NomeDisciplina || d.Nome || d.Disciplina || "Disciplina",
        me1: me[0],
        me2: me[1],
        me3: me[2],
        me4: me[3],
        media: mediaApi, // <- usa MD
        faltas: Number.isFinite(faltasFromF) ? faltasFromF : 0,
        status: statusNorm,
        freq: Freq,
      };
    });
  }, [aluno]);

  /* KPIs com base na média MD da API */
  const mediaGeral = useMemo(() => {
    if (disciplinas.length === 0) return 0;
    const mediasValidas = disciplinas
      .map((d) => d.media)
      .filter((v) => Number.isFinite(v));
    if (mediasValidas.length === 0) return 0;
    return sum(mediasValidas) / mediasValidas.length;
  }, [disciplinas]);

  const faltasTotal = useMemo(
    () =>
      disciplinas.reduce(
        (acc, d) => acc + (isFinite(d.faltas) ? d.faltas : 0),
        0
      ),
    [disciplinas]
  );

  const freqTotal = useMemo(
    () =>
      disciplinas.reduce((acc, d) => acc + (isFinite(d.freq) ? d.freq : 0), 0),
    [disciplinas]
  );
  const frequencia = (freqTotal / disciplinas.length).toFixed(0);

  const notaClasse = (v) => {
    if (!Number.isFinite(v)) return "";
    return v >= MEDIA_CORTE ? styles.cellOk : styles.cellBad;
  };

  /* ===== Radar ===== */
  const [showMedia, setShowMedia] = useState(true);
  const [showMeta, setShowMeta] = useState(true);

  const radarLabelsFull = useMemo(
    () => disciplinas.map((d) => d.nome),
    [disciplinas]
  );
  const radarLabels = useMemo(
    () => radarLabelsFull.map((l) => trimLabel(l, 22)),
    [radarLabelsFull]
  );

  const radarScores = useMemo(
    () =>
      disciplinas.map((d) =>
        Number.isFinite(d.media) ? Math.round(d.media) : 0
      ),
    [disciplinas]
  );
  const radarTarget = useMemo(
    () => radarLabels.map(() => MEDIA_CORTE),
    [radarLabels]
  );

  const radarData = useMemo(
    () => ({
      labels: radarLabels,
      datasets: [
        {
          label: "Média do estudante",
          data: radarScores,
          fill: true,
          backgroundColor: "rgba(92,179,255,0.22)",
          borderColor: "#5cb3ff",
          borderWidth: 2,
          pointBackgroundColor: "#5cb3ff",
          pointBorderColor: "#ffffff",
          pointRadius: 3,
          pointHoverRadius: 5,
          hidden: !showMedia,
        },
        {
          label: `Meta (${MEDIA_CORTE})`,
          data: radarTarget,
          fill: false,
          borderDash: [6, 6],
          borderColor: "#6b7280",
          borderWidth: 2,
          pointRadius: 0,
          hidden: !showMeta,
        },
      ],
    }),
    [radarLabels, radarScores, radarTarget, showMedia, showMeta]
  );

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex ?? 0;
            return radarLabelsFull[idx] || "";
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 100,
        angleLines: { color: "rgba(0,0,0,0.06)" },
        grid: { circular: true, color: "rgba(0,0,0,0.08)" },
        ticks: { stepSize: 20, backdropColor: "transparent" },
        pointLabels: { font: { size: 12 }, color: "#1f2937" },
      },
    },
  };

  /* ===== Barras por bimestre ===== */
  /* Paleta azul uniforme conforme solicitado */
  const BAR_COLORS = [
    "#E3F2FD", // (1) Azul Céu Muito Claro
    "#BBDEFB", // (2) Azul Bebê Pastel
    "#90CAF9", // (3) Azul Celeste Suave
    "#64B5F6", // (4) Azul Meio-Claro
  ];

  const barDatasets = bimIndices.map((i, idx) => ({
    label: `B${i}`,
    data: disciplinas.map((d) => {
      const v = d[`me${i}`];
      return Number.isFinite(v) ? Math.round(v) : null;
    }),
    borderRadius: 8,
    backgroundColor: BAR_COLORS[(i - 1) % BAR_COLORS.length],
    borderColor: "#5CB3FF",
    borderWidth: 1.5,
    hoverBackgroundColor: BAR_COLORS[(i - 1) % BAR_COLORS.length],
  }));

  const barData = {
    labels: disciplinas.map((d) => d.nome),
    datasets: barDatasets,
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, max: 100 },
    },
  };

  const statusClass = (s) => {
    switch (s) {
      case "Aprovado":
        return styles.chipOk;
      case "Exame Final":
        return styles.chipBlack;
      case "Recuperação":
        return styles.chipOrange;
      case "Cursando":
        return styles.chipWarn;
      case "Retido":
        return styles.chipGray;
      case "Reprovado":
        return styles.chipBad;
      default:
        return styles.chip;
    }
  };

  /* --- navegação entre alunos (setas) --- */
  const onTrocarAluno = (id) => {
    setAlunoId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("alunoId", id);
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  const goByDelta = (delta) => {
    if (alunos.length === 0 || curIndex === -1) return;
    const next = Math.min(alunos.length - 1, Math.max(0, curIndex + delta));
    const nextId = String(alunos[next].Matricula || alunos[next].id);
    onTrocarAluno(nextId);
  };

  // atalhos de teclado ← →
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") goByDelta(-1);
      if (e.key === "ArrowRight") goByDelta(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [curIndex, alunos]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Abas */}
        <nav className={styles.tabs}>
          <Link
            href="/dashboard/mapaDaTurma"
            className={`${styles.tab} ${
              pathname?.includes("/mapaDaTurma") ? styles.tabActive : ""
            }`}
          >
            Mapa da turma
          </Link>
          <Link
            href="/dashboard/rendimentoDaTurma"
            className={`${styles.tab} ${
              pathname?.includes("/rendimentoDaTurma") ? styles.tabActive : ""
            }`}
          >
            Rendimento da turma
          </Link>
          <Link
            href="/dashboard/situacaoDoAluno"
            className={`${styles.tab} ${
              pathname?.includes("/situacaoDoAluno") ? styles.tabActive : ""
            }`}
          >
            Situação do estudante
          </Link>
        </nav>

        {loading && <div style={{ padding: 12 }}>Carregando alunos…</div>}
        {erro && <div style={{ padding: 12, color: "red" }}>Erro: {erro}</div>}
        {!loading && !erro && alunos.length === 0 && (
          <div style={{ padding: 12 }}>Nenhum aluno encontrado.</div>
        )}

        {!loading && !erro && alunos.length > 0 && aluno && (
          <>
            {/* Header */}
            <section className={styles.studentBar}>
              <div className={styles.studentInfo}>
                <img
                  src={
                    aluno.Imagem ||
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                  }
                  alt="Foto do aluno"
                  className={styles.avatarImg}
                />
                <div>
                  <div className={styles.studentName}>
                    {aluno.Nome || "Aluno"}
                  </div>
                  <div className={styles.studentClass}>{turmaCurso(aluno)}</div>
                </div>
              </div>

              {/* Navegação: select + pager (setas) */}
              <div className={styles.alunoNav}>
                <div className={styles.alunoSelectWrap}>
                  <label htmlFor="selectAluno" className={styles.alunoLabel}>
                    Trocar aluno:
                  </label>

                  <select
                    id="selectAluno"
                    value={alunoId ?? ""}
                    onChange={(e) => onTrocarAluno(e.target.value)}
                    className={styles.alunoSelect}
                  >
                    {alunos.map((a) => (
                      <option
                        key={a.Matricula || a.id}
                        value={a.Matricula || a.id}
                      >
                        {a.Nome || "Aluno"} — {turmaCurso(a)}
                      </option>
                    ))}
                  </select>

                  {/* Pager abaixo do select */}
                  <div
                    className={styles.alunoPager}
                    aria-label="Navegar entre alunos"
                  >
                    <button
                      type="button"
                      className={styles.alunoPagerBtn}
                      onClick={() => goByDelta(-1)}
                      disabled={curIndex <= 0}
                      title="Anterior (←)"
                      aria-label="Aluno anterior"
                    >
                      ◀
                    </button>

                    <span className={styles.alunoPagerCount}>
                      {alunos.length > 0
                        ? `${curIndex + 1}/${alunos.length}`
                        : "0/0"}
                    </span>

                    <button
                      type="button"
                      className={styles.alunoPagerBtn}
                      onClick={() => goByDelta(1)}
                      disabled={curIndex >= alunos.length - 1}
                      title="Próximo (→)"
                      aria-label="Próximo aluno"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* KPIs */}
            <section className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.tooltipContainer}>
                  <span className={styles.kpiValue}>{fmt1(mediaGeral)}</span>
                  <span className={styles.kpiLabel}>Média Geral</span>
                  <span className={styles.tooltipText}>
                    Média geral calculada com base nas médias das disciplinas.
                  </span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.tooltipContainer}>
                  <span className={styles.kpiValue}>{frequencia}</span>
                  <span className={styles.kpiLabel}>Frequência (%)</span>
                  <span className={styles.tooltipText}>
                    Frequência geral calculada desconsiderando as justificativas
                    de ausência.
                  </span>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>{faltasTotal}</span>
                <span className={styles.kpiLabel}>Faltas (ano)</span>
              </div>
            </section>

            {/* Gráficos */}
            <section className={styles.chartsGrid}>
              <div className={`${styles.chartCard} ${styles.radarCard}`}>
                <h3>Forças e fraquezas (média por disciplina)</h3>

                <div className={styles.radarControls}>
                  {/* Média (azul) */}
                  <label className={styles.legendItem}>
                    <input
                      type="checkbox"
                      checked={showMedia}
                      onChange={(e) => setShowMedia(e.target.checked)}
                    />
                    <span
                      className={styles.legendSwatch}
                      style={{
                        backgroundColor: "rgba(92,179,255,0.22)",
                        border: "2px solid #5cb3ff",
                      }}
                    />
                    <span className={styles.legendText}>
                      Média do estudante
                    </span>
                  </label>

                  {/* Meta (cinza pontilhado) */}
                  <label className={styles.legendItem}>
                    <input
                      type="checkbox"
                      checked={showMeta}
                      onChange={(e) => setShowMeta(e.target.checked)}
                    />
                    <span
                      className={styles.legendSwatch}
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, #6b7280, #6b7280 4px, transparent 4px, transparent 8px)",
                        border: "1px solid #6b7280",
                      }}
                    />
                    <span className={styles.legendText}>
                      Meta ({MEDIA_CORTE})
                    </span>
                  </label>
                </div>

                <div className={styles.radarWrap}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Notas por disciplina</h3>
                <div className={styles.cotainerBar}>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </section>

            {/* Tabela */}
            <section
              className={styles.tableWrap}
              aria-label="Detalhes por disciplina"
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th>B1</th>
                    <th>B2</th>
                    <th>B3</th>
                    <th>B4</th>
                    <th>Média</th>
                    <th>Faltas</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplinas.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.nome}</td>
                      <td className={notaClasse(d.me1)}>{fmtInt(d.me1)}</td>
                      <td className={notaClasse(d.me2)}>{fmtInt(d.me2)}</td>
                      <td className={notaClasse(d.me3)}>{fmtInt(d.me3)}</td>
                      <td className={notaClasse(d.me4)}>{fmtInt(d.me4)}</td>
                      <td>{fmtInt(d.media)}</td>
                      <td>{Number.isFinite(d.faltas) ? d.faltas : "-"}</td>
                      <td>
                        <span
                          className={`${styles.chip} ${statusClass(d.status)}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   Export default com Suspense
   ============================================================ */
export default function SituacaoDoAluno() {
  return (
    <Suspense fallback={null}>
      <SituacaoDoAlunoInner />
    </Suspense>
  );
}
