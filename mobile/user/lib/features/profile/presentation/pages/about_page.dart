import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

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
        title: const Text('About PetNeo', style: TextStyle(color: AppColors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Our Mission'),
            _buildParagraph('At PetNeo, our mission is to revolutionize the pet care experience in India...'),
            
            const SizedBox(height: 12),
            _buildSectionHeader('Our Vision'),
            _buildParagraph("Our vision is to be India's most trusted and indispensable platform for pet wellness..."),
            
            const SizedBox(height: 12),
            _buildSectionHeader('What We Do'),
            _buildBulletPoint('Expert Veterinary Consultations:', ' Instantly connect with qualified vets...'),
            _buildBulletPoint('Clinic & Service Bookings:', ' Find, compare, and book appointments...'),
            _buildBulletPoint('Curated Pet Store:', ' Shop from a wide range of products...'),
            _buildBulletPoint('Digital Health Records:', ' Maintain a secure profile for your pet...'),
            _buildBulletPoint('Community & Resources:', ' Access articles, guides, and connect...'),
            
            const SizedBox(height: 16),
            _buildSectionHeader('Why Choose PetNeo?'),
            _buildBulletPoint('', 'Verified Professionals'),
            _buildBulletPoint('', 'Unmatched Convenience'),
            _buildBulletPoint('', 'Commitment to Quality'),
            _buildBulletPoint('', 'Built for India'),
            
            const SizedBox(height: 30),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryPink.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'Join the PetNeo family and experience a smarter, simpler, and more joyful way to care for your pet.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.primaryPink,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 12),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Color(0xFF00695C),
        ),
      ),
    );
  }

  Widget _buildParagraph(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 15,
          height: 1.6,
          color: Color(0xFF333333),
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String boldPart, String normalPart) {
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
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 15, height: 1.5, color: Color(0xFF333333)),
                children: [
                  if (boldPart.isNotEmpty)
                    TextSpan(text: boldPart, style: const TextStyle(fontWeight: FontWeight.bold)),
                  TextSpan(text: normalPart),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
