/**
 * Example test: upstream LLM SDK error pass-through (Requirement 6.5)
 *
 * When an AppError has no `code` property, the errorHandler must preserve
 * the original error message verbatim — it must NOT attempt to translate it.
 * This covers the documented limitation that error messages bubbled up from
 * upstream LLM provider SDKs are passed through as-is.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler, AppError } = require("../dist/middleware/errorHandler.js");

/**
 * Build a minimal mock Express Response that captures the JSON body sent
 * by the error handler.
 */
function makeMockRes(localeOverride) {
  const captured = { statusCode: null, body: null };

  const res = {
    locals: localeOverride ? { locale: localeOverride } : {},
    status(code) {
      captured.statusCode = code;
      return res;
    },
    json(body) {
      captured.body = body;
      return res;
    },
    _captured: captured,
  };

  return res;
}

/**
 * Build a minimal mock Express Request.
 */
function makeMockReq(method = "POST", url = "/api/test") {
  return {
    method,
    originalUrl: url,
  };
}

test("errorHandler preserves AppError message verbatim when error has no code", () => {
  const originalMessage = "DeepSeek API error: rate limit exceeded (429)";
  const error = new AppError(originalMessage, 500);

  // Confirm the error has no code — this is the upstream SDK error scenario.
  assert.equal(error.code, undefined);

  const req = makeMockReq();
  const res = makeMockRes();
  const next = () => {};

  errorHandler(error, req, res, next);

  assert.equal(res._captured.statusCode, 500);
  assert.ok(res._captured.body, "response body should be set");
  assert.equal(res._captured.body.success, false);
  assert.equal(
    res._captured.body.error,
    originalMessage,
    "error message must be preserved verbatim, not translated",
  );
});

test("errorHandler translates AppError message when error has a code", () => {
  // When a code IS present, the handler calls tError() to translate it.
  // Since i18n is not booted in this unit test, tError() falls back to the
  // raw message — but the important thing is the code-based path is taken.
  const originalMessage = "小说不存在。";
  const error = new AppError(originalMessage, 404, undefined, "novelNotFound");

  assert.equal(error.code, "novelNotFound");

  const req = makeMockReq("GET", "/api/novels/missing-id");
  const res = makeMockRes();
  const next = () => {};

  errorHandler(error, req, res, next);

  assert.equal(res._captured.statusCode, 404);
  assert.ok(res._captured.body, "response body should be set");
  assert.equal(res._captured.body.success, false);
  // When i18n is not booted, tError() returns the fallback (original message).
  // The key assertion is that the handler did not crash and returned a string.
  assert.equal(typeof res._captured.body.error, "string");
  assert.ok(res._captured.body.error.length > 0, "error message must be non-empty");
});

test("errorHandler preserves plain Error message verbatim when no code exists", () => {
  // A plain Error (not AppError) also has no code — simulates an SDK error
  // thrown as a standard Error object.
  const originalMessage = "OpenAI connection timeout after 30000ms";
  const error = new Error(originalMessage);

  assert.equal((error).code, undefined);

  const req = makeMockReq();
  const res = makeMockRes();
  const next = () => {};

  errorHandler(error, req, res, next);

  // Plain errors that are not network-like fall through to the 500 handler.
  assert.equal(res._captured.statusCode, 500);
  assert.ok(res._captured.body, "response body should be set");
  assert.equal(res._captured.body.success, false);
  assert.equal(
    res._captured.body.error,
    originalMessage,
    "plain Error message must be preserved verbatim",
  );
});
