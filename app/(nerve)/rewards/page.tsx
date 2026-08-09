"use client"

import { useState } from "react"
import { Plus, Lock, Zap, MoreHorizontal, Pencil, Trash2, Archive, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { XPProgressBar, SectionHeader } from "@/components/nerve/ui"
import { useNerveStore } from "@/lib/nerve-store"
import { type Reward, type RewardStatus } from "@/lib/nerve-data"
import { cn } from "@/lib/utils"

const CATEGORIES = ["All", "Entertainment", "Food", "Rest", "Shopping", "Travel"]

function RewardModal({
  reward,
  userXp,
  onClose,
  onSave,
}: {
  reward?: Partial<Reward>
  userXp: number
  onClose: () => void
  onSave: (r: Reward) => void
}) {
  const [name, setName] = useState(reward?.name ?? "")
  const [emoji, setEmoji] = useState(reward?.emoji ?? "🎁")
  const [xpCost, setXpCost] = useState(reward?.xpCost ?? 500)
  const [description, setDescription] = useState(reward?.description ?? "")
  const [category, setCategory] = useState(reward?.category ?? "Entertainment")

  const EMOJI_OPTIONS = ["🍿","🍕","🎮","😴","🛒","✈️","🎁","🎯","📚","🍰","🎸","🏖️","🎬","💆","🚀"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#0F172A] mb-5">{reward?.id ? "Edit Reward" : "New Reward"}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Reward Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Movie Night"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all",
                    emoji === e ? "border-[#2563EB]/60 bg-[#2563EB]/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">XP Cost</label>
              <input
                type="number"
                value={xpCost}
                onChange={(e) => setXpCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]/50"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this reward feel like?"
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] outline-none focus:border-[#2563EB]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                id: reward?.id ?? String(Date.now()),
                name: name || "Untitled Reward",
                emoji,
                xpCost,
                description,
                category,
                status: userXp >= xpCost ? "available" : "locked",
                currentXp: userXp,
              })
            }
            className="flex-1 nerve-gradient-blue text-white border-0 rounded-xl font-semibold hover:opacity-90"
          >
            {reward?.id ? "Save Changes" : "Create Reward"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RewardsPage() {
  const { rewards, updateReward, deleteReward, userXp, redeemReward } = useNerveStore()
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [showModal, setShowModal] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | undefined>()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [redeemedId, setRedeemedId] = useState<string | null>(null)

  const filtered = rewards.filter(
    (r) => categoryFilter === "All" || r.category === categoryFilter
  )

  const handleSave = (r: Reward) => {
    updateReward(r)
    setShowModal(false)
    setEditingReward(undefined)
  }

  const handleDelete = (id: string) => {
    deleteReward(id)
    setMenuOpen(null)
  }

  const handleRedeem = (id: string) => {
    setRedeemedId(id)
    setTimeout(() => {
      redeemReward(id)
      setRedeemedId(null)
    }, 800)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with XP display */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Reward Store</h1>
          <p className="text-sm text-[#64748B] mt-1">Spend your XP. You&apos;ve earned it.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl px-5 py-3 text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xl font-bold text-[#0F172A]">{userXp.toLocaleString()}</span>
              <span className="text-sm text-[#64748B]">XP</span>
            </div>
            <XPProgressBar value={userXp} max={2000} className="w-32" />
          </div>
          <Button
            onClick={() => { setEditingReward(undefined); setShowModal(true) }}
            className="nerve-gradient-blue text-white border-0 gap-2 rounded-xl nerve-glow-blue hover:opacity-90 font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Reward
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
              categoryFilter === c
                ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20"
                : "text-[#64748B] hover:text-[#0F172A] bg-slate-50 border border-slate-200"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Rewards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((reward) => {
          const isAvailable = reward.status === "available"
          const isLocked = reward.status === "locked"
          const isRedeemed = reward.status === "redeemed"
          const isRedeeming = redeemedId === reward.id
          const progressPct = Math.min(100, ((reward.currentXp ?? userXp) / reward.xpCost) * 100)

          return (
            <div
              key={reward.id}
              className={cn(
                "bg-[#FFFFFF] border rounded-2xl p-5 relative overflow-hidden transition-all duration-200 group",
                isRedeemed
                  ? "border-slate-200 opacity-50"
                  : isLocked
                  ? "border-slate-200"
                  : "border-slate-200 card-hover"
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border",
                    isLocked ? "bg-slate-50 border-slate-200" : "bg-slate-50 border-slate-200"
                  )}
                >
                  {isLocked ? <Lock className="w-6 h-6 text-[#64748B]" /> : reward.emoji}
                </div>
                <div className="flex items-center gap-1">
                  {isRedeemed && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Redeemed
                    </div>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === reward.id ? null : reward.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen === reward.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-2xl py-1">
                        <button
                          onClick={() => { setEditingReward(reward); setShowModal(true); setMenuOpen(null) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#64748B]" /> Edit
                        </button>
                        <button
                          onClick={() => { updateReward({ ...reward, status: "redeemed" }); setMenuOpen(null) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0F172A] hover:bg-slate-100"
                        >
                          <Archive className="w-3.5 h-3.5 text-[#64748B]" /> Archive
                        </button>
                        <button
                          onClick={() => handleDelete(reward.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className={cn("text-base font-bold mb-1", isLocked ? "text-[#64748B]" : "text-[#0F172A]")}>
                {reward.name}
              </h3>
              {reward.description && (
                <p className="text-xs text-[#64748B] mb-4 leading-relaxed line-clamp-2">{reward.description}</p>
              )}

              {/* XP cost */}
              <div className="flex items-center gap-1.5 mb-3">
                <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-sm font-bold text-[#0F172A]">{reward.xpCost.toLocaleString()} XP</span>
                <span className="text-xs text-[#64748B] ml-auto">{reward.category}</span>
              </div>

              {/* Unlock progress */}
              {isLocked && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#64748B]">Unlock progress</span>
                    <span className="text-xs text-[#0F172A] font-semibold">{Math.round(progressPct)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full nerve-gradient-xp"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1.5">
                    Need {(reward.xpCost - (reward.currentXp ?? userXp)).toLocaleString()} more XP
                  </p>
                </div>
              )}

              {/* Redeem button */}
              {!isRedeemed && (
                <button
                  onClick={() => isAvailable && handleRedeem(reward.id)}
                  disabled={isLocked || isRedeeming}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    isAvailable && !isRedeeming
                      ? "nerve-gradient-blue text-white nerve-glow-blue hover:opacity-90"
                      : isRedeeming
                      ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                      : "bg-slate-50 text-[#64748B] border border-slate-200 cursor-not-allowed"
                  )}
                >
                  {isRedeeming ? (
                    <><CheckCircle2 className="w-4 h-4" /> Redeeming...</>
                  ) : isLocked ? (
                    <><Lock className="w-3.5 h-3.5" /> Locked</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> Redeem for {reward.xpCost} XP</>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {(showModal || editingReward) && (
        <RewardModal
          reward={editingReward}
          userXp={userXp}
          onClose={() => { setShowModal(false); setEditingReward(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
