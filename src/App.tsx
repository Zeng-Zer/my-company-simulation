import './App.css'
import { useInput, useInputCheckbox, useInputDropdown, useInputSlider, useSubmitButton } from './components/input'
import { simulateEURL } from './simulator/eurl/simulator-eurl'
import { EntrepriseImposition, SimulationConfig, SituationFamiliale, SituationUnit } from './simulator/simulator'
import ResultTable from './result-table/ResultTable'
import { simulateIS } from './simulator/is/simulator-is'
import Chart from './chart/chart'
import { useState } from 'react'
import { generateImpotRange, generateSimulation } from './simulator/generate-simulation'
import Tabs from './tabs/tabs'
import StockTab from './tabs/stock-tab'

function convertArrayToCSV(data: any[], delimiter = ','): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const header = Object.keys(data[0]).join(delimiter);

  const rows = data
    .map((item) => Object.values(item).join(delimiter))
    .join('\n');

  return `${header}\n${rows}`;
}

function App() {
  const revenusType = 'totale';
  const [ca, setCa, caInput] = useInput({ type: 'number', min: 0, value: 100000 })
  const [revenus, setRevenus, revenusInput] = useInput({ type: 'number', min: 0, value: 100000 }, (value: string) => {
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
  const parts = eurlSimulation.find((s) => s.label === 'Nombre de parts')?.value as number

  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [iterations, setIterations, iterationsInput] = useInput({ type: 'number', min: 10, value: 50 })
  // TODO make simulations non blocking
  const [submit, setSubmit, submitInput] = useSubmitButton("Lancer la simulation", async () => {
    setIsLoading(true);
    const sim = generateSimulation(config, ca, iterations);
    setIsLoading(false);
    setSimulations(sim);
  })

  const [exportCsv, setExportCsv, exportCsvInput] = useSubmitButton("Exporter en CSV", () => {
    const csvContent = convertArrayToCSV(simulations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `simulation_EURL_CA_${ca}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  }, simulations.length === 0)

  const impotRanges = generateImpotRange(parts, simulations, config);
  const tabs = [
    {
      label: "Rémunération",
      content: simulations.length > 0 &&
        <Chart ca={ca} simulations={simulations} config={config} impotRanges={impotRanges} onClick={setRevenus} />
    },
    {
      label: "Bourse",
      content: simulations.length > 0 &&
        <StockTab ca={ca} simulations={simulations} config={config} impotRanges={impotRanges} onClick={setRevenus} />
    }
  ]

  return (
    <>
      <h1>EURL<br/>Simulateur</h1>
      <div className="container">
        <div className="inputs">
          <h4>Config Général</h4>
          <label>Unité: {situationUnitInput}</label><br/>
          <label>Chiffre d'affaire: {caInput}</label><br/><br/>
          <label>ACRE: {acreInput}</label><br/>
          <label>Imposition de l'entreprise: {entrepriseImpositionInput}</label><br/>
          <label>Situation familiale: {situationFamilialeInput}</label><br/>
          <label>Nombre d'enfants: {nbEnfantsInput}</label><br/>
          <label>Autres revenus: {autresRevenusInput}</label><br/>
          <label>Rénunération: {revenusInput}</label><br/><br/>
        </div>
        <div className="result">
          <h3>Rémunération</h3>
          <ResultTable expressions={eurlSimulation}/>
          <h3>Reste sur Société</h3>
          <ResultTable expressions={isSimulation}/>
          { isLoading && <div>Loading...</div> }
        </div>
      </div>
      <div style={{marginTop: "4rem" }}>
        <label>Précision de la simulation: {iterationsInput}</label><br/>
        {submitInput} {exportCsvInput}
      </div>
      <Tabs tabs={tabs} />
    </>
  )
}

export default App

