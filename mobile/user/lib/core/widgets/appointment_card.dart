import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppointmentCard extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onTap;
  
  const AppointmentCard({
    super.key,
    required this.appointment,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final vet = appointment['vet'] as Map<String, dynamic>?;
    final pet = appointment['pet'] as Map<String, dynamic>?;
    final vetName = vet?['name'] as String? ?? 'Vet';
    final clinicName = vet?['clinic_name'] as String? ?? '';
    final vetProfile = vet?['profile'] as String?;
    final specialization = vet?['specialization'] as String? ?? '';
    final date = appointment['date'] as String? ?? '';
    final time = appointment['time'] as String? ?? '';
    final visitPurpose = appointment['visit_purpose'] as String? ?? 'Visit';
    final status = (appointment['status'] as String? ?? '').toLowerCase();
    final isCancelled = status == 'cancelled';
    final isEmergency = appointment['is_emergency'] == true;

    final petName = pet?['name'] as String? ?? '';
    final petProfile = pet?['profile_picture'] as String?;

    final labelColor = isEmergency ? AppColors.errorRed : AppColors.successGreen;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGrey),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.backgroundLightPurple,
                      backgroundImage: (vetProfile != null && vetProfile.isNotEmpty)
                          ? NetworkImage(vetProfile)
                          : const AssetImage('assets/profile.png') as ImageProvider,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dr. $vetName',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.black),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          if (clinicName.isNotEmpty) ...[
                            Text(
                              clinicName,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.black),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                          ],
                          Text(
                            specialization.isNotEmpty ? specialization : 'General Veterinarian',
                            style: const TextStyle(fontSize: 12, color: AppColors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryPink.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.primaryPink.withOpacity(0.2)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 13, color: AppColors.primaryPink),
                                    const SizedBox(width: 4),
                                    Text(
                                      date,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryPink),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.access_time, size: 13, color: AppColors.primaryPink),
                                    const SizedBox(width: 4),
                                    Text(
                                      time,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryPink),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: labelColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: labelColor.withOpacity(0.3)),
                      ),
                      child: Text(
                        visitPurpose,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: labelColor),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (petName.isNotEmpty) ...[
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.backgroundLightPurple,
                        backgroundImage: (petProfile != null && petProfile.isNotEmpty)
                            ? NetworkImage(petProfile)
                            : null,
                        child: (petProfile == null || petProfile.isEmpty)
                            ? const Icon(Icons.pets, size: 12, color: AppColors.primaryPink)
                            : null,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          petName,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.black),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                    const Spacer(),
                    SizedBox(
                      height: 34,
                      child: ElevatedButton(
                        onPressed: onTap,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryPink,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: const Text('View Details', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (isCancelled)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: const BoxDecoration(
                  color: AppColors.errorRed,
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(16), bottomRight: Radius.circular(8)),
                ),
                child: const Text('Cancelled', style: TextStyle(color: AppColors.white, fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }
}
