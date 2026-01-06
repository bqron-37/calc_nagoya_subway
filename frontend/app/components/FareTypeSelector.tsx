import { User, GraduationCap, Accessibility } from 'lucide-react';
import { FareType } from '../types';
import { clsx } from 'clsx';

type Props = {
    fareTypes: FareType[];
    selectedType: string;
    onSelect: (id: string) => void;
};

export default function FareTypeSelector({ fareTypes, selectedType, onSelect }: Props) {
    // アイコンのマッピング
    const getIcon = (id: string) => {
        if (id.includes('university') || id.includes('high') || id.includes('elementary')) return <GraduationCap size={18} />;
        if (id.includes('disability')) return <Accessibility size={18} />;
        return <User size={18} />;
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">
                定期券の種類
            </label>
            <div className="relative">
                <select
                    value={selectedType}
                    onChange={(e) => onSelect(e.target.value)}
                    className={clsx(
                        "w-full p-3 pl-10 pr-10 appearance-none rounded-xl border border-gray-200 bg-white font-medium text-gray-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        "transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                    )}
                >
                    {fareTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                            {type.label}
                        </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {getIcon(selectedType)}
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
