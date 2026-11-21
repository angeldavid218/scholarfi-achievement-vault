import type { AchievementDefinition } from "../../types/achievement";
import { AchievementListItem } from "./AchievementListItem";
import { SearchInput } from "../ui/SearchInput";

interface AchievementCatalogPanelProps {
  query: string;
  achievements: AchievementDefinition[];
  onQueryChange: (value: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AchievementCatalogPanel = ({
  query,
  achievements,
  onQueryChange,
  onEdit,
  onDelete,
}: AchievementCatalogPanelProps) => (
  <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
    <div className="card-body gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
          Catálogo
        </p>
        <h2 className="text-lg font-semibold text-base-content">Logros en cadena</h2>
        <p className="text-sm text-neutral">
          Cada fila es un Achievement PDA emitido por tu wallet.
        </p>
      </div>

      <SearchInput
        placeholder="Buscar logros..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div className="space-y-3">
        {achievements.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-neutral">
            No encontramos logros con ese criterio.
          </div>
        ) : (
          achievements.map((achievement) => (
            <AchievementListItem
              key={achievement.id}
              achievement={achievement}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  </section>
);
