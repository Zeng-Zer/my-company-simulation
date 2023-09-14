import './App.css'
import { useInput, useInputCheckbox, useInputDropdown, useInputSlider, useSubmitButton } from './components/input'
import { simulateEURL } from './simulator/eurl/simulator-eurl'
import { RevenusType, EntrepriseImposition, SimulationConfig, SituationFamiliale, SituationUnit } from './simulator/simulator'
import ResultTable from './ResultTable'
import { simulateIS } from './simulator/is/simulator-is'
import axios from 'axios'
import Chart from './chart/chart'
import { useState } from 'react'
import { generateImpotRange, generateSimulation } from './simulator/generate-simulation'

function App() {
  // const [revenusType, setAmountType, amountTypeInput] = useInputDropdown<RevenusType>([
  //   { value: 'totale', label: 'Rémunération totale' },
  //   { value: 'net', label: 'Rémunération nette' },
  //   { value: 'apres impot', label: 'Revenu après impôt' },
  // ])
  const revenusType = 'totale';
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
    revenusType,
    revenus,
    unit: situationUnit.value,
    acre,
    entrepriseImposition: entrepriseImposition.value,
    situationFamiliale: situationFamiliale.value,
    nbEnfants,
    autresRevenus,
  }

  const eurlSimulation = simulateEURL(config)
  const isSimulation = simulateIS({ ...config, ca })
  const parts = eurlSimulation.find((s) => s.label === 'Nombre de parts')?.value.nodeValue as number

  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

    // axios
    //   .post('http://localhost:8000/simulate', { ...config, ca })
  //   .then(response => console.log(response.data))
  const [submit, setSubmit, submitInput] = useSubmitButton(async () => {
    setIsLoading(true);
    const sim = await generateSimulation(config, ca, parts);
    setIsLoading(false);
    setSimulations(sim);
    // new Promise<any[]>((resolve, reject) => {
    //   const sim = generateSimulation(config, ca);
    //   resolve(sim);
    // }).then((simulation) => {
    //     setIsLoading(false);
    //     setSimulations(simulation);
    //   })
  })

  const impotRanges = generateImpotRange(parts, simulations);

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
      <ResultTable expressions={eurlSimulation}/>
      <h3>Reste sur Société</h3>
      <ResultTable expressions={isSimulation}/>
      { isLoading && <div>Loading...</div> }
      {submitInput}
      { simulations.length > 0 && <Chart ca={ca} simulations={simulations} config={config} impotRanges={impotRanges} /> }
    </>
  )
}

export default App

