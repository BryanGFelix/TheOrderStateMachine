export interface Order {
    id: string;
    status: OrderState;
    paymentId: string;
    history: OrderHistory[];
}

export type OrderState =
    'initialized' |
    'payment_authorized' |
    'complete' |
    'rejected' |
    'cancelled' |
    'needs_attention'

export type OrderHistory = {
    from: OrderState | null,
    to: OrderState,
    createdAt: EpochTimeStamp
}

export type UpdateAction = 'authorize_payment' | 'complete_order'

export type CompletionResult = 'success' | 'failure'
