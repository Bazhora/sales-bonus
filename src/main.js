/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const decimalDiscount = discount / 100;
    const fullPrice = sale_price * quantity;
    return fullPrice * (1 - decimalDiscount);
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (profit <= 0) {
        return 0;
    }
    if (index === total - 1) {
        return 0;
    }
    if (index === 0) {
        return profit * 0.15;
    }
    return profit * 0.05;
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
        // Создаем переменную для поддержки обоих вариантов названий ключей в тестах
    const people = data?.sellers || data?.customers;

    // @TODO: Проверка входных данных
    if (!data || !people || !data.purchase_records || !data.products) {
        throw new Error("Переданные коллекции данных отсутствуют или неполные");
    }
    if (people.length === 0 || data.purchase_records.length === 0 || data.products.length === 0) {
        throw new Error("Массивы данных не должны быть пустыми");
    }
    // @TODO: Проверка наличия опций
    if (!options || !options.calculateRevenue || !options.calculateBonus) {
        throw new Error("В опциях должны быть переданы функции calculateRevenue и calculateBonus");
    }
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellersStats = people.map(seller => {

        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {} // Ключ объекта — артикул товара, значение — количество штук
        };
    });
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const productsMap = new Map();
    data.products.forEach(product => {
        productsMap.set(product.sku, product);
    });
    const sellersMap = new Map();
    sellersStats.forEach(stat => {
        sellersMap.set(stat.id, stat);
    });
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const sellerStat = sellersMap.get(record.seller_id);
    
        if (sellerStat) {
            record.items.forEach(item => {
            const productInfo = productsMap.get(item.sku);
        
            if (productInfo) {
                const itemRevenue = calculateRevenue(item, productInfo);
                const itemCost = productInfo.purchase_price * item.quantity;
                const itemProfit = itemRevenue - itemCost;
                sellerStat.revenue += itemRevenue;
                sellerStat.profit += itemProfit;
                sellerStat.sales_count += item.quantity;
                if (!sellerStat.products_sold[item.sku]) {
                    sellerStat.products_sold[item.sku] = 0;
                }
                sellerStat.products_sold[item.sku] += item.quantity;
            }
        });
        }
    });
    // @TODO: Сортировка продавцов по прибыли
    sellersStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    // @TODO: Подготовка итоговой коллекции с нужными полями
    const totalSellers = sellersStats.length;
    const finalResult = sellersStats.map((seller, index) => {
        const bonus = calculateBonus(index, totalSellers, seller);
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => {
                if (b.quantity !== a.quantity) {
                    return b.quantity - a.quantity;
                }
                if (a.sku > b.sku) {
                    return -1;
                }
                if (a.sku < b.sku) {
                    return 1;
                }
                return 0;
            })
            .slice(0, 10);


        return {
            seller_id: seller.id,
            name: seller.name,
            revenue: Number(seller.revenue.toFixed(2)),
            profit: Number(seller.profit.toFixed(2)),
            sales_count: seller.sales_count,
            top_products: topProducts,
            bonus: Number(bonus.toFixed(2))
            };
        });

  return finalResult;
}

