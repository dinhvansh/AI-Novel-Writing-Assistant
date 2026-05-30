import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import type {
  ModelRouteRequestProtocol,
  ModelRouteStructuredResponseFormat,
  ModelRouteTaskType,
} from "@ai-novel/shared/types/novel";
import { getLLM, resolveLLMClientOptions } from "./factory";
import {
  MODEL_ROUTE_TASK_TYPES,
  resolveModel,
  toStructuredOutputStrategy,
  upsertModelRouteConfig,
} from "./modelRouter";
import { invokeStructuredLlmDetailed, summarizeStructuredOutputFailure } from "./structuredInvoke";
import {
  resolveStructuredOutputProfile,
  selectStructuredOutputStrategy,
  type StructuredOutputStrategy,
} from "./structuredOutput";

export type ConnectivityProbeMode = "plain" | "structured" | "both";

const STRUCTURED_PROBE_SCHEMA = z.object({
  status: z.literal("ok"),
});

export interface ConnectivityProbeStatus {
  ok: boolean;
  latency: number | null;
  error: string | null;
  requestProtocol: ModelRouteRequestProtocol | null;
}

export interface StructuredConnectivityProbeStatus extends ConnectivityProbeStatus {
  strategy: string | null;
  reasoningForcedOff: boolean;
  fallbackAvailable: boolean;
  fallbackUsed: boolean;
  errorCategory: string | null;
  nativeJsonObject: boolean;
  nativeJsonSchema: boolean;
  profileFamily: string | null;
}

export interface LLMConnectivityStatus extends ConnectivityProbeStatus {
  provider: LLMProvider;
  model: string;
  plain: ConnectivityProbeStatus | null;
  structured: StructuredConnectivityProbeStatus | null;
}

export interface ModelRouteConnectivityStatus extends LLMConnectivityStatus {
  taskType: ModelRouteTaskType;
}

function toErrorMessage(error: unknown): string {
  const raw = error instanceof Error && error.message.trim() ? error.message.trim() : "";
  if (!raw) {
    return "连接测试失败。";
  }
  // 上游网关（CloudFront、Cloudflare 等）失败时常返回整页 HTML/JS。
  // 这种内容直接弹给用户毫无意义且会撑爆界面，提取 HTTP 状态后给一句简洁的人类可读说明。
  const looksLikeHtmlBlob = raw.length > 600 || /<html|<head|<body|<script|font-family/i.test(raw);
  if (looksLikeHtmlBlob) {
    const statusMatch = raw.match(/\((\d{3})\)/);
    const status = statusMatch?.[1];
    if (status === "401" || status === "403") {
      return `上游接口拒绝访问（HTTP ${status}）。请检查 API Key、API 地址和该 Key 对所选模型的访问权限。`;
    }
    if (status === "404") {
      return `上游接口未找到对应路径（HTTP ${status}）。请确认 API 地址（通常以 /v1 结尾）以及模型名称是否正确。`;
    }
    if (status === "429") {
      return `上游接口触发限流（HTTP ${status}）。稍后重试，或检查账户配额。`;
    }
    if (status && /^5\d\d$/.test(status)) {
      return `上游接口暂时不可用（HTTP ${status}）。稍后重试。`;
    }
    return status
      ? `上游接口返回错误（HTTP ${status}）。`
      : "上游接口返回非预期响应。请检查 API 地址、API Key 和模型名称。";
  }
  return raw;
}

function getProtocolCandidates(
  provider: LLMProvider,
  preferred?: ModelRouteRequestProtocol,
): ModelRouteRequestProtocol[] {
  // 用户在路由配置里明确选了协议，按用户意愿执行，不做协议级 fallback。
  if (preferred === "openai_compatible" || preferred === "anthropic") {
    return [preferred];
  }
  // Anthropic 厂商使用 Anthropic 协议；其余厂商（含 openai、deepseek、gemini、grok、kimi、
  // minimax、glm、siliconflow、modelscope、custom 等 OpenAI 兼容网关）默认走 OpenAI 协议。
  if (provider === "anthropic") {
    return ["anthropic"];
  }
  return ["openai_compatible"];
}

function getStructuredFormatCandidates(input: {
  provider: LLMProvider;
  model?: string;
  baseURL?: string;
  requestProtocol: ModelRouteRequestProtocol;
  preferred?: ModelRouteStructuredResponseFormat;
}): ModelRouteStructuredResponseFormat[] {
  if (input.requestProtocol === "anthropic") {
    return ["prompt_json"];
  }
  const profile = resolveStructuredOutputProfile({
    provider: input.provider,
    model: input.model,
    baseURL: input.baseURL,
    requestProtocol: input.requestProtocol,
    executionMode: "structured",
  });
  const profileFirst = selectStructuredOutputStrategy(profile, STRUCTURED_PROBE_SCHEMA);
  const fallbackOrder: StructuredOutputStrategy[] = profileFirst === "json_schema"
    ? ["json_schema", "json_object", "prompt_json"]
    : profileFirst === "json_object"
      ? ["json_object", "prompt_json", "json_schema"]
      : ["prompt_json", "json_object", "json_schema"];
  const preferred = input.preferred;
  if (preferred === "json_schema" || preferred === "json_object" || preferred === "prompt_json") {
    return [preferred, ...fallbackOrder].filter((value, index, array) => array.indexOf(value) === index);
  }
  return fallbackOrder;
}

async function testPlainConnection(input: {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  requestProtocol?: ModelRouteRequestProtocol;
}): Promise<LLMConnectivityStatus> {
  try {
    const resolved = await resolveLLMClientOptions(input.provider, {
      apiKey: input.apiKey,
      baseURL: input.baseURL,
      model: input.model,
      temperature: 0.1,
      maxTokens: 16,
      requestProtocol: input.requestProtocol,
    });
    const llm = await getLLM(input.provider, {
      apiKey: input.apiKey,
      baseURL: input.baseURL,
      model: resolved.model,
      temperature: 0.1,
      maxTokens: 16,
      requestProtocol: resolved.requestProtocol,
    });
    const start = Date.now();
    await llm.invoke([new HumanMessage("请只回复 ok")]);
    const plain = {
      ok: true,
      latency: Date.now() - start,
      error: null,
      requestProtocol: resolved.requestProtocol,
    };
    return {
      provider: resolved.provider,
      model: resolved.model,
      ok: plain.ok,
      latency: plain.latency,
      error: plain.error,
      requestProtocol: plain.requestProtocol,
      plain,
      structured: null,
    };
  } catch (error) {
    const plain = {
      ok: false,
      latency: null,
      error: toErrorMessage(error),
      requestProtocol: input.requestProtocol ?? null,
    };
    return {
      provider: input.provider,
      model: input.model?.trim() || "",
      ok: plain.ok,
      latency: plain.latency,
      error: plain.error,
      requestProtocol: plain.requestProtocol,
      plain,
      structured: null,
    };
  }
}

async function testStructuredConnection(input: {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  requestProtocol?: ModelRouteRequestProtocol;
  structuredResponseFormat?: ModelRouteStructuredResponseFormat;
}): Promise<LLMConnectivityStatus> {
  const resolved = await resolveLLMClientOptions(input.provider, {
    apiKey: input.apiKey,
    baseURL: input.baseURL,
    model: input.model,
    temperature: 0.2,
    maxTokens: 256,
    requestProtocol: input.requestProtocol,
    structuredStrategy: toStructuredOutputStrategy(input.structuredResponseFormat ?? "auto") ?? undefined,
    executionMode: "plain",
  });
  try {
    const startedAt = Date.now();
    const result = await invokeStructuredLlmDetailed({
      provider: resolved.provider,
      model: resolved.model,
      apiKey: input.apiKey,
      baseURL: input.baseURL ?? resolved.baseURL,
      temperature: 0.2,
      maxTokens: 256,
      taskType: "planner",
      requestProtocol: resolved.requestProtocol,
      structuredStrategy: toStructuredOutputStrategy(input.structuredResponseFormat ?? "auto") ?? undefined,
      label: "llm.connectivity.structured_probe",
      schema: STRUCTURED_PROBE_SCHEMA,
      messages: [
        new SystemMessage("你正在执行结构化输出兼容性探针。必须只输出合法 JSON。"),
        new HumanMessage("请输出一个 JSON 对象，字段 status 的值必须是 ok。"),
      ],
      maxRepairAttempts: 1,
      disableFallbackModel: true,
    });
    const structured: StructuredConnectivityProbeStatus = {
      ok: true,
      latency: Date.now() - startedAt,
      error: null,
      requestProtocol: resolved.requestProtocol,
      strategy: result.diagnostics.strategy,
      reasoningForcedOff: result.diagnostics.reasoningForcedOff,
      fallbackAvailable: result.diagnostics.fallbackAvailable,
      fallbackUsed: result.diagnostics.fallbackUsed,
      errorCategory: null,
      nativeJsonObject: result.diagnostics.profile.nativeJsonObject,
      nativeJsonSchema: result.diagnostics.profile.nativeJsonSchema,
      profileFamily: result.diagnostics.profile.family,
    };
    return {
      provider: resolved.provider,
      model: resolved.model,
      ok: structured.ok,
      latency: structured.latency,
      error: structured.error,
      requestProtocol: structured.requestProtocol,
      plain: null,
      structured,
    };
  } catch (error) {
    const summary = summarizeStructuredOutputFailure({
      error,
      fallbackAvailable: false,
    });
    const structured: StructuredConnectivityProbeStatus = {
      ok: false,
      latency: null,
      error: toErrorMessage(error),
      requestProtocol: input.requestProtocol ?? resolved.requestProtocol,
      strategy: null,
      reasoningForcedOff: false,
      fallbackAvailable: false,
      fallbackUsed: false,
      errorCategory: summary.category,
      nativeJsonObject: false,
      nativeJsonSchema: false,
      profileFamily: null,
    };
    return {
      provider: resolved.provider,
      model: resolved.model,
      ok: structured.ok,
      latency: structured.latency,
      error: structured.error,
      requestProtocol: structured.requestProtocol,
      plain: null,
      structured,
    };
  }
}

async function mergeProbeStatuses(input: {
  provider: LLMProvider;
  model?: string;
  plain: LLMConnectivityStatus | null;
  structured: LLMConnectivityStatus | null;
}): Promise<LLMConnectivityStatus> {
  const provider = input.plain?.provider ?? input.structured?.provider ?? input.provider;
  const model = input.plain?.model ?? input.structured?.model ?? input.model?.trim() ?? "";
  const top = input.plain?.plain ?? input.structured?.structured ?? {
    ok: false,
    latency: null,
    error: "连接测试失败。",
    requestProtocol: null,
  };
  return {
    provider,
    model,
    ok: top.ok,
    latency: top.latency,
    error: top.error,
    requestProtocol: top.requestProtocol,
    plain: input.plain?.plain ?? null,
    structured: input.structured?.structured ?? null,
  };
}

async function testConnection(input: {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  probeMode?: ConnectivityProbeMode;
  requestProtocol?: ModelRouteRequestProtocol;
  structuredResponseFormat?: ModelRouteStructuredResponseFormat;
}): Promise<LLMConnectivityStatus> {
  const probeMode = input.probeMode ?? "both";
  let plain: LLMConnectivityStatus | null = null;
  let structured: LLMConnectivityStatus | null = null;
  if (probeMode === "plain" || probeMode === "both") {
    for (const requestProtocol of getProtocolCandidates(input.provider, input.requestProtocol)) {
      plain = await testPlainConnection({ ...input, requestProtocol });
      if (plain.ok) {
        break;
      }
    }
  }
  if (probeMode === "structured" || probeMode === "both") {
    for (const requestProtocol of getProtocolCandidates(input.provider, input.requestProtocol)) {
      for (const structuredResponseFormat of getStructuredFormatCandidates({
        provider: input.provider,
        model: input.model,
        baseURL: input.baseURL,
        requestProtocol,
        preferred: input.structuredResponseFormat,
      })) {
        structured = await testStructuredConnection({ ...input, requestProtocol, structuredResponseFormat });
        if (structured.ok) {
          break;
        }
      }
      if (structured?.ok) {
        break;
      }
    }
  }
  return mergeProbeStatuses({
    provider: input.provider,
    model: input.model,
    plain,
    structured,
  });
}

async function testModelRoutes(taskTypes: readonly ModelRouteTaskType[] = MODEL_ROUTE_TASK_TYPES): Promise<{
  testedAt: string;
  statuses: ModelRouteConnectivityStatus[];
}> {
  const resolvedRoutes = await Promise.all(taskTypes.map(async (taskType) => ({
    taskType,
    ...(await resolveModel(taskType)),
  })));

  const dedupedChecks = new Map<string, Promise<LLMConnectivityStatus>>();
  for (const route of resolvedRoutes) {
    const key = [
      route.provider,
      route.model,
      route.requestProtocol,
      route.structuredResponseFormat,
    ].join("::");
    if (!dedupedChecks.has(key)) {
      dedupedChecks.set(key, testConnection({
        provider: route.provider,
        model: route.model,
        requestProtocol: route.requestProtocol,
        structuredResponseFormat: route.structuredResponseFormat,
        probeMode: "both",
      }));
    }
  }

  const statuses = await Promise.all(resolvedRoutes.map(async (route) => {
    const key = [
      route.provider,
      route.model,
      route.requestProtocol,
      route.structuredResponseFormat,
    ].join("::");
    const result = await dedupedChecks.get(key)!;
    const effectiveProtocol = result.structured?.requestProtocol ?? result.plain?.requestProtocol ?? route.requestProtocol;
    const effectiveFormat = (
      result.structured?.strategy === "json_schema"
      || result.structured?.strategy === "json_object"
      || result.structured?.strategy === "prompt_json"
    )
      ? result.structured.strategy
      : route.structuredResponseFormat;
    const shouldPersistProbeResult = result.structured?.ok === true
      && (effectiveProtocol !== route.requestProtocol || effectiveFormat !== route.structuredResponseFormat);
    if (shouldPersistProbeResult) {
      await upsertModelRouteConfig(route.taskType, {
        provider: route.provider,
        model: route.model,
        temperature: route.temperature,
        maxTokens: route.maxTokens,
        requestProtocol: effectiveProtocol,
        structuredResponseFormat: effectiveFormat,
      });
    }
    return {
      taskType: route.taskType,
      provider: route.provider,
      model: route.model,
      ok: result.ok,
      latency: result.latency,
      error: result.error,
      requestProtocol: result.requestProtocol,
      plain: result.plain,
      structured: result.structured,
    };
  }));

  return {
    testedAt: new Date().toISOString(),
    statuses,
  };
}

export const llmConnectivityService = {
  testConnection,
  testModelRoutes,
};
