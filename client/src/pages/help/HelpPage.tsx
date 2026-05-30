import {
  BookOpenText,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Compass,
  KeyRound,
  ListTodo,
  Route,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DIRECTOR_CREATE_LINK = "/novels/create?mode=director";

interface GuideStep {
  /** Translation key under `novel:help.guide.steps.<key>`. */
  key: string;
  icon: LucideIcon;
}

interface GoalEntry {
  /** Translation key under `novel:help.goals.entries.<key>`. */
  key: string;
  href: string;
  icon: LucideIcon;
}

interface FaqItem {
  /** Translation key under `novel:help.faq.items.<key>`. */
  key: string;
}

const guideSteps: GuideStep[] = [
  { key: "configModel", icon: KeyRound },
  { key: "inspiration", icon: Sparkles },
  { key: "directorOpens", icon: Compass },
  { key: "confirmDirection", icon: CheckCircle2 },
  { key: "advanceToWriting", icon: Workflow },
  { key: "enterChapterExecution", icon: BookOpenText },
  { key: "tasksAndFollowUps", icon: ListTodo },
];

const goalEntries: GoalEntry[] = [
  { key: "openFromZero", href: DIRECTOR_CREATE_LINK, icon: Sparkles },
  { key: "continueProject", href: "/novels", icon: BookOpenText },
  { key: "configProvider", href: "/settings", icon: Route },
  { key: "handleTasks", href: "/tasks", icon: ClipboardList },
  { key: "directorFollowUps", href: "/auto-director/follow-ups", icon: Workflow },
  { key: "tuneStyle", href: "/style-engine", icon: WandSparkles },
];

const faqItems: FaqItem[] = [
  { key: "needOutline" },
  { key: "knowledgeRequired" },
  { key: "taskFailed" },
  { key: "qualityBacklog" },
];

export default function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <section className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{t("novel:help.hero.tag1")}</Badge>
              <Badge variant="outline">{t("novel:help.hero.tag2")}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {t("novel:help.hero.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {t("novel:help.hero.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to={DIRECTOR_CREATE_LINK}>{t("novel:help.hero.primaryCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/settings">{t("novel:help.hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-amber-300 bg-amber-50/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-700" />
            <CardTitle className="text-lg text-amber-950">{t("novel:help.modelGate.title")}</CardTitle>
          </div>
          <CardDescription className="text-amber-900/80">
            {t("novel:help.modelGate.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/settings">{t("novel:help.modelGate.cta")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:help.guide.title")}</CardTitle>
          <CardDescription>{t("novel:help.guide.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              const title = t(`novel:help.guide.steps.${step.key}.title`);
              const description = t(`novel:help.guide.steps.${step.key}.description`);
              return (
                <div key={step.key} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="font-semibold">{title}</div>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("novel:help.goals.title")}</CardTitle>
          <CardDescription>{t("novel:help.goals.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {goalEntries.map((entry) => {
              const Icon = entry.icon;
              const title = t(`novel:help.goals.entries.${entry.key}.title`);
              const description = t(`novel:help.goals.entries.${entry.key}.description`);
              const action = t(`novel:help.goals.entries.${entry.key}.action`);
              return (
                <div key={entry.key} className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="font-semibold">{title}</div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to={entry.href}>{action}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CircleHelp className="h-5 w-5 text-primary" />
            <CardTitle>{t("novel:help.faq.title")}</CardTitle>
          </div>
          <CardDescription>{t("novel:help.faq.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => {
              const question = t(`novel:help.faq.items.${item.key}.question`);
              const answer = t(`novel:help.faq.items.${item.key}.answer`);
              return (
                <div key={item.key} className="rounded-lg border bg-background p-4">
                  <div className="font-semibold">{question}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
