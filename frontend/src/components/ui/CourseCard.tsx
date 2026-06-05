import React from 'react';

import { toAbsoluteApiUrl } from '../../config/api';

interface CourseCardProps {
    title: string;
    instructor: string;
    price: string | number;
    image?: string;
    tag?: string;
    rating?: string | number;
}

export default function CourseCard({ title, instructor, price, image }: CourseCardProps) {
    const imageUrl = toAbsoluteApiUrl(image);

    return (
        <div className="group cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:shadow-md">
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : null}
                {!imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 transition-transform duration-500 group-hover:scale-105" />
                )}
            </div>
            <div className="p-4">
                <h3 className="mb-1 line-clamp-1 text-[15px] font-bold tracking-tight text-slate-800">{title}</h3>
                <p className="mb-3 text-[11px] text-slate-500">{instructor}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-bold text-slate-800">{price}</span>
                    <button className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700">Xem thêm</button>
                </div>
            </div>
        </div>
    );
}
