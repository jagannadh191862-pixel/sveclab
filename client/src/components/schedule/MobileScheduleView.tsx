import React, { useState } from 'react';
import { ScheduleGridItem, TimeSlot, Booking, Lab } from '../../types';
import { Badge } from '../common/Badge';
import { Clock, Plus, Info, Coffee, Building2, Users } from 'lucide-react';

interface MobileScheduleViewProps {
  timeSlots: TimeSlot[];
  grid: ScheduleGridItem[];
  labs: Lab[];
  onSelectSlot: (labId: number, slotId: number) => void;
  onViewBooking: (booking: Booking) => void;
  isAdmin?: boolean;
}

export const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  timeSlots,
  grid,
  labs,
  onSelectSlot,
  onViewBooking,
  isAdmin = false,
}) => {
  const [selectedLabId, setSelectedLabId] = useState<number>(labs[0]?.id || 0);

  const currentLabItem = grid.find(g => g.lab.id === selectedLabId) || grid[0];
  const currentLab = currentLabItem?.lab;

  if (!currentLabItem || !currentLab) {
    return (
      <div className="p-6 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No laboratories available for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {/* Lab Selector Pill / Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Laboratory
        </label>
        <select
          value={selectedLabId || currentLab.id}
          onChange={e => setSelectedLabId(Number(e.target.value))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          {labs.map(l => (
            <option key={l.id} value={l.id}>
              {l.lab_name} ({l.department} - Cap: {l.capacity})
            </option>
          ))}
        </select>

        {/* Selected Lab Meta Badge Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{currentLab.building_block}</span>
            {currentLab.room_number && <span>({currentLab.room_number})</span>}
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Capacity: {currentLab.capacity}</span>
          </div>
        </div>
      </div>

      {/* Daily Periods List for Selected Laboratory */}
      <div className="space-y-2.5">
        {timeSlots.map(slot => {
          const slotData = currentLabItem.slots.find(s => s.slotId === slot.id);
          const isBreak = !slot.bookable;

          if (isBreak) {
            return (
              <div
                key={slot.id}
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  <span>{slot.period}: Lunch Break</span>
                </div>
                <span className="text-amber-700 font-medium">{slot.start_time} – {slot.end_time}</span>
              </div>
            );
          }

          if (slotData?.status === 'BOOKED' && slotData.booking) {
            const b = slotData.booking;
            return (
              <div
                key={slot.id}
                onClick={() => onViewBooking(b)}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 cursor-pointer shadow-2xs active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-xs">
                      {slot.period}
                    </span>
                    <span className="text-xs text-rose-800 font-medium">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </div>
                  <Badge variant="booked" size="sm" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-rose-950 leading-snug">{b.subject_name}</h4>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">Faculty: {b.faculty_name}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 text-xs text-rose-600 font-medium">
                  <span>{b.year_name} • {b.section_name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 underline">
                    <Info className="w-3 h-3" /> View Details
                  </span>
                </div>
              </div>
            );
          }

          if (slotData?.status === 'PAST' && !isAdmin) {
            return (
              <div
                key={slot.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600 font-bold text-xs">
                    {slot.period}
                  </span>
                  <span>{slot.start_time} – {slot.end_time}</span>
                </div>
                <span className="italic font-medium">Past Slot</span>
              </div>
            );
          }

          // Available
          return (
            <div
              key={slot.id}
              className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {slot.period}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {slot.start_time} – {slot.end_time}
                  </span>
                </div>
                <div className="mt-1">
                  <Badge variant="available" size="sm" />
                </div>
              </div>

              <button
                onClick={() => onSelectSlot(currentLab.id, slot.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Now</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
