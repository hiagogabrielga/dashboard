"use client";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Sidebar } from "@/components/lateralBar";
import { DashboardCtx } from "@/context/DashboardContext";
import styles from "./layout.module.css";
import { Header } from "@/components/Header";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isMapaDaTurma = pathname.includes("/mapaDaTurma");

  const [filtros, setFiltros] = useState({
    curso: "Todos",
    turma: "Todos",
    turno: "Todos",
    ano: "Todos",
    situacao: "Todos",
    bimestres: { b1: true, b2: true, b3: true, b4: true },
  });

  const [showBar, setShowBar] = useState(true);
  const [qtdEstudantes, setQtdEstudantes] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const userName = Cookies.get("nome") ?? "";

  // detecta se é mobile (<= 990px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 990);
    };
    handleResize(); // executa 1x no load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const ctxValue = useMemo(
    () => ({
      filtros,
      setFiltros,
      showBar,
      setShowBar,
      userName,
      qtdEstudantes,
      setQtdEstudantes,
    }),
    [filtros, showBar, userName, qtdEstudantes]
  );

  // define o marginLeft conforme o tamanho da tela
  const marginLeft =
    isMobile && showBar ? 260 : isMobile ? 0 : 0; 
  // acima de 990px não desloca (fica 0)

  return (
    <DashboardCtx.Provider value={ctxValue}>
      <div className={isMapaDaTurma ? "fundoBranco" : "fundoPadrao"}>
        <Header/>
        <div className={styles.espacamento}/>
        <Sidebar
          userName={userName}
          filtros={filtros}
          setFiltros={setFiltros}
          showbar={showBar}
          qtdEstudantes={qtdEstudantes}
          onLogout={() => (window.location.href = "/login")}
        />

        {/* Botão para abrir/fechar barra lateral */}
        <button
          style={{
            marginLeft: showBar ? "270px" : "10px",
          }}
          onClick={() => setShowBar(!showBar)}
          className={styles.botaoBar}
        >
          {showBar ? "<" : ">"}
        </button>

        {/* Conteúdo principal */}
        <section
          className="dashContent"
          style={{
            marginLeft: isMobile && showBar ? 260 : 0,
            transition: isMobile ? "margin-left .25s ease" : "none",
          }}
        >
          {children}
        </section>
      </div>
    </DashboardCtx.Provider>
  );
}
