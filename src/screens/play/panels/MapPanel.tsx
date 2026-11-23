import { MapPinned } from 'lucide-react';
import { useActiveGame } from '../../../state/GameContext';
import { patchUi } from '../../../state/store';
import { homeCity, presentCities, presentStates } from '../../../game/expansion';
import { ExpansionTab } from '../../game/tabs/ExpansionTab';
import { SidePanel } from '../SidePanel';

/** Mapa do Brasil: abrir e acompanhar as filiais (tecla 7). */
export function MapPanel() {
  const { game } = useActiveGame();
  const home = homeCity(game);
  return (
    <SidePanel
      title="Brasil"
      subtitle={`Sede em ${home.name} · ${presentCities(game).size} cidades · ${presentStates(game).size} estados`}
      icon={MapPinned}
      accent="from-lime-400 to-emerald-600"
      onClose={() => patchUi({ panel: null })}
      wide
    >
      <ExpansionTab />
    </SidePanel>
  );
}
