import React, { useState } from 'react';
import {
  Car,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Flag,
} from 'lucide-react';
import { Card } from '../common/Card';
import { TestDrive } from '../../types';

interface TestDrivesTabProps {
  testDrives: TestDrive[];
  onUpdateStatus: (id: string, status: TestDrive['status']) => void;
}

const STATUS_STYLES: Record<TestDrive['status'], string> = {
  Requested: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const TestDrivesTab: React.FC<TestDrivesTabProps> = ({ testDrives, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filtered = testDrives.filter((td) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      td.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      td.customerPhone.includes(searchTerm) ||
      td.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || td.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const requestedCount = testDrives.filter((td) => td.status === 'Requested').length;
  const confirmedCount = testDrives.filter((td) => td.status === 'Confirmed').length;
  const completedCount = testDrives.filter((td) => td.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-extrabold text-gray-900 dark:text-slate-100">Test Drive Bookings</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Bookings placed via "Pre-book a Test Drive" on the in-store Wi-Fi portal.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#122B52]/10 text-[#122B52] flex items-center justify-center shrink-0">
              <Car className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Bookings</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{testDrives.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Timer className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Awaiting Confirmation</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{requestedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Flag className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Confirmed</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{confirmedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Completed</p>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{completedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, phone, or model..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:border-[#122B52]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:border-[#122B52]"
          >
            <option value="All">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40">
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Vehicle</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Date &amp; Time</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Showroom</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Status</th>
                <th className="text-right p-3 font-semibold text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                    No test drive bookings yet. New Sales Floor bookings from the Wi-Fi portal will appear here automatically.
                  </td>
                </tr>
              )}
              {filtered.map((td) => (
                <tr key={td.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{td.customerName}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{td.customerPhone || '—'}</span>
                    </div>
                    {td.customerEmail && (
                      <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{td.customerEmail}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#122B52]/10 text-[#122B52] font-bold text-xs uppercase">
                      <Car className="w-3.5 h-3.5" />
                      <span>{td.vehicleModel}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-gray-900 dark:text-slate-100 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{td.preferredDate}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{td.timeSlot}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{td.storeLocation}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[td.status]}`}>
                      {td.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {td.status === 'Requested' && (
                        <button
                          onClick={() => onUpdateStatus(td.id, 'Confirmed')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {td.status === 'Confirmed' && (
                        <button
                          onClick={() => onUpdateStatus(td.id, 'Completed')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                      {(td.status === 'Requested' || td.status === 'Confirmed') && (
                        <button
                          onClick={() => onUpdateStatus(td.id, 'Cancelled')}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Cancel booking"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
