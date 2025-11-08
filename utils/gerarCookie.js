import jwt from "jsonwebtoken";

export function gerarToken(dadosUsuario) {
  const payload = {
    nome: dadosUsuario.nome_usual,
    matricula: dadosUsuario.matricula,
    tipo: dadosUsuario.tipo_vinculo
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}