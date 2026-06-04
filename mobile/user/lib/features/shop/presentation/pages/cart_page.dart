import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/cart_model.dart';

class CartPage extends StatefulWidget {
  const CartPage({super.key});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  CartResponseModel? _cartData;
  
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _fetchCart();
  }
  
  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchCart() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _apiClient.get('/shop/cart');
      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _cartData = CartResponseModel.fromJson(response['data']);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message'] ?? 'Failed to load cart';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _updateQuantity(int itemId, int newQuantity) async {
    if (newQuantity < 1) return;
    
    // Optimistic update
    setState(() {
      if (_cartData != null) {
        final itemIndex = _cartData!.items.indexWhere((i) => i.id == itemId);
        if (itemIndex >= 0) {
          final item = _cartData!.items[itemIndex];
          // Roughly estimate subtotal
          final unitPrice = item.quantity > 0 ? (item.subtotalPaise / item.quantity).round() : 0;
          _cartData!.items[itemIndex] = CartItemModel(
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: newQuantity,
            productName: item.productName,
            brand: item.brand,
            primaryImage: item.primaryImage,
            pricePaise: item.pricePaise,
            subtotalPaise: unitPrice * newQuantity,
            sellerName: item.sellerName,
          );
        }
      }
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      try {
        await _apiClient.put('/shop/cart/items/$itemId', body: {'quantity': newQuantity});
        _fetchCart(); // Fetch true totals from server
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update quantity: $e')));
        _fetchCart(); // Revert on failure
      }
    });
  }

  Future<void> _removeItem(int itemId) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Are you sure you want to remove this item from your cart?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      try {
        await _apiClient.delete('/shop/cart/items/$itemId');
        _fetchCart();
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to remove item: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('My Cart', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        centerTitle: true,
      ),
      body: _buildBody(),
      bottomNavigationBar: _cartData != null && _cartData!.items.isNotEmpty ? _buildBottomBar() : null,
    );
  }

  Widget _buildBody() {
    if (_isLoading && _cartData == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }

    if (_errorMessage != null && _cartData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black87)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchCart,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_cartData == null || _cartData!.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 8),
            const Text('Looks like you haven\'t added\nanything to your cart yet', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/shop'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryPink,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              child: const Text('Start Shopping', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            )
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchCart,
      color: AppColors.primaryPink,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _cartData!.items.length,
        separatorBuilder: (context, index) => const Divider(height: 32),
        itemBuilder: (context, index) {
          final item = _cartData!.items[index];
          return _buildCartItem(item);
        },
      ),
    );
  }

  Widget _buildCartItem(CartItemModel item) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Product Image
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: item.primaryImage != null && item.primaryImage!.isNotEmpty
                ? Image.network(item.primaryImage!, fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.image_not_supported, color: Colors.grey))
                : const Icon(Icons.shopping_bag_outlined, color: Colors.grey),
          ),
        ),
        const SizedBox(width: 16),
        
        // Product Details
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87), maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Text('Sold by: ${item.sellerName}', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              const SizedBox(height: 8),
              Text('\u20B9 ${(item.pricePaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.primaryPink)),
              
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Quantity Controls
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => _updateQuantity(item.id, item.quantity - 1),
                          child: const Padding(padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Icon(Icons.remove, size: 16)),
                        ),
                        Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        InkWell(
                          onTap: () => _updateQuantity(item.id, item.quantity + 1),
                          child: const Padding(padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Icon(Icons.add, size: 16)),
                        ),
                      ],
                    ),
                  ),
                  
                  // Delete Action
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () => _removeItem(item.id),
                    constraints: const BoxConstraints(),
                    padding: EdgeInsets.zero,
                  )
                ],
              )
            ],
          ),
        )
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subtotal', style: TextStyle(fontSize: 16, color: Colors.black54)),
                Text('\u20B9 ${(_cartData!.totalPaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/checkout');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryPink,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Proceed to Checkout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            )
          ],
        ),
      ),
    );
  }
}
