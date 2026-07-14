
import { AuthorizeResult, VoidResult } from "../types/payment";
import { PaymentGateway } from "./interfaces/payment";

// Stubbed payment gateway used by the prototype and tests.
export default class StubPaymentGateway implements PaymentGateway {
  constructor(
    private readonly authorizeResult: AuthorizeResult = "success",
    private readonly voidResult: VoidResult = "success"
  ) {}

  async authorize(): Promise<AuthorizeResult> {
    return this.authorizeResult;
  }

  async void(): Promise<VoidResult> {
    return this.voidResult;
  }
}