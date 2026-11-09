import { afterEach, expect, test, vi } from "vitest";
import { api, ApiError } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("unexpected response shapes become a useful error", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "not-a-uuid" }))),
  );
  await expect(api.user("id")).rejects.toMatchObject({
    status: 502,
    message: expect.stringContaining("unexpected response"),
  });
});

test("server validation details are surfaced", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "Check fields.",
            details: [{ message: "Invalid name." }],
          },
        }),
        { status: 422 },
      ),
    ),
  );
  await expect(api.signIn("Ada")).rejects.toMatchObject({
    status: 422,
    message: "Invalid name.",
  });
});

test("network failures are classified for recovery", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
  await expect(api.user("id")).rejects.toBeInstanceOf(ApiError);
  await expect(api.user("id")).rejects.toMatchObject({ status: 0 });
});

test("204 delete responses do not require a JSON body", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  await expect(api.deleteGame("id")).resolves.toBeUndefined();
});

test("query cancellation reaches fetch and remains an abort", async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_path, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ),
  );
  const pending = api.user("id", controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});

test("an empty name is rejected before making a request", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(() => api.signIn("  ")).toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
