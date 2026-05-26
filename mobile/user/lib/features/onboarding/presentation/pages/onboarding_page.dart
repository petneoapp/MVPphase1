import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/onboarding_bloc.dart';
import '../bloc/onboarding_event.dart';
import '../widgets/onboarding_bottom_card.dart';

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => OnboardingBloc(),
      child: const OnboardingView(),
    );
  }
}

class OnboardingView extends StatefulWidget {
  const OnboardingView({super.key});

  @override
  State<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<OnboardingView> {
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  context.read<OnboardingBloc>().add(PageChanged(index));
                },
                children: [
                  _buildImagePage('assets/one.png'),
                  _buildImagePage('assets/two.png'),
                  _buildImagePage('assets/three.png'),
                ],
              ),
            ),
            OnboardingBottomCard(pageController: _pageController),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePage(String imagePath) {
    return Image.asset(
      imagePath,
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
      width: double.infinity,
      errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.error)),
    );
  }
}
