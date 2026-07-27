import { afterEach, describe, expect, it, vi } from "vitest";

import * as httpClient from "@common/api/http-client";

import {
  createTask,
  deleteTask,
  fetchTask,
  fetchTasks,
  reorderTasks,
  setTaskCompleted,
  setTaskGroup,
  updateTask,
} from "./tasks-api";

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

  it("reorderTasks calls PATCH /tasks/reorder with the ordered task ids", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue([]);

    await reorderTasks(["b", "a"]);

    expect(spy).toHaveBeenCalledWith("/tasks/reorder", { task_ids: ["b", "a"] });
  });

  it("setTaskGroup calls PATCH /tasks/:id/group with the group id", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskGroup("abc", "group-1");

    expect(spy).toHaveBeenCalledWith("/tasks/abc/group", { group_id: "group-1" });
  });

  it("setTaskGroup calls PATCH /tasks/:id/group with null to clear it", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskGroup("abc", null);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/group", { group_id: null });
  });

  it("deleteTask calls DELETE /tasks/:id", async () => {
    const spy = vi.spyOn(httpClient, "deleteJson").mockResolvedValue({ id: "abc" });

    await deleteTask("abc");

    expect(spy).toHaveBeenCalledWith("/tasks/abc");
  });
});
