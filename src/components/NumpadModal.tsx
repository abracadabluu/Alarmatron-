import React, { useState } from 'react';
import { Delete, X, Check } from 'lucide-react';

interface NumpadModalProps {
  isOpen: boolean;
  title: string;
  initialValue: number;
  unit?: string;
  min?: number;
  max?: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
}

export const NumpadModal: React.FC<NumpadModalProps> = ({
  isOpen,
  title,
  initialValue,
  unit = 'min',
  min = 1,
  max = 60,
  onConfirm,
  onClose,
}) => {
  const [valString, setValString] = useState<string>(initialValue.toString());

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (valString.length >= 3) return;
    if (valString === '0') {
      setValString(digit);
    } else {
      setValString((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setValString((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleClear = () => {
    setValString('');
  };

  const handleSave = () => {
    let parsed = parseInt(valString, 10);
    if (isNaN(parsed)) parsed = min;
    if (parsed < min) parsed = min;
    if (parsed > max) parsed = max;
    onConfirm(parsed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#202122]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xs bg-white border border-[#a2a9b1] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#f8f9fa] border-b border-[#a2a9b1] px-4 py-2.5 flex items-center justify-between">
          <span className="font-wiki-serif font-bold text-sm text-[#202122]">
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-[#54595d] hover:text-[#202122] rounded-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-white border-b border-[#c8ccd1] text-center">
          <div className="text-3xl font-bold font-wiki-serif text-[#202122] tabular-nums min-h-[40px] flex items-center justify-center gap-1">
            <span>{valString || '0'}</span>
            <span className="text-sm font-sans font-normal text-[#54595d]">{unit}</span>
          </div>
          <div className="text-[11px] text-[#72777d] mt-1">
            Min {min} · Max {max} {unit}
          </div>
        </div>

        {/* Numpad Keys */}
        <div className="p-3 bg-[#f8f9fa] grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-lg font-bold font-wiki-serif text-[#202122] select-none transition-colors"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-xs font-semibold text-[#54595d] select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-lg font-bold font-wiki-serif text-[#202122] select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs flex items-center justify-center text-[#54595d] select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-[#eaecf0] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#54595d] hover:bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#3366cc] hover:bg-[#2a4b8d] rounded-xs flex items-center gap-1 shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            Set
          </button>
        </div>
      </div>
    </div>
  );
};
