"use client";

import { useState } from "react";
import type { FaqGroup } from "./page";

export function FaqClient({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section className="py-12">
      <div className="section max-w-3xl mx-auto">

        {/* Groups */}
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xl font-extrabold text-[#0A1628] mb-4">
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
