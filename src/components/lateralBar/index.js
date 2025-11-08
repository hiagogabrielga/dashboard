"use client";
import Cookies from "js-cookie";
import styles from "./lateralBar.module.css";
import { useState, useEffect, useMemo } from "react";
import { getParametros } from "@/lib/api";
import Link from "next/link";
export function Sidebar({
  userName = {},
  filtros = {},
  setFiltros = () => {},
  showbar = true,
  /** passe do page: alunos.length */
  qtdEstudantes = 0,
}) {
  const [parametros, setParametros] = useState({
    curso: ["Todos"],
    ano: ["Todos"],
    turma: ["Todos"],
    turno: ["Todos"],
    situacao: ["Todos"],
  });

  const handleChange = (key) => (e) =>
    setFiltros((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCheck = (key) => (e) =>
    setFiltros((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [e.target.value]: e.target.checked },
    }));

  // carrega listas de opções
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await getParametros();
        if (!cancelled) setParametros(resp);
      } catch (e) {
        console.error("Erro ao carregar parâmetros:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // garante bimestres marcados por padrão (se ainda não houver nada)
  useEffect(() => {
    if (!filtros?.bimestres) {
      setFiltros((prev) => ({
        ...prev,
        bimestres: { b1: true, b2: true, b3: true, b4: true },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      try {
        await logout(); // backend deve limpar o cookie HttpOnly
      } finally {
        // limpeza local adicional
        ["nome", "matricula", "servidor", "auth_token"].forEach((k) => {
          Cookies.remove(k, { path: "/" });
          Cookies.remove(k, { path: "/", domain: window.location.hostname });
          Cookies.remove(k, {
            path: "/",
            domain: "." + window.location.hostname,
          });
        });
        window.location.href = "/login";
      }
    }
  };
  // util: coloca "Todos" no topo e remove duplicados
  const withTodos = (arr = []) => {
    const list = Array.from(new Set((arr || []).filter(Boolean)));
    return list[0] === "Todos"
      ? list
      : ["Todos", ...list.filter((v) => v !== "Todos")];
  };

  const opt = (arr = []) =>
    withTodos(arr).map((v) => <option key={v}>{v}</option>);

  // --- ANO → TURMA ---
  const anoNum = useMemo(() => {
    const a = filtros.ano;
    if (!a || a === "Todos") return null;
    const m = String(a).match(/\d+/);
    return m ? m[0] : null;
  }, [filtros.ano]);

  const turmasTodas = useMemo(
    () => withTodos(parametros?.turma || []),
    [parametros?.turma]
  );

  const turmasFiltradas = useMemo(() => {
    if (!anoNum) return turmasTodas;
    // Convenção: turma começa com o número do ano (ex.: "3A", "3ºA", "3B"...)
    const base = (parametros?.turma || []).filter(Boolean);
    const filtradas = base.filter((t) =>
      String(t).toUpperCase().startsWith(String(anoNum))
    );
    return withTodos(filtradas.length ? filtradas : base);
  }, [parametros?.turma, anoNum, turmasTodas]);

  // Se a turma atual deixa de existir após trocar o ano, volta para "Todos"
  useEffect(() => {
    setFiltros((prev) => {
      const atual = prev.turma;
      if (atual && atual !== "Todos" && !turmasFiltradas.includes(atual)) {
        return { ...prev, turma: "Todos" };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmasFiltradas]);

  return (
    <aside
      style={{ width: showbar ? "260px" : "0px" }}
      className={styles.sidebar}
      aria-label="Barra lateral de filtros"
      aria-hidden={!showbar}
    >
      <div className={styles.userCard}>
        <span className={styles.userNames}>Usuário</span>
      </div>

      <Link className={styles.logout} href={'/'}>
        Logout
      </Link>

      <hr className={styles.divider} />

      {/* KPI simples na lateral */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCardEstudante}>
          <span className={styles.kpiLabel}>Qtd. de estudantes</span>
          <span className={styles.kpiValue}>{qtdEstudantes}</span>
        </div>
      </section>

      <h3 className={styles.sectionTitle}>Filtros</h3>

      <div className={styles.filters}>
        <label className={styles.label} htmlFor="curso">
          Curso:
        </label>
        <div className={styles.selectWrap}>
          <select
            id="curso"
            className={styles.select}
            value={filtros.curso ?? "Todos"}
            onChange={handleChange("curso")}
          >
            {opt(parametros.curso)}
          </select>
        </div>

        <label className={styles.label} htmlFor="turma">
          Turma:
        </label>
        <div className={styles.selectWrap}>
          <select
            id="turma"
            className={styles.select}
            value={filtros.turma ?? "Todos"}
            onChange={handleChange("turma")}
          >
            {opt(turmasFiltradas)}
          </select>
        </div>

        <label className={styles.label} htmlFor="turno">
          Turno:
        </label>
        <div className={styles.selectWrap}>
          <select
            id="turno"
            className={styles.select}
            value={filtros.turno ?? "Todos"}
            onChange={handleChange("turno")}
          >
            {opt(parametros.turno)}
          </select>
        </div>

        <label className={styles.label} htmlFor="ano">
          Ano:
        </label>
        <div className={styles.selectWrap}>
          <select
            id="ano"
            className={styles.select}
            value={filtros.ano ?? "Todos"}
            onChange={handleChange("ano")}
          >
            {opt(parametros.ano)}
          </select>
        </div>

        <label className={styles.label} htmlFor="situacao">
          Situação:
        </label>
        <div className={styles.selectWrap}>
          <select
            id="situacao"
            className={styles.select}
            value={filtros.situacao ?? "Todos"}
            onChange={handleChange("situacao")}
          >
            {opt(parametros.situacao)}
          </select>
        </div>

        <h4 className={styles.subTitle}>Selecione os bimestres:</h4>
        <ul className={styles.checkList}>
          {["b1", "b2", "b3", "b4"].map((key, i) => (
            <li key={key} className={styles.checkItem}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  value={key}
                  checked={Boolean(filtros.bimestres?.[key])}
                  onChange={handleCheck("bimestres")}
                  className={styles.checkbox}
                />
                <span>{`${i + 1}º Bimestre`}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
