import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/cart_model.dart';
import '../../data/models/checkout_model.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  
  CartResponseModel? _cartData;
  List<CheckoutAddress> _addresses = [];
  CheckoutAddress? _selectedAddress;
  
  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    _fetchCheckoutData();
  }

  Future<void> _fetchCheckoutData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Fetch cart
      final cartRes = await _apiClient.get('/shop/cart');
      if (cartRes['success'] == true && cartRes['data'] != null) {
        _cartData = CartResponseModel.fromJson(cartRes['data']);
        if (_cartData!.items.isEmpty) {
          throw Exception('Cart is empty');
        }
      } else {
        throw Exception(cartRes['message'] ?? 'Failed to load cart');
      }

      // Fetch addresses
      final addressRes = await _apiClient.get('/user/address/myAddresses');
      if (addressRes['success'] == true && addressRes['data'] != null) {
        final List<dynamic> dataList = addressRes['data'];
        _addresses = dataList.map((e) => CheckoutAddress.fromJson(e)).toList();
        
        if (_addresses.isNotEmpty) {
          _selectedAddress = _addresses.firstWhere((a) => a.isDefault, orElse: () => _addresses.first);
        }
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a delivery address')),
      );
      return;
    }

    setState(() {
      _isPlacingOrder = true;
    });

    try {
      final payload = {
        "delivery_address": _selectedAddress!.toCheckoutPayload(),
        "payment_method": "cod",
      };

      final response = await _apiClient.post('/shop/orders/checkout', body: payload);
      
      // If we reach here, either it succeeded or the API client threw an exception for 400+
      // In PetNeo backend, it returns the order data directly on success.
      final orderRes = OrderConfirmationResponse.fromJson(response);
      
      if (mounted) {
        context.go('/order-success', extra: orderRes);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isPlacingOrder = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Checkout failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Checkout', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        centerTitle: true,
      ),
      body: _buildBody(),
      bottomNavigationBar: (_cartData != null && !_isLoading) ? _buildBottomBar() : null,
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black87)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchCheckoutData,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_cartData == null) {
      return const SizedBox.shrink();
    }

    // Estimate COD extra charge based on common backend logic, or safely assume it's baked into total
    // But since backend returns updated total on checkout, we can display it clearly.
    // The cart API response doesn't give cod_charge explicitly, so we just show total.

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildSectionTitle('Delivery Address'),
        _buildAddressSection(),
        const SizedBox(height: 24),
        
        _buildSectionTitle('Order Summary (${_cartData!.itemCount} items)'),
        _buildItemsList(),
        const SizedBox(height: 24),
        
        _buildSectionTitle('Payment Method'),
        _buildPaymentSection(),
        const SizedBox(height: 24),
        
        _buildSectionTitle('Price Details'),
        _buildPriceBreakdown(),
        const SizedBox(height: 40), // spacer for bottom nav
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
      ),
    );
  }

  Widget _buildAddressSection() {
    if (_addresses.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
        child: Column(
          children: [
            const Text('No addresses found.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                // Navigate to add address, then refresh
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add an address in your profile first.')));
              },
              icon: const Icon(Icons.add, color: AppColors.primaryPink),
              label: const Text('Add Address', style: TextStyle(color: AppColors.primaryPink)),
            )
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        children: _addresses.map((addr) {
          return RadioListTile<int>(
            value: addr.id,
            groupValue: _selectedAddress?.id,
            onChanged: (val) {
              setState(() {
                _selectedAddress = addr;
              });
            },
            activeColor: AppColors.primaryPink,
            title: Text(addr.contactName ?? 'Home', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(addr.address, style: const TextStyle(fontSize: 13)),
                if (addr.contactNumber != null) ...[
                  const SizedBox(height: 4),
                  Text('Phone: ${addr.contactNumber}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ]
              ],
            ),
            isThreeLine: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildItemsList() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        children: _cartData!.items.map((item) {
          return ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: item.primaryImage != null
                  ? Image.network(item.primaryImage!, width: 48, height: 48, fit: BoxFit.cover, errorBuilder: (c,e,s) => const Icon(Icons.image, size: 48, color: Colors.grey))
                  : const Icon(Icons.image, size: 48, color: Colors.grey),
            ),
            title: Text(item.productName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            subtitle: Text('Qty: ${item.quantity}', style: const TextStyle(fontSize: 12)),
            trailing: Text('\u20B9 ${(item.subtotalPaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryPink)),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPaymentSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Row(
        children: [
          const Icon(Icons.money, color: Colors.green, size: 28),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cash on Delivery (COD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                SizedBox(height: 4),
                Text('Pay when your order arrives.', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          Icon(Icons.check_circle, color: AppColors.primaryPink, size: 24),
        ],
      ),
    );
  }

  Widget _buildPriceBreakdown() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        children: [
          _buildPriceRow('Subtotal', _cartData!.subtotalPaise),
          const SizedBox(height: 8),
          _buildPriceRow('Shipping', _cartData!.shippingPaise),
          if (_cartData!.discountPaise > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Discount', -_cartData!.discountPaise, isDiscount: true),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Grand Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
              Text('\u20B9 ${(_cartData!.totalPaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primaryPink)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, int paise, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
        Text(
          '${isDiscount ? "-" : ""}\u20B9 ${(paise.abs() / 100).toStringAsFixed(2)}', 
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDiscount ? Colors.green : Colors.black87)
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isPlacingOrder ? null : _placeOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryPink,
              disabledBackgroundColor: AppColors.primaryPink.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isPlacingOrder
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Place Order (COD)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ),
    );
  }
}
