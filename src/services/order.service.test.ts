import { describe, expect, it } from "vitest";
import InMemoryOrderRepository from "../repositories/storage";
import OrderService from "./order.service";
import StubPaymentGateway from "./payment.service";

const createService = (
  authorizeResult: "success" | "failure" = "success",
  voidResult: "success" | "failure" = "success",
  completionResult: "success" | "failure" = "success",
) => {
  const repository = new InMemoryOrderRepository();
  const payment = new StubPaymentGateway(authorizeResult, voidResult);
  const service = new OrderService(repository, payment, completionResult);

  return service;
};

describe("OrderService", () => {
  it("completes the happy path", async () => {
    const service = createService();

    const initialized = await service.initialize();
    const authorized = await service.advance(initialized.id, "authorize_payment");
    const completed = await service.advance(initialized.id, "complete_order");

    expect(authorized.status).toBe("payment_authorized");
    expect(completed.status).toBe("complete");
    expect(completed.history.map((entry) => entry.to)).toEqual([
      "initialized",
      "payment_authorized",
      "complete",
    ]);
  });

  it("rejects the order when payment authorization fails", async () => {
    const service = createService("failure");

    const initialized = await service.initialize();
    const rejected = await service.advance(initialized.id, "authorize_payment");

    expect(rejected.status).toBe("rejected");
    expect(rejected.history.map((entry) => entry.to)).toEqual([
      "initialized",
      "rejected",
    ]);
  });

  it("cancels the order when completion fails and payment void succeeds", async () => {
    const service = createService("success", "success", "failure");

    const initialized = await service.initialize();
    await service.advance(initialized.id, "authorize_payment");
    const cancelled = await service.advance(initialized.id, "complete_order");

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.history.map((entry) => entry.to)).toEqual([
      "initialized",
      "payment_authorized",
      "cancelled",
    ]);
  });

  it("moves the order to needs_attention when completion and void both fail", async () => {
    const service = createService("success", "failure", "failure");

    const initialized = await service.initialize();
    await service.advance(initialized.id, "authorize_payment");
    const needsAttention = await service.advance(initialized.id, "complete_order");

    expect(needsAttention.status).toBe("needs_attention");
    expect(needsAttention.history.map((entry) => entry.to)).toEqual([
      "initialized",
      "payment_authorized",
      "needs_attention",
    ]);
  });
});
