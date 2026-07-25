import { afterEach, describe, expect, it, vi } from "vitest";

import * as httpClient from "@common/api/http-client";

import { createTask, fetchTask, fetchTasks, setTaskCompleted, updateTask } from "./tasks-api";

describe("tasks-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchTasks calls GET /tasks", async () => {
    const spy = vi.spyOn(httpClient, "getJson").mockResolvedValue([]);

    await fetchTasks();

    expect(spy).toHaveBeenCalledWith("/tasks");
  });

  it("fetchTask calls GET /tasks/:id", async () => {
    const spy = vi.spyOn(httpClient, "getJson").mockResolvedValue({});

    await fetchTask("abc");

    expect(spy).toHaveBeenCalledWith("/tasks/abc");
  });

  it("createTask calls POST /tasks with the payload", async () => {
    const spy = vi.spyOn(httpClient, "postJson").mockResolvedValue({});

    await createTask({ title: "Buy milk", description: "" });

    expect(spy).toHaveBeenCalledWith("/tasks", { title: "Buy milk", description: "" });
  });

  it("updateTask calls PATCH /tasks/:id with the payload", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await updateTask("abc", { title: "New title" });

    expect(spy).toHaveBeenCalledWith("/tasks/abc", { title: "New title" });
  });

  it("setTaskCompleted calls PATCH /tasks/:id/complete with completed", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskCompleted("abc", true);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/complete", { completed: true });
  });
});
