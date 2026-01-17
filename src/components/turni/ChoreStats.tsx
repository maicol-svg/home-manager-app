"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Medal, TrendingUp } from "lucide-react";
import { type ChoreStats as ChoreStatsType } from "@/app/actions/chores";

interface ChoreStatsProps {
  stats: ChoreStatsType[];
  currentUserId: string;
}

const rankConfig = [
  { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200" },
  { icon: Medal, color: "text-orange-400", bg: "bg-orange-50", border: "border-orange-200" },
];

export default function ChoreStats({ stats, currentUserId }: ChoreStatsProps) {
  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna statistica</h3>
        <p className="text-gray-500 text-sm">
          Completa dei turni per guadagnare punti e salire in classifica!
        </p>
      </div>
    );
  }

  const maxPoints = Math.max(...stats.map((s) => s.total_points), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Classifica punti</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">Questo mese</p>
      </div>

      <div className="divide-y divide-gray-100">
        {stats.map((stat, index) => {
          const rank = rankConfig[index] || {
            icon: Star,
            color: "text-gray-400",
            bg: "bg-white",
            border: "border-transparent",
          };
          const RankIcon = rank.icon;
          const isCurrentUser = stat.user_id === currentUserId;
          const progressPercent = (stat.total_points / maxPoints) * 100;

          return (
            <motion.div
              key={stat.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`px-6 py-4 ${isCurrentUser ? "bg-primary-50" : ""}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${rank.bg} ${rank.border}`}
                >
                  {index < 3 ? (
                    <RankIcon className={`w-5 h-5 ${rank.color}`} />
                  ) : (
                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium truncate ${
                        isCurrentUser ? "text-primary-700" : "text-gray-900"
                      }`}
                    >
                      {stat.user_name}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        Tu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          index === 0
                            ? "bg-amber-400"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-400"
                            : "bg-primary-400"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {stat.completed_count} {stat.completed_count === 1 ? "turno" : "turni"}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-lg font-bold">{stat.total_points}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
