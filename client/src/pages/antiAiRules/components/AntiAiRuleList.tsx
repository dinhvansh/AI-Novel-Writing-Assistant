import { useTranslation } from "react-i18next";
import type { AntiAiRule } from "@ai-novel/shared/types/styleEngine";
import { CheckCircle2, Edit3, FileText, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RuleFilter, severityLabels, typeLabels } from "../antiAiRulesPage.shared";
import AntiAiToggleLine from "./AntiAiToggleLine";

interface AntiAiRuleListProps {
  rules: AntiAiRule[];
  loading: boolean;
  filter: RuleFilter;
  isSaving: boolean;
  testingRuleIds: string[];
  onFilterChange: (filter: RuleFilter) => void;
  onQuickToggle: (rule: AntiAiRule, field: "enabled" | "globalBaselineEnabled" | "autoRewrite", checked: boolean) => void;
  onEditRule: (rule: AntiAiRule) => void;
  onToggleTestingRule: (ruleId: string) => void;
}

export default function AntiAiRuleList(props: AntiAiRuleListProps) {
  const { t } = useTranslation();
  const testingRuleIdSet = new Set(props.testingRuleIds);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">{t("antiAiRules:list.title")}</CardTitle>
            <CardDescription>{t("antiAiRules:list.description")}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", t("antiAiRules:list.filter.all")],
              ["global", t("antiAiRules:list.filter.global")],
              ["style", t("antiAiRules:list.filter.style")],
              ["disabled", t("antiAiRules:list.filter.disabled")],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={props.filter === value ? "default" : "outline"}
                onClick={() => props.onFilterChange(value as RuleFilter)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.loading ? (
          <div className="text-sm text-muted-foreground">{t("antiAiRules:list.loading")}</div>
        ) : null}
        {!props.loading && props.rules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("antiAiRules:list.empty")}
          </div>
        ) : null}
        {props.rules.map((rule) => {
          const isTesting = testingRuleIdSet.has(rule.id);
          return (
            <div key={rule.id} className={cn("rounded-lg border p-4", !rule.enabled && "bg-muted/30 opacity-80")}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-foreground">{rule.name}</div>
                    <Badge variant={rule.enabled ? "secondary" : "outline"}>{rule.enabled ? t("antiAiRules:list.badge.enabled") : t("antiAiRules:list.badge.disabled")}</Badge>
                    {rule.globalBaselineEnabled ? <Badge>{t("antiAiRules:list.badge.globalBaseline")}</Badge> : <Badge variant="outline">{t("antiAiRules:list.badge.bindable")}</Badge>}
                    {isTesting ? <Badge variant="secondary">{t("antiAiRules:list.badge.testing")}</Badge> : null}
                    <Badge variant="outline">{typeLabels[rule.type]} / {severityLabels[rule.severity]}</Badge>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{rule.description}</div>
                  {rule.detectPatterns.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.detectPatterns.slice(0, 8).map((pattern) => (
                        <Badge key={`${rule.id}-${pattern}`} variant="outline">{pattern}</Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <div className="rounded-md border bg-muted/20 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        {t("antiAiRules:list.field.promptInstruction")}
                      </div>
                      <div className="leading-6 text-foreground">{rule.promptInstruction || t("antiAiRules:list.field.empty")}</div>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("antiAiRules:list.field.rewriteSuggestion")}
                      </div>
                      <div className="leading-6 text-foreground">{rule.rewriteSuggestion || t("antiAiRules:list.field.empty")}</div>
                    </div>
                  </div>
                </div>
                <div className="grid min-w-[210px] gap-2">
                  <AntiAiToggleLine
                    label={t("antiAiRules:list.toggle.enabled")}
                    checked={rule.enabled}
                    disabled={props.isSaving}
                    onCheckedChange={(checked) => props.onQuickToggle(rule, "enabled", checked)}
                  />
                  <AntiAiToggleLine
                    label={t("antiAiRules:list.toggle.globalBaseline")}
                    checked={rule.globalBaselineEnabled}
                    disabled={props.isSaving}
                    onCheckedChange={(checked) => props.onQuickToggle(rule, "globalBaselineEnabled", checked)}
                  />
                  <AntiAiToggleLine
                    label={t("antiAiRules:list.toggle.autoRewrite")}
                    checked={rule.autoRewrite}
                    disabled={props.isSaving}
                    onCheckedChange={(checked) => props.onQuickToggle(rule, "autoRewrite", checked)}
                  />
                  <Button type="button" variant={isTesting ? "secondary" : "outline"} size="sm" onClick={() => props.onToggleTestingRule(rule.id)}>
                    <FlaskConical className="h-4 w-4" />
                    {isTesting ? t("antiAiRules:list.action.removeFromTest") : t("antiAiRules:list.action.addToTest")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => props.onEditRule(rule)}>
                    <Edit3 className="h-4 w-4" />
                    {t("antiAiRules:list.action.edit")}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
