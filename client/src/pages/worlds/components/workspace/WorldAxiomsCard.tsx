import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function parseAxiomList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default function WorldAxiomsCard(props: {
  rawAxioms?: string | null;
  savePending: boolean;
  onSave: (axioms: string[]) => void;
}) {
  const { rawAxioms, savePending, onSave } = props;
  const { t } = useTranslation("world");
  const parsedAxioms = useMemo(() => parseAxiomList(rawAxioms), [rawAxioms]);
  const [draftAxioms, setDraftAxioms] = useState<string[]>(parsedAxioms.length > 0 ? parsedAxioms : [""]);

  useEffect(() => {
    setDraftAxioms(parsedAxioms.length > 0 ? parsedAxioms : [""]);
  }, [parsedAxioms]);

  const normalizedDrafts = draftAxioms.map((item) => item.trim()).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("workspace.axioms.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {t("workspace.axioms.hint")}
        </div>
        {draftAxioms.map((axiom, index) => (
          <Input
            key={`${index}-${axiom}`}
            value={axiom}
            placeholder={t("workspace.axioms.placeholder", { index: index + 1 })}
            onChange={(event) =>
              setDraftAxioms((prev) => prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
            }
          />
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setDraftAxioms((prev) => [...prev, ""])}>
            {t("workspace.axioms.addButton")}
          </Button>
          <Button
            type="button"
            onClick={() => onSave(normalizedDrafts)}
            disabled={savePending || normalizedDrafts.length === 0}
          >
            {savePending ? t("workspace.axioms.saving") : t("workspace.axioms.saveButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
