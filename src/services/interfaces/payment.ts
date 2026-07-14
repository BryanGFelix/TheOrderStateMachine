import { AuthorizeResult, VoidResult } from "../../types/payment";

export interface PaymentGateway {
  authorize(): Promise<AuthorizeResult>;
  void(): Promise<VoidResult>;
}