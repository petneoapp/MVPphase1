import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class GroomingPage extends StatelessWidget {
  const GroomingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      body: Center(
        child: Text('Grooming (Coming Soon)', style: TextStyle(color: AppColors.black, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
