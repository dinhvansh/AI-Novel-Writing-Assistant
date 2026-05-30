import type { Dispatch, SetStateAction } from "react";
import type { WorldDeepeningQuestion } from "@ai-novel/shared/types/world";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorldDeepeningTabProps {
  questions: WorldDeepeningQuestion[];
  answerDrafts: Record<string, string>;
  setAnswerDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  llmQuickOptions: Record<string, string[]>;
  generatePending: boolean;
  submitPending: boolean;
  onGenerate: () => void;
  onSubmit: () => void;
}

export default function WorldDeepeningTab(props: WorldDeepeningTabProps) {
  const { t } = useTranslation("world");
  const {
    questions,
    answerDrafts,
    setAnswerDrafts,
    llmQuickOptions,
    generatePending,
    submitPending,
    onGenerate,
    onSubmit,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("workspace.deepeningTab.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onGenerate} disabled={generatePending}>
          {generatePending ? t("workspace.deepeningTab.generating") : t("workspace.deepeningTab.generate")}
        </Button>
        {questions.map((question) => {
          const quickOptions = (question.quickOptions ?? llmQuickOptions[question.id] ?? [])
            .map((option) => option.trim())
            .filter(Boolean)
            .slice(0, 4);

          return (
            <div key={question.id} className="rounded-md border p-3 space-y-2">
              <div className="text-sm font-medium">
                [{question.priority}] {question.question}
              </div>
              {quickOptions.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("workspace.deepeningTab.quickOptionsHint")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickOptions.map((option) => (
                      <Button
                        key={`${question.id}-${option}`}
                        size="sm"
                        variant={answerDrafts[question.id] === option ? "default" : "outline"}
                        className="h-auto whitespace-normal text-left"
                        onClick={() =>
                          setAnswerDrafts((prev) => ({ ...prev, [question.id]: option }))
                        }
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {t("workspace.deepeningTab.noQuickOptions")}
                </div>
              )}
              <textarea
                className="min-h-[100px] w-full rounded-md border bg-background p-2 text-sm"
                value={answerDrafts[question.id] ?? ""}
                onChange={(event) =>
                  setAnswerDrafts((prev) => ({ ...prev, [question.id]: event.target.value }))
                }
                placeholder={t("workspace.deepeningTab.answerPlaceholder")}
              />
              <div className="text-xs text-muted-foreground">
                target: {question.targetLayer ?? "-"} / {question.targetField ?? "-"} / status:{" "}
                {question.status}
              </div>
            </div>
          );
        })}
        <Button
          onClick={onSubmit}
          disabled={submitPending || Object.keys(answerDrafts).length === 0 || questions.length === 0}
        >
          {submitPending ? t("workspace.deepeningTab.submitting") : t("workspace.deepeningTab.submit")}
        </Button>
      </CardContent>
    </Card>
  );
}
