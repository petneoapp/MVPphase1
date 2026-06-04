import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class MarketplacePage extends StatelessWidget {
  const MarketplacePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      body: Center(
        child: Text('Marketplace (Coming Soon)', style: TextStyle(color: AppColors.black, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
