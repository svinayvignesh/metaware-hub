import { useState } from "react";
import { SubSidebar } from "@/components/layout/SubSidebar";
import { EntityGrid } from "@/components/entity/EntityGrid";

export default function Model() {
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<any>(null);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <SubSidebar
        namespaceType="model"
        onSubjectAreaSelect={setSelectedSubjectArea}
        selectedSubjectAreaId={selectedSubjectArea?.id}
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Model Management</h1>
          <p className="text-muted-foreground">
            {selectedSubjectArea
              ? `Entities in ${selectedSubjectArea.name}`
              : "Select a subject area to view entities"}
          </p>
        </div>

        <EntityGrid
          subjectAreaId={selectedSubjectArea?.id}
          namespaceType="model"
          onEntityClick={(entity) => console.log("Entity clicked:", entity)}
        />
      </div>
    </div>
  );
}