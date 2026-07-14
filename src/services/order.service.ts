import { Order, OrderState, UpdateAction, CompletionResult} from "../types/order";
import { AppError } from "../utility/handle-errors";
import { OrderRepository } from "../repositories/interfaces/storage";
import { PaymentGateway } from "./interfaces/payment";


export default class OrderService {

    // For the prototype, order completion is stubbed so tests can force success or failure.
    constructor(private readonly repository: OrderRepository, private readonly payment: PaymentGateway, private readonly completionResult: CompletionResult = 'success') {}

    private readonly validTransitions: Record<OrderState, Set<OrderState>> = {
        initialized: new Set(["payment_authorized", "rejected"]),
        payment_authorized: new Set(["complete", "cancelled", "needs_attention"]),
        complete: new Set(),
        rejected: new Set(),
        cancelled: new Set(),
        needs_attention: new Set(),
    };

    async get(id: string): Promise<Order> {
        const order = await this.repository.get(id);
        if (!order) {
            throw new AppError(404, 'order_not_found', `Order ${id} not found`)
        }
        return order;
    }

    async initialize(): Promise<Order> {
        const order = this.createInitializedOrder();

        try {
            await this.repository.initialize(order);
            return order;
        } catch {
            throw new AppError(500, "storage_error", "Could not create order");
        }
    }
    
    // Create a new order in the initial state.
    private createInitializedOrder(): Order {
        return {
            id: crypto.randomUUID(),
            status: 'initialized',
            paymentId: crypto.randomUUID(),
            history: [
                {
                    from: null,
                    to: 'initialized',
                    createdAt: Date.now(),
                }
            ]
        }
    }

    async advance(id: string, action: UpdateAction): Promise<Order> {
        const previous_order = await this.repository.get(id);

        if (!previous_order) {
            throw new AppError(404, 'order_not_found', `Order ${id} not found`);
        }
        
          switch (action) {
            case 'authorize_payment':
            return this.authorizePayment(previous_order);

            case 'complete_order':
            return this.completeOrder(previous_order);

            default:
            throw new AppError(400, "invalid_action", "Invalid advance action");

        }
    }

    private async authorizePayment(order: Order): Promise<Order> {
        const status = await this.payment.authorize();

        switch(status) {
            case 'success':
                return await this.transitionOrder(order, 'payment_authorized');
            case 'failure':
                return await this.transitionOrder(order, 'rejected');
            default:
                throw new AppError(400, "invalid_authorization_response", `Invalid authorization response: ${status}`);
        }
    }


    private async completeOrder(order: Order): Promise<Order> {
        this.assertOrderIsPaymentAuthorized(order);

        switch(this.completionResult) {
            case 'success': 
                return await this.transitionOrder(order, 'complete');
            case 'failure':
                // If fulfillment fails after authorization, void the payment before cancelling the order.
                const voidStatus = await this.payment.void();
                
                if (voidStatus === 'success') {
                    return await this.transitionOrder(order, 'cancelled')
                } 
                
                if (voidStatus === 'failure') {
                    return await this.transitionOrder(order, 'needs_attention')
                }

                throw new AppError(502, "payment_gateway_error", "Unexpected void response");

            default:
                throw new AppError(400, "invalid_completion_response", `Invalid completion response: ${this.completionResult}`);
        }
    }

    // Completion can trigger fulfillment or payment cleanup, so validate before side effects.
    private assertOrderIsPaymentAuthorized(order: Order): void {
        if (order.status !== 'payment_authorized') {
            throw new AppError(
                409,
                'invalid_transition',
                `Cannot complete order from ${order.status}`
            );
        }
    }


    private async transitionOrder(previous_order: Order, new_state: OrderState): Promise<Order> {
        const updated_order = this.createUpdatedOrder(previous_order, new_state);

        try {   
            await this.repository.save(updated_order);
        } catch {
            throw new AppError(500, "storage_error", `Could not update order ${previous_order.id}`);
        }

        return updated_order;
    }

    // Create an updated order object after transition
    private createUpdatedOrder(previous_order: Order, new_state: OrderState): Order {
        this.validateTransition(previous_order.status, new_state);
        return {
            id: previous_order.id,
            status: new_state,
            paymentId: previous_order.paymentId,
            history: [
                ...previous_order.history,
                {
                    from: previous_order.status,
                    to: new_state,
                    createdAt: Date.now(),
                }
            ]
        }
    }

    // Defines which order statuses are allowed to move to which next statuses.
    private validateTransition(previous_state: OrderState, new_state: OrderState) {
        if (this.validTransitions[previous_state].has(new_state)) {
            return true;
        } else {
            throw new AppError(409, 'invalid_transition', `Cannot transition order from ${previous_state} to ${new_state}`)
        }
    }

}

