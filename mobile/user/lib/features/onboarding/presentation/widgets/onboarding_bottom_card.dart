import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/onboarding_bloc.dart';
import '../bloc/onboarding_event.dart';

class OnboardingBottomCard extends StatelessWidget {
  final PageController pageController;

  const OnboardingBottomCard({super.key, required this.pageController});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (index) => _buildIndicator(context, index)),
          ),
          const SizedBox(height: 32),
          
          // Title
          const Text(
            '"Welcome to PetNeo -\nConnecting Pets & Vets"',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          
          // Subtitle
          const Text(
            'One-stop app for pet care,\nhealth, and happiness.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF6B6B6B),
            ),
          ),
          const SizedBox(height: 32),
          
          // Next Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                final state = context.read<OnboardingBloc>().state;
                if (state.pageIndex < 2) {
                  pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                } else {
                  // Reached end, handle completion (e.g. go to Home/Login)
                  // For now, let's just print or reset
                  context.go('/welcome');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryPink,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Next',
                style: TextStyle(fontSize: 16, color: AppColors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Skip Button
          TextButton(
            onPressed: () {
              context.go('/welcome');
            },
            child: const Text(
              'Skip',
              style: TextStyle(fontSize: 16, color: AppColors.black, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIndicator(BuildContext context, int index) {
    final currentPageIndex = context.watch<OnboardingBloc>().state.pageIndex;
    final isActive = currentPageIndex == index;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 6),
      child: Icon(
        Icons.pets,
        color: isActive ? AppColors.primaryPink : AppColors.primaryPink.withOpacity(0.3),
        size: isActive ? 22 : 18,
      ),
    );
  }
}
