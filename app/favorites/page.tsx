"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PHONES_CATALOG, PRODUCTS } from "@/lib/data";
import { fmtRub, fmtRubApprox, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

// Объединённый список всех товаров для поиска по id
const firstImg = (img: string | string[] | undefined): string | undefined =>
  Array.isArray(img) ? img[0] : img;

const ALL_PRODUCTS = [
  ...PHONES_CATALOG.map(p => ({
    id:    p.id,
    name:  `${p.brand} ${p.model}`,
    brand: p.brand,
    price: p.price,
    badge: p.badge,
    img:   firstImg(p.img),
    emoji: "📱",
    sim:   p.sim as string | undefined,
    memory: p.memory,
    tgSynced: p.tgSynced,
  })),
  ...PRODUCTS.map(p => ({
    id:     p.id,
    name:   p.name,
    brand:  p.brand,
    price:  p.price,
    badge:  p.badge,
    img:    firstImg(p.img),
    emoji:  p.emoji,
    sim:    undefined as string | undefined,
    memory: undefined as string | undefined,
    tgSynced: p.tgSynced,
  })),
];

interface FavProduct {
  id: string; name: string; brand: string; price: number;
  badge?: string; img?: string; emoji: string; sim?: string; memory?: string;
  tgSynced?: boolean;
}

export default function FavoritesPage() {
  const [authed,    setAuthed]    = useState<boolean | null>(null);
  const [favIds,    setFavIds]    = useState<string[]>([]);
  const [cartIds,   setCartIds]   = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setAuthed(!!d?.authed);
        if (d?.authed) {
          Promise.all([
            fetch("/api/favorites").then(r => r.ok ? r.json() : { ids: [] }),
            fetch("/api/cart").then(r => r.ok ? r.json() : { items: [] }),
          ]).then(([fav, crt]) => {
            setFavIds(fav.ids ?? []);
            setCartIds((crt.items ?? []).map((i: { productId: string }) => i.productId));
          });
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  const handleRemoveFav = useCallback(async (productId: string) => {
    setFavIds(prev => prev.filter(id => id !== productId));
    await fetch("/api/favorites", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId }),
    });
  }, []);

  const handleAddCart = useCallback(async (productId: string) => {
    setCartIds(prev => [...prev, productId]);
    await fetch("/api/cart", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId, qty: 1 }),
    });
  }, []);

  const favProducts: FavProduct[] = favIds
    .map(id => ALL_PRODUCTS.find(p => p.id === id))
    .filter(Boolean) as FavProduct[];

  return (
    <main className="min-h-screen bg-[#F4F7FC]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Избранное</span>
        </div>
      </div>

      <div className="section py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-extrabold text-[#0A1628]">Избранное</h1>
          {favProducts.length > 0 && (
            <span className="px-2.5 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-full">
              {favProducts.length}
            </span>
          )}
        </div>

        {authed === null && (
          <div className="text-center py-20 text-[#9CA3AF]">Загрузка…</div>
        )}

        {authed === false && (
          <div className="card p-12 text-center max-w-md mx-auto">
            <div className="text-5xl mb-4">🔐</div>
            <p className="font-bold text-[#0A1628] mb-2">Войдите, чтобы видеть избранное</p>
            <p className="text-sm text-[#6B7280] mb-5">
              Сохраняйте товары и возвращайтесь к ним в любое время
            </p>
            <Link href="/lk"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-[#0A1628] text-white text-sm font-bold hover:bg-[#1A3C6E] transition-colors">
              Войти
            </Link>
          </div>
        )}

        {authed === true && favProducts.length === 0 && (
          <div className="card p-12 text-center max-w-md mx-auto">
            <div className="text-5xl mb-4">🤍</div>
            <p className="font-bold text-[#0A1628] mb-2">Список избранного пуст</p>
            <p className="text-sm text-[#6B7280] mb-5">
              Нажимайте ❤️ на карточках товаров, чтобы добавить их сюда
            </p>
            <Link href="/catalog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-[#0A1628] text-white text-sm font-bold hover:bg-[#1A3C6E] transition-colors">
              Перейти в каталог
            </Link>
          </div>
        )}

        {authed === true && favProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {favProducts.map(p => (
              <FavCard
                key={p.id}
                product={p}
                inCart={cartIds.includes(p.id)}
                onRemove={handleRemoveFav}
                onAddCart={handleAddCart}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── FavCard ──────────────────────────────────────────────────── */
function FavCard({
  product: p,
  inCart,
  onRemove,
  onAddCart,
}: {
  product: FavProduct;
  inCart: boolean;
  onRemove: (id: string) => void;
  onAddCart: (id: string) => void;
}) {
  const { openModal } = useAppModal();
  const down = Math.ceil(p.price * getMinDownPct(p.price));
  const res  = calcInstallment({ price: p.price, down, term: 6 });

  return (
    <div className="card p-4 hover:shadow-md transition-shadow group flex flex-col relative">
      {/* Убрать из избранного */}
      <button
        onClick={() => onRemove(p.id)}
        aria-label="Убрать из избранного"
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center
                   rounded-full bg-red-50 text-red-500 transition-all active:scale-90"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 17S3 12.5 3 7a4 4 0 017-2.66A4 4 0 0117 7c0 5.5-7 10-7 10z"
                stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Бейдж */}
      {p.badge && (
        <span className={`inline-block self-start px-2 py-0.5 text-[10px] font-bold rounded-full mb-2
          ${p.badge === "Хит"     ? "bg-amber-100 text-amber-700" :
            p.badge === "Новинка" ? "bg-[#EBF0F9] text-[#1A3C6E]" :
                                    "bg-red-100 text-red-600"}`}>
          {p.badge}
        </span>
      )}

      {/* Фото */}
      <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#F4F7FC] to-[#EBF0F9] rounded-xl mb-3
                      overflow-hidden flex items-center justify-center">
        {p.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.img} alt={p.name}
               className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
               onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-5xl">{p.emoji}</span>
        )}
      </div>

      <p className="text-[11px] text-[#6B7280] mb-0.5">{p.brand}</p>
      <h3 className="font-semibold text-[#0A1628] text-xs leading-snug mb-1.5 line-clamp-2">{p.name}</h3>

      {/* Теги */}
      <div className="flex flex-wrap gap-1 mb-2">
        {p.memory && (
          <span className="px-1.5 py-0.5 bg-[#EBF0F9] text-[#1A3C6E] rounded-full text-[9px] font-semibold">
            {p.memory}
          </span>
        )}
        {p.sim && (
          <span className="px-1.5 py-0.5 bg-[#F4F7FC] text-[#6B7280] rounded-full text-[9px]">
            {p.sim}
          </span>
        )}
      </div>

      <div className="mt-auto">
        <p className="font-extrabold text-[#0A1628] text-sm">{p.tgSynced ? fmtRub(p.price) : fmtRubApprox(p.price)} ₽</p>
        <p className="text-[10px] text-[#0C7A58] font-semibold mt-0.5">от {fmtRub(res.monthly)} ₽/мес.</p>
      </div>

      {/* Кнопки */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={inCart ? undefined : () => onAddCart(p.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5
                      transition-all active:scale-95
                      ${inCart
                        ? "bg-[#0C7A58] text-white cursor-default"
                        : "bg-[#0A1628] text-white hover:bg-[#0C7A58]"}`}
        >
          {inCart ? "В корзине ✓" : "В корзину"}
        </button>
        <button
          onClick={() => openModal({ productName: p.name, price: p.price, down, term: 6, monthly: res.monthly })}
          className="w-10 h-10 rounded-xl bg-[#F4F7FC] text-[#1A3C6E] flex items-center justify-center
                     shrink-0 hover:bg-[#EBF0F9] transition-colors border border-[#E5E7EB] text-[10px] font-bold"
          title="Оформить рассрочку"
        >
          ₽
        </button>
      </div>
    </div>
  );
}
