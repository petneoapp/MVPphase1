import 'package:flutter/material.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/order_model.dart';


class OrderDetailsPage extends StatefulWidget {
  final String orderId;

  const OrderDetailsPage({super.key, required this.orderId});

  @override
  State<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends State<OrderDetailsPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  OrderDetailsModel? _order;

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
  }

  Future<void> _fetchOrderDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.get('/shop/orders/my-orders/${widget.orderId}');
      setState(() {
        _order = OrderDetailsModel.fromJson(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final d = DateTime.parse(isoDate).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final hour = d.hour == 0 ? 12 : (d.hour > 12 ? d.hour - 12 : d.hour);
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]}, $hour:$min $ampm';
    } catch (e) {
      return isoDate;
    }
  }

  Color _parseColor(String colorStr) {
    switch (colorStr) {
      case 'blue': return Colors.blue;
      case 'indigo': return Colors.indigo;
      case 'violet': return Colors.purple;
      case 'amber': return Colors.amber;
      case 'orange': return Colors.orange;
      case 'deepOrange': return Colors.deepOrange;
      case 'green': return Colors.green;
      case 'red': return Colors.red;
      case 'slate': return Colors.blueGrey;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(_order != null ? _order!.orderNumber : 'Order Details', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }

    if (_errorMessage != null || _order == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_errorMessage ?? 'Order not found', textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchOrderDetails,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchOrderDetails,
      color: AppColors.primaryPink,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildOrderHeader(),
          const SizedBox(height: 16),
          _buildTimeline(),
          const SizedBox(height: 16),
          _buildItemsSection(),
          const SizedBox(height: 16),
          _buildDeliverySection(),
          const SizedBox(height: 16),
          _buildPaymentSection(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildOrderHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Order ${_order!.orderNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 4),
          Text('Placed on ${_formatDate(_order!.createdAt)}', style: const TextStyle(color: Colors.grey, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Track Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 20),
          ..._order!.timeline.map((event) {
            final isLast = event == _order!.timeline.last;
            final color = _parseColor(event.color);
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: event.completed ? color : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: event.completed ? color : Colors.grey[300]!, width: 2),
                      ),
                      child: event.completed ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                    ),
                    if (!isLast)
                      Container(
                        width: 2,
                        height: 40,
                        color: event.completed ? color : Colors.grey[300],
                      )
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.label,
                        style: TextStyle(
                          fontWeight: event.completed ? FontWeight.bold : FontWeight.normal,
                          color: event.completed ? Colors.black87 : Colors.grey,
                        ),
                      ),
                      if (event.timestamp != null) ...[
                        const SizedBox(height: 4),
                        Text(_formatDate(event.timestamp), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                      const SizedBox(height: 24), // spacer for next item
                    ],
                  ),
                )
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildItemsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Items (${_order!.items.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          ..._order!.items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: item.imageUrl != null
                          ? Image.network(item.imageUrl!, fit: BoxFit.cover, errorBuilder: (c,e,s) => const Icon(Icons.image, color: Colors.grey))
                          : const Icon(Icons.image, color: Colors.grey),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        if (item.variantName != null) ...[
                          const SizedBox(height: 4),
                          Text(item.variantName!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Qty: ${item.quantity}', style: const TextStyle(fontSize: 13)),
                            Text('\u20B9 ${item.totalRupees.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryPink)),
                          ],
                        )
                      ],
                    ),
                  )
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildDeliverySection() {
    final addr = _order!.deliveryAddress;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Delivery Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Text(addr.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 4),
          Text('${addr.line1}${addr.line2 != null ? ", " + addr.line2! : ""}'),
          Text('${addr.city}, ${addr.state} - ${addr.pincode}'),
          const SizedBox(height: 8),
          Text('Phone: ${addr.phone}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
          if (_order!.notes != null && _order!.notes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Delivery Notes:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
            Text(_order!.notes!, style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
          ]
        ],
      ),
    );
  }

  Widget _buildPaymentSection() {
    final fin = _order!.financial;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Payment Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Method'),
              Text(_order!.paymentMethod.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Status'),
              Text(_order!.paymentStatus.toUpperCase(), style: TextStyle(fontWeight: FontWeight.bold, color: _order!.paymentStatus == 'paid' ? Colors.green : Colors.orange)),
            ],
          ),
          
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1)),
          
          _buildPriceRow('Subtotal', fin.subtotalRupees),
          const SizedBox(height: 8),
          _buildPriceRow('Shipping', fin.shippingRupees),
          if (fin.codChargeRupees > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('COD Charge', fin.codChargeRupees),
          ],
          if (fin.discountRupees > 0 || fin.couponDiscountRupees > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow('Discount', -(fin.discountRupees + fin.couponDiscountRupees), isDiscount: true),
          ],
          
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1)),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Grand Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text('\u20B9 ${fin.totalRupees.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primaryPink)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
        Text(
          '${isDiscount ? "-" : ""}\u20B9 ${amount.abs().toStringAsFixed(2)}', 
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDiscount ? Colors.green : Colors.black87)
        ),
      ],
    );
  }
}
