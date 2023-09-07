import { formatValue } from 'publicodes'
import { ENGINE, SimulationConfig } from '../simulator'

export interface ISConfig {
  ca: number,
}

const EXPRESSIONS = [
  {
    label: "Résultat imposable",
    expr: { valeur: "entreprise . imposition . IS . résultat imposable" }
  },
  {
    label: "Résultat net de l'exercice",
    expr: { valeur: "entreprise . imposition . IS . montant" }
  },
]

const IS_BASE_SITUATION = {
  "entreprise . imposition . IS . éligible taux réduit": "oui",
  "entreprise . exercice . fin": "31/12/2023",
  // "entreprise . imposition . IS . résultat imposable": 40000,
  "entreprise . exercice . début": "01/01/2023"
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

  ENGINE.setSituation(situation)

  return EXPRESSIONS.map(({ label, expr }) => (
    {
      label,
      value: formatValue(ENGINE.evaluate({ ...expr, unité: "€/an" })),
    }
  ))

}
