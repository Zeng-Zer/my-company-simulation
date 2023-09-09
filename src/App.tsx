import './App.css'
import { useInput, useInputCheckbox, useInputDropdown, useInputSlider } from './components/input'
import { simulateEURL } from './simulator/eurl/simulator-eurl'
import { RevenusType, EntrepriseImposition, SimulationConfig, SituationFamiliale, SituationUnit } from './simulator/simulator'
import ResultTable from './ResultTable'
import { simulateIS } from './simulator/is/simulator-is'
import Chart from './chart/chart'

function App() {
  const [revenusType, setAmountType, amountTypeInput] = useInputDropdown<RevenusType>([
    { value: 'totale', label: 'Rémunération totale' },
    { value: 'net', label: 'Rémunération nette' },
    { value: 'apres impot', label: 'Revenu après impôt' },
  ])
  const [ca, setCa, caInput] = useInput({ type: 'number', min: 0 })
  const [revenus, setRevenus, revenusInput] = useInput({ type: 'number', min: 0 }, (value: string) => {
    const val = parseInt(value)
    if (val > ca) {
      setCa(val)
    }
  })

  if (revenus > ca) {
    setRevenus(ca)
  }

  // const [situationUnit, setSituationUnit] = useState<SituationUnit>('€/mois')
  const [situationUnit, setSituationUnit, situationUnitInput] = useInputDropdown<SituationUnit>([
    { value: '€/an', label: 'Annuel' },
    { value: '€/mois', label: 'Mensuel' },
  ])
  const [acre, setAcre, acreInput] = useInputCheckbox(false)
  const [entrepriseImposition, setEntrepriseImposition, entrepriseImpositionInput] = useInputDropdown<EntrepriseImposition>([
    { value: "'IS'", label: 'Imposition sur les sociétés' },
    { value: "'IR'", label: 'Imposition sur le revenu' },
  ])
  const [situationFamiliale, setSituationFamiliale, situationFamilialeInput] = useInputDropdown<SituationFamiliale>([
    { value: "'célibataire'", label: 'Célibataire' },
    { value: "'couple'", label: 'Couple' },
  ])
  const [nbEnfants, setNbEnfants, nbEnfantsInput] = useInput({ type: 'number', min: 0 })
  const [autresRevenus, setAutresRevenus, autresRevenusInput] = useInput({ type: 'number', min: 0 })
  const config: SimulationConfig = {
    revenusType: revenusType.value,
    revenus,
    unit: situationUnit.value,
    acre,
    entrepriseImposition: entrepriseImposition.value,
    situationFamiliale: situationFamiliale.value,
    nbEnfants,
    autresRevenus,
  }
  const [ratio, setRatio, ratioInput] = useInputSlider({ min: 0, max: ca, value: ca })

  return (
    <>
      <h1>EURL - SASU<br/>Simulateur</h1>
      <div className="card">
        <h4>Config Général</h4>
        <label>Unité: {situationUnitInput}</label><br/>
        <label>Chiffre d'affaire: {caInput}</label><br/><br/>
        <label>ACRE: {acreInput}</label><br/>
        <label>Imposition de l'entreprise: {entrepriseImpositionInput}</label><br/>
        <label>Situation familiale: {situationFamilialeInput}</label><br/>
        <label>Nombre d'enfants: {nbEnfantsInput}</label><br/>
        <label>Autres revenus: {autresRevenusInput}</label><br/>
      </div>
      <div>
        <h4>Config EURL</h4>
        <label>Rénunération: {revenusInput}</label><br/><br/>
      </div>
      <h3>Rémunération</h3>
      <ResultTable expressions={simulateEURL(config)}/>
      <h3>Reste sur Société</h3>
      <ResultTable expressions={simulateIS({ ...config, ca })}/>
      <br/>
        <label>Ratio Rémunération: {ratio}</label><br/>
        {ratioInput}
      <Chart config={config} ca={ca} />
    </>
  )
}

export default App
