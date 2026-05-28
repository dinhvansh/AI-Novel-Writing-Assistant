import { useMemo } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { AutoDirectorChannelSettings } from "@/api/settings";

export interface AutoDirectorEventOption {
  code: string;
  label: string;
  description: string;
}

export interface AutoDirectorChannelDraft {
  baseUrl: string;
  dingtalk: {
    webhookUrl: string;
    callbackToken: string;
    operatorMapJson: string;
    eventTypes: string[];
  };
  wecom: {
    webhookUrl: string;
    callbackToken: string;
    operatorMapJson: string;
    eventTypes: string[];
  };
}

const EVENT_KEY_MAP: Array<{ code: string; key: string }> = [
  { code: "auto_director.approval_required", key: "approvalRequired" },
  { code: "auto_director.auto_approved", key: "autoApproved" },
  { code: "auto_director.exception", key: "exception" },
  { code: "auto_director.recovered", key: "recovered" },
  { code: "auto_director.completed", key: "completed" },
  { code: "auto_director.progress_changed", key: "progressChanged" },
];

export function buildAutoDirectorEventOptions(t: TFunction): AutoDirectorEventOption[] {
  return EVENT_KEY_MAP.map(({ code, key }) => ({
    code,
    label: t(`settings:autoDirectorEvents.${key}.label`),
    description: t(`settings:autoDirectorEvents.${key}.description`),
  }));
}

export function useAutoDirectorEventOptions(): AutoDirectorEventOption[] {
  const { t } = useTranslation();
  return useMemo(() => buildAutoDirectorEventOptions(t), [t]);
}

export function buildAutoDirectorChannelDraft(
  settings?: AutoDirectorChannelSettings | null,
): AutoDirectorChannelDraft {
  return settings ? {
    baseUrl: settings.baseUrl,
    dingtalk: {
      webhookUrl: settings.dingtalk.webhookUrl,
      callbackToken: settings.dingtalk.callbackToken,
      operatorMapJson: settings.dingtalk.operatorMapJson,
      eventTypes: settings.dingtalk.eventTypes,
    },
    wecom: {
      webhookUrl: settings.wecom.webhookUrl,
      callbackToken: settings.wecom.callbackToken,
      operatorMapJson: settings.wecom.operatorMapJson,
      eventTypes: settings.wecom.eventTypes,
    },
  } : {
    baseUrl: "",
    dingtalk: {
      webhookUrl: "",
      callbackToken: "",
      operatorMapJson: "",
      eventTypes: [],
    },
    wecom: {
      webhookUrl: "",
      callbackToken: "",
      operatorMapJson: "",
      eventTypes: [],
    },
  };
}

export function summarizeSelectedAutoDirectorEvents(t: TFunction, codes: string[]): string {
  const options = buildAutoDirectorEventOptions(t);
  const labelMap = new Map(options.map((item) => [item.code, item.label]));
  const labels = codes
    .map((code) => labelMap.get(code))
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) {
    return t("settings:autoDirectorEvents.noSubscribed");
  }
  const separator = t("settings:autoDirectorEvents.joinSeparator");
  if (labels.length <= 2) {
    return labels.join(separator);
  }
  return t("settings:autoDirectorEvents.extraSummary", {
    first: labels.slice(0, 2).join(separator),
    count: labels.length,
  });
}
