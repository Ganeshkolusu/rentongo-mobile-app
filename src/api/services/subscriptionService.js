/**
 * Owner Subscription API Service (Cashfree)
 */

import { get, post } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Get the current owner's subscription status
 * @returns {Promise} { plan, status, expiresAt, limits }
 */
export const getMyStatus = async () => {
  return get(API_ENDPOINTS.SUBSCRIPTION.GET_MY_STATUS);
};

/**
 * Create a Cashfree order to purchase/renew a paid plan
 * @param {'pro'} plan
 * @returns {Promise} { orderId, paymentSessionId, amount, plan }
 */
export const createOrder = async (plan) => {
  return post(API_ENDPOINTS.SUBSCRIPTION.CREATE_ORDER, { plan });
};

export default { getMyStatus, createOrder };
