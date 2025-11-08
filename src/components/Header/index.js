"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./header.module.css";

export function Header() {
  const path = usePathname();
  const [linhas, setLinhas] = useState([]);

  const titulos = {
    "/dashboard/mapaDaTurma": "MAPA DA TURMA",
    "/dashboard/rendimentoDaTurma": "RENDIMENTO DA TURMA",
    "/dashboard/situacaoDoAluno": "SITUAÇÃO DO ESTUDANTE",
  };

  const subTitulos = {
    "/": "Dashboard",
    "/login": "Dashboard",
    "/dashboard": "Dashboard",
  };

  const titulo = titulos[path] || "DESEMPENHO ACADÊMICO";
  const subTitulo = subTitulos[path] || "";

  useEffect(() => {
    const gerarCorVerde = () => {
      const lightness = Math.floor(Math.random() * 40) + 30;
      return `hsl(120, 60%, ${lightness}%)`;
    };

    const gerarLinhas = () => {
      const larguraTela = window.innerWidth;

      // Define o tamanho aproximado de cada quadrado (incluindo gap)
      const tamanhoQuadrado = 70; // px

      // Calcula quantos quadrados cabem por linha
      const qtdPorLinha = Math.floor(larguraTela / tamanhoQuadrado);

      // Cria 2 linhas com essa quantidade
      const novasLinhas = Array.from({ length: 2 }, () =>
        Array.from({ length: qtdPorLinha }, gerarCorVerde)
      );

      setLinhas(novasLinhas);
    };

    gerarLinhas();

    // Atualiza automaticamente ao redimensionar a janela
    window.addEventListener("resize", gerarLinhas);

    // Limpa o listener ao desmontar o componente
    return () => window.removeEventListener("resize", gerarLinhas);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.squareBackground}>
        {linhas.map((linha, i) => (
          <div key={i} className={styles.row}>
            {linha.map((cor, j) => (
              <div
                key={j}
                className={styles.square}
                style={{ backgroundColor: cor }}
              ></div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.container}>
        <h1 className={styles.title}>{titulo}</h1>
        <h2 className={styles.subtitle}>{subTitulo}</h2>
      </div>
    </header>
  );
}
