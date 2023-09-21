import rules from "modele-social"
import Engine from "publicodes"
import { ExpressionISLabel } from "./is/simulator-is"
import { ExpressionEURLLabel } from "./eurl/simulator-eurl"

export const ENGINE = new Engine(rules)

export type SituationUnit = '€/an' | '€/mois'
export type RevenusType = 'totale' | 'net' | 'apres impot' | "imposable"
export type SituationFamiliale = "'célibataire'" | "'couple'"
export type EntrepriseImposition = "'IR'" | "'IS'"

export type SimulationConfig = {
  revenus: number,
  revenusType: RevenusType,
  unit: SituationUnit,
  acre: boolean,
  entrepriseImposition: EntrepriseImposition,
  situationFamiliale: SituationFamiliale,
  nbEnfants: number,
  autresRevenus: number,
}

export interface Expression {
  label: ExpressionISLabel | ExpressionEURLLabel,
  expr: { valeur: string },
  unit?: SituationUnit | string,
  value?: number,
}

export function matchAmountType(amountType: RevenusType, amount: number) {
  switch (amountType) {
    case "totale":
      return ({ "dirigeant . rémunération . totale" : amount })
    case "net":
      return ({ "dirigeant . rémunération . net" : amount })
    case "apres impot":
      return ({ "dirigeant . rémunération . net . après impôt" : amount })
    case "imposable":
      return ({ "dirigeant . rémunération . net . imposable" : amount })
  }
}

export function simulate(situation: any, unit: SituationUnit, expressions: Expression[]) {
  ENGINE.setSituation(situation)

  return expressions.map((expression) => (
    {
      ...expression,
      value: ENGINE.evaluate({ ...expression.expr, unité: unit }).nodeValue as number,
      unit: expression.unit || unit,
    }
  ))
}
