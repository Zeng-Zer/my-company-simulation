import { Expression, SimulationConfig, simulate } from '../simulator'

export interface ISConfig {
  ca: number,
}

export type ExpressionISLabel =
  'Résultat imposable' |
  'Impôt sur les sociétés'

// 2023
export const IS_NORMAL_RATE_FLOOR = 42500

const EXPRESSIONS: Expression[] = [
  {
    label: "Résultat imposable",
    expr: { valeur: "entreprise . imposition . IS . résultat imposable" },
  },
  {
    label: "Impôt sur les sociétés",
    expr: { valeur: "entreprise . imposition . IS . montant" },
  },
]

const currentYear = new Date().getFullYear()
const IS_BASE_SITUATION = {
  "entreprise . imposition . IS . éligible taux réduit": "oui",
  "entreprise . exercice . fin": "31/12/" + currentYear,
  "entreprise . exercice . début": "01/01/" + currentYear
}

export function simulateIS(config: SimulationConfig & ISConfig) {
  if (isNaN(config.revenus) || config.revenus < 0 || isNaN(config.ca) || config.ca < 0) {
    return []
  }

  const realCA = config.ca * (config.unit === "€/mois" ? 12 : 1)
  const realRevenus = config.revenus * (config.unit === "€/mois" ? 12 : 1)
  const resultatImposable = realCA - realRevenus

  const situation = {
    ...IS_BASE_SITUATION,
  "entreprise . imposition . IS . résultat imposable": resultatImposable,
  }

  return simulate(situation, config.unit, EXPRESSIONS).map((expr) => {
    // publicodes doesnt support monthly unit for IS
    if (expr.label === 'Résultat imposable' && config.unit === '€/mois') {
      return ({
        ...expr,
        value: expr.value / 12,
      })
    } else {
      return expr
    }
  })
}
