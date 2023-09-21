import { Expression, SimulationConfig, matchAmountType, simulate } from '../simulator'

export type ExpressionEURLLabel = 'Rémunération totale' |
'Cotisations et contributions' |
'Rémunération nette avant IR' |
'Impôt sur le revenu' |
'Rémunération nette après IR' |
"Nombre de parts" |
"Net imposable"

export const EXPRESSIONS: Expression[] = [
  {
    label: "Rémunération totale",
    expr: { valeur: "dirigeant . rémunération . totale" },
  },
  {
    label: "Cotisations et contributions",
    expr: { valeur: "dirigeant . indépendant . cotisations et contributions" },
  },
  {
    label: "Rémunération nette avant IR",
    expr: { valeur: "dirigeant . rémunération . net" },
  },
  {
    label: "Impôt sur le revenu",
    expr: { valeur: "impôt . montant" },
  },
  {
    label: "Rémunération nette après IR",
    expr: { valeur: "dirigeant . rémunération . net . après impôt" },
  },
  {
    label: "Nombre de parts",
    expr: { valeur: "impôt . foyer fiscal . nombre de parts" },
    unit: 'parts',
  },
  {
    label: "Net imposable",
    expr: { valeur: "dirigeant . rémunération . net . imposable" },
  },
]

const currentYear = new Date().getFullYear()
const EURL_BASE_SITUATION = {
  // IR
  "impôt . foyer fiscal . situation de famille": "'célibataire'",
  "impôt . méthode de calcul": "'barème standard'",
  // Entreprise
  "entreprise . catégorie juridique": "'SARL'",
  "entreprise . imposition": "'IS'",
  "entreprise . activité . nature": "'libérale'",
  "entreprise . date de création": "01/01/" + currentYear,
  "dirigeant . indépendant . IJSS": "non",
  "dirigeant . indépendant . revenus étrangers": "non",
  "dirigeant . indépendant . PL . régime général . taux spécifique retraite complémentaire": "non",
  "dirigeant . indépendant . conjoint collaborateur": "non",
  "dirigeant . indépendant . cotisations facultatives": "non",
  "entreprise . activités . saisonnière": "non",
  "situation personnelle . RSA": "non",
  "entreprise . activité . nature . libérale . réglementée": "non",
  "situation personnelle . domiciliation fiscale à l'étranger": "non",
  "dirigeant . exonérations . ACRE": "non",
  "dirigeant . indépendant . cotisations et contributions . exonérations . pension invalidité": "non",
  "entreprise . associés": "'unique'",
}

export function simulateEURL(config: SimulationConfig) {
  if (isNaN(config.revenus) || config.revenus < 0) {
    return []
  }

  const realAmount = config.revenus * (config.unit === "€/mois" ? 12 : 1)

  const situation = {
    ...EURL_BASE_SITUATION,
    ...matchAmountType(config.revenusType, realAmount),
    "dirigeant . exonérations . ACRE": config.acre ? "oui" : "non",
    ...{ "impôt . foyer fiscal . enfants à charge": config.nbEnfants },
    "entreprise . imposition": config.entrepriseImposition,
    "impôt . foyer fiscal . situation de famille": config.situationFamiliale,
    ...{ "impôt . foyer fiscal . revenu imposable . autres revenus imposables": config.autresRevenus },
  }

  return simulate(situation, config.unit, EXPRESSIONS)
}
