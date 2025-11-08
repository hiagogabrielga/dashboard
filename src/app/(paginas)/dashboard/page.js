import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
          <h1>Dashboard para Análise de Desempenho Acadêmico</h1>
      </main>
    </div>
  );
}
