import React, { useState } from 'react';
import { X, Car, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { CustomerInfo } from '../types';
import { BRANDS } from '../data/mockStoreData';

interface TestDriveModalProps {
  customer: CustomerInfo | null;
  onClose: () => void;
}

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];

export const TestDriveModal: React.FC<TestDriveModalProps> = ({ customer, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<string>(BRANDS[0]?.name || '');
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0]);
  const [submitted, setSubmitted] = useState(false);

  if (!customer) return null;

  const carModels = BRANDS.filter((b) => b.id !== 'true-value-class');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        type: 'TEST_DRIVE_BOOKED',
        payload: {
          customerName: customer.fullName,
          customerPhone: customer.phone,
          model: selectedModel,
          slot: selectedSlot,
        },
        timestamp: Date.now(),
      };
      localStorage.setItem('marutisuzuki_wifi_telemetry_event', JSON.stringify(payload));
      new BroadcastChannel('marutisuzuki_wifi_channel').postMessage(payload);
    } catch (e) {}
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#ffffff] border border-[#e5dec9] shadow-2xl rounded-2xl overflow-hidden my-auto">
        <div className="h-1.5 bg-[#122B52] w-full" />

        <div className="p-4 sm:p-5 border-b border-[#f0ebd9] flex items-center justify-between bg-[#faf8f5]">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#122B52]" />
            <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              PRE-BOOK A TEST DRIVE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#eae4d5] text-[#1a1a1a] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a1a1a]">Test Drive Requested!</h3>
            <p className="text-xs text-[#666052] max-w-xs mx-auto leading-relaxed">
              We've noted your interest in the <strong>{selectedModel}</strong> at <strong>{selectedSlot}</strong>. A product specialist will meet you at the Test Drive Booking Counter on the Sales Floor to confirm.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#122B52] hover:bg-[#0B2038] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
            >
              Back to Showroom
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <p className="text-xs text-[#555045] leading-relaxed">
              Reserve a guided test drive with one of our product specialists. Pick a model and a time slot below.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#3a352c] uppercase tracking-wider mb-1.5">
                Select a Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {carModels.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedModel(m.name)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors cursor-pointer text-left ${
                      selectedModel === m.name
                        ? 'bg-[#122B52] text-white border-[#122B52]'
                        : 'bg-[#faf8f5] text-[#3a352c] border-[#e5dec9] hover:border-[#122B52]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a352c] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#122B52]" />
                Preferred Time Slot — Today
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      selectedSlot === slot
                        ? 'bg-[#122B52] text-white border-[#122B52]'
                        : 'bg-[#faf8f5] text-[#3a352c] border-[#e5dec9] hover:border-[#122B52]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#faf8f3] border border-[#e8e2d5] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#555045]">
              <Calendar className="w-4 h-4 text-[#122B52] shrink-0" />
              <span>
                Booking under: <strong className="text-[#1a1a1a]">{customer.fullName}</strong> • {customer.phone}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#122B52] hover:bg-[#0B2038] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4" />
              <span>Confirm Test Drive Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
