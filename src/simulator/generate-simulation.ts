import { StockAccount } from "../tabs/stock-tab";
import { simulateEURL } from "./eurl/simulator-eurl";
import { floorIS, getImpotRange, normalRateIS, reducedRateIS } from "./impot";
import { simulateIS } from "./is/simulator-is";
import { SimulationConfig } from "./simulator";

export interface ImpotRange {
  low: number,
  high: number,
  rate: number,
  revenu: number
}

function createRangeWithInterval(start: number, end: number, interval: number) {
  return Array.from({ length: (end - start) / interval + 1 }, (_, i) => start + i * interval);
}

export function generateImpotRange(parts: number, simulations: any[], conf: SimulationConfig) {
  const impots = getImpotRange(parts, conf.unit === '€/mois');
  const simulationImposable = simulations.map(simulation => ({
    ...simulation,
    'Net imposable': simulation['Net imposable'] * 0.9 // abattement EURL 10%
  })); 

  const range = impots.flatMap(({ low, high, rate }) => {
    const simulation = simulationImposable.find(simulation =>
      (low === 0 && simulation['Net imposable'] <= high) ||
      (simulation['Net imposable'] >= low && simulation['Net imposable'] <= high)
    )

    if (simulation) return [{ low, high, rate, revenu: simulation['Rémunération totale'], imposable: simulation['Net imposable'] }];
    else return [];
  });

  return range as ImpotRange[];
}

export function generateSimulation(conf: SimulationConfig, ca: number, iterations: number) {
  const revenus = createRangeWithInterval(0, ca, ca / iterations);
  const simulations = revenus.map(revenu => {
    const config: SimulationConfig = { ...conf, revenus: revenu };

    const eurlSimulations = simulateEURL(config)
    const isSimulations = simulateIS({ ...config, ca })

    const result: { [key: string]: Number } = {};
    for (const item of [ ...eurlSimulations, ...isSimulations ]) {
      result[item.label] = item.value as number;
    }
    return {
      ...result,
      'Rémunération nette après IS': ca - revenu - (isSimulations.find(({ label }) => label === 'Impôt sur les sociétés')?.value as number),
    }
  });
  return simulations;
}

interface InvestmentConfig {
  simulation: any,
  nbYear: number,
  stockAccount: StockAccount,
  returnYield: number,
  reinvest: boolean,
}

// get is to pay for amount considering otherAmount with alreadyPaidIS
function applyIS(amount: number, otherAmount: number, alreadyPaidIS: number) {
  const toTax = amount + otherAmount;
  const newIS = toTax >= floorIS
    ? floorIS * reducedRateIS + (toTax - floorIS) * normalRateIS
    : toTax * reducedRateIS;

  return newIS - alreadyPaidIS;
}

// to display - argent societe, ROI societe, argent perso, ROI perso

export function generateInvestmentsSimulations(config: InvestmentConfig) {
  const yieldRate = config.returnYield / 100;
  const simulations = [];
  var prev = {
    ...config.simulation,
    "Perso | Investissement": 0,
    "Perso | Roi Brut": 0,
    "Perso | Roi Net": 0,
    "Société | Investissement": 0,
    "Société | Roi Précédent": 0,
    "Société | Roi Brut": 0,
    "Société | Roi Net": 0,
  };

  const investCompany = (i: number) => {
    // société
    const prevRemIS = config.reinvest || i == 1 ? config.simulation['Rémunération nette après IS'] : 0
    const prevIs = config.reinvest || i == 1 ? config.simulation['Impôt sur les sociétés'] : 0
    const prevResult = config.reinvest || i == 1 ? config.simulation['Résultat imposable'] : 0

    const investment = (prev?.['Société | Investissement'] ?? 0) + prevRemIS
    const investmentNet = investment * 0.7
    const investmentRoiBrut = investment * yieldRate

    const prevRoiBrut = prev?.['Société | Roi Brut'] ?? 0
    const roiBrut = prevRoiBrut * yieldRate
    const totalRoiBrut = investmentRoiBrut + prevRoiBrut + roiBrut
    const totalRoiBrutToNet = totalRoiBrut - applyIS(totalRoiBrut, prevResult, prevIs)
    const totalRoiNet = totalRoiBrutToNet * 0.7


    return {
      "Société | Investissement": investment,
      "Société | Investissement Net": investmentNet,
      "Société | Roi Précédent": prevRoiBrut,
      "Société | Roi Brut": totalRoiBrut,
      "Société | Roi Net": totalRoiBrutToNet,
      "Société | Roi Net Après Flat Tax": totalRoiNet,
      "Société | Total Net Après Flat Tax": totalRoiNet + investmentNet,
    }
  }

  const investPerso = (i: number) => {
    const prevRemIR = config.reinvest || i == 1 ? config.simulation['Rémunération nette après IR'] : 0
    const investment = (prev?.['Perso | Investissement'] ?? 0) + prevRemIR
    const investmentRoiBrut = investment * yieldRate

    const prevRoiBrut = prev?.['Perso | Roi Brut'] ?? 0
    const roiBrut = prevRoiBrut * yieldRate
    const totalRoiBrut = investmentRoiBrut + prevRoiBrut + roiBrut
    const totalRoiNet = totalRoiBrut * (1 - (config.stockAccount === 'PEA' ? 0.172 : 0.3))

    return {
      "Perso | Investissement": investment,
      "Perso | Roi Précédent": prevRoiBrut,
      "Perso | Roi Brut": totalRoiBrut,
      "Perso | Roi Net": totalRoiNet,
      "Perso | Total Net": totalRoiNet + investment,
    }
  }

  for (var i = 1; i <= config.nbYear; i++) {
    const persoInvestment = investPerso(i)
    const companyInvestment = investCompany(i)
    const totalNet = persoInvestment['Perso | Total Net'] + companyInvestment['Société | Total Net Après Flat Tax']

    const newSimulation = {
      ...prev,
      ...persoInvestment,
      ...companyInvestment,
      "Total Net": totalNet,
      "year": i,
    }

    prev = newSimulation;

    simulations.push(newSimulation);
  }
  console.log(simulations)

  return simulations;
}
