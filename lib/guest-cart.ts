/**
 * Локальная корзина для неавторизованных пользователей.
 * Хранится в localStorage; при авторизации можно мигрировать на сервер
 * (см. mergeGuestCartToServer). Структура совпадает со server-cart, чтобы
 * UI работал одинаково в обоих случаях.
 *
 *  SSR-safe: все функции возвращают пустое значение, если window нет.
 */

const KEY = "finnice_guest_cart_v1";

export interface CartEntry {
  productId: string;
  qty: number;
}

function read(): CartEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartEntry =>
        x && typeof x.productId === "string" && typeof x.qty === "number" && x.qty > 0
    );
  } catch {
    return [];
  }
}

function write(items: CartEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota / SSR — игнорим */
  }
}

export const guestCart = {
  getItems(): CartEntry[] {
    return read();
  },

  count(): number {
    return read().length;
  },

  has(productId: string): boolean {
    return read().some(i => i.productId === productId);
  },

  qty(productId: string): number {
    return read().find(i => i.productId === productId)?.qty ?? 0;
  },

  /** Добавляет товар или увеличивает qty. Возвращает обновлённый массив. */
  add(productId: string, qty = 1): CartEntry[] {
    const items = read();
    const idx = items.findIndex(i => i.productId === productId);
    if (idx === -1) {
      items.push({ productId, qty });
    } else {
      items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    }
    write(items);
    return items;
  },

  /** Устанавливает точное qty (или удаляет, если qty ≤ 0). */
  setQty(productId: string, qty: number): CartEntry[] {
    const items = read();
    const idx = items.findIndex(i => i.productId === productId);
    if (qty <= 0) {
      if (idx >= 0) items.splice(idx, 1);
    } else if (idx === -1) {
      items.push({ productId, qty });
    } else {
      items[idx] = { ...items[idx], qty };
    }
    write(items);
    return items;
  },

  remove(productId: string): CartEntry[] {
    const items = read().filter(i => i.productId !== productId);
    write(items);
    return items;
  },

  clear(): void {
    write([]);
  },
};
