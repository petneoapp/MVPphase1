class OrderListResponse {
  final List<OrderSummaryModel> orders;
  final int total;
  final int page;
  final int perPage;
  final int pages;

  OrderListResponse({
    required this.orders,
    required this.total,
    required this.page,
    required this.perPage,
    required this.pages,
  });

  factory OrderListResponse.fromJson(Map<String, dynamic> json) {
    var list = json['orders'] as List<dynamic>? ?? [];
    List<OrderSummaryModel> ordersList = list.map((i) => OrderSummaryModel.fromJson(i)).toList();
    
    return OrderListResponse(
      orders: ordersList,
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      perPage: json['per_page'] as int? ?? 10,
      pages: json['pages'] as int? ?? 1,
    );
  }
}

class OrderSummaryModel {
  final int id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double totalRupees;
  final int itemsCount;
  final List<OrderItemSummaryModel> itemsSummary;
  final String? createdAt;

  OrderSummaryModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.totalRupees,
    required this.itemsCount,
    required this.itemsSummary,
    this.createdAt,
  });

  factory OrderSummaryModel.fromJson(Map<String, dynamic> json) {
    var list = json['items_summary'] as List<dynamic>? ?? [];
    List<OrderItemSummaryModel> itemsList = list.map((i) => OrderItemSummaryModel.fromJson(i)).toList();

    return OrderSummaryModel(
      id: json['id'] as int? ?? 0,
      orderNumber: json['order_number'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['payment_status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String? ?? '',
      totalRupees: (json['total_rupees'] as num?)?.toDouble() ?? 0.0,
      itemsCount: json['items_count'] as int? ?? 0,
      itemsSummary: itemsList,
      createdAt: json['created_at'] as String?,
    );
  }
}

class OrderItemSummaryModel {
  final int productId;
  final String productName;
  final String? variantName;
  final String? imageUrl;
  final int quantity;
  final double unitPriceRupees;
  final double totalRupees;

  OrderItemSummaryModel({
    required this.productId,
    required this.productName,
    this.variantName,
    this.imageUrl,
    required this.quantity,
    required this.unitPriceRupees,
    required this.totalRupees,
  });

  factory OrderItemSummaryModel.fromJson(Map<String, dynamic> json) {
    return OrderItemSummaryModel(
      productId: json['product_id'] as int? ?? 0,
      productName: json['product_name'] as String? ?? '',
      variantName: json['variant_name'] as String?,
      imageUrl: json['image_url'] as String?,
      quantity: json['quantity'] as int? ?? 0,
      unitPriceRupees: (json['unit_price_rupees'] as num?)?.toDouble() ?? 0.0,
      totalRupees: (json['total_rupees'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class OrderDetailsModel {
  final int id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final String? createdAt;
  final String? paidAt;
  final String? deliveredAt;
  final String? cancelledAt;
  final String? cancellationReason;
  final String? notes;
  
  final OrderDeliveryAddressModel deliveryAddress;
  final List<OrderDetailItemModel> items;
  final OrderFinancialModel financial;
  final List<OrderTimelineEventModel> timeline;

  OrderDetailsModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    this.createdAt,
    this.paidAt,
    this.deliveredAt,
    this.cancelledAt,
    this.cancellationReason,
    this.notes,
    required this.deliveryAddress,
    required this.items,
    required this.financial,
    required this.timeline,
  });

  factory OrderDetailsModel.fromJson(Map<String, dynamic> json) {
    var itemsListJson = json['items'] as List<dynamic>? ?? [];
    List<OrderDetailItemModel> itemsList = itemsListJson.map((i) => OrderDetailItemModel.fromJson(i)).toList();

    var timelineJson = json['timeline'] as List<dynamic>? ?? [];
    List<OrderTimelineEventModel> timelineList = timelineJson.map((i) => OrderTimelineEventModel.fromJson(i)).toList();

    return OrderDetailsModel(
      id: json['id'] as int? ?? 0,
      orderNumber: json['order_number'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['payment_status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String? ?? '',
      createdAt: json['created_at'] as String?,
      paidAt: json['paid_at'] as String?,
      deliveredAt: json['delivered_at'] as String?,
      cancelledAt: json['cancelled_at'] as String?,
      cancellationReason: json['cancellation_reason'] as String?,
      notes: json['notes'] as String?,
      
      deliveryAddress: OrderDeliveryAddressModel.fromJson(json['delivery_address'] ?? {}),
      items: itemsList,
      financial: OrderFinancialModel.fromJson(json['financial'] ?? {}),
      timeline: timelineList,
    );
  }
}

class OrderDeliveryAddressModel {
  final String name;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String pincode;

  OrderDeliveryAddressModel({
    required this.name,
    required this.phone,
    required this.line1,
    this.line2,
    required this.city,
    required this.state,
    required this.pincode,
  });

  factory OrderDeliveryAddressModel.fromJson(Map<String, dynamic> json) {
    return OrderDeliveryAddressModel(
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      line1: json['line1'] as String? ?? '',
      line2: json['line2'] as String?,
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
    );
  }
}

class OrderDetailItemModel {
  final int id;
  final int productId;
  final String productName;
  final String? variantName;
  final String? sku;
  final String? imageUrl;
  final int quantity;
  final double unitPriceRupees;
  final double totalRupees;
  final String? sellerName;

  OrderDetailItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    this.variantName,
    this.sku,
    this.imageUrl,
    required this.quantity,
    required this.unitPriceRupees,
    required this.totalRupees,
    this.sellerName,
  });

  factory OrderDetailItemModel.fromJson(Map<String, dynamic> json) {
    return OrderDetailItemModel(
      id: json['id'] as int? ?? 0,
      productId: json['product_id'] as int? ?? 0,
      productName: json['product_name'] as String? ?? '',
      variantName: json['variant_name'] as String?,
      sku: json['sku'] as String?,
      imageUrl: json['image_url'] as String?,
      quantity: json['quantity'] as int? ?? 0,
      unitPriceRupees: (json['unit_price_rupees'] as num?)?.toDouble() ?? 0.0,
      totalRupees: (json['total_rupees'] as num?)?.toDouble() ?? 0.0,
      sellerName: json['seller_name'] as String?,
    );
  }
}

class OrderFinancialModel {
  final double subtotalRupees;
  final double discountRupees;
  final double couponDiscountRupees;
  final double shippingRupees;
  final double codChargeRupees;
  final double taxRupees;
  final double totalRupees;

  OrderFinancialModel({
    required this.subtotalRupees,
    required this.discountRupees,
    required this.couponDiscountRupees,
    required this.shippingRupees,
    required this.codChargeRupees,
    required this.taxRupees,
    required this.totalRupees,
  });

  factory OrderFinancialModel.fromJson(Map<String, dynamic> json) {
    return OrderFinancialModel(
      subtotalRupees: (json['subtotal_rupees'] as num?)?.toDouble() ?? 0.0,
      discountRupees: (json['discount_rupees'] as num?)?.toDouble() ?? 0.0,
      couponDiscountRupees: (json['coupon_discount_rupees'] as num?)?.toDouble() ?? 0.0,
      shippingRupees: (json['shipping_rupees'] as num?)?.toDouble() ?? 0.0,
      codChargeRupees: (json['cod_charge_rupees'] as num?)?.toDouble() ?? 0.0,
      taxRupees: (json['tax_rupees'] as num?)?.toDouble() ?? 0.0,
      totalRupees: (json['total_rupees'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class OrderTimelineEventModel {
  final int step;
  final String event;
  final String label;
  final String? timestamp;
  final bool completed;
  final String color;

  OrderTimelineEventModel({
    required this.step,
    required this.event,
    required this.label,
    this.timestamp,
    required this.completed,
    required this.color,
  });

  factory OrderTimelineEventModel.fromJson(Map<String, dynamic> json) {
    return OrderTimelineEventModel(
      step: json['step'] as int? ?? 0,
      event: json['event'] as String? ?? '',
      label: json['label'] as String? ?? '',
      timestamp: json['timestamp'] as String?,
      completed: json['completed'] as bool? ?? false,
      color: json['color'] as String? ?? 'slate',
    );
  }
}
