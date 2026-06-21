interface Props {
  sabaq: number | null;
  sabki: number | null;
  manzil: number | null;
}

function scoreLabel(s: number): string {
  if (s >= 90) return 'Mumtaz';
  if (s >= 75) return 'Jayyid Jiddan';
  if (s >= 60) return 'Jayyid';
  return 'Maqbul';
}

function scoreColor(s: number) {
  if (s >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' };
  if (s >= 75) return { bar: 'bg-teal-500',    text: 'text-teal-700',    badge: 'bg-teal-100 text-teal-700'    };
  if (s >= 60) return { bar: 'bg-blue-500',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700'    };
  return          { bar: 'bg-yellow-500',  text: 'text-yellow-700',  badge: 'bg-yellow-100 text-yellow-700'};
}

function ScoreBar({ label, desc, score }: { label: string; desc: string; score: number | null }) {
  if (score == null) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">Tiada Data</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-1">{desc}</p>
        <div className="h-2 bg-gray-100 rounded-full" />
      </div>
    );
  }
  const c = scoreColor(score);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{scoreLabel(score)}</span>
      </div>
      <p className="text-[10px] text-gray-400 mb-1">{desc}</p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${score}%` }} />
      </div>
      <p className={`text-xs font-bold mt-0.5 text-right ${c.text}`}>{score}%</p>
    </div>
  );
}

export function ScoreKomponen({ sabaq, sabki, manzil }: Props) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Skor Komponen Sabak–Sabki–Manzil</p>
      <div className="flex gap-4">
        <ScoreBar label="Sabak" desc="Hafalan baharu" score={sabaq} />
        <ScoreBar label="Sabki" desc="Ulang kaji semasa" score={sabki} />
        <ScoreBar label="Manzil" desc="Ulang kaji juzuk lama" score={manzil} />
      </div>
    </div>
  );
}
