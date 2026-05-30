import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorldGeneratorStepThreeProps {
  axioms: string[];
  finalizePending: boolean;
  onAxiomChange: (index: number, value: string) => void;
  onAddAxiom: () => void;
  onFinalize: () => void;
}

export default function WorldGeneratorStepThree(props: WorldGeneratorStepThreeProps) {
  const { axioms, finalizePending, onAxiomChange, onAddAxiom, onFinalize } = props;
  const { t } = useTranslation("world");

  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        {t("generator.stepThree.hint")}
      </div>
      {axioms.map((axiom, index) => (
        <Input
          key={`${index}-${axiom}`}
          value={axiom}
          onChange={(event) => onAxiomChange(index, event.target.value)}
        />
      ))}
      <Button variant="secondary" onClick={onAddAxiom}>
        {t("generator.stepThree.addAxiom")}
      </Button>
      <Button onClick={onFinalize} disabled={finalizePending}>
        {finalizePending ? t("generator.stepThree.saving") : t("generator.stepThree.enterWorkspace")}
      </Button>
    </div>
  );
}
