// lib/fetcher.ts
import {
    adminAndOwnerOnly,
    adminOnly,
    getAuthCredentials,
    hasAccess,
} from '@/utils/auth-utils';
const { permissions } = getAuthCredentials();
export async function getNotifications() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const API_URL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;
    const canSeeAll = hasAccess(adminOnly, permissions);

    const endpoint = canSeeAll
        ? `${API_URL}/notifications`
        : `${API_URL}/notifications?user_id=${user.id}`;

    const res = await fetch(endpoint);
    const json = await res.json();
    console.log("notifications", json);
    console.log("notifications", canSeeAll);
    return json;
}