import { simulateEURL } from "./eurl/simulator-eurl";
import { getImpotRange } from "./impot";
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
