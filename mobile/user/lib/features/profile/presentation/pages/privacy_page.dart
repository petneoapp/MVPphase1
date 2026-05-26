import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text('Privacy Policy', style: TextStyle(color: AppColors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Welcome to PetNeo'),
            _buildParagraph('These Terms and Conditions ("Terms") govern your use of the PetNeo mobile application and website...'),
            
            _buildSectionHeader('1. Acceptance of Terms'),
            _buildParagraph('By creating an account, accessing, or using the Platform, you confirm that you can form a binding contract...'),
            
            _buildSectionHeader('2. Services Offered'),
            _buildBulletPoint('Veterinary telehealth consultations'),
            _buildBulletPoint('Booking services for in-clinic appointments, grooming, and training'),
            _buildBulletPoint('An e-commerce marketplace for pet products'),
            _buildBulletPoint('Digital storage for pet health records'),
            
            const SizedBox(height: 8),
            _buildDisclaimer('Important Disclaimer: PetNeo is not a veterinary service provider...'),
            
            const SizedBox(height: 16),
            _buildSectionHeader('3. User Accounts and Responsibilities'),
            _buildBulletPoint('Eligibility: You must be at least 18 years old'),
            _buildBulletPoint('Account Security: Maintain confidentiality of your password'),
            _buildBulletPoint('Accurate Information: Provide current and correct info'),
            _buildBulletPoint('User Conduct: No unlawful or harmful activity'),
            
            const SizedBox(height: 20),
            _buildSectionHeader('13. Contact Information'),
            _buildParagraph('If you have any questions about these Terms, please contact us at: support@petneo.com'),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF00695C),
        ),
      ),
    );
  }

  Widget _buildParagraph(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          height: 1.6,
          color: Color(0xFF333333),
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6, right: 8),
            child: Icon(Icons.circle, size: 6, color: AppColors.primaryPink),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Color(0xFF333333),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDisclaimer(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.bold,
          color: Colors.amber.shade900,
          height: 1.4,
        ),
      ),
    );
  }
}
