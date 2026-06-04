class CartItemModel {
  final int id;
  final int productId;
  final int? variantId;
  final int quantity;
  final String productName;
  final String? brand;
  final String? primaryImage;
  final int pricePaise;
  final int subtotalPaise;
  final String sellerName;

  CartItemModel({
    required this.id,
    required this.productId,
    this.variantId,
    required this.quantity,
    required this.productName,
    this.brand,
    this.primaryImage,
    required this.pricePaise,
    required this.subtotalPaise,
    required this.sellerName,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      id: json['id'] as int? ?? 0,
      productId: json['product_id'] as int? ?? 0,
      variantId: json['variant_id'] as int?,
      quantity: json['quantity'] as int? ?? 1,
      productName: json['product_name'] as String? ?? 'Unknown Product',
      brand: json['brand'] as String?,
      primaryImage: json['primary_image'] as String?,
      pricePaise: json['price_paise'] as int? ?? 0,
      subtotalPaise: json['subtotal_paise'] as int? ?? 0,
      sellerName: json['seller_name'] as String? ?? 'Unknown Seller',
    );
  }
}

class CartResponseModel {
  final int totalPaise;
  final int subtotalPaise;
  final int shippingPaise;
  final int discountPaise;
  final int itemCount;
  final List<CartItemModel> items;

  CartResponseModel({
    required this.totalPaise,
    required this.subtotalPaise,
    required this.shippingPaise,
    required this.discountPaise,
    required this.itemCount,
    required this.items,
  });

  factory CartResponseModel.fromJson(Map<String, dynamic> json) {
    var list = json['items'] as List<dynamic>? ?? [];
    List<CartItemModel> itemsList = list.map((i) => CartItemModel.fromJson(i as Map<String, dynamic>)).toList();
    
    return CartResponseModel(
      totalPaise: json['total_paise'] as int? ?? 0,
      subtotalPaise: json['subtotal_paise'] as int? ?? 0,
      shippingPaise: json['shipping_paise'] as int? ?? 0,
      discountPaise: json['discount_paise'] as int? ?? 0,
      itemCount: json['item_count'] as int? ?? itemsList.length,
      items: itemsList,
    );
  }
}
