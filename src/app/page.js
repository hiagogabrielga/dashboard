"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import BlurText from "./BlurText";
import FadeContent from "./FadeContent";
import { AlignEndHorizontal, Brain, Lightbulb, Book, GraduationCap } from 'lucide-react';
import { FaReact, FaNodeJs, FaPython } from "react-icons/fa";

/* ===========================
   ÍCONES (SVG outline)
=========================== */
const Icon = {
  search: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <path d="M8.5 8A2.5 2.5 0 1 1 6 5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 8A2.5 2.5 0 1 0 18 5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v12" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12H6a3 3 0 0 0 0 6h2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h2a3 3 0 1 1 0 6h-2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <rect x="3" y="10" width="4" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="4" width="4" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="17" y="14" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <path d="M9 18h6M10 22h4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2a7 7 0 0 0-4 12.9V17h8v-2.1A7 7 0 0 0 12 2Z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <path d="M4 5a3 3 0 0 1 3-3h13v18H7a3 3 0 0 0-3 3V5Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 2v18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24" className={styles.impactIcon} aria-hidden>
      <path d="m12 3 10 5-10 5L2 8l10-5Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M22 12v4a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-4" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" className={styles.techIcon} aria-hidden>
      <path d="m8 16-4-4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16 8 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14 4 10 20" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  blocks: (
    <svg viewBox="0 0 24 24" className={styles.techIcon} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" className={styles.techIcon} aria-hidden>
      <ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

/* ===== NOVO: helper que desenha os botões sociais se houver link ===== */
const SocialLinks = ({ github, linkedin, lattes }) => {
  return (
    <div className={styles.memberSocials}>
      {github && (
        <a
          aria-label="GitHub"
          href={github}
          className={styles.socialBtn}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-3.162 19.492c.5.094.684-.218.684-.483 0-.237-.009-.866-.014-1.7-2.782.605-3.37-1.34-3.37-1.34-.455-1.156-1.11-1.465-1.11-1.465-.908-.62.07-.607.07-.607 1.004.07 1.532 1.031 1.532 1.031.892 1.53 2.341 1.088 2.91.833.091-.646.35-1.088.636-1.339-2.221-.253-4.555-1.11-4.555-4.942 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.908-1.294 2.747-1.025 2.747-1.025.546 1.376.203 2.393.1 2.646.641.699 1.028 1.592 1.028 2.683 0 3.842-2.338 4.686-4.566 4.935.359.31.678.922.678 1.858 0 1.341-.012 2.422-.012 2.753 0 .268.18.581.69.482A10.001 10.001 0 0 0 12 2z" />
          </svg>
        </a>
      )}
      {linkedin && (
        <a
          aria-label="LinkedIn"
          href={linkedin}
          className={styles.socialBtn}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.27 2.32-2.6 4.78-2.6C21.78 7.6 24 9.7 24 13.6V24h-5v-8.9c0-2.1-.04-4.8-2.92-4.8-2.93 0-3.38 2.3-3.38 4.7V24H8z" />
          </svg>
        </a>
      )}
      {lattes && (
        <a
          aria-label="Currículo Lattes"
          href={lattes}
          className={styles.socialBtn}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/images/lattes.png"   // <= sua imagem
            alt="Currículo Lattes"
            width={23}
            height={23}
            className={styles.socialIcon}   // opcional: estilo abaixo
            priority={false}
          />
        </a>
      )}

    </div>
  );
};

export default function IFROLanding() {
  const router = useRouter();

  // ===== NOVO: links por participante (preencha com as URLs reais) =====
  const TEAM = [
    {
      id: "douglas",
      nome: "Douglas Legramante",
      role: "Coordenador do Projeto",
      img: "/images/douglas.png",
      github: "https://github.com/douglaslegramante",     // <-- edite aqui
      linkedin: "https://www.linkedin.com/in/legramante/",     // <-- edite aqui
      lattes: "http://lattes.cnpq.br/1359378222817028"                   // <-- edite aqui
    },
    {
      id: "amara",
      nome: "Amara Liz Egler Cardoso",
      role: "Técnica em Informática\nBolsista CNPq Iniciação Cientifica",
      img: "/images/amara.png",
      github: "https://github.com/Lizynmc",
      linkedin: "https://www.linkedin.com/in/amara-liz-egler-681a1623a/",
      lattes: "http://lattes.cnpq.br/7960579048014901"
    },
    {
      id: "bento",
      nome: "João Pedro Bento de Andrade",
      role: "Estudante Curso Técnico em Informática\nBolsista CNPq Iniciação Cientifica",
      img: "/images/bento.png",
      github: "https://github.com/joaobent",
      linkedin: "https://www.linkedin.com/in/joão-pedro-241a69390",
      lattes: "http://lattes.cnpq.br/3709096197187476"
    },
    {
      id: "hiago",
      nome: "Hiago Gabriel Gonçalves André",
      role: "Estudante Curso Técnico em Informática\nBolsista CNPq Iniciação Cientifica",
      img: "/images/hiago.png",
      github: "https://github.com/hiagogabrielga",
      linkedin: "https://www.linkedin.com/in/hiago-gabriel-94a687336/",
      lattes: "http://lattes.cnpq.br/9516535943525871"
    },
    {
      id: "guerini",
      nome: "João Pedro Guerini Pasquali",
      role: "Estudante Curso Técnico em Informática\nBolsista CNPq Iniciação Cientifica",
      img: "/images/guerini.png",
      github: "https://github.com/JoaoGuerini",
      linkedin: "https://www.linkedin.com/in/joao-pedro-guerini-pasquali-34498a267/",
      lattes: "http://lattes.cnpq.br/0624841160399313"
    },
    {
      id: "lucas",
      nome: "José Lucas Brandão Montes",
      role: "Professor Colaborador",
      img: "/images/lucas.png",
      github: "https://github.com/zehlucas",
      linkedin: "https://www.linkedin.com/in/zehlucas/",
      lattes: "http://lattes.cnpq.br/5693913979773730"
    }
  ];

  return (
    <div className={styles.page}>
      {/* NAVBAR */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <img
              src="/images/logo.png"
              alt="IFRO Campus Vilhena — Dashboard Interativo"
              className={styles.logo}
              loading="eager"
              decoding="async"
            />
          </Link>

          <nav className={styles.nav}>
            <Link href="#inicio" className={styles.navLink}>Início</Link>
            <Link href="#resumo" className={styles.navLink}>Sobre</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section id="inicio" className={`${styles.hero} ${styles.section}`}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              <BlurText
                text="Dashboard para Análise de Desempenho Acadêmico"
                animateBy="words"
                direction="top"
                delay={120}
                stepDuration={0.5}
                easing={(t) => 1 - Math.pow(1 - t, 3)}
                className={styles.heroTitle}
                //onAnimationComplete={() => console.log("Hero title anim finished!")}
              />
            </h1>

            <p className={styles.heroText}>
              Uma ferramenta automatizada para otimizar os conselhos de classe e fortalecer as
              práticas pedagógicas no IFRO - Campus Vilhena.
            </p>

            <div className={styles.btnGroup}>
              <button
                onClick={() => router.push("#resumo")}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Saiba mais
              </button>

              <Link href="/dashboard/mapaDaTurma" className={`${styles.btn} ${styles.btnSecondary}`}>
                Entrar
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <FadeContent
              blur={true}
              duration={1200}
              easing="ease-out"
              initialOpacity={0}
              threshold={0.2}
              className={styles.heroImgWrap}
            >
              <Image
                src="/images/pc.png"
                alt="Gráficos do dashboard em um notebook"
                width={1200}
                height={800}
                priority
                className={styles.heroImg}
              />
            </FadeContent>
          </div>
        </div>
      </section>

      {/* RESUMO */}
      <section id="resumo" className={`${styles.resumo} ${styles.section}`}>
        <h2 className={styles.resumoTitle}>Resumo do Projeto</h2>
        <div className={styles.resumoCard}>
          <p className={styles.resumoText}>
            O projeto visa desenvolver um <span className={styles.highlight}>dashboard para análise de desempenho acadêmico</span> dos estudantes dos
            cursos técnicos integrados ao ensino médio do IFRO – Campus Vilhena. A iniciativa automatiza a coleta e análise de dados do SUAP,
            possibilitando uma <span className={styles.highlight}>visualização em tempo real</span> por curso, turma e disciplina. A plataforma busca reduzir
            o tempo de análise, minimizar erros humanos e apoiar decisões pedagógicas mais assertivas.
          </p>
        </div>
      </section>

      {/* WHY */}
      <section className={`${styles.why} ${styles.section}`}>
        <h3 className={styles.whyTitle}>Por que criamos esta solução</h3>

        <div className={styles.cards}>
          <article className={`${styles.card} ${styles.cardProblem}`}>
            <div className={styles.cardIconWrapProblem}>
              <svg viewBox="0 0 24 24" className={styles.cardIcon}>
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h4 className={styles.cardTitle}>O Problema</h4>
            <p className={styles.cardText}>
              O processo manual de coleta e análise de dados nos conselhos de classe é demorado e sujeito a erros,
              dificultando a identificação rápida de alunos com baixo rendimento.
            </p>
          </article>

          <article className={`${styles.card} ${styles.cardSolution}`}>
            <div className={styles.cardIconWrapSolution}>
              <svg viewBox="0 0 24 24" className={styles.cardIcon}>
                <path d="M9 18h6M10 22h4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2a7 7 0 0 0-4 12.9V17h8v-2.1A7 7 0 0 0 12 2Z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h4 className={styles.cardTitle}>A Solução</h4>
            <p className={styles.cardText}>
              Um dashboard automatizado e interativo, capaz de integrar dados diretamente do SUAP e exibir relatórios
              e gráficos dinâmicos em tempo real.
            </p>
          </article>
        </div>
      </section>

      {/* IMPACTO ESPERADO */}
      <section className={`${styles.impact} ${styles.section}`}>
        <div className={styles.impactInner}>
          <h3 className={styles.impactTitle}>Impacto Esperado</h3>

          <div className={styles.impactGrid}>
            {[
              { icon: Icon.search, title: "Análise Rápida e Precisa", text: "Processamento automatizado dos dados acadêmicos" },
              { icon: <Brain size={25}/>, title: "Decisões Pedagógicas", text: "Apoio fundamentado para estratégias educacionais" },
              { icon: <AlignEndHorizontal size={25}/>, title: "Visualização Intuitiva", text: "Dados organizados por curso, turma e disciplina" },
              { icon: <Lightbulb size={25}/>, title: "Identificação Precoce", text: "Detecção de alunos com baixo rendimento" },
              { icon: <Book size={25}/>, title: "Melhoria do Ensino", text: "Contribuição para a qualidade educacional" },
              { icon: <GraduationCap size={25}/>, title: "Redução da Evasão", text: "Intervenções pedagógicas mais efetivas" },
            ].map((c, i) => (
              <article key={i} className={styles.impactCard}>
                <div className={styles.impactIconWrap}>{c.icon}</div>
                <h4 className={styles.impactCardTitle}>{c.title}</h4>
                <p className={styles.impactCardText}>{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TECNOLOGIAS */}
      <section className={`${styles.tech} ${styles.section}`}>
        <div className={styles.techInner}>
          <h3 className={styles.techTitle}>Tecnologias</h3>

          <div className={styles.techGrid}>
            {[
              { icon: <FaPython size={30}/>, title: "Python", text: "Processamento e automação da coleta de dados acadêmicos" },
              { icon: <FaReact size={30}/>, title: "React JS", text: "Criação do Front-End com dashboards interativos e visualizações dinâmicas" },
              { icon: <FaNodeJs size={30}/>, title: "Node Express", text: "API de Integração dos dados com o Front-End" },
            ].map((t, idx) => (
              <article key={idx} className={styles.techCard}>
                <div className={styles.techIconWrap}>{t.icon}</div>
                <h4 className={styles.techCardTitle}>{t.title}</h4>
                <p className={styles.techCardText}>{t.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NOSSA EQUIPE (fotos) */}
      <section className={`${styles.team} ${styles.section}`}>
        <div className={styles.teamInner}>
          <h3 className={styles.teamTitle}>Nossa Equipe</h3>

          <div className={styles.teamGrid}>
            {TEAM.map((m) => (
              <article key={m.id} className={styles.memberCard}>
                <div className={styles.memberPhotoWrap}>
                  <Image
                    src={m.img}
                    alt={m.nome}
                    width={160}
                    height={160}
                    className={styles.memberPhoto}
                  />
                </div>

                <h4 className={styles.memberName}>{m.nome}</h4>
                <p className={styles.memberRole}>{m.role}</p>

                {/* Ícones sociais por membro (somente se houver link) */}
                <SocialLinks github={m.github} linkedin={m.linkedin} lattes={m.lattes} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CALL-TO-ACTION FINAL (LOGIN) */}
      <section className={`${styles.callout} ${styles.section} `}>
        <div className={styles.calloutInner}>
          <h3 className={styles.calloutTitle}>Transformando dados em decisões pedagógicas</h3>
          <p className={styles.calloutText}>
            Com este projeto, o IFRO – Campus Vilhena fortalece o uso de tecnologia educacional
            para aprimorar a gestão acadêmica e promover o sucesso dos estudantes.
          </p>
          <Link href="/login" className={`${styles.btn} ${styles.calloutBtn}`}>Login</Link>
        </div>

        {/* FOOTER */}
        <footer id="contato" className={styles.footer}>
          <div className={styles.footerInner}>
            <Link href="/" className={styles.footerBrand}>
              <img
                src="/images/logoifbranca.png"
                alt="IFRO Campus Vilhena — Dashboard Interativo"
                className={styles.footerLogo}
                loading="lazy"
                decoding="async"
              />
            </Link>

            <div className={styles.footerCols}>
              <div className={styles.footerCol}>
                <h5 className={styles.footerColTitle}>Navegação</h5>
                <ul className={styles.footerList}>
                  <li><Link href="#inicio" className={styles.footerLink}>Início</Link></li>
                  <li><Link href="#resumo" className={styles.footerLink}>Resumo</Link></li>
                  <li><Link href="/login" className={styles.footerLink}>Login</Link></li>
                </ul>
              </div>

              <div className={styles.footerCol}>
                <h5 className={styles.footerColTitle}>Projeto</h5>
                <p className={styles.footerText}>
                  Dashboard para análise de desempenho acadêmico.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} IFRO – Campus Vilhena</p>
            <Link href="#inicio" className={styles.footerBottomLink}>Voltar ao topo ↑</Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
