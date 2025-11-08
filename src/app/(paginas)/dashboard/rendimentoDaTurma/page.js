"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";

import { getAlunos } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";

const MEDIA_CORTE = 60;

export default function RendimentoDaTurma() {
  const pathname = usePathname();
  const router = useRouter();
  const { filtros, setQtdEstudantes } = useDashboard();

  const [alunos, setAlunos] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  

  /* ================= Carrega alunos ================= */
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

  useEffect(() => {
    if (setQtdEstudantes) setQtdEstudantes(alunos.length);
  }, [alunos.length, setQtdEstudantes]);

  /* ================= Helpers ================= */
  const toNum = (x) => {
    const s = String(x ?? "")
      .replace(",", ".")
      .trim();
    if (!s || s === "-") return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  };

  const toInt = (x) => {
    const v = toNum(x);
    return v == null ? null : Math.max(0, Math.round(v));
  };

  // Total de faltas do aluno, considerando campos diretos ou soma por disciplina/bimestre
  const faltasAluno = (a) => {
    // tenta campos diretos comuns
    const direto = toInt(
      a?.TotalFaltas ?? a?.Faltas ?? a?.totalFaltas ?? a?.faltas
    );
    if (direto != null) return direto;

    // senão, soma por disciplinas / bimestres ativos
    const discs = a?.Disciplinas || [];
    let soma = 0;

    discs.forEach((d) => {
      // alguns datasets trazem "Faltas" agregadas por disciplina
      const faltasDisc = toInt(d?.Faltas ?? d?.FALTAS);
      if (faltasDisc != null) {
        soma += faltasDisc;
        return;
      }
      // senao, tenta por bimestre (FB1/FaltasB1/Faltas1 etc.)
      bimIndices.forEach((i) => {
        const v =
          toInt(d?.[`FaltasB${i}`]) ??
          toInt(d?.[`Faltas${i}`]) ??
          toInt(d?.[`F${i}`]);
        if (v != null) soma += v;
      });
    });

    return soma;
  };

  // Faltas do aluno considerando SOMENTE os bimestres ativos
  const faltasAlunoAtivo = (a) => {
    // 1) Tenta somar no ALUNO por bimestre (FaltasB1/Faltas1/FB1 etc.)
    let somaAluno = 0;
    let achouAlunoPorBim = false;
    bimIndices.forEach((i) => {
      const v =
        toInt(a?.[`FaltasB${i}`]) ??
        toInt(a?.[`F${i}`]) ??
        toInt(a?.[`FB${i}`]);
      if (v != null) {
        somaAluno += v;
        achouAlunoPorBim = true;
      }
    });
    if (achouAlunoPorBim) return somaAluno;

    // 2) Senão, tenta por DISCIPLINAS e bimestres
    const discs = a?.Disciplinas || [];
    let soma = 0;
    let achouDiscPorBim = false;

    discs.forEach((d) => {
      let adicionouPorBim = false;

      // por bimestre dentro da disciplina
      bimIndices.forEach((i) => {
        const v =
          toInt(d?.[`FaltasB${i}`]) ??
          toInt(d?.[`F${i}`]) ??
          toInt(d?.[`FB${i}`]);
        if (v != null) {
          soma += v;
          achouDiscPorBim = true;
          adicionouPorBim = true;
        }
      });

      // se não houver por bimestre, alguns datasets trazem total por disciplina
      // só usamos esse total se TODOS os 4 bimestres estiverem ativos
      if (!adicionouPorBim) {
        const faltasDiscTotal = toInt(d?.Faltas ?? d?.FALTAS);
        if (faltasDiscTotal != null && bimIndices.length === 4) {
          soma += faltasDiscTotal;
          achouDiscPorBim = true;
        }
      }
    });

    if (achouDiscPorBim) return soma;

    // 3) Por fim, se existir APENAS total agregado no aluno, só é válido quando 4 bimestres ativos
    const direto = toInt(
      a?.TotalFaltas ?? a?.Faltas ?? a?.totalFaltas ?? a?.faltas
    );
    if (direto != null && bimIndices.length === 4) return direto;

    // Sem dados compatíveis com o filtro
    return null;
  };

  // Bimestres ativos vindos do filtro (default: 1..4)
    const bimIndices = useMemo(() => {
    const b = filtros?.bimestres || {};
    const map = { b1: 1, b2: 2, b3: 3, b4: 4 };
    const list = Object.entries(map)
      .filter(([k]) => b[k])
      .map(([, i]) => i);
    return list; // 👈 sem fallback [1,2,3,4]
  }, [filtros?.bimestres]);
  //console.log(bimIndices)
  // Média da disciplina usando SOMENTE bimestres ativos
  const mediaDiscAtiva = (disc) => {
    const valores = bimIndices
      .map((i) => toNum(disc[`ME${i}`]))
      .filter((v) => v !== null);
    if (valores.length) {
      const soma = valores.reduce((a, b) => a + b, 0);
      return Math.round(soma / valores.length);
    }
    const m = toNum(disc.Media ?? disc.media);
    return m !== null ? Math.round(m) : null;
  };

  /* ============== Cabeçalho ============== */
  const headerDisciplinas = useMemo(() => {
    const a0 = alunos?.[0];
    const arr = a0?.Disciplinas || [];
    return arr
      .map((d) => d.NomeDisciplina || d.Nome || d.Disciplina)
      .filter(Boolean);
  }, [alunos]);

  /* ============== Linhas ============== */
  const tableRows = useMemo(() => {
    return (alunos || []).map((a) => {
      const idxByNome = new Map();
      headerDisciplinas.forEach((n, i) => idxByNome.set(n, i));
      const medias = Array(headerDisciplinas.length).fill(null);

      (a.Disciplinas || []).forEach((d) => {
        const nome = d.NomeDisciplina || d.Nome || d.Disciplina;
        const i = idxByNome.get(nome);
        if (i != null) medias[i] = mediaDiscAtiva(d);
      });

      return {
        id: String(a.Matricula || a.id),
        nome: a.Nome ?? "Aluno",
        medias,
        faltas: faltasAlunoAtivo(a), // << NOVO
      };
    });
  }, [alunos, headerDisciplinas, bimIndices]);

  /* ============== Ranking ============== */
  const qtdAbaixoDaMedia = (r) =>
    r.medias.reduce(
      (acc, v) => acc + (v != null && v < MEDIA_CORTE ? 1 : 0),
      0
    );

  const ranking = useMemo(() => {
    return [...tableRows]
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        abaixo: qtdAbaixoDaMedia(r),
        faltas: r.faltas ?? 0, // << NOVO
      }))
      .sort((a, b) => b.abaixo - a.abaixo)
      .slice(0, 30);
  }, [tableRows]);

  /* ============== Paleta Pastel Transparente (com azul para 0) ============== */
  /**
   * Paleta suave e agradável (~60% opaca):
   * 0 → Azul Suave (#A8C9FF99)
   * 1 → Verde Suave (#A8D09C99)
   * 2 → Verde Menta (#D9EDC599)
   * 3 → Amarelo Pastel (#FFF3B899)
   * 4 → Laranja Pêssego (#FFC99A99)
   * 5+ → Salmão Suave (#FF9A9A99)
   */
  const cmap = (count) => {
    if (count === 0) return "#a8c9ff50"; // azul pastel translúcido
    if (count === 1) return "#A8D09C99"; // verde suave
    if (count === 2) return "#D9EDC599"; // verde menta
    if (count === 3) return "#FFF3B899"; // amarelo pastel
    if (count === 4) return "#FFC99A99"; // pêssego suave
    return "#FF9A9A99"; // salmão suave (5+)
  };

  const goAluno = (id) => {
    router.push(`/dashboard/situacaoDoAluno?alunoId=${encodeURIComponent(id)}`);
  };

  /* ============== Render ============== */
  return (
    <div className={styles.page}>
      {" "}
      {!bimIndices.length ? (
        <div style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
          Nenhum bimestre selecionado — selecione ao menos um para exibir dados.
        </div>
      ) : (
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

          {loading && <div style={{ padding: 12 }}>Carregando…</div>}
          {erro && (
            <div style={{ padding: 12, color: "red" }}>Erro: {erro}</div>
          )}

          {!loading && !erro && (
            <section className={styles.twoCol}>
              {/* ESQUERDA */}
              <div
                className={styles.leftPane}
                aria-label="Notas por aluno e disciplina"
              >
                <div className={`${styles.tableWrap} ${styles.equalHeight}`}>
                  <table className={`${styles.table} ${styles.stickyHeader}`}>
                    <thead>
                      <tr>
                        <th className={styles.thNome}>Nome</th>
                        {headerDisciplinas.map((d) => (
                          <th key={d}>
                            <span className={styles.thScroll} title={d}>
                              {d}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((r) => (
                        <tr
                          key={r.id}
                          className={styles.rowClickable}
                          tabIndex={0}
                          role="button"
                          onClick={() => goAluno(r.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              goAluno(r.id);
                          }}
                          aria-label={`Abrir ${r.nome}`}
                        >
                          <td className={styles.tdNome}>{r.nome}</td>
                          {r.medias.map((v, i) => (
                            <td
                              key={`${r.id}-${i}`}
                              className={
                                v != null
                                  ? v >= MEDIA_CORTE
                                    ? styles.cellOk
                                    : styles.cellBad
                                  : ""
                              }
                            >
                              {v != null ? v : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DIREITA — Ranking com azul para 0 e paleta pastel translúcida */}
              <aside
                className={styles.rightPane}
                aria-label="Qtd. Matérias Abaixo da Média"
              >
                <h3 className={styles.sideTitle}>
                  Qtd. Matérias Abaixo da Média
                </h3>

                <div className={`${styles.sideScroll} ${styles.equalHeight}`}>
                  <div className={`${styles.sideRow} ${styles.sideHeader}`}>
                    <span>Nome</span>
                    <span>Qtd. Matérias</span>
                    <span>T. de Faltas</span>
                  </div>

                  {ranking.map((r) => {
                    const bg = cmap(r.abaixo);
                    return (
                      <div
                        key={r.id}
                        className={styles.sideRow}
                        style={{ backgroundColor: bg }}
                        onClick={() => goAluno(r.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") goAluno(r.id);
                        }}
                        role="button"
                        tabIndex={0}
                        title={r.nome}
                      >
                        <span className={styles.sideNome}>{r.nome}</span>
                        <span className={styles.sideBadgeWhite}>
                          {r.abaixo}
                        </span>
                        <span className={styles.sideBadgeWhite}>
                          {r.faltas}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </aside>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
