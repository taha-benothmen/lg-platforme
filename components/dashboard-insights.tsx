"use client"

import { SectionCardsRadial } from "@/components/CardRevenueRadial"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ChartPoint, DashboardData, SousEtablissementData } from "@/lib/dashboard-data"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  Loader2, Building2, User, TrendingUp,
  CheckCircle2, Clock, XCircle, PauseCircle,
  ShoppingCart, BarChart3, Percent, Landmark,
  PackageCheck, Truck, FileSpreadsheet, FileDown, Trash2,
} from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]
export const transformTopProducts = (list: Array<{ name: string; value: number }>) =>
  list.map((p, i) => ({ category: p.name, sales: p.value, fill: COLORS[i % COLORS.length] }))

function AreaChartCard({
  data, dataKey, label, color, formatter,
}: {
  data: ChartPoint[]
  dataKey: "value" | "revenue"
  label: string
  color: string
  formatter?: (v: number) => string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Pas de données
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    shortDate: d.date.slice(0, 5),
  }))

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (formatter ? formatter(v) : String(v))}
              width={36}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelFormatter={(lbl) => `Date: ${lbl}`}
              formatter={(value: number) => [
                formatter ? formatter(value) : value,
                dataKey === "value" ? "Devis" : "CA (TND)",
              ]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
              dot={data.length <= 10 ? { r: 3, fill: color, strokeWidth: 0 } : false}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const StatCard = ({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; bg: string
}) => (
  <div className={`flex items-center gap-3 p-4 ${bg} border rounded-xl`}>
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg font-bold text-gray-900 truncate mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
)

const RateBadge = ({
  label, value, good, icon: Icon,
}: {
  label: string; value: number; good: boolean; icon: React.ElementType
}) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border ${good ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
      <Icon className={`h-4 w-4 shrink-0 ${good ? "text-green-600" : "text-red-500"}`} />
      <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
    </div>
    <span className={`text-lg font-bold shrink-0 ${good ? "text-green-600" : "text-red-500"}`}>
      {value.toFixed(1)}%
    </span>
  </div>
)

const RankingCard = ({
  rank, name, subtitle, revenue, bgColor, badgeColor,
}: {
  rank: number; name: string; subtitle: string; revenue: string; bgColor: string; badgeColor: string
}) => (
  <div className={`flex items-center justify-between p-3 ${bgColor} rounded-lg border`}>
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} text-white text-xs font-bold shrink-0`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">{name}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    <p className={`font-semibold text-sm ml-3 shrink-0 ${badgeColor.replace("bg-", "text-")}`}>{revenue}</p>
  </div>
)

const PeriodTable = ({
  title, rows, keyLabel,
}: {
  title: string
  rows: Array<{ label: string; count: number; revenue: number }>
  keyLabel: string
}) => (
  <div>
    <p className="text-xs font-semibold text-gray-600 mb-3">{title}</p>
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm min-w-[260px]">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left px-3 py-2 font-semibold">{keyLabel}</th>
            <th className="text-right px-3 py-2 font-semibold">Commandes</th>
            <th className="text-right px-3 py-2 font-semibold">CA (TND)</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={3} className="text-center py-8 text-gray-400 text-sm">Pas de données</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 font-medium text-gray-800">{r.label}</td>
              <td className="px-3 py-2 text-right text-gray-600">{r.count}</td>
              <td className="px-3 py-2 text-right font-semibold text-gray-800">{r.revenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const SectionTitle = ({ icon: Icon, color, title }: { icon: React.ElementType; color: string; title: string }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon className={`h-4 w-4 ${color}`} />
    <h2 className="text-base font-bold text-gray-800">{title}</h2>
    <div className="flex-1 h-px bg-gray-100 ml-2" />
  </div>
)

export interface DashboardInsightsProps {
  data: DashboardData | null
  error: string | null
  range: { startDate: string; endDate: string }
  setRange: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string }>>
  exportingDash: boolean
  exportingDevis: boolean
  onExportDashboard: () => void
  onExportDevis: () => void
  showPurge?: boolean
  purging?: boolean
  purgeInfo?: string | null
  onPurge?: () => void
  headerSubtitle: string
  sousEtablissements?: SousEtablissementData[]
  selectedSousEtablissement?: string
  onSelectedSousEtablissementChange?: (value: string) => void
}

export function DashboardInsights({
  data,
  error,
  range,
  setRange,
  exportingDash,
  exportingDevis,
  onExportDashboard,
  onExportDevis,
  showPurge,
  purging,
  purgeInfo,
  onPurge,
  headerSubtitle,
  sousEtablissements = [],
  selectedSousEtablissement = "",
  onSelectedSousEtablissementChange,
}: DashboardInsightsProps) {
  const ov = data?.orderVolume
  const rbs = data?.revenueByStatus
  const weeklyRows = (data?.chart.weekly ?? []).map((w) => ({ label: `Sem. ${w.week}`, count: w.count, revenue: w.revenue }))
  const monthlyRows = (data?.chart.monthly ?? []).map((m) => ({ label: m.month, count: m.count, revenue: m.revenue }))
  const chartPoints = data?.chart.devis ?? []

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="px-4 sm:px-6 py-5 max-w-[1400px] mx-auto space-y-5">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="font-semibold text-red-800 text-sm">Erreur</p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
          </div>
        )}

        {purgeInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="font-semibold text-amber-900 text-sm">Maintenance</p>
            <p className="text-amber-800 text-xs mt-0.5">{purgeInfo}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mt-0.5">{headerSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex items-end gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">De</label>
                <input
                  type="date"
                  value={range.startDate}
                  onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
                  className="text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                />
              </div>
              <span className="text-gray-300 mb-0.5">→</span>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">À</label>
                <input
                  type="date"
                  value={range.endDate}
                  onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
                  className="text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={onExportDashboard}
              disabled={exportingDash || !data}
              size="sm"
              className="h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 rounded-xl"
            >
              {exportingDash ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              {exportingDash ? "Export..." : "Dashboard CSV"}
            </Button>

            <Button
              onClick={onExportDevis}
              disabled={exportingDevis || !data}
              size="sm"
              className="h-10 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 rounded-xl"
            >
              {exportingDevis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              {exportingDevis ? "Export..." : "Liste Devis CSV"}
            </Button>

            {showPurge && onPurge && (
              <Button
                onClick={onPurge}
                disabled={purging}
                size="sm"
                className="h-10 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 rounded-xl"
              >
                {purging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {purging ? "Suppression..." : "Purger devis + produits"}
              </Button>
            )}
          </div>
        </div>

        {data && (
          <SectionCardsRadial
            cards={[
              { title: "Produits", value: data.stats.products },
              { title: "Devis", value: data.stats.devis },
              { title: "Établissements", value: data.stats.etablissements },
              { title: "Chiffre d'affaires", value: data.stats.revenue, isRevenue: true },
            ]}
          />
        )}

        {data && rbs && (
          <section className="bg-white rounded-2xl border p-5 shadow-sm space-y-5">
            <SectionTitle icon={TrendingUp} color="text-blue-600" title="Suivi du Chiffre d'Affaires (CA)" />

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard label="Approuvés" value={rbs.approved} icon={CheckCircle2} color="bg-green-500" bg="bg-green-50 border-green-100" />
              <StatCard label="En attente" value={rbs.pending} icon={Clock} color="bg-amber-500" bg="bg-amber-50 border-amber-100" />
              <StatCard label="Suspendus" value={rbs.suspended} icon={PauseCircle} color="bg-orange-500" bg="bg-orange-50 border-orange-100" />
              <StatCard label="Rejetés" value={rbs.rejected} icon={XCircle} color="bg-red-500" bg="bg-red-50 border-red-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="CA Livrés (admin)" value={rbs.delivered} icon={PackageCheck} color="bg-teal-600" bg="bg-teal-50 border-teal-100" />
              <StatCard
                label="Panier moyen"
                value={data.avgBasket}
                sub={`sur ${ov?.approved ?? 0} commandes approuvées`}
                icon={ShoppingCart}
                color="bg-blue-600"
                bg="bg-blue-50 border-blue-100"
              />
              <StatCard
                label="CA Total période"
                value={data.stats.revenue}
                sub="toutes commandes confondues"
                icon={BarChart3}
                color="bg-indigo-600"
                bg="bg-indigo-50 border-indigo-100"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 bg-gray-50 h-52">
                <AreaChartCard
                  data={chartPoints}
                  dataKey="value"
                  label="Évolution quotidienne des devis"
                  color="#3b82f6"
                />
              </div>
              <div className="border rounded-xl p-4 bg-gray-50 h-52">
                <AreaChartCard
                  data={chartPoints}
                  dataKey="revenue"
                  label="CA quotidien (TND)"
                  color="#10b981"
                  formatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PeriodTable title="TO Hebdomadaire" rows={weeklyRows} keyLabel="Semaine" />
              <PeriodTable title="TO Mensuel" rows={monthlyRows} keyLabel="Mois" />
            </div>
          </section>
        )}

        {data && ov && (
          <section className="bg-white rounded-2xl border p-5 shadow-sm space-y-5">
            <SectionTitle icon={BarChart3} color="text-indigo-600" title="Suivi du Volume de Commandes" />

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Statut responsable</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                <StatCard label="Total" value={ov.total} icon={ShoppingCart} color="bg-blue-600" bg="bg-blue-50 border-blue-100" />
                <StatCard label="Approuvés" value={ov.approved} icon={CheckCircle2} color="bg-green-600" bg="bg-green-50 border-green-100" />
                <StatCard label="En attente" value={ov.pending} icon={Clock} color="bg-amber-500" bg="bg-amber-50 border-amber-100" />
                <StatCard label="Suspendus" value={ov.suspended} icon={PauseCircle} color="bg-orange-500" bg="bg-orange-50 border-orange-100" />
                <StatCard label="Rejetés" value={ov.rejected} icon={XCircle} color="bg-red-500" bg="bg-red-50 border-red-100" />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline admin</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="En facturation" value={ov.adminInvoicing} icon={BarChart3} color="bg-sky-500" bg="bg-sky-50 border-sky-100" />
                <StatCard label="En livraison" value={ov.adminDelivering} icon={Truck} color="bg-violet-500" bg="bg-violet-50 border-violet-100" />
                <StatCard label="Livrés" value={ov.adminDelivered} icon={PackageCheck} color="bg-teal-600" bg="bg-teal-50 border-teal-100" />
                <StatCard label="Rejetés (admin)" value={ov.adminRejected} icon={XCircle} color="bg-rose-500" bg="bg-rose-50 border-rose-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Cmd / jour (moy.)"
                value={ov.avgPerDay}
                sub="sur la période sélectionnée"
                icon={BarChart3}
                color="bg-indigo-600"
                bg="bg-indigo-50 border-indigo-100"
              />
              <RateBadge label="Taux d'annulation" value={ov.cancellationRate} good={ov.cancellationRate < 10} icon={Percent} />
              <RateBadge label="Taux d'acceptation bancaire" value={ov.bankAcceptanceRate} good={ov.bankAcceptanceRate >= 50} icon={Landmark} />
            </div>
          </section>
        )}

        {data && (
          <section className="bg-white rounded-2xl border p-5 shadow-sm">
            <SectionTitle icon={Building2} color="text-blue-600" title="Top Agences" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { title: "Par nombre de devis", list: data.topAgenciesByDevis, bg: "bg-blue-50 border-blue-100", badge: "bg-blue-600" },
                { title: "Par chiffre d'affaires", list: data.topAgenciesByRevenue, bg: "bg-amber-50 border-amber-100", badge: "bg-amber-600" },
              ].map(({ title, list, bg, badge }) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-gray-500 mb-3">{title}</p>
                  <div className="space-y-2">
                    {list?.length
                      ? list.map((a, i) => (
                          <RankingCard
                            key={a.id}
                            rank={i + 1}
                            name={a.name}
                            subtitle={`${a.devisCount} devis`}
                            revenue={a.revenue}
                            bgColor={bg}
                            badgeColor={badge}
                          />
                        ))
                      : <p className="text-center py-6 text-gray-400 text-sm">Pas de données</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data && (
          <section className="bg-white rounded-2xl border p-5 shadow-sm">
            <SectionTitle icon={User} color="text-green-600" title="Top Responsables" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { title: "Par nombre de devis", list: data.topResponsablesByDevis, bg: "bg-green-50 border-green-100", badge: "bg-green-600" },
                { title: "Par chiffre d'affaires", list: data.topResponsablesByRevenue, bg: "bg-emerald-50 border-emerald-100", badge: "bg-emerald-600" },
              ].map(({ title, list, bg, badge }) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-gray-500 mb-3">{title}</p>
                  <div className="space-y-2">
                    {list?.length
                      ? list.map((r, i) => (
                          <RankingCard
                            key={r.id}
                            rank={i + 1}
                            name={`${r.firstName} ${r.lastName}`}
                            subtitle={`${r.devisCount} devis`}
                            revenue={r.revenue}
                            bgColor={bg}
                            badgeColor={badge}
                          />
                        ))
                      : <p className="text-center py-6 text-gray-400 text-sm">Pas de données</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sousEtablissements && sousEtablissements.length > 0 && (
          <section className="bg-white rounded-2xl border p-5 shadow-sm">
            <SectionTitle icon={Building2} color="text-purple-600" title="Détail des Sous-Établissements" />
            
            {/* Selector */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                Sélectionner un sous-établissement
              </label>
              <Select value={selectedSousEtablissement} onValueChange={onSelectedSousEtablissementChange}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choisir un sous-établissement..." />
                </SelectTrigger>
                <SelectContent>
                  {sousEtablissements.map((sousEtab) => (
                    <SelectItem key={sousEtab.id} value={sousEtab.id}>
                      {sousEtab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected sous-établissement details */}
            {selectedSousEtablissement && (() => {
              const selectedSousEtab = sousEtablissements.find(s => s.id === selectedSousEtablissement)
              if (!selectedSousEtab) return null
              
              return (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{selectedSousEtab.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="h-4 w-4" />
                      <span>ID: {selectedSousEtab.id}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <StatCard 
                      label="Devis" 
                      value={selectedSousEtab.stats.devis} 
                      icon={ShoppingCart} 
                      color="bg-blue-600" 
                      bg="bg-blue-50 border-blue-100" 
                    />
                    <StatCard 
                      label="CA Total" 
                      value={selectedSousEtab.stats.revenue} 
                      icon={BarChart3} 
                      color="bg-green-600" 
                      bg="bg-green-50 border-green-100" 
                    />
                    <StatCard 
                      label="Approuvés" 
                      value={selectedSousEtab.orderVolume.approved} 
                      icon={CheckCircle2} 
                      color="bg-emerald-600" 
                      bg="bg-emerald-50 border-emerald-100" 
                    />
                    <StatCard 
                      label="Panier moyen" 
                      value={selectedSousEtab.avgBasket} 
                      icon={ShoppingCart} 
                      color="bg-purple-600" 
                      bg="bg-purple-50 border-purple-100" 
                    />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard 
                      label="En attente" 
                      value={selectedSousEtab.orderVolume.pending} 
                      icon={Clock} 
                      color="bg-amber-500" 
                      bg="bg-amber-50 border-amber-100" 
                    />
                    <StatCard 
                      label="Suspendus" 
                      value={selectedSousEtab.orderVolume.suspended} 
                      icon={PauseCircle} 
                      color="bg-orange-500" 
                      bg="bg-orange-50 border-orange-100" 
                    />
                    <StatCard 
                      label="Rejetés" 
                      value={selectedSousEtab.orderVolume.rejected} 
                      icon={XCircle} 
                      color="bg-red-500" 
                      bg="bg-red-50 border-red-100" 
                    />
                    <StatCard 
                      label="CA Approuvés" 
                      value={selectedSousEtab.revenueByStatus.approved} 
                      icon={TrendingUp} 
                      color="bg-teal-600" 
                      bg="bg-teal-50 border-teal-100" 
                    />
                  </div>
                </div>
              )
            })()}
          </section>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
