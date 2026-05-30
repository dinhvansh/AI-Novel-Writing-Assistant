import type { AntiAiEffectiveRulesResult, StyleProfile } from "@ai-novel/shared/types/styleEngine";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EffectiveRuleList from "./EffectiveRuleList";

interface AntiAiEffectivePreviewCardProps {
  profiles: StyleProfile[];
  styleProfileId: string;
  effective?: AntiAiEffectiveRulesResult;
  loading: boolean;
  onStyleProfileChange: (styleProfileId: string) => void;
}

export default function AntiAiEffectivePreviewCard(props: AntiAiEffectivePreviewCardProps) {
  const { t } = useTranslation("antiAiRules");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <SlidersHorizontal className="h-5 w-5" />
          {t("effectivePreview.title")}
        </CardTitle>
        <CardDescription>
          {t("effectivePreview.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={props.styleProfileId || "__global__"}
          onValueChange={(value) => props.onStyleProfileChange(value === "__global__" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("effectivePreview.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">{t("effectivePreview.globalOnly")}</SelectItem>
            {props.profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {props.loading ? (
          <div className="text-sm text-muted-foreground">{t("effectivePreview.calculating")}</div>
        ) : null}

        {props.effective ? (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">{t("effectivePreview.globalBaselineLabel")}</div>
                <div className="mt-1 font-semibold">{props.effective.usesGlobalAntiAiBaseline ? t("effectivePreview.applied") : t("effectivePreview.notApplied")}</div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">{t("effectivePreview.effectiveRulesLabel")}</div>
                <div className="mt-1 font-semibold">{props.effective.effectiveRules.length}</div>
              </div>
            </div>
            <EffectiveRuleList
              title={t("effectivePreview.globalDefaultRulesTitle")}
              rules={props.effective.globalBaselineRules}
              empty={t("effectivePreview.noGlobalRules")}
            />
            <EffectiveRuleList
              title={t("effectivePreview.styleSpecificRulesTitle")}
              rules={props.effective.styleSpecificRules}
              empty={t("effectivePreview.noStyleRules")}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
