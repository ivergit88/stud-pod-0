import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CheckCircle2, ShoppingBag, Star, Trophy } from 'lucide-react';

export const Store: React.FC = () => {
  const { user } = useAuth();
  const { products, purchases, rewardWinners, buyProduct } = useData();

  if (!user || user.role !== 'student') {
    return <div>Доступ запрещен</div>;
  }

  const handleBuy = async (productId: string, price: number) => {
    try {
      await buyProduct(productId, price);
      alert('Покупка успешно совершена!');
    } catch (error) {
      alert('Ошибка при покупке. Возможно, недостаточно баллов.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Магазин поощрений</h1>
          <p className="mt-2 text-gray-600">Обменивайте заработанные баллы на сувенирную продукцию и брендированную одежду</p>
        </div>
        <div className="bg-blue-600 px-4 py-2 rounded-xl font-bold flex items-center text-white shadow-sm">
          <Star className="w-5 h-5 mr-2 fill-current" />
          <span>{user.points ?? 0} баллов</span>
        </div>
      </div>

      {rewardWinners.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
          {rewardWinners.map((winner) => (
            <div key={`${winner.productId}-${winner.studentName}`} className="grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] md:p-8">
              <div>
                <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                  <Trophy className="mr-2 h-4 w-4" />
                  Итоговая награда пилота
                </div>
                <h2 className="mt-4 text-2xl font-extrabold text-gray-950 sm:text-3xl">{winner.studentName} получил мерч</h2>
                <p className="mt-3 max-w-2xl leading-7 text-gray-700">
                  Самый активный участник накопил достаточно баллов и обменял {winner.price.toLocaleString('ru-RU')} баллов на «{winner.productTitle}».
                </p>
                <div className="mt-4 inline-flex items-center font-semibold text-emerald-700">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Награда выдана {new Date(winner.awardedAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              {winner.productImageUrl && (
                <img src={winner.productImageUrl} alt={winner.productTitle} className="h-64 w-full rounded-2xl bg-white object-contain p-3 shadow-sm" />
              )}
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map(product => {
            const winner = rewardWinners.find((item) => item.productId === product.id);
            const currentPurchase = purchases.find((item) => item.productId === product.id && item.studentId === user.id);

            return (
            <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="h-56 bg-gray-100 relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain bg-white p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  {product.price.toLocaleString('ru-RU')} баллов
                </div>
                {winner && (
                  <div className="absolute bottom-3 left-3 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Выдано победителю
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="a11y-category-value text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{product.category}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">{product.description}</p>
                
                <button
                  onClick={() => handleBuy(product.id, product.price)}
                  disabled={Boolean(winner) || Boolean(currentPurchase) || user.points < product.price || product.stock <= 0}
                  className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                    !winner && !currentPurchase && user.points >= product.price && product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentPurchase
                    ? currentPurchase.status === 'fulfilled' ? 'Получено' : 'Зарезервировано'
                    : winner
                      ? `Получил ${winner.studentName}`
                      : product.stock <= 0 ? 'Нет в наличии' : 'Купить'}
                </button>
              </div>
            </div>
          );})
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">В магазине пока нет товаров.</p>
          </div>
        )}
      </div>
    </div>
  );
};
