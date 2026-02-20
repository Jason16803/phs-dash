import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function formatMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatShort(n) {
  const num = Number(n || 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return `${num}`;
}

export default function KpiTrendCard({
  title = "Revenue",
  subtitle = "Last 14 days",
  data = [],
  valueKey = "value",
  labelKey = "label",
  currency = true,
}) {
  const latest = useMemo(() => {
    if (!data?.length) return 0;
    return Number(data[data.length - 1]?.[valueKey] || 0);
  }, [data, valueKey]);

  const prev = useMemo(() => {
    if (!data?.length) return 0;
    return Number(data[Math.max(0, data.length - 2)]?.[valueKey] || 0);
  }, [data, valueKey]);

  const delta = latest - prev;
  const deltaPct = prev > 0 ? (delta / prev) * 100 : 0;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 13 }}>{title}</div>
          <div style={{ color: "var(--phs-muted)", fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 950, fontSize: 20 }}>
            {currency ? formatMoney(latest) : formatShort(latest)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--phs-muted)" }}>
            {prev > 0 ? (
              <span
                style={{
                  color: delta >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {delta >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}%
              </span>
            ) : (
              <span>—</span>
            )}
            <span style={{ marginLeft: 8 }}>vs prior day</span>
          </div>
        </div>
      </div>

      <div style={{ height: 140, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (currency ? `$${formatShort(v)}` : formatShort(v))}
            />
            <Tooltip
              formatter={(v) => (currency ? formatMoney(v) : formatShort(v))}
              labelStyle={{ fontWeight: 800 }}
            />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke="var(--phs-primary)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}