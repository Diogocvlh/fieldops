import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkOrder } from "../types";
import { statusLabels, STATUSES } from "../types";
import { productivity } from "../utils/metrics";
const colors = ["#23b9ce", "#6b7bd1", "#4a8cda", "#2dbb95", "#c0c7d2"];
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e9edf3",
  boxShadow: "0 6px 24px #10203810",
  fontSize: 12,
};
export function ProductivityChart({ orders }: { orders: WorkOrder[] }) {
  return (
    <div
      className="productivity-chart"
      aria-label="Gráfico de ordens abertas e concluídas nos últimos sete dias"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={productivity(orders)}
          margin={{ left: -24, right: 6, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="complete-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16b4c9" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#16b4c9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="open-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8097c2" stopOpacity={0.09} />
              <stop offset="100%" stopColor="#8097c2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 5"
            vertical={false}
            stroke="#e8edf3"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8b96a7", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: "#8b96a7", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.day
                ? new Date(
                    `${payload[0].payload.day}T12:00:00`,
                  ).toLocaleDateString("pt-BR")
                : ""
            }
          />
          <Area
            type="monotone"
            dataKey="abertas"
            name="Abertas"
            stroke="#879cc0"
            strokeWidth={2}
            fill="url(#open-fill)"
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="concluidas"
            name="Concluídas"
            stroke="#16b4c9"
            strokeWidth={2.5}
            fill="url(#complete-fill)"
            activeDot={{ r: 5, strokeWidth: 3, stroke: "white" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function StatusChart({ orders }: { orders: WorkOrder[] }) {
  const data = STATUSES.map((status, index) => ({
    name: statusLabels[status],
    value: orders.filter((o) => o.status === status).length,
    color: colors[index],
  }));
  return (
    <div className="status-chart">
      <div className="donut-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                orders.length
                  ? data
                  : [{ name: "Sem ordens", value: 1, color: "#e8edf3" }]
              }
              dataKey="value"
              innerRadius="73%"
              outerRadius="94%"
              paddingAngle={orders.length ? 5 : 0}
              cornerRadius={4}
              stroke="none"
            >
              {(orders.length ? data : [{ color: "#e8edf3" }]).map(
                (item, i) => (
                  <Cell key={i} fill={item.color} />
                ),
              )}
            </Pie>
            {orders.length > 0 && <Tooltip contentStyle={tooltipStyle} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{orders.length}</strong>
          <span>ordens no total</span>
        </div>
      </div>
      <div className="status-legend">
        {data.map((item) => (
          <div key={item.name}>
            <span>
              <i style={{ background: item.color }} />
              {item.name}
            </span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function TechnicianChart({
  data,
}: {
  data: { name: string; concluidas: number; ativas: number }[];
}) {
  return (
    <div className="technician-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ left: -24, right: 6, top: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 5"
            vertical={false}
            stroke="#e8edf3"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8b96a7", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8b96a7", fontSize: 11 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="concluidas"
            name="Concluídas"
            fill="#19b8cb"
            radius={[4, 4, 0, 0]}
            maxBarSize={25}
          />
          <Bar
            dataKey="ativas"
            name="Ativas"
            fill="#c7d5e8"
            radius={[4, 4, 0, 0]}
            maxBarSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
