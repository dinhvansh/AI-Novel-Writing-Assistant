import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { BASIC_INFO_FIELD_HINTS, type NovelBasicFormState } from "../../novelBasicInfo.shared";
import { FieldLabel } from "./BasicInfoFormPrimitives";

interface BookFramingSectionProps {
  basicForm: NovelBasicFormState;
  onFormChange: (patch: Partial<NovelBasicFormState>) => void;
  quickFill?: ReactNode;
}

export function BookFramingSection(props: BookFramingSectionProps) {
  const { basicForm, onFormChange, quickFill } = props;
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{t("novel:bookFraming.title")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("novel:bookFraming.description")}
          </div>
        </div>
        {quickFill ? <div className="shrink-0">{quickFill}</div> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="basic-target-audience" hint={BASIC_INFO_FIELD_HINTS.targetAudience}>
            {t("novel:bookFraming.fields.targetAudience")}
          </FieldLabel>
          <Input
            id="basic-target-audience"
            value={basicForm.targetAudience}
            placeholder={t("novel:bookFraming.fields.targetAudiencePlaceholder")}
            onChange={(event) => onFormChange({ targetAudience: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="basic-commercial-tags" hint={BASIC_INFO_FIELD_HINTS.commercialTagsText}>
            {t("novel:bookFraming.fields.commercialTags")}
          </FieldLabel>
          <Input
            id="basic-commercial-tags"
            value={basicForm.commercialTagsText}
            placeholder={t("novel:bookFraming.fields.commercialTagsPlaceholder")}
            onChange={(event) => onFormChange({ commercialTagsText: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="basic-competing-feel" hint={BASIC_INFO_FIELD_HINTS.competingFeel}>
            {t("novel:bookFraming.fields.competingFeel")}
          </FieldLabel>
          <Input
            id="basic-competing-feel"
            value={basicForm.competingFeel}
            placeholder={t("novel:bookFraming.fields.competingFeelPlaceholder")}
            onChange={(event) => onFormChange({ competingFeel: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="basic-book-selling-point" hint={BASIC_INFO_FIELD_HINTS.bookSellingPoint}>
            {t("novel:bookFraming.fields.bookSellingPoint")}
          </FieldLabel>
          <textarea
            id="basic-book-selling-point"
            rows={3}
            className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={basicForm.bookSellingPoint}
            placeholder={t("novel:bookFraming.fields.bookSellingPointPlaceholder")}
            onChange={(event) => onFormChange({ bookSellingPoint: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FieldLabel htmlFor="basic-first30-promise" hint={BASIC_INFO_FIELD_HINTS.first30ChapterPromise}>
          {t("novel:bookFraming.fields.first30ChapterPromise")}
        </FieldLabel>
        <textarea
          id="basic-first30-promise"
          rows={5}
          className="min-h-[128px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={basicForm.first30ChapterPromise}
          placeholder={t("novel:bookFraming.fields.first30ChapterPromisePlaceholder")}
          onChange={(event) => onFormChange({ first30ChapterPromise: event.target.value })}
        />
      </div>
    </div>
  );
}
