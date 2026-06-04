import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';

class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: AppBar(
        title: const Text('Shop', style: TextStyle(color: Colors.black)),
        backgroundColor: AppColors.backgroundLightPurple,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black),
            onPressed: () => context.push('/cart'),
          )
        ],
      ),
      body: const Center(
        child: Text('Shop (Coming Soon)', style: TextStyle(color: AppColors.black, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
