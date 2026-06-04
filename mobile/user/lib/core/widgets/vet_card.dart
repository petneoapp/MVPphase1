import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../network/image_helper.dart';

class VetCard extends StatelessWidget {
  final String id;
  final String name;
  final String experience;
  final String? profilePicture;
  final String availabilityStatus;
  final String address;
  final double avgRating;
  final int ratingCount;
  final List<dynamic> services;
  final bool isVideo;
  final VoidCallback onTap;

  const VetCard({
    super.key,
    required this.id,
    required this.name,
    this.experience = '',
    this.profilePicture,
    this.availabilityStatus = '',
    this.address = '',
    this.avgRating = 0.0,
    this.ratingCount = 0,
    this.services = const [],
    this.isVideo = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border.all(color: AppColors.borderGrey),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.backgroundLightPurple,
                  backgroundImage: (profilePicture != null && profilePicture!.isNotEmpty)
                      ? NetworkImage(ImageHelper.getSafeImageUrl(profilePicture!) ?? profilePicture!)
                      : const AssetImage('assets/profile.png') as ImageProvider,
                  onBackgroundImageError: (exception, stackTrace) {}, 
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.black),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                      if (experience.isNotEmpty)
                        Text(
                          '$experience years Exp',
                          style: const TextStyle(color: AppColors.grey, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            avgRating.toStringAsFixed(1),
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.black),
                          ),
                          Flexible(
                            child: Text(
                              ' ($ratingCount Ratings)',
                              style: const TextStyle(color: AppColors.grey, fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (availabilityStatus.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primaryPink.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      availabilityStatus,
                      style: const TextStyle(color: AppColors.primaryPink, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            if (address.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(Icons.location_on, color: AppColors.grey, size: 16),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      address,
                      style: const TextStyle(color: AppColors.grey, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                ],
              ),
            ],
            if (services.isNotEmpty) ...[
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: services
                    .map((s) {
                      final svcName = (s is Map<String, dynamic> ? s['name'] : s.toString()) ?? '';
                      return _buildTag(svcName);
                    })
                    .where((w) => true)
                    .toList(),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryPink,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(isVideo ? Icons.videocam : Icons.calendar_today, color: AppColors.white, size: 18),
                    const SizedBox(width: 8),
                    const Text('Book Appointment', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryPink.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(color: AppColors.primaryPink, fontSize: 10)),
    );
  }
}
