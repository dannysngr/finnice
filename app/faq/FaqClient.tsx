"use client";

import { useState, useMemo } from "react";
import type { FaqGroup } from "./page";

export function FaqClient({ groups }: { groups: FaqGroup[] }) {
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map(g => ({
        ...g,
        items: g.items.filter(i =>
          i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q),
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [groups, search]);

  const totalMatches = filtered.reduce((s, g) => s + g.items.length, 0);

  return (
    <section className="py-12">
      <div className="section max-w-3xl mx-auto">

        {/* Search */}
        <div className="mb-8 relative">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти ответ — например: «паспорт», «досрочно», «гарантия»"
            className="w-full px-5 py-4 pl-12 rounded-2xl text-[15px] outline-none transition-all
                       bg-white border border-[#D8E2F0] focus:border-[#0C7A58] focus:shadow-md text-[#0A1628]"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="11.5" y1="11.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {search && (
            <p className="text-xs text-[#6B7280] mt-2 pl-1">
              {totalMatches === 0
                ? "Ничего не найдено. Напишите нам в чат — ответим лично."
                : `Найдено: ${totalMatches} ${totalMatches === 1 ? "ответ" : totalMatches < 5 ? "ответа" : "ответов"}`}
            </p>
          )}
        </div>

        {/* Groups */}
        <div className="space-y-10">
          {filtered.map((group) => (
            <div key={group.title}>
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-[#0A1628] mb-4">
                <span className="text-2xl">{group.icon}</span>
                {group.title}
              </h2>
              <div className="space-y-2.5">
                {group.items.map((item, idx) => {
                  const key = `${group.title}-${idx}`;
                  const open = openKey === key;
                  return (
                    <div
                      key={key}
                      className="rounded-xl border bg-white transition-all"
                      style={{
                        borderColor: open ? "#0C7A58" : "#E5E7EB",
                        boxShadow:   open ? "0 4px 16px rgba(12,122,88,0.12)" : "none",
                      }}
                    >
                      <button
                        onClick={() => setOpenKey(open ? null : key)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left
                                   hover:bg-[#F9FAFB] rounded-xl transition-colors"
                        aria-expanded={open}
                      >
                        <span className="text-[15px] font-semibold text-[#0A1628] leading-snug">
                          {item.q}
                        </span>
                        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                              style={{
                                background: open ? "#0C7A58" : "#F4F7FC",
                                color:      open ? "#ffffff" : "#6B7280",
                                transform:  open ? "rotate(45deg)" : "rotate(0deg)",
                              }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </span>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-line"
                               style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                            {item.a}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
