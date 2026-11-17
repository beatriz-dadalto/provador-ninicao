import { ultimo } from "../colecoes";
import type { Modelo, TamanhoGrade } from "../modelo";
import type { Confianca, Recomendacao } from "../recomendacao";

/**
 * Zona de transição: o tamanho menor fica até 2 cm abaixo do alvo. Nessa zona decide
 * `modelo.desempate` ("maior": o que cabe com folga; "menor": o menor, para malha elástica).
 */
export const MARGEM_DESEMPATE_CM = 2;

/**
 * Regra única de tamanho, compartilhada por medida e estimativa (DRY).
 * A grade tem no máximo ~6 tamanhos: busca linear O(n) é mais simples e, nesse n, tão rápida quanto binária.
 */
export function recomendarPorTorax(modelo: Modelo, toraxCm: number, confianca: Confianca): Recomendacao {
  const grade = modelo.tamanhos;
  const alvo = toraxCm + modelo.folgaToraxCm;
  const i = grade.findIndex((t) => t.toraxCm >= alvo);
  const cabe: TamanhoGrade | undefined = grade[i];
  const logoAbaixo: TamanhoGrade | undefined = i === -1 ? ultimo(grade) : grade[i - 1];

  const ok = (t: TamanhoGrade): Recomendacao => ({ status: "ok", modeloId: modelo.id, tam: t.tam, confianca });

  if (modelo.desempate === "menor" && logoAbaixo && logoAbaixo.toraxCm >= alvo - MARGEM_DESEMPATE_CM) {
    return ok(logoAbaixo);
  }
  if (cabe) return ok(cabe);
  return { status: "acima-da-grade", modeloId: modelo.id, maiorTam: ultimo(grade).tam };
}
