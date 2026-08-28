import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortOption } from "@/lib/constants/catalog";

// Base UI's <Select.Value> muestra el value crudo salvo que se le pase un
// mapa value → etiqueta vía la prop `items` de Select.Root.
const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map((option) => [option.value, option.label]));

interface FiltersPanelProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount?: number;
}

export function FiltersPanel({ sort, onSortChange, resultCount }: FiltersPanelProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {typeof resultCount === "number" && (
        <p className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? "producto" : "productos"}
        </p>
      )}
      <Select value={sort} onValueChange={(value) => onSortChange(value as SortOption)} items={SORT_LABELS}>
        <SelectTrigger className="ml-auto w-56" aria-label="Ordenar productos">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
