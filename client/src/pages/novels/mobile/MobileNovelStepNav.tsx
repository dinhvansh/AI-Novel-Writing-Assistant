import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNovelWorkspaceFlowSteps,
  getNovelWorkspaceToolTabs,
  type NovelWorkspaceTab,
} from "../novelWorkspaceNavigation";

interface MobileNovelStepNavProps {
  activeTab: NovelWorkspaceTab;
  workflowCurrentTab: NovelWorkspaceTab;
  onSelectTab: (tab: NovelWorkspaceTab) => void;
}

export default function MobileNovelStepNav({
  activeTab,
  workflowCurrentTab,
  onSelectTab,
}: MobileNovelStepNavProps) {
  const { t } = useTranslation();
  const flowSteps = getNovelWorkspaceFlowSteps(t);
  const toolTabs = getNovelWorkspaceToolTabs(t);
  const steps = [...flowSteps, ...toolTabs];

  return (
    <nav className="mobile-novel-step-nav -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label={t("novel:workspace.tabs.fallbackBasic")}>
      {steps.map((step, index) => {
        const isActive = activeTab === step.key;
        const isRecommended = workflowCurrentTab === step.key && workflowCurrentTab !== activeTab;

        return (
          <Button
            key={step.key}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-auto shrink-0 rounded-full px-3 py-2 text-left",
              isRecommended && !isActive ? "border-primary/50 bg-primary/5 text-primary" : null,
            )}
            aria-current={isActive ? "step" : undefined}
            onClick={() => onSelectTab(step.key)}
          >
            <span className="flex min-w-0 items-center gap-2">
              {index < flowSteps.length ? (
                <span className="text-[11px] opacity-75">{index + 1}</span>
              ) : null}
              <span className="max-w-32 truncate">{step.label}</span>
              {isRecommended ? (
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                  {t("novel:workspace.recommended", { defaultValue: "Đề xuất" })}
                </Badge>
              ) : null}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}
