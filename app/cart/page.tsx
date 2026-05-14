"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PHONES_CATALOG, PRODUCTS } from "@/lib/data";
import { fmtRub, fmtRubApprox, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

/** Берёт первую картинку — для карточки в корзине/избранном достаточно */
const firstImg = (img: string | string[] | undefined): string | undefined =>
  Array.isArray(img) ? img[0] : img;

const ALL_PRODUCTS = [
  ...PHONES_CATALOG.map(p => ({
    id: p.id, name: `${p.brand} ${p.model}`, brand: p.brand,
    price: p.price, badge: p.badge, img: firstImg(p.img),
    emoji: "📱", sim: p.sim as string | undefined, memory: p.memory,
  })),
  ...PRODUCTS.map(p => ({
    id: p.id, name: p.name, brand: p.brand,
    price: p.price, badge: p.badge, img: firstImg(p.img),
    emoji: p.emoji, sim: undefined as string | undefined, memory: undefined as string | undefined,
  })),
];

interface CartEntry { productId: string; qty: number; }

export default function CartPage() {
  const { openModal } = useAppModal();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items,  setItems]  = useState<CartEntry[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setAuthed(!!d?.authed);
        if (d?.authed) {
          fetch("/api/cart")
            .then(r => r.ok ? r.json() : { items: [] })
            .then(d => setItems(d.items ?? []));
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  const handleRemove = useCallback(async (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
    await fetch("/api/cart", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId }),
    });
  }, []);

  const handleQty = useCallback(async (productId: string, qty: number) => {
    if (qty < 1) { handleRemove(productId); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
    await fetch("/api/cart", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId, qty }),
    });
  }, [handleRemove]);

  const cartProducts = items.map(item => ({
    ...item,
    product: ALL_PRODUCTS.find(p => p.id === item.productId),
  })).filter(i => i.product);

  const totalPrice = cartProducts.reduce((s, i) => s + (i.product!.price * i.qty), 0);

  return (
    <main className="min-h-screen bg-[#F4F7FC]">
      <div className="bg-white border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Корзина</span>
        </div>
      </div>

      <div className="section py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-extrabold text-[#0A1628]">Корзина</h1>
          {cartProducts.length > 0 && (
            <span className="px-2.5 py-1 bg-[#E8F5F0] text-[#0C7A58] text-xs font-bold rounded-full">
              {cartProducts.length}
            </span>
          )}
        </div>

        {authed === null && (
          <div className="text-center py-20 text-[#9CA3AF]">Загрузка…</div>
        )}

        {authed === false && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <p className="font-bold text-[#0A1628] mb-2">Войдите, чтобы видеть корзину</p>
            <Link href="/lk"
                  className="inline-flex mt-4 px-6 py-3 rounded-xl bg-[#0A1628] text-white text-sm font-bold">
              Войти
            </Link>
          </div>
        )}

        {authed === true && cartProducts.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-bold text-[#0A1628] mb-2">Корзина пуста</p>
            <p className="text-sm text-[#6B7280] mb-5">Добавляйте товары из каталога</p>
            <Link href="/catalog"
                  className="inline-flex px-6 py-3 rounded-xl bg-[#0A1628] text-white text-sm font-bold
                             hover:bg-[#1A3C6E] transition-colors">
              Перейти в каталог
            </Link>
          </div>
        )}

        {authed === true && cartProducts.length > 0 && (
          <div className="flex flex-col gap-6">
            {/* Список */}
            <div className="space-y-3">
              {cartProducts.map(({ product: p, qty, productId }) => {
                if (!p) return null;
                const down = Math.ceil(p.price * getMinDownPct(p.price));
                const res  = calcInstallment({ price: p.price, down, term: 6 });
                return (
                  <div key={productId}
                       className="card p-4 flex gap-4 items-center hover:shadow-sm transition-shadow">
                    {/* Фото */}
                    <div className="w-16 h-20 bg-gradient-to-b from-[#F4F7FC] to-[#EBF0F9]
                                    rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {p.img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.img} alt={p.name} className="w-full h-full object-contain p-2" />
                        : <span className="text-3xl">{p.emoji}</span>}
                    </div>
                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#6B7280]">{p.brand}</p>
                      <h3 className="font-semibold text-[#0A1628] text-sm leading-snug line-clamp-2">{p.name}</h3>
                      {p.memory && (
                        <span className="text-[10px] text-[#1A3C6E] bg-[#EBF0F9] px-1.5 py-0.5 rounded-full font-semibold">
                          {p.memory}
                        </span>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="font-extrabold text-[#0A1628] text-sm">{fmtRubApprox(p.price * qty)} ₽</p>
                        <p className="text-[10px] text-[#0C7A58] font-semibold">от {fmtRub(res.monthly)} ₽/мес.</p>
                      </div>
                    </div>
                    {/* Управление */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={() => handleRemove(productId)}
                              className="text-[#9CA3AF] hover:text-red-500 transition-colors text-lg leading-none">
                        ×
                      </button>
                      <div className="flex items-center gap-1 border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <button onClick={() => handleQty(productId, qty - 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#6B7280]
                                           hover:bg-[#F4F7FC] transition-colors text-base font-bold">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-[#0A1628]">{qty}</span>
                        <button onClick={() => handleQty(productId, qty + 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#6B7280]
                                           hover:bg-[#F4F7FC] transition-colors text-base font-bold">
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => openModal({ productName: p.name, price: p.price, down, term: 6, monthly: res.monthly })}
                        className="text-[11px] text-[#1A3C6E] font-semibold underline hover:no-underline">
                        Рассрочка
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Итого */}
            <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#6B7280] mb-0.5">Итого ({cartProducts.length} товара)</p>
                <p className="text-2xl font-extrabold text-[#0A1628]">{fmtRubApprox(totalPrice)} ₽</p>
              </div>
              <button
                onClick={() => {
                  if (cartProducts.length === 0) return;
                  /* Используем первый товар для превью; для каждого товара модал
                     сам пересчитает down/monthly при отправке. */
                  const first = cartProducts[0];
                  if (!first?.product) return;
                  const down = Math.ceil(first.product.price * getMinDownPct(first.product.price));
                  const res  = calcInstallment({ price: first.product.price, down, term: 6 });
                  openModal({
                    productName: cartProducts.length === 1
                      ? first.product.name
                      : `${first.product.name} и ещё ${cartProducts.length - 1}`,
                    price: first.product.price,
                    down,
                    term: 6,
                    monthly: res.monthly,
                    /* Пакетный режим: одна заявка на каждый товар × qty */
                    cart: cartProducts.map(({ product, qty }) => ({
                      productName: product!.name,
                      price:       product!.price,
                      qty,
                    })),
                    onAllSent: async () => {
                      /* Очищаем корзину после успешной отправки */
                      await fetch("/api/cart", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ all: true }),
                      });
                      setItems([]);
                    },
                  });
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0C7A58] text-white font-bold
                           hover:bg-[#0a6449] transition-colors active:scale-95"
              >
                Оформить рассрочку
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
