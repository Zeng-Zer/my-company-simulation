import { formatValue } from 'publicodes'
import { RevenusType, ENGINE, EXPRESSIONS, EntrepriseImposition, SimulationConfig, SituationFamiliale, SituationUnit, matchAmountType } from '../simulator'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EurlConfig {
  // acre: boolean,
  // entrepriseImposition: EntrepriseImposition,
  // situationFamille: SituationFamiliale,
  // nbEnfants: number,
  // autresRevenus: number,
}

const EURL_BASE_SITUATION = {
  // IR
  // "impôt . foyer fiscal . revenu imposable . autres revenus imposables": 10000,
  "impôt . foyer fiscal . situation de famille": "'célibataire'",
  "impôt . méthode de calcul": "'barème standard'",
  // Entreprise
  "entreprise . catégorie juridique": "'SARL'",
  "entreprise . imposition": "'IS'",
  "entreprise . activité . nature": "'libérale'",
  "entreprise . date de création": "01/01/2023",
}

export function simulateEURL(config: SimulationConfig & EurlConfig) {
  if (isNaN(config.revenus) || config.revenus < 0) {
    return []
  }

  const realAmount = config.revenus * (config.unit === "€/mois" ? 12 : 1)

  const situation = {
    ...EURL_BASE_SITUATION,
    ...matchAmountType(config.revenusType, realAmount),
    "dirigeant . exonérations . ACRE": config.acre ? "oui" : "non",
    ...(config.nbEnfants > 0 && { "impôt . foyer fiscal . enfants à charge": config.nbEnfants }),
    "entreprise . imposition": config.entrepriseImposition,
    "impôt . foyer fiscal . situation de famille": config.situationFamiliale,
    ...(config.autresRevenus > 0 && { "impôt . foyer fiscal . revenu imposable . autres revenus imposables": config.autresRevenus }),
  }

  ENGINE.setSituation(situation)

  return EXPRESSIONS.map(({ label, expr }) => (
    {
      label,
      value: formatValue(ENGINE.evaluate({ ...expr, unité: config.unit })),
    }
  ))

}

// const EURL_BASE_SITUATION = {
//   // Dirigeant
//   "dirigeant . indépendant . IJSS": "non",
//   "dirigeant . indépendant . revenus étrangers": "non",
//   "dirigeant . indépendant . PL . régime général . taux spécifique retraite complémentaire": "non",
//   "dirigeant . indépendant . conjoint collaborateur": "non",
//   "dirigeant . indépendant . cotisations facultatives": "non",
//   "dirigeant . exonérations . ACRE": "non",
//   "dirigeant . indépendant . cotisations et contributions . exonérations . pension invalidité": "non",
//   // "dirigeant . rémunération . totale": 48002,
//   // IR
//   "impôt . foyer fiscal . revenu imposable . autres revenus imposables": 10000,
//   "impôt . foyer fiscal . situation de famille": "'célibataire'",
//   "impôt . méthode de calcul": "'barème standard'",
//   // Entreprise
//   "entreprise . catégorie juridique": "'SARL'",
//   "entreprise . imposition": "'IS'",
//   "entreprise . associés": "'unique'",
//   "entreprise . activités . saisonnière": "non",
//   "entreprise . activité . nature . libérale . réglementée": "non",
//   "entreprise . activité . nature": "'libérale'",
//   "entreprise . date de création": "01/01/2023",
//   // Perso
//   "situation personnelle . RSA": "non",
//   "situation personnelle . domiciliation fiscale à l'étranger": "non",
// }
