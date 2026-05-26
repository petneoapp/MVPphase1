import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';

class GetDirectionsPage extends StatelessWidget {
  const GetDirectionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: const PetneoAppBar(title: 'Get Directions'),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Get Directions to Clinic / Track Vet', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  height: 200,
                  width: double.infinity,
                  color: Colors.blueGrey.shade700,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Center(child: Icon(Icons.map, color: Colors.white24, size: 80)),
                      Positioned(
                        top: 40,
                        right: 60,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: AppColors.primaryPink, shape: BoxShape.circle),
                          child: const Icon(Icons.local_hospital, color: Colors.white, size: 18),
                        ),
                      ),
                      Positioned(
                        bottom: 60,
                        left: 80,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                          child: const Icon(Icons.location_on, color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Contact the Clinic', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(radius: 28, backgroundImage: AssetImage('assets/profile.png')),
                        const SizedBox(width: 12),
                        const Text('Neo Care Clinic', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      children: const [
                        Text('Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        SizedBox(width: 10),
                        Icon(Icons.circle, color: Colors.green, size: 10),
                        SizedBox(width: 4),
                        Text('Active', style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('Last active: 02:30AM, August 21, 2025', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 42,
                            child: ElevatedButton.icon(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryPink,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: const Icon(Icons.email_outlined, color: Colors.white, size: 18),
                              label: const Text('Send a Message', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: SizedBox(
                            height: 42,
                            child: ElevatedButton.icon(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryPink,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: const Icon(Icons.phone, color: Colors.white, size: 18),
                              label: const Text('Make a Call', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
