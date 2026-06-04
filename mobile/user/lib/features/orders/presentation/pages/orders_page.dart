import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/order_model.dart';


class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final ApiClient _apiClient = ApiClient();
  final ScrollController _scrollController = ScrollController();
  
  List<OrderSummaryModel> _orders = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  
  int _currentPage = 1;
  int _totalPages = 1;
  String _currentStatusFilter = ''; // empty means all

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _currentPage < _totalPages) {
        _fetchOrders(page: _currentPage + 1, append: true);
      }
    }
  }

  Future<void> _fetchOrders({int page = 1, bool append = false}) async {
    if (append) {
      setState(() => _isLoadingMore = true);
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      String path = '/shop/orders/my-orders?page=$page&per_page=10';
      if (_currentStatusFilter.isNotEmpty) {
        path += '&status=$_currentStatusFilter';
      }

      final response = await _apiClient.get(path);
      final listResponse = OrderListResponse.fromJson(response);

      setState(() {
        if (append) {
          _orders.addAll(listResponse.orders);
        } else {
          _orders = listResponse.orders;
        }
        _currentPage = listResponse.page;
        _totalPages = listResponse.pages;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  void _changeFilter(String status) {
    setState(() {
      _currentStatusFilter = status;
    });
    _fetchOrders(page: 1);
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return 'Unknown date';
    try {
      final d = DateTime.parse(isoDate).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final hour = d.hour == 0 ? 12 : (d.hour > 12 ? d.hour - 12 : d.hour);
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}, $hour:$min $ampm';
    } catch (e) {
      return isoDate;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.blue;
      case 'confirmed':
        return Colors.indigo;
      case 'packed':
        return Colors.purple;
      case 'shipped':
        return Colors.orange;
      case 'out_for_delivery':
        return Colors.deepOrange;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'refunded':
        return Colors.grey;
      case 'return_requested':
        return Colors.amber;
      default:
        return Colors.blueGrey;
    }
  }

  String _formatStatusLabel(String status) {
    if (status.isEmpty) return 'Unknown';
    return status.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('My Orders', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    final filters = [
      {'label': 'All', 'value': ''},
      {'label': 'Pending', 'value': 'pending'},
      {'label': 'Confirmed', 'value': 'confirmed'},
      {'label': 'Shipped', 'value': 'shipped'},
      {'label': 'Delivered', 'value': 'delivered'},
      {'label': 'Cancelled', 'value': 'cancelled'},
    ];

    return Container(
      height: 60,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final f = filters[index];
          final isSelected = _currentStatusFilter == f['value'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f['label']!),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) _changeFilter(f['value']!);
              },
              selectedColor: AppColors.primaryPink.withValues(alpha: 0.1),
              labelStyle: TextStyle(
                color: isSelected ? AppColors.primaryPink : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: isSelected ? AppColors.primaryPink : Colors.grey[300]!),
              ),
            ),
          );
        },
      ),
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
            Text(_errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchOrders(page: 1),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No orders found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 8),
            Text(_currentStatusFilter.isEmpty ? 'You haven\'t placed any orders yet.' : 'No orders match this status.', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/shop'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryPink,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              child: const Text('Start Shopping', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchOrders(page: 1),
      color: AppColors.primaryPink,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length + (_isLoadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          if (index == _orders.length) {
            return const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(color: AppColors.primaryPink)));
          }
          final order = _orders[index];
          return _buildOrderCard(order);
        },
      ),
    );
  }

  Widget _buildOrderCard(OrderSummaryModel order) {
    final statusColor = _getStatusColor(order.status);
    
    // Pick the first item image for the thumbnail
    String? thumbnailUrl;
    if (order.itemsSummary.isNotEmpty) {
      thumbnailUrl = order.itemsSummary.first.imageUrl;
    }

    return InkWell(
      onTap: () {
        context.push('/order-details?id=${order.id}');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(order.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    _formatStatusLabel(order.status),
                    style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                )
              ],
            ),
            const SizedBox(height: 8),
            Text('Placed on ${_formatDate(order.createdAt)}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            
            const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1)),
            
            Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: thumbnailUrl != null 
                        ? Image.network(thumbnailUrl, fit: BoxFit.cover, errorBuilder: (c,e,s) => const Icon(Icons.image, color: Colors.grey))
                        : const Icon(Icons.shopping_bag, color: Colors.grey),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.itemsSummary.isNotEmpty ? order.itemsSummary.first.productName : 'Items',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (order.itemsCount > 1) ...[
                        const SizedBox(height: 4),
                        Text('+ ${order.itemsCount - 1} more item(s)', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                      ]
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Total', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text('\u20B9 ${order.totalRupees.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.primaryPink)),
                  ],
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
