import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class AppointmentConfirmationPage extends StatelessWidget {
  const AppointmentConfirmationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Appointment Confirmation', style: TextStyle(color: AppColors.grey, fontSize: 18)),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(color: AppColors.primaryPink, shape: BoxShape.circle),
              child: const Icon(Icons.check, color: Colors.white, size: 64),
            ),
            const SizedBox(height: 24),
            const Text('Appointment Booked.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Dr. Charan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
            const SizedBox(height: 40),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  _buildDetailRow(Icons.personal_video_outlined, 'Clinic Visit'),
                  const Divider(height: 1),
                  _buildDetailRow(Icons.grid_view, 'Grooming'),
                  const Divider(height: 1),
                  _buildDetailRow(Icons.access_time, 'Tuesday, 20 Aug - 10:00 PM'),
                  const Divider(height: 1),
                  _buildDetailRow(Icons.location_on_outlined, 'Kphb Colony, Hyderabad, 500055'),
                ],
              ),
            ),
            const SizedBox(height: 40),
            const Text('Cancellation Policy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            const Text(
              '• Users can cancel a booking/service up to 24 hours before the scheduled time with no charge.\n• Cancellations made within 24 hours of the appointment or failure to show up will result in a cancellation fee (up to 100% of service cost).',
              style: TextStyle(color: AppColors.grey, fontSize: 12),
            ),
            const SizedBox(height: 60),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => context.go('/my-appointments'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryPink,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('View My Appointments', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Icon(icon, size: 28),
          const SizedBox(width: 16),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
