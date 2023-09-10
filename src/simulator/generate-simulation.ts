import { simulateEURL } from "./eurl/simulator-eurl";
import { simulateIS } from "./is/simulator-is";
import { SimulationConfig } from "./simulator";


function createRangeWithInterval(start: number, end: number, interval: number) {
  return Array.from({ length: (end - start) / interval + 1 }, (_, i) => start + i * interval);
}

export async function generateSimulation(conf: SimulationConfig, ca: number) {
  const revenus = createRangeWithInterval(0, ca, ca / 100);
  const simulations = revenus.map(revenu => {
    const config: SimulationConfig = {
      ...conf,
      revenus: revenu,
    };


    const eurlSimulations = simulateEURL(config)
      // .filter(({ label }) => label === 'Cotisations et contributions' || label === 'Impôt sur le revenu')
      .filter(({ label }) => label !== 'Rémunération totale')
      .map(({ label, value }) => ({ label, value: value.nodeValue }));
    const isSimulations = simulateIS({ ...config, ca })
      // .filter(({ label }) => label === 'Montant de l\'impôt')
      .map(({ label, value }) => ({ label, value: value.nodeValue }));

    return [ ...eurlSimulations, ...isSimulations ].reduce(function(map, obj) {
      if (obj.label === 'Rémunération nette après impôt' && obj.value as number < 0) {
        map[obj.label] = 0;
      } else {
        map[obj.label] = obj.value as number;
      }
      return map;
    }, {
        revenu,
        'Rémunération net après IS': ca - revenu - (isSimulations.find(({ label }) => label === 'Impôt sur les sociétés')?.value as number),
      });
  });

  // simulations.forEach(simulation => {
  //   console.log(simulation);
  // });

  return simulations;
}
