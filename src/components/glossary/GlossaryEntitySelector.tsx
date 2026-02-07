import { GlossaryEntityDropdown } from "./GlossaryEntityDropdown";
import type { Entity } from "@/graphql/queries/entity";

export interface SelectedEntity {
  ns: string;
  sa: string;
  en: string;
  ns_id: string;
  sa_id: string;
  en_id: string;
}

interface GlossaryEntitySelectorProps {
  value: string; // FQN string "ns.sa.en"
  onEntitySelect: (entity: SelectedEntity) => void;
  namespaceTypes?: string[];
}

export default function GlossaryEntitySelector({ value, onEntitySelect, namespaceTypes = ["staging"] }: GlossaryEntitySelectorProps) {
  const handleSelect = (entity: Entity) => {
    onEntitySelect({
      ns: entity.subjectarea?.namespace?.name || "",
      sa: entity.subjectarea?.name || "",
      en: entity.name,
      ns_id: entity.subjectarea?.namespace?.id || "",
      sa_id: entity.subjectarea?.id || entity.sa_id || "",
      en_id: entity.id,
    });
  };

  return (
    <GlossaryEntityDropdown
      onSelect={handleSelect}
      placeholder="Select entity (ns.sa.en)..."
      namespaceTypes={namespaceTypes}
    />
  );
}
