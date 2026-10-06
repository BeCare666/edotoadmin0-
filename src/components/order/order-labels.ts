// Libellés français des valeurs réelles des colonnes orders.order_status / payment_status / delivery_type
export const ORDER_STATUS_LABEL: Record<string, string> = {
  'order-pending': 'En attente',
  'order-processing': 'En traitement',
  'order-completed': 'Terminée (retirée / livrée)',
  'order-cancelled': 'Annulée',
  'order-refunded': 'Remboursée',
  'order-failed': 'Échouée',
  'order-at-local-facility': 'Au point de retrait',
  'order-out-for-delivery': 'En livraison',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  'payment-pending': 'Paiement en attente',
  'payment-processing': 'Paiement en cours',
  'payment-success': 'Payée',
  'payment-failed': 'Paiement échoué',
  'payment-cash-on-delivery': 'Paiement à la livraison',
  'payment-cash': 'Espèces',
  'payment-wallet': 'Portefeuille',
  'payment-awaiting-for-approval': 'En attente de validation',
};

export const DELIVERY_TYPE_LABEL: Record<string, string> = {
  PICKUP: 'Point de retrait',
  CUSTOM: 'Livraison à domicile',
};
