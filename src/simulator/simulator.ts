import rules from "modele-social"
import Engine from "publicodes"

export const ENGINE = new Engine(rules)

export type SituationUnit = '€/an' | '€/mois'
export type RevenusType = 'totale' | 'net' | 'apres impot' | "imposable"
export type SituationFamiliale = "'célibataire'" | "'couple'"
export type EntrepriseImposition = "'IR'" | "'IS'"

export type ExpressionEURLLabel = 'Rémunération totale' |
'Cotisations et contributions' |
'Rémunération nette avant impôt' |
'Impôt sur le revenu' |
'Rémunération nette après impôt' |
"Nombre de parts" |
"Net imposable"

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

export const EXPRESSIONS: { label: ExpressionEURLLabel; expr: { valeur: string } }[] = [
  {
    label: "Rémunération totale",
    expr: { valeur: "dirigeant . rémunération . totale" }
  },
  {
    label: "Cotisations et contributions",
    expr: { valeur: "dirigeant . indépendant . cotisations et contributions" }
  },
  {
    label: "Rémunération nette avant impôt",
    expr: { valeur: "dirigeant . rémunération . net" }
  },
  {
    label: "Impôt sur le revenu",
    expr: { valeur: "impôt . montant" }
  },
  {
    label: "Rémunération nette après impôt",
    expr: { valeur: "dirigeant . rémunération . net . après impôt" }
  },
  {
    label: "Nombre de parts",
    expr: { valeur: "impôt . foyer fiscal . nombre de parts" }
  },
  {
    label: "Net imposable",
    expr: { valeur: "dirigeant . rémunération . net . imposable" }
  },
]

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
