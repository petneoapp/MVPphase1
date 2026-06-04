class CheckoutAddress {
  final int id;
  final String address;
  final String? addressDetails;
  final String? contactName;
  final String? contactNumber;
  final String? locationName;
  final double latitude;
  final double longitude;
  final bool isDefault;

  CheckoutAddress({
    required this.id,
    required this.address,
    this.addressDetails,
    this.contactName,
    this.contactNumber,
    this.locationName,
    required this.latitude,
    required this.longitude,
    required this.isDefault,
  });

  factory CheckoutAddress.fromJson(Map<String, dynamic> json) {
    return CheckoutAddress(
      id: json['id'],
      address: json['address'],
      addressDetails: json['address_details'],
      contactName: json['contact_name'],
      contactNumber: json['contact_number'],
      locationName: json['location_name'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      isDefault: json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toCheckoutPayload() {
    return {
      "name": contactName ?? "Customer",
      "phone": contactNumber ?? "9999999999",
      "address_line1": address,
      "address_line2": addressDetails,
      "city": "Unknown", // Needs parsing or hardcode if simple text
      "state": "Unknown",
      "pincode": "000000",
    };
  }
}

class OrderConfirmationResponse {
  final int orderId;
  final String orderNumber;
  final String paymentMethod;
  final int totalPaise;
  final String status;

  OrderConfirmationResponse({
    required this.orderId,
    required this.orderNumber,
    required this.paymentMethod,
    required this.totalPaise,
    required this.status,
  });

  factory OrderConfirmationResponse.fromJson(Map<String, dynamic> json) {
    return OrderConfirmationResponse(
      orderId: json['order_id'],
      orderNumber: json['order_number'],
      paymentMethod: json['payment_method'],
      totalPaise: json['total_paise'],
      status: json['status'],
    );
  }
}
