import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChapterEditorOperation } from "@ai-novel/shared/types/novel";
import { Button } from "@/components/ui/button";
import type { SelectionToolbarPosition } from "./chapterEditorTypes";
import { getChapterEditorOperationLabels } from "./chapterEditorUtils";

interface SelectionAIFloatingToolbarProps {
  visible: boolean;
  position: SelectionToolbarPosition | null;
  disabled?: boolean;
  onRunOperation: (operation: ChapterEditorOperation, customInstruction?: string) => void;
}

const SECONDARY_OPERATIONS: ChapterEditorOperation[] = ["expand", "compress", "emotion", "conflict"];

export default function SelectionAIFloatingToolbar(props: SelectionAIFloatingToolbarProps) {
  const { t } = useTranslation("novel");
  const { visible, position, disabled = false, onRunOperation } = props;
  const operationLabels = getChapterEditorOperationLabels(t);
  const [customInstruction, setCustomInstruction] = useState("");
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsCustomOpen(false);
      setCustomInstruction("");
    }
  }, [visible]);

  if (!visible || !position) {
    return null;
  }

  return (
    <div
      className="absolute z-20 w-[320px] rounded-2xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onRunOperation("polish")}
        >
          {t("novel:chapterEditor.toolbar.polishAction")}
        </Button>
        {SECONDARY_OPERATIONS.map((operation) => (
          <Button
            key={operation}
            size="sm"
            variant="outline"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onRunOperation(operation)}
          >
            {operationLabels[operation]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={isCustomOpen ? "default" : "outline"}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsCustomOpen((current) => !current)}
        >
          {t("novel:chapterEditor.toolbar.customAction")}
        </Button>
      </div>

      {isCustomOpen ? (
        <div className="mt-2 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-2">
          <textarea
            className="min-h-[96px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            placeholder={t("novel:chapterEditor.toolbar.customPlaceholder")}
            value={customInstruction}
            onChange={(event) => setCustomInstruction(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setIsCustomOpen(false);
                setCustomInstruction("");
              }}
            >
              {t("novel:chapterEditor.toolbar.cancelCustom")}
            </Button>
            <Button
              size="sm"
              disabled={disabled || customInstruction.trim().length === 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onRunOperation("custom", customInstruction.trim())}
            >
              {t("novel:chapterEditor.toolbar.submitCustom")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
