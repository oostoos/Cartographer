import { afterEach, describe, expect, it, vi } from "vitest";

import * as httpClient from "@lib-stack/api/http-client";

import {
  createTask,
  deleteTask,
  fetchTask,
  fetchTasks,
  reorderTasks,
  setTaskCompleted,
  setTaskDueDate,
  setTaskEnergyRequirement,
  setTaskGroup,
  setTaskImpact,
  setTaskTimeEstimateMinutes,
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

  it("setTaskEnergyRequirement calls PATCH /tasks/:id/energy with energy_requirement", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskEnergyRequirement("abc", 3);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/energy", { energy_requirement: 3 });
  });

  it("setTaskEnergyRequirement calls PATCH /tasks/:id/energy with null to clear it", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskEnergyRequirement("abc", null);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/energy", { energy_requirement: null });
  });

  it("setTaskImpact calls PATCH /tasks/:id/impact with impact", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskImpact("abc", 5);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/impact", { impact: 5 });
  });

  it("setTaskDueDate calls PATCH /tasks/:id/due-date with due_date", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskDueDate("abc", "2026-08-01");

    expect(spy).toHaveBeenCalledWith("/tasks/abc/due-date", { due_date: "2026-08-01" });
  });

  it("setTaskTimeEstimateMinutes calls PATCH /tasks/:id/time-estimate with time_estimate_minutes", async () => {
    const spy = vi.spyOn(httpClient, "patchJson").mockResolvedValue({});

    await setTaskTimeEstimateMinutes("abc", 45);

    expect(spy).toHaveBeenCalledWith("/tasks/abc/time-estimate", { time_estimate_minutes: 45 });
  });

  it("deleteTask calls DELETE /tasks/:id", async () => {
    const spy = vi.spyOn(httpClient, "deleteJson").mockResolvedValue({ id: "abc" });

    await deleteTask("abc");

    expect(spy).toHaveBeenCalledWith("/tasks/abc");
  });
});
