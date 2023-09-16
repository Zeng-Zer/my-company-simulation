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

export async function generateSimulation(conf: SimulationConfig, ca: number, iterations: number) {
  const revenus = createRangeWithInterval(0, ca, ca / iterations);
  const simulations = revenus.map(revenu => {
    const config: SimulationConfig = {
      ...conf,
      revenus: revenu,
    };

    const eurlSimulations = simulateEURL(config)
    // .map(({ label, value }) => ({ label, value: value.nodeValue }));
    .map(({ label, value }) => {
      // console.log(label, value);
      return ({ label, value: value.nodeValue })
    } );
    const isSimulations = simulateIS({ ...config, ca })
      .map(({ label, value }) => ({ label, value: value.nodeValue }));

    const cotisation = eurlSimulations.find(({ label }) => label === 'Cotisations et contributions')?.value as number;
    const cotisationPourcentage = cotisation > revenu ? 0 : cotisation / revenu * ca

    return [ ...eurlSimulations, ...isSimulations ].reduce(function(map, obj) {
      // if ((obj.label === 'Rémunération nette après impôt' || obj.label === 'Cotisations et contributions') && obj.value as number < 0) {
      //   map[obj.label] = 0;
      // } else {
        map[obj.label] = obj.value as number;
      // }
      return map;
    }, {
        revenu,
        'Rémunération net après IS': ca - revenu - (isSimulations.find(({ label }) => label === 'Impôt sur les sociétés')?.value as number),
        // 'Cotisations Pourcentage': cotisation  / (revenu - cotisation) * 100,
        'Cotisations Pourcentage': cotisationPourcentage === Infinity || cotisationPourcentage < 0 ? 0 : cotisationPourcentage,
      });
  });

  simulations[0]['Rémunération nette après impôt'] = 0
  simulations[0]['Cotisations et contributions'] = 0

  // simulations.forEach(simulation => {
  //   console.log({
  //     cotisation: simulation['Cotisations Pourcentage'],
  //   });
  // });
  
  const minCotisationRevenu = conf.unit === '€/mois' ? 833 : 10000;
  const { min, max } = simulations
    .filter(simulation => simulation.revenu > minCotisationRevenu)
    .reduce((acc, simulation) => {
      if (simulation['Cotisations Pourcentage'] > acc.max) {
        acc.max = simulation['Cotisations Pourcentage'];
      }
      if (simulation['Cotisations Pourcentage'] < acc.min) {
        acc.min = simulation['Cotisations Pourcentage'];
      }
      return acc;
    }, { max: 0, min: Number.POSITIVE_INFINITY });



  const ecart = (max - min) * 10;
  const newMin = min - ecart;
  const newMax = max + ecart;
  // console.log({ min: newMin / ca, max: newMax / ca });
  simulations.forEach(simulation => {
    const newPourcentage = (simulation['Cotisations Pourcentage'] - newMin) / (newMax - newMin) * ca;
    if (newPourcentage < 0) {
      simulation['Cotisations Pourcentage'] = 0;
    } else if (newPourcentage > ca) {
      simulation['Cotisations Pourcentage'] = ca;
    } else {
      simulation['Cotisations Pourcentage'] = newPourcentage;
    }
    // console.log({
    //   normalized: (simulation['Cotisations Pourcentage'] - newMin) / (newMax - newMin) * ca,
    //   pourcentage: simulation['Cotisations Pourcentage'] / ca,
    // });
  });


  
  return simulations;
}
