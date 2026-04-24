export default function CourseCard({ title, instructor, price, image }) {
    // Xây dựng URL ảnh đầy đủ
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        // Nếu là đường dẫn tương đối, thêm base URL
        if (imageUrl.startsWith('/')) {
            return `http://localhost:3000${imageUrl}`;
        }
        return imageUrl;
    };

    const imageUrl = getImageUrl(image);

    return (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-sm transition-shadow group cursor-pointer">
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {/* Hiển thị hình ảnh nếu có */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : null}
                {/* Gradient overlay chỉ hiển thị khi không có ảnh hoặc ảnh lỗi */}
                {!imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 group-hover:scale-105 transition-transform duration-500" />
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-[15px] tracking-tight mb-1 line-clamp-1">{title}</h3>
                <p className="text-[11px] text-gray-500 mb-3">{instructor}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="font-bold text-sm">{price}</span>
                    <button className="text-[11px] font-medium text-[#0071E3] hover:underline">Xem thêm</button>
                </div>
            </div>
        </div>
    );
}