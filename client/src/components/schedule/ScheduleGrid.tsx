import React from 'react';
import { ScheduleGridItem, TimeSlot, Booking } from '../../types';
import { Badge } from '../common/Badge';
import { Plus, Info, Clock, Coffee, Lock } from 'lucide-react';

interface ScheduleGridProps {
  timeSlots: TimeSlot[];
  grid: ScheduleGridItem[];
  onSelectSlot: (labId: number, slotId: number) => void;
  onViewBooking: (booking: Booking) => void;
  isAdmin?: boolean;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  timeSlots,
  grid,
  onSelectSlot,
  onViewBooking,
  isAdmin = false,
}) => {
  if (!grid || grid.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No laboratories matched the selected filter criteria.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[140px] border-r border-slate-200">
                Period / Time
              </th>
              {grid.map(item => (
                <th
                  key={item.lab.id}
                  className="px-4 py-3.5 text-xs font-semibold text-slate-800 min-w-[190px] border-r border-slate-100 last:border-r-0"
                >
                  <div className="truncate font-bold text-slate-900" title={item.lab.lab_name}>
                    {item.lab.lab_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-normal">
                    <span className="font-semibold text-blue-600">{item.lab.department}</span>
                    <span>•</span>
                    <span>Cap: {item.lab.capacity}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timeSlots.map(slot => {
              const isBreak = !slot.bookable;

              return (
                <tr
                  key={slot.id}
                  className={isBreak ? 'bg-amber-50/40 border-y border-amber-200/60' : 'hover:bg-slate-50/50 transition-colors'}
                >
                  {/* Period Header Column */}
                  <td className={`sticky left-0 z-10 px-4 py-3 text-xs border-r border-slate-200 font-medium ${
                    isBreak ? 'bg-amber-100/60 text-amber-900 font-bold' : 'bg-white text-slate-900'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {isBreak ? (
                        <Coffee className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span className="font-bold text-slate-900">{slot.period}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                      {slot.start_time} – {slot.end_time}
                    </div>
                  </td>

                  {/* Grid Cells for Each Lab */}
                  {grid.map(item => {
                    const slotData = item.slots.find(s => s.slotId === slot.id);
                    if (!slotData) {
                      return <td key={item.lab.id} className="p-3 border-r border-slate-100" />;
                    }

                    // Break slot
                    if (isBreak) {
                      return (
                        <td
                          key={item.lab.id}
                          className="px-3 py-2.5 text-center border-r border-amber-100 text-[11px] font-semibold text-amber-800"
                        >
                          <span className="inline-flex items-center gap-1 opacity-75">
                            <Lock className="w-3 h-3 text-amber-700" /> Lunch Break (1:00–2:00 PM)
                          </span>
                        </td>
                      );
                    }

                    // Booked slot
                    if (slotData.status === 'BOOKED' && slotData.booking) {
                      const b = slotData.booking;
                      return (
                        <td
                          key={item.lab.id}
                          className="p-2.5 border-r border-slate-100 align-top"
                        >
                          <div
                            onClick={() => onViewBooking(b)}
                            className="group p-2.5 rounded-xl bg-rose-50/90 border border-rose-200/90 hover:bg-rose-100/90 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="booked" size="sm" label="Booked" />
                              <Info className="w-3.5 h-3.5 text-rose-500 opacity-60 group-hover:opacity-100 transition" />
                            </div>
                            <p className="text-xs font-bold text-rose-950 truncate" title={b.subject_name}>
                              {b.subject_name}
                            </p>
                            <p className="text-[11px] text-rose-700 truncate mt-0.5">
                              {b.faculty_name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-rose-600/80 mt-1 font-medium">
                              <span>{b.year_name}</span>
                              <span>•</span>
                              <span>{b.section_name}</span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Past slot
                    if (slotData.status === 'PAST' && !isAdmin) {
                      return (
                        <td
                          key={item.lab.id}
                          className="p-2.5 border-r border-slate-100 align-middle text-center"
                        >
                          <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 text-xs flex items-center justify-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>Past Slot</span>
                          </div>
                        </td>
                      );
                    }

                    // Available slot (or past slot accessible for admin retrospective booking)
                    return (
                      <td
                        key={item.lab.id}
                        className="p-2.5 border-r border-slate-100 align-middle"
                      >
                        <button
                          onClick={() => onSelectSlot(item.lab.id, slot.id)}
                          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/80 hover:border-emerald-500 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition" />
                          <span>Book Slot</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
