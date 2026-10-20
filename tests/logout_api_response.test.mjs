import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy.ts";

// INV-LOGOUT-1: API requests after logout receive JSON 401, never a login-page HTML redirect.
test("unauthenticated protected API requests return JSON 401", async () => {
  for (const pathname of ["/api/v1/dashboard/summary", "/api/ai-analysis/query"]) {
    const response = proxy(new NextRequest(`http://localhost:3000${pathname}`));
    assert.equal(response.status, 401);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await response.json()).detail, "Authentication required");
  }
});

// INV-LOGOUT-2: Browser navigation still reaches login; public login API stays reachable.
test("protected pages redirect while login endpoints remain public", () => {
  const pageResponse = proxy(new NextRequest("http://localhost:3000/holistic"));
  assert.equal(pageResponse.status, 307);
  assert.equal(pageResponse.headers.get("location"), "http://localhost:3000/login");

  const loginPage = proxy(new NextRequest("http://localhost:3000/login"));
  assert.equal(loginPage.status, 200);

  const loginApi = proxy(new NextRequest("http://localhost:3000/api/v1/auth/login"));
  assert.equal(loginApi.status, 200);
});
