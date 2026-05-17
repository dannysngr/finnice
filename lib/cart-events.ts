/**
 * Простая «шина событий» через window для синхронизации счётчиков
 * корзины / избранного между несвязанными компонентами (карточка товара
 * → шапка) без полноценного контекста или Zustand.
 *
 *  Использование:
 *    – После любого изменения корзины: notifyCartChanged()
 *    – После любого изменения избранного: notifyFavoritesChanged()
 *    – Слушатель: onCartChanged(handler), вернёт unsubscribe
 *
 *  На SSR (window отсутствует) функции no-op.
 */

const CART_EVT = "finnice:cart-changed";
const FAV_EVT  = "finnice:favorites-changed";

export function notifyCartChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVT));
}

export function notifyFavoritesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAV_EVT));
}

export function onCartChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_EVT, handler);
  return () => window.removeEventListener(CART_EVT, handler);
}

export function onFavoritesChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FAV_EVT, handler);
  return () => window.removeEventListener(FAV_EVT, handler);
}
