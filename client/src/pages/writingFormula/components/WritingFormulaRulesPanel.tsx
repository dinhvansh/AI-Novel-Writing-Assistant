import { useMemo } from "react";
import type { AntiAiRule } from "@ai-novel/shared/types/styleEngine";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WritingFormulaRulesPanelProps {
  antiAiRules: AntiAiRule[];
  onToggleRule: (rule: AntiAiRule, enabled: boolean) => void;
}

export default function WritingFormulaRulesPanel(props: WritingFormulaRulesPanelProps) {
  const { antiAiRules } = props;
  const { t } = useTranslation("writingFormula");

  const enabledCount = useMemo(
    () => antiAiRules.filter((rule) => rule.enabled).length,
    [antiAiRules],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {t("rulesPanel.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          {t("rulesPanel.enabledCount", { enabled: enabledCount, total: antiAiRules.length })}
        </div>
        <div className="text-sm leading-6 text-muted-foreground">
          {t("rulesPanel.description")}
        </div>
        <Button className="w-full" variant="secondary" asChild>
          <Link to="/anti-ai-rules">{t("rulesPanel.enterRuleCenter")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
